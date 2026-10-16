const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

export async function POST(request) {
  if (!API_BASE_URL) return Response.json({ error: "Newsletter service is not configured." }, { status: 503 });

  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const response = await fetch(API_BASE_URL + "/public/newsletter/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false || result.data?.accepted === false) {
      return Response.json({ error: result.message || result.data?.message || "We could not submit your email right now." }, { status: response.status || 502 });
    }
    return Response.json({
      success: true,
      message: result.data?.message || result.message || "If eligible, a confirmation email will be sent.",
    });
  } catch {
    return Response.json({ error: "We could not submit your email right now. Please try again." }, { status: 502 });
  }
}
