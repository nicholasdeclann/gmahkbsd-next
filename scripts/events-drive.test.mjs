import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import vm from "node:vm";
import ts from "typescript";
import * as types from "../src/lib/eventTypes.ts";
const require=createRequire(import.meta.url);
const source=await readFile(new URL("../src/lib/events.ts",import.meta.url),"utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
function setup(){
  const files=new Map([["announcement_root",{id:"announcement_root",mimeType:"application/vnd.google-apps.folder",parents:[]}]]);let sequence=0,invalidations=0,blockReader=false;
  function drive(readOnly=false){return {files:{
    async list(input){const parent=input.q.match(/^'([^']+)' in parents/)[1];const clauses=[...input.q.matchAll(/key='([^']+)' and value='([^']+)'/g)];const result=[...files.values()].filter(f=>!f.trashed&&f.parents.includes(parent)&&clauses.every(([,k,v])=>f.properties?.[k]===v));return {data:{files:result}};},
    async create(input){assert.equal(readOnly,false);const id=`drive_file_${String(++sequence).padStart(5,"0")}`;const file={id,...input.requestBody,mimeType:input.media?.mimeType||input.requestBody.mimeType,size:8,parents:input.requestBody.parents||[]};if(input.media){const chunks=[];for await(const chunk of input.media.body)chunks.push(chunk);file.bytes=Buffer.concat(chunks);}files.set(id,file);return {data:file};},
    async get(input){const file=files.get(input.fileId);if(!file)throw Object.assign(new Error("missing"),{response:{status:404}});if(readOnly&&blockReader&&file.mimeType==="application/vnd.google-apps.folder"&&file.id!=="announcement_root")throw new Error("Reader cannot access month");return {data:input.alt==="media"?file.bytes:file};},
    async update(input){assert.equal(readOnly,false);const file=files.get(input.fileId);assert.ok(file);Object.assign(file,input.requestBody);if(input.addParents)file.parents=[input.addParents];return {data:file};}
  }};}
  const module={exports:{}};
  const customRequire=name=>{
    if(name==="googleapis")return {google:{auth:{GoogleAuth:class{}},drive:()=>drive(true)}};
    if(name==="next/cache")return {unstable_cache:fn=>fn,revalidateTag:()=>invalidations++};
    if(name==="./drive")return {getAccessToken:async()=>"mock",getDriveService:()=>drive()};
    if(name==="./localDemo")return {isLocalDemo:()=>false};
    if(name==="./eventTypes")return types;
    return require(name);
  };
  const context=vm.createContext({Buffer,process:{env:{GOOGLE_SERVICE_ACCOUNT_JSON:"{}",GOOGLE_DRIVE_FOLDER_ID:"announcement_root"},cwd:()=>process.cwd()}});
  vm.runInContext(`(function(require,module,exports){${compiled}\n})`,context)(customRequire,module,module.exports);
  return {api:module.exports,files,setBlocked:()=>blockReader=true,get invalidations(){return invalidations;}};
}
const image=()=>new File([Buffer.from([137,80,78,71,13,10,26,10])],"photo.png",{type:"image/png"});
const details={title:"Kebaktian",eventDate:"2026-09-20",caption:"Keterangan foto",published:true};
test("Drive uploads create and reuse year/month folders with captions and public metadata",async()=>{
  const {api,files}=setup();const [first,second]=await Promise.all([api.uploadEvent(image(),details),api.uploadEvent(image(),details)]);
  const folders=[...files.values()].filter(f=>f.properties?.eventFolder);assert.equal(folders.length,3);
  const root=folders.find(f=>f.properties.eventFolder==="root"),year=folders.find(f=>f.properties.eventFolder==="2026"),month=folders.find(f=>f.properties.eventFolder==="2026-09");
  assert.equal(root.name,"Kegiatan Jemaat");assert.equal(year.parents[0],root.id);assert.equal(month.parents[0],year.id);assert.equal(month.name,"09 - September");
  assert.equal(files.get(first.id).parents[0],month.id);assert.equal(files.get(second.id).description,"Kegiatan: Kebaktian\nKeterangan foto");assert.equal(first.caption,details.caption);
  assert.equal((await api.listEvents("2026-09",false)).photos.length,2);
});
test("Drive date edits move files across years; drafts and unrelated files remain private",async()=>{
  const state=setup(),{api,files}=state;const photo=await api.uploadEvent(image(),details);
  await api.editEvent(photo.id,{...details,eventDate:"2027-01-02",caption:"Edited",published:false});
  const destination=[...files.values()].find(f=>f.properties?.eventFolder==="2027-01");assert.equal(files.get(photo.id).parents[0],destination.id);
  assert.equal((await api.listEvents("2026-09",false)).photos.length,0);assert.equal((await api.listEvents("2027-01",false)).photos.length,0);assert.equal((await api.listEvents("2027-01",true)).photos[0].caption,"Edited");
  await assert.rejects(()=>api.eventImage(photo.id,false),error=>error.status===404);assert.equal((await api.eventImage(photo.id,true)).mime,"image/png");
  files.get(photo.id).parents=["announcement_root"];await assert.rejects(()=>api.eventImage(photo.id,true),error=>error.status===404);
  files.get(photo.id).parents=[destination.id];await api.deleteEvent(photo.id);assert.equal(files.get(photo.id).trashed,true);assert.equal(state.invalidations,3);
});
test("Unreadable month folders stop upload before any photo is created",async()=>{
  const {api,files,setBlocked}=setup();setBlocked();await assert.rejects(()=>api.uploadEvent(image(),details),/Reader cannot access/);
  assert.equal([...files.values()].filter(f=>f.properties?.kind==="gmahkbsd-event").length,0);
});
