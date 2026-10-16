export const categoryTypes = {
  COURSE: "Courses", CLASS: "Classes & workshops", SESSION: "Sessions",
  PRODUCT: "Products", MEDITATION: "Meditations", BLOG: "Blog",
};

export function availableCategories(data, type) {
  return (Array.isArray(data) ? data : []).filter((category) =>
    category.status === "ACTIVE" && !category.archivedAt &&
    Array.isArray(category.appliesTo) && category.appliesTo.includes(type)
  ).sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0) || a.name.localeCompare(b.name));
}

export async function loadFacilitatorCategories(request) {
  const first = await request("facilitator/categories?page=1&limit=20");
  if (!Array.isArray(first.data)) throw new Error("Categories could not be loaded. Please try again.");
  const rows = [...first.data];
  const pages = Math.max(1, Number(first.pagination?.pages) || 1);
  for (let page = 2; page <= pages; page++) {
    const result = await request(`facilitator/categories?page=${page}&limit=20`);
    if (!Array.isArray(result.data)) throw new Error("The category list was incomplete. Please try again.");
    rows.push(...result.data);
  }
  return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

export function categoryMutationBody(method, values, reviewed, latest) {
  const reason = String(values.reason || "").trim();
  if (!reason) throw new Error("Enter a reason for this category change.");
  const body = { reason };
  if (method !== "DELETE") {
    const name = String(values.name || "").trim();
    if (!name) throw new Error("Enter a category name.");
    body.name = name;
  }
  if (method !== "POST") {
    const version = Number(latest?.version);
    if (!Number.isSafeInteger(version) || version < 1) throw new Error("Refresh the category to load its current version.");
    if (version !== Number(reviewed?.version)) {
      const error = new Error("This category changed after you opened it. Close this form, refresh the category and review the latest details.");
      error.status = 409;
      throw error;
    }
    body.version = version;
  }
  return body;
}
