import { CONFIG, COMBAT } from './config.js';
import { gearStatMultiplier } from './dept-resonance.js';
import { COIN_ID, clampLevel, maxLevel, nextStep, rollEnhancement, weaponPowerMultiplier, weaponSpeedMultiplier,
  defenseMultiplier, helmetPassiveMultiplier, HELMET_PASSIVES, SPEED_RARITIES } from './enhancement.js';

export const ITEMS = {
  draftMantle:{name:'청사진 수호 망토',type:'gear',slot:'armor',defense:4,color:'#4c9faf',description:'설계선이 빛나는 건축디자인과 망토. 받는 피해 -4.',rarity:'전공'},
  servoVest:{name:'서보 기동 조끼',type:'gear',slot:'armor',defense:4,color:'#bc7950',description:'관절 보호판과 동력 코어가 있는 자동화기계과 조끼. 받는 피해 -4.',rarity:'전공'},
  arcJacket:{name:'아크 절연 재킷',type:'gear',slot:'armor',defense:4,color:'#557eae',description:'빛의 회로가 흐르는 전기전자과 재킷. 받는 피해 -4.',rarity:'전공'},
  strataCoat:{name:'지층 수호 작업복',type:'gear',slot:'armor',defense:4,color:'#87834f',description:'단단한 지층 문양의 토목시스템과 작업복. 받는 피해 -4.',rarity:'전공'},
  snack: { name: '든든한 간식', type: 'consumable', description: 'HP를 35 회복한다.', heal: 35, rarity: '보통' },
  lunchMilk: { name: '급식 우유', type: 'consumable', description: 'HP를 20 회복한다.', heal: 20, rarity: '보통' },
  // 충공 코인(2026-09-27): 장비 강화에만 쓰는 소모품. 쌓이고, 장착 · 사용할 수 없으며 상점에서 팔지 않는다.
  // 상점 포인트와는 다른 아이템이다(서로 합쳐지지 않는다). 옛 강화 재료 3종은 저장 파일 버전 5에서 이 코인으로 바뀌었다.
  chungCoin: { name: '충공 코인', type: 'consumable', description: '충주공고 교표가 새겨진 코인. J 나의 장비에서 착용한 장비를 강화할 때 쓴다. 상점 포인트와는 따로 모인다.', rarity: '보통' },
  shopPoint: { name: '상점 포인트', type: 'consumable', description: '교문 앞 수위실 상점에서 장비를 살 때 쓴다. 소동을 하나 정리할 때마다 1점씩 모인다.', rarity: '보통' },
};

// ── 장비 3칸 ────────────────────────────────────────────
// 무기 · 옷 · 투구. 각 칸이 보통 → 희귀 → 영웅 → 레전드로 이어지고,
// 레전드만 학과별로 갈린다. 가격은 상점 포인트(몬스터 1마리 = 1점) 기준이다.
// (2026-09-26 · 장갑·신발 칸 폐지. 옛 저장 파일의 장갑·신발은 save-migration.js 가 정리·환급한다.)
export const SLOTS = [
  { id: 'equipment', slot: 'weapon', label: '무기' },
  { id: 'armor',     slot: 'armor',  label: '옷' },
  { id: 'helmet',    slot: 'helmet', label: '투구' },
];
export const SLOT_LABEL = Object.fromEntries(SLOTS.map(s => [s.slot, s.label]));
// 장비가 들어가는 state 의 필드 이름을 slot 으로 찾는다.
export const SLOT_FIELD = Object.fromEntries(SLOTS.map(s => [s.slot, s.id]));
export const RARITY_ORDER = ['보통', '희귀', '영웅', '레전드'];
// 등급 하나당 값 하나. 장비별로 가격이 제각각이 아니라 등급만 보면 값을 알 수 있다.
// (영웅은 희귀와 레전드 사이를 고르게 메운다.)
// 상점 가격(2026-09-28 밸런스): 레전드 50점을 기준으로, 등급별 능력치가 레전드의 몇 할인지(무기 공격력 7·11·16·23,
// 투구 방어 1·3·5·7, 옷 방어 2·4·(4)·9 의 평균 ≈ 0.2 · 0.4 · 0.7)에 맞춰 나눴다. 판매가는 그대로 구매가의 60%(내림).
export const PRICE = { 보통: 10, 희귀: 20, 영웅: 35, 레전드: 50 };

const DEPT_NAME = { architecture: '건축디자인과', machine: '자동화기계과', electric: '전기전자과', civil: '토목시스템과' };
const DEPT_COLOR = { architecture: '#b59172', machine: '#c8b86b', electric: '#7fb0c2', civil: '#8fc0b6' };

