/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  2라운드 채점기. 학생 코드를 공격·정상 손님에게 실제로 돌려 보고 판정한다.
 *  ⚠ node 로 그대로 불러다 시험한다. DOM 을 만들지 말 것.
 */
import { runMachine, shape, BLANK } from './runner.js';
import { MACHINE_CODE } from '../data/machine.js';
import { ATTACKS, NORMALS, attackOf } from '../data/missions.js';

// 정상 손님에게 원래 자판기가 하던 말 — 방어막을 둘러도 이 말은 그대로 나와야 한다
const BASELINE = Object.fromEntries(NORMALS.map((n) => [n.id, runMachine(MACHINE_CODE, n.values, { echo: false }).out]));
export const baselineOf = (id) => BASELINE[id];

/** 원래 출력 줄들이 순서대로 모두 들어 있는가 (감사 인사 같은 줄이 더 붙는 것은 괜찮다) */
function containsInOrder(got, want) {
  let i = 0;
  for (const l of got) if (i < want.length && l.trim() === want[i].trim()) i++;
  return i === want.length;
}

/** 공격 하나 → 판정 */
export function judgeAttack(code, atk) {
  const r = runMachine(code, atk.values, { echo: false });
  let verdict;
  if (r.status === 'blank') verdict = 'blank';
  else if (r.status === 'broken') verdict = 'broken';
  else if (r.status === 'crash') verdict = 'crash';
  else if (r.status === 'logic' || r.status === 'vend') verdict = 'leak'; // 말이 안 되는 입력인데 팔아 버림
  else if (r.status === 'silent') verdict = 'silent';
  else verdict = 'blocked';
  return { atk, r, verdict, said: r.out.join(' / ') };
}

/** 정상 손님 하나 → 판정 */
export function judgeNormal(code, n) {
  const r = runMachine(code, n.values, { echo: false });
  const ok = r.status !== 'crash' && r.status !== 'broken' && r.status !== 'blank' && containsInOrder(r.out, BASELINE[n.id]);
  return { n, r, ok };
}

/** 미션 채점에 필요한 것을 한 번에 돌려 둔다 */
export function evaluate(code) {
  const sh = shape(code);
  const attacks = ATTACKS.map((a) => judgeAttack(code, a));
  const normals = NORMALS.map((n) => judgeNormal(code, n));
  return { code, sh, attacks, normals, byId: Object.fromEntries(attacks.map((x) => [x.atk.id, x])) };
}

const blockedAll = (ev, ids) => ids.every((id) => ev.byId[id].verdict === 'blocked');
const EXC_IDS = ATTACKS.filter((a) => !['ZeroIndex', 'NegativePeople'].includes(a.expect)).map((a) => a.id);
const KINDS = ['ValueError', 'IndexError', 'KeyError', 'TypeError', 'ZeroDivisionError'];

/** 예외 종류마다 손님에게 한 말 (첫 번째 공격 기준) — 「같은 말만 반복하는가」 를 본다 */
function messagesByKind(ev) {
  const m = {};
  for (const k of KINDS) {
    const a = ATTACKS.find((x) => x.expect === k);
    m[k] = ev.byId[a.id].said;
  }
  return m;
}

/** 공통 항목 */
function commonItems(ev) {
  const items = [];
  const normalsOk = ev.normals.every((x) => x.ok);
  items.push({ ok: normalsOk, text: '정상 손님 4명에게 원래대로 팔기', why: normalsOk ? '' : `「${ev.normals.find((x) => !x.ok).n.label}」 손님이 원래와 다른 결과를 받았어요.` });
  return items;
}

/**
 * 미션 채점. 돌려주는 것: { pass, items:[{ok,text,why}], ev, notes:[] }
 * notes 는 통과와 상관없는 조언 (만능 방어막 · 침묵 방어 등).
 */
