/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  학생 기록 — 찾은 카드, 남긴 공격, 미션 코드. 이 브라우저(localStorage)에만 남는다.
 *  방에 들어가 있으면 「모둠 번호 + 찾은 카드 + 미션 수」 만 리더보드로 보낸다.
 *  ⚠ 이름·학번을 받지도 보내지도 않는다.
 */
import { openRoom, cleanDbUrl, cleanRoomCode } from '../net/room.js';
import { cardOf, cardName, groupLabel } from '../data/machine.js';

const KEY = 'exc-vending-v1';
const ROOM_KEY = 'exc-vending-room';
const DB_KEY = 'exc-vending-db';

const fresh = () => ({ v: 1, found: {}, places: {}, attacks: [], missions: {}, boss: { best: 0, stars: 0 } });

function load(key, dflt) {
  try { const s = JSON.parse(localStorage.getItem(key)); return s && typeof s === 'object' ? s : dflt; } catch (e) { return dflt; }
}
function save(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* 사생활 보호 창 등 — 이 탭에서만 기억 */ }
}

export const S = { ...fresh(), ...load(KEY, {}) };
const listeners = new Set();
export const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
function changed() {
  save(KEY, S);
  listeners.forEach((f) => f(S));
  schedulePublish();
}

/** 카드를 찾았다. 처음이면 true */
export function addFound(id, detail = {}) {
  if (!cardOf(id)) return false;
  const isNew = !S.found[id];
  if (isNew) S.found[id] = { at: Date.now(), ...detail };
  if (isNew) feed({ k: 'found', x: id });
  changed();
  return isNew;
}
export function addPlace(key) {
  if (S.places[key]) return false;
  S.places[key] = Date.now();
  changed();
  return true;
}
/** 공격 기록 — 같은 입력은 한 번만. 최근 40개까지 */
export function addAttack(a) {
  const sig = JSON.stringify(a.values);
  if (S.attacks.some((x) => JSON.stringify(x.values) === sig)) return;
  S.attacks.unshift({ ...a, at: Date.now() });
  S.attacks = S.attacks.slice(0, 40);
  changed();
}
export function saveMissionCode(id, code) {
  S.missions[id] = { ...(S.missions[id] || {}), code };
  save(KEY, S); // 글자를 칠 때마다 리더보드를 흔들지 않는다
}
export function setMissionDone(id) {
  const first = !(S.missions[id] && S.missions[id].done);
  S.missions[id] = { ...(S.missions[id] || {}), done: true, doneAt: (S.missions[id] && S.missions[id].doneAt) || Date.now() };
  if (first) feed({ k: 'mission', x: id });
  changed();
  return first;
}
export function setBoss(blocked, stars) {
  const better = blocked > S.boss.best || (blocked === S.boss.best && stars > S.boss.stars);
  if (!better) return false;
  S.boss = { best: blocked, stars: Math.max(stars, S.boss.stars) };
  feed({ k: 'boss', x: `${blocked}` });
  changed();
  return true;
}
export const missionsDone = () => Object.values(S.missions).filter((m) => m.done).length;

export function resetAll() {
  Object.assign(S, fresh());
  S.found = {}; S.places = {}; S.attacks = []; S.missions = {};
  changed();
}

/* ── 우리 반 방 ──────────────────────────────────────────────────── */
export const R = {
  db: cleanDbUrl(load(DB_KEY, { db: '' }).db),
  room: '', g: 0, pid: '',
  status: 'off',        // off · local · live · retry · denied
  tree: null,
  conn: null, unsub: null,
};
const roomListeners = new Set();
export const onRoom = (fn) => { roomListeners.add(fn); return () => roomListeners.delete(fn); };
const roomChanged = () => roomListeners.forEach((f) => f(R));

export function setDb(url) {
  R.db = cleanDbUrl(url);
  save(DB_KEY, { db: R.db });
  return R.db;
}

function devicePid(room) {
  const k = `exc-vending-pid:${room}`;
  try {
    let p = localStorage.getItem(k);
    if (!p) { p = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); localStorage.setItem(k, p); }
    return p;
  } catch (e) { return Math.random().toString(36).slice(2, 12); }
}

/** 방에 연결해 자료를 받아 보기만 한다 (선생님 TV 화면과 학생 모두) */
export function watchRoom(room) {
  room = cleanRoomCode(room);
  if (R.unsub) R.unsub();
  R.room = room;
  R.g = 0; R.pid = ''; // 보기만 한다 — 점수를 보내는 것은 joinRoom( ) 으로 모둠을 고른 기기뿐
  R.conn = openRoom(R.db, room);
  R.unsub = R.conn.subscribe((tree) => { R.tree = tree; roomChanged(); }, (st) => { R.status = st; roomChanged(); });
  roomChanged();
  return R.conn;
}

/** 학생: 방에 들어가 모둠을 고른다 */
export function joinRoom(room, g) {
  watchRoom(room);
  R.g = Number(g);
  R.pid = devicePid(R.room);
  save(ROOM_KEY, { room: R.room, g: R.g });
  publishNow();
  roomChanged();
}
export function leaveRoom() {
  if (R.unsub) R.unsub();
  Object.assign(R, { room: '', g: 0, pid: '', status: 'off', tree: null, conn: null, unsub: null });
  save(ROOM_KEY, {});
  roomChanged();
}
export function resumeRoom() {
  const saved = load(ROOM_KEY, {});
  if (saved.room && saved.g) joinRoom(saved.room, saved.g);
}

export function payload() {
  return {
    g: R.g,
    f: Object.fromEntries(Object.entries(S.found).map(([k, v]) => [k, v.at || 1])),
    m: missionsDone(),
    b: S.boss.best,
    s: S.boss.stars,
  };
}
let timer = null;
function schedulePublish() {
  if (!R.conn || !R.g) return;
  clearTimeout(timer);
  timer = setTimeout(publishNow, 400);
}
function publishNow() {
  if (!R.conn || !R.g) return;
  R.conn.publishPlayer(R.pid, payload()).catch(() => { R.status = 'retry'; roomChanged(); });
}
function feed(e) {
  if (!R.conn || !R.g) return;
  R.conn.pushFeed({ ...e, g: R.g }).catch(() => {});
}

/** 이벤트 한 줄을 사람이 읽는 글로 */
export function feedText(e) {
  const who = groupLabel(e.g);
  if (e.k === 'found') { const c = cardOf(e.x); return `${who} — ${c ? c.icon + ' ' + cardName(c) : e.x} 발견!`; }
  if (e.k === 'mission') return `${who} — 🛡️ 미션 ${String(e.x).replace('m', '')} 통과!`;
  if (e.k === 'boss') return `${who} — 👾 보스전 공격 ${e.x}개 막음!`;
  return who;
}
