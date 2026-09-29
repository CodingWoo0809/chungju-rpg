// ── 관리자 모드 (2026-09-26) ─────────────────────────────────
// 시작 화면 → 이어하기 → SAVE 3 아래 '관리자 모드'. 비밀번호를 넣으면 학과를 골라 월요일 아침 새 게임으로 시작한다.
//   · 상점 포인트가 항상 9999점으로 채워진다(사도 다시 채워진다).
//   · 충공 코인도 항상 9999개로 채워진다(강화에 써도 가방 · J 나의 장비 · 상점을 열 때 다시 채워진다, 2026-09-27).
//   · Esc 메뉴에서 월~금을 골라 그 요일 아침으로 바로 옮겨 갈 수 있다.
//   · 금요일 오른쪽 '보스몹' 버튼: 금요일 방과 후(보스가 나타나는 14:20) 운동장 앞으로 바로 옮긴다(2026-09-28).
//   · 게임에 있는 모든 장비(무기·옷·투구)를 1개씩 가방에 넣어 둔다. ITEMS 를 그때그때 읽으므로
//     앞으로 장비가 새로 추가되어도 관리자 모드에 들어가면 자동으로 1개씩 생긴다.
//   · 관리자 모드의 플레이는 저장하지 않는다(SAVE 1~3 기록을 덮어쓰지 않는다).
//   · 학교 탐방 8곳 · 전투 숙련 5 를 채우지 않아도 Q 공명 타격 · R 최고 기술을 바로 쓸 수 있다(2026-09-27).
//     state.flags.adminMode 로 표시한다. 진행도(탐방 수 · 경험치 · 이야기)는 건드리지 않고 스킬 잠금만 푼다.
// 비밀번호는 브라우저 코드에 들어 있으므로 진짜 보안 장치가 아니라 테스트용 잠금이다.
import {ITEMS} from './inventory.js';
import {COIN_ID} from './enhancement.js';
import {CONFIG} from './config.js';
import {GATE} from './world.js';
import {schoolEnd} from './clock.js';

export const ADMIN_PASSWORD='0809';
export const ADMIN_POINTS=9999;
export const ADMIN_COINS=9999;
export function checkAdminPassword(value){return String(value??'').trim()===ADMIN_PASSWORD;}

// 관리자 모드로 시작한 게임인지. 관리자 모드는 저장되지 않으므로 이 표시가 저장 파일에 남지 않는다.
export const ADMIN_FLAG='adminMode';
export function markAdminState(state){state.flags[ADMIN_FLAG]=true;return state;}
export function isAdminState(state){return state?.flags?.[ADMIN_FLAG]===true;}

// 게임에 있는 장비 id 전부(칸이 있는 gear). 새로 추가되는 장비도 여기서 자동으로 잡힌다.
export function allGearIds(){return Object.entries(ITEMS).filter(([,it])=>it.type==='gear'&&it.slot).map(([id])=>id);}

// 가방을 관리자 상태로 맞춘다: 없는 장비는 1개씩 넣고, 상점 포인트는 9999점, 충공 코인은 9999개 한 묶음으로 채운다.
// 테스트용이라 가방 칸 수(60칸) 제한과 상관없이 넣는다.
function fillStack(state,id,amount){
 const stacks=state.inventory.filter(e=>e.id===id);
 if(stacks.length){stacks[0].quantity=amount;for(const extra of stacks.slice(1))extra.quantity=0;state.inventory=state.inventory.filter(e=>e.id!==id||e.quantity>0);}
 else state.inventory.push({id,quantity:amount});
}
export function refreshAdminBag(state){
 const have=new Set(state.inventory.map(e=>e.id));
 for(const id of allGearIds())if(!have.has(id))state.inventory.push({id,quantity:1});
 fillStack(state,'shopPoint',ADMIN_POINTS);
 fillStack(state,COIN_ID,ADMIN_COINS);
 return state;
}

// 원하는 요일 아침(등교 시각)으로 옮긴다. 다음 날로 넘어갈 때(clock.js nextDay)와 같은 방식으로 캠퍼스를 새로 채운다.
export function setAdminDay(state,day){
 if(!Number.isInteger(day)||day<0||day>4)return false;
 state.day=day;state.time=CONFIG.dayStart;state.scene='campus';
 Object.assign(state.player,GATE,{hp:state.player.maxHp,facing:{x:0,y:-1},invulnerable:0,dodge:0});
 delete state.returnEntrance;
 state.monsters=[];state.drops=[];state.npcs=[];state.balls=[];state.projectiles=[];
 delete state.flags[`afterSchool:${day}`];
 state.story.ended=false;
 return true;
}

// 금요일 보스전 시각으로 바로 옮긴다: 금요일 아침과 같은 방식으로 캠퍼스를 새로 채운 뒤, 시계를 금요일 방과 후(보스 등장 시각)로,
// 홍길동을 '운동장으로 향하기'를 눌렀을 때와 같은 자리(보스 자리 640,240 바로 앞)로 옮긴다. 보스는 다음 프레임에 게임의 원래 규칙(simulation.js)대로 나타난다.
// 이미 이긴 뒤라도 다시 싸울 수 있게 처치 기록 · 이야기 종료 표시를 되돌린다(관리자 모드는 저장되지 않는다).
export const ADMIN_BOSS_DAY=4;
export function setAdminBoss(state){
 setAdminDay(state,ADMIN_BOSS_DAY);
 state.time=schoolEnd(ADMIN_BOSS_DAY);
 state.story.bossDefeated=false;state.story.ended=false;
 state.flags[`afterSchool:${ADMIN_BOSS_DAY}`]=true;            // '운동장으로 향하기' 안내는 건너뛴다(이미 운동장에 있다)
 Object.assign(state.player,{x:640,y:285,invulnerable:2,facing:{x:0,y:-1}});   // main.js goToFinale 과 같은 자리
 return true;
}
export function isAdminBossTime(state){return state.day===ADMIN_BOSS_DAY&&state.time>=schoolEnd(ADMIN_BOSS_DAY);}
