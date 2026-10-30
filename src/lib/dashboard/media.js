export const MEDIA_KINDS = ["IMAGE", "VIDEO", "AUDIO", "DOCUMENT"];
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
// Keep the backend's permanent value in forms; only previews use the local proxy.
export function permanentMediaHref(value) {
  const permanent = safePermanentMediaUrl(value);
  if (!permanent) return "";
  const path = new URL(permanent, "https://local.invalid").pathname;
  const match = path.match(/^\/(?:api\/v1\/)?public\/media\/([^/]+)\/file\/?$/);
  return match ? `/api/public/files/media/${match[1]}/file` : permanent;
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
export function mediaAccessInfo(id, grant) {
  const data = grant?.data ?? grant;
  const expiresIn = Number(data?.expiresIn);
  const parsedExpiresAt = typeof data?.expiresAt === "string" ? Date.parse(data.expiresAt) : NaN;
  const relativeExpiry = Number.isFinite(expiresIn) && expiresIn > 0 ? Date.now() + expiresIn * 1000 : 0;
  const expiresAt = Number.isFinite(parsedExpiresAt) ? relativeExpiry ? Math.min(parsedExpiresAt, relativeExpiry) : parsedExpiresAt : relativeExpiry;
  if (expiresAt && expiresAt <= Date.now()) throw new Error("The media access link has expired. Request fresh access.");
  return { href: mediaFileHref(id, grant), expiresAt, expiresIn: Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 0 };
}
export function mediaBinding(operation, key) {
  // These mappings are confirmed by the supplied facilitator request contracts.
  // A response field alone does not establish that a mutation accepts it.
  if (!["POST", "PATCH"].includes(operation?.method)) return null;
  const schema = operation.fields?.[key];
  const resource = operation.path.replace(/\/\{\{[^}]+\}\}$/, "");
  if (key === "thumbnail" && schema?.type === "string" && operation.method === "POST" && resource === "facilitator/courses") return { multiple: false };
  if (key === "thumbnailMediaId" && schema?.type === "string" && operation.method === "POST" && resource === "facilitator/classes") return { multiple: false, valueType: "id" };
  if (key === "images" && schema?.type === "array" && schema.item?.type === "string" && resource === "facilitator/products") return { multiple: true };
  if (["profileImageMediaId", "coverImageMediaId"].includes(key) && schema?.type === "string" && resource === "facilitator/profile") return { multiple: false, valueType: "id" };
  return null;
}
