const mediaFields = [
  "thumbnail",
  "thumbnailUrl",
  "image",
  "imageUrl",
  "featuredImage",
  "featuredImageUrl",
  "photo",
  "avatar",
  "avatarUrl",
  "coverImage",
  "coverImageUrl",
  "poster",
  "logo",
  "thumbnailMediaId",
  "imageMediaId",
  "featuredImageMediaId",
  "photoMediaId",
  "avatarMediaId",
  "coverMediaId",
  "logoMediaId",
  "images",
  "imageMediaIds",
  "media",
  "attachments",
  "documents",
  "files",
];

const mediaAliases = [
  ["courseThumbnail", "thumbnail"],
  ["courseThumbnailUrl", "thumbnailUrl"],
  ["courseThumbnailMediaId", "thumbnailMediaId"],
  ["courseImage", "image"],
  ["courseImageUrl", "imageUrl"],
  ["courseImageMediaId", "imageMediaId"],
  ["courseBanner", "featuredImage"],
  ["courseBannerUrl", "featuredImageUrl"],
  ["courseBannerMediaId", "featuredImageMediaId"],
  ["productThumbnail", "thumbnail"],
  ["productThumbnailUrl", "thumbnailUrl"],
  ["productThumbnailMediaId", "thumbnailMediaId"],
  ["productImage", "image"],
  ["productImageUrl", "imageUrl"],
  ["productImageMediaId", "imageMediaId"],
];

function usable(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return Boolean(value);
}

function isRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

/**
 * Cart responses can contain media on the line item, its product/course,
 * or a price snapshot. Normalize those backend shapes for RecordMedia.
 */
export function cartMediaRecord(item) {
  if (!isRecord(item)) return {};

  const sources = [];
  const seen = new Set();
  const nestedKeys = [
    "product",
    "course",
    "snapshot",
    "item",
    "productSnapshot",
    "courseSnapshot",
    "itemSnapshot",
    "productDetails",
    "courseDetails",
    "productId",
    "courseId",
    "itemId",
  ];

  function collect(source, depth = 0) {
    if (!isRecord(source) || seen.has(source) || depth > 2) return;
    seen.add(source);
    sources.push(source);
    if (depth === 2) return;
    nestedKeys.forEach((key) => collect(source[key], depth + 1));
  }

  collect(item);

  const normalized = { ...item };
  mediaFields.forEach((field) => {
    const value = sources.map((source) => source[field]).find(usable);
    if (value !== undefined) normalized[field] = value;
  });

  mediaAliases.forEach(([alias, field]) => {
    if (usable(normalized[field])) return;
    const value = sources.map((source) => source[alias]).find(usable);
    if (value !== undefined) normalized[field] = value;
  });

  return normalized;
}
