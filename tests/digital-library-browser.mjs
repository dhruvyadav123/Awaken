import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
// All account requests are local browser fixtures; no live claims or purchases.
const origin="http://127.0.0.1:3199";
const profile=await fs.mkdtemp(path.join(os.tmpdir(),"awaken-digital-library-"));
const calls=[],errors=[];
let server,browser,socket,send,deny=false,grants=0;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const entry={id:"entitlement",status:"ACTIVE",hasAccess:true,expiresAt:null,product:{name:"Mindfulness eBook",description:"Daily mindfulness exercises"},files:[{fileId:"file",kind:"DOCUMENT",title:"Mindfulness PDF",mimeType:"application/pdf",size:20}]};
async function fulfill(event,status,body,type="application/json") {
 await send("Fetch.fulfillRequest",{requestId:event.requestId,responseCode:status,responseHeaders:[{name:"Content-Type",value:type},{name:"Cache-Control",value:"private, no-store"}],body:Buffer.from(typeof body==="string"?body:JSON.stringify(body)).toString("base64")});
}
async function handle(event) {
 const {request}=event;const url=new URL(request.url);const route=url.pathname.replace(/^\/api\/account\//,"");
 if(!url.pathname.startsWith("/api/"))return send("Fetch.continueRequest",{requestId:event.requestId});
 calls.push({route,method:request.method});
 if(route==="auth/me")return fulfill(event,200,{success:true,data:{id:"user",role:"USER",name:"Library user"}});
 if(url.pathname==="/api/navigation/facilitators")return fulfill(event,200,{success:true,data:[]});
 if(route==="me/digital-library")return fulfill(event,200,{success:true,data:[entry],pagination:{page:Number(url.searchParams.get("page")),pages:2,total:21,limit:20}});
 if(route==="me/digital-library/entitlement")return fulfill(event,200,{success:true,data:entry});
 if(route==="me/digital-library/entitlement/access") {assert.equal(url.searchParams.get("fileId"),"file");if(deny)return fulfill(event,403,{success:false,message:"Access revoked"});return fulfill(event,200,{success:true,data:{path:"/api/v1/digital-library/files/entitlement/file?token=grant"+(++grants),expiresIn:300}});}
 if(route==="digital-library/files/entitlement/file") {assert.equal(url.searchParams.get("token"),"grant"+grants);return fulfill(event,200,"%PDF-1.4 fixture","application/pdf");}
 throw Error("Unexpected API request: "+request.method+" "+url.pathname);
}
try {
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3199", "-H", "127.0.0.1"], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  let serverOutput = ""; server.stdout.on("data", data => { serverOutput += data; }); server.stderr.on("data", data => { serverOutput += data; });
  for (let i = 0; i < 400; i++) { if (serverOutput.includes("Ready")) break; if (server.exitCode !== null) throw new Error(serverOutput); await delay(150); }
  browser = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=9239", "--user-data-dir=" + profile, "about:blank"], { windowsHide: true, stdio: "ignore" });
  let target;
  for (let i = 0; i < 400; i++) { try { target = (await (await fetch("http://127.0.0.1:9239/json/list")).json()).find(item => item.type === "page"); if (target) break; } catch {} await delay(150); }
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
  async function wait(expression) { for (let i = 0; i < 400; i++) { assert.deepEqual(errors, []); if (await evaluate(`Boolean(document.body && (${expression}))`)) return; await delay(150); } throw new Error("Timed out: " + expression); }
  async function click(text) { await wait(`[...document.querySelectorAll('button')].some(el=>el.textContent.trim()===${JSON.stringify(text)}&&!el.disabled)`); await evaluate(`[...document.querySelectorAll('button')].find(el=>el.textContent.trim()===${JSON.stringify(text)}&&!el.disabled).click()`); }
  async function fill(label, value) { await evaluate(`(()=>{const el=[...document.querySelectorAll('label')].find(el=>el.firstChild?.textContent.trim()===${JSON.stringify(label)}).querySelector('input,textarea,select');const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`); }
  async function view(title) { await wait(`[...document.querySelectorAll('li h3')].some(el=>el.textContent===${JSON.stringify(title)})`); await evaluate(`[...document.querySelectorAll('li h3')].find(el=>el.textContent===${JSON.stringify(title)}).closest('li').querySelector('button').click()`); }
  const navigate = route => send("Page.navigate", { url: origin + route });

  await navigate("/dashboard/user/digital-library");
  await wait("document.body.innerText.includes('Mindfulness eBook')");
  await click("Next");await wait("document.body.innerText.includes('Page 2 of 2')");
  await wait("[...document.querySelectorAll('a')].some(el=>el.textContent==='View resource')");
  await evaluate("[...document.querySelectorAll('a')].find(el=>el.textContent==='View resource').click()");
  await wait("document.body.innerText.includes('Mindfulness PDF')");
  await click("Download");await wait("[...document.querySelectorAll('button')].some(el=>el.textContent==='Download'&&!el.disabled)");
  assert.equal(grants,1);
  await click("Download");await wait("[...document.querySelectorAll('button')].some(el=>el.textContent==='Download'&&!el.disabled)");
  assert.equal(grants,2);
  deny=true;await click("Download");await wait("document.body.innerText.includes('Access revoked')");
  assert.equal(calls.filter(call=>call.route==='digital-library/files/entitlement/file').length,2);
  entry.hasAccess=false;await click("Refresh library");await wait("document.body.innerText.includes('Access is currently unavailable')");
  assert.equal(await evaluate("[...document.querySelectorAll('button')].find(el=>el.textContent==='Download').disabled"),true);
  await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});
  assert.equal(await evaluate("document.documentElement.scrollWidth<=window.innerWidth"),true);
  assert.deepEqual(errors,[]);
  console.log("Digital library browser checks passed: pagination, detail, downloads, fresh tokens, access denial, disabled access and mobile layout.");
} finally {socket?.close();browser?.kill();server?.kill();}
