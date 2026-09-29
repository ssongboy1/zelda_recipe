#!/usr/bin/env python3
"""게임 데이터(데이터마이닝 결과)를 js/data.js 로 변환한다.

사용법:
    python3 tools/import_data.py --botw <savage13/cooking 경로> --totk <Echocolat/TOTK-Cooking-Calculator 경로>

출처:
- 야생의 숨결: https://github.com/savage13/cooking (BSD 2-Clause)
  cook_items.json · cook_recipes.json · cook_effects.json · names.json
- 왕국의 눈물: https://github.com/Echocolat/TOTK-Cooking-Calculator
  Data/MaterialData.json · RecipeData.json · SingleRecipeData.json · EffectData.json · SystemData.json · LanguageData.json

한국어 명칭은 왕국의 눈물 게임 텍스트(LanguageData의 KRko)를 쓰고,
야생의 숨결에만 있는 재료·요리는 아래 BOTW_ONLY_KO (나무위키 한글판 명칭)로 채운다.
"""
import argparse
import json
import os
import re

# 야생의 숨결 효과 이름 → 왕국의 눈물 효과 이름 (한 표로 합쳐 쓰기 위해)
BOTW_EFFECT_ALIAS = {
    'MovingSpeed': 'AllSpeed',
    'Quietness': 'QuietnessUp',
    'Fireproof': 'ResistBurn',
    'GutsRecover': 'StaminaRecover',
    'ExGutsMaxUp': 'ExStaminaMaxUp',
}

# 왕국의 눈물 게임 텍스트에 없는(야숨 전용) 재료 · 요리의 한글판 이름 (나무위키 기준)
BOTW_ONLY_KO = {
    'Hearty Blueshell Snail': '맥스소라',
    'Hearty Durian': '맥스두리안',
    'Icy Lizalfos Tail': '리잘포스의 푸른 꼬리',
    'Red Lizalfos Tail': '리잘포스의 붉은 꼬리',
    'Yellow Lizalfos Tail': '리잘포스의 노란 꼬리',
    'Lynel Horn': '라이넬의 뿔',
    'Ice Keese Wing': '아이스 키이스의 날개',
    'Fire Keese Wing': '파이어 키이스의 날개',
    'Electric Keese Wing': '일렉트로 키이스의 날개',
    'Ancient Screw': '고대의 나사',
    'Ancient Spring': '고대의 스프링',
    'Ancient Gear': '고대의 톱니',
    'Ancient Shaft': '고대의 샤프트',
    'Ancient Core': '고대의 코어',
    'Giant Ancient Core': '고대의 거대한 코어',
    'Wood': '장작 묶음',
    "Shard of Dinraal's Horn": '올드래곤의 뿔 조각',
    "Shard of Naydra's Horn": '넬드래곤의 뿔 조각',
    "Shard of Farosh's Horn": '필로드래곤의 뿔 조각',
    # 요리
    'Clam Chowder': '조개 차우더',
    'Sautéed Peppers': '따끈따끈볶음',
    'Milk': '핫밀크',
}

# 이미지 파일 이름이 게임 내 표기와 다른 경우
IMAGE_ALIAS = {'Milk': 'Warm Milk'}

EFFECT_ICON = {
    'LifeMaxUp': '💛', 'StaminaRecover': '🟢', 'ExStaminaMaxUp': '🟡',
    'AttackUp': '⚔️', 'DefenseUp': '🛡️', 'AllSpeed': '👟', 'QuietnessUp': '🌙',
    'ResistCold': '🔥', 'ResistHot': '❄️', 'ResistElectric': '⚡', 'ResistBurn': '🧯',
    'LightEmission': '💡', 'NotSlippy': '🦎', 'SwimSpeedUp': '🌊',
    'AttackUpHot': '🌋', 'AttackUpCold': '🧊', 'AttackUpThunderstorm': '🌩️',
    'MiasmaGuard': '🟣', 'LifeRepair': '☀️',
}

# 쿡 태그 → 화면에 보여줄 이름
TAG_KO = {
    'CookFruit': '과일류', 'CookMushroom': '버섯류', 'CookPlant': '채소·약초류',
    'CookMeat': '육류', 'CookFish': '어패류', 'CookSpice': '조미료',
    'CookInsect': '벌레류', 'CookEnemy': '몬스터 부위', 'CookOre': '광석',
    'CookOther': '요정', 'CookGolem': '조나우 부품', 'CookForeign': '기타 소재',
}

DRAGON_OR_STAR = re.compile(r"Dinraal|Naydra|Farosh|Light Dragon|Star Fragment")


def ui_category(en, actor, tag):
    if tag == 'CookFruit' and actor in ('Item_Fruit_K', 'Item_Fruit_L'):
        return 'nut'
    if DRAGON_OR_STAR.search(en):
        return 'special'
    return {
        'CookFruit': 'fruit', 'CookMushroom': 'mushroom', 'CookPlant': 'veg', 'CookMeat': 'meat',
        'CookFish': 'fish', 'CookSpice': 'other', 'CookInsect': 'critter', 'CookEnemy': 'monster',
        'CookOre': 'mineral', 'CookOther': 'special',
    }.get(tag, 'other')


