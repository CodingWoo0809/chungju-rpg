// 조작키 한 벌. 화면에는 상시 노출하지 않고, 우측 상단 '조작키 안내' 버튼으로만 펼친다.
// 여기 적힌 키는 전부 src/main.js 의 실제 바인딩과 src/interactions.js · src/physics.js 의
// 상호작용에서 그대로 옮겨 온 것이다. 새 키를 추가하면 이 표에도 같이 올린다.
export const CONTROL_GROUPS = [
  {
    title: '이동',
    keys: [
      ['W A S D', '화면 방향으로 걷기'],
      ['Shift', '누른 채 이동하면 더욱 빠르게 질주'],
      ['Space', '바라보는 방향으로 회피 · 잠깐 무적'],
    ],
  },
  {
    title: '전투',
    keys: [
      ['좌클릭', '마우스 방향으로 공격'],
      ['Q', '공명 타격 · 전투 숙련 5'],
      ['E', '숨 고르기 · 체력 +20 · 생활 숙련 10'],
      ['R', '학과 최고 기술 · 학교 탐방 8곳'],
    ],
  },
  {
    title: '상호작용',
    keys: [
      ['우클릭', '가리킨 대상과 상호작용 · 바닥의 아이템 습득(가까이에서) · 대화와 시설은 멀리서도'],
      ['F', '가장 가까운 대상과 상호작용 (대화 · 건물 출입 · 줍기 · 시설 이용)'],
      ['공 가까이 걷기', '자동으로 공을 잡는다'],
      ['좌클릭 길게', '공을 든 채 슛 · 오래 누를수록 세게'],
      ['우클릭 (공을 든 채)', '공 내려놓기'],
      ['운동장 이모티콘 클릭', '미니 축구 시작 · 종료'],
    ],
  },
  {
    title: '메뉴',
    keys: [
      ['I', '가방'],
      ['J', '나의 장비'],
      ['M', '교내 지도'],
      ['T', '학교 탐방 안내'],
      ['?  H', '조작키 안내'],
      ['Esc', '메뉴 열기 · 열린 창 닫기'],
    ],
  },
];

// 새 게임을 시작하면 한 번 보여 주는 가운데 조작 안내(Revision 81 · 학생 피드백).
// 키는 모두 main.js 의 실제 바인딩 그대로다. 우클릭은 가리킨 대상과 상호작용하는데, 바닥에 떨어진 아이템은
// 우선순위가 가장 높아(main.js PICK_BIAS drop 0) 가까이에서 가리키고 우클릭하면 줍는다(PICK_NEEDS_REACH).
//   [할 일, 키 목록, 보충 설명]
export const START_CONTROLS = [
  ['이동', ['W', 'A', 'S', 'D'], ''],
  ['달리기', ['Shift'], '누른 채 이동'],
  ['상호작용', ['F'], '대화 · 건물 출입 · 시설 이용'],
  ['일반 공격', ['마우스 좌클릭'], '마우스 방향으로'],
  ['공명 타격', ['Q'], '전투 숙련 5에 해금'],
  ['최고 기술', ['R'], '학교 탐방 8곳 완료 후'],
  ['회피', ['Space'], '바라보는 방향으로'],
  ['숨 고르기', ['E'], '체력 +20 · 생활 숙련 10에 해금'],
  ['바닥의 아이템 습득', ['마우스 우클릭'], '아이템 가까이에서 가리키고 클릭'],
];

// 메뉴 단축키 한 벌(Revision 83). main.js 키 입력과 오른쪽 위 퀵 메뉴의 키 표시가 모두 이 표를 읽는다 —
// 키를 바꾸려면 여기만 고치면 입력과 화면 표시가 함께 바뀐다. 값은 KeyboardEvent.key 를 소문자로 바꾼 값.
//   action(퀵 메뉴 버튼의 data-action) → 키 목록(첫 번째가 화면에 표시되는 키)
// 학교생활 일지(journal) · 성장과 기록(skills)은 단축키가 없다.
export const MENU_HOTKEYS = Object.freeze({
  gear: ['j'],
  inventory: ['i'],
  map: ['m'],
  'tour-journal': ['t'],
  help: ['h', '?'],
  menu: ['escape'],
});
export const hotkeyLabel = key => (key === 'escape' ? 'Esc' : key.toUpperCase());
// 창이 닫혀 있을 때 누른 키가 여는 메뉴(Esc 는 main.js 가 '닫기 / 메뉴'로 따로 처리한다).
export function hotkeyAction(key) {
  for (const [action, keys] of Object.entries(MENU_HOTKEYS)) if (action !== 'menu' && keys.includes(key)) return action;
  return null;
}