// [슬롯] → [등급별 정의]. legend 는 학과 4종으로 펼쳐진다.
const LADDER = {
  armor: {
    stat: 'defense',
    tiers: [
      // 옷은 보통 · 희귀 공용 1종씩 + 학과별 영웅(맨 위 ITEMS 4종, 탐방 보상) + 학과별 레전드 = 10종.
      // 공용 영웅 '현장 조끼'는 2026-09-27 에 없앴다 — 옛 저장 파일은 save-migration.js 가 학과 영웅 옷으로 바꾼다.
      ['보통', 'gymShirt', '생활복 세트', 2, '학교에서 편하게 입는 남색 카라티와 반바지. 받는 피해 -2.'],
      ['희귀', 'workJacket', '야구점퍼 세트', 4, 'C 로고와 1979 자수가 들어간 학교 야구점퍼와 남색 슬랙스. 받는 피해 -4.'],
    ],
    legend: { suffix: '전공 방호복', defense: 9, description: '%s의 장비를 그대로 몸에 두른 듯하다. 받는 피해 -9.' },
  },
  helmet: {
    stat: 'defense',
    tiers: [
      // 투구는 보통 · 희귀 공용 1종씩 + 학과별 영웅(아래 HERO_HELMETS) + 학과별 레전드(아래 LEGEND_HELMETS) = 10종(2026-09-27).
      // 공용 영웅 '보안면 헬멧'은 없앴다 — 옛 저장 파일은 save-migration.js 가 학과 영웅 투구로 바꾼다.
      ['보통', 'capHat', '복싱 헤드기어', 1, '연습과 스파링 때 쓰는 남색 복싱 헤드기어. 얼굴은 열려 있고 이마와 옆머리를 감싼다. 받는 피해 -1.'],
      ['희귀', 'safetyHelmet', '흰색 안전모', 3, '실습 선생님들이 쓰는 흰색 안전모. 노란 안전모보다 한 단계 단단하다. 받는 피해 -3.'],
    ],
    legend: { suffix: '전공 보호모', defense: 7, description: '%s 실습의 모든 위험을 염두에 두고 만들어졌다. 받는 피해 -7.' },
  },
};

// ── 무기 10종 (2026-09-26 무기 리워크) ────────────────────
// 보통·희귀는 공용 1종씩, 영웅·레전드는 학과별 1종씩. 영웅과 레전드는 같은 계보다.
// 보통·희귀는 공격력만, 영웅·레전드는 공격력 + 공격속도(attackSpeed, 1 = 보정 없음)를 가진다.
// 공격속도 수치는 아직 정하지 않았으므로 모두 1이다. 값이 정해지면 여기만 바꾸면 쿨타임과 모션 길이가 함께 바뀐다.
// 레전드 id(`학과-weapon`)는 옛 '공명 주무기'와 같아 저장 파일 변환 없이 이어진다.
export const WEAPON_DEPT_COLOR = { architecture: '#c8323c', machine: '#9a6236', electric: '#3d7fe0', civil: '#e2b21c' };
const WEAPONS = {
  boxingGlove: { name: '복싱 글러브', rarity: '보통', power: 7, description: '체육관에서 쓰던 붉은 복싱 글러브. 공격력 +7.' },
  badmintonRacket: { name: '배드민턴 라켓', rarity: '희귀', power: 11, description: '날개 장식이 달린 배드민턴 라켓. 공격력 +11.' },
  'architecture-hero-weapon': { name: '청사진 제도검', rarity: '영웅', department: 'architecture', power: 16, attackSpeed: 1,
    description: '설계도의 선이 현실을 가르는 검. 정확한 한 획이 전장을 재단한다. 공격력 +16.' },
  'machine-hero-weapon': { name: '서보 기어 건틀릿', rarity: '영웅', department: 'machine', power: 16, attackSpeed: 1,
    description: '정밀한 기계 구동이 만들어낸 양손 파워 건틀릿. 멈추지 않는 기어가 타격을 증폭한다. 공격력 +16.' },
  'electric-hero-weapon': { name: '쌍극 아크창', rarity: '영웅', department: 'electric', power: 16, attackSpeed: 1,
    description: '두 개의 전극이 만들어내는 전류의 창. 흐르는 전기가 적을 관통한다. 공격력 +16 · Q 공명파 +35%.' },
  'civil-hero-weapon': { name: '지반 파쇄추', rarity: '영웅', department: 'civil', power: 16, attackSpeed: 1,
    description: '지면을 부수기 위해 설계된 중량 무기. 현장의 힘이 그대로 담겨 있다. 공격력 +16.' },
  'architecture-weapon': { name: '천공 설계검', rarity: '레전드', department: 'architecture', power: 23, attackSpeed: 1,
    description: '그려진 설계가 하늘까지 이어지는 검. 공간을 재구성하는 궁극의 설계도. 공격력 +23.' },
  'machine-weapon': { name: '오토매틱 드라이브 건틀릿', rarity: '레전드', department: 'machine', power: 23, attackSpeed: 1,
    description: '완전 자동 구동 시스템이 탑재된 최종형 양손 건틀릿. 압도적인 토크로 모든 것을 분쇄한다. 공격력 +23.' },
  'electric-weapon': { name: '뇌극 성광창', rarity: '레전드', department: 'electric', power: 23, attackSpeed: 1,
    description: '하늘의 전류를 다루는 궁극의 창. 번개가 모여 모든 것을 꿰뚫는다. 공격력 +23 · Q 공명파 +45%.' },
  'civil-weapon': { name: '대지붕괴 파쇄추', rarity: '레전드', department: 'civil', power: 23, attackSpeed: 1,
    description: '대지를 뒤흔드는 최종형 파쇄기. 모든 구조를 무너뜨리는 절대의 중장비. 공격력 +23.' },
};
for (const [id, weapon] of Object.entries(WEAPONS))
  ITEMS[id] = { type: 'gear', slot: 'weapon', shop: true, ...weapon,
    ...(weapon.department ? { color: WEAPON_DEPT_COLOR[weapon.department] } : {}) };

