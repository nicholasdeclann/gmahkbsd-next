import test from 'node:test';
import assert from 'node:assert/strict';
import {historyIndex,installHistoryIndex,registerHistoryGuard} from '../src/lib/historyIndex.ts';
test('all SPA pages receive indexes and preserve Next router state',()=>{
 const entries=[{_NA:true,tree:'guest'}];let cursor=0;
 const history={get state(){return entries[cursor]},pushState(data){entries.splice(++cursor);entries[cursor]=data},replaceState(data){entries[cursor]=data}};
 const dispose=installHistoryIndex(history);
 assert.equal(historyIndex(history.state),0);
 history.pushState({_NA:true,tree:'dashboard'},'', '/admin');assert.equal(historyIndex(history.state),1);assert.equal(history.state.tree,'dashboard');
 cursor=0; // Browser Back to guest, then Forward targets the tagged dashboard entry.
 assert.equal(historyIndex(entries[1])-historyIndex(history.state),1);
 cursor=1;history.replaceState({_NA:true,tree:'updated'},'');assert.equal(historyIndex(history.state),1);
 cursor=0;history.pushState({_NA:true,tree:'new-branch'},'','/tamu');assert.equal(entries.length,2);assert.equal(historyIndex(history.state),1);
 dispose();
});
test('the stable root listener delegates to the current guest guard',()=>{
 let listener;const host={addEventListener(_type,fn){listener=fn},removeEventListener(){listener=null}};
 const history={state:{},pushState(data){this.state=data},replaceState(data){this.state=data}};
 const dispose=installHistoryIndex(history,host);let called='';
 const old=registerHistoryGuard(()=>{called='old'});const current=registerHistoryGuard(()=>{called='current'});
 old();listener({});assert.equal(called,'current');current();called='';listener({});assert.equal(called,'');dispose();assert.equal(listener,null);
});
