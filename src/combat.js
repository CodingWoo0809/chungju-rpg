import {attackHitRatio} from './weapon-motion.js';
import {facingBucket} from './player-sprite.js';
import {weaponMotion} from './inventory.js';
import {STRIKE_LIFE,Q_LIFE,R_LIFE} from './combat-vfx.js';
import {isAdminState} from './admin-mode.js';
const pendingAttacks=new WeakMap();
import {progression, ULTIMATES} from './growth.js';
import { moveBody, solid, onPitch } from './world.js';
import {noteNeutralAttack,updateNeutralPose} from './neutral-pose.js';
import { gain, weaponStats, ITEMS, WEAPON_STYLES, addItem } from './inventory.js';
import { COIN_ID, rollCoinCount } from './enhancement.js';
import {applyUltimateStatus,tickStatuses,clearStatuses,playerDamageMultiplier,isRooted} from './ult-status.js';
import {qDamageMultiplier,qCooldownMultiplier,ultimateEmpowered,RESONANCE} from './dept-resonance.js';
import { updateBoss, damagePlayer, bossDamage, bossHpCap } from './boss-combat.js';
import { interactBall } from './physics.js';
import { COMBAT, MONSTER_AI, CONFIG } from './config.js';

// 몬스터 체력의 기준. hits = "보통 등급 무기로 몇 대 맞아야 쓰러지는가" 이고,
// 체력은 전부 (보통 무기 한 대의 피해량 × hits) 로 잡는다.
// 무기 공격력이 보통 : 희귀 : 레전드 = 1 : 1.25 : 2 라서 같은 몬스터가
// 희귀 무기로는 약 8대, 레전드 무기로는 약 5대에 쓰러진다.
const commonPower=(()=>{
 const list=Object.keys(WEAPON_STYLES).filter(id=>ITEMS[id]?.rarity==='보통');
 return list.reduce((sum,id)=>sum+ITEMS[id].power,0)/list.length;
})();
export const REFERENCE_HIT=(COMBAT.baseAttack+commonPower)*COMBAT.damageScale;
const hp=hits=>Math.round(hits*REFERENCE_HIT);

// 학과 약칭. 이름표 앞 [ ] 안에 붙고, 색은 그 학과 건물 색을 따른다.
export const DEPT_TAG={
 architecture:{short:'건디',color:'#b59172'},
 civil:{short:'토목',color:'#8fc0b6'},
 electric:{short:'전기',color:'#7fb0c2'},
 machine:{short:'자기',color:'#c8b86b'}
};
// 학과에 속하지 않는 중립 몬스터의 이름표. 운동장·장성관·승리관·급식소 주변에 산다.
export const NEUTRAL_TAG={short:'중립',color:'#cdd6c2'};
// 학과마다 근접 1 · 원거리 1. reach 는 근접 사거리, shot 은 원거리 투사체 설정이다.
export const MONSTER_TYPES={
 // 건축디자인과 — 도면과 모형에서 빠져나온 것들
 golem:{name:'벽돌 골렘',dept:'architecture',attack:'melee',hits:12,hp:hp(12),speed:6,damage:11,color:'#b98d68',drop:COIN_ID,
  ai:{wanderRadius:15,aggroDuration:9},reach:10,windup:.95},
 brush:{name:'붓 도깨비',dept:'architecture',attack:'ranged',hits:8,hp:hp(8),speed:11,damage:7,color:'#d8a0b4',drop:COIN_ID,
  ai:{wanderRadius:30,aggroDuration:6},shot:{range:COMBAT.qRange,speed:34,radius:2.6,windup:.75,cool:1.9,color:'#d8657f',trail:'#f0b6c4',kind:'blob'}},
 // 토목시스템과 — 흙과 측량 장비
 mud:{name:'측점 파수기',dept:'civil',attack:'melee',hits:11,hp:hp(11),speed:7,damage:10,color:'#8a7551',drop:COIN_ID,
  ai:{wanderRadius:18,aggroDuration:8},reach:9,windup:.8},
 drone:{name:'잠자리 드론',dept:'civil',attack:'ranged',hits:8,hp:hp(8),speed:13,damage:6,color:'#9fc4bd',drop:COIN_ID,
  ai:{wanderRadius:36,aggroDuration:5.5},shot:{range:COMBAT.qRange,speed:46,radius:2.2,windup:.6,cool:1.7,color:'#4fb3a2',trail:'#bdf0e4',kind:'beam'}},
 // 전기전자과 — 지금까지의 빛나는 몬스터를 이어받는다
 firefly:{name:'전기 반딧불',dept:'electric',attack:'melee',hits:9,hp:hp(9),speed:14,damage:7,color:'#ddcd70',drop:COIN_ID,
  ai:{wanderRadius:34,aggroDuration:6},reach:8,windup:.55},
 android:{name:'고장난 엘리베이터',dept:'electric',attack:'ranged',hits:10,hp:hp(10),speed:8,damage:9,color:'#8fb6cc',drop:COIN_ID,
  ai:{wanderRadius:22,aggroDuration:7},shot:{range:COMBAT.qRange,speed:62,radius:2,windup:.85,cool:2.2,color:'#63d0f5',trail:'#d6f4ff',kind:'laser'}},
 // 자동화기계과 — 공정 라인에서 굴러 나온 것들
 servo:{name:'난폭한 카트',dept:'machine',attack:'melee',hits:11,hp:hp(11),speed:9,damage:10,color:'#c2a94f',drop:COIN_ID,
  ai:{wanderRadius:20,aggroDuration:8},reach:9,windup:.7},
 cogger:{name:'절삭 포탑',dept:'machine',attack:'ranged',hits:9,hp:hp(9),speed:6,damage:8,color:'#a9a08a',drop:COIN_ID,
  ai:{wanderRadius:14,aggroDuration:7.5},shot:{range:COMBAT.qRange,speed:30,radius:3,windup:.7,cool:1.8,color:'#c8ab52',trail:'#efdba4',kind:'cog'}},
 // ── 중립 몬스터 4종 ─────────────────────────────────────
 // 학과 건물이 아니라 운동장 트랙 · 장성관(체육관) · 승리관(복싱장) · 급식소 주변에 산다.
 // 학과 몬스터와 똑같이 비선공형이다: 배회하다가 맞으면 쫓고, 시간·거리로 포기하고 제자리로 돌아간다.
 hurdle:{name:'허들 도깨비',dept:null,neutral:true,attack:'melee',hits:9,hp:hp(9),speed:12,damage:8,color:'#e6dfcd',drop:COIN_ID,
  ai:{wanderRadius:28,aggroDuration:6},reach:10,windup:.6},
 whistle:{name:'호루라기 정령',dept:null,neutral:true,attack:'ranged',hits:7,hp:hp(7),speed:10,damage:6,color:'#dceaf0',drop:COIN_ID,
  ai:{wanderRadius:26,aggroDuration:5.5},shot:{range:COMBAT.qRange,speed:38,radius:3,windup:.7,cool:1.8,color:'#8fd0e4',trail:'#eaf9ff',kind:'ring'}},
 sandbag:{name:'샌드백 장수',dept:null,neutral:true,attack:'melee',hits:12,hp:hp(12),speed:7,damage:11,color:'#9c6a44',drop:COIN_ID,
  ai:{wanderRadius:16,aggroDuration:8},reach:9,windup:.85},
 tray:{name:'식판 요정',dept:null,neutral:true,attack:'ranged',hits:8,hp:hp(8),speed:11,damage:7,color:'#bcc7cc',drop:COIN_ID,
  ai:{wanderRadius:30,aggroDuration:5},shot:{range:COMBAT.qRange,speed:40,radius:3.2,windup:.65,cool:1.9,color:'#c3d0d6',trail:'#f4f8f9',kind:'disc'}},
 boss:{name:'운동장의 공명체',dept:null,attack:'melee',hp:260,speed:9,damage:17,color:'#be779c',drop:COIN_ID}
};
// 어떤 지점이 플레이어 화면 안에 들어오는지. 출현 금지 구역과 추적 유지 판정이 같은 식을 쓴다.
// scale 1 = 화면 그대로, 2 = 화면의 두 배 범위.
export function onScreen(state,p,scale=1){
 const dx=p.x-state.player.x,dy=p.y-state.player.y;
 const {width=1280,height=800,zoom=CONFIG.zoom}=state.viewport||{};
 return Math.abs(.8*(dx-dy)*zoom)<width/2*scale&&Math.abs(.42*(dx+dy)*zoom)<height/2*scale;
}
// 이름표에 쓰는 표기. 중립은 [중립], 보스는 학과가 없어 이름만 나온다.
export function monsterTag(kind){
 const t=MONSTER_TYPES[kind];
 if(!t)return null;
 return t.dept?DEPT_TAG[t.dept]||null:(t.neutral?NEUTRAL_TAG:null);
}
export function monsterDisplayName(m){
 if(['mud','drone','firefly','android','servo','cogger'].includes(m?.kind))return MONSTER_TYPES[m.kind].name;
 return m?.name||MONSTER_TYPES[m?.kind]?.name||'';
}
// ── 몸체 판정 반경(Revision 82) ─────────────────────────────
// 최고 기술(R)이 '몸의 일부라도 원에 닿았는지' 볼 때 쓰는 원통 판정 반경(월드 단위). 이동 충돌 반경(m.radius 3 · 보스 7)과 따로다.
// 값은 실제 그림의 불투명 실루엣 가로 반폭(투명 여백 · 반투명 그림자 제외, 네 방향 중 최대)을 월드 단위로 바꾼 뒤
// 팔 · 날개 끝 같은 가는 끝부분을 빼고 80% 로 잡았다(고장난 엘리베이터 7.4 → 6, 잠자리 드론 7.9 → 6, 공명체 11.1 → 9).
// 날아다니는 드론도 발밑(그림자) 기둥 기준으로 똑같이 잰다 — 비행이라고 빠지지 않는다.
export const HIT_RADIUS=Object.freeze({golem:5.5,brush:4.5,mud:4,drone:6,firefly:5,android:6,servo:5.5,cogger:6.5,
 hurdle:4,whistle:4,sandbag:3.5,tray:4.5,boss:9});