def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def compact(d):
    # 'base' 는 0초도 의미가 있으므로 남긴다
    def empty(k, v):
        if k == 'base':
            return v is None
        return v is None or v is False or v == '' or v == [] or v == 0
    return {k: v for k, v in d.items() if not empty(k, v)}


def build_totk(root):
    D = os.path.join(root, 'Data')
    lang = load(os.path.join(D, 'LanguageData.json'))
    name = lambda sec, key, lc: (lang[sec].get(key + '_Name') or {}).get(lc) or ''

    materials = []
    for m in load(os.path.join(D, 'MaterialData.json')):
        tag = m['CookTag']
        if tag in ('CookGolem', 'CookForeign'):
            continue  # 조나우 부품 등: 요리 재료로 쓰지 않는다
        a = m['ActorName']
        en = name('Material', a, 'USen')
        materials.append(compact({
            'id': a, 'en': en, 'ko': name('Material', a, 'KRko'),
            'cat': ui_category(en, a, tag), 'tag': tag,
            'hp': m.get('HitPointRecover', 0),
            'eff': m.get('CureEffectType'), 'pot': m.get('CureEffectLevel', 0),
            'sHp': m.get('SpiceBoostHitPointRecover', 0),
            'sTime': m.get('SpiceBoostEffectiveTime', 0),
            'crit': m.get('SpiceBoostSuccessRate', 0),
            'sort': m.get('PouchSortKey', 9999),
        }))
    materials.sort(key=lambda m: m.pop('sort'))

    def recipe_row(r, single):
        a = r['ResultActorName']
        en = name('Meal', a, 'USen')
        kind = 'fail' if r.get('CookFailure') else 'elixir' if r.get('CookEMedicine') else None
        if a == 'Item_Cook_O_02':
            kind = 'rockhard'
        elif a == 'Item_Cook_O_01':
            kind = 'dubious'
        elif a == 'Item_Cook_C_16':
            kind = 'fairy'
        # 단일 레시피: "A or B" (재료 한 종류만 넣었을 때), 일반 레시피: "A or B + C + ..."
        if single:
            parts = [r['Recipe'].split(' or ')]
        else:
            parts = [p.split(' or ') for p in r['Recipe'].split(' + ')]
        return compact({
            'en': en, 'ko': name('Meal', a, 'KRko'), 'img': IMAGE_ALIAS.get(en, en),
            'parts': parts, 'single': single, 'kind': kind,
            'bonusHp': r.get('BonusHeart', 0), 'bonusTime': r.get('BonusTime', 0),
            'book': r.get('PictureBookNum', 0),
        })

    recipes = [recipe_row(r, False) for r in load(os.path.join(D, 'RecipeData.json'))]
    singles = [recipe_row(r, True) for r in load(os.path.join(D, 'SingleRecipeData.json'))]

    effects = {}
    for e in load(os.path.join(D, 'EffectData.json')):
        t = e['EffectType']
        if t in ('LifeRecover', 'TwiceJump', 'EmergencyAvoid'):
            continue
        effects[t] = compact({
            'prefix': name('Effect', t, 'KRko'), 'en': name('Effect', t, 'USen'),
            'ko': (lang['Buff'].get(t) or {}).get('KRko', ''),
            'icon': EFFECT_ICON.get(t, '✨'),
            'rate': e['Rate'], 'baseTime': e.get('BaseTime', 0), 'min': e['MinLv'], 'max': e['MaxLv'],
        })

    sysd = load(os.path.join(D, 'SystemData.json'))
    meal_ko = {name('Meal', k.replace('_Name', ''), 'USen'): v.get('KRko')
               for k, v in lang['Meal'].items() if k.endswith('_Name')}
    return {
        'materials': materials, 'recipes': recipes, 'singles': singles,
        'critByTypes': [x['Rate'] for x in sysd['SuperSuccessRateList']],
        'elixir': {'ko': name('Meal', 'Item_Cook_C_17', 'KRko'), 'en': name('Meal', 'Item_Cook_C_17', 'USen')},
    }, effects, meal_ko, {**{m['en']: m['ko'] for m in materials}, **{m['id']: m['ko'] for m in materials}}


