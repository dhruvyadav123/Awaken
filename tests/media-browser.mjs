import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

// Isolated browser fixtures intercept every account request. No live account,
// provider upload, resource mutation or database write is performed here.
const origin = "http://127.0.0.1:3198";
const profile = await fs.mkdtemp(path.join(os.tmpdir(), "awaken-facilitator-media-"));
const artifacts = path.resolve("artifacts/media-flow"); await fs.mkdir(artifacts, { recursive: true });
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6cWQAAAAASUVORK5CYII=", "base64");
const video = await fs.readFile("public/videos/forest-mobile.mp4");
const wav = Buffer.alloc(4044);
wav.write("RIFF"); wav.writeUInt32LE(wav.length - 8, 4); wav.write("WAVEfmt ", 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write("data", 36); wav.writeUInt32LE(4000, 40);
const records = [
  { id: "public-first", title: "First image", kind: "IMAGE", originalName: "first.png", mimeType: "image/png", status: "ACTIVE", visibility: "PUBLIC", version: 1, size: 12, publicPath: "/fixtures/first.png" },
  { id: "public-second", title: "Second image", kind: "IMAGE", originalName: "second.png", mimeType: "image/png", status: "ACTIVE", visibility: "PUBLIC", version: 1, size: 12, publicPath: "/fixtures/second.png" },
];
const products = []; const calls = []; const errors = [];
let role = "FACILITATOR", denyUpload = false, server, browser, socket, send;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function fulfill(event, status, body, type = "application/json") {
  await send("Fetch.fulfillRequest", { requestId: event.requestId, responseCode: status, responseHeaders: [{ name: "Content-Type", value: type }, { name: "Cache-Control", value: "private, no-store" }], body: (Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body))).toString("base64") });
}
async function handle(event) {
  const { request } = event; const url = new URL(request.url);
  if (url.pathname === "/fixtures/media-video.mp4") return fulfill(event, 200, video, "video/mp4");
  if (url.pathname === "/fixtures/media-audio.wav") return fulfill(event, 200, wav, "audio/wav");
  if (url.pathname.startsWith("/fixtures/")) return fulfill(event, 200, png, "image/png");
  if (!url.pathname.startsWith("/api/")) return send("Fetch.continueRequest", { requestId: event.requestId });
  const route = url.pathname.replace(/^\/api\/account\//, "");
  if (route === "auth/me") return fulfill(event, 200, { success: true, data: { id: "test-facilitator", role, name: "Fixture facilitator" } });
  if (url.pathname === "/api/navigation/facilitators") return fulfill(event, 200, { success: true, data: [] });
  calls.push({ route, method: request.method, body: request.postData, headers: request.headers });
  if (request.method !== "GET") assert.equal(request.headers["x-csrf-token"] || request.headers["X-Csrf-Token"], "browser-csrf", route);
  assert.ok(!request.headers.Authorization && !request.headers.authorization, "Browser must not expose a bearer token");
  if (route === "media") return fulfill(event, 200, { success: true, data: records, pagination: { page: 1, limit: 20, total: records.length, pages: 1 } });
  if (route.startsWith("media/uploads/")) {
    if (denyUpload) return fulfill(event, 403, { success: false, message: "Upload permission denied" });
    const kind = route.split("/").at(-1); assert.ok(["IMAGE", "AUDIO", "VIDEO", "DOCUMENT"].includes(kind));
    assert.match(request.headers["Content-Type"] || request.headers["content-type"], /^multipart\/form-data; boundary=/);
    const record = { id: "uploaded-" + kind, title: "Uploaded " + kind, originalName: { IMAGE: "test.png", DOCUMENT: "test.pdf", AUDIO: "test.mp3", VIDEO: "test.mp4" }[kind], kind,
      mimeType: { IMAGE: "image/png", DOCUMENT: "application/pdf", AUDIO: "audio/mpeg", VIDEO: "video/mp4" }[kind], status: "ACTIVE", visibility: "PRIVATE", publicPath: null, version: 1, size: 12 };
    records.push(record); return fulfill(event, 201, { success: true, data: record });
  }
  const match = route.match(/^media\/([^/]+)(?:\/(access-link|file))?$/);
  if (match) {
    const item = records.find(record => record.id === match[1]); assert.ok(item, "Requested media exists");
    if (match[2] === "access-link") return fulfill(event, 200, { success: true, data: { token: "private-grant" } });
    if (match[2] === "file") { assert.equal(url.searchParams.get("token"), "private-grant"); return fulfill(event, 200, item.kind === "IMAGE" ? png : Buffer.from("%PDF-1.4 fixture"), item.mimeType); }
    if (request.method === "PATCH") { const body = JSON.parse(request.postData); assert.equal(body.version, item.version); assert.deepEqual(Object.keys(body).sort(), ["title", "version"]); Object.assign(item, body, { version: item.version + 1 }); }
    if (request.method === "DELETE") { const body = JSON.parse(request.postData); assert.equal(body.version, item.version); assert.ok(body.reason); records.splice(records.indexOf(item), 1); return fulfill(event, 200, { success: true, data: null }); }
    return fulfill(event, 200, { success: true, data: item });
  }
  if (route === "facilitator/categories") return fulfill(event, 200, { success: true, data: [{ id: "category", name: "Teaching", status: "ACTIVE", appliesTo: ["PRODUCT"] }], pagination: { pages: 1 } });
  if (route === "facilitator/products") {
    if (request.method === "POST") {
      const body = JSON.parse(request.postData); assert.deepEqual(body.images, ["/fixtures/second.png"]); assert.ok(!("mediaId" in body));
      const product = { ...body, id: "product-test", shortDescription: "Test description", version: 1, status: "DRAFT" }; products.push(product);
      return fulfill(event, 201, { success: true, data: product });
    }
    return fulfill(event, 200, { success: true, data: products, pagination: { pages: 1 } });
  }
  if (route === "facilitator/products/product-test") return fulfill(event, 200, { success: true, data: products[0] });
  if (["facilitator/products/product-test/variants", "facilitator/products/product-test/inventory"].includes(route)) return fulfill(event, 200, { success: true, data: [] });
  if (route === "me/dashboard") return fulfill(event, 200, { success: true, data: {} });
  throw new Error("Unexpected API request: " + request.method + " " + url.pathname);
}

try {
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3198", "-H", "127.0.0.1"], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  let serverOutput = ""; server.stdout.on("data", data => { serverOutput += data; }); server.stderr.on("data", data => { serverOutput += data; });
  for (let i = 0; i < 100; i++) { if (serverOutput.includes("Ready")) break; if (server.exitCode !== null) throw new Error(serverOutput); await delay(150); }
  browser = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=9238", "--user-data-dir=" + profile, "about:blank"], { windowsHide: true, stdio: "ignore" });
  let target;
  for (let i = 0; i < 100; i++) { try { target = (await (await fetch("http://127.0.0.1:9238/json/list")).json()).find(item => item.type === "page"); if (target) break; } catch {} await delay(150); }
  assert.ok(target, "Edge started"); socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let sequence = 0; const pending = new Map();
  send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence; const timeout = setTimeout(() => { pending.delete(id); reject(new Error("CDP timeout: " + method)); }, 30000);
    pending.set(id, { resolve, reject, timeout }); socket.send(JSON.stringify({ id, method, params }));
  });
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.id) { const item = pending.get(message.id); if (item) { pending.delete(message.id); clearTimeout(item.timeout); if (message.error) item.reject(new Error(message.error.message)); else item.resolve(message.result); } }
    if (message.method === "Fetch.requestPaused") handle(message.params).catch(error => { errors.push(error.message); void send("Fetch.failRequest", { requestId: message.params.requestId, errorReason: "Failed" }); });
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  });
  await send("Runtime.enable"); await send("Page.enable"); await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/*" }, { urlPattern: "*/fixtures/*" }] });
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Network.setCookie", { name: "awm-csrf-token", value: "browser-csrf", url: origin, path: "/" });
  async function evaluate(expression) { const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; }
  async function wait(expression) { for (let i = 0; i < 200; i++) { assert.deepEqual(errors, []); if (await evaluate(`Boolean(document.body && (${expression}))`)) return; await delay(150); } throw new Error("Timed out: " + expression); }
  async function click(text) { await wait(`[...document.querySelectorAll('button')].some(el=>el.textContent.trim()===${JSON.stringify(text)}&&!el.disabled)`); await evaluate(`[...document.querySelectorAll('button')].find(el=>el.textContent.trim()===${JSON.stringify(text)}&&!el.disabled).click()`); }
  async function fill(label, value) { await evaluate(`(()=>{const el=[...document.querySelectorAll('label')].find(el=>el.firstChild?.textContent.trim()===${JSON.stringify(label)}).querySelector('input,textarea,select');const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`); }
  async function view(title) { await wait(`[...document.querySelectorAll('li h3')].some(el=>el.textContent===${JSON.stringify(title)})`); await evaluate(`[...document.querySelectorAll('li h3')].find(el=>el.textContent===${JSON.stringify(title)}).closest('li').querySelector('button').click()`); }
  const navigate = route => send("Page.navigate", { url: origin + route });
  await navigate("/dashboard/facilitator/media"); await wait("document.body.innerText.includes('First image')");
  for (const [kind, filename, mime] of [["IMAGE", "test.png", "image/png"], ["DOCUMENT", "test.pdf", "application/pdf"], ["AUDIO", "test.mp3", "audio/mpeg"], ["VIDEO", "test.mp4", "video/mp4"]]) {
    await fill("Media type", kind); await fill("Media title", "Uploaded " + kind);
    await evaluate(`(()=>{const input=document.querySelector('input[type=file]');const data=new DataTransfer();data.items.add(new File([new Uint8Array(${JSON.stringify([...png])})],${JSON.stringify(filename)},{type:${JSON.stringify(mime)}}));input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await click("Upload file"); await wait(`document.querySelector('progress')?.value===100&&document.body.innerText.includes(${JSON.stringify("Uploaded " + kind)})`);
  }
  assert.equal(calls.filter(call => call.route.startsWith("media/uploads/")).length, 4);
  await view("Uploaded IMAGE"); await wait("document.body.innerText.includes('Media details')"); await click("Preview / download");
  await wait("document.querySelector('img[src*=\"/api/account/media/uploaded-IMAGE/file\"]')?.naturalWidth>0");
  await view("Uploaded DOCUMENT"); await wait("document.querySelector('a')&&document.body.innerText.includes('test.pdf')"); await click("Preview / download");
  await wait("document.querySelector('a[href*=\"/api/account/media/uploaded-DOCUMENT/file?token=private-grant\"]')");
  await evaluate("[...document.querySelectorAll('li h3')].find(el=>el.textContent==='Uploaded DOCUMENT').closest('li').querySelectorAll('button')[1].click()"); await wait("document.querySelector('[role=dialog]')");
  const editingId = calls.filter(call => call.route.match(/^media\/[^/]+$/) && call.method === "GET").at(-1).route.split("/")[1];
  records.find(record => record.id === editingId).version++;
  await fill("Title", "Renamed media"); await click("Save changes"); await wait("!document.querySelector('[role=dialog]')&&document.body.innerText.includes('Renamed media')");
  await send("Page.reload"); await wait("document.body.innerText.includes('Renamed media')");
  await fs.writeFile(path.join(artifacts, "library-desktop.png"), Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64"));

  await navigate("/dashboard/facilitator/products"); await click("+ Create product"); await wait("document.querySelector('[role=dialog]')");
  await wait("document.querySelector('option[value=category]')");
  await fill("Name", "Browser product"); await fill("Product Type", "PHYSICAL"); await fill("Sku", "TEST"); await fill("Category", "category");
  await fill("Description", "Fixture product"); await fill("Regular price", "100"); await fill("Currency", "INR"); await fill("Stock Quantity", "1"); await fill("Reason for this change", "Browser check");
  await click("Select / upload image"); await view("Uploaded IMAGE"); await wait("document.body.innerText.includes('This image is private')");
  assert.equal(await evaluate("[...document.querySelectorAll('button')].find(el=>el.textContent==='Select image').disabled"), true);
  await view("First image"); await click("Select image"); await wait("document.querySelector('textarea')?.value!==undefined&&document.body.innerText.includes('/fixtures/first.png')");
  await click("Remove selection"); assert.equal(calls.filter(call => call.method === "DELETE").length, 0);
  await click("Select / upload image"); await view("Second image"); await click("Select image"); await click("Save changes");
  await wait("!document.querySelector('[role=dialog]')&&document.body.innerText.includes('Browser product')"); assert.deepEqual(products[0].images, ["/fixtures/second.png"]);
  await navigate("/dashboard/facilitator/products/product-test"); await click("Edit details"); await wait("document.querySelector('[role=dialog]')&&document.body.innerText.includes('/fixtures/second.png')");
  assert.equal(await evaluate("!![...document.querySelectorAll('[role=dialog] button')].find(el=>el.textContent.includes('Select / upload image'))"), false, "No guessed image PATCH field");
  await click("Cancel"); await send("Page.reload"); await click("Edit details"); await wait("document.body.innerText.includes('/fixtures/second.png')"); await click("Cancel");

  // The same display component used on public/detail pages must render every
  // returned media type and additional scalar/nested fields without credentials.
  Object.assign(products[0], { images: ["/fixtures/first.png", "/fixtures/second.png"], videoUrl: "/fixtures/media-video.mp4", audioUrl: "/fixtures/media-audio.wav",
    attachments: [{ mediaId: "uploaded-DOCUMENT", kind: "DOCUMENT", title: "Workbook" }], thumbnailMediaId: "uploaded-IMAGE", availableQuantity: 0, featured: false,
    attributes: { format: "Paperback" }, accessToken: "do-not-display" });
  await send("Page.reload"); await wait("document.querySelectorAll('.api-media-gallery:not(.is-compact) img').length>=3");
  await wait("document.querySelector('.api-media-gallery video')?.readyState>=1&&document.querySelector('.api-media-gallery audio')?.readyState>=1");
  await wait("document.querySelector('img[src*=\"uploaded-IMAGE/file\"]')?.naturalWidth>0");
  await evaluate("document.querySelector('.api-record-details').open=true");
  assert.equal(await evaluate("[...document.querySelectorAll('.api-record-details dt')].find(el=>el.textContent==='Available Quantity').nextElementSibling.textContent"), "0");
  assert.equal(await evaluate("[...document.querySelectorAll('.api-record-details dt')].find(el=>el.textContent==='Featured').nextElementSibling.textContent"), "No");
  assert.ok(await evaluate("document.body.innerText.includes('Paperback')&&!document.body.innerText.includes('do-not-display')"));
  const documentAsset = await evaluate("[...document.querySelectorAll('.api-media-asset')].find(el=>el.textContent.includes('Workbook')).textContent");
  assert.ok(documentAsset.includes("Load file preview"));
  await evaluate("[...document.querySelectorAll('.api-media-asset')].find(el=>el.textContent.includes('Workbook')).querySelector('button').click()");
  await wait("document.querySelector('.api-media-gallery a[href*=\"uploaded-DOCUMENT/file?token=private-grant\"]')");
  await fs.writeFile(path.join(artifacts, "product-media-display.png"), Buffer.from((await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true })).data, "base64"));
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await delay(300);
  assert.ok(await evaluate("document.documentElement.scrollWidth<=window.innerWidth"), "Product gallery/details fit mobile");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

  await navigate("/dashboard/facilitator/media"); await wait("document.body.innerText.includes('Renamed media')");
  await evaluate("[...document.querySelectorAll('li h3')].find(el=>el.textContent==='Renamed media').closest('li').querySelectorAll('button')[2].click()");
  await wait("document.querySelector('[role=dialog]')"); await fill("Reason for this change", "Remove fixture"); await click("Confirm removal"); await wait("document.body.innerText.includes('Media deleted.')&&!document.querySelector('[role=dialog]')");
  assert.ok(!records.some(record => record.title === "Renamed media"));
  denyUpload = true; await fill("Media type", "DOCUMENT"); await fill("Media title", "Denied upload");
  await evaluate("(()=>{const input=document.querySelector('input[type=file]');const data=new DataTransfer();data.items.add(new File(['%PDF-1.4'],'test.pdf',{type:'application/pdf'}));input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()");
  await click("Upload file"); await wait("document.body.innerText.includes('Upload permission denied')");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await send("Page.reload"); await wait("document.body.innerText.includes('First image')"); await delay(300);
  assert.ok(await evaluate("document.documentElement.scrollWidth<=window.innerWidth"), "Media page fits mobile");
  await fs.writeFile(path.join(artifacts, "library-mobile.png"), Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64"));
  const before = calls.filter(call => call.route.startsWith("media")).length; role = "USER"; await send("Page.reload"); await wait("location.pathname==='/dashboard/user'");
  assert.equal(calls.filter(call => call.route.startsWith("media")).length, before, "Learner cannot request media library");
  assert.deepEqual(errors, []);
  console.log("Media browser checks passed: four uploads, private access, rename/reload, reuse/save/edit display, image gallery, video/audio players, documents, nested/zero/false details, credential filtering, deletion, permissions and desktop/mobile.");
} catch (error) {
  if (send) { try { console.error((await send("Runtime.evaluate", { expression: "document.body.innerText", returnByValue: true })).result.value); } catch {} }
  throw error;
} finally {
  if (send) { try { await send("Browser.close"); } catch {} } socket?.close();
  if (browser?.exitCode === null) browser.kill(); if (server?.exitCode === null) server.kill();
  const resolved = path.resolve(profile), root = path.resolve(os.tmpdir());
  if (resolved.startsWith(root + path.sep + "awaken-facilitator-media-")) {
    for (let i = 0; i < 10; i++) { try { await fs.rm(resolved, { recursive: true, force: true }); break; } catch { await delay(250); } }
  }
}
