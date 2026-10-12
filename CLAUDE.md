# exception_handling — 부숴봐! 자판기

> © 2026 티쳐무 · 모든 권리 보유

## ① 목적과 대상
- 고등학교 「프로그래밍」(파이썬) **예외 처리** 단원의 **공개수업용** 웹앱. **2차시**.
- 1라운드 「부숴봐!」 — 자판기를 고장 내며 예외를 도감 카드로 모은다(발견 학습).
- 2라운드 「방어막」 — `try·except·else·finally·raise` 를 직접 써서 같은 공격을 다시 막는다.
- 공개수업의 「보이는 순간」: 고장 💥(흔들림·연기·빨간 경고등) ↔ 막음 🛡️(파란 돔·침착한 말) 대비,
  그리고 **교실 TV 리더보드**의 실시간 「우리 반 첫 발견!」.
- 성취기준: 프로그래밍 과목 `프그` 계열(예외 처리는 오류 처리·디버깅 단원에 해당). 코드를 지어내지 말 것.

## ② 기능
- **🎰 부숴봐!** — 입력 칸 4개(돈·번호·쿠폰·사람 수), 실행된 줄 초록/멈춘 줄 빨강, Traceback 콘솔,
  새 카드 팝업, 아직 못 찾은 카드의 힌트 3단계, ValueError 를 낸 칸 3/3.
- **📖 예외 도감** — 카드 8장 = 예외 5 (`ValueError`·`IndexError`·`KeyError`·`TypeError`·`ZeroDivisionError`)
  + 숨은 함정 2 (`ZeroIndex` 번호 0 → 상품[-1] · `NegativePeople` 사람 수 음수 → 거스름돈 뻥튀기)
  + 보너스 1 (`NameError` 「방어막의 함정」 — 2라운드에서 try 를 한 줄만 감쌀 때만 나온다).
  세 가지 잘못(문법 오류·예외·논리 오류) 표, **예외의 족보** 나무.
- **🛡️ 방어막** — 미션 6개: ① try·except ② 종류별 except ③ as e ④ else·finally ⑤ raise·나만의 예외
  ⑥ 보스전(공격 13 + 정상 손님 4, 별 셋 — 모두 막기 · 고장마다 다른 말 · 「모두 잡는」 방어막 안 쓰기).
  미션마다 빈칸 코드 · 문법 모양 · 힌트 3단계 · 「내 앞 미션 코드 가져오기」.
  채점은 학생 코드를 공격·정상 손님에게 **진짜로 실행**해 판정하고, 「1라운드 💥 → 지금 🛡️」 비교표를 보여 준다.
  조언: 만능 방어막(`except:`·`except Exception:`) 🧯 · 침묵 방어(`pass`) 🤐 · NameError 함정 🪤.
- **🏆 우리 반** — 방 코드 + 모둠 고르기(이름 입력 없음, 1모둠 호랑이 … 12모둠 햄스터에서 고르기만),
  모둠 순위(1라운드 발견 수 / 2라운드 미션 평균·보스전), 소식, 선생님용(서버 주소·방 만들기).
- **📺 TV 화면** `#tv/방코드` — 방 코드·학생 주소·우리 반이 찾은 카드(첫 발견 모둠)·순위·소식,
  라운드 전환, 🎭 연습용 가짜 모둠(화면에만), 전체 화면, 방 비우기.
- **📘 정리** — try 흐름 따라가기 3가지(해석기로 실제 실행), 좋은/아쉬운 방어막 3쌍, 확인 문제 7개,
  선생님용 2차시 수업 흐름, 내 기록 지우기.

