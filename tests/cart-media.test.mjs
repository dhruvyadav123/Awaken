import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const helper = await import(
  "data:text/javascript;base64," +
    Buffer.from(fs.readFileSync("src/lib/cart-media.js", "utf8")).toString("base64")
);

test("Cart media resolves nested course URLs and media IDs", () => {
  const record = helper.cartMediaRecord({
    itemType: "COURSE",
    courseId: "course-1",
    course: {
      title: "Dive Into Parenting – DIP",
      thumbnail: "https://cdn.test/dip.png",
    },
  });

  assert.equal(record.thumbnail, "https://cdn.test/dip.png");
});

test("Cart media resolves product snapshots and course-specific aliases", () => {
  const record = helper.cartMediaRecord({
    itemType: "PRODUCT",
    snapshot: { name: "Course purchase", courseThumbnailMediaId: "6ad0b48d3d47adf5350349a4" },
  });

  assert.equal(record.thumbnailMediaId, "6ad0b48d3d47adf5350349a4");
});