function addLadder(slot, spec) {
  for (const [rarity, id, name, value, description] of spec.tiers)
    ITEMS[id] = { name, type: 'gear', slot, rarity, description, [spec.stat]: value, shop: true };
  for (const [dept, deptName] of Object.entries(DEPT_NAME)) {
    const id = `${dept}-${slot}`;
    ITEMS[id] = {
      name: `${deptName.slice(0, 2)} ${spec.legend.suffix}`, type: 'gear', slot, rarity: '레전드',
      department: dept, color: DEPT_COLOR[dept], shop: true,
      description: spec.legend.description.replace('%s', deptName),
      ...Object.fromEntries(Object.entries(spec.legend).filter(([k]) => k !== 'suffix' && k !== 'description')),
    };
  }
}
for (const [slot, spec] of Object.entries(LADDER)) addLadder(slot, spec);

// 학과 영웅 옷은 상점에서 팔지 않는다(탐방 보상). 2026-09-28 부터는 몬스터도 떨어뜨리므로(drops) 다시 얻을 수 있고, 팔 수도 있다.
for (const id of ['draftMantle', 'servoVest', 'arcJacket', 'strataCoat']) Object.assign(ITEMS[id], { rarity: '영웅', drops: true });

// ── 투구 영웅 · 레전드(2026-09-27 · CHMR 헬멧 · 머리 장비 시안) ─────────────────
// 영웅은 학과별 작업 헬멧(상점 판매), 레전드는 얼굴이 보이는 학과별 두건 · 머리띠. 모습은 helmets.js.
const HERO_HELMETS = {
  architecture: ['보안면 헬멧', '투명 보안면이 달린 건축디자인과 붉은 헬멧. 얼굴은 보안면 너머로 그대로 보인다. 받는 피해 -5.'],
  machine: ['작업용 헬멧', '고글을 이마에 올려 쓴 자동화기계과 갈색 작업 헬멧. 받는 피해 -5.'],
  electric: ['절연 안전 헬멧', '파란 줄과 번개 표시가 들어간 전기전자과 흰색 절연 헬멧. 받는 피해 -5.'],
  civil: ['측량용 헬멧', '헤드램프와 반사띠를 단 토목시스템과 노란 측량 헬멧. 받는 피해 -5.'],
};
for (const [dept, [name, description]] of Object.entries(HERO_HELMETS))
  ITEMS[`${dept}-hero-helmet`] = { name, type: 'gear', slot: 'helmet', rarity: '영웅', department: dept,
    color: WEAPON_DEPT_COLOR[dept], defense: 5, shop: true, description };
const LEGEND_HELMETS = {
  architecture: ['디자인 스카프', '건축디자인과의 붉은 두건. 삼각자 표식이 들어간, 작업에 방해되지 않는 깔끔한 머리 장비. 받는 피해 -7.'],
  machine: ['정비 헤드밴드', '자동화기계과의 갈색 정비 헤드밴드. 톱니 표식이 새겨져 있다. 받는 피해 -7.'],
  electric: ['테크 헤드밴드', '전기전자과의 파란 헤드밴드. 번개 표식이 이마를 지킨다. 받는 피해 -7.'],
  civil: ['필드 스카프', '토목시스템과의 노란 두건. 야외 현장에 어울리는 실용적인 머리 장비. 받는 피해 -7.'],
};
for (const [dept, [name, description]] of Object.entries(LEGEND_HELMETS))
  Object.assign(ITEMS[`${dept}-helmet`], { name, description });

