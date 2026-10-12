/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  📖 예외 도감 — 모은 카드와 예외의 족보.
 */
import { h, fill, modal } from '../ui/dom.js';
import { consoleView } from '../ui/code.js';
import { CARDS, cardName, MACHINE_CODE, FIELDS } from '../data/machine.js';
import { runMachine } from '../game/runner.js';
import { S, onChange } from '../game/store.js';
import { onCleanup } from '../ui/dom.js';

const KIND_LABEL = { exc: '예외', logic: '숨은 함정 · 논리 오류', bonus: '보너스 · 2라운드' };

/** 카드 한 장 (앞면) */
export function cardMini(c, got) {
  return h('div', { class: `card ${c.kind}` + (got ? ' got' : ' locked'), style: { '--c': c.color } },
    h('div', { class: 'card-kind' }, KIND_LABEL[c.kind]),
    h('div', { class: 'card-icon' }, got ? c.icon : '❔'),
    h('div', { class: 'card-name' }, got ? cardName(c) : '???'),
    h('div', { class: 'card-nick' }, got ? c.nick : (c.kind === 'bonus' ? '2라운드에서만 나와요' : '아직 못 찾았어요')),
  );
}

const valuesText = (v) => FIELDS.map((f) => `${f.icon} ${v[f.key] === '' ? '(빈칸)' : v[f.key]}`).join('  ');

/** 카드 자세히 보기 */
export function openCard(c) {
  const got = S.found[c.id];
  const mine = S.attacks.filter((a) => a.type === c.id).slice(0, 5);
  const sample = got && got.values ? runMachine(MACHINE_CODE, got.values) : null;
  const body = h('div', { class: 'card-detail' },
    h('div', { class: 'cd-top' }, cardMini(c, true),
      h('div', {},
        h('p', { class: 'cd-what' }, c.what),
        h('p', { class: 'cd-like' }, `💭 비유 — ${c.like}`),
        h('p', { class: 'cd-fix' }, `🛡️ 막는 법 — ${c.fix}`))),
    mine.length ? h('div', { class: 'cd-mine' }, h('h4', {}, '내가 넣은 공격'),
      h('ul', {}, ...mine.map((a) => h('li', {}, valuesText(a.values), a.msg ? h('code', {}, ` → ${a.msg}`) : '')))) : null,
    sample && sample.status === 'crash' ? h('div', {}, h('h4', {}, '그때 파이썬이 남긴 말 (Traceback)'),
      consoleView(sample.traceback, { title: 'Traceback 읽는 법: 맨 아래 줄이 「무슨 예외」, 그 위가 「어디서」' })) : null,
  );
  return modal(`${c.icon} ${cardName(c)}`, body, { ok: '닫기', wide: true });
}

/* ── 예외의 족보 ─────────────────────────────────────────────────
 * except 부모: 는 자식까지 함께 잡는다. 그래서 except Exception: 은 거의 모든 것을 잡는다. */
const TREE = {
  name: 'BaseException', note: '모든 예외의 조상',
  kids: [{
    name: 'Exception', note: '보통 예외의 조상 — except Exception: 은 아래를 모두 잡는다',
    kids: [
      { name: 'ArithmeticError', note: '계산 오류', kids: [{ name: 'ZeroDivisionError' }] },
      { name: 'LookupError', note: '찾기 오류', kids: [{ name: 'IndexError' }, { name: 'KeyError' }] },
      { name: 'ValueError' }, { name: 'TypeError' }, { name: 'NameError' },
    ],
  }],
};
export function familyTree(foundIds = []) {
  const node = (n) => h('li', {},
    h('span', { class: 'ft-node' + (foundIds.includes(n.name) ? ' got' : '') + (n.kids ? ' parent' : '') },
      foundIds.includes(n.name) ? `✅ ${n.name}` : n.name,
      n.note ? h('small', {}, ` ${n.note}`) : null),
    n.kids ? h('ul', {}, ...n.kids.map(node)) : null);
  return h('div', { class: 'family' },
    h('h3', {}, '🌳 예외의 족보'),
    h('p', { class: 'muted' }, 'except 에 부모를 적으면 자식까지 함께 잡힙니다. except LookupError: 하나로 IndexError 와 KeyError 를 모두 막을 수 있어요.'),
    h('ul', { class: 'ft' }, node(TREE)));
}

export function renderDex(root) {
  const host = h('div', {});
  const paint = () => {
    const n = CARDS.filter((c) => S.found[c.id]).length;
    fill(host, 
      h('section', { class: 'round-head' },
        h('div', {}, h('div', { class: 'eyebrow' }, '예외 도감'), h('h2', {}, `📖 모은 카드 ${n} / ${CARDS.length}`),
          h('p', {}, '카드를 누르면 언제 나는 예외인지, 내가 넣은 공격과 파이썬이 남긴 Traceback 을 볼 수 있어요.'))),
      h('div', { class: 'dex-grid' }, ...CARDS.map((c) => {
        const got = !!S.found[c.id];
        return h('button', { class: 'dex-btn', disabled: !got, onClick: () => openCard(c), 'aria-label': got ? cardName(c) : '아직 못 찾은 카드' }, cardMini(c, got));
      })),
      h('div', { class: 'two-col' },
        h('div', { class: 'explain-box' },
          h('h3', {}, '🧭 세 가지 「잘못」 을 구분해요'),
          h('table', { class: 'kinds' },
            h('tr', {}, h('th', {}, ''), h('th', {}, '언제 알 수 있나'), h('th', {}, '예')),
            h('tr', {}, h('td', {}, h('b', {}, '문법 오류')), h('td', {}, '실행하기 전 — 파이썬이 코드를 읽다가 멈춤'), h('td', {}, h('code', {}, 'print("안녕"'), ' 괄호 안 닫음')),
            h('tr', { class: 'hl' }, h('td', {}, h('b', {}, '예외')), h('td', {}, '실행하는 도중 — 문법은 맞지만 그 순간 할 수 없는 일'), h('td', {}, h('code', {}, 'int("천원")'))),
            h('tr', {}, h('td', {}, h('b', {}, '논리 오류')), h('td', {}, '멈추지 않는다 — 결과가 틀렸을 뿐'), h('td', {}, h('code', {}, '상품[-1]'), ' 이 생수')),
          ),
          h('p', { class: 'muted' }, '예외는 try·except 로 잡을 수 있습니다. 논리 오류는 파이썬이 몰라서 못 잡으니, if 로 검사하고 raise 로 내가 예외를 만들어야 합니다.')),
        familyTree(Object.keys(S.found))),
    );
  };
  onCleanup(onChange(paint));
  paint();
  fill(root, host);
}
