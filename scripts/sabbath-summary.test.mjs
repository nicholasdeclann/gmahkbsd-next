import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import vm from "node:vm";
import ts from "typescript";
const require=createRequire(import.meta.url),compiled={};
for(const name of ["quarterlySchedule","sabbathSummary"])compiled[name]=ts.transpileModule(await readFile(new URL(`../src/lib/${name}.ts`,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const loaded={};function load(name){if(loaded[name])return loaded[name];const module={exports:{}};vm.runInNewContext(compiled[name],{module,exports:module.exports,Date,Intl,console,require:id=>id==="./quarterlySchedule"?load("quarterlySchedule"):require(id)});return loaded[name]=module.exports;}
const {upcomingSabbath,buildSabbathSummary,summaryRows}=load("sabbathSummary");
const row=(...values)=>({c:values.map(v=>v===null?null:{v})});
const details=[row("Period","October 17, 2026"),row("Judul Khotbah","Sermon for this Sabbath"),row("Ayat Inti","2 Timotius 3 : 16")];
const participants=[row(null,"TRIWULAN 4 - TAHUN 2026"),row("TANGGAL","03 Oct","10 Oct","17 Oct"),row("Pembicara","Speaker 1","Speaker 2","Speaker 3")];
test("Jakarta Sabbath stays on Saturday and moves to the next week at Sunday midnight",()=>{
  assert.equal(upcomingSabbath(new Date("2026-10-16T12:00:00Z")),"2026-10-17");
  assert.equal(upcomingSabbath(new Date("2026-10-17T16:59:59Z")),"2026-10-17");
  assert.equal(upcomingSabbath(new Date("2026-10-17T17:00:00Z")),"2026-10-24");
});
test("Current sermon and speaker align by date",()=>{
  const summary=buildSabbathSummary(details,participants,new Date("2026-10-16T12:00:00Z"));
  assert.equal(summary.title,"Sermon for this Sabbath");assert.equal(summary.verse,"2 Timotius 3 : 16");assert.equal(summary.speaker,"Speaker 3");assert.equal(summary.detailsReady,true);
});
test("Old sermon details are suppressed while the correct scheduled speaker can still appear",()=>{
  const summary=buildSabbathSummary([row("Period","October 10, 2026"),...details.slice(1)],participants,new Date("2026-10-16T12:00:00Z"));
  assert.equal(summary.title,"");assert.equal(summary.verse,"");assert.equal(summary.detailsReady,false);assert.equal(summary.speaker,"Speaker 3");
});
test("Text-only participant dates require the sheet year and do not recycle last year's assignments",()=>{
  const data=[row(null,"TRIWULAN 4 - TAHUN 2025"),...participants.slice(1)];
  assert.equal(buildSabbathSummary(details,data,new Date("2026-10-16T12:00:00Z")).speaker,"");
  assert.equal(buildSabbathSummary(details,participants.slice(1),new Date("2026-10-16T12:00:00Z")).speaker,"");
});
test("New-year rollover and native Google dates work",()=>{
  const summary=buildSabbathSummary([row("Period","Date(2027,0,2)"),row("Judul Khotbah","New year"),row("Ayat Inti","Psalm 1")],[row("TANGGAL","Date(2027,0,2)"),row("Pembicara","New speaker")],new Date("2026-12-31T17:00:00Z"));
  assert.equal(summary.date,"2027-01-02");assert.equal(summary.title,"New year");assert.equal(summary.speaker,"New speaker");
});
test("Invalid Google responses fail without exposing raw content",()=>{
  assert.throws(()=>summaryRows('{"status":"error"}'));
  assert.throws(()=>summaryRows('<html>sign in</html>'));
});
