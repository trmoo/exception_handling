/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  2라운드 「방어막 짜기」 미션 여섯 개 — 빈칸 코드와 모범 답안.
 *  미션마다 앞 미션의 답에 새 문법 하나를 더한다.
 *    ① try·except  ② 종류별 except  ③ as e  ④ else·finally  ⑤ raise·나만의 예외  ⑥ 보스전
 *  ⚠ 모범 답안이 정말로 채점을 통과하는지 `npm test` 가 지킨다.
 *  ⚠ node 로 그대로 불러다 시험한다. DOM 을 만들지 말 것.
 */

const HEAD = (title) => `# 🛡️ 파이썬 자판기 — ${title}
상품 = ["콜라", "사이다", "우유", "커피", "주스", "생수"]
가격 = [1200, 1000, 800, 1500, 1300, 600]
쿠폰 = {"HAPPY": 200, "LUCKY": 500, "FREE": "공짜"}
`;

// 1라운드 코드의 몸통 (try 안에 들어갈 부분)
const IN = (s) => s.split('\n').map((l) => (l ? '    ' + l : l)).join('\n');
const GET = `돈 = int(input("넣을 돈: "))
번호 = int(input("상품 번호(1~6): "))
고른것 = 상품[번호 - 1]
값 = 가격[번호 - 1]

코드 = input("쿠폰 코드: ")
if 코드 != "":
    값 = 값 - 쿠폰[코드]

인원 = int(input("나눠 낼 사람 수: "))
한명몫 = 값 // 인원`;
const SELL = `if 돈 < 한명몫:
    print("돈이 모자라요! 한 명당", 한명몫, "원이에요.")
else:
    print(고른것, "나왔습니다! 🥤")
    print("거스름돈:", 돈 - 한명몫, "원")`;

const M1_ANSWER = `${HEAD('미션 1')}
try:
${IN(GET)}

${IN(SELL)}
except ValueError:
    print("숫자만 넣어주세요 😊")
`;

const M2_HANDLERS = `except ValueError:
    print("숫자만 넣어주세요 😊")
except IndexError:
    print("그런 번호의 상품은 없어요 🙅")
except KeyError:
    print("없는 쿠폰이에요 🎟️")
except ZeroDivisionError:
    print("0명은 나눠 낼 수 없어요 🤔")
except TypeError:
    print("이 쿠폰은 지금 쓸 수 없어요 🛠️")`;

const M2_ANSWER = `${HEAD('미션 2')}
try:
${IN(GET)}

${IN(SELL)}
${M2_HANDLERS}
`;

const M3_HANDLERS = M2_HANDLERS.replace(`except KeyError:
    print("없는 쿠폰이에요 🎟️")`, `except KeyError as e:
    print("없는 쿠폰이에요 🎟️", e)`);

const M3_ANSWER = `${HEAD('미션 3')}
try:
${IN(GET)}

${IN(SELL)}
${M3_HANDLERS}
`;

const M4_ANSWER = `${HEAD('미션 4')}
try:
${IN(GET)}
${M3_HANDLERS}
else:
${IN(SELL)}
finally:
    print("이용해 주셔서 감사합니다 🙇")
`;

const GET5 = GET
  .replace(`번호 = int(input("상품 번호(1~6): "))`, `번호 = int(input("상품 번호(1~6): "))
if 번호 < 1 or 번호 > len(상품):
    raise IndexError("1~6번 중에서 골라 주세요")`)
  .replace(`인원 = int(input("나눠 낼 사람 수: "))`, `인원 = int(input("나눠 낼 사람 수: "))
if 인원 < 1:
    raise 인원오류("사람 수는 1명 이상이어야 해요")`);
const M5_HANDLERS = M3_HANDLERS
  .replace(`except IndexError:
    print("그런 번호의 상품은 없어요 🙅")`, `except IndexError as e:
    print("🙅", e)`)
  .replace(`except ZeroDivisionError:`, `except 인원오류 as e:
    print("🙅", e)
except ZeroDivisionError:`);

