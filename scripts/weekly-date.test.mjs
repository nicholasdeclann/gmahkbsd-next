import test from 'node:test';
import assert from 'node:assert/strict';
import {rollForwardSabbath} from '../src/lib/kertasAcaraForm.ts';
const dates=['2026-10-17','2026-10-24','2026-10-31','2027-01-02'];
test('keeps selected Sabbath until midnight Jakarta, advances on Sunday and weekdays',()=>{
 assert.equal(rollForwardSabbath('2026-10-17',dates,new Date('2026-10-17T16:59:59Z')),'2026-10-17');
 assert.equal(rollForwardSabbath('2026-10-17',dates,new Date('2026-10-17T17:00:00Z')),'2026-10-24');
 assert.equal(rollForwardSabbath('2026-10-10',dates,new Date('2026-10-20T05:00:00Z')),'2026-10-24');
});
test('preserves future selections and never selects an unavailable spreadsheet date',()=>{
 assert.equal(rollForwardSabbath('2026-10-31',dates,new Date('2026-10-18T05:00:00Z')),'2026-10-31');
 assert.equal(rollForwardSabbath('2026-10-17',['2026-10-17'],new Date('2026-10-18T05:00:00Z')),'2026-10-17');
});
test('rolls over the year boundary',()=>{
 assert.equal(rollForwardSabbath('2026-12-26',dates,new Date('2026-12-27T05:00:00Z')),'2027-01-02');
});
