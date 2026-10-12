import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {currentSaturday,isSaturday,guestDetails} from "../src/lib/guestTypes.ts";
const base=process.env.DASHBOARD_TEST_URL||"http://127.0.0.1:3001";
assert.ok(["127.0.0.1","localhost"].includes(new URL(base).hostname));
assert.equal((await(await fetch(`${base}/api/guests`)).json()).mode,"demo","Refuse non-demo guest writes");
const date=currentSaturday(),ids=[];let count=0;
const headers={Origin:base,"Content-Type":"application/json"};
function check(name,value,expected){assert.deepEqual(value,expected,name);console.log(`PASS ${name}`);count++;}
async function request(method,path,body,origin=base){const response=await fetch(`${base}${path}`,{method,headers:{...headers,Origin:origin},body:JSON.stringify(body)});return {status:response.status,data:await response.json()};}
try{
  check("Saturday stays on today in Jakarta",currentSaturday(new Date("2026-10-16T18:00:00Z")),"2026-10-17");
  check("Sunday selects upcoming Saturday",currentSaturday(new Date("2026-10-18T01:00:00+07:00")),"2026-10-24");
  check("Non-Saturday rejected",isSaturday("2026-10-18"),false);
  check("Impossible date rejected",isSaturday("2026-02-30"),false);
  assert.throws(()=>guestDetails({date,name:"Name",church:"",type:"individual",pax:2}));count++;console.log("PASS Individual must be one person");
  const details={date,name:"Guest fixture",church:"Jemaat contoh",type:"individual",pax:1,requestId:randomUUID()};
  check("Cross-origin write blocked",(await request("POST","/api/guests",details,"https://invalid.example")).status,403);
  check("Invalid date API rejected",(await fetch(`${base}/api/guests?date=2026-10-18`)).status,400);
  const created=await request("POST","/api/guests",details);check("Create without login",created.status,201);ids.push(created.data.guest);
  check("Retried create keeps same entry",(await request("POST","/api/guests",details)).data.guest.id,created.data.guest.id);
  check("Changed retry payload conflicts",(await request("POST","/api/guests",{...details,name:"Changed name"})).status,409);
  const group=await request("POST","/api/guests",{...details,name:"Kel. Fixture",type:"group",pax:4,requestId:randomUUID()});check("Group headcount saved",group.data.guest.pax,4);ids.push(group.data.guest);
  const listed=await(await fetch(`${base}/api/guests?date=${date}`)).json();check("Both guests readable without login",ids.every(entry=>listed.guests.some(g=>g.id===entry.id)),true);
  const otherDate=date==="2026-10-24"?"2026-10-17":"2026-10-24";
  check("Weeks kept separate",(await(await fetch(`${base}/api/guests?date=${otherDate}`)).json()).guests.some(g=>ids.some(entry=>entry.id===g.id)),false);
  const edited=await request("PATCH",`/api/guests/${ids[1].id}`,{...group.data.guest,pax:5});check("Edit headcount",edited.data.guest.pax,5);
  check("Stale edit conflicts",(await request("PATCH",`/api/guests/${ids[1].id}`,{...group.data.guest,pax:6})).status,409);
  check("Stale delete conflicts",(await request("DELETE",`/api/guests/${ids[1].id}`,group.data.guest)).status,409);ids[1]=edited.data.guest;
  check("Fractional pax rejected",(await request("POST","/api/guests",{...details,type:"group",pax:2.5})).status,400);
  check("Blank name rejected",(await request("POST","/api/guests",{...details,name:" "})).status,400);
  check("Single-person group rejected",(await request("POST","/api/guests",{...details,type:"group",pax:1})).status,400);
  for(const path of ["/tamu","/tamu/mc"]){const response=await fetch(base+path);check(`${path} no login redirect`,response.status,200);check(`${path} excluded from indexing`,(await response.text()).includes('noindex'),true);}
}finally{for(const entry of ids){check("Delete without login",(await request("DELETE",`/api/guests/${entry.id}`,entry)).status,200);}}
console.log(`${count} guest checks passed; only local disposable entries were used.`);
