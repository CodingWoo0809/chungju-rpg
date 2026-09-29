import {migrateSave,retireGlovesAndShoes,replaceRetiredWeapons,replaceRetiredArmor,replaceRetiredHelmet,convertMaterialsToCoins,SAVE_VERSION} from './save-migration.js';
import {mainFloor} from './world.js';
import { CONFIG, DEPARTMENTS } from './config.js';
import { BUILDINGS, solid } from './world.js';
import { CAMPUS_PROPS } from './campus-props.js';
import { ITEMS, SLOTS } from './inventory.js';

function checkSlot(slot) {
  if (!Number.isInteger(slot) || slot < 0 || slot > 2) throw new Error('저장 슬롯은 1~3 중 하나여야 합니다.');
}

export class SaveRepository {
  read() { throw new Error('저장소 읽기가 구현되지 않았습니다.'); }
  write() { throw new Error('저장소 쓰기가 구현되지 않았습니다.'); }
}

export class LocalSaveRepository extends SaveRepository {
  constructor(storage) { super(); this.storage = storage; }
  read(slot) {
    checkSlot(slot);
    try { return (this.storage ?? globalThis.localStorage).getItem(`chungju-school-week:v1:${slot}`); }
    catch { throw new Error('브라우저 저장소를 읽을 수 없습니다. 저장소 권한을 확인해 주세요.'); }
  }
  write(slot, value) {
    checkSlot(slot);
    try { (this.storage ?? globalThis.localStorage).setItem(`chungju-school-week:v1:${slot}`, value); }
    catch { throw new Error('저장하지 못했습니다. 브라우저 저장 공간 또는 권한을 확인해 주세요.'); }
  }
}

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);
const nonnegative = value => finite(value) && value >= 0;
const position = value => record(value) && finite(value.x) && finite(value.y);

