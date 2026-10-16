import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
const require = createRequire(import.meta.url);
const defaults = {liturgy:{sheetId:"workbook_original",kertasAcaraGid:"1",laguSionGid:"2",quarterlyScheduleGid:"3"},schedule:{sheetId:"participants_original",gid:"4"}};
const compiled = {};
for (const name of ["sheetSources","sheetSettings","weeklySheet","kertasAcaraForm"]) compiled[name] = ts.transpileModule(await readFile(new URL(`../src/lib/${name}.ts`,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
function setup() {
  const files = new Map(); let writes=0;
  const drive = {files:{
    list:async()=>({data:{files:[...files.keys()].map(id=>({id}))}}),
    get:async({fileId})=>({data:files.get(fileId)}),
    create:async({media,requestBody})=>{assert.equal(requestBody.properties.kind,"gmahkbsd-sheet-settings");assert.equal(requestBody.permissions,undefined);let text="";for await(const chunk of media.body)text+=chunk;files.set("settings-file",text);writes++;return {data:{id:"settings-file"}};},
    update:async({fileId,media})=>{let text="";for await(const chunk of media.body)text+=chunk;files.set(fileId,text);writes++;return {data:{id:fileId}};},
  }};
  const loaded={};function load(name){if(loaded[name])return loaded[name];const module={exports:{}};vm.runInNewContext(compiled[name],{module,exports:module.exports,process:{env:{GOOGLE_DRIVE_REFRESH_TOKEN:"fake"}},Date,URL,URLSearchParams,console,require:(id)=>{
    if(id==="server-only")return {};
    if(id==="@/config/church")return {churchConfig:{sheets:defaults}};
    if(id==="./sheetSources")return load("sheetSources");
    if(id==="./localDemo")return {isLocalDemo:()=>false};
    if(id==="./drive")return {createOAuthClient:()=>({setCredentials:()=>{}})};
    if(id==="googleapis")return {google:{drive:()=>drive}};
    return require(id);
  }});return loaded[name]=module.exports;}
  return {api:load("sheetSettings"),types:load("sheetSources"),files,get writes(){return writes;}};
}
test("Only Google spreadsheet links and valid tab identifiers are accepted",()=>{
  const {types}=setup();assert.equal(types.parseSheetLink("https://docs.google.com/spreadsheets/d/workbook_original/edit#gid=42").gid,"42");
  for(const url of ["https://evil.example/spreadsheets/d/workbook_original/edit","http://docs.google.com/spreadsheets/d/workbook_original/edit","https://docs.google.com/spreadsheets/d/workbook_original/edit#gid=oops"])assert.throws(()=>types.parseSheetLink(url));
});
test("Settings persist in a private Drive file, reject stale saves, and preserve rollback sources",async()=>{
  const state=setup(),{api}=state;const current=await api.getSheetSettings();assert.equal(state.writes,0);
  const next={...defaults,liturgy:{...defaults.liturgy,sheetId:"workbook_replacement"}};
  const saved=await api.saveSheetSettings(next,current.revision);assert.equal(state.writes,1);assert.equal(saved.previous.liturgy.sheetId,defaults.liturgy.sheetId);
  assert.equal((await api.getSheetSources()).liturgy.sheetId,"workbook_replacement");
  await assert.rejects(()=>api.saveSheetSettings(defaults,current.revision));assert.equal(state.writes,1);
  const restored=await api.saveSheetSettings(saved.previous,saved.revision);assert.equal(restored.sources.liturgy.sheetId,defaults.liturgy.sheetId);assert.equal(restored.previous.liturgy.sheetId,"workbook_replacement");
  assert.equal((await api.getSheetSources()).liturgy.sheetId,defaults.liturgy.sheetId);
});
test("Duplicate settings files fail explicitly instead of silently selecting a source",async()=>{
  const {api,files}=setup();files.set("first","{}");files.set("second","{}");await assert.rejects(()=>api.getSheetSettings());
});
test("An open weekly form cannot save into a replacement workbook even when cell values match",async()=>{
  let sources=defaults,writes=0;
  const form={exports:{}};vm.runInNewContext(compiled.kertasAcaraForm,{module:form,exports:form.exports,Date,Intl});
  const module={exports:{}};
  vm.runInNewContext(compiled.weeklySheet,{module,exports:module.exports,process:{env:{GOOGLE_SERVICE_ACCOUNT_JSON:"{}",GOOGLE_SHEETS_WRITES_ENABLED:"true"}},Date,Map,Set,console,require:id=>{
    if(id==="./sheetSettings")return {getSheetSettings:async()=>({sources})};
    if(id==="./localDemo")return {isWeeklyDemo:()=>false};
    if(id==="./kertasAcaraForm")return form.exports;
    if(id==="googleapis")return {google:{auth:{GoogleAuth:class{}},sheets:()=>({spreadsheets:{get:async()=>({data:{sheets:[{properties:{sheetId:1},data:[]},{properties:{sheetId:2},data:[]}]}}),batchUpdate:async()=>{writes++;}}})}};
    return require(id);
  }});
  const before=await module.exports.readWeeklySheet();sources={...defaults,liturgy:{...defaults.liturgy,sheetId:"workbook_replacement"}};
  await assert.rejects(()=>module.exports.saveWeeklySheet(before.values,before.revision),error=>error.status===409);assert.equal(writes,0);
});

