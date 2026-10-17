import test from 'node:test';
import assert from 'node:assert/strict';
import {announcementDates,buildCanvaPreview,selectedCanvaFields} from '../src/lib/canvaPreview.ts';
const prayer={date:'2026-10-17',slots:[{name:'Public family',note:'Public reason',note_public:true},{name:'Private family',note:'SECRET',note_public:false}],mode:'google',revision:'one',canWrite:true,notesConfigured:true};
const schedule={dates:['2026-10-17','2026-10-24'],rows:[{id:0,label:'Sekolah Sabat',heading:true,values:[]},{id:1,label:'Pemimpin',heading:false,values:['This week','Next week']} ]};
const announcements=[{id:'one',department:'Musik',caption:'Choir',image_url:'/image',created_at:'today',drive_file_id:'one'}];
test('Friday and Saturday select this week prayers and next Saturday participants in Jakarta',()=>{
 for(const now of ['2026-10-16T12:00:00Z','2026-10-17T12:00:00Z'])assert.deepEqual(announcementDates(new Date(now)),{current:'2026-10-17',next:'2026-10-24'});
 assert.deepEqual(announcementDates(new Date('2026-10-17T18:00:00Z')),{current:'2026-10-24',next:'2026-10-31'});
 assert.deepEqual(announcementDates(new Date('2026-12-31T12:00:00Z')),{current:'2027-01-02',next:'2027-01-09'});
});
test('preview maps next week participants and omits private notes everywhere',()=>{
 const result=buildCanvaPreview('2026-10-17',prayer,schedule,announcements);
 assert.equal(result.participants[0].value,'Next week');assert.equal(result.participants[0].field,'participant_sekolah_sabat_pemimpin');
 assert.equal(result.fields.prayer_note_1,'Public reason');assert.equal(result.fields.prayer_note_2,'');assert.ok(!JSON.stringify(result).includes('SECRET'));assert.equal(result.blockingErrors.length,0);
});
test('stale prayer date and unavailable target schedule block syncing',()=>{
 const result=buildCanvaPreview('2026-10-17',{...prayer,date:'2026-10-10'},null,[]);
 assert.ok(result.blockingErrors.length>=2);assert.equal(result.fields.prayer_name_1,'');assert.ok(!JSON.stringify(result).includes('Public reason'));
});
test('only selected announcements are included and unknown/duplicate selections rejected',()=>{
 const result=buildCanvaPreview('2026-10-17',prayer,schedule,announcements);
 assert.equal(selectedCanvaFields(result,[]).announcements,'');assert.equal(selectedCanvaFields(result,['one']).announcements,'Musik\nChoir');
 assert.throws(()=>selectedCanvaFields(result,['missing']));assert.throws(()=>selectedCanvaFields(result,['one','one']));
});
test('missing roles warn and empty fields clear prior values',()=>{
 const result=buildCanvaPreview('2026-10-17',prayer,{...schedule,rows:[{id:2,label:'Speaker',heading:false,values:['old','']}]},[]);
 assert.equal(result.fields.participant_umum_speaker,'');assert.equal(result.warnings.length,1);assert.equal(result.blockingErrors.length,0);
});
