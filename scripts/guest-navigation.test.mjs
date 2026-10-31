import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
// Node's type stripping requires an explicit extension; production Next resolves it normally.
const source=(await readFile(new URL('../src/lib/guestNavigation.ts',import.meta.url),'utf8')).replace('"./guestTypes"',JSON.stringify(new URL('../src/lib/guestTypes.ts',import.meta.url).href));
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {guestHref,guestLocation}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
test('canonical links include the selected view and Saturday',()=>{
 assert.equal(guestHref(guestLocation('mc','2026-11-07')),'/tamu?view=mc&date=2026-11-07');
 assert.equal(guestHref(guestLocation('usher','2026-11-14')),'/tamu?view=usher&date=2026-11-14');
});
test('invalid views fall back without discarding a valid date',()=>{
 assert.deepEqual(guestLocation('invalid','2026-11-07'),{view:'usher',date:'2026-11-07'});
});
test('invalid and missing dates select the same nearest Saturday',()=>{
 assert.deepEqual(guestLocation(undefined,'2026-11-01'),guestLocation());
});