export function validateState(state, slot = state?.slot) {
  const fail = () => { throw new Error('저장 파일이 손상되었거나 지원하지 않는 버전입니다.'); };
  if (!record(state) || !Number.isInteger(state.version) || state.version < 1 || state.version > SAVE_VERSION) fail();
  checkSlot(slot);
  if (state.slot !== slot || !Number.isInteger(state.day) || state.day < 0 || state.day > 4) fail();
  if (!finite(state.time) || state.time < CONFIG.dayStart || state.time > CONFIG.dayEnd) fail();
  if (!DEPARTMENTS.some(entry => entry.id === state.department)) fail();
  if (state.scene !== 'campus' && !mainFloor(state.scene) && !BUILDINGS.some(entry => entry.id === state.scene)) fail();
  if (!position(state.player) || !position(state.player.facing) || !nonnegative(state.player.hp)
    || !finite(state.player.maxHp) || state.player.maxHp <= 0 || state.player.hp > state.player.maxHp) fail();
  if (!Array.isArray(state.inventory) || state.inventory.length > CONFIG.inventorySlots) fail();
  if (state.inventory.some(entry => !record(entry) || !Object.hasOwn(ITEMS, entry.id)
    || !Number.isInteger(entry.quantity) || entry.quantity < 1 || (ITEMS[entry.id].type === 'gear' && entry.quantity !== 1)
    || (entry.uid !== undefined && typeof entry.uid !== 'string') || (entry.level !== undefined && !(Number.isInteger(entry.level) && entry.level >= 0)))) fail();
  // 장비 개체 번호 · 입은 개체(Revision 81, 버전 8). 옛 파일에는 없다.
  if (state.gearSeq !== undefined && !(Number.isInteger(state.gearSeq) && state.gearSeq >= 0)) fail();
  if (state.wornUid !== undefined && (!record(state.wornUid) || Object.values(state.wornUid).some(v => typeof v !== 'string'))) fail();
  // 장비 세 칸(무기·옷·투구). 옛 저장 파일에는 투구 칸이 없으므로 undefined 도 허용한다.
  // 칸마다 그 칸의 장비만 들어갈 수 있다(무기 칸도 무기만 — 다른 칸 장비가 무기로 들어가 있으면 거부).
  for (const {id, slot} of SLOTS) {
    const worn = state[id];
    if (worn === null || worn === undefined) continue;
    if (!Object.hasOwn(ITEMS, worn) || ITEMS[worn].type !== 'gear') fail();
    if (ITEMS[worn].slot !== slot) fail();
    if (!state.inventory.some(entry => entry.id === worn)) fail();
  }
  if(state.growth!==undefined&&(!record(state.growth)||!nonnegative(state.growth.xp)||!Array.isArray(state.growth.granted)||!Array.isArray(state.growth.pending)||[...state.growth.granted,...state.growth.pending].some(id=>!Object.hasOwn(ITEMS,id))))fail();
  if(state.version>=2&&(!record(state.quests)||typeof state.quests.homeroom!=='boolean'||!record(state.quests.tour)))fail();
  if (!record(state.proficiencies) || ['combat', 'sport', 'life', ...DEPARTMENTS.map(entry => entry.id)]
    .some(key => !nonnegative(state.proficiencies[key]))) fail();
  for (const key of ['relations', 'quests', 'flags', 'stats', 'story']) if (!record(state[key])) fail();
  if (Object.values(state.relations).some(value => !finite(value))) fail();
  if (['kills', 'kicks', 'classes', 'meals'].some(key => !nonnegative(state.stats[key])) || !Array.isArray(state.stats.found)) fail();
  if (typeof state.story.bossDefeated !== 'boolean' || typeof state.story.ended !== 'boolean') fail();
  for (const key of ['monsters', 'drops', 'npcs', 'balls']) {
    if (!Array.isArray(state[key]) || state[key].some(entry => !position(entry) || typeof entry.id !== 'string')) fail();
  }
  // 날아가던 투사체. 이 항목이 없는 예전 저장 파일도 그대로 읽힌다.
  if (state.projectiles !== undefined && (!Array.isArray(state.projectiles)
    || state.projectiles.some(entry => !position(entry) || typeof entry.id !== 'string'))) fail();
  if (state.returnEntrance !== undefined && (!record(state.returnEntrance)
    || !BUILDINGS.some(b => b.id === state.returnEntrance.buildingId
      && b.doors.some(d => d.id === state.returnEntrance.doorId)))) fail();
  return state;
}

function adaptCampusLayout(state) {
  for(const actor of state.npcs){if (actor.id==='guard') { actor.name='한결 학생부 선생님'; actor.role='teacher'; actor.personality='유쾌한 생활지도'; }}

  const changed = [...BUILDINGS,...CAMPUS_PROPS.filter(o=>o.solid)];
  const overlaps = p => changed.some(b => p.x > b.x - CONFIG.playerRadius && p.x < b.x + b.w + CONFIG.playerRadius
    && p.y > b.y - CONFIG.playerRadius && p.y < b.y + b.d + CONFIG.playerRadius);
  for (const actor of [state.scene === 'campus' ? state.player : null, ...state.npcs.filter(n => n.scene === 'campus')]) {
    if (!actor) continue;
    if (overlaps(actor)) {
      const exits = changed.flatMap(b => [{x:b.x-5,y:Math.max(b.y,Math.min(b.y+b.d,actor.y))},
        {x:b.x+b.w+5,y:Math.max(b.y,Math.min(b.y+b.d,actor.y))},
        {x:Math.max(b.x,Math.min(b.x+b.w,actor.x)),y:b.y-5},
        {x:Math.max(b.x,Math.min(b.x+b.w,actor.x)),y:b.y+b.d+5}])
        .filter(p => !solid(p)).sort((a,b) => Math.hypot(a.x-actor.x,a.y-actor.y)-Math.hypot(b.x-actor.x,b.y-actor.y));
      Object.assign(actor, exits[0]);
    }
    
    if (actor.destination==='gate'||actor.path?.some(overlaps)) { actor.path = []; delete actor.destination; }
  }
  return state;
}

