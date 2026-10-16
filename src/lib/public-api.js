const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const cacheKey = Symbol.for("awaken.public-api.cache");
const flightKey = Symbol.for("awaken.public-api.inflight");
const queueKey = Symbol.for("awaken.public-api.queue");
const resultCache = globalThis[cacheKey] ||= new Map();
const inFlight = globalThis[flightKey] ||= new Map();
const requestQueue = globalThis[queueKey] ||= { active: 0, waiting: [] };

async function withRequestSlot(run) {
  if (requestQueue.active >= 3) await new Promise((resolve) => requestQueue.waiting.push(resolve));
  requestQueue.active += 1;
  try { return await run(); }
  finally {
    requestQueue.active -= 1;
    requestQueue.waiting.shift()?.();
  }
}

export async function publicApi(path, params = {}) {
  if (!API_BASE_URL) return { data: null, error: "API URL is not configured.", status: 0 };

  const url = new URL(`${API_BASE_URL}/public/${path.replace(/^\/+/, "")}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }

  const key = url.toString();
  const cached = resultCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  if (inFlight.has(key)) return inFlight.get(key);

  const request = withRequestSlot(async () => {
    try {
      const response = await fetch(url, { next: { revalidate: 60 }, signal: AbortSignal.timeout(10000) });
      const result = await response.json();
      const value = !response.ok || result?.success !== true
        ? { data: null, message: result?.message || "", error: result?.message || "This information is unavailable right now.", status: response.ok ? 502 : response.status }
        : { data: result.data, pagination: result.pagination, message: result.message || "", error: null, status: response.status };
      const ttl = value.error ? (response.status === 429 ? 10000 : 3000) : 60000;
      resultCache.set(key, { value, expiresAt: Date.now() + ttl });
      if (resultCache.size > 500) {
        for (const [cacheEntry, cacheValue] of resultCache) if (cacheValue.expiresAt <= Date.now()) resultCache.delete(cacheEntry);
        if (resultCache.size > 500) resultCache.delete(resultCache.keys().next().value);
      }
      return value;
    } catch {
      const value = { data: null, error: "We could not load this information right now. Please try again later.", status: 0 };
      resultCache.set(key, { value, expiresAt: Date.now() + 3000 });
      return value;
    }
  });
  inFlight.set(key, request);
  try { return await request; }
  finally { inFlight.delete(key); }
}

export function validPage(value) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export async function allPublicItems(path) {
  const first = await publicApi(path, { page: 1, limit: 20 });
  if (first.error || !Array.isArray(first.data)) return first;
  const pages = Math.max(1, Number(first.pagination?.pages) || 1);
  const items = [...first.data];
  for (let page = 2; page <= pages; page += 5) {
    const batch = await Promise.all(
      Array.from({ length: Math.min(5, pages - page + 1) }, (_, index) =>
        publicApi(path, { page: page + index, limit: 20 })
      )
    );
    const failed = batch.find((result) => result.error || !Array.isArray(result.data));
    if (failed) return failed.error ? failed : { data: null, error: "The catalogue response was incomplete.", status: 0 };
    items.push(...batch.flatMap((result) => result.data));
  }
  return { ...first, data: items };
}

export function readableDate(value) {
  if (!value || Number.isNaN(Date.parse(value))) return null;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}
