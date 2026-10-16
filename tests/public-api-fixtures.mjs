// Loaded only by the isolated student browser test server, never by the app.
if(process.env.AWAKEN_PUBLIC_TEST_FIXTURES!=="1")throw Error("Public fixtures require the isolated test server flag.");
const originalFetch=globalThis.fetch;
globalThis.fetch=async function(input,options){
 const url=new URL(typeof input==="string"||input instanceof URL?input:input.url);
 if(url.pathname.endsWith("/public/blogs/blog-image-fixture"))return Response.json({success:true,data:{id:"blog-image-fixture",slug:"blog-image-fixture",title:"Uploaded image article",content:"An article with its uploaded cover.",featuredImageMediaId:"6ad0b48d3d47adf5350349a4",featuredImage:"/api/v1/public/media/6ad0b48d3d47adf5350349a4/file"}});
 if(url.pathname.endsWith("/public/blogs"))return Response.json({success:true,data:[],pagination:{page:1,pages:1,total:0}});
 if(url.pathname.endsWith("/public/session-types/session-fixture"))return Response.json({success:true,message:"Success",data:{id:"type",slug:"session-fixture",title:"Private Mindful Breathing",description:"A private breathing practice",mode:"ONLINE",timezone:"Asia/Kolkata",price:0,currency:"INR",durationMinutes:30,capacity:1,facilitatorName:"Practice Teacher"}});
 if(url.pathname.endsWith("/public/session-types/type/slots"))return Response.json({success:true,data:[{id:"public-availability",availabilityId:"public-availability",startsAt:"2099-10-24T04:30:00.000Z",endsAt:"2099-10-24T05:00:00.000Z",available:true,seatsAvailable:1}],pagination:{page:1,limit:100,pages:1,total:1}});
 return originalFetch(input,options);
};
