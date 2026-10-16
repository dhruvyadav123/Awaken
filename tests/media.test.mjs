import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const sourceModule = source => import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
const media = await sourceModule(fs.readFileSync("src/lib/dashboard/media.js", "utf8"));
const client = await sourceModule(fs.readFileSync("src/lib/client-account.js", "utf8"));
const operations = JSON.parse(fs.readFileSync("src/lib/dashboard/operations.json", "utf8"));

test("Media files validate kind, nonempty bytes, client limit, extension and MIME", () => {
  for (const [kind, name, type] of [["IMAGE", "photo.png", "image/png"], ["VIDEO", "video.mp4", "video/mp4"], ["AUDIO", "audio.mp3", "audio/mpeg"], ["DOCUMENT", "file.pdf", "application/pdf"]]) {
    assert.doesNotThrow(() => media.validateMediaFile({ name, type, size: 12 }, kind));
    assert.throws(() => media.validateMediaFile({ name, type, size: 0 }, kind), /non-empty/);
    assert.throws(() => media.validateMediaFile({ name, type, size: media.MEDIA_MAX_BYTES + 1 }, kind), /or less/);
  }
  assert.throws(() => media.validateMediaFile({ name: "image.svg", type: "image/svg+xml", size: 12 }, "IMAGE"), /supported/);
  assert.throws(() => media.validateMediaFile({ name: "image.png", type: "text/html", size: 12 }, "IMAGE"), /supported/);
  assert.throws(() => media.validateMediaFile({ name: "file.pdf", type: "application/pdf", size: 12 }, "OTHER"), /supported/);
});

test("Private and archived records, signed links, unsafe URLs and arbitrary IDs cannot become public image fields", () => {
  const image = { id: "image", kind: "IMAGE", visibility: "PUBLIC", status: "ACTIVE", publicPath: "/api/v1/public/media/image/file" };
  assert.equal(media.publicMediaUrl(image), image.publicPath);
  assert.equal(media.publicMediaUrl({ ...image, visibility: "PRIVATE", publicPath: null }), "");
  assert.equal(media.publicMediaUrl({ ...image, status: "ARCHIVED" }), "");
  assert.equal(media.publicMediaUrl({ ...image, kind: "DOCUMENT" }), "");
  for (const value of ["image-id", "javascript:alert(1)", "//evil.test/image", "/api/account/media/image/file", "https://service.test/api/v1/media/image/file?token=secret", "https://user:secret@example.test/image.png", "/images/a.png#x"]) assert.equal(media.safePermanentMediaUrl(value), "", value);
  assert.equal(media.safePermanentMediaUrl("https://cdn.test/image.png"), "https://cdn.test/image.png");
  assert.equal(media.safePermanentMediaUrl("https://cdn.test/image.png?width=200&format=webp"), "https://cdn.test/image.png?width=200&format=webp");
  assert.equal(media.safePermanentMediaUrl("https://cdn.test/image.png?X-Amz-Signature=grant"), "");
});

test("Private grants preserve encoded tokens but keep file requests on the authenticated proxy", () => {
  assert.equal(media.mediaFileHref("image", { data: { token: "a+/&?" } }), "/api/account/media/image/file?token=a%2B%2F%26%3F");
  assert.equal(media.mediaFileHref("image", { data: { url: "https://backend.test/api/v1/media/image/file?token=grant" } }), "/api/account/media/image/file?token=grant");
  assert.throws(() => media.mediaFileHref("image", { data: { url: "/media/another/file?token=wrong" } }), /token/);
  assert.throws(() => media.mediaFileHref("image", { data: { url: "javascript:alert(1)" } }), /token/);
  assert.throws(() => media.mediaFileHref("../other", { token: "grant" }), /ID/);
});

test("Media selection is available only in confirmed create thumbnail and product images fields", () => {
  const bindings = operations.flatMap(operation => Object.keys(operation.fields).filter(key => media.mediaBinding(operation, key)).map(key => `${operation.method} ${operation.path} ${key}`));
  assert.deepEqual(bindings.sort(), ["POST facilitator/classes thumbnail", "POST facilitator/courses thumbnail", "POST facilitator/products images"]);
  assert.equal(media.mediaBinding({ method: "PATCH", path: "facilitator/courses" }, "thumbnail"), null);
  assert.equal(media.mediaBinding({ method: "POST", path: "facilitator/courses/id/lessons" }, "mediaId"), null);
});

