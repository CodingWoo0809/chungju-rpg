import {mainSpawn} from './main-interior.js';
import {ITEMS,syncGear} from './inventory.js';
import {COIN_ID,maxLevel} from './enhancement.js';
import {CONFIG} from './config.js';

// 지금 저장 파일 버전. 3 = 장비 3칸(무기·옷·투구), 4 = 무기 10종(보통·희귀 공용 + 학과별 영웅·레전드),
// 5 = 강화 재료 3종 폐지 · 충공 코인 강화, 6 = 옷 10종 정리(공용 영웅 옷 '현장 조끼' 폐지),
// 7 = 투구 10종 정리(공용 영웅 투구 '보안면 헬멧' 폐지 → 학과 영웅 투구).
export const SAVE_VERSION=8;

// ── 2026-09-26 · 장갑·신발 칸 폐지 ─────────────────────────
// 게임에서 지운 장갑 7종 · 신발 7종과 당시 상점 등급. 아이템 정의는 이미 ITEMS 에 없으므로
// 환급 가격은 여기 남겨 둔 등급으로 LEGACY_REFUND 표(보통 5 · 희귀 10 · 영웅 15 · 레전드 20, 폐지 당시 상점가)에서 찾는다.
const DEPTS=['architecture','machine','electric','civil'];
export const RETIRED_GEAR=Object.freeze({
 workGlove:'보통',gripGlove:'희귀',weldGlove:'영웅',
 ...Object.fromEntries(DEPTS.map(d=>[`${d}-gloves`,'레전드'])),
 canvasShoes:'보통',safetyShoes:'희귀',trailShoes:'영웅',
 ...Object.fromEntries(DEPTS.map(d=>[`${d}-shoes`,'레전드']))
});
const RETIRED_SLOTS=['gloves','shoes'];
const isRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const retired=id=>typeof id==='string'&&Object.hasOwn(RETIRED_GEAR,id);
// 폐지 장비 환급은 폐지 당시(Revision 62)의 등급가로 고정한다 — 이후 상점 가격을 바꿔도 옛 저장 파일의 환급액은 같다.
export const LEGACY_REFUND=Object.freeze({보통:5,희귀:10,영웅:15,레전드:20});
const refundOf=id=>LEGACY_REFUND[RETIRED_GEAR[id]];
const count=value=>Number.isInteger(value)&&value>0?value:1;

// 옛 저장 파일(버전 1·2)에서 장갑·신발을 빼고, 산 값만큼 상점 포인트로 돌려준다.
// 저장 파일 검증(validateState)보다 먼저 불러야 한다. 검증은 ITEMS 에 없는 아이템을 손상으로 보기 때문이다.
// 아직 검증 전이라 모양이 이상한 값이 와도 던지지 않고, 모르는 부분은 그대로 두어 검증에 맡긴다.
//   · 가방에 든 장갑·신발 → 빠진 수량만큼 환급
//   · 착용 칸(gloves/shoes)에 있던 장비 → 가방에 같은 물건이 있으면 위에서 이미 환급(착용 = 가방 속 그 한 개),
//     가방에 없던 경우에만 따로 한 번 환급. 칸 자체는 지운다.
//   · 바닥에 떨어져 있던 장갑·신발 → 줍지 못하게 되므로 지우고 환급
//   · 성장 보상 대기열 속 장갑·신발 → 지운다(산 물건이 아니라 환급 없음)
export function retireGlovesAndShoes(state){
 const result={points:0,removed:[]};
 if(!isRecord(state)||![1,2].includes(state.version))return result;
 const take=(id,quantity)=>{result.points+=refundOf(id)*quantity;result.removed.push({id,quantity});};
 const inBag=new Set();
 if(Array.isArray(state.inventory)){
  state.inventory=state.inventory.filter(entry=>{
   if(!isRecord(entry)||!retired(entry.id))return true;
   take(entry.id,count(entry.quantity));inBag.add(entry.id);return false;
  });
 }
 for(const field of RETIRED_SLOTS){
  if(!Object.hasOwn(state,field))continue;
  const worn=state[field];
  if(retired(worn)&&!inBag.has(worn))take(worn,1);
  delete state[field];
 }
 if(Array.isArray(state.drops)){
  state.drops=state.drops.filter(drop=>{
   if(!isRecord(drop)||!retired(drop.itemId))return true;
   take(drop.itemId,count(drop.quantity));return false;
  });
 }
 if(isRecord(state.growth)){
  for(const key of ['granted','pending'])if(Array.isArray(state.growth[key]))state.growth[key]=state.growth[key].filter(id=>!retired(id));
 }
 if(result.points>0&&Array.isArray(state.inventory)){
  // 이미 모아 둔 포인트 묶음이 있으면 거기에 더한다. 없으면 새 묶음 — 장비를 뺀 자리만큼 가방이 비어 있다.
  const stack=state.inventory.find(entry=>isRecord(entry)&&entry.id==='shopPoint'&&Number.isInteger(entry.quantity));
  if(stack)stack.quantity+=result.points;
  else if(state.inventory.length<CONFIG.inventorySlots)state.inventory.push({id:'shopPoint',quantity:result.points});
  else if(Array.isArray(state.drops)&&isRecord(state.player))   // 가방이 꽉 찼다면(바닥에 있던 것만 환급된 경우) 발밑에 둔다
   state.drops.push({id:'retired-gear-refund',itemId:'shopPoint',quantity:result.points,scene:state.scene,x:state.player.x,y:state.player.y});
 }
 if(result.removed.length){
  state.flags=isRecord(state.flags)?state.flags:{};
  state.flags.retiredGearNotice=`장갑·신발 칸이 없어져 가지고 있던 ${result.removed.reduce((n,r)=>n+r.quantity,0)}개를 정리하고 상점 포인트 ${result.points}점을 돌려받았습니다.`;
 }
 return result;
}

