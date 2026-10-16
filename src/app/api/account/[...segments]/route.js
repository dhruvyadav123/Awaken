import { cookies } from "next/headers";
import { ACCESS_COOKIE, CSRF_COOKIE, API_BASE_URL, backendRequest, clearAuthCookies } from "@/lib/backend-auth";
import contracts from "@/lib/dashboard/contracts.json";
import { endpointContract, identityOf, roleOf } from "@/lib/dashboard/identity";

async function proxy(request, context) {
  const { segments = [] } = await context.params;
  if (segments.length === 1 && segments[0] === "me") segments.splice(0, 1, "auth", "me");
  if (segments.some((part) => !part || part === "." || part === ".." || /[/\\\u0000]/.test(part))) return Response.json({ error: "Invalid account path." }, { status: 400 });
  const contract = endpointContract(contracts, segments.join("/"), request.method);
  if (!contract) return Response.json({ error: "This account endpoint is not available." }, { status: 404 });
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (!token) return Response.json({ error: "Please sign in to continue.", code: "AUTH_REQUIRED" }, { status: 401 });

  const method = request.method;
  if (contract.role) {
    const verified = await backendRequest("auth/me", { token });
    if (!verified.ok) return Response.json({ error: verified.result.message || "Please sign in again." }, { status: verified.status });
    if (roleOf(identityOf(verified.result)) !== contract.role) return Response.json({ error: "A verified facilitator account is required." }, { status: 403 });
  }
  if (!["GET", "POST", "PATCH", "DELETE"].includes(method)) return Response.json({ error: "Method not allowed." }, { status: 405 });
  let csrfToken;
  if (method !== "GET") {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Cross-origin account requests are not allowed." }, { status: 403 });
    const cookieToken = jar.get(CSRF_COOKIE)?.value;
    const headerToken = request.headers.get("x-csrf-token");
    if (!cookieToken || !headerToken || cookieToken !== headerToken) return Response.json({ error: "Your session check expired. Refresh the page and try again.", code: "CSRF_INVALID" }, { status: 403 });
    csrfToken = cookieToken;
  }

  if (!API_BASE_URL) return Response.json({ error: "Account service is not configured." }, { status: 503 });
  const path = segments.map((part) => encodeURIComponent(part)).join("/");
  const url = `${API_BASE_URL}/${path}${new URL(request.url).search}`;
  let body;
  let multipart = false;
  if (method !== "GET") {
    multipart = method === "POST" && (segments.join("/") === "me/facilitator-application/documents" || segments.join("/").startsWith("media/uploads/")) && request.headers.get("content-type")?.startsWith("multipart/form-data");
    try { body = multipart ? await request.formData() : (await request.text()) || undefined; if (body && !multipart) body = JSON.parse(body); }
    catch { return Response.json({ error: multipart ? "A valid document upload is required." : "A valid JSON request body is required." }, { status: 400 }); }
  }
  try {
    const response = await fetch(url, {
      method, cache: "no-store", signal: AbortSignal.any([request.signal, AbortSignal.timeout(multipart || ["file", "download"].includes(segments.at(-1)) || segments[1] === "files" ? 120000 : 20000)]),
      headers: { authorization: `Bearer ${token}`, accept: "application/json", ...(request.headers.get("range") ? { range: request.headers.get("range") } : {}), ...(csrfToken ? { "x-csrf-token": csrfToken } : {}), ...(request.headers.get("idempotency-key") ? { "idempotency-key": request.headers.get("idempotency-key") } : {}), ...(body === undefined || multipart ? {} : { "content-type": "application/json" }) },
      ...(body === undefined ? {} : { body: multipart ? body : JSON.stringify(body) }),
    });
    const contentType = response.headers.get("content-type") || "application/json";
    if (response.status === 204) return new Response(null, { status: 204 });
    if (response.ok && (!contentType.includes("json") || segments.at(-1) === "download")) {
      const headers = new Headers({ "content-type": contentType, "cache-control": "private, no-store" });
      const disposition = response.headers.get("content-disposition");
      if (disposition) headers.set("content-disposition", disposition);
      for (const name of ["content-range", "accept-ranges", "content-length"]) if (response.headers.has(name)) headers.set(name, response.headers.get(name));
      headers.set("x-content-type-options", "nosniff");
      return new Response(response.body, { status: response.status, headers });
    }
    const result = await response.json().catch(() => null);
    if (!result) return Response.json({ error: "The account service returned an invalid response." }, { status: 502 });
    const outgoing = Response.json(result, { status: response.status, headers: { "cache-control": "private, no-store" } });
    return segments.join("/") === "auth/change-password" && response.ok ? clearAuthCookies(outgoing) : outgoing;
  } catch {
    return Response.json({ error: "The account service could not be reached. Please try again." }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
