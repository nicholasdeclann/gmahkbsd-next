import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import * as model from '../src/lib/sabbathPosterTypes.ts';
const require=createRequire(import.meta.url);
const source=await readFile(new URL('../src/lib/sabbathPosters.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
function setup(configured=true){
 const files=new Map();let sequence=0,failRead=false,conflict=false;
 const env={GOOGLE_DRIVE_FOLDER_ID:'announcements_folder',GOOGLE_SERVICE_ACCOUNT_JSON:'{}',...(configured?{GOOGLE_SABBATH_POSTER_MAP_ID:'map-seeded'}:{})};
 if(configured)files.set('map-seeded',{id:'map-seeded',content:JSON.stringify({version:1,revision:'0',assignments:{}}),etag:'"1"'});
 const reader={files:{
  async list(){if(failRead)throw new Error('Drive unavailable');return {data:{files:[...files.values()].map(file=>({id:file.id}))}};},
  async get(input){if(failRead)throw new Error('Drive unavailable');if(input.fileId===env.GOOGLE_DRIVE_FOLDER_ID)return {data:{id:input.fileId,properties:{}},headers:{etag:'"folder"'}};const file=files.get(input.fileId);if(!file)throw Error('missing');return input.alt==='media'?{data:file.content,headers:{}}:{data:{id:file.id},headers:{etag:file.etag}};}
 }};
 const writer={files:{
  async get(){throw Object.assign(new Error('OAuth cannot read existing folder'),{response:{status:404}});},
  async create(input){assert.equal(input.requestBody.parents[0],env.GOOGLE_DRIVE_FOLDER_ID);const chunks=[];for await(const chunk of input.media.body)chunks.push(Buffer.from(chunk));const id='map-'+ ++sequence;files.set(id,{id,content:Buffer.concat(chunks).toString(),etag:'"1"'});return {data:{id}};},
  async update(input,options){assert.notEqual(input.fileId,env.GOOGLE_DRIVE_FOLDER_ID,'Never mutate parent folder metadata');const file=files.get(input.fileId);if(conflict||options.headers['If-Match']!==file.etag)throw Object.assign(new Error('precondition'),{response:{status:412}});const chunks=[];for await(const chunk of input.media.body)chunks.push(Buffer.from(chunk));file.content=Buffer.concat(chunks).toString();file.etag='"'+(Number(file.etag.replaceAll('"',''))+1)+'"';return {data:{id:file.id}};}
 }};
 const module={exports:{}};
 vm.runInNewContext(compiled,{module,exports:module.exports,Buffer,process:{env},console:{info(){}},require(name){if(name==='googleapis')return {google:{auth:{GoogleAuth:class{}},drive:()=>reader}};if(name==='./drive')return {getAccessToken:async()=>'token',getDriveService:()=>writer};if(name==='./localDemo')return {isLocalDemo:()=>false};if(name==='./sabbathPosterTypes')return model;return require(name);}});
 return {...module.exports,files,env,fail:()=>failRead=true,conflict:()=>conflict=true};
}
test('pinned app-owned registry works even when OAuth cannot read or modify the parent folder',async()=>{const store=setup();const a=await store.assignPoster('2026-11-07','poster_a','0');assert.equal((await store.getPosterAssignments()).assignments['2026-11-07'],'poster_a');const b=await store.assignPoster('2026-11-07','poster_b',a.revision);assert.equal(b.assignments['2026-11-07'],'poster_b');await assert.rejects(store.assignPoster('2026-11-07','poster_c',a.revision),error=>error.status===409);await store.assignPoster('2026-11-07',null,b.revision);assert.equal((await store.getPosterAssignments()).assignments['2026-11-07'],undefined);assert.equal(store.files.size,1);});
test('metadata ETag protects writes even when media response omits an ETag',async()=>{const store=setup(),a=await store.assignPoster('2026-11-07','poster_a','0');store.conflict();await assert.rejects(store.assignPoster('2026-11-07','poster_b',a.revision),error=>error.status===409);assert.equal((await store.getPosterAssignments()).assignments['2026-11-07'],'poster_a');});
test('failed lookup is not treated as no replacement',async()=>{const store=setup();store.fail();await assert.rejects(store.getPosterAssignments());});
test('bootstrap creates an empty app-owned map and requires a pinned ID before accepting assignments',async()=>{const store=setup(false);await assert.rejects(store.assignPoster('2026-11-07','poster_a','0'),error=>error.status===503);assert.equal(store.files.size,1);assert.deepEqual(JSON.parse([...store.files.values()][0].content).assignments,{});store.env.GOOGLE_SABBATH_POSTER_MAP_ID=[...store.files.keys()][0];await store.assignPoster('2026-11-07','poster_a','0');assert.equal((await store.getPosterAssignments()).assignments['2026-11-07'],'poster_a');});
test('moving a poster clears only its own former date',async()=>{const store=setup(),a=await store.assignPoster('2026-11-07','poster_a','0'),b=await store.assignPoster('2026-11-14','poster_a',a.revision);assert.equal(b.assignments['2026-11-07'],undefined);assert.equal(b.assignments['2026-11-14'],'poster_a');});
