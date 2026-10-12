# 부숴봐! 자판기 — © 2026 티쳐무 · 모든 권리 보유
# 진짜 파이썬(CPython)으로 test/golden-cases.mjs 의 조각들을 돌려 test/golden.json 을 만든다.
# 우리 해석기(pymini.js)가 진짜 파이썬과 글자 하나까지 같은지 견주는 기준이다.
#
#   python tools/golden.py
#
# ⚠ 윈도우 콘솔은 CP949 라 PYTHONUTF8=1 을 붙여 돌리는 편이 안전하다.
import io, json, subprocess, sys, traceback, contextlib, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

# 조각 목록은 자바스크립트 쪽에 있으니 node 로 꺼낸다 (한 곳에서만 관리)
dump = subprocess.run(
    ['node', '-e', "import('./test/golden-cases.mjs').then(m => process.stdout.write(JSON.stringify(m.cases())))"],
    cwd=ROOT, capture_output=True, text=True, encoding='utf-8', check=True)
cases = json.loads(dump.stdout)

out = []
for c in cases:
    feed = iter(c.get('inputs') or [])
    buf = io.StringIO()
    def fake_input(prompt=''):
        return next(feed)          # 판정과 같게: 질문 문구는 찍지 않는다
    env = {'input': fake_input, '__name__': '__main__'}
    err = None
    try:
        with contextlib.redirect_stdout(buf):
            exec(compile(c['code'], 'main.py', 'exec'), env)
    except Exception as e:  # noqa: BLE001 — 잡히지 않은 예외를 그대로 기록한다
        tb = traceback.extract_tb(e.__traceback__)
        line = [f.lineno for f in tb if f.filename == 'main.py'][-1]
        err = {'type': type(e).__name__, 'msg': str(e), 'line': line}
    out.append({'name': c['name'], 'output': buf.getvalue().rstrip('\n'), 'error': err})

(ROOT / 'test' / 'golden.json').write_text(json.dumps({
    'python': sys.version.split()[0],
    'cases': out,
}, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'{len(out)}개 사례를 진짜 파이썬 {sys.version.split()[0]} 로 돌려 test/golden.json 에 담았습니다.')