export function checkMission(mission, code) {
  if (code.includes(BLANK)) {
    const line = code.split('\n').findIndex((l) => l.includes(BLANK)) + 1;
    return { pass: false, blank: line, items: [{ ok: false, text: '빈칸(____) 모두 채우기', why: `${line}번째 줄에 아직 빈칸이 있어요.` }], notes: [] };
  }
  const ev = evaluate(code);
  const broken = ev.attacks.find((x) => x.verdict === 'broken') || ev.normals.find((x) => x.r.status === 'broken');
  if (broken) {
    const r = broken.r;
    return { pass: false, broken: r, ev, items: [{ ok: false, text: '코드가 실행되기', why: `${r.line || '?'}번째 줄 — ${r.type}: ${r.msg}${r.hint ? ' · ' + r.hint : ''}` }], notes: [] };
  }
  const sh = ev.sh;
  const items = [];
  const v = (id) => ev.byId[id];
  const said = (id) => v(id).said;

  switch (mission.id) {
    case 'm1': {
      const ve = ['a1', 'a4', 'a11'];
      items.push({ ok: sh.handlers.some((h) => h.names.includes('ValueError')), text: 'except ValueError: 쓰기' });
      items.push({ ok: blockedAll(ev, ve), text: '숫자가 아닌 값 공격 3가지 막기 (돈 「천원」·번호 「칠」·사람 수 「둘」)',
        why: whyAttack(ev, ve) });
      break;
    }
    case 'm2': {
      for (const k of KINDS) {
        const ids = ATTACKS.filter((a) => a.expect === k).map((a) => a.id);
        items.push({ ok: blockedAll(ev, ids), text: `${k} 막기`, why: whyAttack(ev, ids) });
      }
      const msgs = Object.values(messagesByKind(ev));
      const distinct = new Set(msgs).size;
      items.push({ ok: distinct === KINDS.length, text: '고장마다 다른 말로 알려 주기', why: distinct === KINDS.length ? '' : `다섯 가지 고장에 서로 다른 말이 ${distinct}가지뿐이에요.` });
      break;
    }
    case 'm3': {
      items.push({ ok: sh.handlers.some((h) => h.as && h.names.includes('KeyError')), text: 'except KeyError as e: 쓰기' });
      items.push({ ok: /happy/.test(said('a7')), text: '쿠폰 「happy」 → 손님이 넣은 쿠폰 이름까지 보여 주기', why: `지금 하는 말: ${said('a7') || '(없음)'}` });
      items.push({ ok: /BONUS/.test(said('a8')), text: '쿠폰 「BONUS」 → 쿠폰 이름까지 보여 주기', why: `지금 하는 말: ${said('a8') || '(없음)'}` });
      items.push({ ok: blockedAll(ev, EXC_IDS), text: '1라운드 고장 다섯 가지 계속 막기', why: whyAttack(ev, EXC_IDS) });
      break;
    }
    case 'm4': {
      items.push({ ok: sh.hasElse, text: 'else: 쓰기' });
      items.push({ ok: sh.hasFinally, text: 'finally: 쓰기' });
      const lasts = [...ev.normals.map((x) => x.r.out), ...EXC_IDS.map((id) => v(id).r.out)].map((o) => o[o.length - 1] || '');
      const same = lasts.every((l) => l && l === lasts[0]);
      items.push({ ok: same && /감사/.test(lasts[0]), text: '어떤 경우든 마지막 말은 「이용해 주셔서 감사합니다」',
        why: same ? '' : '어떤 손님에게는 감사 인사가 마지막에 나오지 않아요.' });
      items.push({ ok: blockedAll(ev, EXC_IDS), text: '1라운드 고장 다섯 가지 계속 막기', why: whyAttack(ev, EXC_IDS) });
      break;
    }
    case 'm5': {
      items.push({ ok: sh.raises >= 2, text: 'raise 두 번 쓰기 (번호 검사 · 사람 수 검사)' });
      items.push({ ok: sh.customExc.length >= 1, text: '나만의 예외 클래스 만들기 (class …(Exception))' });
      items.push({ ok: blockedAll(ev, ['a12']), text: '숨은 함정 「번호 0」 막기', why: whyAttack(ev, ['a12']) });
      items.push({ ok: blockedAll(ev, ['a13']), text: '숨은 함정 「사람 수 -2」 막기', why: whyAttack(ev, ['a13']) });
      items.push({ ok: blockedAll(ev, EXC_IDS), text: '1라운드 고장 다섯 가지 계속 막기', why: whyAttack(ev, EXC_IDS) });
      break;
    }
    case 'm6': {
      const ids = ATTACKS.map((a) => a.id);
      const n = ids.filter((id) => v(id).verdict === 'blocked').length;
      items.push({ ok: n === ids.length, text: `공격 ${ids.length}가지 모두 막기 (지금 ${n}가지)`, why: whyAttack(ev, ids) });
      break;
    }
    default: break;
  }
  items.push(...commonItems(ev));
  const pass = items.every((x) => x.ok);
  return { pass, items, ev, notes: advice(ev), stars: mission.id === 'm6' ? stars(ev) : null };
}

