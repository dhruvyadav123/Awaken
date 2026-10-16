import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = text => import("data:text/javascript;base64,"+Buffer.from(text).toString("base64"));
const flow = await source(fs.readFileSync("src/lib/student-flow.js","utf8"));
const learning = await source(fs.readFileSync("src/lib/learning-data.js","utf8"));
const cart = {version:7,checkoutReady:true,totalsComplete:true,requiresShipping:true,items:[{id:"line",productId:"product",variantId:"soft",quantity:2,available:true}]};
test("Checkout preserves variants and requires delivery only for physical carts",()=>{
 assert.deepEqual(flow.checkoutBody(cart,"address"),{items:[{itemType:"PRODUCT",itemId:"product",variantId:"soft",quantity:2}],shippingAddressId:"address"});
 assert.throws(()=>flow.checkoutBody(cart,""),/delivery address/);
 const digital={...cart,requiresShipping:false,items:[{productId:"ebook",quantity:1,available:true}]};
 assert.deepEqual(flow.checkoutBody(digital,"old-address"),{items:[{itemType:"PRODUCT",itemId:"ebook",quantity:1}]});
 for(const patch of [{checkoutReady:false},{totalsComplete:false},{items:[]},{items:[{productId:"p",quantity:1,available:false}]},{items:[{productId:"p",quantity:1.5}]}])assert.throws(()=>flow.checkoutBody({...cart,...patch},"address"));
});
test("Registration cancellation uses the registration version, never the public class version",()=>{
 assert.equal(flow.registrationVersion({version:99,registrationVersion:2}),2);
 assert.equal(flow.registrationVersion({registration:{version:3}}),3);
 assert.throws(()=>flow.registrationVersion({version:99}),/registration version/);
 for(const version of [undefined,null,"2",NaN,-1,1.2])assert.throws(()=>flow.requiredVersion(version));
 assert.equal(flow.requiredVersion(0),0);
});
test("Published variants override parent stock and inactive variants cannot be bought",()=>{
 assert.equal(flow.productUnavailable({hasVariants:true,inStock:false,variants:[{inStock:true,status:"ACTIVE"}]}),false);
 assert.equal(flow.productUnavailable({hasVariants:true,variants:[{inStock:false,status:"ACTIVE"}]}),true);
 assert.equal(flow.productUnavailable({hasVariants:true,variants:[{inStock:true,status:"ARCHIVED"}]}),true);
 assert.equal(flow.productUnavailable({inStock:false}),true);
});
test("Account choices include every page and refuse partial responses",async()=>{
 const paths=[];
 const request=async path=>{paths.push(path);return {data:[{id:paths.length}],pagination:{pages:2}};};
 assert.deepEqual(await flow.allAccountPages(request,"me/addresses"),[{id:1},{id:2}]);
 assert.deepEqual(paths,["me/addresses?page=1&limit=20","me/addresses?page=2&limit=20"]);
 await assert.rejects(flow.allAccountPages(async()=>({data:null}),"me/addresses"),/incomplete list/);
});
test("Access messages and application forms respect actual status and masked bank numbers",()=>{
 assert.match(flow.joinMessage({hasAccess:false}),/Access is unavailable/);
 assert.match(flow.joinMessage({hasAccess:true,join:{available:false,opensAt:"2099-01-01T04:15:00Z"}}),/Joining opens/);
 assert.match(flow.joinMessage({join:{closesAt:"2020-01-01T00:00:00Z"}}),/closed/);
 assert.equal(flow.applicationEditable({status:"DRAFT"}),true);
 for(const status of ["SUBMITTED","APPROVED","REJECTED"])assert.equal(flow.applicationEditable({status}),false);
 assert.deepEqual(flow.safeBankFields({accountNumber:"****9012",bankName:"Bank"}),{bankName:"Bank"});
 assert.equal(learning.titleOf({snapshot:{title:"Private breathing session"}},"Fallback"),"Private breathing session");
 assert.equal(learning.titleOf({titleSnapshot:"Journal"},"Fallback"),"Journal");
});
const cartSource=fs.readFileSync("src/lib/cart.js","utf8").replace(/^import .*;\r?\n/gm,"");
const cartModule=await source(`const accountFetch=(...args)=>globalThis.__studentCartRequest(...args); const requiredVersion=${flow.requiredVersion.toString()};\n${cartSource}`);
test("Cart mutations send the current cart version, preserve response totals and tolerate blocked local storage",async()=>{
 const previous=globalThis.window;
 const calls=[];let current={...cart,version:9};
 globalThis.window={localStorage:{setItem(){throw Error("Storage unavailable");}},dispatchEvent(){}};
 globalThis.__studentCartRequest=async(path,options={})=>{
  calls.push({path,options});
  if(options.method==="PATCH"||options.method==="POST"){current={...current,version:current.version+1};return {success:true,data:current};}
  if(options.method==="DELETE"){current={...current,version:current.version+1,items:[]};return {success:true,data:null};}
  return {success:true,data:current};
 };
 try{
  await cartModule.updateCartItem({id:"line"},3);
  assert.deepEqual(calls[1],{path:"me/cart/items/line",options:{method:"PATCH",body:{version:9,quantity:3}}});
  assert.equal(cartModule.readCartSnapshot().version,10);
  await cartModule.removeProductFromCart({id:"line"});
  assert.deepEqual(calls.find(call=>call.options.method==="DELETE").options.body,{version:10});
  assert.deepEqual(cartModule.readCart(),[]);
  await cartModule.addProductToCart("product","soft",1);
  assert.deepEqual(calls.find(call=>call.options.method==="POST").options.body,{version:11,productId:"product",variantId:"soft",quantity:1});
  await assert.rejects(cartModule.updateCartItem({id:"line"},0),/positive whole number/);
  globalThis.__studentCartRequest=async()=>({success:true,data:null});
  await assert.rejects(cartModule.refreshCart(),/incomplete/);
 }finally{globalThis.window=previous;delete globalThis.__studentCartRequest;}
});

