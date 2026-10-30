import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

// Isolated browser checks: API calls below use fixtures, never a live account.
const origin = "http://127.0.0.1:3215";
const output = path.resolve("artifacts/learning");
const profile = await fs.mkdtemp(path.join(os.tmpdir(), "awaken-learning-"));
await fs.mkdir(output, { recursive: true });
const errors = [], calls = [], completed = new Set();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let server, browser, socket, send, evaluate, video;
let deferProgress = true, failCompletion = false, lockPractice = false, failCart = false;
const heldProgress = [];
const questions = [], reviews = [];
const lessonRows = [
  { id: "welcome", title: "A moment to arrive", contentType: "AUDIO", durationMinutes: 3, displayOrder: 1 },
  { id: "practice", title: "Build your daily practice", contentType: "VIDEO", durationMinutes: 8, displayOrder: 2 },
  { id: "reflect", title: "Reflect and take it forward", contentType: "TEXT", displayOrder: 3 },
];
const course = () => ({ courseId: "course-a", title: "Mindful Foundations", hasAccess: true, enrollmentStatus: completed.size === 3 ? "COMPLETED" : "ACTIVE", facilitatorName: "Meheck Mukherjee", shortDescription: "Create a little space for a calmer, more intentional day.", description: "Move through short lessons and practical exercises at your own pace. Revisit each practice whenever you need it.", learningOutcomes: ["Build a mindful daily routine", "Bring attention to your breath", "Reflect on your progress"], language: "English", progressPercent: Math.round(completed.size / 3 * 100), completedLessons: completed.size, totalLessons: 3, certificateAvailable: completed.size === 3, certificateId: completed.size === 3 ? "certificate-a" : undefined, sections: [
  { id: "module-2", title: "Put it into practice", displayOrder: 2, lessons: [{ ...lessonRows[2] }] },
  { id: "module-1", title: "Begin from within", displayOrder: 1, lessons: [{ ...lessonRows[1], isLocked: lockPractice }, { ...lessonRows[0] }] },
] });
const progress = () => ({ progressPercent: Math.round(completed.size / 3 * 100), completedLessons: completed.size, totalLessons: 3, lessons: [...completed].map((lessonId) => ({ lessonId, status: "COMPLETED" })) });
const cart = { version: 1, items: [], currency: "INR", total: 0, subtotal: 0, discount: 0, checkoutReady: true, totalsComplete: true };
const wav = Buffer.alloc(4044); wav.write("RIFF"); wav.writeUInt32LE(wav.length - 8, 4); wav.write("WAVEfmt ", 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write("data", 36); wav.writeUInt32LE(4000, 40);

async function fulfill(event, status, body, type = "application/json") {
  await send("Fetch.fulfillRequest", { requestId: event.requestId, responseCode: status, responseHeaders: [{ name: "Content-Type", value: type }, { name: "Cache-Control", value: "private, no-store" }], body: (Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body))).toString("base64") });
}
async function handle(event) {
  const url = new URL(event.request.url);
  const route = url.pathname.replace(/^\/api\/account\//, "");
  const method = event.request.method;
  const body = event.request.postData ? JSON.parse(event.request.postData) : {};
  calls.push({ route, method, body });
  const ok = (data, message) => fulfill(event, 200, { success: true, data, message });
  if (route === "auth/me") return ok({ id: "learner", name: "Practice Learner", email: "learner@example.test", role: "USER" });
  if (url.pathname === "/api/navigation/facilitators") return fulfill(event, 200, { links: [] });
  if (route === "me/courses") return ok([course(), { courseId: "course-completed", title: "The art of slowing down", enrollmentStatus: "COMPLETED", hasAccess: true, progressPercent: 100, completedLessons: 4, totalLessons: 4 }, { courseId: "course-expired", title: "A mindful evening", hasAccess: false, enrollmentStatus: "EXPIRED", progressPercent: 20, completedLessons: 1, totalLessons: 5 }]);
  if (route === "me/courses/course-a") return ok(course());
  if (route === "me/courses/course-a/progress") { if (deferProgress) { heldProgress.push(event); return; } return ok(progress()); }
  if (route === "me/courses/course-expired") return ok({ courseId: "course-expired", title: "A mindful evening", hasAccess: false, enrollmentStatus: "EXPIRED", lessons: lessonRows });
  if (route === "me/courses/course-a/reviews") { reviews.push(body); return ok({ id: "review", ...body }, "Review submitted."); }
  const match = route.match(/^me\/courses\/course-a\/lessons\/(welcome|practice|reflect)(?:\/(progress|questions|access-link))?$/);
  if (match) {
    const id = match[1], action = match[2];
    if (!action) return ok({ ...lessonRows.find((lesson) => lesson.id === id), content: "Make yourself comfortable. Take a slow breath and give yourself permission to pause.\n\nTry this practice today and notice how you feel.", fileAccessPath: id === "reflect" ? undefined : "/api/v1/learning/files/course-a/" + id, quizId: id === "reflect" ? "quiz-a" : undefined });
    if (action === "access-link") return ok({ path: "/api/v1/learning/files/course-a/" + id + "?token=test-grant", expiresIn: 300 });
    if (action === "questions") { questions.push({ id, ...body }); return ok({ id: "question" }); }
    if (action === "progress") {
      assert.deepEqual(body, { status: "COMPLETED" });
      if (failCompletion) { failCompletion = false; return fulfill(event, 503, { success: false, message: "Could not save progress. Please try again." }); }
      completed.add(id); return ok({ ...progress(), completed: completed.size === 3, certificateAvailable: completed.size === 3, certificateId: completed.size === 3 ? "certificate-a" : undefined });
    }
  }
  if (route.startsWith("learning/files/")) { assert.equal(url.searchParams.get("token"), "test-grant"); return fulfill(event, 200, route.endsWith("welcome") ? wav : video, route.endsWith("welcome") ? "audio/wav" : "video/webm"); }
  if (route === "me/cart") return ok(cart);
  if (route === "me/cart/items" && method === "POST") {
    assert.equal(body.version, cart.version);
    if (failCart) { failCart = false; return fulfill(event, 503, { success: false, message: "Cart service unavailable. Try again." }); }
    cart.version++; cart.items.push({ id: "line-" + cart.version, productId: body.productId, quantity: 1 }); return ok(cart);
  }
  if (route === "me/certificates/certificate-a") return ok({ title: "Mindful Foundations", status: "ISSUED", verificationCode: "AW-TEST", issuedAt: "2026-10-29T00:00:00Z" });
  throw Error("Unexpected API request: " + method + " " + route);
}

try {
  server = spawn(process.execPath, ["--import", "./tests/learning-public-fixtures.mjs", "node_modules/next/dist/bin/next", "start", "-p", "3215", "-H", "127.0.0.1"], { windowsHide: true, env: { ...process.env, AWAKEN_LEARNING_TEST_FIXTURES: "1" }, stdio: ["ignore", "pipe", "pipe"] });
  let serverOutput = ""; server.stdout.on("data", (data) => { serverOutput += data; }); server.stderr.on("data", (data) => { serverOutput += data; });
  for (let index = 0; index < 200 && !serverOutput.includes("Ready"); index++) { if (server.exitCode !== null) throw Error(serverOutput); await delay(150); }
  const ready = await fetch(origin + "/dashboard/user/courses"); assert.equal(ready.status, 200);
  browser = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=9255", "--user-data-dir=" + profile, "about:blank"], { windowsHide: true, stdio: "ignore" });
  let target;
  for (let index = 0; index < 200; index++) { try { target = (await (await fetch("http://127.0.0.1:9255/json/list")).json()).find((item) => item.type === "page"); if (target) break; } catch {} await delay(150); }
  assert.ok(target, "Test browser starts");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let sequence = 0; const pending = new Map();
  send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; const timer = setTimeout(() => { pending.delete(id); reject(Error("CDP timeout: " + method)); }, 20000); pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params })); });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) { const item = pending.get(message.id); if (item) { pending.delete(message.id); clearTimeout(item.timer); message.error ? item.reject(Error(message.error.message)) : item.resolve(message.result); } }
    if (message.method === "Fetch.requestPaused") void handle(message.params).catch((error) => { errors.push(error.message); void send("Fetch.failRequest", { requestId: message.params.requestId, errorReason: "Failed" }); });
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  });
  await send("Runtime.enable"); await send("Page.enable"); await send("Network.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/account/*" }, { urlPattern: "*/api/navigation/*" }] });
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await send("Network.setCookie", { name: "awm-csrf-token", value: "test-csrf", url: origin, path: "/" });
  evaluate = async (expression) => { const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
  const wait = async (expression) => { for (let index = 0; index < 200; index++) { assert.deepEqual(errors, []); if (await evaluate("Boolean(document.body && (" + expression + "))")) return; await delay(100); } throw Error("Timed out: " + expression); };
  const text = (value) => wait("document.body.innerText.includes(" + JSON.stringify(value) + ")");
  const click = async (label) => { const selector = "[...document.querySelectorAll('button,a')].find(el=>el.textContent.trim()===" + JSON.stringify(label) + "&&!el.disabled)"; await wait(selector); await evaluate(selector + ".click()"); };
  const go = async (route, value) => { await send("Page.navigate", { url: origin + route }); await text(value); };
  const fill = async (selector, value) => evaluate("(()=>{const el=document.querySelector(" + JSON.stringify(selector) + ");const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el," + JSON.stringify(value) + ");el.dispatchEvent(new Event('input',{bubbles:true}));})()");
  const screenshot = async (name) => { const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); await fs.writeFile(path.join(output, name + ".png"), Buffer.from(shot.data, "base64")); };
  video = Buffer.from(await evaluate("(async()=>{const canvas=document.createElement('canvas');canvas.width=160;canvas.height=90;const ctx=canvas.getContext('2d');ctx.fillStyle='#28563e';ctx.fillRect(0,0,160,90);const stream=canvas.captureStream(8);const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8'});const chunks=[];const result=new Promise(resolve=>{recorder.ondataavailable=event=>chunks.push(event.data);recorder.onstop=async()=>resolve(btoa(String.fromCharCode(...new Uint8Array(await new Blob(chunks).arrayBuffer()))));});recorder.start();setTimeout(()=>{recorder.stop();stream.getTracks().forEach(track=>track.stop());},300);return result;})()"), "base64");

  await go("/dashboard/user/courses", "Mindful Foundations"); await wait("document.querySelectorAll('.learn-course-card').length===3"); await screenshot("courses-desktop");
  await fill('.learn-search input', "evening"); await wait("document.querySelectorAll('.learn-course-card').length===1"); await fill('.learn-search input', "");
  await click("Completed1"); await wait("document.querySelectorAll('.learn-course-card').length===1"); await click("All courses3");
  await evaluate("document.querySelector('.learn-course-card .learn-button').click()"); await text("Course lessons");
  assert.equal(deferProgress, true, "Course content renders while progress is still pending");
  await wait("document.querySelectorAll('.learn-module').length===2");
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.learn-lesson-copy strong')].map(el=>el.textContent)"), lessonRows.map((row) => row.title));
  deferProgress = false; await Promise.all(heldProgress.splice(0).map((event) => fulfill(event, 200, { success: true, data: progress() })));
  await screenshot("overview-desktop");
  await click("About this course"); await text("Build a mindful daily routine"); await click("View curriculum");
  // The curriculum shortcut must also select the content tab.
  await wait("document.querySelector('#course-tab-content').getAttribute('aria-selected')==='true'");
  lockPractice = true; await go("/dashboard/user/courses/course-a", "Course lessons"); await wait("document.querySelector('.learn-lesson-row.is-locked')"); assert.equal(await evaluate("[...document.querySelectorAll('.learn-lesson-row.is-locked')].some(el=>el.textContent.includes('Build your daily practice'))"), true);
  lockPractice = false; await go("/dashboard/user/courses/course-a", "Course lessons"); await click("Start learning"); await text("A moment to arrive"); await click("Play lesson audio"); await wait("document.querySelector('audio')?.readyState>=1");
  await click("Ask a question"); await fill('#lesson-question', "How can I practice this every morning?"); await click("Send question"); await text("Your question was sent"); assert.equal(questions.length, 1);
  await screenshot("lesson-desktop");
  failCompletion = true; await click("Complete & continue"); await text("Could not save progress"); assert.equal(completed.size, 0); assert.match(await evaluate("location.pathname"), /welcome$/);
  await click("Complete & continue"); await text("Build your daily practice"); await click("Play lesson video"); await wait("document.querySelector('video')?.readyState>=1"); await wait("document.querySelector('[aria-current=page].learn-lesson-row')?.textContent.includes('Build your daily practice')");
  await click("Previous lesson"); await text("A moment to arrive"); await wait("[...document.querySelectorAll('a')].some(el=>el.textContent.trim()==='Next lesson')"); await click("Next lesson"); await text("Build your daily practice"); await click("Complete & continue"); await text("Reflect and take it forward"); await click("Resources"); await text("Open quiz"); assert.equal(await evaluate("[...document.querySelectorAll('a')].find(el=>el.textContent.trim()==='Open quiz').getAttribute('href')"), "/dashboard/user/quizzes/quiz-a"); await click("Mark lesson complete"); await text("Well done — course completed!"); await text("100% complete"); assert.equal(completed.size, 3);
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await screenshot("lesson-mobile"); assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"), true);
  await click("View completed course"); await text("Course completed"); await click("Your review"); await text("Your feedback"); await fill('textarea', "These practical lessons helped me build a daily routine."); await click("Submit review"); await text("Review submitted."); assert.equal(reviews.length, 1);
  await click("Course content"); await screenshot("overview-mobile"); assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"), true);
  await go("/dashboard/user/courses", "Mindful Foundations"); await screenshot("courses-mobile"); assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"), true);
  await go("/dashboard/user/courses/course-expired", "Access unavailable"); assert.equal(await evaluate("document.querySelectorAll('.learn-lesson-row[href]').length"), 0);
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await go("/shop", "Practice Journal"); await wait("[...document.querySelectorAll('button')].some(el=>el.textContent.trim()==='Add to cart'&&!el.disabled)"); await wait("document.querySelector('header')"); await delay(200);
  const cartReads = calls.filter((call) => call.route === "me/cart").length;
  await click("Add to cart"); await text("Product added to your cart.");
  assert.equal(calls.filter((call) => call.route === "me/cart").length, cartReads, "Confirmed cart skips preliminary GET");
  await click("Add to cart"); await wait("[...document.querySelectorAll('button')].some(el=>el.textContent.trim()==='Add to cart'&&!el.disabled)");
  assert.equal(cart.items.length, 2); assert.equal(calls.filter((call) => call.route === "me/cart").length, cartReads);
  failCart = true; await click("Add to cart"); await text("Cart service unavailable"); assert.equal(cart.items.length, 2);
  assert.deepEqual(errors, []);
  console.log("Learning browser checks passed: library search/filters, ordered modules, nonblocking progress, locked access, audio/video grants, failed/successful completion, previous/next navigation, questions, review, certificate state, desktop/mobile layout, cached cart actions and mutation errors.");
  console.log("Screenshots: " + output);
} catch (error) {
  try { console.error("Browser state:", (await evaluate("document.body.innerText")).slice(-5000)); } catch {}
  throw error;
} finally { socket?.close(); browser?.kill(); server?.kill(); }
