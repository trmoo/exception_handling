/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  자판기 · 도감 · 미션 · 채점기. 「화면에 적어 둔 것과 실제 동작이 어긋나지 않는가」 를 지킨다.
 */
import { 묶음, 확인, 참 } from './harness.mjs';
import { MACHINE_CODE, PRODUCTS, COUPONS, CARDS, FIELDS, makeInputFn, cardOf } from '../src/data/machine.js';
import { MISSIONS, ATTACKS, NORMALS } from '../src/data/missions.js';
import { runMachine, shape, BLANK } from '../src/game/runner.js';
import { checkMission, evaluate } from '../src/game/judge.js';
import { runPython } from '../src/lib/pymini.js';

묶음('자판기 코드와 화면 진열대');
{
  const r = runPython(`${MACHINE_CODE.split('\n').slice(0, 4).join('\n')}\nprint(상품)\nprint(가격)\nprint(쿠폰)`);
  확인('상품', r.lines[0], `[${PRODUCTS.map((p) => `'${p.name}'`).join(', ')}]`);
  확인('가격', r.lines[1], `[${PRODUCTS.map((p) => p.price).join(', ')}]`);
  확인('쿠폰', r.lines[2], `{${Object.entries(COUPONS).map(([k, v]) => `'${k}': ${typeof v === 'string' ? `'${v}'` : v}`).join(', ')}}`);
  for (const f of FIELDS) 참(`입력 칸 「${f.label}」 의 질문이 코드에 있다`, MACHINE_CODE.split('\n').some((l) => l.includes('input(') && f.match.test(l)));
}

묶음('1라운드 — 공격은 의도한 고장을 낸다');
for (const a of ATTACKS) {
  const r = runMachine(MACHINE_CODE, a.values);
  확인(`${a.label}`, r.type, a.expect);
  참(`${a.label} — 의도한 카드가 도감에 있다`, !!cardOf(a.expect));
}
for (const n of NORMALS) {
  const r = runMachine(MACHINE_CODE, n.values);
  참(`정상 손님 「${n.label}」 은 고장 없이`, r.status === 'vend' || r.status === 'refuse');
}
{
  // 도감의 1라운드 카드는 모두 공격 목록으로 한 번 이상 낼 수 있다
  for (const c of CARDS.filter((x) => x.kind !== 'bonus')) 참(`카드 ${c.id} 를 낼 공격이 있다`, ATTACKS.some((a) => a.expect === c.id));
  for (const c of CARDS) 확인(`카드 ${c.id} 의 힌트는 3단계`, c.hints.length, 3);
  // 힌트 3단계는 정말로 그 카드를 낸다 — 「…에 X 를 넣어 보세요」
  const val = { money: '2000', num: '1', coupon: '', people: '1' };
  const hint3 = { ValueError: { money: '천원' }, IndexError: { num: '7' }, KeyError: { coupon: 'happy' }, TypeError: { coupon: 'FREE' },
    ZeroDivisionError: { people: '0' }, ZeroIndex: { num: '0' }, NegativePeople: { people: '-2' } };
  for (const [id, v] of Object.entries(hint3)) {
    const c = cardOf(id);
    참(`${id} 힌트 3 에 넣을 값이 적혀 있다`, Object.values(v).every((x) => c.hints[2].includes(x)));
    확인(`${id} 힌트 3 대로 넣으면 그 카드가 나온다`, runMachine(MACHINE_CODE, { ...val, ...v }).type, id);
  }
}
{
  const r = runMachine(MACHINE_CODE, { money: '99999999999999999999', num: '1', coupon: '', people: '1' });
  확인('아주 큰 돈도 진짜 파이썬처럼 정확히', r.out[1], '거스름돈: 99999999999999998799 원');
  확인('ValueError 세 군데 — 사람 수 칸', runMachine(MACHINE_CODE, { money: '1', num: '1', coupon: '', people: '두명' }).line, 15);
}

