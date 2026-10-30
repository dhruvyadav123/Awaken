import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = (text) => import("data:text/javascript;base64," + Buffer.from(text).toString("base64"));
const cartSource = fs.readFileSync("src/lib/cart.js", "utf8").replace(/^import .*;\r?\n/gm, "");
let instance = 0;
async function cartModule(request) {
  globalThis.__performanceCartRequest = request;
  return source("const accountFetch=(...args)=>globalThis.__performanceCartRequest(...args); const requiredVersion=value=>{if(!Number.isSafeInteger(value)||value<0)throw Error('Invalid version');return value;};\n" + cartSource + "\n// instance " + ++instance);
}

test("Simultaneous cart readers share one request and sequential adds reuse confirmed versions", async () => {
  const previous = globalThis.window;
  globalThis.window = { localStorage: { setItem() {} }, dispatchEvent() {} };
  const calls = [];
  let version = 3;
  const items = [];
  try {
    const cart = await cartModule(async (path, options = {}) => {
      calls.push({ path, options });
      if (options.method === "POST") { assert.equal(options.body.version, version); version++; items.push({ productId: options.body.productId, quantity: 1 }); }
      await new Promise((resolve) => setTimeout(resolve, 5));
      return { success: true, data: { version, items: [...items] } };
    });
    await Promise.all([cart.refreshCart(), cart.refreshCart(), cart.refreshCart()]);
    assert.equal(calls.length, 1);
    await Promise.all([cart.addProductToCart("first"), cart.addProductToCart("second")]);
    assert.deepEqual(calls.map(({ options }) => options.method || "GET"), ["GET", "POST", "POST"]);
    assert.deepEqual(calls.slice(1).map(({ options }) => options.body.version), [3, 4]);
    assert.equal(cart.readCartSnapshot().version, 5);
  } finally { globalThis.window = previous; delete globalThis.__performanceCartRequest; }
});

test("Only an explicit cart version conflict retries a mutation; uncertain writes never repeat", async () => {
  const previous = globalThis.window;
  globalThis.window = { localStorage: { setItem() {} }, dispatchEvent() {} };
  const calls = [];
  let version = 4;
  let conflict = true;
  let ambiguous = false;
  try {
    const cart = await cartModule(async (path, options = {}) => {
      calls.push(options.method || "GET");
      if (options.method === "POST") {
        if (ambiguous) throw Object.assign(new Error("Connection lost"), { status: 502 });
        if (conflict) { conflict = false; version = 8; throw Object.assign(new Error("Cart changed"), { code: "CART_VERSION_CONFLICT", status: 409 }); }
        assert.equal(options.body.version, version); version++;
      }
      return { success: true, data: { version, items: [] } };
    });
    await cart.addProductToCart("product");
    assert.deepEqual(calls, ["GET", "POST", "GET", "POST"]);
    ambiguous = true;
    await assert.rejects(cart.addProductToCart("other"), /Connection lost/);
    assert.equal(calls.filter((method) => method === "POST").length, 3);
  } finally { globalThis.window = previous; delete globalThis.__performanceCartRequest; }
});

test("Private reads are deduplicated only while in flight and are fetched again afterward", async () => {
  const previousFetch = globalThis.fetch;
  const previousDocument = globalThis.document;
  globalThis.document = { cookie: "awm-csrf-token=session-one" };
  let calls = 0;
  try {
    const client = await source(fs.readFileSync("src/lib/client-account.js", "utf8"));
    globalThis.fetch = async () => { calls++; await new Promise((resolve) => setTimeout(resolve, 5)); return Response.json({ success: true, data: { id: "learner" } }); };
    await Promise.all([client.accountFetch("auth/me"), client.accountFetch("auth/me")]);
    assert.equal(calls, 1);
    await client.accountFetch("auth/me");
    assert.equal(calls, 2);
    await Promise.all([client.accountFetch("me/courses/course/lessons/one/progress", { method: "POST", body: {} }), client.accountFetch("me/courses/course/lessons/one/progress", { method: "POST", body: {} })]);
    assert.equal(calls, 4, "Mutations must never be combined");
  } finally { globalThis.fetch = previousFetch; globalThis.document = previousDocument; }
});
