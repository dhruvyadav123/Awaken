
const API_BASE_URL = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api.awakenwithmeheck.com/api/v1"
)
  .trim()
  .replace(/\/+$/, "");

const PUBLIC_DATA_REVALIDATE_SECONDS = 1;

const cacheKey = Symbol.for("awaken.public-api.cache");
const flightKey = Symbol.for("awaken.public-api.inflight");
const queueKey = Symbol.for("awaken.public-api.queue");

const resultCache =
  (globalThis[cacheKey] ||= new Map());

const inFlight =
  (globalThis[flightKey] ||= new Map());

const requestQueue =
  (globalThis[queueKey] ||= {
    active: 0,
    waiting: [],
  });

async function withRequestSlot(run) {
  if (requestQueue.active >= 3) {
    await new Promise((resolve) => {
      requestQueue.waiting.push(resolve);
    });
  }

  requestQueue.active += 1;

  try {
    return await run();
  } finally {
    requestQueue.active -= 1;

    const next = requestQueue.waiting.shift();

    if (next) next();
  }
}

export async function publicApi(
  path,
  params = {},
  options = {}
) {
  if (!API_BASE_URL) {
    return {
      data: null,
      error: "API URL is not configured.",
      status: 0,
    };
  }

  const fresh = options.cache === "no-store";

  let url;

  try {
    const cleanPath = String(path || "").replace(/^\/+/, "");

    url = new URL(
      `${API_BASE_URL}/public/${cleanPath}`
    );
  } catch {
    return {
      data: null,
      error: "Invalid public API URL.",
      status: 0,
    };
  }

  for (const [key, value] of Object.entries(params || {})) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      url.searchParams.set(key, String(value));
    }
  }

  const key = url.toString();

  const requestKey = `${
    fresh ? "no-store:" : "cached:"
  }${key}`;

  if (!fresh) {
    const cached = resultCache.get(key);

    if (
      cached &&
      cached.expiresAt > Date.now()
    ) {
      return cached.value;
    }
  }

  if (inFlight.has(requestKey)) {
    return inFlight.get(requestKey);
  }

  const request = withRequestSlot(async () => {
    let value;
    let ttl = PUBLIC_DATA_REVALIDATE_SECONDS * 1000;

    try {
      const response = await fetch(url, {
        ...(fresh
          ? { cache: "no-store" }
          : {
              next: {
                revalidate:
                  PUBLIC_DATA_REVALIDATE_SECONDS,
              },
            }),
        signal: AbortSignal.timeout(10000),
      });

      let result;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok || result?.success !== true) {
        value = {
          data: null,
          message: result?.message || "",
          error:
            result?.message ||
            `Public API request failed (${response.status}).`,
          status: response.status,
        };
      } else {
        value = {
          data: result.data,
          pagination: result.pagination,
          message: result.message || "",
          error: null,
          status: response.status,
        };
      }

      ttl = value.error
        ? response.status === 429
          ? 10000
          : 3000
        : PUBLIC_DATA_REVALIDATE_SECONDS * 1000;
    } catch (error) {
      value = {
        data: null,
        error:
          "We could not load this information right now. Please try again later.",
        status: 0,
      };

      ttl = 3000;
    }

    if (!fresh) {
      resultCache.set(key, {
        value,
        expiresAt: Date.now() + ttl,
      });

      if (resultCache.size > 500) {
        for (const [
          cacheEntry,
          cacheValue,
        ] of resultCache) {
          if (cacheValue.expiresAt <= Date.now()) {
            resultCache.delete(cacheEntry);
          }
        }

        if (resultCache.size > 500) {
          const firstKey =
            resultCache.keys().next().value;

          resultCache.delete(firstKey);
        }
      }
    }

    return value;
  });

  inFlight.set(requestKey, request);

  try {
    return await request;
  } finally {
    inFlight.delete(requestKey);
  }
}

export function validPage(value) {
  const page = Number(value);

  return Number.isSafeInteger(page) && page > 0
    ? page
    : 1;
}

export async function allPublicItems(
  path,
  options = {}
) {
  const first = await publicApi(
    path,
    {
      page: 1,
      limit: 20,
    },
    options
  );

  if (first.error || !Array.isArray(first.data)) {
    return first;
  }

  const pages = Math.max(
    1,
    Number(
      first.pagination?.pages ??
      first.pagination?.totalPages ??
      1
    ) || 1
  );

  const items = [...first.data];

  for (let page = 2; page <= pages; page += 5) {
    const count = Math.min(
      5,
      pages - page + 1
    );

    const batch = await Promise.all(
      Array.from(
        { length: count },
        (_, index) =>
          publicApi(
            path,
            {
              page: page + index,
              limit: 20,
            },
            options
          )
      )
    );

    const failed = batch.find(
      (result) =>
        result.error ||
        !Array.isArray(result.data)
    );

    if (failed) {
      return failed.error
        ? failed
        : {
            data: null,
            error:
              "The catalogue response was incomplete.",
            status: 0,
          };
    }

    items.push(
      ...batch.flatMap((result) => result.data)
    );
  }

  return {
    ...first,
    data: items,
  };
}

export function readableDate(value) {
  if (
    !value ||
    Number.isNaN(Date.parse(value))
  ) {
    return null;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
