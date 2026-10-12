/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  🎰 1라운드 「부숴봐!」 — 자판기를 고장 내서 예외를 모은다.
 */
import { h, fill, modal, toast, screenTimeout } from '../ui/dom.js';
import { createVending } from '../ui/vending.js';
import { codeView, consoleView, inputForm } from '../ui/code.js';
import { MACHINE_CODE, CARDS, cardOf, cardName, FIELDS } from '../data/machine.js';
import { runMachine } from '../game/runner.js';
import { S, addFound, addPlace, addAttack, onChange } from '../game/store.js';
import { onCleanup } from '../ui/dom.js';
import { cardMini, openCard } from './dex.js';

const R1_CARDS = CARDS.filter((c) => c.kind !== 'bonus');

// 고장 난 줄 → 어느 입력 칸 탓인가 (ValueError 세 군데를 따로 센다)
const CODE_LINES = MACHINE_CODE.split('\n');
function fieldOfLine(n) {
  const l = CODE_LINES[n - 1] || '';
  return FIELDS.find((f) => l.includes('input(') && f.match.test(l.slice(l.indexOf('input('))));
}

const hintLevel = {};

export function renderBreak(root) {
  const vm = createVending();
  const codeHost = h('div', { class: 'code-host' });
  const outHost = h('div', { class: 'out-host' });
  const banner = h('div', { class: 'banner idle' }, '값을 바꿔 넣고 [▶ 넣기] 를 눌러 보세요. 목표는 자판기를 고장 내는 것!');
  const progress = h('div', { class: 'progress' });
  const hunt = h('div', { class: 'hunt' });

  const form = inputForm({}, { onRun: (v) => run(v), runLabel: '▶ 넣기' });

  function run(values) {
    const res = runMachine(MACHINE_CODE, values);
    vm.show(res, values);
    fill(codeHost, codeView(MACHINE_CODE, { ran: res.ran, crash: res.status === 'crash' ? res.line : null, crashType: res.type }));
    fill(outHost, consoleView(res.console));
    showBanner(res, values);
  }

  // replaceChildren 은 false 를 글자 「false」 로 넣어 버리므로 걸러 낸다
  const setBanner = (...kids) => fill(banner, ...kids.filter((k) => k !== false && k != null));

  function showBanner(res, values) {
    let isNew = false, place = null;
    if (res.status === 'crash') {
      isNew = addFound(res.type, { values, msg: res.msg });
      if (res.type === 'ValueError') {
        const f = fieldOfLine(res.line);
        if (f && addPlace(f.key)) place = f;
      }
      addAttack({ values, kind: 'crash', type: res.type, msg: res.msg, line: res.line });
      const c = cardOf(res.type);
      banner.className = 'banner crash';
      setBanner(
        h('span', { class: 'b-big' }, `💥 고장! ${res.type}`),
        h('span', {}, ` — ${res.line}번째 줄에서 멈췄어요. ${c ? c.nick : ''}`),
        isNew && h('span', { class: 'b-new' }, '🎉 새 카드!'),
        !isNew && place && h('span', { class: 'b-new' }, `🎯 ValueError 를 ${place.label} 에서도!`),
      );
      if (isNew && c) screenTimeout(() => popCard(c), 1500);
    } else if (res.status === 'logic') {
      isNew = addFound(res.type, { values });
      addAttack({ values, kind: 'logic', type: res.type });
      const c = cardOf(res.type);
      banner.className = 'banner logic';
      setBanner(
        h('span', { class: 'b-big' }, `🤨 어라? 고장은 안 났는데…`),
        h('span', {}, ` ${c.name} — 예외가 없다고 안전한 건 아니에요!`),
        isNew && h('span', { class: 'b-new' }, '🕵️ 숨은 함정 발견!'),
      );
      if (isNew) screenTimeout(() => popCard(c), 1500);
    } else if (res.status === 'vend') {
      banner.className = 'banner ok';
      setBanner(h('span', { class: 'b-big' }, '✅ 정상 판매'), h('span', {}, ' — 자판기가 멀쩡하네요. 다른 값으로 고장 내 보세요!'));
    } else if (res.status === 'refuse') {
      banner.className = 'banner ok';
      setBanner(h('span', { class: 'b-big' }, '🙅 돈이 모자람'), h('span', {}, ' — 이건 if 문이 미리 막아 둔 경우라 고장이 아니에요.'));
    } else {
      banner.className = 'banner idle';
      banner.textContent = '…';
    }
  }

  async function popCard(c) {
    await modal(`${c.icon} 도감에 새 카드!`, h('div', { class: 'pop-card' }, cardMini(c, true),
      h('p', { class: 'pop-what' }, c.what),
      h('p', { class: 'pop-like' }, `💭 ${c.like}`)), { ok: '도감에 넣기' });
  }

  function paintProgress() {
    const n = R1_CARDS.filter((c) => S.found[c.id]).length;
    const exc = CARDS.filter((c) => c.kind === 'exc');
    const ne = exc.filter((c) => S.found[c.id]).length;
    const vp = Object.keys(S.places).length;
    fill(progress, 
      h('div', { class: 'p-row' },
        h('span', { class: 'p-big' }, `📖 ${n} / ${R1_CARDS.length}`),
        h('span', { class: 'p-sub' }, `예외 ${ne}/${exc.length} · 숨은 함정 ${n - ne}/${R1_CARDS.length - exc.length}`),
        h('span', { class: 'p-sub' }, `🔤 ValueError 낸 칸 ${vp}/3`)),
      h('div', { class: 'p-cards' }, ...R1_CARDS.map((c) => {
        const got = !!S.found[c.id];
        return h('button', { class: 'p-chip' + (got ? ' got' : ''), title: got ? cardName(c) : '아직 못 찾음', onClick: () => (got ? openCard(c) : null) },
          got ? c.icon : '❔', h('span', {}, got ? cardName(c) : '???'));
      })),
    );
    // 아직 못 찾은 것 — 힌트 단추
    const left = R1_CARDS.filter((c) => !S.found[c.id]);
    fill(hunt, 
      h('h3', {}, left.length ? `🔎 아직 숨어 있는 고장 ${left.length}개` : '🏆 1라운드 카드를 모두 찾았어요!'),
      left.length ? h('div', { class: 'hint-list' }, ...left.map((c, i) => {
        const lv = hintLevel[c.id] || 0;
        return h('div', { class: 'hint-row' },
          h('span', { class: 'hint-who' }, c.kind === 'logic' ? `🕵️ 숨은 함정 ${i + 1}` : `❔ 예외 ${i + 1}`),
          h('span', { class: 'hint-text' }, lv ? c.hints[lv - 1] : '힌트가 필요하면 눌러 보세요 →'),
          lv < 3 && h('button', { class: 'btn small', onClick: () => { hintLevel[c.id] = lv + 1; paintProgress(); } }, `💡 힌트 ${lv + 1}`));
      })) : h('p', { class: 'muted' }, '이제 📖 예외 도감에서 카드를 읽어 보고, 🛡️ 방어막 탭으로 넘어가세요. 숨은 보너스 카드 하나는 2라운드에서만 나옵니다.'),
    );
  }

  const off = onChange(paintProgress);
  onCleanup(off);
  paintProgress();
  fill(codeHost, codeView(MACHINE_CODE));
  fill(outHost, consoleView('여기에 자판기가 한 일이 찍힙니다.'));

  fill(root, 
    h('section', { class: 'round-head r1' },
      h('div', {}, h('div', { class: 'eyebrow' }, '1라운드'), h('h2', {}, '자판기를 고장 내라! 💥'),
        h('p', {}, '귀여운 자판기 뒤에서 파이썬 코드가 돌고 있어요. 이상한 값을 넣어 프로그램을 멈추게 하면, 그때 난 예외가 도감 카드로 모입니다.')),
      progress),
    h('div', { class: 'break-grid' },
      h('div', { class: 'col-machine' }, vm.el, form.el, banner),
      h('div', { class: 'col-code' },
        h('div', { class: 'panel-title' }, '🐍 자판기 속 파이썬 코드 ', h('span', { class: 'muted' }, '(실행된 줄은 초록, 멈춘 줄은 빨강)')),
        codeHost, outHost)),
    hunt,
  );
  vm.show(null);
}
