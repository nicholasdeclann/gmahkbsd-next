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
function setup(){
 const files=new Map();const folder={id:"announcements_folder",properties:{},etag:'"1"'};let sequence=0,failRead=false,conflict=false,loseResponse=false;
 const drive={files:{
  async list(){if(failRead)throw new Error('Drive unavailable');return {data:{files:[...files.values()].map(file=>({id:file.id}))}};},
  async get({fileId}){if(failRead)throw new Error('Drive unavailable');if(fileId===folder.id)return {data:structuredClone(folder),headers:{etag:folder.etag}};const file=files.get(fileId);return {data:file.content,headers:{etag:file.etag}};},
  async create(input){const chunks=[];for await(const chunk of input.media.body)chunks.push(Buffer.from(chunk));const id='map-'+ ++sequence;files.set(id,{id,content:Buffer.concat(chunks).toString(),etag:'"1"'});return {data:{id}};},
  async update(input,options){const file=input.fileId===folder.id?folder:files.get(input.fileId);if(input.requestBody?.trashed){files.delete(input.fileId);return {data:{id:input.fileId}};}if(conflict||options.headers['If-Match']!==file.etag)throw Object.assign(new Error('precondition'),{response:{status:412}});if(input.requestBody?.properties)Object.assign(file.properties,input.requestBody.properties);if(input.media){const chunks=[];for await(const chunk of input.media.body)chunks.push(Buffer.from(chunk));file.content=Buffer.concat(chunks).toString();}file.etag='"'+(Number(file.etag.replaceAll('"',''))+1)+'"';if(loseResponse&&file.id===folder.id)throw new Error('response lost after commit');return {data:{id:file.id}};}
 }};
 const module={exports:{}};
 vm.runInNewContext(compiled,{module,exports:module.exports,Buffer,process:{env:{GOOGLE_DRIVE_FOLDER_ID:'announcements_folder',GOOGLE_SERVICE_ACCOUNT_JSON:'{}'}},require(name){if(name==='googleapis')return {google:{auth:{GoogleAuth:class{}},drive:()=>drive}};if(name==='./drive')return {getAccessToken:async()=>'token',getDriveService:()=>drive};if(name==='./localDemo')return {isLocalDemo:()=>false};if(name==='./sabbathPosterTypes')return model;return require(name);}});
 return {...module.exports,files,fail:()=>failRead=true,conflict:()=>conflict=true,loseResponse:()=>loseResponse=true};
}
test('Drive map is created in the existing folder and read without a staff token',async()=>{const store=setup();assert.equal((await store.getPosterAssignments()).revision,'0');const a=await store.assignPoster('2026-11-07','poster_a','0');assert.equal((await store.getPosterAssignments()).assignments['2026-11-07'],'poster_a');assert.equal(store.files.size,1);const b=await store.assignPoster('2026-11-07','poster_b',a.revision);assert.equal(b.assignments['2026-11-07'],'poster_b');await assert.rejects(store.assignPoster('2026-11-07','poster_c',a.revision),error=>error.status===409);await store.assignPoster('2026-11-07',null,b.revision);assert.equal((await store.getPosterAssignments()).assignments['2026-11-07'],undefined);});
test('conditional writes reject concurrent changes instead of overwriting them',async()=>{const store=setup(),a=await store.assignPoster('2026-11-07','poster_a','0');store.conflict();await assert.rejects(store.assignPoster('2026-11-07','poster_b',a.revision),error=>error.status===409);assert.equal((await store.getPosterAssignments()).assignments['2026-11-07'],'poster_a');});
test('failed lookup is not treated as no replacement',async()=>{const store=setup();store.fail();await assert.rejects(store.getPosterAssignments());});
test('competing first writes publish a single map and clean their own unused candidate',async()=>{const store=setup();const results=await Promise.allSettled([store.assignPoster('2026-11-07','poster_a','0'),store.assignPoster('2026-11-07','poster_b','0')]);assert.equal(results.filter(result=>result.status==='fulfilled').length,1);assert.equal(results.filter(result=>result.status==='rejected').length,1);assert.equal(store.files.size,1);assert.ok(['poster_a','poster_b'].includes((await store.getPosterAssignments()).assignments['2026-11-07']));});
test('moving a poster clears only its own former date',async()=>{const store=setup(),a=await store.assignPoster('2026-11-07','poster_a','0'),b=await store.assignPoster('2026-11-14','poster_a',a.revision);assert.equal(b.assignments['2026-11-07'],undefined);assert.equal(b.assignments['2026-11-14'],'poster_a');});

test('lost bootstrap response never trashes the published map',async()=>{const store=setup();store.loseResponse();await assert.rejects(store.assignPoster('2026-11-07','poster_a','0'));assert.equal(store.files.size,1);assert.equal((await store.getPosterAssignments()).assignments['2026-11-07'],'poster_a');});
