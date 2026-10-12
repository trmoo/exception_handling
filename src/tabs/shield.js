/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  🛡️ 2라운드 「방어막 짜기」 — try·except 를 직접 써서 같은 공격을 다시 막는다.
 */
import { h, fill, toast, onCleanup, screenTimeout } from '../ui/dom.js';
import { createVending } from '../ui/vending.js';
import { codeView, consoleView, inputForm, codeEditor } from '../ui/code.js';
import { MACHINE_CODE, FIELDS, cardOf } from '../data/machine.js';
import { MISSIONS, ATTACKS, NORMALS, missionOf } from '../data/missions.js';
import { runMachine } from '../game/runner.js';
import { checkMission } from '../game/judge.js';
import { S, saveMissionCode, setMissionDone, setBoss, addFound } from '../game/store.js';

let current = (() => { try { return sessionStorage.getItem('exc-mission') || 'm1'; } catch (e) { return 'm1'; } })();
const hintLv = {};

// 1라운드 때 그 공격은 어떻게 됐나 (나란히 비교용)
const R1 = Object.fromEntries(ATTACKS.map((a) => [a.id, runMachine(MACHINE_CODE, a.values, { echo: false })]));

const VERDICT = {
  blocked: { icon: '🛡️', text: '막음', cls: 'good' },
  crash: { icon: '💥', text: '뚫림', cls: 'bad' },
  leak: { icon: '🍹', text: '팔아 버림', cls: 'bad' },
  silent: { icon: '🤐', text: '말이 없음', cls: 'warn' },
  broken: { icon: '⛔', text: '코드 오류', cls: 'bad' },
  blank: { icon: '✏️', text: '빈칸', cls: 'warn' },
};
const valuesShort = (v) => FIELDS.map((f) => (v[f.key] === '' ? '·' : v[f.key])).join(' | ');

