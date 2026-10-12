/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  코드 보기 · 코드 고치기 · 콘솔 · 입력 칸.
 */
import { h, esc } from './dom.js';
import { FIELDS } from '../data/machine.js';

/* ── 파이썬 색칠 (아주 간단한 것만) ─────────────────────────────── */
// ⚠ \b 는 한글을 낱말 글자로 보지 않으므로 「인원오류」 같은 이름 안에서는 잘못 끊길 수 있다.
//   그래서 앞뒤에 한글·영문·숫자가 붙어 있지 않을 때만 칠한다.
const W = '[A-Za-z0-9_가-힣]';
const TOKEN = new RegExp(
  `(?<!${W})(?:(try|except|else|finally|raise|as|if|elif|for|while|in|def|return|class|pass|and|or|not|True|False|None|import|from)`
  + '|(BaseException|Exception|ValueError|IndexError|KeyError|TypeError|ZeroDivisionError|LookupError|ArithmeticError|NameError|AttributeError|RuntimeError)'
  + '|(int|input|print|len|str|type|repr)(?=\\()'
  + `|(\\d+))(?!${W})`, 'g');
export function colorLine(line) {
  // 주석·문자열을 먼저 떼어 두고 나머지만 색칠한다
  const parts = [];
  let rest = line, m;
  const re = /(#.*$)|("[^"]*"|'[^']*')/;
  while ((m = re.exec(rest))) {
    parts.push({ t: 'code', s: rest.slice(0, m.index) });
    parts.push({ t: m[1] ? 'com' : 'str', s: m[0] });
    rest = rest.slice(m.index + m[0].length);
  }
  parts.push({ t: 'code', s: rest });
  return parts.map((p) => {
    if (p.t === 'com') return `<span class="tk-com">${esc(p.s)}</span>`;
    if (p.t === 'str') return `<span class="tk-str">${esc(p.s)}</span>`;
    // 한 번에 훑는다 — 두 번 바꾸면 앞에서 넣은 <span class="…"> 의 class 가 다시 칠해진다
    let out = '', last = 0, t;
    TOKEN.lastIndex = 0;
    while ((t = TOKEN.exec(p.s))) {
      const c = t[1] ? 'tk-kw' : t[2] ? 'tk-exc' : t[3] ? 'tk-fn' : 'tk-num';
      out += esc(p.s.slice(last, t.index)) + `<span class="${c}">${esc(t[0])}</span>`;
      last = t.index + t[0].length;
    }
    return out + esc(p.s.slice(last));
  }).join('');
}

/**
 * 읽기 전용 코드 보기.
 *  mark = { ran:[줄], crash: 줄, caught:[{line, at}], blank: 줄 }
 *  실행된 줄은 초록 띠, 고장 난 줄은 빨강, except 가 잡은 줄은 파랑,
 *  고장 뒤로 실행되지 못한 줄은 흐리게.
 */
export function codeView(code, mark = {}) {
  const lines = code.replace(/\n$/, '').split('\n');
  const ran = new Set(mark.ran || []);
  const caughtAt = new Set((mark.caught || []).map((c) => c.at));
  const caughtFrom = new Set((mark.caught || []).map((c) => c.line));
  const anyRun = ran.size > 0;
  return h('pre', { class: 'code' + (anyRun ? ' has-run' : '') },
    ...lines.map((l, i) => {
      const n = i + 1;
      const cls = ['ln'];
      if (ran.has(n)) cls.push('ran');
      if (mark.crash === n) cls.push('crash');
      if (caughtAt.has(n)) cls.push('catch');
      if (caughtFrom.has(n)) cls.push('thrown');
      if (mark.blank === n) cls.push('blank');
      const badge = mark.crash === n ? h('span', { class: 'ln-badge bad' }, `💥 ${mark.crashType || ''}`)
        : caughtAt.has(n) ? h('span', { class: 'ln-badge good' }, '🛡️ 여기서 막음')
          : caughtFrom.has(n) ? h('span', { class: 'ln-badge warn' }, '⚡ 여기서 예외') : null;
      return h('div', { class: cls.join(' ') },
        h('span', { class: 'gut' }, String(n)),
        h('span', { class: 'src', html: colorLine(l) || ' ' }),
        badge);
    }));
}

/* ── 콘솔 (실행 결과) ──────────────────────────────────────────── */
export function consoleView(text, { title = '실행 결과' } = {}) {
  const box = h('div', { class: 'console' }, h('div', { class: 'console-title' }, `▶ ${title}`));
  const pre = h('pre', {});
  const lines = String(text || '').split('\n');
  let inTb = false;
  for (const l of lines) {
    if (/^Traceback|^ {2}File "/.test(l)) inTb = true;
    const isErr = inTb && /^[A-Za-z가-힣_]+(Error|Exception|오류|에러)?(:|$)/.test(l) && !/^Traceback/.test(l);
    pre.appendChild(h('div', { class: isErr ? 'c-err' : inTb ? 'c-tb' : 'c-out' }, l || ' '));
    if (isErr) inTb = false;
  }
  box.appendChild(pre);
  return box;
}

/* ── 코드 고치기 (textarea + 줄 번호) ─────────────────────────── */
export function codeEditor(initial, { onChange, onRun } = {}) {
  const ta = h('textarea', { class: 'ed-text', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', 'aria-label': '파이썬 코드' });
  ta.value = initial;
  const gut = h('div', { class: 'ed-gut', 'aria-hidden': 'true' });
  const wrap = h('div', { class: 'editor' }, gut, ta);
  let marks = {};
  const paint = () => {
    const n = ta.value.split('\n').length;
    gut.replaceChildren(...Array.from({ length: n }, (_, i) => {
      const k = i + 1;
      return h('div', { class: marks[k] ? `g ${marks[k]}` : 'g' }, String(k));
    }));
    gut.scrollTop = ta.scrollTop;
  };
  ta.addEventListener('scroll', () => { gut.scrollTop = ta.scrollTop; });
  ta.addEventListener('input', () => { marks = {}; paint(); onChange && onChange(ta.value); });
  ta.addEventListener('keydown', (e) => {
    const { selectionStart: a, selectionEnd: b, value: v } = ta;
    if (e.key === 'Tab') {
      e.preventDefault();
      const ls = v.lastIndexOf('\n', a - 1) + 1;
      if (e.shiftKey) {
        // 내어쓰기 — 줄 앞의 빈칸을 4칸까지 지운다
        const le = v.indexOf('\n', b); const end = le < 0 ? v.length : le;
        const block = v.slice(ls, end).split('\n').map((l) => l.replace(/^ {1,4}/, '')).join('\n');
        ta.setRangeText(block, ls, end, 'select');
      } else if (a !== b && v.slice(a, b).includes('\n')) {
        const le = v.indexOf('\n', b - 1); const end = le < 0 ? v.length : le;
        const block = v.slice(ls, end).split('\n').map((l) => '    ' + l).join('\n');
        ta.setRangeText(block, ls, end, 'select');
      } else ta.setRangeText('    ', a, b, 'end');
      ta.dispatchEvent(new Event('input'));
    } else if (e.key === 'Enter' && !e.ctrlKey) {
      // 줄을 바꾸면 위 줄의 들여쓰기를 이어 가고, 콜론 뒤면 4칸 더
      e.preventDefault();
      const ls = v.lastIndexOf('\n', a - 1) + 1;
      const cur = v.slice(ls, a);
      let ind = (cur.match(/^ */) || [''])[0];
      if (/:\s*$/.test(cur)) ind += '    ';
      ta.setRangeText('\n' + ind, a, b, 'end');
      ta.dispatchEvent(new Event('input'));
    } else if (e.key === 'Enter' && e.ctrlKey && onRun) {
      e.preventDefault();
      onRun();
    }
  });
  paint();
  return {
    el: wrap,
    get value() { return ta.value; },
    set value(s) { ta.value = s; marks = {}; paint(); },
    /** 줄 번호에 색 표시 — { 12: 'crash', 15: 'catch' } */
    mark(m) { marks = m || {}; paint(); },
    focusLine(n) {
      const lines = ta.value.split('\n');
      const pos = lines.slice(0, n - 1).reduce((s, l) => s + l.length + 1, 0);
      ta.focus();
      ta.setSelectionRange(pos, pos + (lines[n - 1] || '').length);
      const lh = parseFloat(getComputedStyle(ta).lineHeight) || 24;
      ta.scrollTop = Math.max(0, (n - 4) * lh);
    },
  };
}

/* ── 입력 칸 넷 ─────────────────────────────────────────────────── */
export function inputForm(values, { onRun, runLabel = '▶ 넣기', compact = false } = {}) {
  const inputs = {};
  const form = h('form', { class: 'inputs' + (compact ? ' compact' : ''), onSubmit: (e) => { e.preventDefault(); onRun && onRun(read()); } },
    ...FIELDS.map((f) => {
      const inp = h('input', { type: 'text', name: f.key, placeholder: f.ph, autocomplete: 'off', spellcheck: 'false' });
      inp.value = values[f.key] ?? f.def;
      inputs[f.key] = inp;
      return h('label', { class: 'field' }, h('span', { class: 'f-label' }, `${f.icon} ${f.label}`), inp);
    }),
    h('button', { class: 'btn big go', type: 'submit' }, runLabel),
  );
  const read = () => Object.fromEntries(FIELDS.map((f) => [f.key, inputs[f.key].value]));
  return {
    el: form,
    read,
    set(v) { for (const f of FIELDS) if (v[f.key] !== undefined) inputs[f.key].value = v[f.key]; },
    reset() { for (const f of FIELDS) inputs[f.key].value = f.def; },
  };
}
