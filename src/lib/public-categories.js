export const categoryCatalogs = {
  COURSE: { path: "/courses", collection: "courses", label: "Courses" },
  CLASS: { path: "/classes", collection: "classes", label: "Classes" },
  SESSION: { path: "/sessions", collection: "session-types", label: "Sessions" },
  PRODUCT: { path: "/shop", collection: "products", label: "Shop" },
  MEDITATION: { path: "/meditations", collection: "meditations", label: "Meditations" },
  BLOG: { path: "/blog", collection: "blogs", label: "Journal" },
};

export function normalizePublicCategories(data) {
  if (!Array.isArray(data)) return [];
  return Array.from(new Map(data.filter((item) => item && typeof item.id === "string" &&
    typeof item.name === "string" && item.name.trim() && typeof item.slug === "string" && item.slug.trim() &&
    Array.isArray(item.appliesTo)).map((item) => [item.id, item])).values())
    .sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0) || a.name.localeCompare(b.name));
}

export function categoriesForType(categories, type) {
  return normalizePublicCategories(categories).filter((item) => item.appliesTo.includes(type));
}

export function matchesCategory(item, category) {
  const values = [item.categoryId, item.categorySlug, item.category, ...(Array.isArray(item.categories) ? item.categories : []), ...(Array.isArray(item.categoryIds) ? item.categoryIds : [])];
  return values.some((value) => typeof value === "object" && value !== null
    ? value.id === category.id || value._id === category.id || value.slug === category.slug
    : value === category.id || value === category.slug);
}