묶음('2라운드 미션 — 모범 답안은 통과, 빈칸 코드는 막힌다');
for (const m of MISSIONS) {
  const ok = checkMission(m, m.answer);
  확인(`${m.id} 모범 답안 통과`, ok.items.filter((x) => !x.ok).map((x) => x.text), []);
  if (!m.boss) {
    참(`${m.id} 빈칸 코드에 빈칸이 있다`, m.starter.includes(BLANK));
    참(`${m.id} 빈칸 코드는 통과하지 못한다`, !checkMission(m, m.starter).pass);
  }
  참(`${m.id} 힌트는 3단계`, m.hints.length === 3);
  참(`${m.id} 모범 답안에는 「모두 잡는」 방어막이 없다`, !shape(m.answer).catchAll);
}
{
  // 빈칸을 힌트대로 채우면 모범 답안이 된다
  const fills = {
    m1: ['try', 'except', '숫자만 넣어주세요 😊'],
    m2: ['IndexError', '없는 쿠폰이에요 🎟️', 'ZeroDivisionError', 'except'],
    m3: ['as', 'e'],
    m4: ['else', 'finally'],
    m5: ['Exception', 'raise', '인원오류'],
  };
  for (const [id, f] of Object.entries(fills)) {
    const m = MISSIONS.find((x) => x.id === id);
    let code = m.starter;
    for (const x of f) code = code.replace(BLANK, x);
    확인(`${id} 빈칸을 힌트대로 채우면 모범 답안과 같다`, code, m.answer);
  }
}
{
  // 이전 미션의 답은 다음 미션을 통과하지 못한다 (미션마다 새로 배울 것이 있다)
  for (let i = 1; i < 5; i++) 참(`미션 ${i} 답으로는 미션 ${i + 1} 을 못 넘는다`, !checkMission(MISSIONS[i], MISSIONS[i - 1].answer).pass);
  참('1라운드 코드로는 보스전을 못 넘는다', !checkMission(MISSIONS[5], MACHINE_CODE).pass);
}

묶음('채점기 — 아쉬운 방어막을 알아본다');
{
  const lazy = MACHINE_CODE.replace('돈 = int', 'try:\n    돈 = int').split('\n');
  // 코드 전체를 except: pass 로 감싼 경우
  const body = MACHINE_CODE.split('\n').slice(4).map((l) => (l ? '    ' + l : l)).join('\n');
  const head = MACHINE_CODE.split('\n').slice(0, 4).join('\n');
  const silent = `${head}\ntry:\n${body}\nexcept:\n    pass\n`;
  const ev = evaluate(silent);
  참('except: pass — 공격이 「말이 없음」 으로 나온다', ev.attacks.filter((x) => x.atk.expect === 'ValueError').every((x) => x.verdict === 'silent'));
  참('except: pass — 만능 방어막 경고', checkMission(MISSIONS[0], silent).notes.some((n) => n.icon === '🧯'));
  참('except: pass — 침묵 경고', checkMission(MISSIONS[0], silent).notes.some((n) => n.icon === '🤐'));
  참('except: pass — 미션 1 은 except ValueError 가 없어 통과 못 함', !checkMission(MISSIONS[0], silent).pass);

  // 한 줄만 감싸면 NameError — 방어막의 함정
  const one = `${head}\ntry:\n    돈 = int(input("넣을 돈: "))\nexcept ValueError:\n    print("숫자만 넣어주세요 😊")\n${MACHINE_CODE.split('\n').slice(6).join('\n')}`;
  const r = runMachine(one, { money: '천원', num: '1', coupon: '', people: '1' });
  확인('한 줄만 감싸면 NameError', [r.status, r.type], ['crash', 'NameError']);
  참('채점기가 NameError 함정을 짚어 준다', checkMission(MISSIONS[0], one).notes.some((n) => n.icon === '🪤'));
  참('NameError 카드가 도감에 있다', cardOf('NameError').kind === 'bonus');
  void lazy;

  // 코드가 망가졌을 때
  const broken = checkMission(MISSIONS[0], 'try:\nprint("x")\n');
  참('문법 오류는 「코드가 실행되기」 항목으로', !broken.pass && broken.items[0].text.includes('실행'));
  // 무한 반복
  const loop = checkMission(MISSIONS[0], `while True:\n    pass\n`);
  참('무한 반복도 멈추고 알려 준다', !loop.pass);
}
{
  // 정상 손님의 문구를 바꾸면 정상 판정을 못 받는다
  const m1 = MISSIONS[0].answer.replace('"나왔습니다! 🥤"', '"드릴게요"');
  참('원래 판매 문구를 바꾸면 정상 손님 항목이 실패', checkMission(MISSIONS[0], m1).items.some((x) => !x.ok && x.text.includes('정상 손님')));
  // 감사 인사를 더 붙이는 것은 괜찮다
  참('줄을 더 붙이는 것은 괜찮다', checkMission(MISSIONS[0], MISSIONS[0].answer + 'print("또 오세요")\n').pass);
}
{
  // makeInputFn — 질문 문구로 고른다
  const f = makeInputFn({ money: 'M', num: 'N', coupon: 'C', people: 'P' });
  확인('질문 문구로 칸 고르기', [f('넣을 돈: ', 3), f('상품 번호(1~6): ', 0), f('쿠폰 코드: ', 0), f('나눠 낼 사람 수: ', 0), f('???', 1)], ['M', 'N', 'C', 'P', 'N']);
}