export function hitRadius(m){return Math.max(m?.radius||0,HIT_RADIUS[m?.kind]??0);}
// 종족별 덮어쓰기를 얹은 AI 값. 나중에 몬스터를 늘려도 MONSTER_TYPES 한 줄로 조절된다.
export function monsterAI(kind){return {...MONSTER_AI,...(MONSTER_TYPES[kind]?.ai||{})};}
export function makeMonster(kind,x,y,scene='campus',id=`${kind}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`){
 const t=MONSTER_TYPES[kind];
 return{id,kind,name:t.name,x,y,hp:t.hp,maxHp:t.hp,radius:kind==='boss'?7:3,color:t.color,
  phase:kind==='boss'?'idle':'wander',timer:0,scene,
  // 화면 가장자리에 나타나도 툭 튀어나온 느낌이 없도록 잠깐 서서히 또렷해진다.
  fade:kind==='boss'?0:CONFIG.spawnFade,
  home:{x,y},aggro:0,pause:Math.random()*1.5,wanderX:x,wanderY:y};
}
// ── 일반 몬스터 드롭(Revision 78) ─────────────────────────────
// 한 마리마다: 상점 포인트 1점(확정) + 충공 코인 1~3개(rollCoinCount, 1개짜리 pickup 을 수만큼) + 장비 판정 '단 1회'.
// 장비 판정 rollEquipmentDrop: ① 첫 번째 난수로 등급 하나(레전드 1% · 영웅 5% · 희귀 10% · 보통 15% · 없음 69%)
//                              ② 장비가 나오면 두 번째 난수로 무기 · 옷 · 투구 중 하나(각 1/3).
// 그래서 한 마리에서 장비는 많아야 1개다(예: 보통 무기 5% · 보통 옷 5% · 보통 투구 5%). 칸마다 따로 굴리지 않는다.
// 보통 · 희귀는 공용 1종, 영웅 · 레전드는 그 몬스터의 학과 장비(중립 몬스터는 플레이어 학과). 보스는 아래 bossLoot 를 쓴다.
// 난수는 lootRng(테스트에서 setLootRng 로 고정) — 순서: 코인 수 → 장비 등급 → (나오면) 장비 칸.
export const GEAR_DROP_RATES=Object.freeze([['레전드',.01],['영웅',.05],['희귀',.10],['보통',.15]]);
export const DROP_SLOTS=Object.freeze(['weapon','armor','helmet']);
const HERO_ARMOR_BY_DEPT={architecture:'draftMantle',machine:'servoVest',electric:'arcJacket',civil:'strataCoat'};
export function dropGearFor(slot,rarity,dept){
 if(slot==='armor'&&rarity==='영웅')return HERO_ARMOR_BY_DEPT[dept]||null;
 const pool=Object.entries(ITEMS).filter(([,it])=>it.type==='gear'&&it.slot===slot&&it.rarity===rarity);
 const match=pool.find(([,it])=>it.department===dept)||pool.find(([,it])=>!it.department);
 return match?.[0]||null;
}
export function rollEquipmentDrop(rng=Math.random){
 const r=rng();let edge=0,rarity=null;
 for(const [name,chance] of GEAR_DROP_RATES){edge=Math.round((edge+chance)*1e6)/1e6;if(r<edge){rarity=name;break;}}   // 누적 경계를 반올림해 .01+.05 같은 부동소수 오차를 없앤다
 if(!rarity)return null;
 const slot=DROP_SLOTS[Math.min(DROP_SLOTS.length-1,Math.floor(rng()*DROP_SLOTS.length))];
 return {rarity,slot};
}
// 몬스터가 죽은 자리에서 아이템이 살짝 튀어나오도록 흩뿌린다.
function dropAt(state,m,index,total,itemId,quantity,id){
 const angle=index/Math.max(1,total)*Math.PI*2+m.x*.11,spread=4.2+(index%2)*.9;
 state.drops.push({id,itemId,quantity,scene:m.scene,
  x:m.x+Math.cos(angle)*spread,y:m.y+Math.sin(angle)*spread,
  fromX:m.x,fromY:m.y,pop:.55,popFull:.55});
}
// ── 보스 처치 보상(Revision 78) — 일반 드롭 표를 쓰지 않는다 ─────────────
// 상점 포인트 1점짜리 50개 · 충공 코인 1개짜리 50개 · 영웅 장비 3개 · 레전드 장비 3개(총 106개).
// 영웅 · 레전드는 네 학과 × 무기 · 옷 · 투구 12종 풀에서 각각 서로 다른 3종(같은 item id 없음). 학과 제한 없음.
// 한 프레임에 한꺼번에 만들지 않고 state.lootFountain 대기열에 넣어 약 1초 동안 여러 방향으로 쏟아낸다(updateLootFountain).
// 대기열은 보스 객체가 아니라 state 에 있어 보스가 사라지거나 축하 파티로 넘어가도(main.js 는 분출이 끝난 뒤 시작) 유실되지 않는다.
export const BOSS_LOOT=Object.freeze({points:50,coins:50,hero:3,legend:3,seconds:1,linger:.6,radius:22});
export function bossGearPool(rarity){
 return Object.entries(ITEMS).filter(([,it])=>it.type==='gear'&&it.rarity===rarity).map(([id])=>id).sort();
}
export function pickDistinct(pool,count,rng=Math.random){
 const left=[...pool],out=[];
 while(out.length<count&&left.length)out.push(left.splice(Math.min(left.length-1,Math.floor(rng()*left.length)),1)[0]);
 return out;
}
export function bossLoot(rng=Math.random){
 const gear=[...pickDistinct(bossGearPool('레전드'),BOSS_LOOT.legend,rng),...pickDistinct(bossGearPool('영웅'),BOSS_LOOT.hero,rng)];
 const list=[];
 for(let i=0;i<BOSS_LOOT.points+BOSS_LOOT.coins;i++)list.push(i%2?COIN_ID:'shopPoint');
 // 장비는 분출 중간중간에 끼워 넣는다(레전드 · 영웅 번갈아)
 const order=[gear[0],gear[3],gear[1],gear[4],gear[2],gear[5]];
 order.forEach((id,k)=>list.splice(Math.round((k+1)*list.length/(order.length+1)),0,id));
 return list;
}
function startLootFountain(state,m,rng){
 state.lootFountain={id:m.id,x:m.x,y:m.y,scene:m.scene,items:bossLoot(rng),spawned:0,elapsed:0};
 state.effects??=[];state.effects.push({kind:'loot-burst',x:m.x,y:m.y,scene:m.scene,life:1.2,full:1.2});
}
// 보상이 떨어질 자리: 사망 지점에서 황금각 나선으로 퍼지되, 벽 · 건물 · 맵 밖(solid)이면 사망 지점 쪽으로 당긴다.
function safeLootSpot(f,index){
 const angle=index*2.39996+f.x*.07,r=5+(index%13)/13*(BOSS_LOOT.radius-5);
 for(let k=r;k>=0;k-=1.5){const p={x:f.x+Math.cos(angle)*k,y:f.y+Math.sin(angle)*k};if(!solid(p,f.scene,1.6))return p;}
 return {x:f.x,y:f.y};
}
export function updateLootFountain(state,dt){
 const f=state.lootFountain;if(!f)return;
 f.elapsed+=dt;
 const due=f.elapsed>=BOSS_LOOT.seconds?f.items.length:Math.min(f.items.length,Math.ceil(f.items.length*f.elapsed/BOSS_LOOT.seconds));
 state.drops??=[];
 while(f.spawned<due){
  const i=f.spawned++,itemId=f.items[i],p=safeLootSpot(f,i),gear=ITEMS[itemId]?.type==='gear';
  state.drops.push({id:`bossloot-${f.id}-${i}`,itemId,quantity:1,scene:f.scene,x:p.x,y:p.y,fromX:f.x,fromY:f.y,
   pop:gear?.8:.55,popFull:gear?.8:.55,lift:12,arc:gear?13:8+(i%5),bossLoot:true});
 }
 if(f.spawned>=f.items.length&&f.elapsed>=BOSS_LOOT.seconds+BOSS_LOOT.linger)delete state.lootFountain;
}
// 충공 코인 · 상점 포인트는 F 로 하나를 주우면 가까이(CURRENCY_GATHER) 흩어진 같은 종류들도 함께 줍는다(보스 보상 106개 대비).
export const CURRENCY_GATHER=8;
export function gatherDrops(state,target){
 const currency=id=>id==='shopPoint'||id===COIN_ID;
 const near=currency(target.itemId)?state.drops.filter(o=>o.id!==target.id&&o.scene===target.scene&&currency(o.itemId)&&Math.hypot(o.x-target.x,o.y-target.y)<=CURRENCY_GATHER):[];
 const got={};
 for(const o of [target,...near]){
  if(!state.drops.some(x=>x.id===o.id))continue;
  if(!addItem(state,o.itemId,o.quantity||1))break;
  state.drops=state.drops.filter(x=>x.id!==o.id);got[o.itemId]=(got[o.itemId]||0)+(o.quantity||1);
 }
 return got;
}
// 드롭 판정에 쓰는 난수(테스트에서 setLootRng 로 바꿔 끼운다).
let lootRng=Math.random;
export function setLootRng(rng=Math.random){lootRng=typeof rng==='function'?rng:Math.random;}
function defeated(state,m,emit){
 if(m.defeated)return; m.defeated=true;clearStatuses(m);
 state.stats.kills++;gain(state,'combat',m.kind==='boss'?30:4);
 if(m.kind==='boss'){
  startLootFountain(state,m,lootRng);
  state.story.bossDefeated=true;emit('공명체가 빛으로 흩어졌다. 보상이 쏟아진다! 모두의 목소리가 들린다!');
  return;
 }
 const loot=[[`point-${m.id}`,'shopPoint',1]];
 const coins=rollCoinCount(lootRng);
 for(let i=0;i<coins;i++)loot.push([`coin-${m.id}-${i}`,COIN_ID,1]);
 const gear=rollEquipmentDrop(lootRng);
 if(gear){const id=dropGearFor(gear.slot,gear.rarity,MONSTER_TYPES[m.kind]?.dept||state.department);if(id)loot.push([`${gear.slot}-${m.id}`,id,1]);}
 loot.forEach(([id,itemId,quantity],i)=>dropAt(state,m,i,loot.length,itemId,quantity,id));
 emit(`${monsterDisplayName(m)} 정리!`);
}
// 플레이어가 때렸을 때만 적대로 전환한다(비선공). 다시 맞으면 추적 시간이 초기화된다.
export function provoke(m){
 if(m.kind==='boss')return;
 const ai=monsterAI(m.kind);
 m.aggro=ai.aggroDuration;
 if(!['windup','recover'].includes(m.phase))m.phase='chase';
}
// ── 원거리 몬스터의 투사체 ────────────────────────────────
// 실제로 날아가는 물체라 옆으로 걷거나 Space 회피로 피할 수 있고, 벽에 막히면 사라진다.
function fireShot(state,m,shot){
 state.projectiles??=[];
 const t=MONSTER_TYPES[m.kind];
 state.projectiles.push({
  id:`shot-${m.id}-${Math.round(state.time*100)}-${state.projectiles.length}`,
  kind:shot.kind,scene:m.scene,source:monsterDisplayName(m),damage:t.damage,
  ...(m.kind==='drone'?{visual:'tornado'}:m.kind==='brush'?{visual:'brushPaint'}:m.kind==='android'?{visual:'elevatorBeam'}:m.kind==='cogger'?{visual:'metalChip'}:{}),
  x:m.x+m.aimX*3.2,y:m.y+m.aimY*3.2,
  vx:m.aimX*shot.speed,vy:m.aimY*shot.speed,
  radius:shot.radius,color:shot.color,trail:shot.trail,
  life:shot.range/shot.speed,spin:0
 });
 state.effects??=[];
 state.effects.push({kind:'muzzle',visual:m.kind==='brush'?'brushPaint':m.kind==='cogger'?'metalChip':undefined,x:m.x+m.aimX*3.2,y:m.y+m.aimY*3.2,scene:m.scene,
  aim:{x:m.aimX,y:m.aimY},color:shot.color,radius:shot.radius,life:.18});
}
export function updateProjectiles(state,dt,emit){
 const live=[];
 for(const p of state.projectiles||[]){
  p.life-=dt;p.spin=(p.spin||0)+dt*9;
  if(p.life<=0)continue;
  const step={x:p.x+p.vx*dt,y:p.y+p.vy*dt};
  if(p.scene===state.scene&&solid(step,p.scene,p.radius*.5)){      // 벽·건물에 맞으면 터지며 사라진다
   state.effects??=[];state.effects.push({kind:'burst',x:p.x,y:p.y,scene:p.scene,color:p.color,radius:p.radius,life:.22});
   continue;
  }
  p.x=step.x;p.y=step.y;
  if(p.scene===state.scene&&state.player.hp>0&&Math.hypot(p.x-state.player.x,p.y-state.player.y)<p.radius+2.4){
   damagePlayer(state,p.damage,p.source,emit);
   state.effects??=[];state.effects.push({kind:'burst',x:p.x,y:p.y,scene:p.scene,color:p.color,radius:p.radius+1,life:.26});
   continue;
  }
  live.push(p);
 }
 state.projectiles=live;
}
// 한 대 맞은 티가 나도록: 백색 플래시 · 잠깐 멈춤 · 뒤로 밀렸다 돌아오는 반동.
function react(m,dir,strength=1){
 m.flash=COMBAT.flash;
 m.hitstop=COMBAT.hitstop;
 m.recoil=COMBAT.recoil;m.recoilFull=COMBAT.recoil;
 m.recoilX=dir.x*COMBAT.recoilDistance*strength;
 m.recoilY=dir.y*COMBAT.recoilDistance*strength;
}
// R 최고 기술 한 방의 위력(2026-09-28 밸런스). power = 기본 공격력 + 무기 공격력(강화 포함) + 전투 숙련 보정.
// 예전에는 학과 기본 위력(100~150)이 고정이라, 레전드 +7 무기의 Q 공명 타격(100~155)보다 약해질 수 있었다.
// Revision 78: Q 최저선도 학과 기본 위력 비율을 따른다(ultimateOverQ × power/ultimateTopPower) — 같은 장비 · 숙련이면 늘 자동화기계과가 가장 세다.
// 자동화기계과 150(Q×3) · 전기전자과 125(Q×2.5) · 건축디자인과 120(Q×2.4) · 토목시스템과 115(Q×2.3). 기계과 외 학과는 대신 후속 효과(ult-status.js)가 붙는다.
export function ultimateDamage(ultimate,power,weapon){
 const q=power*COMBAT.damageScale*COMBAT.qPower*(weapon?.resonance||1);
 const overQ=COMBAT.ultimateOverQ*ultimate.power/COMBAT.ultimateTopPower;
 return Math.round(Math.max(ultimate.power*Math.max(1,power/COMBAT.ultimateAttackRef),q*overQ));
}
export function attack(state,kind,aim,emit=()=>{}){
 if(state.player.hp<=0)return false;
 if(!['light','heavy','q','e','r'].includes(kind))return false;
 // 관리자 모드(admin-mode.js)는 탐방 · 숙련 없이 Q · R 을 쓸 수 있다. 쿨타임 · 위력은 똑같이 적용된다.
 const admin=isAdminState(state);
 if(kind==='r'&&!admin&&!progression(state).ultimate){emit('R 최고 기술은 학교 탐방 8곳을 완료하면 해금됩니다.');return false;}
 if(kind==='r'&&state.player.rCooldown>0){emit('최고 기술을 준비하는 중입니다.');return false;}
 if(kind==='q'&&!admin&&state.proficiencies.combat<5){emit('Q 공명파는 전투 숙련도 5에 해금됩니다.');return false;}
 if(kind==='e'&&state.proficiencies.life<10){emit('E 회복은 생활 숙련도 10에 해금됩니다.');return false;}
 if(kind==='e'){
  if(state.player.eCooldown>0){emit('회복을 준비하는 중입니다.');return false;}
  if(state.player.hp>=state.player.maxHp){emit('이미 체력이 가득합니다.');return false;}
  state.player.hp=Math.min(state.player.maxHp,state.player.hp+20);state.player.eCooldown=8;
  state.effects??=[];state.effects.push({x:state.player.x,y:state.player.y,scene:state.scene,kind:'heal',radius:14,life:.7});emit('숨을 고르며 체력 +20');return true;
 }
 if(kind==='q'&&state.player.qCooldown>0){emit('공명파를 준비하는 중입니다.');return false;}
 if(state.player.attackCooldown>0)return false;
 if((kind==='light'||kind==='heavy')&&state.balls.some(b=>b.held))return interactBall(state,emit);
 const weapon=weaponStats(state),ultimate=ULTIMATES[state.department];
 // 최고 기술의 부가 효과는 학과 이름이 아니라 ULTIMATES 표를 그대로 읽는다.
 if(kind==='r'){state.player.rCooldown=18;
  if(ultimate.heal)state.player.hp=Math.min(state.player.maxHp,state.player.hp+ultimate.heal);
  if(ultimate.shield)state.player.shield=ultimate.shield;
  emit(ultimate.name+'!');}
 state.player.attackCooldown=kind==='heavy'?weapon.cooldown*2.5:weapon.cooldown;
 if(kind==='q')state.player.qCooldown=COMBAT.qCooldown*qCooldownMultiplier(state);   // 학과 공명 2/3: × 0.9(Revision 79)
 const length=Math.hypot(aim.x,aim.y)||1,dir={x:aim.x/length,y:aim.y/length};state.player.facing=dir;
 const range=kind==='r'?ultimate.radius:kind==='q'?COMBAT.qRange:weapon.range+(kind==='heavy'?3:0);
 const skill=(state.proficiencies.combat||0)/12,power=COMBAT.baseAttack+weapon.power+skill;
 // 공격이 느려진 만큼 한 대의 위력을 같은 비율로 올린다. 초당 피해량은 이전과 같고 숫자만 커진다.
 const damage=kind==='r'?ultimateDamage(ultimate,power,weapon):power*COMBAT.damageScale*(kind==='heavy'?1.8:kind==='q'?COMBAT.qPower*weapon.resonance:1);
 // 모션은 쿨타임보다 짧게 끝내 다음 입력까지 아주 짧은 템포가 생긴다. impact 은 타격이 꽂히는 지점.
 // 상한(.55초)도 공격속도로 나눠, 영웅·레전드 공격속도가 오르면 판정 간격과 모션 길이가 같은 비율로 줄게 한다(공격속도 1 이면 예전과 같다).
 const motionCap=state.equipment?.startsWith('civil-') ? .78 : .55;
 const motion=Math.min(motionCap/(weapon.attackSpeed||1),state.player.attackCooldown*COMBAT.recoveryRatio);
 state.player.attackAnimation={kind,equipment:state.equipment,aim:dir,duration:motion,remaining:motion,impact:motion*attackHitRatio(weaponMotion(state.equipment),facingBucket(dir),state.equipment)};
 const strike={kind,dir,range,damage,weapon,ultimate,scene:state.scene,equipment:state.equipment,animation:state.player.attackAnimation};
 if(kind==='light'||kind==='heavy')pendingAttacks.set(state.player,strike);
 else {pendingAttacks.delete(state.player);resolvePlayerStrike(state,strike,emit);}
 return true;
}
// R 최고 기술의 살아 있는 판정 원(Revision 82). 연출 효과 객체 → {판정 정보, 이미 맞은 몬스터}.
// 저장하지 않는다(WeakMap) — 불러온 뒤에는 남은 연출만 보이고 새 피해는 없다.
const liveUltimates=new WeakMap();
export const R_ACTIVE=R_LIFE*COMBAT.rActiveRatio;                   // 지면 원이 흐려지기 전까지(초)
// R 원과 몬스터 몸체(원통, hitRadius)가 겹치는지. 중심 거리 ≤ R 반경 + 몸체 반경. 비행 · 대형 · 보스 모두 같은 식이다.
export function ultimateTouches(zone,m){return Math.hypot(m.x-zone.x,m.y-zone.y)<=zone.radius+hitRadius(m);}
// 한 몬스터에게 한 번 친다. 맞았으면 true. ctx.ox/oy 는 판정 원의 중심(R 은 쓴 자리에 고정, 나머지는 플레이어).
function strikeMonster(state,m,ctx,emit){
 const {kind,dir,range,damage,weapon,ultimate,equipment,empowered,resonance,ox,oy}=ctx;
 const dx=m.x-ox,dy=m.y-oy,d=Math.hypot(dx,dy);
 if(kind==='r'){
  // R 최고 기술: 그려지는 원(반경 range)과 몸체가 겹치면 맞는다(Revision 82 — 예전에는 모든 몬스터를 반경 3 으로만 봤다).
  if(!ultimateTouches({x:ox,y:oy,radius:range},m))return false;
 }else{
  // Q 공명파는 원 안이면 360° 전부, 평타 · 강공격은 바라보는 방향의 부채꼴. 이동 충돌 반경 그대로(이번에 바꾸지 않음).
  const sweep=kind==='q';
  if(d>range+m.radius||(!sweep&&d>2&&(dx*dir.x+dy*dir.y)/d<.25))return false;
 }
 // 사이에 막힌 곳이 있으면 맞지 않는다 — 평타 · 강공격 · Q 만. 모든 충돌물(낮은 소품 · 가구 포함)이 막는다.
 // R 최고 기술은 시야를 보지 않는다(Revision 82): 지면 원이 건물 · 소품 위까지 그대로 그려지므로 '보이는 원 안이면 맞는다'.
 //   (Revision 81 은 건물 벽 · 캠퍼스 경계만 막았는데, 반경 54 원이 건물 위로 그려진 채 건너편 적이 안 맞는 일이 생겨 뺐다.)
 if(kind!=='r')for(let step=2;step<d;step+=2)if(solid({x:ox+dx/d*step,y:oy+dy/d*step},state.scene,.3))return false;
 const adjusted=bossDamage(m,damage,kind,playerDamageMultiplier(m)*resonance);const dealt=Math.min(m.hp,adjusted);m.hp=Math.max(0,m.hp-adjusted);const hits=++ctx.hits;
 const heavy=kind==='heavy'||kind==='r';
 react(m,dir,heavy?1.5:kind==='q'?1.2:1);
 provoke(m);                                                     // 때린 쪽만 적대로 바뀐다
 state.effects.push({kind:'hit',source:'player',damage:dealt,x:m.x,y:m.y,scene:m.scene,radius:3,
  life:COMBAT.numberLife,seed:(m.x*7+m.y*13+hits*29)%100,critical:heavy,aim:dir});
 state.effects.push({kind:'impact-spark',x:m.x-dx/(d||1)*m.radius,y:m.y-dy/(d||1)*m.radius,scene:m.scene,
  radius:heavy?9:6.5,aim:dir,life:.3,seed:(m.x*3+hits*11)%100,equipment,strike:kind,department:state.department});
 const base=kind==='r'?(ultimate.knockback??weapon.knockback):weapon.knockback*(kind==='heavy'?1.5:1);
 const push=base*(m.kind==='boss'?.35:1);moveBody(m,dir.x*push,dir.y*push,m.scene,m.radius);
 if(kind==='r'&&m.hp>0&&dealt>0)applyUltimateStatus(m,state.department,dealt,empowered);   // 학과별 후속 효과(이번 R 피해에는 소급하지 않는다)
 if(m.hp<=0)defeated(state,m,emit);
 return true;
}
function resolvePlayerStrike(state,{kind,dir,range,damage,weapon,ultimate,equipment},emit){
 // 아래 효과들은 그림(combat-vfx.js)만을 위한 기록이다. 판정 · 피해 · 사거리는 효과 길이와 상관없다.
 const look=kind==='q'?Q_LIFE:kind==='r'?.25:STRIKE_LIFE;
 state.effects??=[];state.effects.push({x:state.player.x,y:state.player.y,scene:state.scene,kind,aim:dir,radius:range,life:look,full:look,source:'player',equipment,department:state.department,seed:Math.round(state.player.x*7+state.player.y*13)%997});
 // 학과 공명(Revision 79): 2/3 이상이면 Q 최종 피해 × 1.10, 3/3 자동화기계과는 R 최종 직접 피해 × 1.15. 구조 취약점 배율과 곱한다.
 const empowered=ultimateEmpowered(state);
 const resonance=kind==='q'?qDamageMultiplier(state):kind==='r'&&empowered&&state.department==='machine'?RESONANCE.machineR:1;
 const ctx={kind,dir,range,damage,weapon,ultimate,equipment,empowered,resonance,ox:state.player.x,oy:state.player.y,hits:0};
 let zone=null;
 if(kind==='r'){
  // 판정 원 = 연출 원: 같은 중심 · 같은 반경(range = COMBAT.rRadius)으로 그린다.
  const fx={kind:'ultimate',department:state.department,x:ctx.ox,y:ctx.oy,scene:state.scene,radius:range,life:R_LIFE,full:R_LIFE,name:ultimate.name};
  state.effects.push(fx);zone={ctx,hit:new Set(),gained:false,scene:state.scene};liveUltimates.set(fx,zone);
 }
 for(const m of state.monsters){
  if(m.scene!==state.scene||m.hp<=0)continue;
  if(strikeMonster(state,m,ctx,emit))zone?.hit.add(m);
 }
 state.monsters=state.monsters.filter(m=>m.hp>0);
 if(ctx.hits){gain(state,'combat',1);if(zone)zone.gained=true;}
 return ctx.hits;
}
// R 을 쓴 뒤 지면 원이 보이는 동안(R_ACTIVE) 원에 들어온 몬스터도 한 번 맞는다. 이미 맞은 몬스터는 다시 맞지 않는다(한 번의 R 에 직접 피해 1회).
// 피해 · 밀치기 방향 · 학과 효과는 쓴 순간의 값 그대로다.
function updateUltimateZones(state,emit){
 for(const e of state.effects||[]){
  const z=liveUltimates.get(e);if(!z)continue;
  if(e.scene!==state.scene||(e.full-e.life)>R_ACTIVE){liveUltimates.delete(e);continue;}
  let struck=0;
  for(const m of state.monsters){
   if(z.hit.has(m)||m.scene!==e.scene||m.hp<=0)continue;
   if(strikeMonster(state,m,z.ctx,emit)){z.hit.add(m);struck++;}
  }
  if(struck){state.monsters=state.monsters.filter(m=>m.hp>0);if(!z.gained){z.gained=true;gain(state,'combat',1);}}
 }
}
// 감전 틱 피해(전기전자과 R). 보스는 형태 전환 중이면 false 를 돌려 그 틱을 미루고, 페이즈 경계 상한(bossHpCap)을 지킨다.
function statusHurt(state,m,amount,emit){
 if(m.hp<=0)return true;
 const dealt=Math.min(m.hp,m.kind==='boss'?bossHpCap(m,amount):amount);
 if(m.kind==='boss'&&m.phase==='shift')return false;
 m.hp=Math.max(0,m.hp-dealt);m.flash=Math.max(m.flash||0,.06);
 state.effects??=[];state.effects.push({kind:'hit',source:'player',shock:true,damage:dealt,x:m.x,y:m.y,scene:m.scene,radius:2,life:COMBAT.numberLife*.8,seed:(m.x*5+state.time*37)%100});
 if(m.hp<=0)defeated(state,m,emit);
 return true;
}
export function updateCombat(state,dt,emit){
 state.player.attackCooldown=Math.max(0,(state.player.attackCooldown||0)-dt);
 state.player.rCooldown=Math.max(0,(state.player.rCooldown||0)-dt);
 state.player.qCooldown=Math.max(0,(state.player.qCooldown||0)-dt);
 state.player.eCooldown=Math.max(0,(state.player.eCooldown||0)-dt);
 state.player.invulnerable=Math.max(0,(state.player.invulnerable||0)-dt);
 supportFriends(state,dt,emit);
 for(const d of state.drops||[])if(d.pop>0)d.pop=Math.max(0,d.pop-dt);
 updateProjectiles(state,dt,emit);
 if(state.player.hp>0)updateUltimateZones(state,emit);
 const frozenPoses=new Set();
 for(const m of state.monsters){
  if((m.hitstop||0)>0)frozenPoses.add(m);
  m.flash=Math.max(0,(m.flash||0)-dt);
  m.recoil=Math.max(0,(m.recoil||0)-dt);
  m.hitstop=Math.max(0,(m.hitstop||0)-dt);
  m.fade=Math.max(0,(m.fade||0)-dt);
  if(m.scene!==state.scene){clearStatuses(m);continue;}             // 다른 장면에 남은 몬스터에게 R 상태가 남지 않게
  if(state.player.hp<=0)continue;
  if(m.status){tickStatuses(m,dt,amount=>statusHurt(state,m,amount,emit));if(m.hp<=0)continue;}
  if(m.kind==='boss'){updateBoss(state,m,dt,emit);continue;}
  if(m.hitstop>0){m.timer-=dt;continue;}                          // 맞은 직후 아주 잠깐 굳는다
  if(isRooted(m)){frozenPoses.add(m);continue;}                    // 토목 R 진흙 구속: 이동 · 공격 없이 제자리
  updateWanderer(state,m,dt,emit);
 }
 if(state.monsters.some(m=>m.hp<=0))state.monsters=state.monsters.filter(m=>m.hp>0);
 updateLootFountain(state,dt);
 for(const m of state.monsters)updateNeutralPose(m,dt,{frozen:frozenPoses.has(m)});
 state.effects=(state.effects||[]).filter(e=>(e.life-=dt)>0);
 advancePlayerAttack(state,dt,emit);
}

