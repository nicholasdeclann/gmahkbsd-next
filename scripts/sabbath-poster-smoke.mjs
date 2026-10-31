import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {nextSabbath,addDays} from '../src/lib/announcementTypes.ts';
const base=process.env.DASHBOARD_TEST_URL??'http://127.0.0.1:3000';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
assert.equal((await(await fetch(base+'/api/photos')).json()).mode,'demo','Refuse non-demo writes');
const env=await readFile(new URL('../.env.development.local',import.meta.url),'utf8');
const login=await fetch(base+'/api/admin/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({password:env.match(/^ADMIN_PASSWORD=(.+)$/m)?.[1].trim()})});
assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
const headers={Cookie:cookie,Origin:base,'Content-Type':'application/json'};
const ids=[],date=nextSabbath(),next=addDays(date,7);let checks=0;
const initial=await(await fetch(base+'/api/admin/sabbath-posters',{headers})).json();
const state=async()=>await(await fetch(base+'/api/admin/sabbath-posters',{headers})).json();
const put=(body,h=headers)=>fetch(base+'/api/admin/sabbath-posters',{method:'PUT',headers:h,body:JSON.stringify(body)});
function check(label,actual,expected){assert.deepEqual(actual,expected,label);console.log('PASS '+label);checks++;}
async function upload(title){const form=new FormData();form.append('title',title);form.append('due_date',addDays(next,7));form.append('file',new Blob([await readFile(new URL('../public/assets/images/logo.png',import.meta.url))],{type:'image/png'}),'poster.png');const response=await fetch(base+'/api/photos/upload',{method:'POST',headers:{Cookie:cookie,Origin:base},body:form});assert.equal(response.status,201);const post=(await response.json()).photo;ids.push(post.id);return post;}
try{
 check('Assignment read requires staff',(await fetch(base+'/api/admin/sabbath-posters')).status,401);
 check('Assignment write requires staff',(await put({date,id:null,revision:'0'},{Origin:base,'Content-Type':'application/json'})).status,401);
 check('Cross-origin assignment blocked',(await put({date,id:null,revision:'0'},{...headers,Origin:'https://other.invalid'})).status,403);
 check('Invalid Saturday rejected',(await put({date:addDays(date,1),id:null,revision:initial.revision})).status,400);
 const a=await upload('Poster fixture A'),b=await upload('Poster fixture B');
 let current=await state();let response=await put({date,id:a.id,revision:current.revision});check('Assign current Sabbath',response.status,200);current=await response.json();
 check('Public resolver uses assigned poster',(await(await fetch(base+'/api/sabbath-poster?date='+date)).json()).poster.id,a.id);
 check('Homepage resolves poster without loading Sheets',(await(await fetch(base+'/api/sabat-ini')).json()).poster.id,a.id);
 check('Card includes assignment badge',(await(await fetch(base+'/api/photos')).json()).photos.find(p=>p.id===a.id).replacement_active,true);
 check('Stale confirmation rejected',(await put({date,id:b.id,revision:initial.revision})).status,409);
 check('Expiry before assigned Sabbath rejected',(await fetch(base+'/api/photos/'+a.id,{method:'PATCH',headers,body:JSON.stringify({due_date:addDays(date,-1)})})).status,400);
 response=await put({date,id:b.id,revision:current.revision});check('Replace poster',response.status,200);current=await response.json();
 check('Replacement public resolver',(await(await fetch(base+'/api/sabbath-poster?date='+date)).json()).poster.id,b.id);
 const board=(await(await fetch(base+'/api/photos')).json()).photos;check('Both posts remain published',ids.every(id=>board.some(p=>p.id===id)),true);check('Former poster loses badge',board.find(p=>p.id===a.id).replacement_active,false);
 response=await put({date:next,id:b.id,revision:current.revision});check('Move to next Sabbath',response.status,200);current=await response.json();
 check('Old Sabbath returns regular mode',(await(await fetch(base+'/api/sabbath-poster?date='+date)).json()).poster,null);
 check('Next-week preview resolves',(await(await fetch(base+'/api/sabbath-poster?date='+next)).json()).poster.id,b.id);
 response=await put({date:next,id:null,revision:current.revision});check('Uncheck removes assignment',response.status,200);current=await response.json();
 check('Uncheck never restores previous poster',(await(await fetch(base+'/api/sabbath-poster?date='+next)).json()).poster,null);
 response=await put({date,id:a.id,revision:current.revision});check('Reassign for delete',response.status,200);
 check('Delete assigned announcement',(await fetch(base+'/api/photos/'+a.id,{method:'DELETE',headers})).status,200);
 check('Deleted assignment restores regular mode',(await(await fetch(base+'/api/sabbath-poster?date='+date)).json()).poster,null);
 check('Invalid resolver date rejected',(await fetch(base+'/api/sabbath-poster?date=bad')).status,400);
}finally{
 for(const d of [date,next]){const latest=await state();await put({date:d,id:initial.assignments[d]??null,revision:latest.revision});}
 for(const id of ids)await fetch(base+'/api/photos/'+id,{method:'DELETE',headers});
}
console.log(checks+' poster API checks passed; disposable local fixtures cleaned.');
