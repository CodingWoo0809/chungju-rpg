import { CONFIG, DEPARTMENTS } from './config.js';
import { GATE } from './world.js';

export function createState(department, slot = 0) {
  if (!DEPARTMENTS.some(entry => entry.id === department)) throw new Error('학과를 선택해 주세요.');
  if (!Number.isInteger(slot) || slot < 0 || slot > 2) throw new Error('저장 슬롯이 올바르지 않습니다.');
  return {
    version: 8, slot, day: 0, time: CONFIG.dayStart, department, scene: 'campus',
    player: { ...GATE, hp: 100, maxHp: 100, facing: { x: 0, y: -1 } },
    inventory: [], equipment: null, armor: null, helmet: null,
    proficiencies: { combat: 0, sport: 0, life: 0, architecture: 0, machine: 0, electric: 0, civil: 0 },
    relations: {}, quests: {homeroom:false,tour:{}}, stats: { kills: 0, kicks: 0, classes: 0, meals: 0, found: [] },
    story: { bossDefeated: false, ended: false }, flags: {},
    monsters: [], drops: [], npcs: [], balls: [],
  };
}
