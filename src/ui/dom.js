/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  화면을 만드는 잔손. 요소 만들기 · 화면 수명 관리 · 알림창 · 토스트.
 */

// 요소 하나 만들기.
// ⚠ 자식 자리에 넣는 문자열은 글자 그대로 들어간다. 태그를 쓰려면 { html: '...' }.
export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') {
      // --c 같은 CSS 변수는 Object.assign 으로는 안 들어간다 → setProperty
      for (const [sk, sv] of Object.entries(v)) {
        if (sk.startsWith('--')) el.style.setProperty(sk, String(sv)); else el.style[sk] = sv;
      }
    }
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const c of kids.flat(9)) {
    if (c == null || c === false || c === '') continue;
    el.appendChild(c && c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** el 의 자식을 통째로 바꾼다. replaceChildren 과 달리 null·false 는 건너뛴다
 *  (replaceChildren(null) 은 화면에 「null」 이라는 글자를 넣어 버린다) */
export function fill(el, ...kids) {
  el.replaceChildren(...kids.flat(9).filter((k) => k !== null && k !== undefined && k !== false && k !== ''));
  return el;
}

/** 위험한 글자를 걷어 낸 HTML 조각 (학생이 친 값이 화면에 들어갈 때) */
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ── 화면 수명 관리 ───────────────────────────────────────────
// 탭을 옮기면 화면은 지워지지만 걸어 둔 타이머·구독은 살아남아 쌓인다.
// 새 화면을 그리기 직전에 여기서 걷어 낸다.
// ⚠ 탭 파일에서 setInterval · window.addEventListener 를 직접 쓰지 말 것.
let cleanups = [];
export function beginScreen() {
  cleanups.forEach((f) => { try { f(); } catch (e) { /* 이미 정리됨 */ } });
  cleanups = [];
}
export function onCleanup(fn) { cleanups.push(fn); }
export function screenInterval(fn, ms) {
  const id = setInterval(fn, ms);
  cleanups.push(() => clearInterval(id));
  return id;
}
export function screenTimeout(fn, ms) {
  const id = setTimeout(fn, ms);
  cleanups.push(() => clearTimeout(id));
  return id;
}
export function onWindow(ev, fn) {
  window.addEventListener(ev, fn);
  cleanups.push(() => window.removeEventListener(ev, fn));
}

// ── 알림창 ───────────────────────────────────────────────────
// 브라우저 기본 alert·confirm 은 주소를 함께 보여 주어 교실 화면에 어울리지 않는다.
export function modal(title, body, { ok = '확인', cancel = null, wide = false } = {}) {
  return new Promise((resolve) => {
    const close = (v) => { cover.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') close(false); };
    const btns = h('div', { class: 'modal-btns' },
      cancel && h('button', { class: 'btn', onClick: () => close(false) }, cancel),
      ok && h('button', { class: 'btn primary', onClick: () => close(true) }, ok),
    );
    const box = h('div', { class: 'modal' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true' },
      h('h3', {}, title), typeof body === 'string' ? h('p', {}, body) : body, btns);
    const cover = h('div', { class: 'overlay', onClick: (e) => { if (e.target === cover) close(false); } }, box);
    document.body.appendChild(cover);
    document.addEventListener('keydown', onKey);
    const f = box.querySelector('.primary') || box.querySelector('button');
    if (f) f.focus();
  });
}

/** 잠깐 떴다 사라지는 알림 */
export function toast(text, kind = '') {
  let wrap = document.querySelector('.toasts');
  if (!wrap) { wrap = h('div', { class: 'toasts', 'aria-live': 'polite' }); document.body.appendChild(wrap); }
  const t = h('div', { class: `toast ${kind}` }, text);
  wrap.appendChild(t);
  setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3100);
}

/** 화면을 다시 그릴 때 스크롤을 지킨다 */
export function swap(host, node) {
  const y = window.scrollY;
  host.replaceChildren(node);
  window.scrollTo(0, y);
}