// 상점에서 파는 목록. 칸 순서 → 등급 순서로 정렬한다.
export function shopStock() {
  return Object.entries(ITEMS)
    .filter(([, item]) => item.shop)
    .map(([id, item]) => ({ id, ...item, price: basePrice(id) }))
    .sort((a, b) => SLOTS.findIndex(s => s.slot === a.slot) - SLOTS.findIndex(s => s.slot === b.slot)
      || RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)
      || a.name.localeCompare(b.name));
}

export function addItem(state, id, quantity = 1) {
  const item = ITEMS[id];
  if (!item || !Number.isInteger(quantity) || quantity <= 0) return false;
  const stack = item.type !== 'gear' && state.inventory.find(entry => entry.id === id);
  if (stack) { stack.quantity += quantity; return true; }
  const slots = item.type === 'gear' ? quantity : 1;
  if (state.inventory.length + slots > CONFIG.inventorySlots) return false;
  // 장비는 한 개씩 따로 들어가고, 저마다 고유 번호(uid)를 가진다 — 새로 얻은 장비는 늘 +0 이다(Revision 81).
  for (let i = 0; i < slots; i++) state.inventory.push(item.type === 'gear' ? { id, quantity: 1, uid: newGearUid(state) } : { id, quantity });
  return true;
}

export function equipItem(state, index) {
  const entry = state.inventory[index];
  const item = ITEMS[entry?.id];
  if (!item || item.type !== 'gear') return false;
  // 지원하지 않는 칸의 장비는 장착하지 않는다. 다른 칸(무기)으로 조용히 들어가지 않게 한다.
  const field = Object.hasOwn(SLOT_FIELD, item.slot) ? SLOT_FIELD[item.slot] : null;
  if (!field) return false;
  syncGear(state);
  // 같은 장비가 여러 개일 때도 '이 한 개'를 입고 벗는다(Revision 81): 지금 입은 그 개체를 누르면 벗고, 다른 개체를 누르면 그것으로 갈아입는다.
  if (wornEntry(state, item.slot) === entry) { state[field] = null; if (state.wornUid) delete state.wornUid[item.slot]; }
  else { state[field] = entry.id; (state.wornUid ??= {})[item.slot] = entry.uid; }
  return true;
}
// 지금 착용 중인 장비 목록. 옛 저장 파일처럼 칸이 비어 있어도 안전하다.
export function equipped(state) {
  return SLOTS.map(s => ({ ...s, id: state[s.id] || null, item: ITEMS[state[s.id]] || null }));
}
// 세 칸의 능력치 합계. 장비창 합계와 피격(방어력)이 이 결과를 본다. 강화 배율이 반영된 실제 값이다.
export function playerStats(state) {
  const total = { power: 0, defense: 0 };
  for (const { id, item } of equipped(state)) {
    if (!item) continue;
    const stats = equippedStats(state, id), resonance = gearStatMultiplier(state, id);   // 학과 공명 1단계(Revision 79): 내 학과 장비만 × 1.05
    total.power += (stats.power || 0) * resonance;
    total.defense += (stats.defense || 0) * resonance;
  }
  return total;
}

export function useItem(state, index) {
  const entry = state.inventory[index];
  const item = ITEMS[entry?.id];
  if (!item?.heal || state.player.hp >= state.player.maxHp) return false;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + item.heal);
  entry.quantity -= 1;
  if (entry.quantity === 0) state.inventory.splice(index, 1);
  return true;
}

export function gain(state, skill, amount) {
  if (!Object.hasOwn(state.proficiencies, skill) || !Number.isFinite(amount) || amount <= 0) return 0;
  const earned = amount * (state.department === skill ? 1.2 : 1);
  state.proficiencies[skill] = Math.round((state.proficiencies[skill] + earned) * 100) / 100;
  return earned;
}

