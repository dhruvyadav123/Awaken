import { recordMedia } from "./record-display.js";

const MEMBER_ACCESS = new Set(["MEMBERSHIP", "MEMBER", "MEMBERS_ONLY", "RESTRICTED"]);

export function meditationCategory(item) {
  return item?.catalogs?.category?.name || item?.category?.name || item?.categoryName || "Meditation";
}

export function meditationFormat(item) {
  const value = String(item?.contentType || item?.format || "").toUpperCase();
  if (value === "AUDIO") return "Audio";
  if (value === "VIDEO") return "Video";
  if (value === "TEXT" || value === "WRITTEN") return "Written";
  return value ? value.charAt(0) + value.slice(1).toLowerCase() : "Guided practice";
}

export function meditationDuration(item) {
  const seconds = Number(item?.duration ?? item?.durationSeconds);
  const minutes = Number(item?.durationMinutes);
  if (Number.isFinite(minutes) && minutes > 0) return `${Math.round(minutes)} min`;
  if (Number.isFinite(seconds) && seconds > 0) return `${Math.max(1, Math.round(seconds / 60))} min`;
  return "Self-paced";
}

export function meditationRequiresMembership(item) {
  if (item?.membershipRequired === true || item?.requiresMembership === true || item?.hasAccess === false) return true;
  return MEMBER_ACCESS.has(String(item?.accessType || item?.access || item?.visibility || "").toUpperCase());
}

export function publicMeditationPlayback(item) {
  if (meditationRequiresMembership(item)) return null;
  return recordMedia(item, { scope: "public" }).find((asset) => asset.kind === "AUDIO" || asset.kind === "VIDEO") || null;
}
