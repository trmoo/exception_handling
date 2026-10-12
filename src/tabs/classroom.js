/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  🏆 우리 반 — 방에 들어가기 · 모둠 순위 · 선생님 설정.
 */
import { h, fill, toast, modal, onCleanup } from '../ui/dom.js';
import { GROUPS, groupLabel, groupOf, CARDS } from '../data/machine.js';
import { aggregate, ranking } from '../net/aggregate.js';
import { openRoom, newRoomCode, cleanRoomCode, cleanDbUrl } from '../net/room.js';
import { R, onRoom, joinRoom, leaveRoom, watchRoom, setDb, feedText, missionsDone, S } from '../game/store.js';

export const STATUS = {
  off: { dot: '⚪', text: '혼자 하는 중' },
  local: { dot: '🟡', text: '이 컴퓨터 안에서만 연결' },
  live: { dot: '🟢', text: '실시간 연결됨' },
  retry: { dot: '🟠', text: '다시 연결하는 중…' },
  denied: { dot: '🔴', text: '서버가 거절함 (보안 규칙 확인)' },
};

/** 학생에게 보낼 주소 — 방 코드와 서버 주소를 함께 담는다 */
export function joinLink(room) {
  const u = new URL(location.href);
  u.hash = '#class';
  u.search = '';
  u.searchParams.set('room', room);
  if (R.db) u.searchParams.set('db', R.db);
  return u.toString();
}

/** 모둠 순위 막대 (학생 화면·TV 화면 공용) */
export function boardView(agg, { big = false } = {}) {
  const phase = agg.meta.phase;
  const list = ranking(agg, phase);
  const maxFound = CARDS.length;
  return h('div', { class: 'board' + (big ? ' big' : '') },
    ...list.map((g, i) => {
      const gi = groupOf(g.g);
      const pct = phase === 2 ? (g.missionsAvg / 6) * 100 : (g.foundCount / maxFound) * 100;
      return h('div', { class: 'b-row' + (!big && R.g === g.g ? ' me' : '') },
        h('span', { class: 'b-rank' }, i < 3 && (phase === 2 ? g.missionsAvg > 0 : g.foundCount > 0) ? ['🥇', '🥈', '🥉'][i] : `${i + 1}`),
        h('span', { class: 'b-name' }, `${gi.emoji} ${g.g}모둠`, h('small', {}, ` ${gi.name} · ${g.members}명`)),
        h('span', { class: 'b-bar' }, h('span', { class: 'b-fill', style: { width: `${Math.max(2, pct)}%` } })),
        phase === 2
          ? h('span', { class: 'b-val' }, `🛡️ 미션 ${g.missionsAvg.toFixed(1)}`, h('small', {}, ` · 👾 ${g.bossBest}/13 ${'⭐'.repeat(g.starsBest)}`))
          : h('span', { class: 'b-val' }, `📖 ${g.foundCount}`, h('small', {}, ` / ${maxFound}  `), h('span', { class: 'b-icons' }, ...CARDS.map((c) => h('span', { class: g.found.includes(c.id) ? 'on' : '' }, c.icon)))),
      );
    }));
}