// 무기별 전투 개성. motion 은 공격 모션군(punch 타격형 · swing 스윙형 · thrust 찌르기형) — 딱 세 가지만 쓴다.
// 영웅 4종은 같은 학과 계열이던 옛 보통·희귀 무기의 사거리·쿨타임·밀치기를 그대로 이어받았고,
// 레전드 4종은 옛 '공명 주무기' 값을 그대로 둔다. 복싱 글러브는 옛 서보 건틀릿, 배드민턴 라켓은 옛 뇌광 쌍극창(공명 보정 제외) 값이다.
export const MOTION_FAMILIES = ['punch', 'swing', 'thrust'];
export const WEAPON_STYLES = {
  boxingGlove: {range:8, cooldown:.24, knockback:1, motion:'punch', title:'빠른 연타'},
  badmintonRacket: {range:11, cooldown:.38, knockback:2, motion:'swing', title:'가벼운 휘두르기'},
  'architecture-hero-weapon': {range:15, cooldown:.4, knockback:2, motion:'swing', title:'긴 사거리'},
  'machine-hero-weapon': {range:8, cooldown:.24, knockback:1, motion:'punch', title:'빠른 연타'},
  'electric-hero-weapon': {range:11, cooldown:.38, knockback:2, resonance:1.35, motion:'thrust', title:'공명파 증폭'},
  'civil-hero-weapon': {range:10, cooldown:.65, knockback:6, motion:'swing', title:'강한 밀치기'},
  'architecture-weapon': {range:14, cooldown:.46, knockback:3, motion:'swing', title:'설계선 가르기'},
  'machine-weapon': {range:10, cooldown:.30, knockback:2, motion:'punch', title:'고속 연타'},
  'electric-weapon': {range:12, cooldown:.42, knockback:3, resonance:1.45, motion:'thrust', title:'공명 증폭'},
  'civil-weapon': {range:11, cooldown:.62, knockback:7, motion:'swing', title:'지층 붕괴'},
};
// 장착한 무기의 공격 모션군. 맨손은 기존처럼 펀치 시트를 쓴다.
export function weaponMotion(id) { return WEAPON_STYLES[id]?.motion || 'punch'; }

// ── 장비 개체와 강화 단계 (Revision 81 · 개별 강화) ─────────────────────────────
// 예전(Revision 67~80)에는 강화 단계를 state.flags['upgrade:아이템id'] 에 아이템 '종류' 단위로 저장해서, 같은 장비를 두 개 가지면
// 하나를 강화해도 둘 다 같은 단계로 보이고 · 계산됐다(버그). 이제 가방의 장비 한 칸 = 장비 개체 하나이고, 개체마다
//   { id: 아이템 종류, quantity: 1, uid: 'g12'(고유 번호), level: 강화 단계(없으면 0) }
// 를 가진다. 어느 개체를 입었는지는 state.wornUid = { weapon, armor, helmet } 에 적는다(state.equipment · armor · helmet 은 예전처럼
// 입은 장비의 '종류' — 그림 · 스킬 · 저장 검증은 그대로 이 값을 본다).
// syncGear 는 몇 번 불러도 같은 결과인 정리 함수다: uid 가 없는 장비에 번호를 붙이고, 입은 개체를 확정하고, 옛 flags['upgrade:id'] 가
// 남아 있으면 그 종류의 개체 '하나'(입고 있던 것 → 없으면 가방의 첫 번째)에만 옮긴 뒤 flag 를 지운다. 이미 개체에 단계가 있으면
// 개체 정보를 우선하고 옛 flag 는 버린다. 가진 개체가 없는 옛 flag 도 버린다(새로 얻는 장비는 늘 +0). 장비가 아닌 · 모르는 id 의 flag 는 그대로 둔다.
const GEAR_SLOT_FIELD = { weapon: 'equipment', armor: 'armor', helmet: 'helmet' };
function isGearEntry(entry) { return !!entry && ITEMS[entry.id]?.type === 'gear'; }
export function newGearUid(state) {
  const used = new Set((state.inventory || []).map(e => e.uid).filter(Boolean));
  let n = Number.isInteger(state.gearSeq) && state.gearSeq >= 0 ? state.gearSeq : 0, uid;
  do { n++; uid = `g${n}`; } while (used.has(uid));
  state.gearSeq = n;
  return uid;
}
export function syncGear(state) {
  if (!state || !Array.isArray(state.inventory)) return state;
  const seen = new Set();
  for (const entry of state.inventory) {
    if (!isGearEntry(entry)) continue;
    if (typeof entry.uid !== 'string' || !entry.uid || seen.has(entry.uid)) entry.uid = newGearUid(state);
    seen.add(entry.uid);
    if (entry.level !== undefined && !(Number.isInteger(entry.level) && entry.level > 0)) delete entry.level;
  }
  // 입은 개체 표시는 equipItem 이 적는다. 사라진 개체를 가리키는 표시만 지운다(없으면 그 종류의 첫 개체가 입은 것 — 옛 규칙과 같다).
  if (state.wornUid && typeof state.wornUid === 'object') for (const [slot, field] of Object.entries(GEAR_SLOT_FIELD)) {
    const uid = state.wornUid[slot];
    if (uid !== undefined && !state.inventory.some(e => e.uid === uid && e.id === state[field])) delete state.wornUid[slot];
  }
  if (state.flags) for (const key of Object.keys(state.flags)) {
    if (!key.startsWith('upgrade:')) continue;
    const id = key.slice(8), raw = state.flags[key], item = ITEMS[id];
    if (!item || item.type !== 'gear') continue;   // 모르는 id 의 옛 기록은 건드리지 않는다
    delete state.flags[key];
    const level = clampLevel(item.slot, raw);
    const copies = state.inventory.filter(e => e.id === id);
    if (!level || !copies.length || copies.some(e => e.level > 0)) continue;
    const worn = state[GEAR_SLOT_FIELD[item.slot]] === id ? copies.find(e => e.uid === state.wornUid?.[item.slot]) : null;
    (worn || copies[0]).level = level;
  }
  return state;
}
// 칸(weapon · armor · helmet)에 지금 입은 장비 개체(가방의 그 한 칸). 입은 것이 없으면 null.
export function wornEntry(state, slot) {
  syncGear(state);
  const id = state[GEAR_SLOT_FIELD[slot]];
  if (!id) return null;
  const copies = state.inventory.filter(e => e.id === id);
  return copies.find(e => e.uid === state.wornUid?.[slot]) || copies[0] || null;
}
// 강화 단계를 직접 정한다(관리자 · 테스트용). 입고 있으면 입은 개체, 아니면 가방의 첫 개체. 성공하면 true.
export function setItemLevel(state, id, level) {
  const item = ITEMS[id];
  if (!item || item.type !== 'gear') return false;
  syncGear(state);
  const target = (state[GEAR_SLOT_FIELD[item.slot]] === id ? wornEntry(state, item.slot) : null) || state.inventory.find(e => e.id === id);
  if (!target) return false;
  const lv = clampLevel(item.slot, level);
  if (lv > 0) target.level = lv; else delete target.level;
  return true;
}
// 장비 개체 하나의 강화 단계. 칸별 최대(무기 +7 · 옷 · 투구 +5)를 넘는 값은 최대로 읽는다.
export function entryLevel(entry) {
  const item = ITEMS[entry?.id];
  if (!item || item.type !== 'gear') return 0;
  return clampLevel(item.slot, entry.level);
}
// 그 종류의 장비를 '입고 있으면 입은 개체', 아니면 가방의 첫 개체의 단계(예전 이름 그대로 — 장비창 · 오라 · 테스트가 쓴다).
export function itemLevel(state, id) {
  const item = ITEMS[id];
  if (!item || item.type !== 'gear') return 0;
  syncGear(state);
  const worn = state[GEAR_SLOT_FIELD[item.slot]] === id ? wornEntry(state, item.slot) : null;
  return entryLevel(worn || state.inventory.find(e => e.id === id));
}
// 착용 중인 무기의 강화 단계(예전 이름 그대로 — 장비창 · 테스트가 쓴다).
export function equipmentLevel(state) { return itemLevel(state, state.equipment); }

