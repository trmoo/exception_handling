/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  test 폴더의 *.test.mjs 를 모아 돌린다.
 *  ⚠ 시험은 탭 파일(DOM 을 만지는 곳)을 부르지 않는다.
 *    탭 파일의 문법은 `npm run check:syntax` 가 따로 본다.
 */
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { 결과 } from './harness.mjs';

const 여기 = dirname(fileURLToPath(import.meta.url));
const 파일들 = readdirSync(여기).filter((f) => f.endsWith('.test.mjs')).sort();

const 시작 = Date.now();
for (const f of 파일들) {
  await import('file://' + join(여기, f));
}
const 걸린 = Date.now() - 시작;

console.log(`\n  시험 파일 ${파일들.length}개 — ${파일들.join(', ')}`);
if (결과.실패.length) {
  console.log(`\n  ❌ ${결과.실패.length}가지가 어긋났습니다.\n`);
  for (const m of 결과.실패) console.log('    ' + m + '\n');
  console.log(`  통과 ${결과.통과}가지 / 실패 ${결과.실패.length}가지 (${걸린}ms)\n`);
  process.exit(1);
}
console.log(`\n  ✅ ${결과.통과}가지 모두 통과 (${걸린}ms)\n`);
