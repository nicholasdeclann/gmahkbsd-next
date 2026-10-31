import test from 'node:test';
import assert from 'node:assert/strict';
import { notificationQueue as reduce } from '../src/lib/notificationQueue.ts';
const notice=(key,type='success',message=key,scope='/admin')=>({id:key,key,type,message,scope});
const add=(state,n)=>reduce(state,{type:'notify',notice:n});
test('one visible and no more than three pending',()=>{
 let q=[];for(let i=0;i<9;i++)q=add(q,notice(String(i)));
 assert.equal(q.length,4);assert.deepEqual(q.map(n=>n.key),['0','1','2','3']);
});
test('same key and content do not duplicate or restart a notice',()=>{
 const q=add([],notice('copy'));assert.equal(add(q,{...notice('copy'),id:'new'}),q);
});
test('errors preempt timed messages and preserve the interrupted message',()=>{
 const q=add(add([],notice('saved')),notice('failed','error'));
 assert.deepEqual(q.map(n=>n.key),['failed','saved']);
});
test('updating the visible error keeps it visible',()=>{
 let q=add(add([],notice('failed','error')),notice('other','error'));
 q=add(q,notice('failed','error','Try again'));assert.equal(q[0].message,'Try again');assert.equal(q.length,2);
});
test('dismissal and resolution remove only the matching key',()=>{
 const q=add(add([],notice('saved')),notice('failed','error'));
 assert.deepEqual(reduce(q,{type:'dismiss',key:'failed'}).map(n=>n.key),['saved']);
});
test('route changes clear unrelated feedback',()=>{
 const q=add(add([],notice('saved')),notice('next','info','New page','/tamu'));
 assert.deepEqual(reduce(q,{type:'route',scope:'/tamu'}).map(n=>n.key),['next']);
});
