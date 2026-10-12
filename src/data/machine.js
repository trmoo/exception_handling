/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  자판기 코드와 예외 도감 카드.
 *  ⚠ 이 파일은 node 로 그대로 불러다 시험한다. DOM 을 만들지 말 것.
 */

// ── 1라운드 자판기 코드 ─────────────────────────────────────────────
// 방어막이 하나도 없는 「순진한」 자판기. 학생은 이 코드를 고장 내는 것이 목표다.
// 고장 낼 수 있는 곳: int( ) 세 군데(ValueError) · 상품[번호-1](IndexError)
//   · 쿠폰[코드](KeyError) · "공짜" 쿠폰(TypeError) · 값 // 인원(ZeroDivisionError)
// 숨은 함정(예외가 아닌 논리 오류): 번호 0 → 상품[-1] · 사람 수 음수 → 거스름돈 뻥튀기
export const MACHINE_CODE = `# 🥤 파이썬 자판기 v1.0 — 아직 방어막이 없어요!
상품 = ["콜라", "사이다", "우유", "커피", "주스", "생수"]
가격 = [1200, 1000, 800, 1500, 1300, 600]
쿠폰 = {"HAPPY": 200, "LUCKY": 500, "FREE": "공짜"}

돈 = int(input("넣을 돈: "))
번호 = int(input("상품 번호(1~6): "))
고른것 = 상품[번호 - 1]
값 = 가격[번호 - 1]

코드 = input("쿠폰 코드: ")
if 코드 != "":
    값 = 값 - 쿠폰[코드]

인원 = int(input("나눠 낼 사람 수: "))
한명몫 = 값 // 인원

if 돈 < 한명몫:
    print("돈이 모자라요! 한 명당", 한명몫, "원이에요.")
else:
    print(고른것, "나왔습니다! 🥤")
    print("거스름돈:", 돈 - 한명몫, "원")
`;

// 화면의 진열대 — 위 코드의 상품·가격과 같아야 한다 (시험이 대조한다)
export const PRODUCTS = [
  { name: '콜라', price: 1200, icon: '🥤' },
  { name: '사이다', price: 1000, icon: '🫧' },
  { name: '우유', price: 800, icon: '🥛' },
  { name: '커피', price: 1500, icon: '☕' },
  { name: '주스', price: 1300, icon: '🧃' },
  { name: '생수', price: 600, icon: '💧' },
];
export const COUPONS = { HAPPY: 200, LUCKY: 500, FREE: '공짜' };

// ── 입력 칸 ─────────────────────────────────────────────────────────
// input( ) 의 질문 문구에 match 가 들어 있으면 그 칸의 값을 넣어 준다.
export const FIELDS = [
  { key: 'money', label: '넣을 돈', icon: '💰', match: /돈/, def: '2000', ph: '예) 2000' },
  { key: 'num', label: '상품 번호', icon: '🔢', match: /번호/, def: '1', ph: '1~6' },
  { key: 'coupon', label: '쿠폰 코드', icon: '🎟️', match: /쿠폰/, def: '', ph: '없으면 비워 두기' },
  { key: 'people', label: '나눠 낼 사람 수', icon: '👥', match: /사람|인원|명/, def: '1', ph: '예) 1' },
];

/** 질문 문구 → 넣을 값. 맞는 칸이 없으면 차례대로 준다. */
export function makeInputFn(values) {
  return (prompt, i) => {
    const f = FIELDS.find((x) => x.match.test(prompt)) || FIELDS[i];
    if (!f) return null;
    const v = values[f.key];
    return v === undefined || v === null ? '' : String(v);
  };
}