export function advancePlayerAttack(state,dt,emit=()=>{}){
 if(state.player.attackAnimation)state.player.attackAnimation.remaining=Math.max(0,state.player.attackAnimation.remaining-dt);
 const strike=pendingAttacks.get(state.player);
 if(strike){
  const a=state.player.attackAnimation;
  if(state.player.hp<=0||state.scene!==strike.scene||state.equipment!==strike.equipment||a!==strike.animation){
   pendingAttacks.delete(state.player);
   if(a===strike.animation)state.player.attackAnimation=null;
  }else if(a.duration-a.remaining+1e-9>=a.impact){
   pendingAttacks.delete(state.player);
   resolvePlayerStrike(state,strike,emit||(()=>{}));
  }
 }
}

// 인조잔디 축구장은 몬스터가 스스로 들어가지 않는 구역이다.
// 자기 자리(home)가 축구장 바깥인 몬스터에게만 걸리고, 쫓아가는 중에는 적용하지 않는다.
function guardsPitch(m){return m.scene==='campus'&&!!m.home&&!onPitch(m.home,4);}
function roam(m,dx,dy,guard){
 const before={x:m.x,y:m.y};
 moveBody(m,dx,dy,m.scene,m.radius);
 if(guard&&onPitch({x:m.x,y:m.y})){m.x=before.x;m.y=before.y;}   // 잔디 안으로 들어가는 한 걸음만 되돌린다
}

