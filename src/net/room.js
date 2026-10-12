/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  우리 반 리더보드의 「통신」 부분.
 *
 *  두 가지 방식을 같은 모양으로 감쌌다.
 *    firebase — Firebase 실시간 데이터베이스(Realtime Database). 반 전체가 실시간으로 이어진다.
 *               SDK 를 쓰지 않고 REST 주소 + EventSource(서버가 밀어 주는 이벤트)만 쓴다.
 *               그래서 바깥 라이브러리가 0개다.
 *    local    — 이 컴퓨터 안에서만. 같은 브라우저의 다른 탭끼리 이어진다(연습·시연용).
 *
 *  ⚠ 주고받는 것은 모둠 번호와 찾은 카드·미션 수뿐이다. 이름·학번을 보내지 않는다.
 */

/** Firebase 실시간 DB 주소만 받아 준다 — 링크로 엉뚱한 서버 주소가 들어와도 거기로 보내지 않게 */
export function cleanDbUrl(u) {
  const s = String(u || '').trim().replace(/\/+$/, '');
  const ok = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)?\.(firebaseio\.com|firebasedatabase\.app)$/i.test(s)
    // 개발용 — 이 컴퓨터에서 돌리는 가짜 Firebase(tools/mock-firebase.mjs)로 시험할 때만
    || /^http:\/\/(localhost|127\.0\.0\.1):\d{2,5}$/.test(s);
  return ok ? s : '';
}

/** 헷갈리는 글자(0·O·1·I·L)를 뺀 방 코드 */
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function newRoomCode(n = 4) {
  const a = new Uint32Array(n);
  crypto.getRandomValues(a);
  return [...a].map((x) => CODE_CHARS[x % CODE_CHARS.length]).join('');
}
export const cleanRoomCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

/** tree 의 path(/players/abc) 자리에 data 를 넣는다 (null 이면 지운다) */
export function setPath(tree, path, data) {
  const keys = String(path || '/').split('/').filter(Boolean);
  if (!keys.length) return data === null ? {} : (typeof data === 'object' && data) ? structuredClone(data) : {};
  const root = tree && typeof tree === 'object' ? tree : {};
  let o = root;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!o[keys[i]] || typeof o[keys[i]] !== 'object') o[keys[i]] = {};
    o = o[keys[i]];
  }
  const last = keys[keys.length - 1];
  if (data === null) delete o[last];
  else o[last] = typeof data === 'object' ? structuredClone(data) : data;
  return root;
}

/* ── Firebase ─────────────────────────────────────────────────────── */
function firebaseRoom(db, room) {
  const base = `${db}/rooms/${room}`;
  let es = null;
  const send = async (path, method, body) => {
    const res = await fetch(`${base}${path}.json`, { method, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`서버가 ${res.status} 로 답했습니다`);
    return res.json();
  };
  const TS = { '.sv': 'timestamp' }; // 서버 시각 — 기기마다 시계가 달라도 순서가 맞는다
  return {
    mode: 'firebase',
    async getMeta() {
      const res = await fetch(`${base}/meta.json`);
      if (!res.ok) throw new Error(`서버가 ${res.status} 로 답했습니다`);
      return res.json();
    },
    setMeta: (meta) => send('/meta', 'PATCH', meta.created ? { ...meta, created: TS } : meta),
    publishPlayer: (pid, data) => send(`/players/${pid}`, 'PUT', { ...data, t: TS }),
    pushFeed: (e) => send('/feed', 'POST', { ...e, t: TS }),
    clear: () => send('', 'DELETE'),
    subscribe(onTree, onStatus) {
      let tree = {};
      es = new EventSource(`${base}.json`);
      const apply = (ev, merge) => {
        try {
          const { path, data } = JSON.parse(ev.data);
          if (merge) for (const [k, v] of Object.entries(data || {})) tree = setPath(tree, `${path}/${k}`, v);
          else tree = setPath(tree, path, data);
          onTree(tree);
          onStatus && onStatus('live');
        } catch (e) { /* 깨진 이벤트는 건너뛴다 */ }
      };
      es.addEventListener('put', (ev) => apply(ev, false));
      es.addEventListener('patch', (ev) => apply(ev, true));
      es.addEventListener('cancel', () => onStatus && onStatus('denied'));
      es.onerror = () => onStatus && onStatus('retry');
      es.onopen = () => onStatus && onStatus('live');
      return () => { if (es) es.close(); es = null; };
    },
  };
}

/* ── 이 컴퓨터 안에서만 ───────────────────────────────────────────── */
function localRoom(room) {
  const key = `exc-room-local:${room}`;
  const read = () => { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; } };
  let ch = null;
  try { ch = new BroadcastChannel(`exc-room:${room}`); } catch (e) { ch = null; }
  const write = (fn) => {
    const t = fn(read());
    try { localStorage.setItem(key, JSON.stringify(t)); } catch (e) { /* 저장 공간이 없으면 이 탭만 */ }
    if (ch) ch.postMessage('changed');
    listeners.forEach((f) => f(t));
    return Promise.resolve(true);
  };
  const listeners = new Set();
  let seq = 0;
  return {
    mode: 'local',
    getMeta: async () => read().meta || null,
    setMeta: (meta) => write((t) => { t.meta = { ...(t.meta || {}), ...meta, created: meta.created ? Date.now() : (t.meta && t.meta.created) }; return t; }),
    publishPlayer: (pid, data) => write((t) => setPath(t, `players/${pid}`, { ...data, t: Date.now() })),
    pushFeed: (e) => write((t) => setPath(t, `feed/${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 5)}`, { ...e, t: Date.now() })),
    clear: () => write(() => ({})),
    subscribe(onTree, onStatus) {
      const push = () => onTree(read());
      listeners.add(onTree);
      if (ch) ch.onmessage = push;
      const onStorage = (e) => { if (e.key === key) push(); };
      window.addEventListener('storage', onStorage);
      onStatus && onStatus('local');
      push();
      return () => { listeners.delete(onTree); window.removeEventListener('storage', onStorage); if (ch) ch.onmessage = null; };
    },
  };
}

/** db 주소가 있으면 Firebase, 없으면 이 컴퓨터 안에서만 */
export function openRoom(db, room) {
  const d = cleanDbUrl(db);
  return d ? firebaseRoom(d, room) : localRoom(room);
}
