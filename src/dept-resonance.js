// ── 학과 공명(Revision 79) ────────────────────────────────────────────────
// 내 학과의 영웅 · 레전드 장비(무기 · 옷 · 투구)를 몇 칸 입었는지(0~3)에 따라 누적 보너스를 준다.
// 다른 학과 장비나 공용(보통 · 희귀) 장비에는 패널티가 없다 — 그 장비는 지금 성능 그대로다.
//   1/3  내 학과 착용 장비 각각의 주능력치(무기 공격력 · 옷 방어력 · 투구 방어력) +5%. 강화까지 끝난 그 장비의 값 × 1.05.
//        공격속도 · 사거리 · 밀치기 · Q 공명 배율 · 투구 부가 능력 · 쿨감은 그대로다.
//   2/3  + Q 공명 타격 최종 피해 × 1.10 · Q 쿨타임 × 0.90
//   3/3  + 학과별 R 강화 — 기계 R 직접 피해 × 1.15 · 전기 감전 20% → 30% · 건축 취약 +15% → +20%
//        · 토목 일반 구속 3초 → 4초, 보스 둔화 40% → 50%(경직 1초는 그대로)
// 공명 단계는 저장하지 않는다. 착용 칸(state.equipment · armor · helmet)과 학과에서 매번 계산하므로
// 착용 · 해제 · 교체 · 강화 · 불러오기 직후 곧바로 반영된다.
import {ITEMS} from './inventory.js';

export const RESONANCE = Object.freeze({
  statBonus: .05,
  qDamage: 1.10, qCooldown: .90,
  machineR: 1.15, shockShare: .3, vulnBonus: .2, rootTime: 4, bossSlow: .5,
});
const SLOT_FIELDS = Object.freeze({weapon: 'equipment', armor: 'armor', helmet: 'helmet'});
// 학과 영웅 옷 4종은 ITEMS 에 department 칸이 없어(옛 탐방 보상 id) 여기서 학과를 읽는다.
const HERO_ARMOR_DEPT = Object.freeze({draftMantle: 'architecture', servoVest: 'machine', arcJacket: 'electric', strataCoat: 'civil'});
export const RESONANCE_RARITIES = Object.freeze(['영웅', '레전드']);

// 이 장비가 어느 학과의 영웅 · 레전드 장비인지(공용 · 보통 · 희귀면 null).
export function gearDepartment(id) {
  const item = ITEMS[id];
  if (!item || item.type !== 'gear' || !RESONANCE_RARITIES.includes(item.rarity)) return null;
  return item.department || HERO_ARMOR_DEPT[id] || null;
}
export function isOwnDeptGear(state, id) { return !!state?.department && gearDepartment(id) === state.department; }

// 착용 중인 칸 가운데 내 학과 영웅 · 레전드 장비 수(0~3). 가방에 실제로 있는 장비만 센다(equipped 규칙과 같게 칸 id 만 본다).
export function resonanceLevel(state) {
  if (!state) return 0;
  let count = 0;
  for (const [slot, field] of Object.entries(SLOT_FIELDS)) {
    const id = state[field];
    if (id && ITEMS[id]?.slot === slot && isOwnDeptGear(state, id)) count++;
  }
  return count;
}
// 착용한 장비 하나의 주능력치 배율(1단계). 내 학과 장비만 1.05, 나머지는 1.
export function gearStatMultiplier(state, id) { return resonanceLevel(state) >= 1 && isOwnDeptGear(state, id) ? 1 + RESONANCE.statBonus : 1; }
export const qDamageMultiplier = state => resonanceLevel(state) >= 2 ? RESONANCE.qDamage : 1;
export const qCooldownMultiplier = state => resonanceLevel(state) >= 2 ? RESONANCE.qCooldown : 1;
export const ultimateEmpowered = state => resonanceLevel(state) >= 3;

// J 나의 장비에 보여 줄 세 줄. 3단계 문구는 학과마다 다르다.
const TIER3_TEXT = {
  machine: 'R 직접 피해 +15%',
  electric: 'R 감전 피해 20% → 30%',
  architecture: 'R 구조 취약점 +15% → +20%',
  civil: 'R 진흙 구속 3초 → 4초 · 보스 둔화 40% → 50%',
};
export function resonanceSummary(state) {
  const level = resonanceLevel(state);
  return {
    level, department: state.department,
    tiers: [
      {need: 1, text: '내 학과 장비 주능력치 +5%', on: level >= 1},
      {need: 2, text: '공명 타격(Q) 피해 +10% · 쿨타임 -10%', on: level >= 2},
      {need: 3, text: TIER3_TEXT[state.department] || '최고 기술(R) 강화', on: level >= 3},
    ],
  };
}
