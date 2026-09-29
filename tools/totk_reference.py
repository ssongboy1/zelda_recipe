#!/usr/bin/env python3
"""Echocolat/TOTK-Cooking-Calculator 의 계산 결과를 JSON 으로 출력한다 (검증용).
표준 입력: [[영어 재료명, ...], ...]  /  표준 출력: 결과 목록
사용법: python3 tools/totk_reference.py <TOTK-Cooking-Calculator 경로> < combos.json
"""
import contextlib
import io
import json
import os
import sys

root = sys.argv[1]
os.chdir(root)
sys.path.insert(0, root)
from totk_cook_logic import TotKCookSim  # noqa: E402

sim = TotKCookSim()
lang = sim._locale_dict
FLAGS = [k for k in vars(sim) if k.startswith('_monster_extract') or k.startswith('_critical')]
out = []
for combo in json.load(sys.stdin):
    for k in FLAGS:
        setattr(sim, k, False)
    with contextlib.redirect_stdout(io.StringIO()):  # 참조 구현의 디버그 출력 무시
        sim.cook(combo)
    t = sim._tmp
    actor = t['Recipe']['ResultActorName']
    out.append({
        'meal': (lang['Meal'].get(actor + '_Name') or {}).get('USen', actor),
        'effect': t.get('Effect'),
        'level': t.get('EffectLevel'),
        'time': t.get('EffectTime'),
        'hp': t.get('HitPointRecover'),
        'crit': t.get('SuperSuccessRate'),
    })
json.dump(out, sys.stdout)
