import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyPrayerSlots, validatePrayerSlots, attachPrayerNotes, nameFromPrayerCell, prayerUpdateRequests } from '../src/lib/prayerTypes.ts';
test('only four slots are accepted; unused slots remain blank',()=>{
  assert.throws(()=>validatePrayerSlots(emptyPrayerSlots().slice(0,3)));
  assert.throws(()=>validatePrayerSlots([...emptyPrayerSlots(),emptyPrayerSlots()[0]]));
  assert.equal(validatePrayerSlots(emptyPrayerSlots()).length,4);
  assert.deepEqual(validatePrayerSlots([{name:'',note:'Private',note_public:true},...emptyPrayerSlots().slice(1)])[0],{name:'',note:'',note_public:false});
});
test('name-only submissions work and retired reasons are discarded',()=>{
  const slots=validatePrayerSlots([{name:' First '},{name:'Second',note:'Old reason',note_public:true},{name:''},{name:'Fourth'}]);
  assert.deepEqual(slots.map(s=>s.name),['First','Second','','Fourth']);
  assert.ok(slots.every(s=>s.note===''&&!s.note_public));
});
test('only B50:B53 are written, in order, with no notes or formatting changes',()=>{
  const slots=emptyPrayerSlots(); slots[0]={name:'Name',note:'Private reason',note_public:true}; slots[2].name='=1+1';
  const requests=prayerUpdateRequests(slots,1587228396);
  assert.deepEqual(requests.map(r=>r.updateCells.range),[49,50,51,52].map(row=>({sheetId:1587228396,startRowIndex:row,endRowIndex:row+1,startColumnIndex:1,endColumnIndex:2})));
  assert.equal(requests[0].updateCells.rows[0].values[0].userEnteredValue.stringValue,'1. Name');
  assert.deepEqual(requests[1].updateCells.rows[0].values[0].userEnteredValue,{});
  assert.equal(requests[2].updateCells.rows[0].values[0].userEnteredValue.stringValue,'3. =1+1');
  assert.ok(requests.every(r=>r.updateCells.fields==='userEnteredValue'));
  assert.ok(!JSON.stringify(requests).includes('Private reason'));
});
test('direct spreadsheet edits and date changes cannot attach the wrong reason',()=>{
  const slots=emptyPrayerSlots();slots[0]={name:'First',note:'Private reason',note_public:false};
  assert.equal(attachPrayerNotes(['First','','',''],'2026-10-10',{date:'2026-10-10',slots})[0].note,'Private reason');
  assert.equal(attachPrayerNotes(['Different','','',''],'2026-10-10',{date:'2026-10-10',slots})[0].note,'');
  assert.equal(attachPrayerNotes(['First','','',''],'2026-10-17',{date:'2026-10-10',slots})[0].note,'');
  assert.equal(nameFromPrayerCell('2. First'),'First');
});