def build_botw(root, totk_ko_by_actor, totk_meal_ko):
    items = load(os.path.join(root, 'cook_items.json'))
    names = load(os.path.join(root, 'names.json'))
    src = open(os.path.join(root, 'index.js'), encoding='utf-8').read()
    block = src[src.index('export function botw_sort'):src.index('const ai = tags')].split('[', 1)[1]
    order = [a or b for a, b in re.findall(r'"([^"]+)"|\'([^\']+)\'', block)]

    by_name = {}
    for actor, v in items.items():
        by_name.setdefault(names.get(actor), []).append(actor)

    def pick(nm):
        cands = by_name[nm]
        # 레시피 표는 인벤토리 쪽 이름(…Get…, Item_…)을 쓴다
        cands.sort(key=lambda a: ('Get' not in a, not a.startswith('Item_'), 'Put' in a, a))
        return cands[0]

    materials, missing = [], []
    for nm in order:
        a = pick(nm)
        v = items[a]
        tag = v['tags'][0] if v['tags'] else 'CookOther'
        eff = v['effect'] or None
        eff = BOTW_EFFECT_ALIAS.get(eff, eff) if eff and eff != 'None' else None
        ko = totk_ko_by_actor.get(a) or totk_ko_by_actor.get(nm) or BOTW_ONLY_KO.get(nm)
        if not ko:
            missing.append(nm)
        materials.append(compact({
            'id': a, 'en': nm, 'ko': ko or nm, 'cat': ui_category(nm, a, tag), 'tag': tag,
            'hp': v['hp'], 'eff': eff, 'pot': v['potency'] if eff else 0,
            'sHp': v['hp_boost'], 'sTime': v['time_boost'], 'crit': v['boost_success_rate'],
            # 재료 하나당 기본 시간(초). 대부분 30초이고 몬스터엑기스 등은 0초
            'base': None if v['time'] == 900 else v['time'] // 30,
        }))

    recipes, singles = [], []
    for i, r in enumerate(load(os.path.join(root, 'cook_recipes.json'))):
        en = r['name']
        ko = totk_meal_ko.get(en) or BOTW_ONLY_KO.get(en)
        if not ko:
            missing.append(en)
        single = r['num'] == 1
        if single:
            parts = [r['actors'] + r['tags']]
        else:
            parts = [p if isinstance(p, list) else [p] for p in r['actors']] + \
                    [p if isinstance(p, list) else [p] for p in r['tags']]
        kind = {'Fairy Tonic': 'fairy', 'Rock-Hard Food': 'rockhard', 'Dubious Food': 'dubious',
                'Elixir': 'elixir'}.get(en)
        row = compact({'en': en, 'ko': ko or en, 'img': IMAGE_ALIAS.get(en, en), 'parts': parts,
                       'single': single, 'kind': kind, 'bonusHp': r['hb']})
        (singles if single else recipes).append(row)

    effects = {}
    for e in load(os.path.join(root, 'cook_effects.json')):
        t = BOTW_EFFECT_ALIAS.get(e['type'], e['type'])
        if t == 'LifeRecover':
            continue
        effects[t] = {'rate': e['material_rate'], 'baseTime': e['base_time'], 'min': e['min'], 'max': e['max']}

    if missing:
        raise SystemExit(f'한국어 이름이 없는 항목: {sorted(set(missing))}')
    return {
        'materials': materials, 'recipes': recipes, 'singles': singles,
        'critByTypes': [5, 10, 15, 20, 25],
        'elixir': {'ko': '물약', 'en': 'Elixir'},
        'effectOverrides': effects,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--botw', required=True)
    ap.add_argument('--totk', required=True)
    ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', 'js', 'data.js'))
    args = ap.parse_args()

    totk, effects, meal_ko, ko_by_actor = build_totk(args.totk)
    botw = build_botw(args.botw, ko_by_actor, meal_ko)

    # 효과 배율표는 왕눈 것을 두 게임 공통으로 쓴다. 야숨 cook_effects.json 은 GutsRecover 와
    # ExGutsMaxUp 의 값이 서로 뒤바뀐 채 기록되어 있고(savage13 구현도 실제 계산에는 쓰지 않음),
    # 나머지 효과는 두 게임 값이 같다.
    for t, v in botw.pop('effectOverrides').items():
        if t in ('StaminaRecover', 'ExStaminaMaxUp'):
            continue
        tv = effects[t]
        diff = [k for k in v if abs(v[k] - tv.get(k, 0)) > 1e-6]
        if diff:
            raise SystemExit(f'야숨과 왕눈의 효과 수치가 다름: {t} {diff}')

    data = {'EFFECTS': effects, 'TAG_KO': TAG_KO, 'GAMES': {'botw': botw, 'totk': totk}}
    body = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    body = body.replace('},{', '},\n{')  # 사람이 diff 를 읽을 수 있을 정도로만 줄바꿈
    with open(args.out, 'w', encoding='utf-8') as f:
        f.write('// 이 파일은 tools/import_data.py 가 생성한다. 직접 고치지 말 것.\n')
        f.write('// 출처: savage13/cooking (야생의 숨결, BSD 2-Clause), Echocolat/TOTK-Cooking-Calculator (왕국의 눈물)\n')
        f.write('(function (root) {\n  const ZDATA = ')
        f.write(body)
        f.write(';\n  root.ZDATA = ZDATA;\n  if (typeof module !== "undefined") module.exports = ZDATA;\n')
        f.write('})(typeof window !== "undefined" ? window : globalThis);\n')
    print(f"wrote {args.out}: botw {len(botw['materials'])} materials / {len(botw['recipes']) + len(botw['singles'])} recipes, "
          f"totk {len(totk['materials'])} materials / {len(totk['recipes']) + len(totk['singles'])} recipes")


if __name__ == '__main__':
    main()
