import { cookies } from "next/headers";
import { clearAuthCookies, backendRequest, ACCESS_COOKIE, CSRF_COOKIE, REFRESH_COOKIE } from "@/lib/backend-auth";

export async function POST(request) {
  const jar = await cookies();
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid sign-out origin." }, { status: 403 });
  await backendRequest("auth/logout", { method: "POST", body: {}, token: jar.get(ACCESS_COOKIE)?.value, csrfToken: jar.get(CSRF_COOKIE)?.value, refreshCookie: jar.get(REFRESH_COOKIE)?.value });
  return clearAuthCookies(Response.json({ success: true }));
}
