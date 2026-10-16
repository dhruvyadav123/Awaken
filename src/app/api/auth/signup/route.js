import { backendRequest, setAuthCookies } from "@/lib/backend-auth";
import { dashboardHome, identityOf } from "@/lib/dashboard/identity";

export async function POST(request) {
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid registration origin." }, { status: 403 });
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (name.length < 2 || name.length > 80 || !email || email.length > 254 || password.length < 8 || password.length > 128) {
      return Response.json({ error: "Enter a name, valid email, and password of at least 8 characters." }, { status: 400 });
    }
    const created = await backendRequest("auth/register", { method: "POST", body: { name, email, password } });
    if (!created.ok) return Response.json({ error: created.result.message || "We could not create your account." }, { status: created.status });
    const registrationData = created.result.data || {};
    let loginData = registrationData;
    let refreshCookie = created.refreshCookie;
    if (!loginData.accessToken) {
      const login = await backendRequest("auth/login", { method: "POST", body: { email, password } });
      if (login.ok) { loginData = login.result.data || {}; refreshCookie = login.refreshCookie; }
    }
    let user;
    let redirectTo = "/auth/login";
    if (loginData.accessToken) {
      const verified = await backendRequest("auth/me", { token: loginData.accessToken });
      if (verified.ok) { user = identityOf(verified.result); redirectTo = dashboardHome(user) || "/auth/login"; }
    }
    const response = Response.json({
      user,
      message: created.result.message || "Account created successfully.",
      redirectTo,
    }, { status: 201 });
    return user && dashboardHome(user) ? setAuthCookies(response, loginData, refreshCookie) : response;
  } catch {
    return Response.json({ error: "We could not create your account right now. Please try again." }, { status: 400 });
  }
}