// 기본값 × 단계 누적 배율. 기본 능력치(ITEMS)는 바꾸지 않는다.
//   무기: 공격력(모든 등급) · 공격속도(영웅 · 레전드만). 사거리 · 밀치기 · Q 공명 배율은 강화와 무관하다.
//   옷 · 투구: 방어력. 투구 부가 능력(정밀 · 재사용 대기시간 감소)은 영웅 · 레전드 투구에 기본값이 있을 때만 배율을 받는다.
export function effectiveItemStats(id, level) {
  const item = ITEMS[id];
  if (!item || item.type !== 'gear') return {};
  if (item.slot === 'weapon') {
    const speed = item.attackSpeed > 0 ? item.attackSpeed : 1;
    return { power: (item.power || 0) * weaponPowerMultiplier(level),
      attackSpeed: SPEED_RARITIES.includes(item.rarity) ? speed * weaponSpeedMultiplier(level) : speed };
  }
  const result = { defense: (item.defense || 0) * defenseMultiplier(level) };
  if (item.slot === 'helmet' && SPEED_RARITIES.includes(item.rarity))
    for (const key of Object.keys(HELMET_PASSIVES)) if (item[key] > 0) result[key] = item[key] * helmetPassiveMultiplier(level);
  return result;
}
// 가방 속 장비의 지금 능력치(저장된 강화 단계 반영).
export function equippedStats(state, id) { return effectiveItemStats(id, itemLevel(state, id)); }

export function weaponStats(state) {
  const base = {range:10,cooldown:.32,knockback:2,resonance:1,...WEAPON_STYLES[state.equipment]};
  // 무기별 개성(빠른 연타 / 느린 강타)은 그대로 두고, 전체 템포만 한 번에 느리게 만든다.
  // 공격속도(영웅·레전드 능력치, 기본 1)는 실제 쿨타임을 나눈다. 공격 모션 길이는 combat.js 가 이 쿨타임에서
  // 뽑아 쓰므로(쿨타임 × recoveryRatio), 공격속도가 바뀌면 판정 간격과 애니메이션이 함께 줄거나 는다.
  // 강화 배율은 공격력과 (영웅·레전드의) 공격속도에만 붙는다 — 같은 공격속도 경로로 쿨타임과 모션이 함께 짧아진다.
  const { power = 0, attackSpeed = 1 } = equippedStats(state, state.equipment);
  // 학과 공명 1단계(Revision 79): 강화까지 끝난 무기 공격력에만 × 1.05. 공격속도 · 사거리 · 밀치기 · 공명 배율은 그대로.
  return {...base, attackSpeed, cooldown: base.cooldown * COMBAT.attackTempo / attackSpeed, power: power * gearStatMultiplier(state, state.equipment)};
}

