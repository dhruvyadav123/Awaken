import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/lib/dashboard/categories.js", import.meta.url), "utf8");
const { categoryMutationBody, availableCategories, loadFacilitatorCategories } =
  await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
const contracts = JSON.parse(await readFile(new URL("../src/lib/dashboard/contracts.json", import.meta.url), "utf8"));
const operations = JSON.parse(await readFile(new URL("../src/lib/dashboard/operations.json", import.meta.url), "utf8"));
const category = { id: "yoga-id", name: "Yoga", slug: "yoga", version: 1, displayOrder: 0, status: "ACTIVE", archivedAt: null, appliesTo: ["COURSE", "CLASS", "SESSION", "PRODUCT", "MEDITATION", "BLOG"] };

test("List, detail, create, edit and delete remain protected facilitator endpoints", () => {
  for (const [method, path] of [["GET", "facilitator/categories"], ["POST", "facilitator/categories"], ["GET", "facilitator/categories/:id"], ["PATCH", "facilitator/categories/:id"], ["DELETE", "facilitator/categories/:id"], ["GET", "facilitator/dashboard"], ["GET", "facilitator/profile"]]) {
    assert.equal(contracts.find((item) => item.method === method && item.pattern === path)?.role, "FACILITATOR");
  }
});

test("Category mutation payloads trim names and reasons and match documented fields", () => {
  for (const [method, expected] of [
    ["POST", { name: "YOGA", reason: "Organise courses" }],
    ["PATCH", { name: "YOGA", reason: "Organise courses", version: 1 }],
    ["DELETE", { reason: "Organise courses", version: 1 }],
  ]) {
    const body = categoryMutationBody(method, { name: " YOGA ", reason: " Organise courses ", slug: "ignored", status: "ignored" }, category, category);
    assert.deepEqual(body, expected);
    const operation = operations.find((item) => item.method === method && item.path === (method === "POST" ? "facilitator/categories" : "facilitator/categories/{{categoryId}}"));
    assert.deepEqual(Object.keys(body).sort(), Object.keys(operation.fields).sort());
  }
});

test("Blank names, blank reasons and stale versions are rejected before sending a mutation", () => {
  assert.throws(() => categoryMutationBody("POST", { name: " ", reason: "Valid" }), /name/);
  assert.throws(() => categoryMutationBody("DELETE", { reason: " " }, category, category), /reason/);
  for (const method of ["PATCH", "DELETE"]) {
    assert.throws(() => categoryMutationBody(method, { name: "Yoga", reason: "Update" }, category, { ...category, version: 2 }), (error) => error.status === 409);
    assert.throws(() => categoryMutationBody(method, { name: "Yoga", reason: "Update" }, category, { version: null }), /version/);
  }
});

test("Content forms only offer active, unarchived categories applicable to that content", () => {
  const inactive = { ...category, id: "inactive", status: "INACTIVE" };
  const archived = { ...category, id: "archived", archivedAt: "2026-10-10T06:39:04.648Z" };
  const blogOnly = { ...category, id: "blog", appliesTo: ["BLOG"] };
  assert.deepEqual(availableCategories([inactive, category, archived, blogOnly], "COURSE"), [category]);
  assert.equal(availableCategories([category, blogOnly], "BLOG").length, 2);
});

test("Form choices include categories beyond page one and reject incomplete responses", async () => {
  const paths = [];
  const rows = await loadFacilitatorCategories(async (path) => {
    paths.push(path);
    return { success: true, data: path.includes("page=1") ? [] : [category], pagination: { pages: 2 } };
  });
  assert.deepEqual(rows, [category]);
  assert.deepEqual(paths, ["facilitator/categories?page=1&limit=20", "facilitator/categories?page=2&limit=20"]);
  await assert.rejects(loadFacilitatorCategories(async () => ({ data: null })), /could not be loaded/);
});