const M5_ANSWER = `${HEAD('미션 5')}
class 인원오류(Exception):
    pass

try:
${IN(GET5)}
${M5_HANDLERS}
else:
${IN(SELL)}
finally:
    print("이용해 주셔서 감사합니다 🙇")
`;

const M6_ANSWER = M5_ANSWER.replace('미션 5', '보스전');

/* ── 빈칸 코드 ─────────────────────────────────────────────────────── */
const M1_STARTER = `${HEAD('미션 1')}
____:
${IN(GET)}

${IN(SELL)}
____ ValueError:
    print("____")
`;

const M2_STARTER = `${HEAD('미션 2')}
try:
${IN(GET)}

${IN(SELL)}
except ValueError:
    print("숫자만 넣어주세요 😊")
except ____:
    print("그런 번호의 상품은 없어요 🙅")
except KeyError:
    print("____")
except ____:
    print("0명은 나눠 낼 수 없어요 🤔")
____ TypeError:
    print("이 쿠폰은 지금 쓸 수 없어요 🛠️")
`;

const M3_STARTER = M2_ANSWER.replace('미션 2', '미션 3').replace(`except KeyError:
    print("없는 쿠폰이에요 🎟️")`, `except KeyError ____ e:
    print("없는 쿠폰이에요 🎟️", ____)`);

const M4_STARTER = M4_ANSWER.replace(`
else:
`, `
____:
`).replace(`finally:
    print("이용해`, `____:
    print("이용해`);

const M5_STARTER = M5_ANSWER
  .replace('class 인원오류(Exception):', 'class 인원오류(____):')
  .replace('raise IndexError("1~6번', '____ IndexError("1~6번')
  .replace('raise 인원오류("사람 수는', 'raise ____("사람 수는');

