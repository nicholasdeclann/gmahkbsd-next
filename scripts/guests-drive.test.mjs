import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {randomUUID} from "node:crypto";
import vm from "node:vm";
import ts from "typescript";
import * as types from "../src/lib/guestTypes.ts";
const require=createRequire(import.meta.url);
const source=await readFile(new URL("../src/lib/guests.ts",import.meta.url),"utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
function setup(){
  const files=new Map();let sequence=0;
  const drive={files:{
    async list(input){const parent=input.q.match(/'([^']+)' in parents/)?.[1];const clauses=[...input.q.matchAll(/key='([^']+)' and value='([^']+)'/g)];return {data:{files:[...files.values()].filter(file=>!file.trashed&&(parent==="root"?!file.parents.length:parent?file.parents.includes(parent):true)&&clauses.every(([,key,value])=>file.properties?.[key]===value))}};},
    async create(input){const id=`guest_file_${String(++sequence).padStart(5,"0")}`,file={id,...input.requestBody,mimeType:input.media?.mimeType||input.requestBody.mimeType,parents:input.requestBody.parents||[],etag:'"1"'};if(input.media){const chunks=[];for await(const chunk of input.media.body)chunks.push(chunk);file.bytes=Buffer.concat(chunks);}files.set(id,file);return {data:file};},
    async get(input){const file=files.get(input.fileId);if(!file)throw Object.assign(new Error("missing"),{response:{status:404}});return {data:file,headers:{etag:file.etag}};},
    async update(input,options){const file=files.get(input.fileId);assert.ok(file);assert.equal(options.headers["If-Match"],file.etag);Object.assign(file,input.requestBody);if(input.media){const chunks=[];for await(const chunk of input.media.body)chunks.push(chunk);file.bytes=Buffer.concat(chunks);}file.etag=`"${Number(file.etag.replaceAll('"',''))+1}"`;return {data:file};}
  }};
  const module={exports:{}};
  const customRequire=name=>{
    if(name==="googleapis")return {google:{drive:()=>drive}};
    if(name==="./drive")return {createOAuthClient:()=>({setCredentials:value=>assert.equal(value.refresh_token,"fake-church-shared-token")})};
    if(name==="./localDemo")return {isLocalDemo:()=>false};
    if(name==="./guestTypes")return types;
    return require(name);
  };
  vm.runInNewContext(`(function(require,module,exports){${compiled}\n})`,{Buffer,process:{env:{GOOGLE_CLIENT_ID:"mock",GOOGLE_CLIENT_SECRET:"mock",GOOGLE_DRIVE_REFRESH_TOKEN:"fake-church-shared-token"}}})(customRequire,module,module.exports);
  return {api:module.exports,files};
}
const details={date:"2026-10-17",name:"Kel. John Doe",church:"Jemaat contoh",type:"group",pax:4};
test("Guest records create a separate My Drive root and one JSON file per group",async()=>{
  const {api,files}=setup();const created=await api.createGuest(details,randomUUID());
  const root=[...files.values()].find(file=>file.properties?.guestFolder==="root");assert.equal(root.name,"Daftar Tamu");assert.deepEqual(root.parents,[]);
  const week=[...files.values()].find(file=>file.properties?.guestFolder===details.date);assert.ok(week);assert.equal(files.get(created.id).parents[0],week.id);
  assert.equal(JSON.parse(files.get(created.id).bytes).pax,4);assert.equal((await api.listGuests(details.date))[0].name,details.name);
  assert.equal((await api.listGuests("2026-10-24")).length,0);
});
test("Save retries avoid duplicate groups and stale edits cannot overwrite newer records",async()=>{
  const {api,files}=setup(),requestId=randomUUID();const created=await api.createGuest(details,requestId);
  assert.equal((await api.createGuest(details,requestId)).id,created.id);
  assert.equal([...files.values()].filter(file=>file.properties?.kind==="gmahkbsd-guest").length,1);
  const edited=await api.updateGuest(created.id,{...details,pax:5},created.revision);assert.equal(edited.pax,5);assert.equal(JSON.parse(files.get(created.id).bytes).pax,5);
  await assert.rejects(()=>api.updateGuest(created.id,details,created.revision),error=>error.status===409);
  await assert.rejects(()=>api.deleteGuest(created.id,details.date,created.revision),error=>error.status===409);
  await api.deleteGuest(created.id,details.date,edited.revision);assert.equal(files.get(created.id).trashed,true);assert.equal((await api.listGuests(details.date)).length,0);
});
test("Different ushers adding guests preserve both records; unrelated files cannot be edited",async()=>{
  const {api,files}=setup();const [first,second]=await Promise.all([api.createGuest(details,randomUUID()),api.createGuest({...details,name:"Another family"},randomUUID())]);
  assert.equal((await api.listGuests(details.date)).length,2);
  assert.equal([...files.values()].filter(file=>file.properties?.guestFolder).length,3);
  files.get(first.id).parents=["private_other_folder"];await assert.rejects(()=>api.updateGuest(first.id,details,first.revision),error=>error.status===404);
  files.get(second.id).properties.kind="gmahkbsd-announcement";await assert.rejects(()=>api.deleteGuest(second.id,details.date,second.revision),error=>error.status===404);
});
test("Phone and omitted headcount survive storage and edits",async()=>{
  const {api}=setup(),requestId=randomUUID();
  const input=types.guestDetails({...details,pax:null,phone:"08123456789"});
  const created=await api.createGuest(input,requestId);
  const listed=(await api.listGuests(details.date))[0];
  assert.equal(listed.phone,"08123456789");assert.equal(listed.pax,null);
  await assert.rejects(()=>api.createGuest({...input,phone:"08999"},requestId),error=>error.status===409);
  const edited=await api.updateGuest(created.id,{...input,phone:"08999"},created.revision);
  assert.equal(edited.phone,"08999");assert.equal(edited.pax,null);
});
