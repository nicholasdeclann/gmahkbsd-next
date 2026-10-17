import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
const source=await fs.readFile(new URL('../src/app/api/admin/canva/route.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function setup({denied=null,demo=false,revision='fresh',blockingErrors=[],schemaError=false}={}){
 const writes=[];const preview={demo,revision,blockingErrors,fields:{next_sabbath:'2026-10-24'},announcements:[],warnings:[]};
 const module={exports:{}};const imports={
  'next/server':{NextResponse:{json:(data,options={})=>({data,status:options.status||200})}},
  '@/lib/adminRequest':{adminRequestError:async()=>denied},
  '@/lib/canvaData':{loadCanvaPreview:async()=>preview},
  '@/lib/canva':{validateCanvaFields:async()=>{if(schemaError)throw new Error('Missing fields');},canvaRequest:async(path,body)=>{writes.push({path,body});return {job:{id:'job_one',status:'in_progress'}};}},
  '@/lib/canvaPreview':{CANVA_DESIGN_ID:'DAG-9nAgcSE',selectedCanvaFields:(p,ids)=>{if(ids.length)throw new Error('Invalid selection');return p.fields;}}
 };
 vm.runInNewContext(`(function(require,module,exports){${compiled}\n})`,{URL})(name=>{assert.ok(imports[name],name);return imports[name];},module,module.exports);
 return {api:module.exports,writes};
}
const req=(revision='fresh',announcementIds=[])=>({json:async()=>({revision,announcementIds})});
test('auth rejection never reaches Canva',async()=>{const {api,writes}=setup({denied:{status:401}});assert.equal((await api.POST(req())).status,401);assert.equal(writes.length,0);});
test('demo, stale preview, and missing source prevent Canva writes',async()=>{
 for(const [config,request] of [[{demo:true},req()],[{},req('stale')],[{blockingErrors:['missing']},req()]]){const {api,writes}=setup(config);assert.equal((await api.POST(request)).status,409);assert.equal(writes.length,0);}
});
test('schema failures never start autofill',async()=>{const {api,writes}=setup({schemaError:true});assert.equal((await api.POST(req())).status,503);assert.equal(writes.length,0);});
test('valid sync updates the exact embedded design with server-side data',async()=>{
 const {api,writes}=setup();const response=await api.POST(req());assert.equal(response.status,200);assert.equal(response.data.job,'job_one');
 assert.equal(writes[0].path,'autofills');assert.equal(writes[0].body.type,'update_design');assert.equal(writes[0].body.design_id,'DAG-9nAgcSE');assert.equal(writes[0].body.data.next_sabbath.text,'2026-10-24');
});
