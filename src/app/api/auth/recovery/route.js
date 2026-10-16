import { backendRequest } from "@/lib/backend-auth";
export async function POST(request) {
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body = await request.json(); const reset = body.action === "reset";
    if (reset ? typeof body.token !== "string" || !body.token || typeof body.password !== "string" || body.password.length < 8 : typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return Response.json({ error: "Check your account details and try again." }, { status: 400 });
    const response = await backendRequest(reset ? "auth/reset-password" : "auth/forgot-password", { method: "POST", body: reset ? { token: body.token, password: body.password } : { email: body.email.trim() } });
    return Response.json(response.ok ? { success: true, message: response.result.message || "Request accepted." } : { error: response.result.message || "The request could not be completed." }, { status: response.status });
  } catch { return Response.json({ error: "Invalid account request." }, { status: 400 }); }
}
