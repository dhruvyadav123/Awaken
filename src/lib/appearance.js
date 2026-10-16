import { allPublicItems } from "./public-api";

export async function getAppearance() {
  const result = await allPublicItems("cms/appearance");
  const raw = result.data;
  if (!raw) return {};
  if (!Array.isArray(raw)) return typeof raw === "object" ? raw : {};
  const latest = raw[0];
  if (latest && typeof latest === "object" && (latest.siteName || latest.siteDescription || latest.primaryColor || latest.announcementText)) return latest;
  return Object.fromEntries(raw.filter((item) => item && typeof item.key === "string").map((item) => [item.key, item.value]));
}

export function appearanceStyle(appearance) {
  const color = appearance.primaryColor || appearance.brandColor;
  if (typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color)) return undefined;
  return { "--awm-brand-color": color };
}