## ③ 개발 상태 (2026-10-08 첫 완성 · 2026-10-12 Cloudflare 배포)
- Vite + 바닐라 JS, 외부 라이브러리 0개. `dist/index.html` 한 파일(약 170KB)로 더블클릭 실행.
- 점검: `npm test` **491가지**, `npm run check:syntax`(소스 28개).
- 저장소: https://github.com/trmoo/exception_handling (공개, 2026-10-12)
- **배포: Cloudflare Workers** — https://exception-handling.enssam21.workers.dev
  (우리 앱 가운데 **처음으로 GitHub Pages 가 아니라 Cloudflare** 로 올렸다. 사용자가 해 보고 싶어 함)
  - Cloudflare 가 GitHub 저장소와 연결되어 `main` 푸시마다 `npm run build` → `npx wrangler deploy`.
    설정은 `wrangler.jsonc`(이름 `exception-handling` · `assets.directory: ./dist`). Node 는 `.nvmrc`(22).
  - ⚠ Cloudflare 새 프로젝트 화면은 **Pages 가 아니라 Workers** 로 열린다. Workers 는 `wrangler.jsonc` 가
    없으면 deploy 단계에서 실패한다 — `npx wrangler@4 deploy --dry-run` 으로 미리 확인할 수 있다.
  - ⚠ `wrangler.jsonc` 의 `name` 은 Cloudflare 화면의 Project name 과 같아야 한다.
  - 주소의 `enssam21` 은 Cloudflare 계정의 workers.dev 하위 이름이다(짐작으로 맞히지 말고 대시보드에서 볼 것).
  - GitHub Actions 는 `check.yml`(시험·소스 검사·빌드 점검)만 — GitHub Pages 로는 올리지 않는다.
  - 배포본 MD5 가 로컬 `dist/index.html` 과 같은 것을 확인했다(163,131바이트, `6b8387d4…`).
- **Firebase**: 프로젝트 `exception-handling-b4dd2`, Realtime Database 싱가포르
  (`https://exception-handling-b4dd2-default-rtdb.asia-southeast1.firebasedatabase.app`).
  `docs/firebase-rules.json` 이 게시되어 있다(방 자리 200 · 바깥 401 확인).
  **배포 주소에서 진짜 Firebase 로 선생님 → TV → 학생 흐름을 확인했다**(2026-10-12, 시험용 방은 지웠다).

### 다음 할 일
- 교실 컴퓨터·학생 기기에서 `workers.dev` 주소가 학교망에 막히지 않는지 확인.
- 학생 주소가 길다(`?room=…&db=…`) — 서버 주소를 코드에 기본값으로 넣으면 짧은 주소 + 방 코드만으로 들어올 수 있다.

## 구조
```
src/lib/pymini.js     미니 파이썬 해석기 (object-oriented → llm-rag-lab 판을 가져와 예외 처리를 넣음)
src/data/machine.js   자판기 코드 · 진열대 · 입력 칸 · 도감 카드 · 모둠 이름
src/data/missions.js  미션 6개(빈칸 코드·모범 답안) · 공격 13 · 정상 손님 4
src/data/quiz.js      흐름 따라가기 · 확인 문제 · 좋은/아쉬운 방어막
src/game/runner.js    코드 한 번 돌리고 status 가르기 (crash·logic·vend·refuse·calm·silent·broken·blank)
src/game/judge.js     미션 채점 · 보스전 별 · 조언
src/game/store.js     학생 기록(localStorage) · 방 연결 · 리더보드로 보내기
src/net/room.js       Firebase(REST + EventSource) / 이 컴퓨터 안(BroadcastChannel) 두 방식
src/net/aggregate.js  방 자료 → 모둠 순위 (순수 함수)
src/ui/               dom(h·fill·modal·toast·화면 수명) · vending(자판기 그림) · code(코드 보기·편집기·콘솔·입력 칸)
src/tabs/             break · dex · shield · classroom · tv · guide
docs/firebase-rules.json   Firebase 보안 규칙 (선생님이 붙여 넣는다)
tools/golden.py       진짜 파이썬으로 test/golden.json 만들기
tools/mock-firebase.mjs    가짜 Firebase
```