// ── 2026-09-26 · 무기 리워크(버전 4) ───────────────────────
// 게임에서 빠진 옛 무기 5종을 같은 등급의 새 무기로 바로 바꿔 준다(환급 없음 — 같은 등급으로 직접 승계).
//   보통 천공 설계검·서보 건틀릿 → 복싱 글러브, 희귀 뇌광 쌍극창·지층 파쇄추 → 배드민턴 라켓,
//   영웅 아크 절단기 → 그 저장 파일 학과의 영웅 무기.
export const RETIRED_WEAPONS=Object.freeze({
 chalkBlade:'boxingGlove',gearGlove:'boxingGlove',
 coilBaton:'badmintonRacket',stoneHammer:'badmintonRacket',
 arcCutter:'hero'
});
const heroWeapon=department=>DEPTS.includes(department)?`${department}-hero-weapon`:null;
// 옛 무기 id → 새 무기 id. 옛 무기가 아니면 그대로 돌려준다.
export function successorWeapon(id,department){
 if(typeof id!=='string'||!Object.hasOwn(RETIRED_WEAPONS,id))return id;
 const next=RETIRED_WEAPONS[id];
 return next==='hero'?(heroWeapon(department)??id):next;
}
// 옛 저장 파일(버전 1~3)의 옛 무기를 새 무기로 바꾼다. 장갑·신발 정리처럼 검증(validateState)보다 먼저 불러야 한다.
//   · 가방: 칸 하나하나를 그대로 바꾼다 — 같은 옛 무기가 여러 개면 새 무기도 같은 개수, 수량은 그대로
//   · 착용 중인 무기: 새 무기로 바꾼 채 착용 유지
//   · 바닥 드롭 · 성장 보상 목록(지급 완료/대기)도 같은 규칙으로 바꾼다
//   · 강화 단계(flags['upgrade:무기id'])는 새 무기로 옮긴다. 둘이 한 무기로 합쳐지면 더 높은 단계를 남긴다
export function replaceRetiredWeapons(state){
 const result={swapped:[]};
 if(!isRecord(state)||![1,2,3].includes(state.version))return result;
 // swapped 는 실제 물건(가방 칸·바닥 드롭)만 센다. 착용 칸은 가방 속 그 무기를 가리키므로 따로 세지 않는다.
 const swap=id=>{const next=successorWeapon(id,state.department);if(next!==id)result.swapped.push({from:id,to:next});return next;};
 if(Array.isArray(state.inventory))for(const entry of state.inventory)if(isRecord(entry))entry.id=swap(entry.id);
 if(Object.hasOwn(state,'equipment'))state.equipment=successorWeapon(state.equipment,state.department);
 if(Array.isArray(state.drops))for(const drop of state.drops)if(isRecord(drop))drop.itemId=swap(drop.itemId);
 if(isRecord(state.growth))for(const key of ['granted','pending'])
  if(Array.isArray(state.growth[key]))state.growth[key]=state.growth[key].map(id=>successorWeapon(id,state.department));
 if(isRecord(state.flags)){
  for(const old of Object.keys(RETIRED_WEAPONS)){
   const key=`upgrade:${old}`;if(!Object.hasOwn(state.flags,key))continue;
   const level=state.flags[key],next=successorWeapon(old,state.department);delete state.flags[key];
   if(next===old||!Number.isInteger(level))continue;
   const current=state.flags[`upgrade:${next}`];
   state.flags[`upgrade:${next}`]=Number.isInteger(current)?Math.max(current,level):level;
  }
 }
 if(result.swapped.length){
  state.flags=isRecord(state.flags)?state.flags:{};
  state.flags.retiredWeaponNotice=`무기 개편으로 옛 무기 ${result.swapped.length}개를 같은 등급의 새 무기로 바꿨습니다.`;
 }
 return result;
}

