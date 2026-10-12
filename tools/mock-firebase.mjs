/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  가짜 Firebase 실시간 데이터베이스 — 진짜 서버 없이 리더보드를 시험하려고 만들었다.
 *
 *  진짜 Firebase REST 와 같은 모양으로 답한다.
 *    GET/PUT/PATCH/POST/DELETE  <경로>.json
 *    EventSource(<경로>.json)   → event: put / patch,  data: {"path": …, "data": …}
 *    {".sv":"timestamp"}        → 서버 시각으로 바뀐다
 *
 *  쓰는 법:  node tools/mock-firebase.mjs 9010
 *           앱의 🏆 → 선생님용 → 서버 주소에  http://localhost:9010  을 넣는다.
 *  ⚠ 시험용이다. 보안 규칙도 영속 저장도 없다.
 */
import http from 'node:http';

const PORT = Number(process.argv[2] || 9010);
let root = null;
const streams = new Set(); // { res, keys }

const keysOf = (url) => decodeURIComponent(url.split('?')[0]).replace(/\.json$/, '').split('/').filter(Boolean);
const getAt = (keys) => keys.reduce((o, k) => (o && typeof o === 'object' ? o[k] ?? null : null), root);
const sv = (v) => {
  if (v && typeof v === 'object') {
    if (v['.sv'] === 'timestamp') return Date.now();
    const o = Array.isArray(v) ? [] : {};
    for (const [k, x] of Object.entries(v)) o[k] = sv(x);
    return o;
  }
  return v;
};
function setAt(keys, val) {
  if (!keys.length) { root = val; return; }
  if (!root || typeof root !== 'object') root = {};
  let o = root;
  for (const k of keys.slice(0, -1)) { if (!o[k] || typeof o[k] !== 'object') o[k] = {}; o = o[k]; }
  if (val === null) delete o[keys[keys.length - 1]]; else o[keys[keys.length - 1]] = val;
}
/** 바뀐 자리(keys)를 지켜보는 스트림에게 알린다 */
function notify(keys, event, data) {
  for (const s of streams) {
    const w = s.keys;
    const n = Math.min(w.length, keys.length);
    if (w.slice(0, n).join('/') !== keys.slice(0, n).join('/')) continue;
    if (keys.length >= w.length) {
      const rel = '/' + keys.slice(w.length).join('/');
      s.res.write(`event: ${event}\ndata: ${JSON.stringify({ path: rel, data })}\n\n`);
    } else {
      // 지켜보는 자리보다 위가 바뀌었다 → 통째로 다시 보낸다
      s.res.write(`event: put\ndata: ${JSON.stringify({ path: '/', data: getAt(w) })}\n\n`);
    }
  }
}

const pushId = () => '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const keys = keysOf(req.url);
  if (req.method === 'GET' && /text\/event-stream/.test(req.headers.accept || '')) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(`event: put\ndata: ${JSON.stringify({ path: '/', data: getAt(keys) })}\n\n`);
    const s = { res, keys };
    streams.add(s);
    req.on('close', () => streams.delete(s));
    return;
  }
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    const json = (v) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(v)); };
    let val = null;
    try { val = body ? sv(JSON.parse(body)) : null; } catch (e) { res.writeHead(400); res.end('{"error":"bad json"}'); return; }
    switch (req.method) {
      case 'GET': return json(getAt(keys));
      case 'PUT': setAt(keys, val); notify(keys, 'put', val); return json(val);
      case 'PATCH':
        for (const [k, v] of Object.entries(val || {})) setAt([...keys, k], v);
        notify(keys, 'patch', val);
        return json(val);
      case 'POST': { const id = pushId(); setAt([...keys, id], val); notify([...keys, id], 'put', val); return json({ name: id }); }
      case 'DELETE': setAt(keys, null); notify(keys, 'put', null); return json(null);
      default: res.writeHead(405); res.end();
    }
  });
}).listen(PORT, () => console.log(`가짜 Firebase — http://localhost:${PORT}`));