// ── 예외 도감 ───────────────────────────────────────────────────────
// kind: 'exc' 진짜 예외 · 'logic' 예외가 안 나는 논리 오류 · 'bonus' 2라운드에서만 나오는 것
export const CARDS = [
  {
    id: 'ValueError', kind: 'exc', icon: '🔤', color: '#f59e0b',
    nick: '값이 이상해요',
    what: '자료형(글자)은 받을 수 있는데, 그 값으로는 할 일을 못 할 때 납니다. int( ) 는 「2000」 은 숫자로 바꾸지만 「천원」 은 못 바꿉니다.',
    like: '자판기에 동전 대신 단추를 넣은 것 — 구멍에는 들어가지만 돈이 아니에요.',
    places: [
      { key: 'money', label: '돈 칸' },
      { key: 'num', label: '번호 칸' },
      { key: 'people', label: '사람 수 칸' },
    ],
    hints: [
      '숫자를 넣어야 하는 칸에 숫자가 아닌 것을 넣으면 어떻게 될까요?',
      'int( ) 는 어떤 글자를 숫자로 바꾸지 못할까요? 한글? 소수점? 쉼표?',
      '돈 칸에 「천원」 이라고 넣어 보세요.',
    ],
    fix: 'except ValueError: 로 잡고 「숫자만 넣어주세요」 라고 알려 줍니다.',
  },
  {
    id: 'IndexError', kind: 'exc', icon: '📦', color: '#3b82f6',
    nick: '그런 자리는 없어요',
    what: '리스트에 없는 자리 번호를 꺼내려 할 때 납니다. 상품이 6개면 자리는 0~5 뿐입니다.',
    like: '6칸짜리 진열대에서 7번 칸의 음료를 달라고 하는 것.',
    hints: [
      '상품은 몇 개가 있나요? 그보다 큰 번호를 고르면?',
      '상품[번호 - 1] — 번호가 7이면 상품[6] 인데, 6번 자리가 있을까요?',
      '상품 번호에 7 을 넣어 보세요.',
    ],
    fix: 'except IndexError: 로 잡거나, 번호가 1~6 인지 미리 확인합니다.',
  },
  {
    id: 'KeyError', kind: 'exc', icon: '🗝️', color: '#8b5cf6',
    nick: '그런 열쇠는 없어요',
    what: '딕셔너리에 없는 키로 값을 꺼내려 할 때 납니다. 키는 대소문자까지 똑같아야 합니다.',
    like: '사물함 명단에 없는 이름으로 사물함을 열어 달라는 것.',
    hints: [
      '쿠폰은 어디에 담겨 있나요? 거기에 없는 쿠폰을 쓰면?',
      '쿠폰 목록은 HAPPY · LUCKY · FREE 입니다. 소문자로 쓰면 같은 쿠폰일까요?',
      '쿠폰 코드에 happy 라고 넣어 보세요.',
    ],
    fix: 'except KeyError as e: 로 잡으면 e 에 「없던 키」 가 들어 있습니다.',
  },
  {
    id: 'TypeError', kind: 'exc', icon: '🧩', color: '#ec4899',
    nick: '자료형이 안 맞아요',
    what: '서로 계산할 수 없는 자료형끼리 계산하려 할 때 납니다. 숫자 − 글자는 할 수 없습니다.',
    like: '사과 3개에서 「바나나」 를 빼라는 것.',
    hints: [
      '쿠폰 딕셔너리를 자세히 보세요. 값이 모두 숫자인가요?',
      'FREE 쿠폰의 값은 "공짜" — 글자입니다. 값 - "공짜" 는 계산이 될까요?',
      '쿠폰 코드에 FREE 를 넣어 보세요.',
    ],
    fix: 'except TypeError: 로 잡거나, 쿠폰 값을 숫자로 바로잡습니다(진짜 고칠 곳은 코드).',
  },
  {
    id: 'ZeroDivisionError', kind: 'exc', icon: '➗', color: '#ef4444',
    nick: '0으로 나눌 수 없어요',
    what: '어떤 수를 0 으로 나누려 할 때 납니다. 수학에서도 0 으로 나누기는 정할 수 없습니다.',
    like: '과자 한 봉지를 0명에게 똑같이 나눠 주라는 것.',
    hints: [
      '자판기는 값을 무엇으로 나누나요?',
      '한명몫 = 값 // 인원 — 인원이 몇이면 곤란할까요?',
      '나눠 낼 사람 수에 0 을 넣어 보세요.',
    ],
    fix: 'except ZeroDivisionError: 로 잡거나, 사람 수가 1 이상인지 미리 확인합니다.',
  },
  {
    id: 'ZeroIndex', kind: 'logic', icon: '🕳️', color: '#64748b',
    name: '0번 상품의 비밀', nick: '고장은 안 났는데…?',
    what: '번호 0 을 넣으면 상품[-1] 이 되어 맨 마지막 「생수」 가 나옵니다. 파이썬에서 -1 은 「뒤에서 첫째」 라는 뜻이라 예외가 나지 않습니다.',
    like: '없는 칸을 눌렀는데 엉뚱한 음료가 나오는 자판기. 오류 메시지가 없어서 오히려 더 위험합니다.',
    hints: [
      '1~6 이 아닌데도 고장이 안 나는 번호가 있을까요?',
      '파이썬 리스트에서 상품[-1] 은 무엇일까요?',
      '상품 번호에 0 을 넣어 보세요. 무엇이 나오나요?',
    ],
    fix: 'if 번호 < 1 or 번호 > 6: raise IndexError(...) — 이상한 값을 직접 예외로 바꿉니다.',
  },
  {
    id: 'NegativePeople', kind: 'logic', icon: '💸', color: '#64748b',
    name: '돈을 주는 자판기', nick: '고장은 안 났는데…?',
    what: '사람 수에 음수를 넣으면 한 명 몫이 음수가 되어, 거스름돈이 넣은 돈보다 많아집니다. 계산은 「맞게」 했으니 예외가 나지 않습니다.',
    like: '음료를 샀는데 자판기가 돈을 더 얹어 주는 것. 가게 주인은 울어요.',
    hints: [
      '사람 수에 넣으면 안 되는데 int( ) 는 받아 주는 숫자가 있을까요?',
      '인원이 음수면 한명몫 = 값 // 인원 은 어떻게 될까요?',
      '사람 수에 -2 를 넣고 거스름돈을 보세요.',
    ],
    fix: 'if 인원 < 1: raise … — 「되기는 하지만 말이 안 되는 값」 은 내가 규칙을 세워 막아야 합니다.',
  },
  {
    id: 'NameError', kind: 'bonus', icon: '🪤', color: '#0ea5e9',
    name: '방어막의 함정', nick: '막았더니 새 고장이?',
    what: 'try 로 한 줄만 감싸면, 예외를 잡은 뒤에도 프로그램은 다음 줄로 계속 갑니다. 그런데 그 변수에는 값이 들어가지 못했으니 「그런 이름은 없다」 는 NameError 가 납니다.',
    like: '문은 막았는데 창문으로 들어오는 바람. 2라운드에서만 만날 수 있어요.',
    hints: [
      '2라운드에서 try 를 코드 일부에만 둘러 보세요.',
      'except 가 예외를 잡고 나면, 그다음 줄은 실행될까요?',
      'try 를 돈 = int(…) 한 줄에만 두르고 돈 칸에 「천원」 을 넣어 보세요.',
    ],
    fix: '예외가 나면 뒤의 계산을 건너뛰도록 계산 전체를 try 안에 넣거나, else 를 씁니다.',
  },
];