// ── 2026-09-27 · 강화 재료 → 충공 코인(버전 5) ─────────────────
// 강화 재료 3종(반짝이는 부품 · 빛의 결정 · 오래된 설계 조각)을 게임에서 지우고, 가지고 있던 수량을 모두 더해
// 충공 코인으로 1:1 전환한다. 아이템 정의는 이미 ITEMS 에 없으므로 옛 id 는 여기에만 남긴다.
export const RETIRED_MATERIALS=Object.freeze(['scrap','spark','blueprint']);
const material=id=>typeof id==='string'&&RETIRED_MATERIALS.includes(id);
// 옛 저장 파일(버전 1~4)에만 한 번 적용한다. 장갑·신발 정리 · 무기 교환처럼 검증(validateState)보다 먼저 불러야 한다.
//   · 가방: 재료 칸들을 빼고 그 합계만큼 충공 코인 한 묶음을 첫 재료 칸 자리에 둔다(칸 수는 늘지 않는다)
//   · 바닥에 떨어져 있던 재료 → 같은 수량의 충공 코인 드롭으로 바꾼다
//   · 성장 보상 목록 속 재료 → 지운다
//   · 강화 단계(flags['upgrade:아이템id'])는 그대로 둔다. 정수가 아니거나 음수면 지우고,
//     칸별 새 최대(무기 +7 · 옷 · 투구 +5)를 넘는 값은 최대로 낮춘다(옛 최대는 +3 이라 보통은 해당 없음)
export function convertMaterialsToCoins(state){
 const result={coins:0,clamped:[]};
 if(!isRecord(state)||![1,2,3,4].includes(state.version))return result;
 if(Array.isArray(state.inventory)){
  let first=-1;const kept=[];
  for(const entry of state.inventory){
   if(isRecord(entry)&&material(entry.id)){result.coins+=count(entry.quantity);if(first<0){first=kept.length;kept.push(null);}continue;}
   kept.push(entry);
  }
  if(first>=0){
   const stack=kept.find(entry=>isRecord(entry)&&entry.id===COIN_ID&&Number.isInteger(entry.quantity));
   if(stack){stack.quantity+=result.coins;kept.splice(first,1);}
   else kept[first]={id:COIN_ID,quantity:result.coins};
  }
  state.inventory=kept;
 }
 if(Array.isArray(state.drops))for(const drop of state.drops)
  if(isRecord(drop)&&material(drop.itemId)){drop.itemId=COIN_ID;drop.quantity=count(drop.quantity);result.coins+=drop.quantity;}
 if(isRecord(state.growth))for(const key of ['granted','pending'])
  if(Array.isArray(state.growth[key]))state.growth[key]=state.growth[key].filter(id=>!material(id));
 if(isRecord(state.flags)){
  for(const key of Object.keys(state.flags)){
   if(!key.startsWith('upgrade:'))continue;
   const id=key.slice(8),item=ITEMS[id],value=state.flags[key];
   if(!item||item.type!=='gear')continue;                     // 모르는 id 는 건드리지 않는다
   if(!Number.isInteger(value)||value<0){delete state.flags[key];continue;}
   const max=maxLevel(item.slot);
   if(value>max){state.flags[key]=max;result.clamped.push({id,from:value,to:max});}
  }
 }
 if(result.coins>0){
  state.flags=isRecord(state.flags)?state.flags:{};
  state.flags.materialCoinNotice=`기존 강화 재료 ${result.coins}개를 충공 코인 ${result.coins}개로 전환했습니다.`;
 }
 return result;
}

