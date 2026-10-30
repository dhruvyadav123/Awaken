import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { createServer } from "node:http";

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
  { id: "bbbbbbbbbbbbbbbbbbbbbbb1", title: "First image", kind: "IMAGE", originalName: "first.png", mimeType: "image/png", status: "ACTIVE", visibility: "PUBLIC", version: 1, size: 12, publicPath: "/api/v1/public/media/bbbbbbbbbbbbbbbbbbbbbbb1/file" },
  { id: "bbbbbbbbbbbbbbbbbbbbbbb2", title: "Second image", kind: "IMAGE", originalName: "second.png", mimeType: "image/png", status: "ACTIVE", visibility: "PUBLIC", version: 1, size: 12, publicPath: "/api/v1/public/media/bbbbbbbbbbbbbbbbbbbbbbb2/file" },
];
const firstPath = records[0].publicPath, secondPath = records[1].publicPath;
const firstHref = firstPath.replace("/api/v1/public/", "/api/public/files/"), secondHref = secondPath.replace("/api/v1/public/", "/api/public/files/");
const products = [], courses = [], classes = []; const calls = []; const errors = [];
const uploadedIds = { IMAGE: "aaaaaaaaaaaaaaaaaaaaaaa1", DOCUMENT: "aaaaaaaaaaaaaaaaaaaaaaa2", AUDIO: "aaaaaaaaaaaaaaaaaaaaaaa3", VIDEO: "aaaaaaaaaaaaaaaaaaaaaaa4" };
const pickerUploadId = "aaaaaaaaaaaaaaaaaaaaaaa5";
let role = "FACILITATOR", denyUpload = false, server, browser, socket, send, publicBackend;
const watchdog = setTimeout(() => { console.error("Media browser test exceeded 4 minutes."); browser?.kill(); server?.kill(); publicBackend?.closeAllConnections(); publicBackend?.close(); process.exitCode = 1; }, 240000);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function fulfill(event, status, body, type = "application/json") {
  await send("Fetch.fulfillRequest", { requestId: event.requestId, responseCode: status, responseHeaders: [{ name: "Content-Type", value: type }, { name: "Cache-Control", value: "private, no-store" }], body: (Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body))).toString("base64") });
}
async function handle(event) {
  const { request } = event; const url = new URL(request.url);
  if (url.pathname === "/fixtures/media-video.mp4") return fulfill(event, 200, video, "video/mp4");
  if (url.pathname === "/fixtures/media-audio.wav") return fulfill(event, 200, wav, "audio/wav");
  if (url.pathname.startsWith("/fixtures/")) return fulfill(event, 200, png, "image/png");
  if (url.pathname.startsWith("/api/public/files/media/")) return fulfill(event, 200, png, "image/png");
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
    const record = { id: records.some(item => item.id === uploadedIds[kind]) ? pickerUploadId : uploadedIds[kind], title: "Uploaded " + kind, originalName: { IMAGE: "test.png", DOCUMENT: "test.pdf", AUDIO: "test.mp3", VIDEO: "test.mp4" }[kind], kind,
      mimeType: { IMAGE: "image/png", DOCUMENT: "application/pdf", AUDIO: "audio/mpeg", VIDEO: "video/mp4" }[kind], status: "ACTIVE", visibility: "PRIVATE", publicPath: null, version: 1, size: 12 };
    records.push(record); return fulfill(event, 201, { success: true, data: record });
  }
  const match = route.match(/^media\/([^/]+)(?:\/(access-link|file))?$/);
  if (match) {
    const item = records.find(record => record.id === match[1]); assert.ok(item, "Requested media exists");
    if (match[2] === "access-link") return fulfill(event, 200, { success: true, data: { path: `/api/v1/media/${item.id}/file?token=private-grant`, expiresAt: "2099-01-01T00:00:00.000Z", expiresIn: 300 } });
    if (match[2] === "file") { assert.equal(url.searchParams.get("token"), "private-grant"); return fulfill(event, 200, item.kind === "IMAGE" ? png : Buffer.from("%PDF-1.4 fixture"), item.mimeType); }
    if (request.method === "PATCH") { const body = JSON.parse(request.postData); assert.equal(body.version, item.version); assert.ok(["PUBLIC", "PRIVATE"].includes(body.visibility)); assert.deepEqual(Object.keys(body).sort(), ["title", "version", "visibility"]); Object.assign(item, body, { version: item.version + 1, publicPath: body.visibility === "PUBLIC" ? `/api/v1/public/media/${item.id}/file` : null }); }
    if (request.method === "DELETE") { const body = JSON.parse(request.postData); assert.equal(body.version, item.version); assert.ok(body.reason); records.splice(records.indexOf(item), 1); return fulfill(event, 200, { success: true, data: null }); }
    return fulfill(event, 200, { success: true, data: item });
  }
  if (route === "facilitator/categories") return fulfill(event, 200, { success: true, data: [{ id: "category", name: "Teaching", status: "ACTIVE", appliesTo: ["PRODUCT", "COURSE", "CLASS"] }], pagination: { pages: 1 } });
  if (route === "facilitator/languages" || route === "facilitator/levels") return fulfill(event, 200, { success: true, data: [{ id: "lookup", name: "Test option", status: "ACTIVE" }] });
  const resource = route.match(/^facilitator\/(courses|classes)(?:\/(picker-(?:course|class)))?$/);
  if (resource) {
    const collection = resource[1] === "courses" ? courses : classes;
    if (request.method === "POST") {
      const body = JSON.parse(request.postData);
      if (resource[1] === "classes") { assert.equal(body.thumbnailMediaId, records[1].id); assert.ok(!("thumbnail" in body)); }
      else { assert.equal(body.thumbnail, secondPath); assert.ok(!("thumbnailMediaId" in body)); }
      const record = { ...body, ...(resource[1] === "classes" ? { thumbnail: secondPath } : {}), id: resource[1] === "courses" ? "picker-course" : "picker-class", slug: resource[1] === "courses" ? body.slug : "picker-class", status: "DRAFT", version: 1 };
      collection.push(record); return fulfill(event, 201, { success: true, data: record });
    }
    return fulfill(event, 200, { success: true, data: resource[2] ? collection[0] : collection, pagination: { pages: 1 } });
  }
  if (/^facilitator\/courses\/picker-course\/(questions|quizzes|quiz-attempts)$/.test(route)) return fulfill(event, 200, { success: true, data: [] });
  if (route === "facilitator/products") {
    if (request.method === "POST") {
      const body = JSON.parse(request.postData); assert.deepEqual(body.images, [secondPath]); assert.ok(!("mediaId" in body));
      const product = { ...body, id: "product-test", shortDescription: "Test description", version: 1, status: "DRAFT" }; products.push(product);
      return fulfill(event, 201, { success: true, data: product });
    }
    return fulfill(event, 200, { success: true, data: products, pagination: { pages: 1 } });
  }
  if (route === "facilitator/products/product-test") return fulfill(event, 200, { success: true, data: products[0] });
  if (["facilitator/products/product-test/variants", "facilitator/products/product-test/inventory"].includes(route)) return fulfill(event, 200, { success: true, data: [] });
  if (route === "me/dashboard") return fulfill(event, 200, { success: true, data: {} });
  if (route === "me/entitlements") return fulfill(event, 200, { success: true, data: [] });
  if (route === "me/cart") return fulfill(event, 200, { success: true, data: { id: "test-cart", items: [], version: 1, currency: "INR", total: 0 } });
  throw new Error("Unexpected API request: " + request.method + " " + url.pathname);
}

