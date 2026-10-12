/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  학교 수업 목적으로만 이용해 주세요. 자세한 내용은 LICENSE 를 보세요.
 *
 *  화면 차례 = 수업 차례
 *    🎰 부숴봐!(1라운드) → 📖 예외 도감 → 🛡️ 방어막(2라운드) → 🏆 우리 반 → 📘 정리
 *  주소 해시로 바로 갈 수 있다: #break #dex #shield #class #guide · TV 화면은 #tv/방코드
 */
import './style.css';
import { h, beginScreen } from './ui/dom.js';
import { renderBreak } from './tabs/break.js';
import { renderDex } from './tabs/dex.js';
import { renderShield } from './tabs/shield.js';
import { renderClass, STATUS } from './tabs/classroom.js';
import { renderTv } from './tabs/tv.js';
import { renderGuide } from './tabs/guide.js';
import { S, R, onChange, onRoom, setDb, resumeRoom, missionsDone } from './game/store.js';
import { groupLabel, CARDS } from './data/machine.js';
import { cleanDbUrl, cleanRoomCode } from './net/room.js';

const TABS = [
  { id: 'break', icon: '🎰', label: '부숴봐!', sub: '1라운드' },
  { id: 'dex', icon: '📖', label: '예외 도감', sub: '' },
  { id: 'shield', icon: '🛡️', label: '방어막', sub: '2라운드' },
  { id: 'class', icon: '🏆', label: '우리 반', sub: '' },
  { id: 'guide', icon: '📘', label: '정리', sub: '' },
];

// 선생님이 준 링크(?room=…&db=…)로 열면 서버 주소를 저장하고 방 코드를 미리 채운다
const params = new URLSearchParams(location.search);
const linkDb = cleanDbUrl(params.get('db'));
if (linkDb) setDb(linkDb);
const linkRoom = cleanRoomCode(params.get('room'));
if (linkRoom && !location.hash) location.hash = '#class';

const main = h('main', { id: 'main', tabindex: '-1' });
const nav = h('nav', { class: 'tabs', 'aria-label': '화면' });
const chip = h('a', { class: 'room-chip', href: '#class' });
const header = h('header', { class: 'top' },
  h('a', { class: 'brand', href: '#break' }, h('span', { class: 'brand-icon' }, '🥤'), h('span', {}, '부숴봐! 자판기'), h('small', {}, '파이썬 예외 처리')),
  nav, chip);
const footer = h('footer', { class: 'foot' },
  h('div', {}, '© 2026 티쳐무 · 모든 권리 보유 — 학교 수업 목적으로만 이용해 주세요. 무단 배포·상업적 이용을 금합니다.'),
  h('div', { class: 'muted' }, '이름·학번 같은 개인정보를 받지 않습니다. 기록은 이 브라우저에만 남고, 방에 들어가면 모둠 번호와 찾은 카드 수만 보냅니다.'));
document.body.append(header, main, footer);

function paintNav(active) {
  const nFound = Object.keys(S.found).length;
  nav.replaceChildren(...TABS.map((t) => h('a', { class: 'tab' + (t.id === active ? ' on' : ''), href: `#${t.id}` },
    h('span', { class: 'tab-icon' }, t.icon),
    h('span', { class: 'tab-label' }, t.label,
      t.id === 'dex' ? h('span', { class: 'badge' }, `${nFound}/${CARDS.length}`) : null,
      t.id === 'shield' && missionsDone() ? h('span', { class: 'badge' }, `${missionsDone()}/6`) : null),
    t.sub ? h('small', {}, t.sub) : null)));
}
function paintChip() {
  const st = STATUS[R.status] || STATUS.off;
  chip.textContent = R.room && R.g ? `${st.dot} ${groupLabel(R.g)} · ${R.room}` : `${STATUS.off.dot} 혼자 모드 — 방에 들어가기`;
}

function route() {
  beginScreen();
  const hash = location.hash.replace(/^#/, '') || 'break';
  const [id, arg] = hash.split('/');
  document.body.classList.toggle('tv-mode', id === 'tv');
  if (id === 'tv') { renderTv(main, arg); window.scrollTo(0, 0); return; }
  const tab = TABS.find((t) => t.id === id) ? id : 'break';
  paintNav(tab);
  if (tab === 'break') renderBreak(main);
  else if (tab === 'dex') renderDex(main);
  else if (tab === 'shield') renderShield(main);
  else if (tab === 'class') renderClass(main, { prefillRoom: linkRoom });
  else renderGuide(main);
  main.focus({ preventScroll: true });
}

let lastHash = null;
window.addEventListener('hashchange', () => { if (location.hash !== lastHash) { lastHash = location.hash; route(); window.scrollTo(0, 0); } });
onChange(() => paintNav((location.hash.replace(/^#/, '') || 'break').split('/')[0]));
onRoom(paintChip);
// TV 화면은 보기만 한다 — 이 기기가 학생으로 들어가 있던 방에 다시 붙지 않는다
if (!location.hash.startsWith('#tv')) resumeRoom();
paintChip();
lastHash = location.hash;
route();
