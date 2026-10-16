import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sourceModule = source => import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
const identity = await sourceModule(fs.readFileSync("src/lib/dashboard/identity.js", "utf8"));
const overview = await sourceModule(fs.readFileSync("src/lib/dashboard/overview.js", "utf8"));
const earnings = await sourceModule(fs.readFileSync("src/lib/dashboard/earnings.js", "utf8"));
const files = await sourceModule(fs.readFileSync("src/lib/dashboard/files.js", "utf8"));
const contracts = JSON.parse(fs.readFileSync("src/lib/dashboard/contracts.json", "utf8"));
const operations = JSON.parse(fs.readFileSync("src/lib/dashboard/operations.json", "utf8"));
const inventory = JSON.parse(fs.readFileSync("docs/atlas-api-inventory.json", "utf8"));
const normalize = path => path.replace(/^\{\{baseUrl\}\}\//, "").split("?")[0].replace(/\/+$/, "").replace(/\{\{[^}]+\}\}/g, ":id");

test("Every protected endpoint and mutation comes from the supplied non-admin collection", () => {
  const documented = new Set(inventory.map(entry => entry.method + " " + normalize(entry.url)));
  for (const entry of contracts) { assert.ok(documented.has(entry.method + " " + entry.pattern), entry.pattern); assert.ok(!entry.pattern.startsWith("admin/")); }
  for (const operation of operations) assert.ok(documented.has(operation.method + " " + normalize(operation.path)), operation.path);
});
test("Dashboard roles use verified identity and reject unknown/admin roles", () => {
  assert.equal(identity.dashboardHome(identity.identityOf({ data: { user: { role: "FACILITATOR" } } })), "/dashboard/facilitator");
  assert.equal(identity.dashboardHome({ role: "USER" }), "/dashboard/user");
  for (const role of ["ADMIN", "", "APPROVED", "PENDING", undefined]) assert.equal(identity.dashboardHome({ role }), null);
});
test("Verified facilitators can switch between learner and teacher workspaces; application status never grants access", () => {
  assert.equal(identity.canUseDashboard({ role: "FACILITATOR" }, "user"), true);
  assert.equal(identity.canUseDashboard({ role: "FACILITATOR" }, "facilitator"), true);
  assert.equal(identity.canUseDashboard({ role: "USER", applicationStatus: "APPROVED" }, "facilitator"), false);
  assert.equal(identity.canUseDashboard({ role: "USER" }, "user"), true);
  assert.equal(identity.canUseDashboard({ role: "ADMIN" }, "user"), false);
  assert.equal(identity.facilitatorAction({ role: "FACILITATOR" }).href, "/dashboard/facilitator");
  assert.equal(identity.facilitatorAction({ role: "USER", applicationStatus: "APPROVED" }).href, "/dashboard/user/application");
});
test("Earnings use the documented currency, pagination, summary and ID endpoints", () => {
  assert.deepEqual(earnings.earningsPaths("usd", 2, "earning-id"), { currency: "USD", list: "facilitator/earnings?currency=USD&page=2&limit=20", summary: "facilitator/earnings/summary?currency=USD", detail: "facilitator/earnings/earning-id" });
  assert.throws(() => earnings.earningsPaths("IN")); assert.throws(() => earnings.earningsPaths("INR", 0));
});
test("Facilitator overview reads exact summary fields, preserves zeros and does not fabricate revenue", () => {
  const response = { asOf: "2026-10-09T12:31:11.179Z", limit: 5, summary: { totalCourses: 0, pendingCourses: 0, totalClasses: 0, upcomingClasses: 0, totalStudents: 0, courseEnrollments: 0, sessionBookings: 0, productSales: { sales: 0, units: 0 } }, financesByCurrency: [], recentSales: [], recentQuestions: [] };
  const empty = overview.facilitatorOverview(response);
  assert.equal(overview.FACILITATOR_DASHBOARD_PATH, "facilitator/dashboard?limit=5");
  assert.deepEqual(empty.metrics.map(([, value]) => value), Array(9).fill(0));
  assert.deepEqual(empty.finances, []); assert.deepEqual(empty.sales, []); assert.deepEqual(empty.questions, []);
  assert.ok(!empty.metrics.some(([label]) => /revenue|active courses/i.test(label)));
  assert.ok(overview.facilitatorOverview({}).metrics.every(([, value]) => value === null));
  const populated = overview.facilitatorOverview({ ...response, summary: { ...response.summary, totalCourses: 8, productSales: { sales: 3, units: 7 } }, financesByCurrency: [{ currency: "INR", earnedAmount: 120 }], recentSales: [{ id: "sale", amount: 120 }], recentQuestions: [{ id: "question", body: "Test question" }] });
  assert.equal(populated.metrics[0][1], 8); assert.equal(populated.metrics[7][1], 3); assert.equal(populated.metrics[8][1], 7);
  assert.deepEqual(populated.finances, [{ currency: "INR", earnedAmount: 120 }]);
  assert.equal(populated.sales[0].id, "sale"); assert.equal(populated.questions[0].body, "Test question");
  assert.deepEqual(overview.overviewFields({ currency: "INR", balance: 0, details: { count: 2 }, accessToken: "secret", id: "record" }).map(item => [item.key, item.value]), [["balance", 0], ["details · count", 2]]);
});
test("Signed file paths keep tokens and reject unsafe URLs", () => {
  assert.equal(files.grantedFileHref({ data: { url: "/api/v1/media/abc/file?token=grant" } }), "/api/account/media/abc/file?token=grant");
  assert.equal(files.grantedFileHref("javascript:alert(1)"), "");
  assert.equal(files.grantedFileHref("/api/v1/admin/users"), "");
});
test("Existing lesson helpers route actual relative access grants through protected streaming", async () => {
  const learning = await sourceModule(fs.readFileSync("src/lib/learning-data.js", "utf8"));
  assert.equal(learning.externalUrl({ accessUrl: "/api/v1/learning/files/enrollment/lesson?token=grant" }), "/api/account/learning/files/enrollment/lesson?token=grant");
  assert.equal(learning.externalUrl("/api/v1/digital-library/files/entitlement/file?token=grant"), "/api/account/digital-library/files/entitlement/file?token=grant");
  assert.equal(learning.externalUrl("/api/v1/admin/users"), "");
});

const proxySource = fs.readFileSync("src/app/api/account/[...segments]/route.js", "utf8").replace(/^import .*;\r?\n/gm, "");
const proxy = await sourceModule(`
const cookies = async () => ({ get: name => globalThis.__dashboardCookies[name] ? { value: globalThis.__dashboardCookies[name] } : undefined });
const ACCESS_COOKIE = "access", CSRF_COOKIE = "csrf", API_BASE_URL = "https://service.example.test/api/v1";
const backendRequest = async () => globalThis.__dashboardIdentity;
const clearAuthCookies = response => response;
const contracts = ${JSON.stringify(contracts)};
${fs.readFileSync("src/lib/dashboard/identity.js", "utf8").replace(/export /g, "")}
${proxySource}
`);
function reset(role = "USER") {
  globalThis.__dashboardCookies = { access: "test-token", csrf: "test-csrf" };
  globalThis.__dashboardIdentity = { ok: true, status: 200, result: { success: true, data: { role } } };
  globalThis.__dashboardCalls = [];
  globalThis.fetch = async (url, options) => { globalThis.__dashboardCalls.push({ url, options }); return Response.json({ success: true, data: [] }); };
}
const request = (path, method = "GET", body, headers = {}) => new Request("https://website.example.test/api/account/" + path, { method, headers: { ...(body ? { "content-type": "application/json" } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) });
const context = path => ({ params: Promise.resolve({ segments: path.split("/") }) });
test("Proxy refuses admin paths, undocumented methods and traversal before fetching", async () => {
  reset();
  for (const [path, method] of [["admin/dashboard", "GET"], ["facilitator/dashboard", "POST"], ["me/../admin/dashboard", "GET"]]) { const response = await proxy[method](request(path, method), context(path)); assert.ok([400, 404].includes(response.status)); }
  assert.equal(globalThis.__dashboardCalls.length, 0);
});
test("Missing authentication and USER-to-FACILITATOR access are denied", async () => {
  reset(); globalThis.__dashboardCookies = {}; let response = await proxy.GET(request("me/courses"), context("me/courses")); assert.equal(response.status, 401);
  reset(); response = await proxy.GET(request("facilitator/courses"), context("facilitator/courses")); assert.equal(response.status, 403); assert.equal(globalThis.__dashboardCalls.length, 0);
});

test("Media list, detail, uploads, metadata, access and streaming enforce facilitator identity", async () => {
  for (const [path, method] of [["media", "GET"], ["media/image", "GET"], ["media/image", "PATCH"], ["media/image", "DELETE"], ["media/image/access-link", "POST"], ["media/image/file", "GET"], ["media/uploads/IMAGE", "POST"]]) {
    reset("USER");
    const denied = await proxy[method](request(path, method), context(path));
    assert.equal(denied.status, 403, path); assert.equal(globalThis.__dashboardCalls.length, 0);
  }
  reset("FACILITATOR");
  const listed = await proxy.GET(request("media?page=2&limit=20"), context("media"));
  assert.equal(listed.status, 200); assert.match(globalThis.__dashboardCalls[0].url, /\/media\?page=2&limit=20$/);
});

test("Media version/title, delete reason and access-link bodies stay on documented backend routes", async () => {
  for (const [path, method, body] of [["media/image", "PATCH", { version: 2, title: "Renamed" }], ["media/image", "DELETE", { version: 3, reason: "Remove unused media" }], ["media/image/access-link", "POST", {}]]) {
    reset("FACILITATOR");
    const response = await proxy[method](request(path, method, body, { "x-csrf-token": "test-csrf" }), context(path));
    assert.equal(response.status, 200); assert.deepEqual(JSON.parse(globalThis.__dashboardCalls[0].options.body), body);
  }
});
test("Legacy identity path reaches auth/me and facilitator identity is verified", async () => {
  reset(); let response = await proxy.GET(request("me"), context("me")); assert.equal(response.status, 200); assert.equal(globalThis.__dashboardCalls[0].url, "https://service.example.test/api/v1/auth/me");
  reset("FACILITATOR"); response = await proxy.GET(request("facilitator/courses"), context("facilitator/courses")); assert.equal(response.status, 200); assert.equal(globalThis.__dashboardCalls[0].options.headers.authorization, "Bearer test-token");
});
test("Earnings preserve empty response pagination and forward selected currency behind facilitator permissions", async () => {
  reset("FACILITATOR");
  globalThis.fetch = async (url, options) => { globalThis.__dashboardCalls.push({ url, options }); return Response.json({ success: true, message: "Success", data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }); };
  const paths = earnings.earningsPaths("INR", 1, "earning-id");
  for (const path of [paths.list, paths.summary, paths.detail]) {
    const response = await proxy.GET(request(path), context(path.split("?")[0]));
    assert.equal(response.status, 200);
    assert.equal(globalThis.__dashboardCalls.at(-1).url, "https://service.example.test/api/v1/" + path);
    assert.equal(globalThis.__dashboardCalls.at(-1).options.headers.authorization, "Bearer test-token");
    const result = await response.json(); assert.deepEqual(result.data, []); assert.equal(result.pagination.pages, 0);
  }
  reset("USER");
  assert.equal((await proxy.GET(request(paths.list), context("facilitator/earnings"))).status, 403);
  assert.equal(globalThis.__dashboardCalls.length, 0);
});
test("Announcement lifecycle forwards documented bodies and versions only for facilitators", async () => {
  const base = "facilitator/announcements";
  reset("USER");
  assert.equal((await proxy.GET(request(base), context(base))).status, 403);
  assert.equal(globalThis.__dashboardCalls.length, 0);
  reset("FACILITATOR");
  const headers = { "x-csrf-token": "test-csrf", origin: "https://website.example.test" };
  const draft = { title: "Test announcement", body: "Test message", target: "ALL_MY_STUDENTS", channels: ["IN_APP", "EMAIL"], reason: "Test review" };
  const steps = [["POST", base, draft], ["PATCH", `${base}/announcement-id`, { version: 2, ...draft }], ["POST", `${base}/announcement-id/publish`, { version: 3, reason: "Test publish" }], ["DELETE", `${base}/announcement-id`, { version: 4, reason: "Test removal" }]];
  for (const [method, path, body] of steps) {
    const response = await proxy[method](request(path, method, body, headers), context(path));
    assert.equal(response.status, 200);
    const call = globalThis.__dashboardCalls.at(-1);
    assert.equal(call.options.method, method);
    assert.deepEqual(JSON.parse(call.options.body), body);
    assert.equal(call.options.headers.authorization, "Bearer test-token");
  }
  await proxy.GET(request(base + "?page=2&limit=20"), context(base));
  assert.ok(globalThis.__dashboardCalls.at(-1).url.endsWith("/facilitator/announcements?page=2&limit=20"));
});
test("Mutations require matching CSRF and same origin; DELETE retains version body", async () => {
  reset(); const path = "me/facilitator-application/documents/document-id";
  let response = await proxy.DELETE(request(path, "DELETE", { version: 7 }), context(path)); assert.equal(response.status, 403);
  response = await proxy.DELETE(request(path, "DELETE", { version: 7 }, { "x-csrf-token": "test-csrf", origin: "https://evil.example.test" }), context(path)); assert.equal(response.status, 403);
  response = await proxy.DELETE(request(path, "DELETE", { version: 7 }, { "x-csrf-token": "test-csrf", origin: "https://website.example.test" }), context(path)); assert.equal(response.status, 200); assert.deepEqual(JSON.parse(globalThis.__dashboardCalls[0].options.body), { version: 7 });
});
test("Multipart upload is forwarded without corrupting the boundary", async () => {
  reset(); const form = new FormData(); form.set("version", "4"); form.set("kind", "IDENTITY"); form.set("title", "Identity document"); form.set("file", new Blob(["file bytes"], { type: "application/pdf" }), "identity.pdf");
  const path = "me/facilitator-application/documents"; const response = await proxy.POST(new Request("https://website.example.test/api/account/" + path, { method: "POST", headers: { "x-csrf-token": "test-csrf" }, body: form }), context(path));
  assert.equal(response.status, 200); const forwarded = globalThis.__dashboardCalls[0].options; assert.equal(forwarded.headers["content-type"], undefined); assert.equal(forwarded.body.get("version"), "4"); assert.equal(forwarded.body.get("file").name, "identity.pdf");
});
test("Downloads stream binary/range responses and preserve private caching", async () => {
  reset(); globalThis.fetch = async () => new Response("pdf", { status: 206, headers: { "content-type": "application/pdf", "content-range": "bytes 0-2/10", "content-disposition": "attachment; filename=certificate.pdf" } });
  const path = "me/certificates/certificate-id/download"; const response = await proxy.GET(request(path), context(path)); assert.equal(response.status, 206); assert.equal(await response.text(), "pdf"); assert.equal(response.headers.get("content-range"), "bytes 0-2/10"); assert.equal(response.headers.get("cache-control"), "private, no-store");
});

function authRoute(path) {
  const source = fs.readFileSync(path, "utf8").replace(/^import .*;\r?\n/gm, "");
  return sourceModule(`const backendRequest = (...args) => globalThis.__dashboardAuthRequest(...args); const setAuthCookies = response => { globalThis.__dashboardCookieSet = true; return response; }; ${fs.readFileSync("src/lib/dashboard/identity.js", "utf8").replace(/export /g, "")} ${source}`);
}
const login = await authRoute("src/app/api/auth/login/route.js");
const signup = await authRoute("src/app/api/auth/signup/route.js");
test("Login redirect follows auth/me rather than a stale login role", async () => {
  globalThis.__dashboardCookieSet = false;
  globalThis.__dashboardAuthRequest = async path => ({ ok: true, status: 200, result: { success: true, data: path === "auth/login" ? { accessToken: "token", user: { role: "USER" } } : { role: "FACILITATOR", name: "Verified account" } } });
  const response = await login.POST(request("login", "POST", { email: "learner@example.test", password: "test-password" }));
  assert.equal(response.status, 200); assert.equal((await response.json()).redirectTo, "/dashboard/facilitator"); assert.equal(globalThis.__dashboardCookieSet, true);
});
test("An admin/unknown verified role does not receive frontend auth cookies", async () => {
  globalThis.__dashboardCookieSet = false;
  globalThis.__dashboardAuthRequest = async path => ({ ok: true, status: 200, result: { success: true, data: path === "auth/login" ? { accessToken: "token" } : { role: "ADMIN" } } });
  const response = await login.POST(request("login", "POST", { email: "account@example.test", password: "test-password" })); assert.equal(response.status, 403); assert.equal(globalThis.__dashboardCookieSet, false);
});
test("Registration attempts normal backend login without an email-verification bypass or duplicate creation", async () => {
  const calls = []; globalThis.__dashboardCookieSet = false;
  globalThis.__dashboardAuthRequest = async path => { calls.push(path); return { ok: true, status: path === "auth/register" ? 201 : 200, result: { success: true, data: path === "auth/register" ? { user: { role: "USER" } } : path === "auth/login" ? { accessToken: "token" } : { role: "USER", emailVerified: false } } }; };
  const response = await signup.POST(request("signup", "POST", { name: "Test account", email: "learner@example.test", password: "test-password" })); assert.equal(response.status, 201); assert.equal((await response.json()).redirectTo, "/dashboard/user"); assert.deepEqual(calls, ["auth/register", "auth/login", "auth/me"]); assert.equal(globalThis.__dashboardCookieSet, true);
});
test("Backend verification requirements are respected and leave the account at sign-in", async () => {
  globalThis.__dashboardCookieSet = false;
  globalThis.__dashboardAuthRequest = async path => path === "auth/register" ? { ok: true, status: 201, result: { data: { emailVerificationRequired: true } } } : { ok: false, status: 403, result: { message: "Verification required" } };
  const response = await signup.POST(request("signup", "POST", { name: "Test account", email: "learner@example.test", password: "test-password" })); assert.equal((await response.json()).redirectTo, "/auth/login"); assert.equal(globalThis.__dashboardCookieSet, false);
});

const client = await sourceModule(fs.readFileSync("src/lib/client-account.js", "utf8"));
test("Client API service rejects false success and preserves readable backend validation errors", async () => {
  globalThis.document = { cookie: "awm-csrf-token=csrf-value" };
  globalThis.fetch = async () => Response.json({});
  await assert.rejects(client.accountFetch("me/profile"), /incomplete response/);
  globalThis.fetch = async () => Response.json({ success: false, message: "Check your fields.", errors: [{ message: "Name is required." }] }, { status: 400 });
  await assert.rejects(client.accountFetch("me/profile", { method: "PATCH", body: { name: "" } }), /Name is required/);
});
test("Client retries expired authentication once after refresh and uses rotated CSRF", async () => {
  let calls = 0;
  globalThis.document = { cookie: "awm-csrf-token=old-token" };
  globalThis.fetch = async (url, options) => {
    calls++;
    if (calls === 1) return Response.json({ error: "Expired" }, { status: 401 });
    if (url === "/api/auth/refresh") { globalThis.document.cookie = "awm-csrf-token=new-token"; return Response.json({ success: true }); }
    assert.equal(options.headers.get("x-csrf-token"), "new-token");
    assert.deepEqual(JSON.parse(options.body), { name: "Updated name" });
    return Response.json({ success: true, data: { name: "Updated name" } });
  };
  await client.accountFetch("me/profile", { method: "PATCH", body: { name: "Updated name" } });
  assert.equal(calls, 3);
});

test("Digital library claim, list, detail and access preserve the supplied API contract", async () => {
  const original = globalThis.fetch;
  try {
    reset();
    const payload = { productId: "product", idempotencyKey: "claim-intent" };
    const claim = await proxy.POST(request("me/digital-library/claim", "POST", payload, { "x-csrf-token": "test-csrf" }), context("me/digital-library/claim"));
    assert.equal(claim.status, 200);
    assert.deepEqual(JSON.parse(globalThis.__dashboardCalls[0].options.body), payload);
    for (const path of ["me/digital-library", "me/digital-library/entitlement", "me/digital-library/entitlement/access"]) {
      const query = path.endsWith("access") ? "?fileId=file" : path === "me/digital-library" ? "?page=2&limit=20" : "";
      const response = await proxy.GET(request(path + query), context(path));
      assert.equal(response.status, 200);
      assert.equal(globalThis.__dashboardCalls.at(-1).url, "https://service.example.test/api/v1/" + path + query);
    }
    const file = "digital-library/files/entitlement/file";
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://service.example.test/api/v1/" + file + "?token=fresh-grant");
      assert.equal(options.headers.authorization, "Bearer test-token");
      assert.equal(options.headers.range, "bytes=0-2");
      return new Response("pdf", { status: 206, headers: { "content-type": "application/pdf", "content-range": "bytes 0-2/10", "content-disposition": "attachment; filename=ebook.pdf" } });
    };
    const response = await proxy.GET(request(file + "?token=fresh-grant", "GET", undefined, { range: "bytes=0-2" }), context(file));
    assert.equal(response.status, 206);
    assert.equal(await response.text(), "pdf");
    assert.equal(response.headers.get("content-range"), "bytes 0-2/10");
    assert.equal(response.headers.get("content-disposition"), "attachment; filename=ebook.pdf");
    assert.equal(response.headers.get("cache-control"), "private, no-store");
  } finally { globalThis.fetch = original; }
});

test("Student lifecycle endpoints forward supplied bodies, versions, variants and methods without facilitator access", async () => {
 const previous=globalThis.fetch;
 const cases=[
 ["me/addresses","POST",{label:"Home",fullName:"Buyer",phone:"+919876543210",addressLine1:"42 Practice Road",addressLine2:"Apartment 4",city:"New Delhi",state:"Delhi",country:"IN",postalCode:"110001",isDefault:true}],
 ["me/addresses/address","GET"],["me/addresses/address","PATCH",{version:2,addressLine2:"Apartment 5"}],["me/addresses/address/default","PATCH",{version:3}],["me/addresses/address","DELETE",{version:4}],
 ["me/cart/items","POST",{version:0,productId:"product",variantId:"variant",quantity:1}],["me/cart/items/line","PATCH",{version:1,quantity:2}],["me/cart/items/line","DELETE",{version:2}],
 ["me/checkout/quote","POST",{items:[{itemType:"PRODUCT",itemId:"product",variantId:"variant",quantity:2}],shippingAddressId:"address"}],
 ["me/checkout","POST",{items:[{itemType:"PRODUCT",itemId:"product",variantId:"variant",quantity:2}],shippingAddressId:"address",idempotencyKey:"checkout-intent"}],
 ["me/orders/order/cancel","POST",{version:1,reason:"Schedule changed"}],
 ["me/classes/class","GET"],["me/classes/class/registrations","POST",{}],["me/classes/class/cancel","POST",{version:3,reason:"Schedule changed"}],["me/classes/class/join","GET"],["me/classes/class/recording","GET"],
 ["me/courses/course/enroll","POST",{}],["me/courses/course/lessons/lesson","GET"],["me/courses/course/lessons/lesson/access-link","POST",{}],["me/courses/course/lessons/lesson/progress","POST",{status:"COMPLETED"}],["me/courses/course/progress","GET"],
 ["me/courses/course/lessons/lesson/questions","POST",{body:"How should I practice this lesson?"}],["me/questions/question","GET"],["me/courses/course/reviews","POST",{rating:5,comment:"This course helped my practice."}],["me/reviews/review","PATCH",{version:2,rating:4,comment:"Updated feedback."}],
 ["me/meditations/meditation","GET"],["me/meditations/meditation/content","GET"],["me/meditations/meditation/access-link","POST",{}],
 ["me/membership/membership","GET"],["me/membership/membership/renew","POST",{version:3,idempotencyKey:"renew-intent"}],["me/membership/membership/cancel","POST",{version:4,reason:"Taking a break"}],["me/membership/activate","POST",{planId:"plan",idempotencyKey:"activate-intent"}],
 ["me/quizzes/quiz","GET"],["me/quizzes/quiz/attempts","POST",{}],["me/quiz-attempts/attempt","GET"],["me/quiz-attempts/attempt/submit","POST",{answers:[{questionId:"question",optionId:"option"}]}],
 ["me/sessions","POST",{sessionTypeId:"type",availabilityId:"slot",startsAt:"2026-10-22T04:30:00.000Z",idempotencyKey:"book-intent"}],["me/sessions/booking","GET"],["me/sessions/booking/join","GET"],["me/sessions/booking/cancel","POST",{version:5,reason:"Schedule changed"}],["me/sessions/booking/reschedule","POST",{version:6,availabilityId:"slot",startsAt:"2026-10-23T04:30:00.000Z",reason:"Prefer a different time"}],
 ["me/facilitator-application","POST",{displayName:"Practice Teacher"}],["me/facilitator-application","PATCH",{version:2,displayName:"Teacher",personalDetails:{dateOfBirth:"1990-01-01"}}],["me/facilitator-application/submit","POST",{version:3}],["me/facilitator-application/reopen","POST",{version:4}],
 ["me/profile","GET"],["me/profile","PATCH",{name:"Updated Buyer"}]
 ];
 try{for(const [path,method,body] of cases){reset("USER");const response=await proxy[method](request(path,method,body,body?{"x-csrf-token":"test-csrf"}:{}),context(path));assert.equal(response.status,200,method+" "+path);assert.equal(globalThis.__dashboardCalls.length,1);const call=globalThis.__dashboardCalls[0];assert.equal(call.url,"https://service.example.test/api/v1/"+path);assert.equal(call.options.method,method);if(body)assert.deepEqual(JSON.parse(call.options.body),body);}}finally{globalThis.fetch=previous;}
});
test("Student backend permission, conflict and validation responses retain their status and message", async()=>{
 const previous=globalThis.fetch;
 try{for(const status of [403,409,422]){reset();globalThis.fetch=async()=>Response.json({success:false,message:"Backend decision "+status,code:"BACKEND_DECISION"},{status});const response=await proxy.PATCH(request("me/addresses/address","PATCH",{version:2,addressLine2:"New"},{"x-csrf-token":"test-csrf"}),context("me/addresses/address"));assert.equal(response.status,status);assert.equal((await response.json()).message,"Backend decision "+status);}}finally{globalThis.fetch=previous;}
});
