/*! 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
 *  아주 작은 시험 도구. 바깥 라이브러리를 쓰지 않는다.
 */
export const 결과 = { 통과: 0, 실패: [] };
let 지금묶음 = '';

export function 묶음(이름) {
  지금묶음 = 이름;
}

export function 확인(설명, 실제, 기대) {
  const 같다 = JSON.stringify(실제) === JSON.stringify(기대);
  if (같다) 결과.통과++;
  else 결과.실패.push(`[${지금묶음}] ${설명}\n      기대: ${JSON.stringify(기대)}\n      실제: ${JSON.stringify(실제)}`);
}

export function 참(설명, 값) {
  확인(설명, !!값, true);
}

export function 가깝다(설명, 실제, 기대, 허용) {
  if (Math.abs(실제 - 기대) <= 허용) 결과.통과++;
  else 결과.실패.push(`[${지금묶음}] ${설명}\n      기대: ${기대} ± ${허용}\n      실제: ${실제}`);
}
