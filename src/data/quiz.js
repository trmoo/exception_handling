/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  📘 정리 탭의 확인 문제와 흐름 따라가기.
 *  ⚠ 「출력 맞히기」 문제의 정답은 `npm test` 가 코드를 진짜로 돌려 대조한다.
 *  ⚠ node 로 그대로 불러다 시험한다. DOM 을 만들지 말 것.
 */

// 흐름 따라가기 — 값만 바꿔 try·except·else·finally 가 어떤 차례로 도는지 본다
export const FLOW_CODE = (value) => `값 = ${value}
try:
    print("① try 시작")
    x = int(값)
    print("② 바꾸기 성공:", x)
except ValueError:
    print("③ 숫자가 아니에요")
else:
    print("④ 예외 없이 끝남")
finally:
    print("⑤ 언제나 실행")
print("⑥ 다음 줄로")
`;
export const FLOW_CASES = [
  { id: 'ok', label: '예외가 안 날 때', value: '"7"', explain: 'try 를 끝까지 실행하고 → else → finally → 다음 줄. except 는 건너뜁니다.' },
  { id: 'caught', label: 'ValueError 가 날 때', value: '"칠"', explain: 'int( ) 에서 예외가 나는 순간 ② 를 건너뛰고 except 로 갑니다. 잡았으니 else 는 건너뛰고 finally → 다음 줄.' },
  { id: 'uncaught', label: '못 잡는 예외가 날 때', value: 'None', explain: 'int(None) 은 TypeError. except ValueError 와 종류가 달라 못 잡습니다. finally 만 실행하고 프로그램이 멈춥니다 — ⑥ 은 끝내 나오지 않아요.' },
];

// 확인 문제 — type: 'output' 이면 code 를 돌린 출력이 answer 와 같아야 한다
export const QUIZ = [
  {
    q: '출력은 무엇일까요?', type: 'output',
    code: `try:
    x = int("3")
    print("A")
except ValueError:
    print("B")
print("C")`,
    choices: ['A C', 'B C', 'A B C', 'C'], answer: 'A C',
    why: 'int("3") 은 잘 바뀌니 예외가 없습니다. except 는 건너뛰고 C 로 갑니다.',
  },
  {
    q: '출력은 무엇일까요?', type: 'output',
    code: `try:
    x = int("삼")
    print("A")
except ValueError:
    print("B")
print("C")`,
    choices: ['A C', 'B C', 'A B C', 'B'], answer: 'B C',
    why: 'int("삼") 에서 예외가 나면 그 아래 print("A") 는 실행되지 않고 곧장 except 로 갑니다. 잡았으니 프로그램은 계속 C 로 갑니다.',
  },
  {
    q: '출력은 무엇일까요?', type: 'output',
    code: `try:
    print("1")
    y = 10 / 0
    print("2")
except ZeroDivisionError:
    print("3")
else:
    print("4")
finally:
    print("5")`,
    choices: ['1 2 4 5', '1 3 5', '1 3 4 5', '1 3'], answer: '1 3 5',
    why: '예외가 났으니 else(4)는 건너뜁니다. finally(5)는 언제나 실행됩니다.',
  },
  {
    q: '어느 except 가 실행될까요? (출력을 고르세요)', type: 'output',
    code: `try:
    상품 = ["콜라", "사이다"]
    print(상품[5])
except KeyError:
    print("열쇠")
except LookupError:
    print("찾기")
except Exception:
    print("모두")`,
    choices: ['열쇠', '찾기', '모두', '찾기 모두'], answer: '찾기',
    why: 'IndexError 는 LookupError 의 자식입니다. 위에서부터 보며 처음 맞는 except 하나만 실행되므로 「찾기」.',
  },
  {
    q: '출력은 무엇일까요?', type: 'output',
    code: `def 나누기(a, b):
    if b == 0:
        raise ValueError("0은 안 돼요")
    return a // b

try:
    print(나누기(6, 0))
except ValueError as e:
    print("오류:", e)`,
    choices: ['오류: 0은 안 돼요', '오류: ValueError', 'ZeroDivisionError', '0'], answer: '오류: 0은 안 돼요',
    why: 'raise 로 직접 만든 예외도 똑같이 except 로 잡힙니다. e 를 출력하면 괄호 안에 넣은 메시지가 나옵니다.',
  },
  {
    q: '출력은 무엇일까요?', type: 'output',
    code: `try:
    int("abc")
except Exception:
    print("가")
except ValueError:
    print("나")`,
    choices: ['가', '나', '가 나', '아무것도 안 나옴'], answer: '가',
    why: 'except Exception 이 맨 위에 있으니 ValueError 도 거기서 먼저 잡힙니다. 아래 except ValueError 는 영영 실행되지 않아요 — 넓은 것은 아래에!',
  },
  {
    q: '다음 중 실행해도 예외가 나지 않는 것은? (하지만 틀린 결과일 수 있는 것)', type: 'pick',
    choices: ['int("천원")', '[1, 2, 3][-1]', '{"a": 1}["b"]', '5 // 0'], answer: '[1, 2, 3][-1]',
    why: '-1 은 「뒤에서 첫째」 라서 3 이 나옵니다. 예외가 없다고 언제나 안전한 것은 아니에요 — 0번 상품의 비밀!',
  },
];

// 좋은 방어막 · 아쉬운 방어막
export const GOOD_BAD = [
  {
    bad: 'try:\n    (코드 전체)\nexcept:\n    pass',
    badWhy: '모든 예외를 잡고 아무 말도 안 합니다. 손님도 개발자도 무엇이 잘못됐는지 모릅니다.',
    good: 'try:\n    돈 = int(글)\nexcept ValueError:\n    print("숫자만 넣어주세요 😊")',
    goodWhy: '날 수 있는 예외의 종류를 적고, 무엇을 고치면 되는지 알려 줍니다.',
  },
  {
    bad: 'try:\n    돈 = int(글)\nexcept ValueError:\n    print("숫자만!")\nprint(돈 * 2)',
    badWhy: '잡은 뒤에도 프로그램은 계속 갑니다. 돈 에는 값이 없으니 NameError — 방어막의 함정!',
    good: 'try:\n    돈 = int(글)\nexcept ValueError:\n    print("숫자만!")\nelse:\n    print(돈 * 2)',
    goodWhy: '성공했을 때만 할 일은 else 에 둡니다.',
  },
  {
    bad: 'if 번호 > 0:\n    …   # 0 이하도 int( ) 는 받아 준다',
    badWhy: '파이썬이 예외를 내지 않는 「말이 안 되는 값」 은 그냥 통과합니다.',
    good: 'if 번호 < 1 or 번호 > 6:\n    raise IndexError("1~6번만 있어요")',
    goodWhy: '규칙을 세우고 raise 로 직접 예외를 일으키면, 다른 고장과 똑같이 except 로 다룰 수 있습니다.',
  },
];
