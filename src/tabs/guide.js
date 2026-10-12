/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  📘 정리 — 흐름 따라가기 · 좋은 방어막 · 확인 문제 · 선생님용 수업 흐름.
 */
import { h, fill, toast, modal } from '../ui/dom.js';
import { codeView, consoleView } from '../ui/code.js';
import { runPython } from '../lib/pymini.js';
import { FLOW_CODE, FLOW_CASES, QUIZ, GOOD_BAD } from '../data/quiz.js';
import { resetAll } from '../game/store.js';

let flowCase = 'caught';
const answered = {};

export function renderGuide(root) {
  const flowHost = h('div', {});
  const paintFlow = () => {
    const c = FLOW_CASES.find((x) => x.id === flowCase);
    const code = FLOW_CODE(c.value);
    const r = runPython(code, { file: 'flow.py' });
    fill(flowHost, 
      h('div', { class: 'pills' }, ...FLOW_CASES.map((x) => h('button', { class: 'pill' + (x.id === flowCase ? ' on' : ''), onClick: () => { flowCase = x.id; paintFlow(); } }, x.label))),
      h('div', { class: 'flow-grid' },
        codeView(code, { ran: r.ran, crash: r.ok ? null : r.errorLine, crashType: r.errorType, caught: r.caught }),
        h('div', {}, consoleView(r.ok ? r.output : `${r.output}\n${r.traceback}`), h('p', { class: 'flow-explain' }, `💡 ${c.explain}`))),
    );
  };
  paintFlow();

  const quizHost = h('div', { class: 'quiz' });
  const paintQuiz = () => {
    const score = Object.values(answered).filter(Boolean).length;
    fill(quizHost, 
      h('div', { class: 'quiz-score' }, `맞힌 문제 ${score} / ${QUIZ.length}`),
      ...QUIZ.map((q, i) => {
        const a = answered[i];
        return h('div', { class: 'q' + (a === true ? ' right' : a === false ? ' wrong' : '') },
          h('div', { class: 'q-head' }, h('b', {}, `Q${i + 1}. `), q.q),
          q.code ? codeView(q.code) : null,
          h('div', { class: 'q-choices' }, ...q.choices.map((ch) => h('button', {
            class: 'choice', disabled: a !== undefined,
            onClick: () => { answered[i] = ch === q.answer; paintQuiz(); if (ch === q.answer) toast('정답! 🎉', 'gold'); },
          }, ch))),
          a !== undefined ? h('div', { class: 'q-why' }, a ? '✅ 정답! ' : `❌ 정답은 「${q.answer}」. `, q.why) : null,
          a === false ? h('button', { class: 'btn small', onClick: () => { delete answered[i]; paintQuiz(); } }, '다시 풀기') : null);
      }));
  };
  paintQuiz();

  fill(root, 
    h('section', { class: 'round-head' },
      h('div', {}, h('div', { class: 'eyebrow' }, '정리'), h('h2', {}, '📘 예외 처리 한눈에'),
        h('p', {}, '오늘 부수고 막아 본 것을 정리합니다. 값을 바꿔 가며 try 문이 어떤 차례로 도는지 직접 확인해 보세요.'))),
    h('div', { class: 'block' }, h('h3', {}, '🔀 try 문은 어떤 차례로 돌까?'),
      h('p', { class: 'muted' }, '초록 줄이 실행된 줄, 파란 표시가 예외를 잡은 곳입니다. (이 코드도 진짜로 실행한 결과예요)'), flowHost),
    h('div', { class: 'block' }, h('h3', {}, '🧱 좋은 방어막 · 아쉬운 방어막'),
      ...GOOD_BAD.map((g) => h('div', { class: 'gb' },
        h('div', { class: 'gb-bad' }, h('div', { class: 'gb-tag' }, '😥 아쉬워요'), codeView(g.bad), h('p', {}, g.badWhy)),
        h('div', { class: 'gb-good' }, h('div', { class: 'gb-tag' }, '😊 좋아요'), codeView(g.good), h('p', {}, g.goodWhy))))),
    h('div', { class: 'block' }, h('h3', {}, '✅ 확인 문제'), quizHost),
    h('div', { class: 'block' }, h('h3', {}, '📝 한 줄 정리'),
      h('ul', { class: 'summary' },
        h('li', {}, h('b', {}, '예외'), ' — 문법은 맞지만 실행하는 순간 할 수 없는 일. 잡지 않으면 프로그램이 멈춥니다.'),
        h('li', {}, h('b', {}, 'try / except'), ' — 예외가 날 만한 곳을 감싸고, 종류별로 어떻게 할지 정합니다.'),
        h('li', {}, h('b', {}, 'as e'), ' — 잡은 예외에 이름을 붙여 메시지를 읽습니다.'),
        h('li', {}, h('b', {}, 'else / finally'), ' — 성공했을 때만 / 언제나.'),
        h('li', {}, h('b', {}, 'raise'), ' — 파이썬이 몰라서 못 잡는 「말이 안 되는 값」 을 내가 예외로 만듭니다.'),
        h('li', {}, h('b', {}, '좋은 방어막'), ' — 종류를 적고, 무엇을 고치면 되는지 친절하게 알려 준다.'))),
    h('details', { class: 'teacher block' },
      h('summary', {}, '👩‍🏫 선생님용 — 2차시 수업 흐름'),
      h('div', { class: 'teacher-body' },
        h('table', { class: 'plan' },
          h('tr', {}, h('th', {}, '차시'), h('th', {}, '시간'), h('th', {}, '활동'), h('th', {}, '화면')),
          h('tr', {}, h('td', { rowspan: '4' }, '1차시'), h('td', {}, '5분'), h('td', {}, '동기 — 자판기를 TV 에 띄우고 정상 구매 시연. 「이 자판기를 고장 내면 이깁니다」'), h('td', {}, '🎰')),
          h('tr', {}, h('td', {}, '25분'), h('td', {}, '1라운드 — 모둠별로 고장 내기. TV 리더보드로 발견 경쟁. 힌트는 모둠당 정해 두고 쓰게'), h('td', {}, '🎰 📺')),
          h('tr', {}, h('td', {}, '10분'), h('td', {}, 'Traceback 읽기 — 맨 아래 줄(무슨 예외), 그 위(어디서). 문법 오류 · 예외 · 논리 오류 구분'), h('td', {}, '📖')),
          h('tr', {}, h('td', {}, '5분'), h('td', {}, '숨은 함정 두 장을 함께 보며 「예외가 없다고 안전한 건 아니다」 정리'), h('td', {}, '📖')),
          h('tr', {}, h('td', { rowspan: '4' }, '2차시'), h('td', {}, '5분'), h('td', {}, 'try 문 차례 — 흐름 따라가기 세 경우를 TV 로'), h('td', {}, '📘')),
          h('tr', {}, h('td', {}, '25분'), h('td', {}, '2라운드 미션 1~5 — 빈칸부터. 빠른 학생은 「내 코드 가져오기」 로 이어 쓰기'), h('td', {}, '🛡️ 📺')),
          h('tr', {}, h('td', {}, '10분'), h('td', {}, '보스전 — 공격 13가지 자동 재생. 별 셋 도전. 뚫린 공격을 TV 로 함께 분석'), h('td', {}, '🛡️')),
          h('tr', {}, h('td', {}, '5분'), h('td', {}, '확인 문제 · 「좋은 방어막」 정리'), h('td', {}, '📘'))),
        h('p', { class: 'muted' }, '공개수업 팁 — TV 화면(📺)은 선생님 컴퓨터에서 따로 열어 두고, 1라운드 첫 발견이 나올 때마다 화면에 크게 뜨는 순간을 함께 봅니다. 인터넷이 끊겨도 학생 활동은 그대로 됩니다(리더보드만 멈춤).'),
        h('p', { class: 'muted' }, '정답 코드 — 🛡️ 탭의 힌트 3단계가 사실상 정답입니다. 보스전의 [↺ 모범 방어막으로] 단추가 미션 5의 완성 코드를 불러옵니다.'))),
    h('div', { class: 'block reset' },
      h('button', { class: 'btn', onClick: async () => {
        if (await modal('내 기록 지우기', '이 기기에 남은 도감 카드·미션 코드를 모두 지웁니다. 공용 컴퓨터라면 수업이 끝나고 눌러 주세요.', { ok: '모두 지우기', cancel: '그만두기' })) { resetAll(); toast('지웠어요'); }
      } }, '🧹 내 기록 지우기')),
  );
}
