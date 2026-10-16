import { backendRequest, setAuthCookies } from "@/lib/backend-auth";
import { dashboardHome, identityOf } from "@/lib/dashboard/identity";

export async function POST(request) {
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid sign-in origin." }, { status: 403 });
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) return Response.json({ error: "Enter your email and password." }, { status: 400 });
    const { ok, status, result, refreshCookie } = await backendRequest("auth/login", { method: "POST", body: { email, password } });
    if (!ok) return Response.json({ error: result.message || "We could not sign you in. Check your details and try again." }, { status });
    const data = result.data || {};
    if (!data.accessToken) return Response.json({ error: "The sign-in response was incomplete. Please try again." }, { status: 502 });
    const verified = await backendRequest("auth/me", { token: data.accessToken });
    if (!verified.ok) return Response.json({ error: verified.result.message || "Your account could not be verified." }, { status: verified.status });
    const user = identityOf(verified.result);
    const redirectTo = dashboardHome(user);
    if (!redirectTo) return Response.json({ error: "This account does not have access to a learner or facilitator dashboard." }, { status: 403 });
    return setAuthCookies(Response.json({ user, message: result.message || "Signed in successfully.", redirectTo }), data, refreshCookie);
  } catch {
    return Response.json({ error: "We could not sign you in right now. Please try again." }, { status: 400 });
  }
}