export function renderClass(root, { prefillRoom = '' } = {}) {
  const host = h('div', {});
  let pickMeta = null, pickRoom = '';
  const teacher = teacherPanel(); // 한 번만 만든다 — 다시 그릴 때마다 만들면 방금 만든 방 코드가 사라진다

  function paint() {
    const st = STATUS[R.status] || STATUS.off;
    const joined = R.room && R.g;
    const parts = [];
    parts.push(h('section', { class: 'round-head' },
      h('div', {}, h('div', { class: 'eyebrow' }, '우리 반'), h('h2', {}, '🏆 모둠 순위'),
        h('p', {}, '선생님이 알려 준 방 코드로 들어가 모둠을 고르면, 내가 찾은 카드와 미션이 모둠 점수로 모입니다. 이름은 묻지 않아요.'))));

    if (joined) {
      parts.push(h('div', { class: 'join-card joined' },
        h('div', { class: 'jc-big' }, `${groupLabel(R.g)}`),
        h('div', {}, `방 ${R.room} · ${st.dot} ${st.text}`),
        h('div', { class: 'muted' }, `내 기록 — 📖 ${Object.keys(S.found).length}장 · 🛡️ 미션 ${missionsDone()}개 · 👾 ${S.boss.best}/13`),
        h('button', { class: 'btn small', onClick: () => { leaveRoom(); paint(); } }, '방에서 나가기')));
    } else if (pickMeta) {
      parts.push(h('div', { class: 'join-card' },
        h('h3', {}, `방 ${pickRoom} — 우리 모둠을 고르세요`),
        h('div', { class: 'group-pick' }, ...GROUPS.slice(0, Number(pickMeta.groups) || 6).map((g) =>
          h('button', { class: 'gbtn', onClick: () => { joinRoom(pickRoom, g.g); pickMeta = null; toast(`${groupLabel(g.g)} 으로 들어왔어요!`); paint(); } },
            h('span', { class: 'g-emoji' }, g.emoji), `${g.g}모둠`, h('small', {}, g.name)))),
        h('button', { class: 'btn small', onClick: () => { pickMeta = null; paint(); } }, '← 방 코드 다시 넣기')));
    } else {
      const inp = h('input', { class: 'room-input', maxlength: '6', placeholder: '방 코드', value: prefillRoom || '', autocomplete: 'off', 'aria-label': '방 코드' });
      const go = async () => {
        const code = cleanRoomCode(inp.value);
        if (code.length < 4) { toast('방 코드 4글자를 넣어 주세요', 'bad'); return; }
        try {
          const meta = await openRoom(R.db, code).getMeta();
          if (!meta) { toast(R.db ? '그런 방이 없어요. 코드를 다시 확인해 주세요.' : '이 컴퓨터에 그런 방이 없어요. 선생님 컴퓨터와 연결되어 있지 않을 수 있어요.', 'bad'); return; }
          pickMeta = meta; pickRoom = code; paint();
        } catch (e) {
          toast('서버에 닿지 않아요. 인터넷이 끊겼다면 혼자 모드로 계속하면 돼요.', 'bad');
        }
      };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      parts.push(h('div', { class: 'join-card' },
        h('h3', {}, '🚪 방에 들어가기'),
        h('div', { class: 'join-row' }, inp, h('button', { class: 'btn primary big', onClick: go }, '들어가기')),
        h('p', { class: 'muted' }, R.db ? '🟢 우리 반 서버가 설정되어 있어요.' : '⚠ 이 기기에는 우리 반 서버 주소가 없어요. 선생님이 준 링크로 열면 자동으로 설정됩니다. (방에 안 들어가도 모든 활동을 할 수 있어요)')));
    }

    if (R.room && R.tree) {
      const agg = aggregate(R.tree);
      parts.push(h('div', { class: 'two-col' },
        h('div', {}, h('h3', {}, agg.meta.phase === 2 ? '🛡️ 2라운드 — 방어 순위' : '💥 1라운드 — 발견 순위'), boardView(agg)),
        h('div', {}, h('h3', {}, '📣 방금 일어난 일'),
          h('ul', { class: 'feed' }, ...(agg.feed.length ? agg.feed.slice(0, 12).map((e) => h('li', {}, feedText(e))) : [h('li', { class: 'muted' }, '아직 소식이 없어요')])))));
    }

    parts.push(teacher);
    fill(host, ...parts);
  }

  onCleanup(onRoom(paint));
  paint();
  fill(root, host);
}

