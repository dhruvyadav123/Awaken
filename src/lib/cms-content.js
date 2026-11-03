
import { allPublicItems, publicApi } from "./public-api";

function asObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);

        if (
          parsed &&
          typeof parsed === "object" &&
          !Array.isArray(parsed)
        ) {
          return parsed;
        }
      } catch {
        return null;
      }
    }
  }

  return null;
}

function extractItems(value) {
  if (Array.isArray(value)) return value;

  const object = asObject(value);

  if (!object) return [];

  for (const key of [
    "items",
    "records",
    "results",
    "docs",
    "sections",
  ]) {
    if (Array.isArray(object[key])) {
      return object[key];
    }
  }

  if (object.data) {
    const nested = extractItems(object.data);
    if (nested.length) return nested;
  }

  if (
    object.key ||
    object.slug ||
    object._id ||
    object.id
  ) {
    return [object];
  }

  return [];
}

export async function getCmsItems(collection, options = {}) {
  if (!collection || typeof collection !== "string") {
    return [];
  }

  const path = `cms/${collection.replace(/^\/+|\/+$/g, "")}`;

  let result = await allPublicItems(path, options);

  // Some CMS endpoints do not accept page/limit parameters.
  if (result.error && result.status === 400) {
    result = await publicApi(path, {}, options);
  }

  if (result.error) {
    console.error("[CMS] Failed to load:", {
      collection,
      status: result.status,
      error: result.error,
    });

    return [];
  }

  return extractItems(result.data);
}

export function getCmsPayload(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return {};
  }

  const value = asObject(item.value) || {};
  const content = asObject(item.content) || {};
  const payload = asObject(item.payload) || {};
  const data = asObject(item.data) || {};

  const merged = {
    ...item,
    ...value,
    ...content,
    ...payload,
    ...data,
  };

  // Preserve the CMS record's original identifier.
  if (typeof item.key === "string" && item.key.trim()) {
    merged.key = item.key;
  }

  return merged;
}

export function getTextValue(object, ...keys) {
  if (!object || typeof object !== "object") {
    return "";
  }

  for (const key of keys) {
    const value = object[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      for (const nestedKey of [
        "value",
        "text",
        "plainText",
        "content",
      ]) {
        const nested = value[nestedKey];

        if (
          typeof nested === "string" &&
          nested.trim()
        ) {
          return nested.trim();
        }
      }
    }
  }

  return "";
}

export function getFooterConfig(items) {
  if (!Array.isArray(items)) return {};

  return items.reduce((config, item) => {
    const payload = getCmsPayload(item);

    Object.assign(config, payload);

    if (typeof item?.key === "string") {
      const value = item.value ?? item.data;

      config[item.key] =
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
          ? value.value ?? value.text ?? value
          : value;
    }

    return config;
  }, {});
}

export function safeLink(
  value,
  { allowExternal = false } = {}
) {
  if (typeof value !== "string") return null;

  const href = value.trim();

  if (href.startsWith("/") && !href.startsWith("//")) {
    return href;
  }

  if (!allowExternal) return null;

  try {
    const url = new URL(href);

    if (
      url.protocol === "https:" ||
      url.protocol === "http:"
    ) {
      return url.toString();
    }

    return null;
  } catch {
    return null;
  }
}

export function normalizeCmsMenus(records) {
  if (!Array.isArray(records)) return [];

  const normalize = (entry) => {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    const label = getTextValue(
      entry,
      "label",
      "title",
      "name"
    );

    const href = safeLink(
      entry.href || entry.url || entry.path
    );

    const childEntries =
      entry.children || entry.items;

    const children = Array.isArray(childEntries)
      ? childEntries
          .map(normalize)
          .filter(
            (item) =>
              item &&
              (item.href || item.children?.length)
          )
      : [];

    if (!label || (!href && !children.length)) {
      return null;
    }

    return {
      label,
      href: href || "",
      ...(children.length ? { children } : {}),
    };
  };

  const entries = records
    .filter((record) => {
      const payload = getCmsPayload(record);

      return (
        !payload.location ||
        String(payload.location).toUpperCase() === "HEADER"
      );
    })
    .sort((left, right) => {
      const leftPayload = getCmsPayload(left);
      const rightPayload = getCmsPayload(right);

      return (
        (Number(leftPayload.displayOrder) || 0) -
        (Number(rightPayload.displayOrder) || 0)
      );
    })
    .flatMap((record) => {
      const payload = getCmsPayload(record);

      if (Array.isArray(payload.items)) {
        return payload.items;
      }

      if (Array.isArray(payload.menuItems)) {
        return payload.menuItems;
      }

      if (Array.isArray(payload.entries)) {
        return payload.entries;
      }

      if (Array.isArray(payload.links)) {
        return payload.links;
      }

      if (Array.isArray(record?.data)) {
        return record.data;
      }

      return [];
    });

  return entries.map(normalize).filter(Boolean);
}
