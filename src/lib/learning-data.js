export function dataOf(result) {
  return result?.data ?? result?.result?.data ?? result?.result ?? {};
}

export function listOf(value, keys = []) {
  if (Array.isArray(value)) return value;
  for (const key of keys) if (Array.isArray(value?.[key])) return value[key];
  return [];
}

export function externalUrl(value) {
  const candidate = typeof value === "string" ? value : value?.url || value?.path || value?.href || value?.link || value?.joinUrl || value?.joiningUrl || value?.meetingUrl || value?.recordingUrl || value?.playbackUrl || value?.accessUrl || value?.downloadUrl || value?.paymentUrl || value?.checkoutUrl;
  if (typeof candidate !== "string") return "";
  if (candidate.startsWith("/api/v1/")) {
    const path = candidate.slice(8);
    if (/^(learning\/files\/|digital-library\/files\/|meditation\/files\/|media\/[^/]+\/file(?:\?|$))/.test(path)) return "/api/account/" + path;
    if (/^public\/(media\/[^/]+\/file|courses\/[^/]+\/demo\/file|courses\/[^/]+\/lessons\/[^/]+\/preview\/file)(?:\?|$)/.test(path)) return "/api/public/files/" + path.slice(7);
    return "";
  }
  try {
    const url = new URL(candidate);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

export function titleOf(item, fallback) {
  return item?.title || item?.name || item?.classTitle || item?.courseTitle || item?.quizTitle || item?.titleSnapshot || item?.snapshot?.title || item?.snapshot?.name || fallback;
}

export function lessonsOf(course) {
  const direct = listOf(course, ["lessons", "items"]);
  if (direct.length) return direct;
  return listOf(course, ["modules", "sections"]).flatMap((group) => listOf(group, ["lessons", "items"]));
}