// 비선공 몬스터: 평소에는 스폰 지점 주변을 배회하고, 맞았을 때만 일정 시간 추적한다.
// wander → (맞음) → chase/windup → (시간 초과·거리 이탈) → return → wander
// 바닥에 빨간 예고 원은 그리지 않는다. 대신 windup 동안 몬스터가 눈에 띄는 준비 동작을 취한다.
function updateWanderer(state,m,dt,emit){
 const t=MONSTER_TYPES[m.kind],ai=monsterAI(m.kind);
 const ranged=t.attack==='ranged',shot=t.shot;
 const reach=ranged?shot.range:(t.reach??9);
 const dx=state.player.x-m.x,dy=state.player.y-m.y,d=Math.hypot(dx,dy);
 m.timer-=dt;
 m.home??={x:m.x,y:m.y};
 if(m.aggro>0){
  // 한 번 맞으면 화면에서 놓치기 전까지는 계속 따라온다.
  // 화면(1.1배) 안에 보이는 동안은 추적 시간이 계속 초기화되고, 시야를 벗어나야 줄어들기 시작한다.
  if(onScreen(state,m,CONFIG.aggroHoldScreen))m.aggro=ai.aggroDuration;
  else m.aggro=Math.max(0,m.aggro-dt);
  if(m.aggro<=0||d>ai.disengageDistance)m.aggro=0;               // 완전히 놓쳤거나 너무 멀어지면 포기
 }
 if(m.phase==='windup'){                                          // 준비 동작 — 끝나는 순간 실제 공격이 나간다
  m.face={x:m.aimX,y:m.aimY};
  if(m.timer<=0){
   if(ranged)fireShot(state,m,shot);
   else{
    const reachNow=Math.hypot(state.player.x-m.x,state.player.y-m.y);
    if(reachNow<reach+2)damagePlayer(state,t.damage,monsterDisplayName(m),emit);
    state.effects??=[];state.effects.push({x:m.x+m.aimX*reach*.6,y:m.y+m.aimY*reach*.6,scene:m.scene,kind:'swipe',
     radius:reach,aim:{x:m.aimX,y:m.aimY},color:t.color,life:.28});
   }
   noteNeutralAttack(m);
   m.phase='recover';m.timer=ranged?shot.cool:1.1;
  }
  return;
 }
 if(m.phase==='recover'){if(m.timer<=0)m.phase=m.aggro>0?'chase':'return';return;}
 if(m.aggro>0){                                                   // 적대: 사거리에 들면 준비 동작 후 공격
  // 근접은 실제로 맞힐 수 있는 거리(reach+2)에서만 준비 동작에 들어간다.
  // 예전의 reach+4 에서는 닿지 않는 자리에서 헛스윙만 반복하는 몬스터가 나왔다.
  const trigger=ranged?reach:reach+2;
  const tooClose=ranged&&d<16;                                    // 원거리는 너무 붙으면 물러선다
  if(tooClose&&d>0){m.phase='chase';m.face={x:dx/d,y:dy/d};moveBody(m,-dx/d*t.speed*dt,-dy/d*t.speed*dt,m.scene,m.radius);}
  else if(d<trigger&&d>0){
   m.phase='windup';m.timer=ranged?shot.windup:(t.windup??.8);m.windupFull=m.timer;
   m.aimX=dx/d;m.aimY=dy/d;m.face={x:m.aimX,y:m.aimY};
  }
  else if(d<ai.chaseDistance&&d>0){m.phase='chase';m.face={x:dx/d,y:dy/d};moveBody(m,dx/d*t.speed*dt,dy/d*t.speed*dt,m.scene,m.radius);}
  else m.phase='chase';                                           // 추적 범위 밖이면 제자리에서 버틴다
  return;
 }
 const hx=m.home.x-m.x,hy=m.home.y-m.y,hd=Math.hypot(hx,hy);
 const guard=guardsPitch(m);
 if(m.phase==='chase'||m.phase==='return'){                       // 추적 포기 직후: 원래 자리로 복귀
  m.phase='return';
  if(hd<=ai.returnRadius){m.phase='wander';m.pause=ai.pauseMin;m.wanderX=m.x;m.wanderY=m.y;return;}
  // 축구장 안에서 복귀를 시작했다면 먼저 밖으로 나와야 하므로 그때는 막지 않는다.
  roam(m,hx/hd*t.speed*ai.returnSpeed*dt,hy/hd*t.speed*ai.returnSpeed*dt,guard&&!onPitch(m));
  return;
 }
 m.phase='wander';                                                // 평상시: 배회 반경 안을 느리게 돌아다닌다
 if((m.pause||0)>0){m.pause-=dt;return;}
 const wx=(m.wanderX??m.home.x)-m.x,wy=(m.wanderY??m.home.y)-m.y,wd=Math.hypot(wx,wy);
 if(wd<1.5){
  // 축구장 안쪽을 목적지로 뽑지 않는다. 몇 번 더 굴려 보고 안 되면 제자리에 머문다.
  for(let tries=0;tries<6;tries++){
   const angle=Math.random()*Math.PI*2,radius=ai.wanderRadius*(.35+Math.random()*.65);
   const next={x:m.home.x+Math.cos(angle)*radius,y:m.home.y+Math.sin(angle)*radius};
   if(guard&&onPitch(next,4))continue;
   m.wanderX=next.x;m.wanderY=next.y;break;
  }
  m.pause=ai.pauseMin+Math.random()*(ai.pauseMax-ai.pauseMin);
  return;
 }
 const before={x:m.x,y:m.y};
 roam(m,wx/wd*t.speed*ai.wanderSpeed*dt,wy/wd*t.speed*ai.wanderSpeed*dt,guard&&!onPitch(m));
 if(Math.hypot(m.x-before.x,m.y-before.y)<1e-4){m.wanderX=m.x;m.wanderY=m.y;}   // 벽에 막히면 다음 목적지를 새로 뽑는다
}

