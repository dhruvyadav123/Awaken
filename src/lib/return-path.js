export function safeReturnPath(value, user, fallback = "/dashboard/user") {
  if (!["USER", "FACILITATOR"].includes(user?.role)) return fallback;
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value) || /%(?:2f|5c|00|0a|0d)/i.test(value)) return fallback;
  try {
    const url = new URL(value, "https://local.invalid");
    if (url.origin !== "https://local.invalid" || /^\/(?:api|auth|admin)(?:\/|$)/.test(url.pathname)) return fallback;
    if (url.pathname.startsWith("/dashboard/") && !/^\/dashboard\/(?:user|facilitator)(?:\/|$)/.test(url.pathname)) return fallback;
    if (/^\/dashboard\/facilitator(?:\/|$)/.test(url.pathname) && user.role !== "FACILITATOR") return fallback;
    return url.pathname + url.search + url.hash;
  } catch { return fallback; }
}
