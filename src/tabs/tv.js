/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  📺 교실 TV 화면 — 방 코드 · 우리 반이 찾은 카드 · 모둠 순위 · 실시간 소식.
 *  주소: #tv/방코드
 */
import { h, fill, toast, onCleanup, screenInterval, modal } from '../ui/dom.js';
import { CARDS, cardName, groupOf } from '../data/machine.js';
import { aggregate } from '../net/aggregate.js';
import { cleanRoomCode } from '../net/room.js';
import { R, onRoom, watchRoom, feedText } from '../game/store.js';
import { boardView, joinLink, STATUS } from './classroom.js';

export function renderTv(root, code) {
  const room = cleanRoomCode(code);
  if (!room) { fill(root, h('p', {}, '방 코드가 없어요. 🏆 탭에서 방을 만들어 주세요.')); return; }
  if (R.room !== room) watchRoom(room);

  let demo = null;          // 연습용 가짜 모둠 — 화면에만 보이고 서버에는 쓰지 않는다
  let lastFeedId = null;
  const host = h('div', { class: 'tv' });

  function paint() {
    const tree = demo ? mergeDemo(R.tree || {}, demo) : (R.tree || {});
    const agg = aggregate(tree);
    const st = STATUS[R.status] || STATUS.off;
    // 새 소식이 오면 화면 위에 크게 한 번 띄운다
    const top = agg.feed[0];
    if (top && top.id !== lastFeedId) {
      if (lastFeedId !== null && top.k === 'found' && agg.first[top.x] && agg.first[top.x].id === top.id) {
        toast(`🎉 우리 반 첫 발견! ${feedText(top)}`, 'gold big');
      }
      lastFeedId = top.id;
    }
    fill(host, 
      h('div', { class: 'tv-head' },
        h('div', {}, h('div', { class: 'tv-title' }, '🥤 부숴봐! 자판기 — 우리 반'),
          h('div', { class: 'tv-sub' }, `${st.dot} ${st.text} · 접속 ${agg.players}명${demo ? ' · 🎭 연습용 가짜 모둠 보는 중' : ''}`)),
        h('div', { class: 'tv-code' }, h('small', {}, '방 코드'), room),
      ),
      h('div', { class: 'tv-link' }, h('code', {}, joinLink(room))),
      h('div', { class: 'tv-cards' },
        h('div', { class: 'tv-label' }, `우리 반이 찾은 카드 ${agg.classFound.length} / ${CARDS.length}`),
        h('div', { class: 'tv-card-row' }, ...CARDS.map((c) => {
          const got = agg.classFound.includes(c.id);
          const f = agg.first[c.id];
          return h('div', { class: 'tv-card' + (got ? ' got' : ''), style: { '--c': c.color } },
            h('div', { class: 'tc-icon' }, got ? c.icon : '❔'),
            h('div', { class: 'tc-name' }, got ? cardName(c) : '???'),
            h('div', { class: 'tc-first' }, f ? `첫 발견 ${groupOf(f.g).emoji} ${f.g}모둠` : (c.kind === 'bonus' ? '2라운드' : '')));
        }))),
      h('div', { class: 'tv-body' },
        h('div', {}, h('div', { class: 'tv-label' }, agg.meta.phase === 2 ? '🛡️ 2라운드 — 방어 순위 (모둠 평균 미션 · 보스전 최고)' : '💥 1라운드 — 발견 순위'), boardView(agg, { big: true })),
        h('div', { class: 'tv-feed' }, h('div', { class: 'tv-label' }, '📣 방금'),
          h('ul', { class: 'feed big' }, ...(agg.feed.length ? agg.feed.slice(0, 9).map((e) => h('li', {}, feedText(e))) : [h('li', { class: 'muted' }, '학생들이 들어오기를 기다리는 중…')])))),
      h('div', { class: 'tv-tools' },
        h('button', { class: 'btn' + (agg.meta.phase === 1 ? ' primary' : ''), onClick: () => setPhase(1) }, '💥 1라운드'),
        h('button', { class: 'btn' + (agg.meta.phase === 2 ? ' primary' : ''), onClick: () => setPhase(2) }, '🛡️ 2라운드'),
        h('button', { class: 'btn', onClick: toggleDemo }, demo ? '🎭 가짜 모둠 끄기' : '🎭 연습용 가짜 모둠'),
        h('button', { class: 'btn', onClick: () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {}) }, '⛶ 전체 화면'),
        h('button', { class: 'btn', onClick: clearRoom }, '🧹 방 비우기'),
        h('a', { class: 'btn', href: '#class' }, '← 나가기')),
    );
  }

  async function setPhase(p) {
    try { await R.conn.setMeta({ phase: p }); } catch (e) { toast('바꾸지 못했어요', 'bad'); }
  }
  async function clearRoom() {
    const ok = await modal('방 비우기', '이 방의 모든 기록(모둠 점수·소식)을 지웁니다. 모둠 수는 다시 정해야 해요. 지울까요?', { ok: '지우기', cancel: '그만두기' });
    if (!ok) return;
    const groups = aggregate(R.tree || {}).meta.groups;
    try { await R.conn.clear(); await R.conn.setMeta({ groups, phase: 1, created: 1 }); toast('비웠어요'); } catch (e) { toast('지우지 못했어요', 'bad'); }
  }

  function toggleDemo() {
    if (demo) { demo = null; paint(); return; }
    demo = { players: {}, feed: {}, n: 0 };
    toast('🎭 연습용 가짜 모둠 — 이 화면에만 보이고 서버에는 쓰지 않아요');
  }
  // 연습용: 1.5초마다 가짜 모둠 하나가 카드를 찾거나 미션을 끝낸다
  screenInterval(() => {
    if (!demo) return;
    const agg = aggregate(R.tree || {});
    const g = 1 + Math.floor(Math.random() * agg.meta.groups);
    const pid = `demo${g}`;
    const p = demo.players[pid] || (demo.players[pid] = { g, f: {}, m: 0, b: 0, s: 0 });
    const left = CARDS.filter((c) => !p.f[c.id] && c.kind !== 'bonus');
    const t = Date.now();
    if (agg.meta.phase === 1 && left.length) {
      const c = left[Math.floor(Math.random() * left.length)];
      p.f[c.id] = t;
      demo.feed[`d${t}`] = { g, k: 'found', x: c.id, t };
    } else if (p.m < 6) {
      p.m++;
      demo.feed[`d${t}`] = { g, k: 'mission', x: `m${p.m}`, t };
      if (p.m === 6) { p.b = 10 + Math.floor(Math.random() * 4); p.s = 1 + Math.floor(Math.random() * 3); }
    }
    paint();
  }, 1500);

  onCleanup(onRoom(paint));
  paint();
  fill(root, host);
}

function mergeDemo(tree, demo) {
  return {
    ...tree,
    players: { ...(tree.players || {}), ...demo.players },
    feed: { ...(tree.feed || {}), ...demo.feed },
  };
}
