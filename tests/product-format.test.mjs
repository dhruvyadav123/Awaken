import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const { formatProductPrice } = await import("data:text/javascript;base64," + Buffer.from(fs.readFileSync("src/lib/product-format.js", "utf8")).toString("base64"));

test("Prices require an actual amount and currency while preserving real zero prices", () => {
  for (const price of [undefined, null, "", "  ", false, [], "invalid", Infinity]) {
    assert.equal(formatProductPrice({ price, currency: "INR" }), "");
  }
  assert.equal(formatProductPrice({ price: 200 }), "");
  assert.equal(formatProductPrice({ price: 200, currency: "invalid" }), "");
  assert.match(formatProductPrice({ price: 0, currency: "INR" }), /0\.00/);
  assert.match(formatProductPrice({ regularPrice: 200, discountPrice: 0, currency: "INR" }), /0\.00/);
  assert.match(formatProductPrice({ price: "200", currency: "INR" }), /200\.00/);
});
