import {progression, ULTIMATES} from './growth.js';
import {COMBAT} from './config.js';
import {isAdminState} from './admin-mode.js';
import {qCooldownMultiplier} from './dept-resonance.js';

// 화면 왼쪽 아래 스킬 아이콘과 조작키 안내가 함께 쓰는 한 벌의 정의.
// cooldown 은 state.player 에 쌓이는 필드 이름, full 은 그 스킬의 최대 쿨타임(초)이다.
// icon 은 정사각형 아이콘 안에 그려 넣는 SVG 조각(16×16 좌표계), tone 은 그 칸의 바탕색이다.
export const SKILL_SLOTS = [
  {
    key: 'Q', label: '공명 타격', cooldown: 'qCooldown', full: 2.5,
    fullFor: s => COMBAT.qCooldown * qCooldownMultiplier(s),   // 학과 공명 2/3 이상이면 쿨타임 -10%(Revision 79)
    description: '둘러싼 원 안의 적을 360° 한 번에 쓸어 낸다. 등 뒤도 함께 맞는다.',
    effect: `반경 ${COMBAT.qRange} 전방위 · 위력 ${COMBAT.qPower}배(무기 공명 보정)`,
    tone: '#3f6f7d',
    icon: '<path d="M3 8h2.2" /><path d="M6.4 4.4A5 5 0 0 1 6.4 11.6" /><path d="M9 2.6A7.6 7.6 0 0 1 9 13.4" /><path d="M11.8 1.4A10 10 0 0 1 11.8 14.6" />',
    unlocked: s => isAdminState(s) || (s.proficiencies.combat || 0) >= 5,
    requirement: '전투 숙련 5',
    progress: s => Math.min(1, (s.proficiencies.combat || 0) / 5)
  },
  {
    key: 'E', label: '숨 고르기', cooldown: 'eCooldown', full: 8,
    description: '그 자리에서 숨을 고르며 체력을 20 회복한다.',
    effect: '체력 +20',
    tone: '#41765b',
    icon: '<path d="M8 2.6v10.8M2.6 8h10.8" stroke-width="3.2" stroke-linecap="round" /><circle cx="8" cy="8" r="6.2" stroke-width="1.1" fill="none" />',
    unlocked: s => (s.proficiencies.life || 0) >= 10,
    requirement: '생활 숙련 10',
    progress: s => Math.min(1, (s.proficiencies.life || 0) / 10)
  },
  {
    key: 'R', label: '최고 기술', cooldown: 'rCooldown', full: 18,
    // 이름 · 설명 · 효과 · 아이콘 색까지 전부 학과 선택(state.department)에 따라 ULTIMATES 에서 읽는다.
    description: s => ULTIMATES[s.department].description,
    name: s => ULTIMATES[s.department].name,
    effect: s => ULTIMATES[s.department].effect || '',
    tone: s => ULTIMATES[s.department].color,
    icon: '<path d="M8 1.2l1.9 4.2 4.6.5-3.4 3.1 1 4.5L8 11.2 3.9 13.5l1-4.5L1.5 5.9l4.6-.5z" stroke-width="1.2" />',
    unlocked: s => isAdminState(s) || progression(s).ultimate,
    requirement: '학교 탐방 8곳',
    progress: s => Math.min(1, progression(s).completed / 8)
  },
  {
    key: 'Space', label: '회피', cooldown: 'dodgeCooldown', full: 1.3,
    description: '이동 방향으로 굴러 잠깐 무적이 된다.',
    effect: '0.35초 무적',
    tone: '#7a6a3f',
    icon: '<circle cx="6.6" cy="8" r="4.2" stroke-width="1.4" fill="none" /><path d="M11 4.4L14 8l-3 3.6" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" /><path d="M1.4 5.6h2.4M1.4 10.4h2.4" stroke-width="1.2" stroke-linecap="round" />',
    unlocked: () => true, requirement: '', progress: () => 1
  }
];

const call = (value, s) => (typeof value === 'function' ? value(s) : value);

// 스킬 한 칸의 현재 상태. HUD 와 장비창이 이 결과만 보고 그린다.
export function skillState(slot, s) {
  const unlocked = slot.unlocked(s);
  const remaining = Math.max(0, s.player?.[slot.cooldown] || 0);
  const full = slot.fullFor ? slot.fullFor(s) : slot.full;
  return {
    key: slot.key,
    name: unlocked && slot.name ? call(slot.name, s) : slot.label,
    description: call(slot.description, s),
    effect: call(slot.effect, s) || '',
    icon: slot.icon,
    tone: call(slot.tone, s) || '#3f6f7d',
    cooldownText: full ? `${Math.round(full * 100) / 100}초` : '없음',
    unlocked,
    requirement: slot.requirement,
    progress: slot.progress(s),
    remaining,
    ratio: full ? Math.min(1, remaining / full) : 0,
    ready: unlocked && remaining <= 0
  };
}

export function skillStates(s) {
  return SKILL_SLOTS.map(slot => skillState(slot, s));
}
