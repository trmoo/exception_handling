/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  방(room) 자료 → 리더보드. 순수 함수라 node 로 시험한다.
 *
 *  방 자료의 모양 (Firebase 실시간 DB 의 rooms/<방코드> 아래)
 *    meta    : { groups: 6, phase: 1|2, created }
 *    players : { <기기번호>: { g: 모둠, f: {카드: 시각}, m: 끝낸 미션 수, b: 보스전 막은 수, s: 별, t } }
 *    feed    : { <자동번호>: { g, k: 'found'|'mission'|'boss', x: 카드·미션 이름, t } }
 *  ⚠ 이름·학번은 어디에도 없다. 기기번호는 기기가 스스로 만든 무작위 글자다.
 */
import { CARDS } from '../data/machine.js';

const CARD_IDS = CARDS.map((c) => c.id);

export function aggregate(tree) {
  const meta = (tree && tree.meta) || {};
  const nGroups = Math.max(1, Math.min(12, Number(meta.groups) || 6));
  const players = Object.entries((tree && tree.players) || {})
    .map(([pid, p]) => ({ pid, ...(p || {}) }))
    .filter((p) => Number(p.g) >= 1 && Number(p.g) <= nGroups);

  const groups = [];
  for (let g = 1; g <= nGroups; g++) {
    const mem = players.filter((p) => Number(p.g) === g);
    const found = new Set();
    for (const p of mem) for (const id of Object.keys(p.f || {})) if (CARD_IDS.includes(id)) found.add(id);
    const ms = mem.map((p) => Math.max(0, Math.min(6, Number(p.m) || 0)));
    groups.push({
      g,
      members: mem.length,
      found: CARD_IDS.filter((id) => found.has(id)),
      foundCount: found.size,
      missionsAvg: ms.length ? ms.reduce((a, b) => a + b, 0) / ms.length : 0,
      missionsMax: ms.length ? Math.max(...ms) : 0,
      bossBest: Math.max(0, ...mem.map((p) => Math.min(13, Number(p.b) || 0))),
      starsBest: Math.max(0, ...mem.map((p) => Math.min(3, Number(p.s) || 0))),
    });
  }

  const classFound = CARD_IDS.filter((id) => groups.some((x) => x.found.includes(id)));

  // 이벤트 목록 — 최근 것부터. 각 카드를 우리 반에서 처음 찾은 모둠도 여기서 안다.
  const feed = Object.entries((tree && tree.feed) || {})
    .map(([id, e]) => ({ id, ...(e || {}) }))
    .filter((e) => Number(e.g) >= 1 && Number(e.g) <= nGroups)
    .sort((a, b) => (Number(a.t) || 0) - (Number(b.t) || 0) || (a.id < b.id ? -1 : 1));
  const first = {};
  for (const e of feed) if (e.k === 'found' && CARD_IDS.includes(e.x) && !(e.x in first)) first[e.x] = { g: Number(e.g), id: e.id };

  return {
    meta: { groups: nGroups, phase: Number(meta.phase) === 2 ? 2 : 1, created: meta.created || 0 },
    groups,
    players: players.length,
    classFound,
    first,
    feed: feed.slice(-30).reverse(),
  };
}

/** 순위 — 1라운드는 발견한 카드 수, 2라운드는 미션·보스전 */
export function ranking(agg, phase = agg.meta.phase) {
  const list = agg.groups.slice();
  if (phase === 2) {
    list.sort((a, b) => b.missionsAvg - a.missionsAvg || b.bossBest - a.bossBest || b.starsBest - a.starsBest || a.g - b.g);
  } else {
    list.sort((a, b) => b.foundCount - a.foundCount || a.g - b.g);
  }
  return list;
}