## ⚠ 지킬 것
- **해석기는 진짜 파이썬과 글자 하나까지 같아야 한다.** `test/golden-cases.mjs` 의 조각(157사례 —
  1라운드 자판기·미션 6개 답 × 공격 17가지 포함)을 `python tools/golden.py` 가 CPython 으로 돌려
  `test/golden.json` 을 만들고, 시험이 출력·예외 종류·메시지·줄 번호를 대조한다.
  **조각이나 자판기·미션 코드를 고치면 golden.py 를 다시 돌릴 것** (안 돌리면 사례 수가 달라 시험이 실패).
  이 대조로 실제로 잡은 것 셋: 큰 정수 글자가 parseFloat 로 뭉개짐 · `1 % 0` 문구(`integer modulo by zero`) ·
  예외 클래스의 손자 상속(`class 큰품절(품절)`).
- **큰 정수는 BigInt 로 담는다** (`INT()`). 학생은 돈 칸에 `99999999999999999999` 를 꼭 넣어 본다.
  거스름돈은 `99999999999999998799` 여야 한다(시험이 지킨다).
- **입력은 순서가 아니라 질문 문구로 고른다** (`makeInputFn` — 돈·번호·쿠폰·사람/인원).
  학생이 input 의 차례를 바꿔도 채점이 흔들리지 않게. 질문 문구에서 이 낱말을 빼면 그 칸 값이 안 들어간다.
- **except 로 못 잡는 오류가 있다** — 무한 반복 차단(`fatal`)은 `except:` 로도 잡히면 안 된다.
- **정상 손님 판정은 「원래 출력 줄이 순서대로 모두 들어 있는가」** — 감사 인사를 더 붙이는 것은 되고,
  「나왔습니다」 문구를 바꾸면 실패한다. 판매 판정도 `나왔습니다` 와 `모자라` 낱말로 한다.
- **보스전은 학생 자신의 코드로 시작한다** (통과한 미션 중 가장 뒤의 내 코드, 없으면 1라운드 코드).
  모범 답안은 [↺ 모범 방어막으로] 단추로만. 처음에 모범 답안으로 시작하게 했다가 단추 한 번에 별 셋이 나와 고쳤다.
- **`replaceChildren(null)` 은 화면에 「null」 글자를 넣는다** — 탭 파일은 `fill()` 을 쓴다(check:syntax 가 막는다).
  실제로 배너에 「새 카드!false」 가 찍혔었다.
- **CSS 변수(`--c`)는 `Object.assign(el.style, …)` 로 안 들어간다** — `h()` 가 `setProperty` 로 넣는다.
  이걸 몰라 도감 카드 테두리가 전부 회색이었다.
- **TV 화면은 보기만 한다** — `watchRoom()` 이 `R.g` 를 0 으로 두고, `#tv` 로 열면 `resumeRoom()` 을 하지 않는다.
  안 그러면 학생으로 들어가 있던 기기의 TV 가 자기 점수를 올려 보낸다(실제로 겪었다).
- **선생님용 패널은 한 번만 만든다** — 방을 만들면 화면이 다시 그려지는데, 그때 패널을 새로 만들면 방 코드가 사라진다.
- **서버 주소는 Firebase 꼴만 받는다** (`cleanDbUrl` — `…firebaseio.com`·`…firebasedatabase.app`, 그리고
  시험용 `http://localhost:포트`). 링크의 `?db=` 로 엉뚱한 서버에 보내지 않게.
- **보내는 칸을 늘리면 `docs/firebase-rules.json` 도 함께** — 규칙에 없는 칸은 서버가 거절한다. 시험이 대조한다.
- 격자 칸에는 `min-width: 0` — 긴 코드 줄이 휴대폰 화면을 514px 로 밀어냈었다.
- 데이터 파일(`src/data`·`src/game`·`src/net/aggregate.js`)은 node 로 불러 시험하므로 DOM 을 만들지 말 것.
