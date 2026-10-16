import { cookies } from "next/headers";
import { backendRequest, REFRESH_COOKIE, CSRF_COOKIE, ACCESS_COOKIE, setAuthCookies, clearAuthCookies } from "@/lib/backend-auth";

export async function POST(request) {
  const jar = await cookies();
  const csrfToken = jar.get(CSRF_COOKIE)?.value;
  if (!csrfToken || csrfToken !== request.headers.get("x-csrf-token") || (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin)) return Response.json({ error: "Session check failed." }, { status: 403 });
  const refreshCookie = jar.get(REFRESH_COOKIE)?.value;
  if (!refreshCookie) return clearAuthCookies(Response.json({ error: "Please sign in again." }, { status: 401 }));
  const refreshed = await backendRequest("auth/refresh", { method: "POST", body: {}, token: jar.get(ACCESS_COOKIE)?.value, csrfToken, refreshCookie });
  if (!refreshed.ok || !refreshed.result.data?.accessToken) return clearAuthCookies(Response.json({ error: refreshed.result.message || "Please sign in again." }, { status: refreshed.ok ? 502 : refreshed.status }));
  return setAuthCookies(Response.json({ success: true }), refreshed.result.data, refreshed.refreshCookie || refreshCookie);
}