function supportFriends(state,dt,emit){
 if(state.day!==4||state.time<860||state.scene!=='campus'||state.player.hp<=0)return;
 const boss=state.monsters.find(m=>m.kind==='boss');if(!boss)return;
 state.flags.supportPulse=Math.max(0,(state.flags.supportPulse||0)-dt);
 if(state.flags.supportPulse>0)return;
 for(const npc of state.npcs){
  if(npc.scene!=='campus'||((state.relations[npc.id]||0)<3&&!['teacher','vice'].includes(npc.role))||Math.hypot(npc.x-boss.x,npc.y-boss.y)>160)continue;
  npc.supportTimer=(npc.supportTimer||0)-dt;if(npc.supportTimer>0)continue;npc.supportTimer=8;state.flags.supportPulse=boss.raid?3.5:0;
  state.effects??=[];
  if((npc.department==='civil'||npc.department==='architecture')&&state.player.hp<state.player.maxHp){
   if(Math.hypot(npc.x-state.player.x,npc.y-state.player.y)>120)continue;
   state.player.hp=Math.min(state.player.maxHp,state.player.hp+8);
   state.effects.push({x:state.player.x,y:state.player.y,scene:'campus',kind:'heal',radius:12,life:.7,sourceX:npc.x,sourceY:npc.y});emit(`${npc.name}의 응원! 체력 +8`);
  }else{
   const damage=bossHpCap(boss,Math.min(boss.hp,boss.raid?((state.relations[npc.id]||0)>=3?14:10):6));if(damage<=0)continue;boss.hp=Math.max(0,boss.hp-damage);   // 페이즈 전환 중에는 무적 · 페이즈 경계까지만
   const away=Math.hypot(boss.x-npc.x,boss.y-npc.y)||1;
   react(boss,{x:(boss.x-npc.x)/away,y:(boss.y-npc.y)/away},.6);boss.hitstop=0;   // 보스는 굳지 않는다
   state.effects.push({kind:'hit',source:'npc',damage,x:boss.x,y:boss.y,scene:boss.scene,radius:3,life:COMBAT.numberLife,seed:(npc.x*5+damage*17)%100});
   state.effects.push({x:boss.x,y:boss.y,scene:'campus',kind:'support',radius:10,life:.7,sourceX:npc.x,sourceY:npc.y});emit(`${npc.name}의 지원 공격!`);
   if(boss.hp<=0){defeated(state,boss,emit);state.monsters=state.monsters.filter(m=>m.hp>0);return;}
  }
  if(boss.raid)return;
 }
}