/* ── 선생님용 ──────────────────────────────────────────────────── */
function teacherPanel() {
  const dbIn = h('input', { class: 'wide-input', placeholder: 'https 로 시작하는 주소 — 예) …-default-rtdb.asia-southeast1.firebasedatabase.app', value: R.db, spellcheck: 'false' });
  const groupsSel = h('select', {}, ...[4, 5, 6, 7, 8, 9, 10, 12].map((n) => h('option', { value: n, selected: n === 6 }, `${n}모둠`)));
  const out = h('div', {});

  const test = async () => {
    const d = cleanDbUrl(dbIn.value);
    if (!d) { toast('Firebase 실시간 데이터베이스 주소가 아니에요 (…firebaseio.com 또는 …firebasedatabase.app)', 'bad'); return; }
    try {
      const res = await fetch(`${d}/rooms/TEST.json`);
      if (res.status === 401 || res.status === 403) { toast('🔴 서버가 읽기를 막았어요. 보안 규칙을 README 대로 넣었는지 확인하세요.', 'bad'); return; }
      if (!res.ok) { toast(`🔴 서버가 ${res.status} 로 답했어요`, 'bad'); return; }
      setDb(d);
      toast('🟢 연결 성공! 주소를 이 기기에 저장했어요.', 'gold');
    } catch (e) { toast('🔴 서버에 닿지 않아요. 주소와 인터넷을 확인하세요.', 'bad'); }
  };

  const create = async () => {
    const code = newRoomCode();
    const conn = openRoom(R.db, code);
    try {
      await conn.setMeta({ groups: Number(groupsSel.value), phase: 1, created: 1 });
    } catch (e) { toast('방을 만들지 못했어요. 서버 주소와 보안 규칙을 확인하세요.', 'bad'); return; }
    watchRoom(code);
    const link = joinLink(code);
    fill(out, h('div', { class: 'made-room' },
      h('div', { class: 'room-code' }, code),
      h('p', {}, '학생 주소 — ', h('code', { class: 'link' }, link)),
      h('div', { class: 'ed-tools' },
        h('button', { class: 'btn', onClick: () => navigator.clipboard.writeText(link).then(() => toast('주소를 복사했어요')).catch(() => toast('복사하지 못했어요 — 주소를 직접 골라 복사하세요')) }, '📋 학생 주소 복사'),
        h('a', { class: 'btn primary', href: `#tv/${code}` }, '📺 TV 화면 열기')),
      !R.db ? h('p', { class: 'warn-text' }, '⚠ 서버 주소가 없어 「이 컴퓨터 안에서만」 만든 방입니다. 연습·시연용이에요 — 학생 기기와는 이어지지 않습니다.') : null));
  };

  return h('details', { class: 'teacher' },
    h('summary', {}, '👩‍🏫 선생님용 — 서버 연결과 방 만들기'),
    h('div', { class: 'teacher-body' },
      h('h4', {}, '① 우리 반 서버 (Firebase 실시간 데이터베이스)'),
      h('p', { class: 'muted' }, '처음 한 번만 하면 됩니다. 만드는 방법과 보안 규칙은 README 의 「실시간 리더보드 설정」 에 있어요. 서버 없이도 모든 활동은 됩니다(혼자 모드).'),
      h('div', { class: 'join-row' }, dbIn, h('button', { class: 'btn', onClick: test }, '연결 시험 · 저장')),
      R.db ? h('p', {}, '🟢 저장된 주소: ', h('code', {}, R.db), ' ', h('button', { class: 'btn small', onClick: async () => { if (await modal('서버 주소 지우기', '이 기기에 저장한 서버 주소를 지울까요?', { ok: '지우기', cancel: '그만두기' })) { setDb(''); toast('지웠어요'); } } }, '지우기')) : null,
      h('h4', {}, '② 오늘 수업 방 만들기'),
      h('div', { class: 'join-row' }, h('label', {}, '모둠 수 ', groupsSel), h('button', { class: 'btn primary', onClick: create }, '🎲 새 방 만들기')),
      out,
      h('p', { class: 'muted' }, '방을 만들면 TV 화면에 방 코드와 주소가 크게 나옵니다. 학생은 주소로 들어오거나, 🏆 탭에서 방 코드 4글자를 넣으면 됩니다.')));
}
