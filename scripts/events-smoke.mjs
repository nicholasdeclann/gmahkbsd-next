import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {previousMonth,jakartaMonth,eventDetails} from "../src/lib/eventTypes.ts";
const base=process.env.DASHBOARD_TEST_URL||"http://127.0.0.1:3001";
assert.ok(["127.0.0.1","localhost"].includes(new URL(base).hostname));
assert.equal((await(await fetch(`${base}/api/events`)).json()).mode,"demo","Tests must use local demo storage");
const env=await readFile(new URL("../.env.development.local",import.meta.url),"utf8");
const password=env.match(/^ADMIN_PASSWORD=(.+)$/m)?.[1].trim();
const login=await fetch(`${base}/api/admin/login`,{method:"POST",headers:{Origin:base,"Content-Type":"application/json"},body:JSON.stringify({password})});
assert.equal(login.status,200);const cookie=login.headers.get("set-cookie").split(";")[0];
const headers={Origin:base,Cookie:cookie}, ids=[];let count=0;
function check(name,value,expected){assert.deepEqual(value,expected,name);console.log(`PASS ${name}`);count++;}
const month=previousMonth(), date=`${month}-15`, current=`${jakartaMonth()}-01`;
const bytes=await readFile(new URL("../public/assets/images/logo.png",import.meta.url));
function form(published=true,eventDate=date,blob=bytes,type="image/png"){const data=new FormData();data.append("file",new Blob([blob],{type}),"event-test.png");data.append("title","Disposable event fixture");data.append("caption","Photo caption");data.append("eventDate",eventDate);data.append("published",String(published));return data;}
async function list(query=""){const response=await fetch(`${base}/api/events?month=${month}${query}`,query.includes("manage")?{headers}:{});assert.equal(response.status,200);return response.json();}
async function patch(id,details){return fetch(`${base}/api/events/${id}`,{method:"PATCH",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify(details)});}
try{
  check("January crosses year boundary",previousMonth(new Date("2027-01-01T00:00:00+07:00")),"2026-12");
  check("Jakarta boundary differs from UTC",previousMonth(new Date("2026-09-30T18:00:00Z")),"2026-09");
  assert.throws(()=>eventDetails({title:"Event",eventDate:"2026-02-30",caption:"",published:true}));count++;console.log("PASS Invalid calendar date rejected");
  check("Invalid month rejected",(await fetch(`${base}/api/events?month=2026-13`)).status,400);
  check("Admin list protected",(await fetch(`${base}/api/events?manage=true`)).status,401);
  check("Anonymous upload blocked",(await fetch(`${base}/api/events`,{method:"POST",headers:{Origin:base},body:form()})).status,401);
  check("Cross-origin upload blocked",(await fetch(`${base}/api/events`,{method:"POST",headers:{...headers,Origin:"https://invalid.example"},body:form()})).status,403);
  check("Fake image rejected",(await fetch(`${base}/api/events`,{method:"POST",headers,body:form(true,date,"bad bytes")})).status,400);
  for(const published of [true,false]){const response=await fetch(`${base}/api/events`,{method:"POST",headers,body:form(published)});check("Upload photo",response.status,201);ids.push((await response.json()).photo.id);}
  check("Public lists published photo",(await list()).photos.some(p=>p.id===ids[0]),true);
  check("Public hides draft",(await list()).photos.some(p=>p.id===ids[1]),false);
  check("Admin lists draft",(await list("&manage=true")).photos.some(p=>p.id===ids[1]),true);
  check("Draft image is private",(await fetch(`${base}/api/events/${ids[1]}/image`)).status,404);
  check("Admin can preview draft",(await fetch(`${base}/api/events/${ids[1]}/image`,{headers})).status,200);
  check("Image bytes preserved",Buffer.from(await(await fetch(`${base}/api/events/${ids[0]}/image`)).arrayBuffer()).equals(bytes),true);
  check("Edit title caption and date",(await patch(ids[0],{title:"Edited event",caption:"New caption",eventDate:current,published:true})).status,200);
  check("Corrected date removes photo from old month",(await list()).photos.some(p=>p.id===ids[0]),false);
  const edited=(await(await fetch(`${base}/api/events?month=${current.slice(0,7)}`)).json()).photos.find(p=>p.id===ids[0]);check("Corrected photo in new month",edited.caption,"New caption");
  check("Unpublish",(await patch(ids[0],{title:"Edited event",caption:"New caption",eventDate:current,published:false})).status,200);
  check("Unpublished image inaccessible",(await fetch(`${base}/api/events/${ids[0]}/image`)).status,404);
  check("Publish draft",(await patch(ids[1],{title:"Event",caption:"Caption",eventDate:date,published:true})).status,200);
  check("Published draft public",(await list()).photos.some(p=>p.id===ids[1]),true);
  check("Anonymous delete blocked",(await fetch(`${base}/api/events/${ids[1]}`,{method:"DELETE",headers:{Origin:base}})).status,401);
  check("Unknown image blocked",(await fetch(`${base}/api/events/local-unknown/image`)).status,404);
  check("Homepage preview capped",(await list("&preview=true")).photos.length<=12,true);
}finally{
  for(const id of ids){const response=await fetch(`${base}/api/events/${id}`,{method:"DELETE",headers});assert.equal(response.status,200);check("Deleted image unavailable",(await fetch(`${base}/api/events/${id}/image`)).status,404);}
}
console.log(`${count} event checks passed; disposable local fixtures removed.`);