/* ── 미션 목록 ─────────────────────────────────────────────────────── */
export const MISSIONS = [
  {
    id: 'm1', no: 1, icon: '🛡️', title: '첫 방어막',
    concept: 'try · except',
    goal: '숫자가 아닌 값을 넣어도 자판기가 멈추지 않고 「숫자만 넣어주세요 😊」 라고 말하게 하세요.',
    explain: [
      '예외가 날 수도 있는 코드를 try: 아래에 들여 씁니다.',
      'try 안에서 예외가 나면 남은 줄은 건너뛰고, 종류가 맞는 except 로 곧장 갑니다.',
      'except ValueError: 는 「ValueError 가 나면 여기로 오세요」 라는 뜻입니다.',
    ],
    syntax: 'try:\n    (예외가 날 수도 있는 코드)\nexcept ValueError:\n    (그때 할 일)',
    starter: M1_STARTER, answer: M1_ANSWER,
    hints: [
      '빈칸은 세 개입니다. 위의 빈칸은 「시도해 본다」 는 뜻의 낱말입니다.',
      '첫째 빈칸은 try, 둘째 빈칸은 except 입니다. 셋째는 손님에게 할 말이에요.',
      'try: … except ValueError: … print("숫자만 넣어주세요 😊")',
    ],
  },
  {
    id: 'm2', no: 2, icon: '🧱', title: '종류별 방어막',
    concept: 'except 여러 개',
    goal: '1라운드에서 찾은 다섯 가지 고장을 모두 막고, 고장마다 다른 말로 알려 주세요.',
    explain: [
      'except 는 여러 개 쓸 수 있습니다. 위에서부터 보며 종류가 맞는 첫 번째 하나만 실행됩니다.',
      '고장마다 다른 말을 해야 손님이 무엇을 고칠지 압니다. 「오류가 났습니다」 한 마디로는 아무도 못 고쳐요.',
    ],
    syntax: 'except ValueError:\n    …\nexcept IndexError:\n    …\nexcept KeyError:\n    …',
    starter: M2_STARTER, answer: M2_ANSWER,
    hints: [
      '도감을 펴 보세요. 상품 번호가 너무 크면 무슨 예외였나요? 사람 수가 0 이면요?',
      '첫째 빈칸 IndexError, 넷째 빈칸 ZeroDivisionError, 마지막 빈칸은 except 입니다.',
      'KeyError 아래에는 손님에게 할 말, 예를 들어 "없는 쿠폰이에요 🎟️" 를 쓰세요.',
    ],
  },
  {
    id: 'm3', no: 3, icon: '🔍', title: '예외를 붙잡아 읽기',
    concept: 'except … as e',
    goal: '없는 쿠폰을 넣으면 「없는 쿠폰이에요 🎟️ \'happy\'」 처럼 손님이 넣은 쿠폰 이름까지 보여 주세요.',
    explain: [
      'except KeyError as e: 라고 쓰면 잡은 예외 객체에 e 라는 이름이 붙습니다.',
      'print(e) 하면 예외의 메시지가 나옵니다. KeyError 의 메시지는 「없던 키」 그 자체입니다.',
      'type(e).__name__ 으로 예외의 종류 이름도 꺼낼 수 있습니다.',
    ],
    syntax: 'except KeyError as e:\n    print("없는 쿠폰이에요", e)',
    starter: M3_STARTER, answer: M3_ANSWER,
    hints: [
      '예외에 이름을 붙이는 낱말은 두 글자입니다. 「~로서」 라는 뜻이에요.',
      '첫째 빈칸은 as, 둘째 빈칸은 그 이름 e 입니다.',
      'except KeyError as e:\n    print("없는 쿠폰이에요 🎟️", e)',
    ],
  },
  {
    id: 'm4', no: 4, icon: '🎀', title: '성공했을 때와 언제나',
    concept: 'else · finally',
    goal: '음료를 파는 부분은 예외가 없을 때만, 「이용해 주셔서 감사합니다 🙇」 는 무슨 일이 있어도 마지막에 나오게 하세요.',
    explain: [
      'else: 는 try 에서 예외가 하나도 안 났을 때만 실행됩니다. 「성공했을 때 할 일」 을 둡니다.',
      'finally: 는 예외가 났든 안 났든, 잡았든 못 잡았든 언제나 마지막에 실행됩니다.',
      'try 안에는 「예외가 날 수 있는 코드」 만 두는 것이 좋습니다. 그래야 어디서 난 예외인지 분명해요.',
    ],
    syntax: 'try:\n    …\nexcept …:\n    …\nelse:\n    (성공했을 때)\nfinally:\n    (언제나)',
    starter: M4_STARTER, answer: M4_ANSWER,
    hints: [
      '빈칸은 두 개입니다. 하나는 if 문에서도 쓰던 낱말이에요.',
      '판매하는 부분 위의 빈칸은 else, 감사 인사 위의 빈칸은 finally 입니다.',
      'else: 와 finally: 는 try·except 와 같은 들여쓰기(맨 앞)에 씁니다.',
    ],
  },
  {
    id: 'm5', no: 5, icon: '🚨', title: '숨은 함정 막기',
    concept: 'raise · 나만의 예외',
    goal: '0번 상품과 음수 사람 수처럼 「고장은 안 나지만 말이 안 되는」 입력을 직접 예외로 바꿔 막으세요.',
    explain: [
      '파이썬은 상품[-1] 을 「뒤에서 첫째」 로 알아서 예외를 내지 않습니다. 그럴 때는 내가 규칙을 세워 raise 로 예외를 일으킵니다.',
      'raise IndexError("1~6번 중에서 골라 주세요") — 괄호 안의 글이 예외의 메시지가 됩니다.',
      'class 인원오류(Exception): pass 처럼 Exception 을 물려받으면 나만의 예외를 만들 수 있습니다.',
    ],
    syntax: 'if 번호 < 1 or 번호 > len(상품):\n    raise IndexError("1~6번 중에서 골라 주세요")',
    starter: M5_STARTER, answer: M5_ANSWER,
    hints: [
      '빈칸은 세 개입니다. 예외를 「던지는」 낱말과, 모든 예외의 조상 이름이 필요해요.',
      'class 인원오류(Exception): · raise IndexError(…) · raise 인원오류(…)',
      '첫째 빈칸 Exception, 둘째 빈칸 raise, 셋째 빈칸 인원오류 입니다.',
    ],
  },
  {
    id: 'm6', no: 6, icon: '👾', title: '보스전 — 모든 공격 막아 내기',
    concept: '종합',
    goal: '공격 13가지를 한꺼번에 넣습니다. 모두 막아 내면서, 정상 손님 4명에게는 원래대로 팔아야 합니다.',
    explain: [
      '내가 통과한 미션 가운데 가장 뒤의 내 코드를 가져왔습니다(아무것도 없으면 방어막 없는 1라운드 코드). 마음껏 고쳐도 됩니다.',
      '⭐ 별 셋에 도전 — ① 모든 공격 막기 ② 고장마다 다른 말 ③ except: 나 except Exception: 처럼 「모두 잡는」 방어막을 쓰지 않기',
    ],
    syntax: '',
    starter: M6_ANSWER, answer: M6_ANSWER, boss: true,
    hints: [
      '[공격 시작] 을 누르고, 뚫린 공격(💥)을 눌러 무슨 예외인지 확인하세요.',
      '정상 손님이 실패하면 방어막이 너무 넓은 것입니다. 원래 출력 문구를 바꾸지 않았는지도 보세요.',
      '막혔는데 말이 없으면(🤐) except 아래에 pass 만 있는 것입니다. 손님에게 이유를 알려 주세요.',
    ],
  },
];

