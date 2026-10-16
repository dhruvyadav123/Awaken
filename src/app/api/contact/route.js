import { randomUUID } from "node:crypto";

const API_BASE_URL = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

function failure(error, status) {
  return Response.json({ success: false, message: error, error, data: { accepted: false } }, { status });
}

export async function POST(request) {
  if (!API_BASE_URL) return failure("Contact service is not configured.", 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return failure("Please send a valid contact form.", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return failure("Please send a valid contact form.", 400);
  }

  try {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (name.length < 2 || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !subject || subject.length > 180 || message.length < 5 || message.length > 5000) {
      return failure("Please check your details and message, then try again.", 400);
    }

    const idempotencyKey = typeof body.idempotencyKey === "string" && /^[\w-]{8,120}$/.test(body.idempotencyKey)
      ? body.idempotencyKey
      : randomUUID();
    const response = await fetch(API_BASE_URL + "/public/contact", {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": idempotencyKey },
      body: JSON.stringify({ name, email, subject, message, source: "WEBSITE", idempotencyKey }),
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result?.success !== true || result?.data?.accepted !== true) {
      const message = typeof result?.message === "string" && result.message.trim() && result.success === false
        ? result.message
        : "Your message was not accepted. Please try again.";
      return failure(message, response.ok ? 502 : response.status);
    }
    return Response.json({ success: true, message: typeof result.message === "string" ? result.message : "Success", data: { accepted: true } });
  } catch (error) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    return failure(timedOut
      ? "The contact service took too long to respond. Please try again."
      : "Your message could not be sent right now. Please try again.", timedOut ? 504 : 502);
  }
}
