import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {spawn} from "node:child_process";
// Isolated response fixtures verify frontend behavior. No live account mutation is made.
const origin="http://127.0.0.1:3200";
const profile=await fs.mkdtemp(path.join(os.tmpdir(),"awaken-student-flow-"));
const calls=[],errors=[];
let server,browser,socket,send,createdBooking;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let video=await fs.readFile("public/videos/forest-mobile.mp4");
const videoType=video.length ? "video/mp4" : "video/webm";
const address={id:"home",label:"Home",fullName:"Practice Buyer",phone:"+919876543210",addressLine1:"42 Practice Road",addressLine2:"Apartment 4",city:"New Delhi",state:"Delhi",country:"IN",postalCode:"110001",isDefault:true,version:2,archivedAt:null};
const addresses=[address];
const product={images:["/fixtures/product.png"],id:"product",name:"Mindful Journal",productType:"PHYSICAL",inStock:false,requiresShipping:true,variant:{id:"soft",name:"Soft Cover",inStock:true,status:"ACTIVE"}};
const cart={id:"cart",version:4,currency:"INR",items:[{id:"line",productId:"product",variantId:"soft",quantity:1,product,unitPrice:240,finalUnitPrice:240,lineTotal:240,available:true}],subtotal:240,total:240,discount:0,totalsComplete:true,checkoutReady:true,requiresShipping:true};
let removeFailed=false;let quoteCount=0;const checkoutKeys=[];
let order={id:"order",orderNumber:"AW-TEST-ORDER",version:1,orderStatus:"PLACED",paymentStatus:"PENDING",fulfillmentStatus:"HELD",subtotal:480,discount:0,tax:0,shipping:0,grandTotal:480,currency:"INR",shippingAddressSnapshot:address,items:[{id:"order-line",itemType:"PRODUCT",itemId:"product",variantId:"soft",titleSnapshot:"Mindful Journal",quantity:2,finalPrice:480,snapshot:{name:"Mindful Journal",variant:{name:"Soft Cover"},productType:"PHYSICAL"}}],payments:[],refunds:[],shipment:null};
const klass={id:"class",title:"Morning Yoga Workshop",registrationId:"registration",registrationStatus:"REGISTERED",registrationVersion:3,startsAt:"2099-10-20T04:30:00Z",endsAt:"2099-10-20T06:00:00Z",timezone:"Asia/Kolkata",hasAccess:true,join:{available:false,opensAt:"2099-10-20T04:15:00Z"},recordingAvailable:false};
const booking={id:"booking",sessionTypeId:"type",version:5,status:"CONFIRMED",hasAccess:true,startsAt:"2099-10-22T04:30:00Z",endsAt:"2099-10-22T05:00:00Z",timezone:"Asia/Kolkata",snapshot:{title:"Private Mindful Breathing",facilitatorName:"Teacher"},join:{available:false,opensAt:"2099-10-22T04:15:00Z"}};
const course={id:"enrollment",courseId:"course",title:"Yoga Beginners",enrollmentStatus:"ACTIVE",hasAccess:true,progressPercent:0,completedLessons:0,totalLessons:1,certificateEnabled:false,lessons:[{id:"lesson",sectionTitle:"Introduction",title:"Breathing Exercises",contentType:"VIDEO"}]};
const progress={courseId:"course",completedLessons:0,totalLessons:1,progressPercent:0,lessons:[]};
let enrolled=false;
const questions=[];const reviews=[];
const quiz={id:"quiz",courseId:"course",title:"Yoga Basics Quiz",status:"ACTIVE",passingPercent:70,maxAttempts:3,showCorrectAnswers:false,questions:[{id:"question",prompt:"How often should you practice yoga?",options:[{id:"regularly",text:"Regularly"},{id:"never",text:"Never"}]}]};
let attempt=null;
const membership={id:"membership",status:"ACTIVE",version:3,hasAccess:true,expiresAt:"2099-01-10T08:29:32Z",autoRenew:false,plan:{id:"plan",name:"Practice Membership",benefits:["Meditation access"]},currentPeriod:{startsAt:"2098-10-12T08:29:32Z",expiresAt:"2098-11-11T08:29:32Z"},renewal:{eligible:true,paymentRequired:false,amount:0,currency:"INR",durationDays:30}};
let hasMembership=true;
const meditation={id:"meditation",title:"Guided Breathing Meditation",contentType:"AUDIO",duration:600,hasAccess:true,description:"Ten minutes of mindful breathing"};
const wav=Buffer.alloc(4044);wav.write("RIFF");wav.writeUInt32LE(wav.length-8,4);wav.write("WAVEfmt ",8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write("data",36);wav.writeUInt32LE(4000,40);
let learner={id:"user",name:"Practice Buyer",email:"buyer@example.test",role:"USER"};
let application={id:"application",displayName:"Practice Teacher",status:"DRAFT",version:4,shortBio:"Daily meditation",personalDetails:{legalName:"Practice Teacher",dateOfBirth:"1990-01-01T00:00:00.000Z"},bankDetails:{accountHolderName:"Practice Teacher",bankName:"Bank",accountNumber:"****9012",ifscCode:"DEMO0000001"},documents:[]};
async function fulfill(event,status,body,type="application/json"){
 await send("Fetch.fulfillRequest",{requestId:event.requestId,responseCode:status,responseHeaders:[{name:"Content-Type",value:type},{name:"Cache-Control",value:"private, no-store"}],body:(Buffer.isBuffer(body)?body:Buffer.from(typeof body==="string"?body:JSON.stringify(body))).toString("base64")});
}
async function handle(event){
 const {request}=event;const url=new URL(request.url);
 if(url.pathname==="/fixtures/product.png"||url.pathname==="/api/public/files/media/6ad0b48d3d47adf5350349a4/file")return fulfill(event,200,Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=","base64"),"image/png");
 if(!url.pathname.startsWith("/api/"))return send("Fetch.continueRequest",{requestId:event.requestId});
 const route=url.pathname.replace(/^\/api\/account\//,"");const method=request.method;
 const body=request.postData&&request.headers["Content-Type"]?.includes("application/json")?JSON.parse(request.postData):request.postData?.startsWith("{")?JSON.parse(request.postData):null;
 calls.push({route,method,body});
 const ok=data=>fulfill(event,200,{success:true,message:"Success",data});
 const list=data=>fulfill(event,200,{success:true,data,pagination:{page:Number(url.searchParams.get("page")||1),limit:20,total:data.length,pages:1}});
 if(url.pathname==="/api/auth/login")return fulfill(event,200,{user:learner,message:"Signed in",redirectTo:"/dashboard/user"});
 if(route==="auth/me"||route==="me")return ok(learner);
 if(url.pathname==="/api/navigation/facilitators")return list([]);
 if(route==="me/dashboard")return ok({summary:{enrolledCourses:1,completedCourses:0,upcomingClasses:1,unreadNotifications:0},continueLearning:[course],upcomingClasses:[klass],upcomingSessions:[booking],recentNotifications:[],recentOrders:[order]});
 if(route==="me/entitlements")return ok({hasMembership,benefits:["Meditation access"]});
 if(route==="me/permissions")return ok({role:"USER",permissions:[]});
 if(route==="me/profile"){if(method==="PATCH"){assert.deepEqual(Object.keys(body),["name"]);learner={...learner,...body};}return ok(learner);}
 if(route==="me/addresses"){if(method==="POST"){assert.ok(body.fullName&&body.country==="IN");const created={...body,id:"office",version:1};addresses.push(created);return ok(created);}return list(addresses);}
 const am=route.match(/^me\/addresses\/([^/]+)(\/default)?$/);
 if(am){const item=addresses.find(a=>a.id===am[1]);assert.ok(item);if(method!=="GET"){assert.equal(body.version,item.version);if(method==="DELETE"){addresses.splice(addresses.indexOf(item),1);return ok(null);}if(am[2]){addresses.forEach(a=>{a.isDefault=a.id===item.id;});item.version++;}else Object.assign(item,body,{version:item.version+1});}return ok(item);}
 if(route==="me/cart")return ok(cart);
 if(route==="me/cart/items/line"){assert.equal(body.version,cart.version);if(method==="PATCH"){cart.items[0].quantity=body.quantity;cart.items[0].lineTotal=240*body.quantity;cart.subtotal=cart.total=cart.items[0].lineTotal;cart.version++;return ok(cart);}if(method==="DELETE"){if(!removeFailed){removeFailed=true;return fulfill(event,500,{success:false,message:"Could not remove this item. Try again."});}cart.items=[];cart.version++;return ok(cart);}}
 if(route==="me/checkout/quote"||route==="me/checkout"){assert.deepEqual(body.items,[{itemType:"PRODUCT",itemId:"product",variantId:"soft",quantity:2}]);assert.equal(body.shippingAddressId,"home");if(route.endsWith("quote"))return ok({...order,requiresShipping:true,expiresIn:++quoteCount===1?1:900});assert.ok(body.idempotencyKey);checkoutKeys.push(body.idempotencyKey);if(checkoutKeys.length===1)return fulfill(event,502,{success:false,message:"Temporary checkout error"});assert.equal(checkoutKeys[0],checkoutKeys[1]);return ok(order);}
 if(route==="me/orders")return list([order]);
 if(route==="me/orders/order")return ok(order);
 if(route==="me/orders/order/cancel"){assert.equal(body.version,order.version);assert.ok(body.reason);order={...order,orderStatus:"CANCELLED",version:order.version+1};return ok(order);}
 if(route==="me/classes")return list([klass]);
 if(route==="me/classes/class")return ok(klass);
 if(route==="me/classes/class/cancel"){assert.equal(body.version,klass.registrationVersion);klass.registrationVersion++;klass.registrationStatus="CANCELLED";klass.hasAccess=false;return ok({id:"registration",classId:"class",status:"CANCELLED",version:klass.registrationVersion});}
 if(route==="me/classes/class/registrations"){klass.registrationStatus="REGISTERED";klass.registrationVersion++;klass.hasAccess=true;return ok({id:"registration",classId:"class",status:"REGISTERED",version:klass.registrationVersion});}
 if(route==="me/sessions"||route==="me/sessions/"){if(method==="POST"){assert.equal(body.sessionTypeId,"type");assert.equal(body.availabilityId,"public-availability");assert.equal(body.startsAt,"2099-10-24T04:30:00.000Z");assert.ok(body.idempotencyKey);createdBooking={...booking,id:"new-booking",startsAt:body.startsAt};return ok(createdBooking);}return list([booking]);}
 if(route==="me/sessions/new-booking")return ok(createdBooking);
 if(route==="me/sessions/booking")return ok(booking);
 if(route==="public/session-types/type/slots")return list([{id:"availability",availabilityId:"availability",startsAt:"2099-10-23T04:30:00Z",endsAt:"2099-10-23T05:00:00Z",available:true}]);
 if(route==="me/sessions/booking/reschedule"){assert.equal(body.version,booking.version);assert.equal(body.availabilityId,"availability");assert.equal(body.startsAt,"2099-10-23T04:30:00Z");assert.ok(body.reason);booking.version++;booking.startsAt=body.startsAt;return ok(booking);}
 if(route==="me/sessions/booking/cancel"){assert.equal(body.version,booking.version);booking.version++;booking.status="CANCELLED";booking.hasAccess=false;return ok(booking);}
 if(route==="me/courses")return list([course]);
 if(route==="me/courses/course")return enrolled?ok(course):fulfill(event,404,{success:false,message:"No enrollment yet"});
 if(route==="me/membership-discount")return ok({resourceType:"COURSE",resourceId:"course",currency:"INR",baseAmount:0,membershipDiscountPercent:15,discountAmount:0,finalAmount:0,included:false,paymentRequired:false});
 if(route==="me/courses/course/enroll"){enrolled=true;return ok(course);}
 if(route==="me/courses/course/progress")return ok(progress);
 if(route==="me/courses/course/lessons/lesson")return ok({...course.lessons[0],videoSource:"UPLOAD",fileAccessPath:"/api/v1/me/courses/course/lessons/lesson/access-link"});
 if(route==="me/courses/course/lessons/lesson/access-link")return ok({path:"/api/v1/learning/files/enrollment/lesson?token=fresh",expiresIn:300});
 if(route==="learning/files/enrollment/lesson"){assert.equal(url.searchParams.get("token"),"fresh");return fulfill(event,200,video,videoType);}
 if(route==="me/courses/course/lessons/lesson/progress"){assert.deepEqual(body,{status:"COMPLETED"});Object.assign(course,{completed:true,progressPercent:100,completedLessons:1,enrollmentStatus:"COMPLETED"});Object.assign(progress,{completedLessons:1,progressPercent:100,lessons:[{lessonId:"lesson",status:"COMPLETED"}]});return ok(course);}
 if(route==="me/courses/course/lessons/lesson/questions"){assert.ok(body.body);const q={id:"asked",courseId:"course",lessonId:"lesson",lessonTitle:"Breathing Exercises",body:body.body,status:"ANSWERED",replies:[{id:"reply",authorRole:"FACILITATOR",body:"Try a regular daily practice.",createdAt:"2026-10-10T10:31:56Z"}]};questions.push(q);return ok(q);}
 if(route==="me/questions")return list(questions);
 if(route==="me/questions/asked")return ok(questions[0]);
 if(route==="me/courses/course/reviews"){assert.equal(body.rating,5);const review={...body,id:"review",courseId:"course",status:"PENDING",version:1};reviews.push(review);return ok(review);}
 if(route==="me/reviews")return list(reviews);
 if(route==="me/reviews/review"){assert.equal(body.version,reviews[0].version);Object.assign(reviews[0],body,{version:reviews[0].version+1});return ok(reviews[0]);}
 if(route==="me/quizzes")return list([quiz]);
 if(route==="me/quizzes/quiz")return ok(quiz);
 if(route==="me/quizzes/quiz/attempts"){attempt={id:"attempt",quizId:"quiz",quizTitle:quiz.title,status:"IN_PROGRESS",quiz};return ok(attempt);}
 if(route==="me/quiz-attempts")return list(attempt?[attempt]:[]);
 if(route==="me/quiz-attempts/attempt")return ok(attempt);
 if(route==="me/quiz-attempts/attempt/submit"){assert.deepEqual(body,{answers:[{questionId:"question",optionId:"regularly"}]});Object.assign(attempt,{status:"SUBMITTED",score:1,totalPoints:1,percent:100,passed:true});return ok(attempt);}
 if(route==="me/membership")return ok({hasMembership,membership:hasMembership?membership:null,memberships:hasMembership?[membership]:[]});
 if(route==="me/membership/membership")return ok(membership);
 if(route==="public/membership-plans")return list([{id:"plan",name:"Practice Membership",regularPrice:0,currency:"INR",durationDays:30,status:"ACTIVE"}]);
 if(route==="me/membership/history")return list(hasMembership?[{id:"period-not-membership",membershipId:"membership",plan:membership.plan,operation:"RENEW",membershipStatus:membership.status,paymentStatus:"NOT_REQUIRED",startsAt:"2098-11-11T08:29:32Z",expiresAt:"2098-12-11T08:29:32Z"}]:[]);
 if(route==="me/membership/membership/renew"){assert.equal(body.version,membership.version);assert.ok(body.idempotencyKey);membership.version++;return ok({membership,period:{id:"renewed"},replayed:false});}
 if(route==="me/membership/membership/cancel"){assert.equal(body.version,membership.version);assert.ok(body.reason);membership.status="CANCELLED";membership.version++;return ok(membership);}
 if(route==="me/membership/activate"){assert.equal(body.planId,"plan");assert.ok(body.idempotencyKey);hasMembership=true;membership.status="ACTIVE";return ok({membership});}
 if(route==="me/meditations")return list([meditation]);
 if(route==="me/meditations/meditation")return ok(meditation);
 if(route==="me/meditations/meditation/content")return ok({id:"meditation",contentType:"AUDIO",duration:600,accessLinkPath:"/api/v1/me/meditations/meditation/access-link"});
 if(route==="me/meditations/meditation/access-link")return ok({path:"/api/v1/meditation/files/meditation?token=fresh",expiresIn:300});
 if(route==="meditation/files/meditation")return fulfill(event,200,wav,"audio/wav");
 if(route==="me/facilitator-application"){
  if(method==="PATCH"){assert.equal(body.version,application.version);assert.ok(!body.bankDetails,"Masked bank details must not be resubmitted");application={...application,...body,version:application.version+1};}
  return ok(application);
 }
 if(route==="me/facilitator-application/documents"){assert.ok(request.postData.includes('name="file"'));application.documents.push({id:"document",kind:"IDENTITY",title:"Identity proof",mimeType:"application/pdf",size:20});application.version++;return ok(application);}
 if(route==="me/facilitator-application/submit"){assert.equal(body.version,application.version);application.version++;application.status="SUBMITTED";return ok(application);}
 throw Error("Unexpected API request: "+method+" "+route);
}
try {
  server = spawn(process.execPath, ["--import", "./tests/public-api-fixtures.mjs", "node_modules/next/dist/bin/next", "start", "-p", "3200", "-H", "127.0.0.1"], { windowsHide: true, env: {...process.env,AWAKEN_PUBLIC_TEST_FIXTURES:"1"}, stdio: ["ignore", "pipe", "pipe"] });
  let serverOutput = ""; server.stdout.on("data", data => { serverOutput += data; }); server.stderr.on("data", data => { serverOutput += data; });
  for (let i = 0; i < 400; i++) { if (serverOutput.includes("Ready")) break; if (server.exitCode !== null) throw new Error(serverOutput); await delay(150); }
  browser = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=9240", "--user-data-dir=" + profile, "about:blank"], { windowsHide: true, stdio: "ignore" });
  let target;
  for (let i = 0; i < 400; i++) { try { target = (await (await fetch("http://127.0.0.1:9240/json/list")).json()).find(item => item.type === "page"); if (target) break; } catch {} await delay(150); }
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

  if(!video.length) {
    const encoded=await evaluate(`(async()=>{const canvas=document.createElement('canvas');canvas.width=128;canvas.height=72;const context=canvas.getContext('2d');context.fillStyle='#315a48';context.fillRect(0,0,128,72);const stream=canvas.captureStream(10);const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8'});const chunks=[];const result=new Promise(resolve=>{recorder.ondataavailable=event=>chunks.push(event.data);recorder.onstop=async()=>{const bytes=new Uint8Array(await new Blob(chunks,{type:'video/webm'}).arrayBuffer());resolve(btoa(String.fromCharCode(...bytes)));};});recorder.start();const timer=setInterval(()=>{context.fillStyle='#315a48';context.fillRect(0,0,128,72);},50);setTimeout(()=>{clearInterval(timer);recorder.stop();stream.getTracks().forEach(track=>track.stop());},500);return result;})()`);
    video=Buffer.from(encoded,'base64');assert.ok(video.length>0,'Nonempty playable video fixture');
  }
  socket.addEventListener("message",event=>{const msg=JSON.parse(event.data);if(msg.method==="Runtime.consoleAPICalled"&&msg.params.type==="error")errors.push(msg.params.args.map(arg=>arg.value||arg.description||"").join(" "));if(msg.method==="Page.javascriptDialogOpening")void send("Page.handleJavaScriptDialog",{accept:true});});
  const text=word=>wait("document.body.innerText.includes("+JSON.stringify(word)+")");
  const go=async(route,word)=>{await navigate(route);await text(word);};
  async function scopedClick(label,ancestor,contains){await evaluate("(()=>{const root=[...document.querySelectorAll("+JSON.stringify(ancestor)+")].find(el=>el.textContent.includes("+JSON.stringify(contains)+"));root.querySelectorAll('button').forEach(el=>{if(el.textContent.trim()==="+JSON.stringify(label)+")el.click();});})()");}
  await go("/dashboard/user/addresses","Saved addresses");await text("Practice Buyer");
  for(const [label,value] of [["Address label","Office"],["Full name","Practice Buyer"],["Phone","+919876543210"],["Address line 1","24 Work Road"],["City","New Delhi"],["State","Delhi"],["Postal code","110002"]])await fill(label,value);
  await click("Add address");await text("Office");await scopedClick("Set default","article","Office");await wait("[...document.querySelectorAll('article')].some(el=>el.textContent.includes('Office')&&el.textContent.includes('Default'))");
  await scopedClick("Edit","article","Home");await wait("document.querySelector('form h3')?.textContent==='Edit address'");await fill("Address line 2","Apartment 5");await click("Save changes");await text("Apartment 5");
  await scopedClick("Delete","article","Office");await wait("!document.body.innerText.includes('24 Work Road')");
  await go("/cart","Mindful Journal");await wait("document.querySelector('[aria-label=\"Cart items\"] img')?.naturalWidth>0");await text("Item total: \u20b9240.00");await wait("document.querySelector('[aria-label=\"Increase Mindful Journal quantity\"]')");await evaluate("document.querySelector('[aria-label=\"Increase Mindful Journal quantity\"]').click()");await text("quantity 2");await text("Item total: \u20b9480.00");
  await go("/checkout","Get final quote");await wait("document.querySelector('select[aria-label=\"Delivery address\"]')?.value==='home'");await click("Get final quote");await text("This quote has expired");await click("Get final quote");await text("Place order");await click("Place order");await text("Temporary checkout error");await click("Place order");await text("AW-TEST-ORDER");assert.equal(calls.filter(c=>c.route==='me/checkout'&&c.method==='POST').length,2);
  await go("/dashboard/user/orders/order","Cancel order");await text("Payment: PENDING");await fill("Reason","Order no longer needed");await click("Request cancellation");await text("This order is cancelled.");
  await go("/dashboard/user/workshops/class","Morning Yoga Workshop");await text("Joining opens");assert.equal(await evaluate("[...document.querySelectorAll('button')].find(el=>el.textContent==='Get joining link').disabled"),true);await fill("Reason for cancellation","Schedule changed");await click("Confirm cancellation");await text("Register again");await click("Register again");await text("registered");
  await go("/dashboard/user/bookings/booking","Private Mindful Breathing");await text("Reschedule booking");await wait("[...document.querySelectorAll('select option')].length>1");await fill("Available time","0");await fill("Reason for rescheduling","Practice at a new time");await click("Confirm new time");await text("Session rescheduled.");
  await go("/dashboard/user/courses/course","Enroll in this course");await click("Enroll in this course");await text("Course lessons");await fill("Your feedback","This course helped my daily practice.");await click("Submit review");await text("Success");await go("/dashboard/user/courses/course/lessons/lesson","Breathing Exercises");await click("Load lesson video");await wait("document.querySelector('video')?.readyState>=1");await click("Mark lesson complete");await text("100% complete");await fill("Your question","How should I practice this lesson?");await click("Send question");await text("Your question was sent");
  await go("/dashboard/user/community/asked","Facilitator reply");await text("Try a regular daily practice.");
  await go("/dashboard/user/quizzes/quiz","Start attempt");await click("Start attempt");await text("How often should you practice yoga?");await evaluate("document.querySelector('input[value=regularly]').click()");await click("Submit answers");await text("Passed");await text("100%");
  await go("/dashboard/user/reviews","Edit review");await click("Edit review");await fill("Feedback","Updated feedback after regular practice.");await click("Save review");await text("Updated feedback after regular practice.");
  await go("/dashboard/user/membership","Membership history");await text("Practice Membership");assert.equal(await evaluate("[...document.querySelectorAll('a')].find(el=>el.textContent==='View membership').getAttribute('href')"),"/profile/membership/membership");
  await go("/dashboard/user/membership/membership","Renew membership");await click("Renew membership");await text("Success");assert.equal(membership.version,4);
  await fill("Reason","Taking a break");await click("Confirm cancellation");await text("CANCELLED");hasMembership=false;
  await go("/dashboard/user/membership?planId=plan","Activate selected plan");await wait("[...document.querySelectorAll('button')].some(el=>el.textContent==='Activate selected plan'&&!el.disabled)");await click("Activate selected plan");await text("Access available");
  await go("/dashboard/user/meditations/meditation","Get meditation access");await click("Get meditation access");await wait("document.querySelector('audio')?.readyState>=1");
  await go("/dashboard/user/application","Continue application");await click("Continue application");await wait("document.querySelector('input[type=date]')?.value==='1990-01-01'");await fill("Short Bio","Accessible daily mindfulness practice");await click("Save and continue");await text("Supporting documents");
  await fill("Title","Identity proof");await evaluate("(()=>{const input=document.querySelector('input[type=file]');const data=new DataTransfer();data.items.add(new File(['%PDF-1.4 fixture'],'identity.pdf',{type:'application/pdf'}));input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()");await click("Upload document");await text("Identity proof");await click("Continue to review");await click("Continue to submit");await evaluate("document.querySelector('input[type=checkbox]').click()");await click("Submit application");await text("SUBMITTED");
  await go("/sessions/session-fixture?from=2099-10-01&to=2099-10-31","Book your session");await wait("[...document.querySelectorAll('button')].some(el=>el.textContent.includes('min session'))");await evaluate("[...document.querySelectorAll('button')].find(el=>el.textContent.includes('min session')).click()");await click("Book this time");await text("Private Mindful Breathing");await wait("location.pathname.includes('new-booking')");assert.ok(createdBooking);
  await go("/profile/edit","Save profile");await fill("Name","Updated Buyer");await click("Save profile");await text("Success");assert.equal(learner.name,"Updated Buyer");
  await go("/auth/login?next=%2Fcheckout","Email address");await fill("Email address","buyer@example.test");await fill("Password","Example-password-123");await wait("document.querySelector('.auth-submit')&&!document.querySelector('.auth-submit').disabled");await evaluate("document.querySelector('.auth-submit').click()");await wait("location.pathname==='/checkout'");await text("Get final quote");
  await go("/dashboard/user","Your activity at a glance");await text("Your account access");await text("AW-TEST-ORDER");
  await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});assert.equal(await evaluate("document.documentElement.scrollWidth<=window.innerWidth"),true);
  await go("/cart","Mindful Journal");await click("Remove from cart");await text("Could not remove this item. Try again.");await text("Mindful Journal");await click("Remove from cart");await text("Your cart is empty.");assert.equal(calls.filter(c=>c.route==="me/cart/items/line"&&c.method==="DELETE").length,2);
  await go("/blog/blog-image-fixture","Uploaded image article");await wait("document.querySelector('.blog-cover-media img')?.naturalWidth>0");assert.equal(await evaluate("document.querySelector('.blog-cover-media img').getAttribute('src')"),"/api/public/files/media/6ad0b48d3d47adf5350349a4/file");
  assert.deepEqual(errors,[]);console.log("Student browser checks passed: address lifecycle, versioned cart, checkout, orders, class cancellation/registration, session rescheduling, lesson playback/progress/questions, replies, quiz submission, review edit, membership lifecycle/history, meditation playback, application upload/submit, profile, dashboard and mobile layout.");
}catch(error){ try { const state=await send("Runtime.evaluate",{expression:"document.body.innerText",returnByValue:true});console.error("BROWSER STATE:",state.result.value.slice(-5000)); } catch {} throw error;}finally{socket?.close();browser?.kill();server?.kill();}
