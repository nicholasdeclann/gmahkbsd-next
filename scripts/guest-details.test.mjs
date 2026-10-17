import test from 'node:test';
import assert from 'node:assert/strict';
import {guestDetails} from '../src/lib/guestTypes.ts';
const base={date:'2026-10-17',name:'Tamu',church:'',type:'group'};
test('headcount is optional and phone preserves leading zero',()=>{
 for(const pax of [undefined,null,''])assert.equal(guestDetails({...base,pax,phone:'08123456789'}).pax,null);
 assert.equal(guestDetails({...base,phone:'08123456789'}).phone,'08123456789');
 assert.equal(guestDetails({...base,type:'individual'}).pax,null);
 assert.equal(guestDetails({...base,pax:4}).phone,'');
});
test('phone accepts only digits and provided headcounts remain validated',()=>{
 for(const phone of ['+62812','08 12','abc',812])assert.throws(()=>guestDetails({...base,phone}));
 for(const pax of [0,1,2.5,1000])assert.throws(()=>guestDetails({...base,pax}));
 assert.equal(guestDetails({...base,pax:2}).pax,2);
});
