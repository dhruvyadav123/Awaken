const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

const allowedPath = (segments) => {
  if (segments.length === 3 && segments[0] === "media" && segments[2] === "file") return true;
  if (segments.length === 4 && segments[0] === "courses" && segments[2] === "demo" && segments[3] === "file") return true;
  if (segments.length === 6 && segments[0] === "courses" && segments[2] === "lessons" && segments[4] === "preview" && segments[5] === "file") return true;
  return false;
};

export async function GET(_request, { params }) {
  const { segments = [] } = await params;
  if (!API_BASE_URL || !allowedPath(segments) || segments.some((segment) => !/^[A-Za-z0-9_-]+$/.test(segment))) {
    return Response.json({ error: "This public file is not available." }, { status: 404 });
  }

  try {
    const path = segments.map(encodeURIComponent).join("/");
    const upstream = await fetch(API_BASE_URL + "/public/" + path, {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!upstream.ok) return Response.json({ error: "This public file is not available." }, { status: upstream.status });
    const headers = new Headers({
      "content-type": upstream.headers.get("content-type") || "application/octet-stream",
      "cache-control": "public, max-age=300, stale-while-revalidate=3600",
      "x-content-type-options": "nosniff",
    });
    const length = upstream.headers.get("content-length");
    if (length) headers.set("content-length", length);
    return new Response(upstream.body, { status: 200, headers });
  } catch {
    return Response.json({ error: "This public file could not be loaded." }, { status: 502 });
  }
}