// ── 2026-09-27 · 옷 10종 정리(버전 6) ─────────────────────
// 공용 영웅 옷 '현장 조끼'(fieldVest)를 게임에서 지우고, 그 저장 파일 학과의 영웅 옷으로 1:1 바꾼다(환급 없음).
// 아이템 정의는 이미 ITEMS 에 없으므로 옛 id 는 여기에만 남긴다.
export const RETIRED_ARMOR='fieldVest';
export const HERO_ARMOR=Object.freeze({architecture:'draftMantle',machine:'servoVest',electric:'arcJacket',civil:'strataCoat'});
// 옛 저장 파일(버전 1~5)에만 한 번 적용한다. 다른 정리처럼 검증(validateState)보다 먼저 불러야 한다.
//   · 가방 칸 · 착용 칸 · 바닥 드롭 · 성장 보상 목록의 현장 조끼 → 학과 영웅 옷(착용 중이었으면 착용 유지)
//   · 강화 단계 flags['upgrade:fieldVest'] → 학과 영웅 옷으로 옮긴다. 영웅 옷에 이미 단계가 있으면 더 높은 쪽을 남기고, 옛 flag 는 지운다
//   · 학과가 올바르지 않으면 건드리지 않는다(검증이 그 파일을 거부한다)
export function replaceRetiredArmor(state){
 const result={swapped:0,to:null};
 if(!isRecord(state)||![1,2,3,4,5].includes(state.version))return result;
 const next=Object.hasOwn(HERO_ARMOR,state.department)?HERO_ARMOR[state.department]:null;
 if(!next)return result;
 result.to=next;
 const swap=id=>id===RETIRED_ARMOR?next:id;
 if(Array.isArray(state.inventory))for(const entry of state.inventory)if(isRecord(entry)&&entry.id===RETIRED_ARMOR){entry.id=next;result.swapped++;}
 if(state.armor===RETIRED_ARMOR)state.armor=next;
 if(Array.isArray(state.drops))for(const drop of state.drops)if(isRecord(drop)&&drop.itemId===RETIRED_ARMOR){drop.itemId=next;result.swapped++;}
 if(isRecord(state.growth))for(const key of ['granted','pending'])
  if(Array.isArray(state.growth[key]))state.growth[key]=state.growth[key].map(swap);
 if(isRecord(state.flags)){
  const key=`upgrade:${RETIRED_ARMOR}`;
  if(Object.hasOwn(state.flags,key)){
   const level=state.flags[key];delete state.flags[key];
   if(Number.isInteger(level)&&level>0){
    const current=state.flags[`upgrade:${next}`];
    state.flags[`upgrade:${next}`]=Number.isInteger(current)?Math.max(current,level):level;
   }
  }
 }
 if(result.swapped){
  state.flags=isRecord(state.flags)?state.flags:{};
  state.flags.retiredArmorNotice=`옷 정리로 현장 조끼 ${result.swapped}벌을 ${ITEMS[next]?.name??'학과 영웅 옷'}(으)로 바꿨습니다.`;
 }
 return result;
}

