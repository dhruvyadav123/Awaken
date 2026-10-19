import { backendRequest } from "@/lib/backend-auth";

export async function POST(request) {
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const action = body.action || "forgot";
    let path;
    let payload;

    if (action === "verify") {
      if (typeof body.token !== "string" || !body.token.trim()) {
        return Response.json({ error: "Open the complete email verification link and try again." }, { status: 400 });
      }
      path = "auth/verify-email";
      payload = { token: body.token.trim() };
    } else if (action === "resend") {
      const email = typeof body.email === "string" ? body.email.trim() : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return Response.json({ error: "Enter the email address used for your account." }, { status: 400 });
      }
      path = "auth/resend-verification";
      payload = { email };
    } else if (action === "reset") {
      if (typeof body.token !== "string" || !body.token || typeof body.password !== "string" || body.password.length < 8) {
        return Response.json({ error: "Check your account details and try again." }, { status: 400 });
      }
      path = "auth/reset-password";
      payload = { token: body.token, password: body.password };
    } else {
      const email = typeof body.email === "string" ? body.email.trim() : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return Response.json({ error: "Check your account details and try again." }, { status: 400 });
      }
      path = "auth/forgot-password";
      payload = { email };
    }

    const response = await backendRequest(path, { method: "POST", body: payload });
    return Response.json(
      response.ok
        ? { success: true, message: response.result.message || (action === "verify" ? "Your email has been verified." : action === "resend" ? "A new verification email has been sent." : "Request accepted.") }
        : { error: response.result.message || "The request could not be completed." },
      { status: response.status },
    );
  } catch {
    return Response.json({ error: "Invalid account request." }, { status: 400 });
  }
}
