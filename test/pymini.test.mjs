/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  우리 해석기 ↔ 진짜 파이썬. 출력 · 예외 종류 · 메시지 · 줄 번호가 글자 하나까지 같아야 한다.
 *  기준(test/golden.json)은 `python tools/golden.py` 로 만든다.
 */
import { readFileSync } from 'node:fs';
import { 묶음, 확인, 참 } from './harness.mjs';
import { runPython } from '../src/lib/pymini.js';
import { cases } from './golden-cases.mjs';

const golden = JSON.parse(readFileSync(new URL('./golden.json', import.meta.url), 'utf-8'));
const list = cases();

묶음('진짜 파이썬과 대조');
확인('사례 수가 기준과 같다 (조각을 고쳤으면 golden.py 를 다시 돌릴 것)', golden.cases.length, list.length);
for (let i = 0; i < list.length; i++) {
  const c = list[i], g = golden.cases[i];
  if (!g || g.name !== c.name) { 확인(`${c.name} — 기준의 이름이 같다`, g && g.name, c.name); continue; }
  const inputs = c.inputs || [];
  const r = runPython(c.code, { inputFn: (p, k) => inputs[k] }); // golden.py 처럼 질문 문구는 찍지 않는다
  확인(`${c.name} — 출력`, r.output, g.output);
  확인(`${c.name} — 예외`, r.ok ? null : { type: r.errorType, msg: r.errorMsg, line: r.errorLine }, g.error);
}

묶음('Traceback 모양');
{
  const r = runPython('def f(x):\n    return 10 // x\nf(0)\n', { file: '자판기.py' });
  확인('바깥부터 안쪽으로', r.traceback, [
    'Traceback (most recent call last):',
    '  File "자판기.py", line 3, in <module>',
    '    f(0)',
    '  File "자판기.py", line 2, in f',
    '    return 10 // x',
    'ZeroDivisionError: integer division or modulo by zero',
  ].join('\n'));
}

묶음('except 로 못 잡는 것');
{
  const r = runPython('try:\n    while True:\n        pass\nexcept:\n    print("잡음")\n', { maxSteps: 5000 });
  참('무한 반복 차단은 except: 로도 못 잡는다', !r.ok && r.fatal);
  const s = runPython('try:\n    x = 1\nexcpt ValueError:\n    pass\n');
  확인('문법 오류는 실행 전에', s.errorType, 'SyntaxError');
}

묶음('잡은 기록과 실행된 줄');
{
  const r = runPython('try:\n    int("x")\n    print("안 옴")\nexcept ValueError:\n    print("잡음")\n');
  확인('caught — 어디서 나서 어디서 잡혔나', r.caught.map((c) => [c.type, c.line, c.at]), [['ValueError', 2, 4]]);
  참('예외 뒤 줄은 실행되지 않았다', !r.ran.includes(3));
}

묶음('질문 문구로 입력 고르기');
{
  const vals = { money: '500', num: '2' };
  const fn = (p) => (p.includes('번호') ? vals.num : vals.money);
  const r = runPython('n = input("번호: ")\nm = input("돈: ")\nprint(n, m)', { inputFn: fn, echo: true });
  확인('순서를 바꿔 써도 맞는 값이 들어간다', r.lines, ['번호: 2', '돈: 500', '2 500']);
}
