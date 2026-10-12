/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  진짜 파이썬과 견줄 코드 조각들.
 *  `python tools/golden.py` 가 이 조각들을 진짜 파이썬(CPython)으로 돌려 test/golden.json 을 만들고,
 *  pymini.test.mjs 가 우리 해석기의 결과를 그것과 글자 하나까지 맞춘다.
 *  ⚠ 조각을 고치거나 더하면 golden.py 를 다시 돌릴 것.
 */
import { MACHINE_CODE } from '../src/data/machine.js';
import { MISSIONS, ATTACKS, NORMALS } from '../src/data/missions.js';
import { FLOW_CODE, FLOW_CASES, QUIZ } from '../src/data/quiz.js';

const SNIPPETS = [
  ['기본 try·except', `try:\n    x = int("천원")\nexcept ValueError:\n    print("잡았다")\nprint("끝")`],
  ['예외 없을 때 else', `try:\n    x = int("7")\nexcept ValueError:\n    print("A")\nelse:\n    print("B", x)\nfinally:\n    print("C")`],
  ['잡히지 않는 예외 + finally', `try:\n    print("시작")\n    x = int(None)\nexcept ValueError:\n    print("못 잡음")\nfinally:\n    print("마지막")\nprint("여기는 안 옴")`],
  ['as e 와 str(e)', `try:\n    {"a": 1}["b"]\nexcept KeyError as e:\n    print(e)\n    print(str(e))\n    print(repr(e))\n    print(e.args)\n    print(type(e).__name__)`],
  ['족보 LookupError', `for 값 in [5, "k"]:\n    try:\n        if 값 == 5:\n            [1, 2][값]\n        else:\n            {"a": 1}[값]\n    except LookupError as e:\n        print(type(e).__name__, e)`],
  ['ArithmeticError 가 ZeroDivision 잡기', `try:\n    1 // 0\nexcept ArithmeticError as e:\n    print("계산", e)\ntry:\n    1 / 0\nexcept Exception as e:\n    print("모두", e)\ntry:\n    1 % 0\nexcept ZeroDivisionError as e:\n    print(e)`],
  ['여러 개 괄호로', `for t in ["1", "a", "0"]:\n    try:\n        print(10 // int(t))\n    except (ValueError, ZeroDivisionError) as e:\n        print("막음:", type(e).__name__)`],
  ['처음 맞는 하나만', `try:\n    int("x")\nexcept Exception:\n    print("넓은 것")\nexcept ValueError:\n    print("좁은 것")`],
  ['raise 와 메시지', `def 검사(n):\n    if n < 1:\n        raise ValueError("1 이상이어야 해요")\n    return n\ntry:\n    검사(0)\nexcept ValueError as e:\n    print("오류:", e)`],
  ['raise 클래스만', `try:\n    raise IndexError\nexcept IndexError as e:\n    print("[" + str(e) + "]", e.args)`],
  ['나만의 예외', `class 품절(Exception):\n    pass\nclass 큰품절(품절):\n    pass\ntry:\n    raise 큰품절("콜라 없음")\nexcept 품절 as e:\n    print(type(e).__name__, e, isinstance(e, Exception), isinstance(e, 품절))`],
  ['except 안에서 다시 raise', `try:\n    try:\n        int("x")\n    except ValueError:\n        print("안쪽")\n        raise\nexcept ValueError as e:\n    print("바깥", e)`],
  ['finally 는 return 보다 늦게', `def f():\n    try:\n        return "try"\n    finally:\n        print("finally 먼저")\nprint(f())`],
  ['함수 안 예외의 줄', `def 나누기(a, b):\n    return a // b\nprint(나누기(6, 3))\nprint(나누기(1, 0))`],
  ['잡지 않은 KeyError', `쿠폰 = {"HAPPY": 200}\nprint(쿠폰["happy"])`],
  ['TypeError 문구 int - str', `x = 1000 - "공짜"`],
  ['TypeError 문구 str + int', `x = "값" + 3`],
  ['TypeError 비교', `print(3 < "a")`],
  ['IndexError 문자열', `print("abc"[5])`],
  ['NameError', `print(돈)`],
  ['예외 이름 오타는 예외가 날 때 터진다', `try:\n    print("괜찮음")\nexcept valueError:\n    print("x")\ntry:\n    int("x")\nexcept valueError:\n    print("y")`],
  ['큰 수', `돈 = int("99999999999999999999")\nprint(돈 - 1200, 돈 // 7, 돈 % 7, -돈 // 7)\nprint(2 ** 70, 10 ** 20 + 1)`],
  ['큰 정수 글자', `돈 = 99999999999999999999
print(돈 - 1200, 돈 * 3)`],
  ['except 아래 pass 만', `try:
    x = 1
except ValueError:
    pass
print("ok")`],
  ['int 변환 여러 꼴', `for t in [" 12 ", "1_000", "-5", "+7", "１２"]:\n    print(int(t))\nfor t in ["1.5", "", "2,000", "1e3", "12a"]:\n    try:\n        int(t)\n    except ValueError as e:\n        print(e)`],
  ['float 변환', `print(float("1.5"), float(" 2 "), float("1e3"), float("inf"))\ntry:\n    float("abc")\nexcept ValueError as e:\n    print(e)`],
  ['음수 인덱스는 예외가 아니다', `상품 = ["콜라", "사이다", "생수"]\nprint(상품[-1], 상품[0 - 1])\nprint(1200 // -2)`],
  ['try 안 변수가 없을 때 NameError', `try:\n    돈 = int("천원")\nexcept ValueError:\n    print("숫자만")\nprint(돈 * 2)`],
  ['except 뒤 예외 객체 사라짐', `try:\n    int("x")\nexcept ValueError as e:\n    pass\nprint(e)`],
];

/** 우리가 견줄 모든 사례 — {name, code, inputs?} */
export function cases() {
  const out = SNIPPETS.map(([name, code]) => ({ name, code }));
  // 자판기 — 1라운드 코드와 모범 답안을 모든 공격·정상 손님으로
  const order = ['money', 'num', 'coupon', 'people'];
  const inputsOf = (v) => order.map((k) => v[k]);
  for (const a of [...ATTACKS, ...NORMALS]) out.push({ name: `1라운드 자판기 · ${a.label}`, code: MACHINE_CODE, inputs: inputsOf(a.values) });
  for (const m of MISSIONS) {
    for (const a of [...ATTACKS, ...NORMALS]) out.push({ name: `${m.id} 답 · ${a.label}`, code: m.answer, inputs: inputsOf(a.values) });
  }
  for (const c of FLOW_CASES) out.push({ name: `흐름 · ${c.label}`, code: FLOW_CODE(c.value) });
  QUIZ.forEach((q, i) => { if (q.code) out.push({ name: `확인 문제 ${i + 1}`, code: q.code }); });
  return out;
}