// 가방에 든 상점 포인트 합계.
export function shopPoints(state) {
  return state.inventory.filter(e => e.id === 'shopPoint').reduce((sum, e) => sum + e.quantity, 0);
}
function spendPoints(state, cost) {
  let left = cost;
  for (const entry of state.inventory) {
    if (entry.id !== 'shopPoint' || left <= 0) continue;
    const take = Math.min(left, entry.quantity);
    entry.quantity -= take; left -= take;
  }
  state.inventory = state.inventory.filter(e => e.quantity > 0);
}
// 상점에서 장비 하나를 산다. 실패하면 가방은 손대지 않는다.
export function buyItem(state, id) {
  const item = ITEMS[id];
  if (!item || !item.shop) return { success: false, message: '상점에 없는 물건입니다.' };
  if (state.inventory.some(e => e.id === id)) return { success: false, message: `${item.name}은 이미 가지고 있습니다.` };
  const price = basePrice(id), have = shopPoints(state);
  if (have < price) return { success: false, message: `상점 포인트가 ${price - have}점 더 필요합니다.` };
  if (state.inventory.length + 1 > CONFIG.inventorySlots) return { success: false, message: '가방에 빈 칸이 필요합니다.' };
  spendPoints(state, price);
  addItem(state, id);
  return { success: true, message: `${item.name}을 샀습니다. 남은 포인트 ${shopPoints(state)}점.`, item };
}

// ── 상점 금액 규칙 · 장비 판매 (2026-09-27) ────────────────────────
// 상점의 모든 금액(구매가 · 판매가 · 받는 포인트 · 보유 포인트)은 1 이상의 정수(자연수)다.
// 가격표에 잘못된 소수 · 0 · 음수가 들어와도 거래 시점에 naturalPoints 로 정규화한다.
export function naturalPoints(value) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 1 ? n : 1;
}
// 기준 구매가: 등급 가격표(보통 5 · 희귀 10 · 영웅 15 · 레전드 20). 상점에서 팔지 않는 장비도 같은 표로 값을 매긴다
// (판매가 계산용일 뿐, 이 때문에 구매 목록에 추가되지는 않는다).
export function basePrice(id) { return naturalPoints(PRICE[ITEMS[id]?.rarity] ?? 40); }
// 판매가 = max(1, floor(기준 구매가 × 0.6)). 소수 오차가 없도록 정수로만 계산한다(×6 ÷10).
// 강화 단계와 무관하다 — 판매로 강화를 되돌리거나 코인을 환급받을 수 없다.
export function sellPrice(id) { return Math.max(1, Math.floor(basePrice(id) * 6 / 10)); }
// 다시 얻을 수 없는 장비(팔 수 없음): 상점에 없고 몬스터도 떨어뜨리지 않는 장비.
// 2026-09-28 부터 학과 영웅 옷 4종도 몬스터가 떨어뜨려(drops) 지금은 해당 장비가 없다. 구조는 앞으로의 고유 장비를 위해 남겨 둔다.
export function isUniqueGear(id) { const item = ITEMS[id]; return !!item && item.type === 'gear' && !item.shop && !item.drops; }

