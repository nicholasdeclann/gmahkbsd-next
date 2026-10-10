import test from 'node:test';
import assert from 'node:assert/strict';
import { isFileInDriveFolder } from '../src/lib/driveFolder.ts';
test('visible parents reject files from a different folder without listing', async () => {
  const drive={files:{list:async()=>{throw new Error('Unexpected list');}}};
  assert.equal(await isFileInDriveFolder(drive,'post',['another-folder'],'board'),false);
  assert.equal(await isFileInDriveFolder(drive,'post',['board'],'board'),true);
});
test('hidden parents accept an announcement found on a later folder page', async () => {
  const calls=[];
  const drive={files:{list:async input=>{calls.push(input);return {data:input.pageToken?{files:[{id:'post'}]}:{files:[{id:'other'}],nextPageToken:'next'}};}}};
  assert.equal(await isFileInDriveFolder(drive,'post',undefined,'board'),true);
  assert.equal(calls[1].pageToken,'next');
  assert.ok(calls.every(call=>call.q.startsWith("'board' in parents") && call.q.includes('gmahkbsd-announcement')));
});
test('hidden parents do not allow arbitrary files outside the board', async () => {
  const drive={files:{list:async()=>({data:{files:[{id:'other'}]}})}};
  assert.equal(await isFileInDriveFolder(drive,'private-file',undefined,'board'),false);
});
