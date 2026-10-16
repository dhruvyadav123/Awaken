export function grantedFileHref(value) {
  if (typeof value === "string") {
    if (value.startsWith("/api/v1/") && /^(media\/|learning\/files\/|digital-library\/files\/|meditation\/files\/)/.test(value.slice(8))) return "/api/account/" + value.slice(8);
    if (value.startsWith("/media/") || value.startsWith("/learning/") || value.startsWith("/digital-library/") || value.startsWith("/meditation/")) return "/api/account" + value;
    try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : ""; } catch { return ""; }
  }
  if (value && typeof value === "object") {
    for (const key of ["url", "path", "fileUrl", "accessUrl", "downloadUrl", "playbackUrl", "accessLink", "file", "access", "data"]) { const href = grantedFileHref(value[key]); if (href) return href; }
  }
  return "";
}
