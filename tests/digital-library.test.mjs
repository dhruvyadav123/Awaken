import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const mod = source => import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const library = await mod(fs.readFileSync('src/lib/digital-library.js', 'utf8'));
const client = await mod(fs.readFileSync('src/lib/client-account.js', 'utf8'));

test('Only digital products with an explicit zero price can be claimed free', () => {
  assert.equal(library.isFreeDigitalProduct({productType:'DIGITAL',regularPrice:0}),true);
  assert.equal(library.isFreeDigitalProduct({productType:'DIGITAL',regularPrice:100,discountPrice:0}),true);
  for(const product of [{productType:'DIGITAL'}, {productType:'DIGITAL',regularPrice:100}, {productType:'PHYSICAL',regularPrice:0}, {productType:'DIGITAL',regularPrice:''}]) assert.equal(library.isFreeDigitalProduct(product),false);
});
test('Signed grants stay on the expected protected file route', () => {
  assert.equal(library.digitalFilePath({path:'/api/v1/digital-library/files/ent/file?token=grant'},'ent','file'),'digital-library/files/ent/file?token=grant');
  for(const path of ['https://evil.test/digital-library/files/ent/file?token=x','/api/v1/digital-library/files/other/file?token=x','/api/v1/digital-library/files/ent/file','/api/v1/admin/users?token=x']) assert.throws(()=>library.digitalFilePath({path},'ent','file'));
});
test('Entitlement flags, revocation and expiry control file access', () => {
  const item={status:'ACTIVE',hasAccess:true,expiresAt:null};
  assert.equal(library.canAccessDigitalItem(item),true);
  for(const patch of [{status:'REVOKED'},{hasAccess:false},{expiresAt:'2020-01-01'},{expiresAt:'invalid'}]) assert.equal(library.canAccessDigitalItem({...item,...patch}),false);
});
test('Every file open requests a fresh grant and uses the returned token', async () => {
  const calls=[];let count=0;
  const request=async(path,options)=>{calls.push({path,options});if(path.startsWith('me/')) return {data:{path:`/api/v1/digital-library/files/ent/file?token=grant${++count}`}}; return new Blob(['pdf'],{type:'application/pdf'});};
  await library.digitalFileBlob(request,'ent','file');await library.digitalFileBlob(request,'ent','file');
  assert.equal(calls[0].path,'me/digital-library/ent/access?fileId=file');
  assert.equal(calls[1].path,'digital-library/files/ent/file?token=grant1');
  assert.deepEqual(calls[1].options,{responseType:'blob'});
  assert.equal(calls[3].path,'digital-library/files/ent/file?token=grant2');
});
test('File access refusal stops the download', async () => {
  let calls=0;
  await assert.rejects(library.digitalFileBlob(async()=>{calls++;throw new Error('Access revoked');},'ent','file'),/Access revoked/);
  assert.equal(calls,1);
});
test('Binary account responses refresh expired sessions and surface JSON errors',async()=>{
 const previous=globalThis.fetch;const calls=[];
 try{
 globalThis.fetch=async(url)=>{calls.push(url); if(calls.length===1)return Response.json({success:false,message:'Expired'},{status:401});if(url==='/api/auth/refresh')return Response.json({success:true});return new Response('pdf bytes',{headers:{'content-type':'application/pdf'}});};
 const blob=await client.accountFetch('digital-library/files/ent/file?token=grant',{responseType:'blob'});
 assert.equal(await blob.text(),'pdf bytes');assert.equal(calls.length,3);
 globalThis.fetch=async()=>Response.json({success:false,message:'File access expired'},{status:403});
 await assert.rejects(client.accountFetch('digital-library/files/ent/file?token=old',{responseType:'blob'}),/File access expired/);
 }finally{globalThis.fetch=previous;}
});
