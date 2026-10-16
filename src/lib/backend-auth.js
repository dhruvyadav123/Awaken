import { randomUUID } from "node:crypto";

export const API_BASE_URL = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
export const ACCESS_COOKIE = "awm-access-token";
export const CSRF_COOKIE = "awm-csrf-token";
export const REFRESH_COOKIE = "awm-refresh-cookie";

export async function backendRequest(path, { method = "GET", body, token, csrfToken, refreshCookie } = {}) {
  if (!API_BASE_URL) return { ok: false, status: 503, result: { message: "API URL is not configured." } };
  try {
    const response = await fetch(`${API_BASE_URL}/${path.replace(/^\/+/, "")}`, {
      method,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
      headers: {
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        ...(refreshCookie ? { cookie: refreshCookie } : {}),
        accept: "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const result = await response.json().catch(() => ({}));
    return { ok: response.ok && result?.success === true, status: response.ok && result?.success !== true ? 502 : response.status, result: result || {}, refreshCookie: response.headers.getSetCookie?.().map((value) => value.split(";")[0]).join("; ") || response.headers.get("set-cookie")?.split(";")[0] || "" };
  } catch {
    return { ok: false, status: 502, result: { message: "The Awaken service could not be reached. Please try again." } };
  }
}

export function setAuthCookies(response, data, refreshCookie = "") {
  const token = data?.accessToken;
  if (typeof token !== "string" || !token) return response;
  const secure = process.env.NODE_ENV === "production";
  const common = `; Path=/; SameSite=Strict; Max-Age=${Math.min(86400, Math.max(1, Number(data.expiresIn) || 900))}${secure ? "; Secure" : ""}`;
  response.headers.append("set-cookie", `${ACCESS_COOKIE}=${encodeURIComponent(token)}; HttpOnly${common}`);
  response.headers.append("set-cookie", `${CSRF_COOKIE}=${encodeURIComponent(data.csrfToken || randomUUID())}; Path=/; SameSite=Strict; Max-Age=2592000${secure ? "; Secure" : ""}`);
  if (refreshCookie) response.headers.append("set-cookie", `${REFRESH_COOKIE}=${encodeURIComponent(refreshCookie)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000${secure ? "; Secure" : ""}`);
  return response;
}

export function clearAuthCookies(response) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.headers.append("set-cookie", `${ACCESS_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
  response.headers.append("set-cookie", `${CSRF_COOKIE}=; Path=/; SameSite=Strict; Max-Age=0${secure}`);
  response.headers.append("set-cookie", `${REFRESH_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
  return response;
}