export const EXC_CARDS = CARDS.filter((c) => c.kind === 'exc');
export const cardOf = (id) => CARDS.find((c) => c.id === id);
export const cardName = (c) => c.name || c.id;

// ── 우리 반 모둠 ────────────────────────────────────────────────────
// 이름을 받지 않는다. 미리 정해 둔 모둠 이름에서 고르기만 한다 (공개수업 중 이상한 이름 방지).
export const GROUPS = [
  { g: 1, name: '호랑이', emoji: '🐯' }, { g: 2, name: '토끼', emoji: '🐰' },
  { g: 3, name: '여우', emoji: '🦊' }, { g: 4, name: '판다', emoji: '🐼' },
  { g: 5, name: '펭귄', emoji: '🐧' }, { g: 6, name: '코알라', emoji: '🐨' },
  { g: 7, name: '사자', emoji: '🦁' }, { g: 8, name: '개구리', emoji: '🐸' },
  { g: 9, name: '곰', emoji: '🐻' }, { g: 10, name: '고양이', emoji: '🐱' },
  { g: 11, name: '강아지', emoji: '🐶' }, { g: 12, name: '햄스터', emoji: '🐹' },
];
export const groupOf = (g) => GROUPS.find((x) => x.g === Number(g)) || { g, name: `${g}모둠`, emoji: '⭐' };
export const groupLabel = (g) => { const x = groupOf(g); return `${x.emoji} ${x.g}모둠 ${x.name}`; };