function fakeUploads(responses) {
  const calls = [];
  globalThis.XMLHttpRequest = class {
    constructor() { this.upload = {}; this.headers = {}; }
    open(method, url) { this.method = method; this.url = url; }
    setRequestHeader(key, value) { this.headers[key] = value; }
    getAllResponseHeaders() { return "content-type: application/json\r\ncache-control: private, no-store\r\n"; }
    abort() { this.onabort?.(); }
    send(body) {
      calls.push({ method: this.method, url: this.url, body, headers: this.headers, timeout: this.timeout });
      const response = responses.shift();
      if (!response) throw new Error("Unexpected upload");
      queueMicrotask(() => {
        this.upload.onprogress?.({ loaded: 5, total: 10, lengthComputable: true });
        if (response.error) { this[response.error]?.(); return; }
        this.status = response.status || 200; this.responseText = JSON.stringify(response.body); this.onload();
      });
    }
  };
  return calls;
}
const multipart = () => { const form = new FormData(); form.set("title", "Test media"); form.set("file", new Blob(["bytes"], { type: "image/png" }), "test.png"); return form; };

test("Multipart upload reports byte progress, retains FormData/CSRF and never sets a broken boundary", async () => {
  globalThis.document = { cookie: "awm-csrf-token=test-csrf" };
  const calls = fakeUploads([{ body: { success: true, data: { id: "uploaded" } } }]);
  const progress = []; const body = multipart();
  const result = await client.accountFetch("media/uploads/IMAGE", { method: "POST", body, onUploadProgress: value => progress.push(value) });
  assert.equal(result.data.id, "uploaded"); assert.equal(calls[0].body, body);
  assert.equal(calls[0].url, "/api/account/media/uploads/IMAGE");
  assert.equal(calls[0].headers["x-csrf-token"], "test-csrf");
  assert.equal(calls[0].headers["content-type"], undefined);
  assert.deepEqual(progress, [{ loaded: 5, total: 10 }]);
});

test("Expired upload auth refreshes once and retries with the rotated CSRF and same file", async () => {
  globalThis.document = { cookie: "awm-csrf-token=old" };
  const calls = fakeUploads([{ status: 401, body: { error: "Expired" } }, { body: { success: true, data: { id: "uploaded" } } }]);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => { assert.equal(url, "/api/auth/refresh"); assert.equal(options.headers["x-csrf-token"], "old"); globalThis.document.cookie = "awm-csrf-token=new"; return Response.json({ success: true }); };
  try { await client.accountFetch("media/uploads/IMAGE", { method: "POST", body: multipart(), onUploadProgress() {} }); }
  finally { globalThis.fetch = originalFetch; }
  assert.equal(calls.length, 2); assert.equal(calls[1].headers["x-csrf-token"], "new"); assert.equal(calls[1].body, calls[0].body);
});

test("Upload permission/validation errors, cancellation and timeout remain visible", async () => {
  globalThis.document = { cookie: "awm-csrf-token=test" };
  const options = () => ({ method: "POST", body: multipart(), onUploadProgress() {} });
  fakeUploads([{ status: 403, body: { success: false, message: "Not your media" } }]);
  await assert.rejects(client.accountFetch("media/uploads/IMAGE", options()), error => error.status === 403 && /Not your media/.test(error.message));
  fakeUploads([{ status: 400, body: { success: false, errors: [{ message: "Invalid signature" }] } }]);
  await assert.rejects(client.accountFetch("media/uploads/IMAGE", options()), /Invalid signature/);
  fakeUploads([{ error: "ontimeout" }]); await assert.rejects(client.accountFetch("media/uploads/IMAGE", options()), /timed out/);
  const controller = new AbortController(); controller.abort();
  const calls = fakeUploads([]); await assert.rejects(client.accountFetch("media/uploads/IMAGE", { ...options(), signal: controller.signal }), error => error.name === "AbortError");
  assert.equal(calls.length, 0);
});