export const missionOf = (id) => MISSIONS.find((m) => m.id === id);

/* ── 공격과 정상 손님 ──────────────────────────────────────────────── */
const V = (o) => ({ money: '2000', num: '1', coupon: '', people: '1', ...o });
export const ATTACKS = [
  { id: 'a1', values: V({ money: '천원' }), expect: 'ValueError', label: '돈에 「천원」' },
  { id: 'a2', values: V({ money: '2,000' }), expect: 'ValueError', label: '돈에 「2,000」 (쉼표)' },
  { id: 'a3', values: V({ money: '' }), expect: 'ValueError', label: '돈 칸을 비움' },
  { id: 'a4', values: V({ num: '칠' }), expect: 'ValueError', label: '번호에 「칠」' },
  { id: 'a5', values: V({ num: '7' }), expect: 'IndexError', label: '번호 7' },
  { id: 'a6', values: V({ num: '100' }), expect: 'IndexError', label: '번호 100' },
  { id: 'a7', values: V({ coupon: 'happy' }), expect: 'KeyError', label: '쿠폰 「happy」 (소문자)' },
  { id: 'a8', values: V({ coupon: 'BONUS' }), expect: 'KeyError', label: '없는 쿠폰 「BONUS」' },
  { id: 'a9', values: V({ coupon: 'FREE' }), expect: 'TypeError', label: '쿠폰 「FREE」' },
  { id: 'a10', values: V({ people: '0' }), expect: 'ZeroDivisionError', label: '사람 수 0' },
  { id: 'a11', values: V({ people: '둘' }), expect: 'ValueError', label: '사람 수에 「둘」' },
  { id: 'a12', values: V({ num: '0' }), expect: 'ZeroIndex', label: '번호 0 (숨은 함정)' },
  { id: 'a13', values: V({ people: '-2' }), expect: 'NegativePeople', label: '사람 수 -2 (숨은 함정)' },
];
export const NORMALS = [
  { id: 'n1', values: V({}), label: '콜라 사기' },
  { id: 'n2', values: V({ money: '1000', num: '3', coupon: 'HAPPY' }), label: '우유 + HAPPY 쿠폰' },
  { id: 'n3', values: V({ money: '3000', num: '4', coupon: 'LUCKY', people: '2' }), label: '커피를 둘이 나눠 내기' },
  { id: 'n4', values: V({ money: '500', num: '2' }), label: '돈이 모자란 손님' },
];
export const attackOf = (id) => ATTACKS.find((a) => a.id === id);