try {
  console.log("Starting isolated media browser test...");
  // Public pages render on the Next server, so they read the same saved fixtures
  // from this test-only backend rather than contacting the production service.
  publicBackend = createServer((request, response) => {
    const pathname = new URL(request.url, "http://127.0.0.1").pathname;
    if (pathname.includes("/public/media/")) { response.writeHead(200, { "content-type": "image/png" }); response.end(png); return; }
    let data = [];
    for (const [name, collection] of [["courses", courses], ["classes", classes], ["products", products]]) {
      if (pathname === `/api/v1/public/${name}`) data = collection;
      if (pathname.startsWith(`/api/v1/public/${name}/`)) data = /\/(reviews|variants)$/.test(pathname) ? [] : collection[0] || null;
    }
    response.writeHead(200, { "content-type": "application/json" }); response.end(JSON.stringify({ success: true, data, pagination: { page: 1, pages: 1, total: Array.isArray(data) ? data.length : 1 } }));
  });
  await new Promise((resolve, reject) => { publicBackend.once("error", reject); publicBackend.listen(3197, "127.0.0.1", resolve); });
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3198", "-H", "127.0.0.1"], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, API_BASE_URL: "http://127.0.0.1:3197/api/v1" } });
  let serverOutput = ""; server.stdout.on("data", data => { serverOutput += data; }); server.stderr.on("data", data => { serverOutput += data; });
  for (let i = 0; i < 100; i++) { if (serverOutput.includes("Ready")) break; if (server.exitCode !== null) throw new Error(serverOutput); await delay(150); }
  browser = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=9238", "--user-data-dir=" + profile, "about:blank"], { windowsHide: true, stdio: "ignore" });
  let target;
  for (let i = 0; i < 100; i++) { try { target = (await (await fetch("http://127.0.0.1:9238/json/list", { signal: AbortSignal.timeout(1000) })).json()).find(item => item.type === "page"); if (target) break; } catch {} await delay(150); }
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
  async function click(text) { const buttons = "[...(document.querySelector('[role=dialog]')||document).querySelectorAll('button')]"; await wait(`${buttons}.some(el=>el.textContent.trim()===${JSON.stringify(text)}&&!el.disabled)`); await evaluate(`${buttons}.find(el=>el.textContent.trim()===${JSON.stringify(text)}&&!el.disabled).click()`); }
  async function fill(label, value) { await evaluate(`(()=>{const el=[...document.querySelectorAll('label')].find(el=>el.firstChild?.textContent.trim()===${JSON.stringify(label)}).querySelector('input,textarea,select');const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`); }
  async function view(title) { await wait(`[...document.querySelectorAll('li h3')].some(el=>el.textContent===${JSON.stringify(title)})`); await evaluate(`[...document.querySelectorAll('li h3')].find(el=>el.textContent===${JSON.stringify(title)}).closest('li').querySelector('button').click()`); }
  const navigate = route => send("Page.navigate", { url: origin + route });
  console.log("Checking uploads, private grants, and versioned media updates...");
  await navigate("/dashboard/facilitator/media"); await wait("document.body.innerText.includes('First image')");
  for (const [kind, filename, mime] of [["IMAGE", "test.png", "image/png"], ["DOCUMENT", "test.pdf", "application/pdf"], ["AUDIO", "test.mp3", "audio/mpeg"], ["VIDEO", "test.mp4", "video/mp4"]]) {
    await click("+ Upload media");
    await fill("Media type", kind); await fill("Media title", "Uploaded " + kind);
    await evaluate(`(()=>{const input=document.querySelector('input[type=file]');const data=new DataTransfer();data.items.add(new File([new Uint8Array(${JSON.stringify([...png])})],${JSON.stringify(filename)},{type:${JSON.stringify(mime)}}));input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await click("Upload file"); await wait(`!document.querySelector('input[type=file]')&&document.body.innerText.includes(${JSON.stringify("Uploaded " + kind)})`);
  }
  assert.equal(calls.filter(call => call.route.startsWith("media/uploads/")).length, 4);
  await view("Uploaded IMAGE"); await wait("document.body.innerText.includes('Media details')"); await click("Preview / download");
  await wait(`document.querySelector('img[src*="/api/account/media/${uploadedIds.IMAGE}/file"]')?.naturalWidth>0`);
  await view("Uploaded DOCUMENT"); await wait("document.querySelector('a')&&document.body.innerText.includes('test.pdf')"); await click("Preview / download");
  await wait(`document.querySelector('a[href*="/api/account/media/${uploadedIds.DOCUMENT}/file?token=private-grant"]')`);
    await view("Uploaded DOCUMENT"); await wait("document.body.innerText.includes('Media details')"); await click("Update media"); await wait("document.querySelector('[role=dialog]')");
  const editingId = calls.filter(call => call.route.match(/^media\/[^/]+$/) && call.method === "GET").at(-1).route.split("/")[1];
  records.find(record => record.id === editingId).version++;
    await fill("Title", "Renamed media"); await fill("Visibility", "PUBLIC"); await click("Update media"); await wait("!document.querySelector('[role=dialog]')&&document.body.innerText.includes('Renamed media')");
  await send("Page.reload"); await wait("document.body.innerText.includes('Renamed media')");
  await fs.writeFile(path.join(artifacts, "library-desktop.png"), Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64"));

  await navigate("/dashboard/facilitator/products"); await click("+ Create product"); await wait("document.querySelector('[role=dialog]')");
  await wait("document.querySelector('option[value=category]')");
  await fill("Name", "Browser product"); await fill("Product Type", "PHYSICAL"); await fill("Sku", "TEST"); await fill("Category", "category");
  await fill("Description", "Fixture product"); await fill("Regular price", "100"); await fill("Currency", "INR"); await fill("Stock Quantity", "1"); await fill("Reason for this change", "Browser check");
  console.log("Checking reusable picker and product persistence...");
  await click("Open media library"); await view("Uploaded IMAGE"); await wait("document.body.innerText.includes('This image is private')");
  assert.equal(await evaluate("[...document.querySelectorAll('button')].find(el=>el.textContent==='Select image').disabled"), true);
  await view("First image"); await click("Select image"); await wait(`document.querySelector('.ws-media-selections img[src="${firstHref}"]')?.naturalWidth>0`);
  await click("Remove selection"); assert.equal(calls.filter(call => call.method === "DELETE").length, 0);
  await click("Open media library"); await view("Second image"); await click("Select image"); await click("Save changes");
  await wait("!document.querySelector('[role=dialog]')&&document.body.innerText.includes('Browser product')"); assert.deepEqual(products[0].images, [secondPath]);
  await wait(`document.querySelector('td img[src="${secondHref}"]')?.naturalWidth>0`);
  await navigate("/dashboard/facilitator/products/product-test"); await click("Edit details"); await wait(`document.querySelector('[role=dialog] img[src="${secondHref}"]')?.naturalWidth>0`);
  assert.equal(await evaluate("!!document.querySelector('[role=dialog] .ws-media-library-toggle')"), false, "No guessed image PATCH field");
  await click("Cancel"); await send("Page.reload"); await click("Edit details"); await wait(`document.querySelector('[role=dialog] img[src="${secondHref}"]')?.naturalWidth>0`); await click("Cancel");

  // The same display component used on public/detail pages must render every
  // returned media type and additional scalar/nested fields without credentials.
  Object.assign(products[0], { images: ["/fixtures/first.png", "/fixtures/second.png"], videoUrl: "/fixtures/media-video.mp4", audioUrl: "/fixtures/media-audio.wav",
    attachments: [{ mediaId: uploadedIds.DOCUMENT, kind: "DOCUMENT", title: "Workbook" }], thumbnailMediaId: uploadedIds.IMAGE, availableQuantity: 0, featured: false,
    attributes: { format: "Paperback" }, accessToken: "do-not-display" });
  await send("Page.reload"); await wait("document.querySelectorAll('.api-media-gallery:not(.is-compact) img').length>=3");
  await wait("[...document.querySelectorAll('.api-media-gallery figcaption')].some(el=>el.textContent==='Video Url')&&[...document.querySelectorAll('.api-media-gallery figcaption')].some(el=>el.textContent==='Audio Url')");
  await evaluate("document.querySelector('.api-record-details').open=true");
  assert.equal(await evaluate("[...document.querySelectorAll('.api-record-details dt')].find(el=>el.textContent==='Available Quantity').nextElementSibling.textContent"), "0");
  assert.equal(await evaluate("[...document.querySelectorAll('.api-record-details dt')].find(el=>el.textContent==='Featured').nextElementSibling.textContent"), "No");
  assert.ok(await evaluate("document.body.innerText.includes('Paperback')&&!document.body.innerText.includes('do-not-display')"));
  const documentAsset = await evaluate("[...document.querySelectorAll('.api-media-asset')].find(el=>el.textContent.includes('Workbook')).textContent");
  assert.ok(documentAsset.includes("Load file preview"));
  await evaluate("[...document.querySelectorAll('.api-media-asset')].find(el=>el.textContent.includes('Workbook')).querySelector('button').click()");
  await wait(`document.querySelector('.api-media-gallery a[href*="${uploadedIds.DOCUMENT}/file?token=private-grant"]')`);
  await fs.writeFile(path.join(artifacts, "product-media-display.png"), Buffer.from((await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true })).data, "base64"));
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await delay(300);
  assert.ok(await evaluate("document.documentElement.scrollWidth<=window.innerWidth"), "Product gallery/details fit mobile");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

  console.log("Checking course and class thumbnails, upload-and-select, and public pages...");
  await navigate("/dashboard/facilitator/courses"); await click("+ Create course");
  await wait("document.querySelector('option[value=lookup]')");
  for (const [label, value] of [["Course title", "Picker course"], ["Short description", "A course with a library cover"], ["Course description", "Library image persistence test"], ["Category", "category"], ["Language", "lookup"], ["Level", "lookup"], ["Learning outcomes", "Practice regularly"], ["Regular price", "0"], ["Currency", "INR"], ["Reason for creating this course", "Verify media picker"]]) await fill(label, value);
  await click("Open media library"); await view("First image"); await click("Select image");
  await wait(`document.querySelector('.ws-course-preview-media img[src="${firstHref}"]')?.naturalWidth>0`);
  await click("Change image"); await view("Second image"); await click("Select image");
  await wait(`document.querySelector('.ws-course-preview-media img[src="${secondHref}"]')?.naturalWidth>0`);
  await fs.writeFile(path.join(artifacts, "course-picker-preview.png"), Buffer.from((await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true })).data, "base64"));
  await click("Save & next"); await wait("!document.querySelector('[role=dialog]')&&document.body.innerText.includes('Picker course')");
  await wait(`document.querySelector('td img[src="${secondHref}"]')?.naturalWidth>0`);
  await navigate("/dashboard/facilitator/courses/picker-course"); await wait(`document.querySelector('.api-media-gallery img[src="${secondHref}"]')?.naturalWidth>0`);
  await send("Page.reload"); await wait(`document.querySelector('.api-media-gallery img[src="${secondHref}"]')?.naturalWidth>0`);

  await navigate("/dashboard/facilitator/workshops"); await click("+ Create workshop"); await wait("document.querySelector('option[value=category]')");
  for (const [label, value] of [["Title", "Picker class"], ["Kind", "WORKSHOP"], ["Description", "Class with a library thumbnail"], ["Category", "category"], ["Starts at", "2099-10-24T10:00"], ["Ends at", "2099-10-24T11:00"], ["Timezone", "Asia/Kolkata"], ["Mode", "ONLINE"], ["Meeting Type", "GOOGLE_MEET"], ["Meeting Url", "https://meet.google.com/test-picker"], ["Regular price", "0"], ["Currency", "INR"], ["Capacity", "20"], ["Registration opens", "2099-10-01T10:00"], ["Registration closes", "2099-10-23T10:00"], ["Reason for this change", "Verify class media picker"]]) await fill(label, value);
  await click("Open media library"); await view("Second image"); await click("Select image");
  await wait(`document.querySelector('.ws-media-selections img[src="${secondHref}"]')?.naturalWidth>0`);
  await click("Save changes"); await wait("!document.querySelector('[role=dialog]')&&document.body.innerText.includes('Picker class')");
  await wait(`document.querySelector('td img[src="${secondHref}"]')?.naturalWidth>0`);
  await navigate("/dashboard/facilitator/workshops/picker-class"); await wait(`document.querySelector('.api-media-gallery img[src="${secondHref}"]')?.naturalWidth>0`);

  // Check private image preview and explicit publication from the picker itself.
  await navigate("/dashboard/facilitator/courses"); await click("+ Create course"); await click("Open media library"); await click("+ Upload new image");
  await fill("Media title", "Uploaded IMAGE");
  await evaluate(`(()=>{const input=document.querySelector('input[type=file]');const data=new DataTransfer();data.items.add(new File([new Uint8Array(${JSON.stringify([...png])})],'test.png',{type:'image/png'}));input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await click("Upload file"); await wait("document.querySelector('.ws-media-detail')&&document.body.innerText.includes('Make public & select image')");
  await click("Preview / download"); await wait(`document.querySelector('.ws-media-detail img[src*="/api/account/media/${pickerUploadId}/file"]')?.naturalWidth>0`);
  await click("Make public & select image"); await wait(`document.querySelector('.ws-media-selections img[src="/api/public/files/media/${pickerUploadId}/file"]')?.naturalWidth>0`);
  assert.ok(calls.some(call => call.method === "PATCH" && call.route === `media/${pickerUploadId}` && JSON.parse(call.body).visibility === "PUBLIC"));
  await click("Cancel");

  // Public SSR reads exactly the values saved above, with no browser credentials.
  products[0].images = [secondPath];
  for (const route of ["/courses/picker-course", "/classes/picker-class", "/shop/product-test"]) {
    await navigate(route); await wait(`document.querySelector('main .api-media-gallery img[src="${secondHref}"]')?.naturalWidth>0`);
    await send("Page.reload"); await wait(`document.querySelector('main .api-media-gallery img[src="${secondHref}"]')?.naturalWidth>0`);
  }

  await navigate("/dashboard/facilitator/media"); await wait("document.body.innerText.includes('Renamed media')");
  await view("Renamed media"); await wait("document.body.innerText.includes('Media details')"); await click("Delete");
  await wait("document.querySelector('[role=dialog]')"); await fill("Reason for this change", "Remove fixture"); await click("Confirm removal"); await wait("document.body.innerText.includes('Media deleted.')&&!document.querySelector('[role=dialog]')");
  assert.ok(!records.some(record => record.title === "Renamed media"));
  denyUpload = true; await click("+ Upload media"); await fill("Media type", "DOCUMENT"); await fill("Media title", "Denied upload");
  await evaluate("(()=>{const input=document.querySelector('input[type=file]');const data=new DataTransfer();data.items.add(new File(['%PDF-1.4'],'test.pdf',{type:'application/pdf'}));input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()");
  await click("Upload file"); await wait("document.body.innerText.includes('Upload permission denied')");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await send("Page.reload"); await wait("document.body.innerText.includes('First image')"); await delay(300);
  assert.ok(await evaluate("document.documentElement.scrollWidth<=window.innerWidth"), "Media page fits mobile");
  await fs.writeFile(path.join(artifacts, "library-mobile.png"), Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64"));
  const before = calls.filter(call => call.route.startsWith("media")).length; role = "USER"; await send("Page.reload"); await wait("location.pathname==='/dashboard/user'");
  assert.equal(calls.filter(call => call.route.startsWith("media")).length, before, "Learner cannot request media library");
  assert.deepEqual(errors, []);
  console.log("Media browser checks passed: upload/private access, media update, reusable course/class/product picker, immediate previews, save/list/detail/reload/public rendering, explicit publication, gallery, deletion, permissions and mobile.");
} catch (error) {
  if (send) { try { console.error((await send("Runtime.evaluate", { expression: "document.body.innerText", returnByValue: true })).result.value); } catch {} }
  throw error;
} finally {
  clearTimeout(watchdog);
  if (send) { try { await send("Browser.close"); } catch {} } socket?.close();
  if (browser?.exitCode === null) browser.kill(); if (server?.exitCode === null) server.kill();
  publicBackend?.closeAllConnections(); publicBackend?.close();
  const resolved = path.resolve(profile), root = path.resolve(os.tmpdir());
  if (resolved.startsWith(root + path.sep + "awaken-facilitator-media-")) {
    for (let i = 0; i < 10; i++) { try { await fs.rm(resolved, { recursive: true, force: true }); break; } catch { await delay(250); } }
  }
}
