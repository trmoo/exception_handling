/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  리더보드 집계 · 서버 주소 거르기 · 확인 문제 정답.
 */
import { 묶음, 확인, 참 } from './harness.mjs';
import { aggregate, ranking } from '../src/net/aggregate.js';
import { cleanDbUrl, cleanRoomCode, setPath, newRoomCode } from '../src/net/room.js';
import { QUIZ, FLOW_CASES, FLOW_CODE } from '../src/data/quiz.js';
import { runPython } from '../src/lib/pymini.js';

묶음('서버 주소 — Firebase 만 받는다');
확인('firebaseio', cleanDbUrl('https://abc-default-rtdb.firebaseio.com/'), 'https://abc-default-rtdb.firebaseio.com');
확인('firebasedatabase.app', cleanDbUrl('https://abc-default-rtdb.asia-southeast1.firebasedatabase.app'), 'https://abc-default-rtdb.asia-southeast1.firebasedatabase.app');
확인('다른 곳은 거절', cleanDbUrl('https://evil.example.com'), '');
확인('비슷한 이름도 거절', cleanDbUrl('https://x.firebaseio.com.evil.com'), '');
확인('http 는 거절 (이 컴퓨터 시험용 localhost 만 예외)', [cleanDbUrl('http://abc.firebaseio.com'), cleanDbUrl('http://localhost:9010')], ['', 'http://localhost:9010']);
확인('방 코드 다듬기', cleanRoomCode(' ab-12 x '), 'AB12X');
참('새 방 코드는 4글자, 헷갈리는 글자 없음', Array.from({ length: 200 }, () => newRoomCode()).every((c) => /^[A-HJKMNP-Z2-9]{4}$/.test(c)));

묶음('setPath — 서버가 밀어 주는 바뀐 조각 붙이기');
{
  let t = setPath({}, '/', { meta: { groups: 4 } });
  t = setPath(t, '/players/p1', { g: 2, f: { ValueError: 1 } });
  t = setPath(t, '/players/p1/m', 3);
  확인('깊은 자리', t.players.p1, { g: 2, f: { ValueError: 1 }, m: 3 });
  t = setPath(t, '/players/p1', null);
  확인('null 은 지운다', t.players, {});
}

묶음('리더보드 집계');
{
  const tree = {
    meta: { groups: 3, phase: 1 },
    players: {
      a: { g: 1, f: { ValueError: 1, KeyError: 2 }, m: 2, b: 0 },
      b: { g: 1, f: { KeyError: 3, TypeError: 4 }, m: 4, b: 11, s: 2 },
      c: { g: 2, f: { ValueError: 1 }, m: 6, b: 13, s: 3 },
      x: { g: 9, f: { ValueError: 1 } },         // 없는 모둠 — 무시
      y: { g: 3, f: { 해킹: 1 }, m: 99, b: 999 }, // 이상한 값 — 걸러 낸다
    },
    feed: {
      e2: { g: 2, k: 'found', x: 'ValueError', t: 20 },
      e1: { g: 1, k: 'found', x: 'ValueError', t: 10 },
      e3: { g: 1, k: 'found', x: 'KeyError', t: 30 },
    },
  };
  const a = aggregate(tree);
  확인('모둠 수', a.groups.length, 3);
  확인('모둠 1 은 모둠원 카드의 합집합', a.groups[0].found, ['ValueError', 'KeyError', 'TypeError']);
  확인('모둠 1 미션 평균', a.groups[0].missionsAvg, 3);
  확인('이상한 값은 범위 안으로', [a.groups[2].foundCount, a.groups[2].missionsAvg, a.groups[2].bossBest], [0, 6, 13]);
  확인('우리 반이 찾은 카드', a.classFound, ['ValueError', 'KeyError', 'TypeError']);
  확인('첫 발견은 시각 순', a.first.ValueError.g, 1);
  확인('접속 인원 (없는 모둠 제외)', a.players, 4);
  확인('1라운드 순위 — 카드 수', ranking(a, 1).map((g) => g.g), [1, 2, 3]);
  확인('2라운드 순위 — 미션 평균', ranking(a, 2).map((g) => g.g), [2, 3, 1]);
  확인('빈 방도 터지지 않는다', aggregate(null).groups.length, 6);
}

묶음('확인 문제 — 정답이 진짜 실행 결과와 같다');
for (const [i, q] of QUIZ.entries()) {
  참(`Q${i + 1} 정답이 보기에 있다`, q.choices.includes(q.answer));
  확인(`Q${i + 1} 보기가 겹치지 않는다`, new Set(q.choices).size, q.choices.length);
  if (q.type === 'output') {
    const r = runPython(q.code);
    확인(`Q${i + 1} 출력`, r.lines.join(' '), q.answer);
  }
}
{
  // 「예외가 나지 않는 것」 문제 — 정답만 예외가 없다
  const q = QUIZ.find((x) => x.type === 'pick');
  for (const ch of q.choices) {
    const r = runPython(`x = ${ch}`);
    확인(`「${ch}」 예외 여부`, r.ok, ch === q.answer);
  }
}

묶음('흐름 따라가기 — 설명과 실제가 맞다');
{
  const out = Object.fromEntries(FLOW_CASES.map((c) => [c.id, runPython(FLOW_CODE(c.value))]));
  확인('예외 없음', out.ok.lines, ['① try 시작', '② 바꾸기 성공: 7', '④ 예외 없이 끝남', '⑤ 언제나 실행', '⑥ 다음 줄로']);
  확인('잡힘', out.caught.lines, ['① try 시작', '③ 숫자가 아니에요', '⑤ 언제나 실행', '⑥ 다음 줄로']);
  확인('못 잡음 — finally 만 하고 멈춤', [out.uncaught.lines, out.uncaught.errorType], [['① try 시작', '⑤ 언제나 실행'], 'TypeError']);
}

묶음('Firebase 보안 규칙 ↔ 앱이 보내는 것');
{
  const { readFileSync } = await import('node:fs');
  const rules = JSON.parse(readFileSync(new URL('../docs/firebase-rules.json', import.meta.url), 'utf-8')).rules.rooms.$room;
  const { payload, R } = await import('../src/game/store.js');
  const { CARDS } = await import('../src/data/machine.js');
  const { MISSIONS } = await import('../src/data/missions.js');
  R.g = 3;
  const sent = payload();
  const allowed = Object.keys(rules.players.$pid).filter((k) => !k.startsWith('.') && !k.startsWith('$'));
  참('보내는 칸은 모두 규칙이 허락한 칸 (t 는 서버 시각으로 덧붙는다)', Object.keys(sent).every((k) => allowed.includes(k)) && allowed.includes('t'));
  const cardRe = /^[A-Za-z]{4,20}$/;
  참('카드 이름은 모두 규칙의 꼴에 맞는다', CARDS.every((c) => cardRe.test(c.id)));
  참('미션 이름(소식 x)은 20자 이내', MISSIONS.every((m) => m.id.length <= 20));
  참('방 코드 꼴이 규칙과 같다', /^[A-Z0-9]{4,6}$/.test(newRoomCode()));
  참('소식 종류가 규칙과 같다', rules.feed.$id.k['.validate'].includes('found|mission|boss'));
  참('이름·학번 칸이 없다', !JSON.stringify(rules).match(/name|이름|학번|student/i));
}
