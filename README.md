# 하이랄 요리 시뮬레이터

젤다의 전설 **야생의 숨결(BotW)** / **왕국의 눈물(TotK)** 에서 재료를 골라 냄비에 넣으면
어떤 요리가 나오는지 미리 확인하는 웹앱입니다.

## 사용법

빌드가 필요 없는 정적 페이지입니다. `index.html`을 브라우저로 열면 바로 동작합니다.

휴대폰처럼 폴더 안의 다른 파일을 읽지 못하는 환경에서는 모든 코드가 한 파일에 들어 있는
`zelda_recipe.html`을 여세요. 코드를 고친 뒤에는 `node tools/build-single.js`로 다시 만들면 됩니다.
(GitHub Pages로 배포하면 링크로 공유할 수도 있어요: Settings → Pages → Branch 선택)

- 상단에서 게임(야숨/왕눈)을 고릅니다. 게임마다 나오는 재료와 레시피가 다릅니다.
- 재료를 눌러 냄비에 최대 5개까지 넣으면 결과(요리 이름, 회복 하트, 효과·단계·지속시간)가 바로 나옵니다.
- **거꾸로 찾기** 탭에서 원하는 효과(예: 파워 Lv3)를 고르면 추천 조합을, 가진 재료를 체크하면 만들 수 있는 요리와 효과별 최고 조합을 보여줍니다.
- **레시피 도감** 탭에서 모든 요리와 필요한 재료를 보고, "담기"로 예시 조합을 냄비에 넣을 수 있습니다.
- "링크 복사"로 현재 조합을 공유할 수 있습니다 (`#totk/apple,apple` 형태의 주소).

## 정확도와 데이터 출처

계산은 게임의 요리 로직을 분석한 공개 구현을 따릅니다.

- 야생의 숨결: [savage13/cooking](https://github.com/savage13/cooking) (BSD 2-Clause)
- 왕국의 눈물: [Echocolat/TOTK-Cooking-Calculator](https://github.com/Echocolat/TOTK-Cooking-Calculator)

재료별 회복량 · 효과 포인트 · 추가 시간, 레시피 판정 순서(야숨 138줄, 왕눈 175줄), 효과 배율,
대성공 확률을 게임 데이터 그대로 씁니다. 한국어 재료·요리·효과 이름은 왕국의 눈물 게임 텍스트(한글판)를 쓰고,
야숨에만 있는 것은 나무위키의 한글판 명칭으로 채웠습니다.

확인한 내용:

- 야생의 숨결에서 실제로 요리해 기록한 결과 615건과 모두 일치 (`node test/botw_ingame.test.js`)
- 무작위 조합 2만 건씩 두 참조 구현과 비교해 차이 없음 (몬스터엑기스처럼 결과가 무작위인 경우 제외)
- 나무위키 예시 26건 일치 (`node test/cook.test.js`)

대성공 보너스와 몬스터엑기스의 무작위 효과는 결과에 넣지 않고 확률과 안내만 보여줍니다.

### 데이터 다시 만들기

```
git clone https://github.com/savage13/cooking ../savage13-cooking
git clone https://github.com/Echocolat/TOTK-Cooking-Calculator ../totk-cooking
python3 tools/import_data.py --botw ../savage13-cooking --totk ../totk-cooking   # js/data.js 생성
node tools/verify.mjs ../savage13-cooking ../totk-cooking 20000                  # 참조 구현과 비교
node tools/build-single.js                                                       # zelda_recipe.html 생성
```

## 이미지

재료와 요리 아이콘은 Zelda Wiki(zeldawiki.wiki), Zelda Dungeon Wiki, Zelda Fandom의
게임 아이콘 파일을 순서대로 불러옵니다. 모두 불러오지 못하면 이모지로 대신 표시합니다.
게임 이미지와 명칭의 저작권은 Nintendo에 있으며, 이 프로젝트는 비공식 팬 제작 도구입니다.

## 구조

```
index.html        화면
css/style.css     스타일 (라이트/다크 모드)
js/data.js        재료 · 효과 · 레시피 데이터 (tools/import_data.py 가 생성)
js/cook.js        요리 계산 엔진
js/finder.js      거꾸로 찾기 (조합 탐색)
js/app.js         UI
test/             테스트 (야숨 실제 결과 615건, 나무위키 예시)
tools/            데이터 변환 · 참조 구현 비교 · 단일 파일 빌드
```