// 가방의 한 칸(index)을 팔 수 있는지. state: 'ready' · 'equipped'(착용 중) · 'unique'(고유 장비) · 'invalid'(장비가 아님)
// 같은 장비를 여러 개 가졌으면 실제로 입고 있는 그 개체(wornEntry)만 '착용 중'이고 나머지는 팔 수 있다(Revision 81).
// level 은 그 칸 개체의 강화 단계다.
export function sellInfo(state, index) {
  syncGear(state);
  const entry = state.inventory[index], item = ITEMS[entry?.id];
  if (!item || item.type !== 'gear' || !SLOT_FIELD[item.slot]) return { state: 'invalid', index };
  const id = entry.id, info = { index, id, item, level: entryLevel(entry), price: sellPrice(id) };
  if (wornEntry(state, item.slot) === entry) return { ...info, state: 'equipped' };
  if (isUniqueGear(id)) return { ...info, state: 'unique' };
  return { ...info, state: 'ready' };
}
// 가방의 index 칸 장비를 판다. expectedId 가 그 칸의 장비와 다르면(이미 팔렸거나 가방이 바뀌었으면) 아무것도 하지 않는다.
// 성공하면 한 번에: 그 장비 개체 1개 제거 → 상점 포인트(자연수) 지급. 강화 단계는 그 개체에 붙어 있어 함께 사라지고,
// 같은 이름의 다른 개체의 단계는 그대로다. 나중에 같은 장비를 새로 얻으면 +0 인 새 개체다(Revision 81).
export function sellGear(state, index, expectedId) {
  const info = sellInfo(state, index);
  if (info.state === 'invalid' || (expectedId !== undefined && info.id !== expectedId)) return { success: false, message: '팔 수 있는 장비가 아닙니다.' };
  if (info.state === 'equipped') return { success: false, message: `${info.item.name}은(는) 착용 중이라 팔 수 없습니다.` };
  if (info.state === 'unique') return { success: false, message: `${info.item.name}은(는) 다시 얻을 수 없는 고유 장비라 팔 수 없습니다.` };
  state.inventory.splice(index, 1);   // 판 개체의 강화 단계는 그 개체와 함께 사라진다 — 같은 종류의 다른 개체는 그대로(Revision 81)
  addItem(state, 'shopPoint', info.price);
  return { success: true, price: info.price, id: info.id, level: info.level,
    message: `${info.item.name}${info.level ? ` +${info.level}` : ''}을(를) ${info.price}포인트에 팔았습니다. 보유 ${shopPoints(state)}포인트.` };
}

// ── 충공 코인 강화 (2026-09-27) ─────────────────────────
// 가방에 든 충공 코인 합계. 상점 포인트(shopPoint)와는 따로 센다.
export function coinCount(state) {
  return state.inventory.filter(e => e.id === COIN_ID).reduce((sum, e) => sum + e.quantity, 0);
}
function spendCoins(state, cost) {
  let left = cost;
  for (const entry of state.inventory) {
    if (entry.id !== COIN_ID || left <= 0) continue;
    const take = Math.min(left, entry.quantity);
    entry.quantity -= take; left -= take;
  }
  state.inventory = state.inventory.filter(e => e.quantity > 0);
}

// J 카드 하나에 필요한 값. 지금 착용한 칸의 장비만 본다.
//   state: 'empty' 착용 없음 · 'max' 최대 강화 · 'coins' 코인 부족 · 'ready' 강화 가능
export function enhanceInfo(state, slot) {
  const entry = SLOT_FIELD[slot] ? wornEntry(state, slot) : null, id = entry?.id, item = ITEMS[id];
  const coins = coinCount(state), max = maxLevel(slot);
  if (!item || item.slot !== slot)
    return { slot, id: null, item: null, level: 0, max, coins, state: 'empty' };
  const level = entryLevel(entry), step = nextStep(slot, level);
  const info = { slot, id, uid: entry.uid, entry, item, level, max, coins, current: effectiveItemStats(id, level) };
  if (!step) return { ...info, state: 'max' };
  return { ...info, chance: step.chance, cost: step.cost, next: effectiveItemStats(id, level + 1),
    shortfall: Math.max(0, step.cost - coins), state: coins >= step.cost ? 'ready' : 'coins' };
}

// 착용한 칸의 장비를 한 번 강화한다. 한 번 부르면 코인 차감 · 판정 · 결과가 딱 한 번씩 일어난다.
//   최대 단계 · 코인 부족 · 착용 없음이면 아무것도 바꾸지 않는다(판정도, 차감도 없음).
//   실패하면 코인만 쓰고 단계는 그대로다.
export function enhanceEquipped(state, slot, rng = Math.random) {
  const info = enhanceInfo(state, slot);
  if (info.state === 'empty') return { ok: false, reason: 'empty', message: '강화할 장비를 먼저 착용해 주세요.' };
  if (info.state === 'max') return { ok: false, reason: 'max', message: `${info.item.name}은(는) 이미 최대 강화 +${info.max}입니다.` };
  if (info.state === 'coins') return { ok: false, reason: 'coins', shortfall: info.shortfall,
    message: `충공 코인이 부족합니다. ${info.shortfall}개 더 필요합니다.` };
  spendCoins(state, info.cost);
  const success = rollEnhancement(info.chance, rng);
  const level = success ? info.level + 1 : info.level;
  if (success) info.entry.level = level;   // 입고 있는 그 개체 하나만 강화된다(Revision 81)
  return { ok: true, success, slot, id: info.id, from: info.level, level, cost: info.cost, chance: info.chance,
    message: success ? `강화 성공! ${info.item.name} +${level}` : `강화 실패 · ${info.item.name} +${level} 단계 유지` };
}
