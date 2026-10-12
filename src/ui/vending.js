/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  귀여운 자판기 그림. runMachine( ) 의 결과를 받아 표정·연기·방어막으로 보여 준다.
 *
 *  상태와 그림
 *    idle   🙂 기다림          vend   😄 음료가 떨어진다
 *    refuse 😟 돈이 모자람      crash  😵 흔들리며 연기 · 빨간 경고등 · 화면에 예외 이름
 *    calm   😌 파란 방어막 · 침착한 말   silent 🤐 방어막은 떴는데 말이 없다
 *    logic  🤨 음료는 나왔는데 뭔가 이상하다 (숨은 함정)
 */
import { h } from './dom.js';
import { PRODUCTS } from '../data/machine.js';
import { pyInt } from '../game/runner.js';

const FACE = { idle: '🙂', vend: '😄', refuse: '😟', crash: '😵', calm: '😌', silent: '🤐', logic: '🤨', blank: '🤔', broken: '😵‍💫' };

export function createVending({ small = false } = {}) {
  const face = h('div', { class: 'vm-face', 'aria-hidden': 'true' }, FACE.idle);
  const msg = h('div', { class: 'vm-msg' }, '무엇을 드릴까요?');
  const slots = PRODUCTS.map((p, i) => h('div', { class: 'vm-slot' },
    h('div', { class: 'vm-can' }, p.icon),
    h('div', { class: 'vm-label' }, h('b', {}, `${i + 1}`), ` ${p.name}`),
    h('div', { class: 'vm-price' }, `${p.price.toLocaleString()}원`),
  ));
  const coin = h('div', { class: 'vm-coin' }, '💰 —');
  const drop = h('div', { class: 'vm-drop' });
  const smoke = h('div', { class: 'vm-smoke', 'aria-hidden': 'true' },
    ...Array.from({ length: 7 }, (_, i) => h('span', { style: { '--i': i } })));
  const sparks = h('div', { class: 'vm-sparks', 'aria-hidden': 'true' }, '⚡', '💥', '⚡');
  const el = h('div', { class: 'vm idle' + (small ? ' small' : ''), role: 'img', 'aria-label': '파이썬 자판기' },
    h('div', { class: 'vm-shield', 'aria-hidden': 'true' }),
    h('div', { class: 'vm-body' },
      h('div', { class: 'vm-top' }, h('span', { class: 'vm-lamp' }), h('span', { class: 'vm-title' }, 'PYTHON 자판기'), h('span', { class: 'vm-lamp' })),
      h('div', { class: 'vm-screen' }, face, msg),
      h('div', { class: 'vm-shelf' }, ...slots),
      h('div', { class: 'vm-bottom' }, coin, h('div', { class: 'vm-tray' }, drop)),
    ),
    smoke, sparks,
  );

  let tid = null;
  function show(res, values = {}) {
    clearTimeout(tid);
    const st = res ? res.status : 'idle';
    el.className = 'vm ' + st + (small ? ' small' : '');
    void el.offsetWidth; // 같은 상태를 다시 보여 줄 때도 애니메이션이 처음부터 돌게
    face.textContent = FACE[st] || '🙂';
    const n = pyInt(values.num);
    slots.forEach((s, i) => s.classList.toggle('on', n !== null && (n - 1 === i || (n <= 0 && n - 1 + PRODUCTS.length === i))));
    const m = pyInt(values.money);
    coin.textContent = values.money === undefined ? '💰 —' : m !== null ? `💰 ${m.toLocaleString()}원` : `💰 「${String(values.money).slice(0, 8)}」 ?!`;
    drop.textContent = '';
    switch (st) {
      case 'idle': msg.textContent = '무엇을 드릴까요?'; break;
      case 'vend': case 'logic':
        msg.textContent = res.out.join('\n') || '…';
        drop.textContent = res.product ? res.product.icon : '🥤';
        break;
      case 'refuse': msg.textContent = res.out.join('\n'); break;
      case 'crash': msg.textContent = `ERROR\n${res.type}`; break;
      case 'calm': msg.textContent = res.out.join('\n'); break;
      case 'silent': msg.textContent = '……'; break;
      case 'blank': msg.textContent = '빈칸을 먼저 채워 주세요'; break;
      case 'broken': msg.textContent = `코드가 돌지 못해요\n${res.type || ''}`; break;
      default: msg.textContent = '';
    }
  }
  return { el, show };
}
