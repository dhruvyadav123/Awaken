export function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )awm-csrf-token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

let refreshing;

// Upload progress measures bytes sent to the authenticated proxy. Backend
// processing is complete only when the successful response arrives.
function multipartRequest(url, options, headers) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const signal = options.signal;
    const abort = () => xhr.abort();
    const clean = () => signal?.removeEventListener("abort", abort);
    if (signal?.aborted) { reject(new DOMException("Upload cancelled.", "AbortError")); return; }
    xhr.open(options.method || "POST", url);
    xhr.timeout = 120000;
    xhr.withCredentials = true;
    headers.forEach((value, key) => xhr.setRequestHeader(key, value));
    xhr.upload.onprogress = event => options.onUploadProgress?.({ loaded: event.loaded, total: event.lengthComputable ? event.total : null });
    xhr.onload = () => {
      clean();
      const responseHeaders = new Headers();
      for (const line of xhr.getAllResponseHeaders().trim().split(/[\r\n]+/)) {
        const colon = line.indexOf(":");
        if (colon > 0) responseHeaders.append(line.slice(0, colon).trim(), line.slice(colon + 1).trim());
      }
      resolve(new Response(xhr.status === 204 ? null : xhr.responseText, { status: xhr.status, headers: responseHeaders }));
    };
    xhr.onerror = () => { clean(); reject(new Error("The upload service could not be reached. Please try again.")); };
    xhr.ontimeout = () => { clean(); reject(new Error("Upload timed out. Refresh the library before retrying.")); };
    xhr.onabort = () => { clean(); reject(new DOMException("Upload cancelled.", "AbortError")); };
    signal?.addEventListener("abort", abort, { once: true });
    xhr.send(options.body);
  });
}

export async function accountFetch(path, options = {}, retried = false) {
  const method = options.method || "GET";
  const headers = new Headers(options.headers || {});
  if (method !== "GET") headers.set("x-csrf-token", getCsrfToken());
  if (options.body !== undefined && !(options.body instanceof FormData)) headers.set("content-type", "application/json");
  const url = `/api/account/${path.replace(/^\/+/, "")}`;
  const response = options.body instanceof FormData && options.onUploadProgress
    ? await multipartRequest(url, options, headers)
    : await fetch(url, {
    ...options,
    method,
    headers,
    credentials: "same-origin",
    cache: "no-store",
    signal: options.signal || AbortSignal.timeout(options.body instanceof FormData || options.responseType === "blob" ? 120000 : 30000),
    ...(options.body !== undefined && typeof options.body !== "string" && !(options.body instanceof FormData) ? { body: JSON.stringify(options.body) } : {}),
  });
  if (response.status === 401 && !retried) {
    refreshing ||= fetch("/api/auth/refresh", { method: "POST", headers: { "x-csrf-token": getCsrfToken() }, signal: AbortSignal.timeout(20000) }).finally(() => { refreshing = null; });
    const renewed = await refreshing;
    if (renewed.ok) return accountFetch(path, options, true);
  }
  if (response.status === 204) return { success: true, data: null };
  if (options.responseType === "blob" && response.ok && !response.headers.get("content-type")?.includes("json")) return response.blob();
  const result = response.headers.get("content-type")?.includes("application/json") ? await response.json().catch(() => null) : null;
  if (!response.ok || result?.success !== true) {
    const message = typeof result?.error === "string" ? result.error : typeof result?.message === "string" ? result.message : response.status === 401 ? "Please sign in again." : response.ok ? "The account service returned an incomplete response. Please try again." : "We could not complete that request.";
    const issues = Array.isArray(result?.errors) ? result.errors.map(issue => typeof issue === "string" ? issue : issue?.message).filter(value => typeof value === "string").join(" ") : "";
    const error = new Error(issues ? `${message} ${issues}` : message);
    error.status = response.ok ? 502 : response.status;
    error.code = result?.code;
    throw error;
  }
  return result;
}