test("Public catalogue errors preserve backend throttling and reject incomplete success envelopes",async()=>{
 const previous=globalThis.fetch;
 const moduleSource=fs.readFileSync("src/lib/public-api.js","utf8").replace(/^const API_BASE_URL = .*;\r?\n/, 'const API_BASE_URL = "https://service.example.test/api/v1";\n');
 const api=await source(moduleSource);
 let calls=0;
 try{
  globalThis.fetch=async()=>{calls++;return Response.json({success:false,message:"Too many requests. Try again later."},{status:429});};
  const result=await api.publicApi("rate-limit-test");assert.equal(result.status,429);assert.equal(result.data,null);assert.match(result.error,/Too many requests/);
  await api.publicApi("rate-limit-test");assert.equal(calls,1,"Do not immediately repeat a throttled public request");
  globalThis.fetch=async()=>Response.json({data:[]});
  const incomplete=await api.publicApi("incomplete-envelope-test");assert.equal(incomplete.status,502);assert.ok(incomplete.error);
 }finally{globalThis.fetch=previous;}
});

test("Sign-in returns to safe student intent without bypassing role or verification",async()=>{
 const {safeReturnPath}=await source(fs.readFileSync("src/lib/return-path.js","utf8"));
 const user={role:"USER"};const fallback="/dashboard/user";
 assert.equal(safeReturnPath("/checkout",user,fallback),"/checkout");
 assert.equal(safeReturnPath("/dashboard/user/membership?planId=plan",user,fallback),"/dashboard/user/membership?planId=plan");
 for(const value of ["https://evil.test","//evil.test","/\\evil.test","/api/account/me/orders","/auth/login","/admin/users","/dashboard/facilitator","/dashboard/unknown","/%2f%2fevil.test","/checkout\n"])assert.equal(safeReturnPath(value,user,fallback),fallback);
 assert.equal(safeReturnPath("/dashboard/facilitator/courses",{role:"FACILITATOR"},fallback),"/dashboard/facilitator/courses");
 assert.equal(safeReturnPath("/checkout",undefined,"/auth/login"),"/auth/login");
});
