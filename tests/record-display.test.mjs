import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const helper = await import("data:text/javascript;base64," + Buffer.from(fs.readFileSync("src/lib/record-display.js", "utf8")).toString("base64"));

test("Customer details hide internal fields and public views only show relevant facts", () => {
  const record = { title: "Practice", regularPrice: 0, enabled: false, version: 2, courseId: "internal", language: { id: "internal", name: "Hindi" }, metadata: { provider: "internal" }, arbitraryBackendField: "debug" };
  const fields = helper.recordFields(record);
  assert.ok(!fields.some(field => /version|courseId|metadata|language.id/.test(field.key)));
  assert.equal(fields.find(field => field.key === "enabled").value, false);
  const publicFields = helper.recordFields(record, { publicView: true });
  assert.deepEqual(publicFields.map(field => field.key), ["title", "regularPrice", "language.name"]);
  assert.equal(publicFields.find(field => field.key === "regularPrice").value, 0);
});

test("Images handle backend thumbnail URLs, media IDs, full image arrays and populated file descriptors", () => {
  const assets = helper.recordMedia({ title: "Course", thumbnail: "https://cdn.test/thumbnail.png", imageMediaId: "6accacf33d47adf5350347c3", images: ["https://cdn.test/first.png", { url: "https://cdn.test/second.png", altText: "Second" }] });
  assert.equal(assets.length, 4); assert.equal(assets[0].kind, "IMAGE");
  assert.equal(assets[1].id, "6accacf33d47adf5350347c3"); assert.equal(assets[3].alt, "Second");
  assert.equal(helper.recordMedia({ thumbnail: "https://cdn.test/image.png", imageUrl: "https://cdn.test/image.png" }).length, 1);
  assert.equal(helper.recordMedia({ thumbnail: "6accacf33d47adf5350347c3" })[0].id, "6accacf33d47adf5350347c3");
});

test("Audio/video/document types follow actual returned fields and MIME metadata", () => {
  const assets = helper.recordMedia({ audioUrl: "https://cdn.test/practice.mp3", videoUrl: "https://cdn.test/class.mp4", attachments: [{ mediaId: "document", kind: "DOCUMENT", title: "Workbook" }] });
  assert.deepEqual(assets.map(asset => asset.kind), ["VIDEO", "AUDIO", "DOCUMENT"]);
  assert.equal(helper.recordMedia({ contentType: "AUDIO", fileUrl: "https://cdn.test/file" })[0].kind, "AUDIO");
  assert.equal(helper.recordMedia({ audioUrl: "https://cdn.test/audio.mp3", thumbnail: "/images/cover.png" }, { imagesOnly: true }).length, 1);
});

test("Uploaded blog covers and product images resolve to usable public image sources", () => {
  const id = "6ad0b48d3d47adf5350349a4";
  const cover = helper.recordMedia({ featuredImageMediaId: id, featuredImage: `/api/v1/public/media/${id}/file` }, { imagesOnly: true });
  assert.equal(cover.length, 1);
  assert.equal(cover[0].source, `/api/public/files/media/${id}/file`);
  assert.equal(helper.recordMedia({ thumbnailUrl: "https://cdn.test/blog.png" }, { imagesOnly: true })[0].source, "https://cdn.test/blog.png");
  assert.equal(helper.recordMedia({ images: ["https://cdn.test/product.png"] }, { imagesOnly: true })[0].source, "https://cdn.test/product.png");
});

test("Private media never renders in public views and facilitator previews request fresh grants", () => {
  const record = { images: [{ id: "private-image", kind: "IMAGE", mimeType: "image/png", status: "ACTIVE", visibility: "PRIVATE", publicPath: null }] };
  assert.equal(helper.recordMedia(record).length, 0);
  const own = helper.recordMedia(record, { scope: "facilitator" });
  assert.equal(own[0].id, "private-image"); assert.equal(own[0].protected, true); assert.equal(own[0].source, "");
  assert.equal(helper.recordMedia({ videoUrl: "/api/v1/media/video/file?token=old" }).length, 0);
  const privateUrl = helper.recordMedia({ videoUrl: "/api/v1/media/video/file?token=old" }, { scope: "facilitator" });
  assert.equal(privateUrl[0].protected, true); assert.equal(privateUrl[0].source, "");
});

test("Unsafe sources, stale media and unrelated application document IDs are not rendered as media", () => {
  assert.deepEqual(helper.recordMedia({ thumbnail: "javascript:alert(1)", videoUrl: "data:text/html,bad", image: "//evil.test/file", images: [{ id: "archived", kind: "IMAGE", mimeType: "image/png", status: "ARCHIVED" }] }), []);
  assert.deepEqual(helper.recordMedia({ documents: [{ id: "application-document-id", title: "Identity", kind: "IDENTITY" }] }), []);
  assert.equal(helper.displayMediaUrl("https://user:password@cdn.test/a.png"), "");
  assert.equal(helper.displayMediaUrl("https://cdn.test/a.png?token=secret"), "");
});

test("Public and learner file URLs normalize to their existing authorized streaming routes", () => {
  assert.equal(helper.displayMediaUrl("https://backend.test/api/v1/public/media/image/file"), "/api/public/files/media/image/file");
  assert.equal(helper.displayMediaUrl("/api/v1/meditation/files/entitlement/file?token=grant", "learner"), "/api/account/meditation/files/entitlement/file?token=grant");
  assert.equal(helper.displayMediaUrl("/api/v1/learning/files/enrollment/lesson?token=grant"), "");
});

test("Structured details retain zeros/false/nested arrays and omit credentials and private public-view fields", () => {
  const record = { regularPrice: 0, enabled: false, language: { name: "Hindi" }, learningOutcomes: ["First", "Second"], accessToken: "secret", nested: { passwordHash: "hash", csrfToken: "csrf", note: "Keep" }, meetingUrl: "https://meet.test/private", ownerId: "owner", email: "private@test", thumbnail: "/images/a.png", signed: "https://file.test/a?token=secret" };
  const rows = helper.recordFields(record);
  assert.equal(rows.find(row => row.key === "regularPrice").value, 0);
  assert.equal(rows.find(row => row.key === "enabled").value, false);
  assert.equal(rows.find(row => row.key === "language.name").value, "Hindi");
  assert.equal(rows.filter(row => row.key.startsWith("learningOutcomes.")).length, 2);
  assert.ok(!rows.some(row => /token|password|thumbnail|signed/i.test(row.key)));
  const publicRows = helper.recordFields(record, { publicView: true });
  assert.ok(!publicRows.some(row => ["meetingUrl", "ownerId", "email"].includes(row.key)));
});