/** 뚫린 공격이 있으면 그 까닭을 한 줄로 */
function whyAttack(ev, ids) {
  const bad = ids.map((id) => ev.byId[id]).find((x) => x.verdict !== 'blocked');
  if (!bad) return '';
  const l = bad.atk.label;
  switch (bad.verdict) {
    case 'crash': return `「${l}」 → 💥 ${bad.r.type} 로 멈췄어요 (${bad.r.line}번째 줄).`;
    case 'leak': return `「${l}」 → 음료가 나와 버렸어요. 말이 안 되는 입력인데도요!`;
    case 'silent': return `「${l}」 → 막기는 했는데 손님에게 아무 말도 안 했어요 🤐`;
    default: return `「${l}」 → 막지 못했어요.`;
  }
}

/** 통과와 상관없는 조언 */
export function advice(ev) {
  const notes = [];
  const sh = ev.sh;
  if (!sh) return notes;
  if (sh.catchAll) {
    notes.push({ icon: '🧯', text: 'except: 나 except Exception: 은 모든 예외를 잡는 「만능 방어막」 입니다. 편하지만, 생각지 못한 버그까지 조용히 덮어 버려 무엇이 고장 났는지 알 수 없게 됩니다. 가능하면 종류를 적어 주세요.' });
  }
  if (sh.silentHandler) {
    notes.push({ icon: '🤐', text: 'except 아래에 pass 만 있으면 손님은 왜 안 되는지 모른 채 떠납니다. 무엇이 잘못됐는지 알려 주세요.' });
  }
  const crashed = ev.attacks.filter((x) => x.verdict === 'crash').map((x) => x.r.type);
  if (crashed.includes('NameError')) {
    notes.push({ icon: '🪤', text: 'NameError 가 났습니다! 예외를 잡은 뒤에도 프로그램은 다음 줄로 계속 갑니다. 그런데 그 변수에는 값이 못 들어갔어요. 계산 전체를 try 안에 넣거나 else 를 써 보세요.' });
  }
  return notes;
}

/** 보스전 별 셋 */
export function stars(ev) {
  const all = ev.attacks.every((x) => x.verdict === 'blocked') && ev.normals.every((x) => x.ok);
  const msgs = Object.values(messagesByKind(ev));
  const distinct = new Set(msgs).size === KINDS.length && ev.attacks.every((x) => x.verdict === 'blocked' || x.atk.expect === 'ZeroIndex' || x.atk.expect === 'NegativePeople');
  const noCatchAll = !!ev.sh && !ev.sh.catchAll;
  return { all, distinct, noCatchAll, count: [all, distinct, noCatchAll].filter(Boolean).length };
}

export { attackOf };
