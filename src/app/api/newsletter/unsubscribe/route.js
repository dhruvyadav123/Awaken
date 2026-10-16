const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

export async function POST(request) {
  if (!API_BASE_URL) return Response.json({ error: "Newsletter service is not configured." }, { status: 503 });
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token || token.length > 1000) return Response.json({ error: "This unsubscribe link is missing a valid token." }, { status: 400 });
    const response = await fetch(API_BASE_URL + "/public/newsletter/unsubscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) return Response.json({ error: result.message || "We could not update your subscription right now." }, { status: response.status || 502 });
    return Response.json({ success: true, message: result.data?.message || result.message || "Your newsletter preferences have been updated." });
  } catch {
    return Response.json({ error: "We could not update your subscription right now. Please try again." }, { status: 502 });
  }
}
