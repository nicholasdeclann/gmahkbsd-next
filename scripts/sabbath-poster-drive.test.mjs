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
 const files=new Map();let sequence=0,failRead=false,loseResponse=false;
 const env={GOOGLE_DRIVE_FOLDER_ID:'announcements_folder',GOOGLE_SERVICE_ACCOUNT_JSON:'{}',...(configured?{GOOGLE_SABBATH_POSTER_MAP_ID:'map-seeded'}:{})};
 if(configured)files.set('map-seeded',{id:'map-seeded',content:JSON.stringify({version:1,revision:'0',assignments:{}}),properties:{kind:'gmahkbsd-sabbath-posters'},createdTime:'2026-11-01T00:00:00.000Z'});
 const reader={files:{
  async list(input){if(failRead)throw new Error('Drive unavailable');const kind=input.q.includes("value='gmahkbsd-poster-change'")?'gmahkbsd-poster-change':'gmahkbsd-sabbath-posters';return {data:{files:[...files.values()].filter(file=>file.properties.kind===kind).map(file=>({id:file.id,properties:file.properties,createdTime:file.createdTime}))}};},
  async get(input){if(failRead)throw new Error('Drive unavailable');if(input.fileId===env.GOOGLE_DRIVE_FOLDER_ID)return {data:{id:input.fileId,properties:{}},headers:{etag:'"folder"'}};const file=files.get(input.fileId);if(!file)throw Error('missing');return input.alt==='media'?{data:file.content,headers:{}}:{data:{id:file.id},headers:{etag:file.etag}};}
 }};
 const writer={files:{
  async get(){throw Object.assign(new Error('OAuth cannot read existing folder'),{response:{status:404}});},
  async create(input){assert.equal(input.requestBody.parents[0],env.GOOGLE_DRIVE_FOLDER_ID);const chunks=[];for await(const chunk of input.media.body)chunks.push(Buffer.from(chunk));const id='map-'+ ++sequence;files.set(id,{id,content:Buffer.concat(chunks).toString(),properties:input.requestBody.properties,createdTime:new Date(Date.parse('2026-11-01T01:00:00Z')+sequence).toISOString()});if(loseResponse)throw Error('Response lost after append');return {data:{id}};},
  async update(){throw Error('Registry and folder must never be overwritten');}
 }};
 const module={exports:{}};
 vm.runInNewContext(compiled,{module,exports:module.exports,Buffer,process:{env},console:{info(){}},require(name){if(name==='googleapis')return {google:{auth:{GoogleAuth:class{}},drive:()=>reader}};if(name==='./drive')return {getAccessToken:async()=>'token',getDriveService:()=>writer};if(name==='./localDemo')return {isLocalDemo:()=>false};if(name==='./sabbathPosterTypes')return model;return require(name);}});
 return {...module.exports,files,env,fail:()=>failRead=true,loseResponse:()=>loseResponse=true};
}
test('pinned app-owned registry works even when OAuth cannot read or modify the parent folder',async()=>{const store=setup();const a=await store.assignPoster('2026-11-07','poster_a','0');assert.equal((await store.getPosterAssignments()).assignments['2026-11-07'],'poster_a');const b=await store.assignPoster('2026-11-07','poster_b',a.revision);assert.equal(b.assignments['2026-11-07'],'poster_b');await assert.rejects(store.assignPoster('2026-11-07','poster_c',a.revision),error=>error.status===409);await store.assignPoster('2026-11-07',null,b.revision);assert.equal((await store.getPosterAssignments()).assignments['2026-11-07'],undefined);assert.ok(store.files.size>1);assert.deepEqual(JSON.parse(store.files.get('map-seeded').content).assignments,{});});
test('competing changes preserve one deterministic revision without overwriting the map',async()=>{const store=setup();const results=await Promise.allSettled([store.assignPoster('2026-11-07','poster_a','0'),store.assignPoster('2026-11-07','poster_b','0')]);assert.equal(results.filter(result=>result.status==='fulfilled').length,1);assert.equal(results.filter(result=>result.status==='rejected'&&result.reason.status===409).length,1);assert.deepEqual(JSON.parse(store.files.get('map-seeded').content).assignments,{});assert.ok(['poster_a','poster_b'].includes((await store.getPosterAssignments()).assignments['2026-11-07']));});
test('failed lookup is not treated as no replacement',async()=>{const store=setup();store.fail();await assert.rejects(store.getPosterAssignments());});
test('bootstrap creates an empty app-owned map and requires a pinned ID before accepting assignments',async()=>{const store=setup(false);await assert.rejects(store.assignPoster('2026-11-07','poster_a','0'),error=>error.status===503);assert.equal(store.files.size,1);assert.deepEqual(JSON.parse([...store.files.values()][0].content).assignments,{});store.env.GOOGLE_SABBATH_POSTER_MAP_ID=[...store.files.keys()][0];await store.assignPoster('2026-11-07','poster_a','0');assert.equal((await store.getPosterAssignments()).assignments['2026-11-07'],'poster_a');});
test('moving a poster clears only its own former date',async()=>{const store=setup(),a=await store.assignPoster('2026-11-07','poster_a','0'),b=await store.assignPoster('2026-11-14','poster_a',a.revision);assert.equal(b.assignments['2026-11-07'],undefined);assert.equal(b.assignments['2026-11-14'],'poster_a');});

test('lost append response leaves the committed assignment readable',async()=>{const store=setup();store.loseResponse();await assert.rejects(store.assignPoster('2026-11-07','poster_a','0'));assert.equal((await store.getPosterAssignments()).assignments['2026-11-07'],'poster_a');});
