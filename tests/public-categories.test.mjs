import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const code = await readFile(new URL("../src/lib/public-categories.js", import.meta.url), "utf8");
const { normalizePublicCategories, categoriesForType, matchesCategory, categoryCatalogs } =
  await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
const category = {
  id: "6ac6181f38b22a9f0ff4abe8", name: "Example value xxxxxxx", slug: "example-value-xxxxxxx",
  description: "", displayOrder: 0,
  appliesTo: ["COURSE", "CLASS", "SESSION", "PRODUCT", "MEDITATION", "BLOG"],
};

test("The supplied API category appears in each of its six catalogues", () => {
  for (const type of Object.keys(categoryCatalogs)) {
    assert.deepEqual(categoriesForType([category], type), [category]);
  }
  assert.equal(categoryCatalogs.SESSION.collection, "session-types");
  assert.equal(categoryCatalogs.PRODUCT.path, "/shop");
});

test("Applicability keeps unrelated taxonomy out of each catalogue", () => {
  const blogOnly = { ...category, appliesTo: ["BLOG"] };
  assert.deepEqual(categoriesForType([blogOnly], "COURSE"), []);
  assert.deepEqual(categoriesForType([blogOnly], "BLOG"), [blogOnly]);
});

test("Categories respect display order, deduplicate and skip malformed entries", () => {
  const earlier = { ...category, id: "earlier", slug: "earlier", displayOrder: -1 };
  assert.deepEqual(normalizePublicCategories([category, null, { ...category, id: "bad", slug: "" }, earlier, category]), [earlier, category]);
  assert.deepEqual(normalizePublicCategories(null), []);
});

test("Filtering handles category IDs, slugs and populated relationships without matching unrelated records", () => {
  for (const item of [
    { categoryId: category.id }, { categorySlug: category.slug },
    { category: { id: category.id } }, { category: { slug: category.slug } },
    { categories: [{ id: category.id }] }, { categoryIds: [category.id] },
  ]) assert.equal(matchesCategory(item, category), true);
  for (const item of [{}, { categoryId: "different" }, { category: null }, { categories: [{ id: "different" }] }]) {
    assert.equal(matchesCategory(item, category), false);
  }
});

test("Pagination includes category matches beyond the first catalogue page and reuses cached requests", async () => {
  const originalFetch = globalThis.fetch;
  const originalBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://category-contract.test/api/v1";
  const requests = [];
  globalThis.fetch = async (url) => {
    requests.push(String(url));
    const page = Number(url.searchParams.get("page"));
    const data = page === 1 ? Array.from({ length: 20 }, (_, i) => ({ id: `other-${i}`, categoryId: "other" })) : [{ id: "later-match", categoryId: category.id }];
    return Response.json({ success: true, data, pagination: { page, limit: 20, total: 21, pages: 2 } });
  };
  try {
    const apiCode = await readFile(new URL("../src/lib/public-api.js", import.meta.url), "utf8");
    const { allPublicItems } = await import("data:text/javascript;base64," + Buffer.from(apiCode).toString("base64"));
    const result = await allPublicItems("courses");
    assert.equal(result.data.length, 21);
    assert.deepEqual(result.data.filter((item) => matchesCategory(item, category)).map((item) => item.id), ["later-match"]);
    await allPublicItems("courses");
    assert.equal(requests.length, 2, "Repeated reads reuse cached pages");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalBase === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
    else process.env.NEXT_PUBLIC_API_BASE_URL = originalBase;
  }
});
