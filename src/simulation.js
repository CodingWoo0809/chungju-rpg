import {prepareBoss} from './boss-combat.js';
import {schoolEnd} from './clock.js';
import { seedNPCs, updateNPCs } from './npc.js';
import { seedBalls, updateBalls } from './physics.js';
import { updateMatch, stopMatch } from './minigame.js';
import { makeMonster, updateCombat, MONSTER_TYPES, onScreen, updateLootFountain, BOSS_LOOT } from './combat.js';
import { clearStatuses } from './ult-status.js';
import { solid, onPitch } from './world.js';
import { getPeriod } from './clock.js';
import { CONFIG } from './config.js';
export { attack } from './combat.js';
export { interactBall, shootBall, releaseBall, heldBall, shotPreview, predictShot, CHARGE_TIME } from './physics.js';
export { toggleMatch, updateMatch } from './minigame.js';

// 학과 몬스터는 자기 학과 건물 주변에만 나온다. 학과마다 열 자리(근접 5 · 원거리 5)다.
// 각 지점은 그 학과 건물 바깥 보도 위이며, 배회 반경을 감안해 건물에서 조금 떨어뜨렸다.
export const SPAWNS=[
 // 건축디자인과 (379,389 ~ 449,509)
 {kind:'golem',x:462,y:430},{kind:'brush',x:400,y:524},{kind:'golem',x:370,y:473},
 {kind:'brush',x:410,y:363},{kind:'golem',x:475,y:506},{kind:'brush',x:353,y:404},
 {kind:'golem',x:469,y:371},{kind:'brush',x:354,y:517},{kind:'golem',x:443,y:536},{kind:'brush',x:456,y:470},
 // 토목시스템과 (391,140 ~ 440,253)
 {kind:'mud',x:455,y:196},{kind:'drone',x:412,y:268},{kind:'mud',x:370,y:125},
 {kind:'drone',x:450,y:116},{kind:'mud',x:381,y:211},{kind:'drone',x:466,y:252},
 {kind:'mud',x:365,y:254},{kind:'drone',x:467,y:155},{kind:'mud',x:384,y:166},{kind:'drone',x:411,y:133},
 // 전기전자과 (275,269 ~ 316,546)
 {kind:'firefly',x:332,y:330},{kind:'android',x:258,y:420},{kind:'firefly',x:330,y:500},
 {kind:'android',x:274,y:256},{kind:'firefly',x:249,y:319},{kind:'android',x:327,y:261},
 {kind:'firefly',x:255,y:564},{kind:'android',x:313,y:559},{kind:'firefly',x:268,y:368},{kind:'android',x:323,y:448},
 // 자동화기계과 (191,341 ~ 239,546)
 {kind:'servo',x:256,y:390},{kind:'cogger',x:174,y:452},{kind:'servo',x:264,y:525},
 {kind:'cogger',x:167,y:556},{kind:'servo',x:165,y:359},{kind:'cogger',x:225,y:569},
 // 자동화기계과가 북쪽으로 40칸 늘어나면서(world.js) 이 출현 자리가 건물 안에 들어가 버려,
 // 같은 학과·같은 거리대를 유지한 채 서쪽 벽 바깥으로만 10칸 옮겼다(서측 cogger 자리들과 같은 열).
 {kind:'servo',x:185,y:314},{kind:'cogger',x:184,y:505},{kind:'servo',x:246,y:469},{kind:'cogger',x:184,y:404}
];
// 학과와 상관없는 중립 몬스터의 자리. 운동장 트랙 · 장성관(체육관) · 승리관(복싱장) · 급식소 주변이다.
// 인조잔디 축구장 안쪽(world.js 의 PITCH)에는 단 한 자리도 두지 않는다.
export const NEUTRAL_SPAWNS=[
 // 운동장 트랙 — 잔디 바깥 우레탄 트랙 위(서쪽·남쪽 직선주로와 동쪽 곡선주로)
 {zone:'track',kind:'hurdle',x:549,y:150},{zone:'track',kind:'whistle',x:549,y:330},
 {zone:'track',kind:'hurdle',x:620,y:394},{zone:'track',kind:'whistle',x:700,y:394},
 {zone:'track',kind:'hurdle',x:736,y:340},{zone:'track',kind:'whistle',x:741,y:96},
 {zone:'track',kind:'hurdle',x:739,y:218},
 // 장성관(체육관) 주변 (590,404 ~ 754,481)
 {zone:'gym',kind:'whistle',x:660,y:507},{zone:'gym',kind:'hurdle',x:766,y:481},
 {zone:'gym',kind:'whistle',x:568,y:476},{zone:'gym',kind:'sandbag',x:763,y:414},
 {zone:'gym',kind:'hurdle',x:563,y:415},{zone:'gym',kind:'whistle',x:715,y:501},
 {zone:'gym',kind:'hurdle',x:608,y:508},
 // 승리관(복싱장) 주변 (205,172 ~ 261,248)
 {zone:'jangseong',kind:'sandbag',x:179,y:173},{zone:'jangseong',kind:'tray',x:273,y:153},
 {zone:'jangseong',kind:'sandbag',x:213,y:248},{zone:'jangseong',kind:'sandbag',x:282,y:203},
 {zone:'jangseong',kind:'tray',x:225,y:158},{zone:'jangseong',kind:'sandbag',x:247,y:250},
 {zone:'jangseong',kind:'tray',x:268,y:180},
 // 급식소 주변 (39,211 ~ 139,264)
 {zone:'cafeteria',kind:'tray',x:23,y:229},{zone:'cafeteria',kind:'sandbag',x:95,y:290},
 {zone:'cafeteria',kind:'tray',x:101,y:201},{zone:'cafeteria',kind:'tray',x:34,y:289},
 {zone:'cafeteria',kind:'sandbag',x:146,y:290},{zone:'cafeteria',kind:'tray',x:150,y:215},
 {zone:'cafeteria',kind:'sandbag',x:146,y:251}
];
// 실제 출현에 쓰는 전체 자리표.
// 순서대로 채우면 앞쪽 구역만 가득 차고 뒤쪽 구역이 텅 비므로,
// 여덟 구역(학과 4 · 중립 4)에서 한 자리씩 번갈아 가져와 섞는다.
const byZone=(list,zoneOf)=>Object.values(list.reduce((m,p)=>{(m[zoneOf(p)]??=[]).push(p);return m;},{}));
export const SPAWN_POINTS=(()=>{
 const groups=[...byZone(SPAWNS,p=>MONSTER_TYPES[p.kind].dept),...byZone(NEUTRAL_SPAWNS,p=>p.zone)];
 const out=[];
 for(let i=0;out.length<SPAWNS.length+NEUTRAL_SPAWNS.length;i++)
  for(const g of groups)if(g[i])out.push(g[i]);
 return out;
})();
export function initSimulation(state){
 state.monsters??=[];state.drops??=[];state.npcs??=[];state.balls??=[];state.flags??={};state.projectiles??=[];
 // 구버전 세이브의 몬스터 종류는 더 이상 없으므로 정리한다(보스는 유지).
 state.monsters=state.monsters.filter(m=>MONSTER_TYPES[m.kind]);
 if(!state.flags.simulationInitialized||state.flags.simulationDay!==state.day){seedNPCs(state);seedBalls(state);stopMatch(state);state.flags.simulationInitialized=true;state.flags.simulationDay=state.day;}
 state.effects=[];
 // Revision 78: R 후속 상태(감전 · 취약 · 구속)는 저장하지 않는 일시 상태 — 불러오면 지운다.
 for(const m of state.monsters)clearStatuses(m);
 // 보스 보상 분출 도중에 저장된 게임이면 남은 보상을 바로 모두 떨어뜨린다(유실 없음).
 if(state.lootFountain){updateLootFountain(state,BOSS_LOOT.seconds+BOSS_LOOT.linger);delete state.lootFountain;}
}
function spawn(state,dt,emit){
 if(state.day===4&&state.time>=schoolEnd(state.day)&&!state.story.bossDefeated&&!state.monsters.some(m=>m.kind==='boss')){
  const boss=makeMonster('boss',640,240);prepareBoss(state,boss);state.monsters.push(boss);emit('운동장에 공명체가 나타났다. 친구들의 응원이 힘이 된다!');
 }
 if(state.day===4&&state.time>=schoolEnd(4)&&state.scene==='campus'&&Math.hypot(state.player.x-640,state.player.y-240)<100)state.flags.bossStarted=true;
 const period=getPeriod(state.time,state.day);
 if(state.story.bossDefeated)return;                              // 축하 파티 중에는 소동이 없다
 if(state.time<CONFIG.dayStart)return;
 state.flags.spawnTimer=(state.flags.spawnTimer??CONFIG.spawnFirstSeconds)-dt;
 const alive=state.monsters.filter(m=>m.kind!=='boss').length;
 if(state.flags.spawnTimer>0||alive>=CONFIG.maxMonsters)return;
 state.flags.spawnTimer=period.type==='afterSchool'?CONFIG.spawnAfterSchoolSeconds:CONFIG.spawnClassSeconds;
 // 비어 있을수록 한 번에 여러 자리를 채운다. 한 구역을 정리하고 나면 금세 다시 찬다.
 const budget=Math.min(CONFIG.spawnBurst,Math.max(1,Math.ceil((CONFIG.maxMonsters-alive)/3)));
 const start=state.flags.spawnIndex||0;
 let placed=0;
 for(let i=0;i<SPAWN_POINTS.length&&placed<budget;i++){
  const index=(start+i)%SPAWN_POINTS.length,p=SPAWN_POINTS[index];
  if(onPitch(p))continue;                                          // 인조잔디 축구장 안에는 절대 세우지 않는다
  if(state.scene==='campus'&&!spawnable(state,p))continue;
  if(solid(p,'campus',3)||state.monsters.some(m=>Math.hypot(m.x-p.x,m.y-p.y)<CONFIG.spawnSpacing))continue;
  state.monsters.push(makeMonster(p.kind,p.x,p.y));
  state.flags.spawnIndex=(index+1)%SPAWN_POINTS.length;
  placed++;
 }
}
// 눈앞에서 몬스터가 툭 튀어나오지 않을 정도만 막는다.
// 예전에는 '화면에 보이는 곳 전부'를 막아서, 한 자리에 서 있으면 그 주변이 영원히 비어 있었다.
// 이제는 플레이어 바로 근처(spawnMinDistance)와 화면 한가운데(spawnScreenGuard)만 피한다.
export function spawnable(state,p){
 if(Math.hypot(p.x-state.player.x,p.y-state.player.y)<CONFIG.spawnMinDistance)return false;
 // spawnScreenGuard 는 화면 '전체'에 대한 비율이라 반화면 기준으로는 두 배가 된다.
 return !onScreen(state,p,CONFIG.spawnScreenGuard*2);
}
export function updateSimulation(state,dt,emit=()=>{}){
 const elapsed=Math.max(0,Math.min(dt,.25));
 updateNPCs(state,elapsed);spawn(state,elapsed,emit);
 for(let left=elapsed;left>0;left-=1/60){const step=Math.min(left,1/60);updateCombat(state,step,emit);updateBalls(state,step,emit);updateMatch(state,step,emit);}
}