// ── 2026-09-27 · 투구 10종 정리(버전 7) ─────────────────────
// 공용 영웅 투구 '보안면 헬멧'(visorHelmet)을 게임에서 지우고, 그 저장 파일 학과의 영웅 투구로 1:1 바꾼다(환급 없음).
// 옷의 현장 조끼 교환(버전 6)과 규칙이 같다: 가방 · 착용 칸 · 바닥 드롭 · 성장 보상 목록, 착용 유지, 강화 단계 승계(더 높은 쪽).
export const RETIRED_HELMET='visorHelmet';
export const HERO_HELMET=Object.freeze(Object.fromEntries(DEPTS.map(d=>[d,`${d}-hero-helmet`])));
export function replaceRetiredHelmet(state){
 const result={swapped:0,to:null};
 if(!isRecord(state)||![1,2,3,4,5,6].includes(state.version))return result;
 const next=Object.hasOwn(HERO_HELMET,state.department)?HERO_HELMET[state.department]:null;
 if(!next)return result;
 result.to=next;
 const swap=id=>id===RETIRED_HELMET?next:id;
 if(Array.isArray(state.inventory))for(const entry of state.inventory)if(isRecord(entry)&&entry.id===RETIRED_HELMET){entry.id=next;result.swapped++;}
 if(state.helmet===RETIRED_HELMET)state.helmet=next;
 if(Array.isArray(state.drops))for(const drop of state.drops)if(isRecord(drop)&&drop.itemId===RETIRED_HELMET){drop.itemId=next;result.swapped++;}
 if(isRecord(state.growth))for(const key of ['granted','pending'])
  if(Array.isArray(state.growth[key]))state.growth[key]=state.growth[key].map(swap);
 if(isRecord(state.flags)){
  const key=`upgrade:${RETIRED_HELMET}`;
  if(Object.hasOwn(state.flags,key)){
   const level=state.flags[key];delete state.flags[key];
   if(Number.isInteger(level)&&level>0){
    const current=state.flags[`upgrade:${next}`];
    state.flags[`upgrade:${next}`]=Number.isInteger(current)?Math.max(current,level):level;
   }
  }
 }
 if(result.swapped){
  state.flags=isRecord(state.flags)?state.flags:{};
  state.flags.retiredHelmetNotice=`투구 정리로 보안면 헬멧 ${result.swapped}개를 ${ITEMS[next]?.name??'학과 영웅 투구'}(으)로 바꿨습니다.`;
 }
 return result;
}

export function migrateSave(state){
 if(state.version===1){
  state.version=2;
  state.quests={homeroom:false,tour:{}};
  state.growth={xp:0,granted:[],pending:[]};state.armor=null;
  for(const key of Object.keys(state.flags))if(key.startsWith('life:')||key==='bossStarted'||key==='bossSpawned')delete state.flags[key];
  state.story={bossDefeated:false,ended:false};
  state.monsters=state.monsters.filter(m=>m.kind!=='boss');state.npcs=[];
  delete state.flags.simulationInitialized;
  if(state.scene==='main')Object.assign(state.player,mainSpawn(state.returnEntrance?.doorId));
  if(state.time>=1110)state.time=490;
 }
 if(state.version===2){
  // 2 → 3: 장비 5칸 → 3칸. 장갑·신발 정리는 SaveService.parse() 가 검증 전에 이미 끝냈다.
  // 여기서 한 번 더 부르는 것은 다른 경로로 들어온 상태를 위한 안전망이다(이미 정리됐으면 아무 일도 없다).
  retireGlovesAndShoes(state);
  state.version=3;
 }
 if(state.version===3){
  // 3 → 4: 무기 10종 개편. 옛 무기 교환도 SaveService.parse() 가 검증 전에 이미 끝냈다(여기는 안전망).
  replaceRetiredWeapons(state);
  state.version=4;
 }
 if(state.version===4){
  // 4 → 5: 강화 재료 → 충공 코인. 전환도 SaveService.parse() 가 검증 전에 이미 끝냈다(여기는 안전망 — 이미 끝났으면 0개).
  convertMaterialsToCoins(state);
  state.version=5;
 }
 if(state.version===5){
  // 5 → 6: 공용 영웅 옷 '현장 조끼' 폐지. 교환도 SaveService.parse() 가 검증 전에 이미 끝냈다(여기는 안전망).
  replaceRetiredArmor(state);
  state.version=6;
 }
 if(state.version===6){
  // 6 → 7: 공용 영웅 투구 '보안면 헬멧' 폐지. 교환도 SaveService.parse() 가 검증 전에 이미 끝냈다(여기는 안전망).
  replaceRetiredHelmet(state);
  state.version=7;
 }
 if(state.version===7){
  // 7 → 8(Revision 81): 강화 단계를 장비 '종류'(flags['upgrade:id'])가 아니라 가방의 장비 '개체'마다 저장한다.
  // 옛 단계는 그 종류의 개체 하나에만 옮긴다 — 입고 있던 개체가 먼저, 없으면 가방의 첫 번째(같은 종류 전부에 복사하지 않는다).
  syncGear(state);
  state.version=8;
 }
 return state;
}