export class SaveService {
  constructor(repository = new LocalSaveRepository()) { this.repository = repository; }
  list() {
    return [0, 1, 2].map(slot => {
      try {
        const value = this.repository.read(slot);
        if (value === null) return null;
        const envelope = this.parse(value, slot);
        const { day, time, department } = envelope.state;
        return { slot, day, time, department, savedAt: envelope.savedAt };
      } catch (error) { return { slot, corrupt: true, error: error.message }; }
    });
  }
  parse(value, slot) {
    let envelope;
    try { envelope = JSON.parse(value); }
    catch { throw new Error('저장 파일을 읽지 못했습니다. 다른 슬롯을 선택하거나 새 게임을 시작해 주세요.'); }
    if (!record(envelope)) throw new Error('저장 파일 형식이 올바르지 않습니다.');
    const entrance=envelope.state?.returnEntrance;
    if(record(entrance)&&entrance.buildingId==='architecture'&&entrance.doorId==='architecture:front')entrance.doorId='architecture:right';
    // 2026-09 · 전기전자과·자동화기계과 모두 실제로 정면 출입구가 없어 제거했다 — 옛 저장 파일의
    // 정면 출입구 복귀 지점을 각 건물의 새 기본 출입구(우측)로 옮긴다(위 architecture 처리와 같은 방식).
    if(record(entrance)&&entrance.buildingId==='electric'&&entrance.doorId==='electric:front')entrance.doorId='electric:right';
    if(record(entrance)&&entrance.buildingId==='machine'&&entrance.doorId==='machine:front')entrance.doorId='machine:right';
    // 장갑·신발 폐지(버전 3) 이전 파일: ITEMS 에서 지운 장갑·신발을 먼저 빼고 환급한 뒤 검증한다.
    // 순서가 바뀌면 첫 검증이 '모르는 아이템'으로 보고 멀쩡한 옛 저장 파일을 손상으로 거부한다.
    retireGlovesAndShoes(envelope.state);
    // 무기 개편(버전 4) 이전 파일: ITEMS 에서 지운 옛 무기를 같은 등급의 새 무기로 먼저 바꾼 뒤 검증한다.
    replaceRetiredWeapons(envelope.state);
    // 옷 정리(버전 6) 이전 파일: ITEMS 에서 지운 현장 조끼를 학과 영웅 옷으로 먼저 바꾼다(강화 단계 포함 —
    // 바로 아래 재료 전환이 옮겨진 단계까지 새 최대로 맞춘다).
    replaceRetiredArmor(envelope.state);
    // 투구 정리(버전 7) 이전 파일: ITEMS 에서 지운 보안면 헬멧을 학과 영웅 투구로 먼저 바꾼다(강화 단계 포함).
    replaceRetiredHelmet(envelope.state);
    // 강화 재료 폐지(버전 5) 이전 파일: 재료 3종을 충공 코인으로 1:1 전환한 뒤 검증한다.
    convertMaterialsToCoins(envelope.state);
    validateState(envelope.state, slot);
    migrateSave(envelope.state);
    validateState(envelope.state, slot);
    return envelope;
  }
  load(slot) {
    checkSlot(slot);
    const value = this.repository.read(slot);
    if (value === null) throw new Error('이 슬롯에는 저장된 게임이 없습니다.');
    return adaptCampusLayout(this.parse(value, slot).state);
  }
  save(state) {
    validateState(state);
    const savedAt = new Date().toISOString();
    let serialized;
    try { serialized = JSON.stringify({ savedAt, state }); }
    catch { throw new Error('현재 상태를 저장할 수 없습니다.'); }
    this.repository.write(state.slot, serialized);
    return { slot: state.slot, savedAt };
  }
}
