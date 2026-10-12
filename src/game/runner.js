/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  자판기 코드를 돌리고 「무슨 일이 일어났는지」 가른다.
 *  ⚠ node 로 그대로 불러다 시험한다. DOM 을 만들지 말 것.
 */
import { runPython, parse } from '../lib/pymini.js';
import { makeInputFn, PRODUCTS } from '../data/machine.js';

export const BLANK = '____';

/** 파이썬 int( ) 처럼 글자를 정수로 읽어 본다. 못 읽으면 null. */
export function pyInt(s) {
  const t = String(s ?? '').trim().replace(/[０-９]/g, (c) => String(c.charCodeAt(0) - 0xFF10));
  if (!/^[+-]?\d+(_\d+)*$/.test(t)) return null;
  return Number(t.replace(/_/g, ''));
}

const SYNTAXY = new Set(['SyntaxError', 'IndentationError', '지원하지 않는 문법']);

/**
 * 코드 한 번 돌리기.
 *   status
 *     crash   — 잡히지 않은 예외로 멈춤 (자판기 고장 💥)
 *     broken  — 문법 오류·무한 반복 등 코드 자체가 돌지 못함
 *     vend    — 음료가 나옴
 *     logic   — 음료가 나왔는데 말이 안 되는 입력이었다 (숨은 함정)
 *     refuse  — 돈이 모자라다고 알려 줌
 *     calm    — 예외를 잡고 손님에게 말해 줌 (방어 성공 🛡️)
 *     silent  — 예외를 잡았지만 아무 말도 안 함
 */
export function runMachine(code, values, { echo = true } = {}) {
  if (code.includes(BLANK)) {
    const line = code.split('\n').findIndex((l) => l.includes(BLANK)) + 1;
    return { status: 'blank', line, out: [], console: '', caught: [], ran: [] };
  }
  const shown = runPython(code, { inputFn: makeInputFn(values), echo, file: '자판기.py', maxSteps: 200000 });
  // 판정은 input 메아리 없이 print 한 것만 본다
  const quiet = echo ? runPython(code, { inputFn: makeInputFn(values), echo: false, maxSteps: 200000 }) : shown;
  const said = quiet.lines.filter((l) => l.trim() !== '');
  const base = {
    out: said,
    console: shown.output + (shown.ok ? '' : (shown.output ? '\n' : '') + (shown.traceback || shown.error)),
    caught: shown.caught || [],
    ran: shown.ran || [],
    raw: shown,
  };
  if (!shown.ok) {
    if (shown.fatal || SYNTAXY.has(shown.errorType)) {
      return { ...base, status: 'broken', type: shown.errorType, line: shown.errorLine, msg: shown.errorMsg, hint: shown.errorHint };
    }
    return { ...base, status: 'crash', type: shown.errorType, line: shown.errorLine, msg: shown.errorMsg, hint: shown.errorHint, traceback: shown.traceback };
  }
  const vend = said.some((l) => /나왔습니다/.test(l));
  if (vend) {
    const n = pyInt(values.num), p = pyInt(values.people);
    if (n !== null && n <= 0) return { ...base, status: 'logic', type: 'ZeroIndex', product: productShown(said) };
    if (p !== null && p < 0) return { ...base, status: 'logic', type: 'NegativePeople', product: productShown(said) };
    return { ...base, status: 'vend', product: productShown(said) };
  }
  if (said.some((l) => /모자라/.test(l))) return { ...base, status: 'refuse' };
  if (said.length) return { ...base, status: 'calm' };
  return { ...base, status: 'silent' };
}

/** 출력에서 어떤 음료가 나왔는지 찾는다 (화면에서 음료가 떨어지는 그림용) */
function productShown(lines) {
  const l = lines.find((x) => /나왔습니다/.test(x)) || '';
  return PRODUCTS.find((p) => l.includes(p.name)) || null;
}

/** 문법 나무를 훑어 try 문의 모양을 알아낸다 (채점과 조언에 쓴다) */
export function shape(code) {
  let ast;
  try { ast = parse(code.split(BLANK).join('x')); } catch (e) { return null; }
  const out = { tries: 0, handlers: [], hasElse: false, hasFinally: false, raises: 0, customExc: [], catchAll: false, silentHandler: false, asNames: 0 };
  const walk = (body) => {
    for (const st of body || []) {
      if (st.type === 'Try') {
        out.tries++;
        if (st.orelse.length) out.hasElse = true;
        if (st.finalbody.length) out.hasFinally = true;
        for (const h of st.handlers) {
          const names = !h.typeExpr ? ['*'] : h.typeExpr.type === 'Name' ? [h.typeExpr.id]
            : h.typeExpr.type === 'ListLit' ? h.typeExpr.items.map((x) => x.id || '?') : ['?'];
          out.handlers.push({ names, line: h.line, as: h.name });
          if (h.name) out.asNames++;
          if (names.includes('*') || names.includes('Exception') || names.includes('BaseException')) out.catchAll = true;
          if (h.body.every((x) => x.type === 'Pass')) out.silentHandler = true;
          walk(h.body);
        }
        walk(st.body); walk(st.orelse); walk(st.finalbody);
      } else if (st.type === 'Raise') out.raises++;
      else if (st.type === 'ClassDef' && st.base) out.customExc.push(st.name);
      else if (st.type === 'If') { walk(st.body); walk(st.orelse); }
      else if (st.type === 'While' || st.type === 'For' || st.type === 'FuncDef') walk(st.body);
    }
  };
  walk(ast.body);
  return out;
}
