import { allPublicItems } from "./public-api";

export async function getCmsItems(collection) {
  const result = await allPublicItems("cms/" + collection);
  return Array.isArray(result.data) ? result.data : [];
}

export function getCmsPayload(item) {
  if (!item || typeof item !== "object") return {};
  return item.data && typeof item.data === "object" && !Array.isArray(item.data)
    ? { ...item, ...item.data }
    : item;
}

export function getFooterConfig(items) {
  return items.reduce((config, item) => {
    const payload = getCmsPayload(item);
    Object.assign(config, payload);
    if (typeof item?.key === "string") {
      const value = item.value ?? item.data;
      config[item.key] = value && typeof value === "object" && !Array.isArray(value) ? value.value ?? value.text ?? value : value;
    }
    return config;
  }, {});
}

export function getTextValue(object, ...keys) {
  for (const key of keys) {
    const value = object?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function safeLink(value, { allowExternal = false } = {}) {
  if (typeof value !== "string") return null;
  const href = value.trim();
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (!allowExternal) return null;
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function normalizeCmsMenus(records) {
  const normalize = (entry) => {
    if (!entry || typeof entry !== "object") return null;
    const label = getTextValue(entry, "label", "title", "name");
    const href = safeLink(entry.href || entry.url || entry.path);
    const children = Array.isArray(entry.children || entry.items)
      ? (entry.children || entry.items).map(normalize).filter((item) => item?.href)
      : [];
    if (!label || (!href && !children.length)) return null;
    return { label, href: href || "", ...(children.length ? { children } : {}) };
  };
  const entries = records.flatMap((record) => {
    const payload = getCmsPayload(record);
    return Array.isArray(payload.items) ? payload.items
      : Array.isArray(payload.menuItems) ? payload.menuItems
        : Array.isArray(payload.entries) ? payload.entries
          : Array.isArray(payload.links) ? payload.links
            : Array.isArray(record?.data) ? record.data : [];
  });
  return entries.map(normalize).filter(Boolean);
}
