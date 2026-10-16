export const MEDIA_KINDS = ["IMAGE", "VIDEO", "AUDIO", "DOCUMENT"];
// Client limit only; storage policy and signature validation remain backend-owned.
const configuredLimit = Number(process.env.NEXT_PUBLIC_MEDIA_MAX_BYTES);
export const MEDIA_MAX_BYTES = Number.isSafeInteger(configuredLimit) && configuredLimit > 0 ? configuredLimit : 10 * 1024 * 1024;
const formats = {
  IMAGE: { jpg: ["image/jpeg"], jpeg: ["image/jpeg"], png: ["image/png"], webp: ["image/webp"] },
  VIDEO: { mp4: ["video/mp4"], webm: ["video/webm"] },
  AUDIO: { mp3: ["audio/mpeg", "audio/mp3"], wav: ["audio/wav", "audio/x-wav"], m4a: ["audio/mp4", "audio/x-m4a"], ogg: ["audio/ogg"] },
  DOCUMENT: { pdf: ["application/pdf"] },
};
export const MEDIA_ACCEPT = Object.fromEntries(MEDIA_KINDS.map(kind => [kind, Object.keys(formats[kind]).map(extension => "." + extension).join(",")]));
export function validateMediaFile(file, kind) {
  if (!MEDIA_KINDS.includes(kind)) throw new Error("Choose a supported media type.");
  if (!file || !Number.isFinite(file.size) || file.size <= 0) throw new Error("Choose a non-empty file.");
  if (file.size > MEDIA_MAX_BYTES) throw new Error(`Choose a file of ${Math.round(MEDIA_MAX_BYTES / 1048576 * 10) / 10} MB or less.`);
  const extension = String(file.name).split(".").at(-1).toLowerCase();
  const allowed = formats[kind][extension];
  if (!allowed || (file.type && !allowed.includes(file.type.toLowerCase()))) throw new Error(`This file is not a supported ${kind.toLowerCase()} file.`);
}
export function safePermanentMediaUrl(value) {
  if (typeof value !== "string" || !value.trim() || /[\\\u0000-\u0020]/.test(value)) return "";
  try {
    const parsed = new URL(value, "https://local.invalid");
    if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password || parsed.hash) return "";
    if ([...parsed.searchParams.keys()].some(key => /^(?:token|access_token|authorization|sig|signature|expires|expiry|expiration|x-amz-.+|x-goog-.+)$/i.test(key))) return "";
    if (!/^https?:\/\//i.test(value) && (!value.startsWith("/") || value.startsWith("//"))) return "";
    if (/^\/(?:api\/account|api\/v1\/media|media)\//.test(parsed.pathname)) return "";
    return value;
  } catch { return ""; }
}
export function publicMediaUrl(record) {
  return record?.kind === "IMAGE" && record?.status === "ACTIVE" && record?.visibility === "PUBLIC" ? safePermanentMediaUrl(record.publicPath) : "";
}
export function mediaFileHref(id, grant) {
  if (typeof id !== "string" || !id || /[/\\\u0000]/.test(id)) throw new Error("Media ID is unavailable.");
  const data = grant?.data ?? grant;
  let token = typeof data?.token === "string" ? data.token : "";
  if (!token) {
    const link = typeof data === "string" ? data : data?.url || data?.path || data?.fileUrl || data?.accessUrl || data?.downloadUrl || data?.accessLink;
    if (typeof link === "string") {
      try { const parsed = new URL(link, "https://local.invalid"); if (/^https?:$/.test(parsed.protocol) && parsed.pathname.endsWith(`/media/${encodeURIComponent(id)}/file`)) token = parsed.searchParams.get("token") || ""; } catch { /* Invalid grant is handled below. */ }
    }
  }
  if (!token) throw new Error("The service did not return a supported file access token.");
  return `/api/account/media/${encodeURIComponent(id)}/file?token=${encodeURIComponent(token)}`;
}
export function mediaBinding(operation, key) {
  // Only fields already present in the supplied request contract are editable.
  if (operation.method !== "POST") return null;
  if (key === "thumbnail" && ["facilitator/courses", "facilitator/classes"].includes(operation.path)) return { multiple: false };
  if (key === "images" && operation.path === "facilitator/products") return { multiple: true };
  return null;
}