export function renderShield(root) {
  const m = missionOf(current) || MISSIONS[0];
  // 보스전은 「내가 만든 방어막」 으로 싸운다 — 통과한 미션 가운데 가장 뒤의 내 코드.
  // 하나도 없으면 방어막 없는 1라운드 코드에서 시작한다. (모범 답안은 단추로만 불러온다)
  const myBest = () => {
    for (const x of MISSIONS.slice(0, 5).reverse()) {
      const s = S.missions[x.id];
      if (s && s.done && s.code) return s.code.replace(/미션 \d/, '보스전');
    }
    return MACHINE_CODE;
  };
  const startCode = (S.missions[m.id] && S.missions[m.id].code) || (m.boss ? myBest() : m.starter);

  const vm = createVending({ small: true });
  const tryOut = h('div', { class: 'out-host' });
  const result = h('div', { class: 'check-result' });
  const replay = h('div', { class: 'replay' });
  const syntaxHost = h('div', {});

  let saveT = null;
  const ed = codeEditor(startCode, {
    onChange: (v) => { clearTimeout(saveT); saveT = setTimeout(() => saveMissionCode(m.id, v), 300); },
    onRun: () => grade(),
  });
  onCleanup(() => { clearTimeout(saveT); saveMissionCode(m.id, ed.value); });

  /* ── 직접 넣어 보기 ── */
  const form = inputForm({}, { onRun: (v) => tryRun(v), runLabel: '▶ 내 코드로 넣어 보기', compact: true });
  function tryRun(values) {
    saveMissionCode(m.id, ed.value);
    const res = runMachine(ed.value, values);
    vm.show(res, values);
    fill(tryOut, consoleView(res.status === 'blank' ? `${res.line}번째 줄에 빈칸(____)이 남아 있어요.` : res.console));
    markEditor(res);
    if (res.status === 'crash' && res.type === 'NameError') bonusNameError();
  }
  function markEditor(res) {
    const mk = {};
    for (const c of res.caught || []) { mk[c.line] = 'thrown'; mk[c.at] = 'catch'; }
    if ((res.status === 'crash' || res.status === 'broken') && res.line) mk[res.line] = 'crash';
    if (res.status === 'blank') mk[res.line] = 'crash';
    ed.mark(mk);
  }
  function bonusNameError() {
    if (addFound('NameError', {})) toast('🪤 보너스 카드 「방어막의 함정」(NameError) 발견! 도감을 보세요.', 'gold');
  }

  /* ── 채점 ── */
  function grade() {
    saveMissionCode(m.id, ed.value);
    const c = checkMission(m, ed.value);
    if (c.blank) { ed.mark({ [c.blank]: 'crash' }); ed.focusLine(c.blank); }
    if (c.broken && c.broken.line) { ed.mark({ [c.broken.line]: 'crash' }); }
    if (c.ev && c.ev.attacks.some((x) => x.verdict === 'crash' && x.r.type === 'NameError')) bonusNameError();
    paintResult(c);
    if (c.ev) paintReplay(c.ev, !!m.boss);
    if (c.pass) {
      const first = setMissionDone(m.id);
      if (first) toast(`🎉 미션 ${m.no} 통과!`, 'gold');
      const on = stepper.querySelector('.step.on');
      if (on) { on.classList.add('done'); on.querySelector('.step-no').textContent = '✅'; }
    }
    if (m.boss && c.ev) {
      const n = c.ev.attacks.filter((x) => x.verdict === 'blocked').length;
      setBoss(n, c.stars ? c.stars.count : 0);
    }
  }

  function paintResult(c) {
    const next = MISSIONS[MISSIONS.indexOf(m) + 1];
    fill(result, 
      h('div', { class: 'cr-head ' + (c.pass ? 'pass' : 'fail') }, c.pass ? `✅ 미션 ${m.no} 통과!` : '🔧 아직 조금 남았어요'),
      h('ul', { class: 'checklist' }, ...c.items.map((it) => h('li', { class: it.ok ? 'ok' : 'no' },
        h('span', { class: 'ck' }, it.ok ? '✅' : '⬜'), h('span', {}, it.text), !it.ok && it.why ? h('div', { class: 'why' }, it.why) : null))),
      c.stars ? h('div', { class: 'stars' },
        h('div', { class: 'star-row' }, ...[0, 1, 2].map((i) => h('span', { class: i < c.stars.count ? 'on' : '' }, '⭐'))),
        h('ul', {},
          h('li', { class: c.stars.all ? 'ok' : '' }, `${c.stars.all ? '⭐' : '☆'} 모든 공격 막고 정상 손님에게 팔기`),
          h('li', { class: c.stars.distinct ? 'ok' : '' }, `${c.stars.distinct ? '⭐' : '☆'} 고장마다 다른 말로 알려 주기`),
          h('li', { class: c.stars.noCatchAll ? 'ok' : '' }, `${c.stars.noCatchAll ? '⭐' : '☆'} 「모두 잡는」 방어막 쓰지 않기`))) : null,
      ...(c.notes || []).map((n) => h('div', { class: 'note' }, h('span', { class: 'note-icon' }, n.icon), h('span', {}, n.text))),
      c.pass && next ? h('button', { class: 'btn primary big', onClick: () => go(next.id) }, `다음: 미션 ${next.no} ${next.title} →`) : null,
    );
  }

  function paintReplay(ev, animate) {
    const rows = [
      ...ev.attacks.map((x) => ({ x, kind: 'atk' })),
      ...ev.normals.map((x) => ({ x, kind: 'nrm' })),
    ];
    const tbody = h('tbody', {});
    const table = h('table', { class: 'replay-table' },
      h('thead', {}, h('tr', {}, h('th', {}, '공격'), h('th', {}, '1라운드 자판기'), h('th', {}, '지금 내 자판기'), h('th', {}, '손님이 들은 말'))),
      tbody);
    const blocked = ev.attacks.filter((x) => x.verdict === 'blocked').length;
    const served = ev.normals.filter((x) => x.ok).length;
    const score = h('div', { class: 'replay-score' },
      h('span', { class: 'rs good' }, `🛡️ 막은 공격 ${animate ? 0 : blocked} / ${ATTACKS.length}`),
      h('span', { class: 'rs' }, `🧑 정상 손님 ${animate ? 0 : served} / ${NORMALS.length}`));
    const makeRow = ({ x, kind }) => {
      if (kind === 'atk') {
        const r1 = R1[x.atk.id];
        const v = VERDICT[x.verdict];
        return h('tr', { class: 'rr ' + v.cls, onClick: () => { form.set(x.atk.values); tryRun(x.atk.values); } },
          h('td', {}, h('b', {}, x.atk.label), h('div', { class: 'vals' }, valuesShort(x.atk.values))),
          h('td', { class: 'r1' }, r1.status === 'crash' ? `💥 ${r1.type}` : `🤨 ${cardOf(r1.type).name}`),
          h('td', { class: 'now' }, `${v.icon} ${v.text}`, x.verdict === 'crash' ? h('small', {}, ` ${x.r.type}`) : null),
          h('td', { class: 'said' }, x.said || '—'));
      }
      return h('tr', { class: 'rr normal ' + (x.ok ? 'good' : 'bad'), onClick: () => { form.set(x.n.values); tryRun(x.n.values); } },
        h('td', {}, h('b', {}, `🧑 ${x.n.label}`), h('div', { class: 'vals' }, valuesShort(x.n.values))),
        h('td', { class: 'r1' }, '정상 판매'),
        h('td', { class: 'now' }, x.ok ? '✅ 그대로 팔았음' : '❌ 원래와 달라짐'),
        h('td', { class: 'said' }, x.r.out.join(' / ') || '—'));
    };
    fill(replay, h('h3', {}, m.boss ? '👾 보스전 — 공격 13가지 + 정상 손님 4명' : '🔁 같은 공격 다시 넣기 — 1라운드와 비교'),
      h('p', { class: 'muted' }, '줄을 누르면 그 값을 내 자판기에 넣어 볼 수 있어요.'), score, table);
    if (!animate) { rows.forEach((r) => tbody.appendChild(makeRow(r))); return; }
    // 보스전은 한 줄씩 — 자판기도 함께 반응한다
    let i = 0, nb = 0, ns = 0;
    const step = () => {
      if (i >= rows.length) return;
      const r = rows[i++];
      const row = makeRow(r);
      row.classList.add('enter');
      tbody.appendChild(row);
      const res = r.kind === 'atk' ? r.x.r : r.x.r;
      vm.show(res, r.kind === 'atk' ? r.x.atk.values : r.x.n.values);
      if (r.kind === 'atk' && r.x.verdict === 'blocked') nb++;
      if (r.kind === 'nrm' && r.x.ok) ns++;
      fill(score, 
        h('span', { class: 'rs good' }, `🛡️ 막은 공격 ${nb} / ${ATTACKS.length}`),
        h('span', { class: 'rs' }, `🧑 정상 손님 ${ns} / ${NORMALS.length}`));
      screenTimeout(step, 420);
    };
    step();
  }

  /* ── 미션 바꾸기 ── */
  function go(id) {
    saveMissionCode(m.id, ed.value);
    current = id;
    try { sessionStorage.setItem('exc-mission', id); } catch (e) { /* 무시 */ }
    renderShield(root);
    window.scrollTo(0, 0);
  }

  const stepper = h('nav', { class: 'stepper', 'aria-label': '미션' }, ...MISSIONS.map((x) => {
    const done = S.missions[x.id] && S.missions[x.id].done;
    return h('button', { class: 'step' + (x.id === m.id ? ' on' : '') + (done ? ' done' : ''), onClick: () => go(x.id) },
      h('span', { class: 'step-no' }, done ? '✅' : x.icon), h('span', { class: 'step-t' }, `${x.no}. ${x.title}`), h('small', {}, x.concept));
  }));

  const prev = MISSIONS[MISSIONS.indexOf(m) - 1];
  const prevCode = prev && S.missions[prev.id] && S.missions[prev.id].code;
  const tools = h('div', { class: 'ed-tools' },
    h('button', { class: 'btn primary big', onClick: grade }, m.boss ? '👾 공격 시작!' : '🛡️ 채점하기 (같은 공격 다시 넣기)'),
    h('button', { class: 'btn', onClick: () => { ed.value = m.starter; saveMissionCode(m.id, m.starter); toast('처음 코드로 되돌렸어요'); } }, m.boss ? '↺ 모범 방어막으로' : '↺ 빈칸 코드로 처음부터'),
    prevCode ? h('button', { class: 'btn', onClick: () => { ed.value = prevCode; saveMissionCode(m.id, prevCode); toast(`미션 ${prev.no} 에서 내가 쓴 코드를 가져왔어요`); } }, `⬅ 미션 ${prev.no} 내 코드 가져오기`) : null,
    m.boss ? h('button', { class: 'btn', onClick: () => { ed.value = MACHINE_CODE; saveMissionCode(m.id, MACHINE_CODE); toast('🔥 하드 모드 — 방어막 없는 1라운드 코드에서 시작!'); } }, '🔥 하드 모드: 맨손으로') : null,
  );

  const lv = hintLv[m.id] || 0;
  const hintBox = h('div', { class: 'hints' },
    ...m.hints.slice(0, lv).map((t, i) => h('div', { class: 'hint' }, h('b', {}, `💡 ${i + 1} `), h('span', { style: { whiteSpace: 'pre-wrap' } }, t))),
    lv < m.hints.length ? h('button', { class: 'btn small', onClick: () => { hintLv[m.id] = lv + 1; go(m.id); } }, `💡 힌트 ${lv + 1} 보기`) : null);
  if (m.syntax) fill(syntaxHost, h('div', { class: 'syntax' }, h('div', { class: 'panel-title' }, '📐 문법 모양'), codeView(m.syntax)));

  fill(root, 
    h('section', { class: 'round-head r2' },
      h('div', {}, h('div', { class: 'eyebrow' }, '2라운드'), h('h2', {}, '방어막을 짜라! 🛡️'),
        h('p', {}, '이번엔 내가 개발자. try·except 로 방어막을 둘러, 같은 공격에도 자판기가 침착하게 대답하게 만드세요.'))),
    stepper,
    h('div', { class: 'shield-grid' },
      h('div', { class: 'col-mission' },
        h('div', { class: 'mission-card' },
          h('div', { class: 'mc-top' }, h('span', { class: 'mc-icon' }, m.icon), h('div', {}, h('div', { class: 'eyebrow' }, `미션 ${m.no} · ${m.concept}`), h('h3', {}, m.title))),
          h('p', { class: 'mc-goal' }, `🎯 ${m.goal}`),
          h('ul', { class: 'mc-explain' }, ...m.explain.map((t) => h('li', {}, t))),
          syntaxHost, hintBox),
        result),
      h('div', { class: 'col-editor' },
        h('div', { class: 'panel-title' }, '✏️ 내 자판기 코드 ', h('span', { class: 'muted' }, '(Tab 들여쓰기 · Ctrl+Enter 채점)')),
        ed.el, tools,
        h('div', { class: 'try-panel' },
          h('div', { class: 'try-left' }, vm.el),
          h('div', { class: 'try-right' }, h('div', { class: 'panel-title' }, '🧪 직접 넣어 보기'), form.el, tryOut))),
    ),
    replay,
  );
  vm.show(null);
  fill(tryOut, consoleView('값을 넣고 [▶ 내 코드로 넣어 보기] 를 누르면 내 코드가 실행됩니다.'));
}
