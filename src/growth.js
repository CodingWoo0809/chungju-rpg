import {tourCount} from './tour-data.js';
import {COMBAT} from './config.js';
import {addItem, gain, ITEMS} from './inventory.js';
// 탐방 4곳 보상 무기: 예전에 보통 무기를 주던 학과는 복싱 글러브, 희귀 무기를 주던 학과는 배드민턴 라켓(2026-09-26 무기 리워크).
export const DEPARTMENT_GEAR={architecture:['boxingGlove','draftMantle'],machine:['boxingGlove','servoVest'],electric:['badmintonRacket','arcJacket'],civil:['badmintonRacket','strataCoat']};
// R · 학과별 최고 기술. 이름 · 색 · 범위 · 위력 · 부가 효과 · 연출 모양까지 전부 여기 한 곳에 모아 두었다.
// 밸런스를 고치고 싶으면 이 표의 숫자만 바꾸면 되고, 전투 코드에는 학과 이름이 하나도 박혀 있지 않다.
//   radius   : 한 번에 닿는 반경 — Revision 82 부터 네 학과 공통 COMBAT.rRadius 하나(학과 차이는 위력 · 부가 효과로)
//   power    : 한 번의 피해량
//   knockback: 맞은 적을 밀어내는 거리(비우면 무기 기본값)
//   heal/shield: 쓰는 순간 자신에게 들어오는 효과
//   shape    : equipment-art.js 의 연출 분기 이름
//   effect   : 스킬 아이콘 툴팁에 한 줄로 뜨는 요약
export const ULTIMATES={
 architecture:{name:'천공 설계진',color:'#8bd7e0',radius:COMBAT.rRadius,power:120,shield:35,knockback:3,shape:'grid',
  effect:'넓은 설계진 · 보호막 35 · 구조 취약점(5초 받는 피해 +15%)',description:'설계진으로 적의 약점을 분석해 5초 동안 받는 피해를 15% 늘리고 보호막을 펼칩니다.'},
 machine:{name:'오버드라이브 프레스',color:'#ffbe72',radius:COMBAT.rRadius,power:150,knockback:11,shape:'press',
  effect:'가장 강한 직접 피해 · 강한 밀치기',description:'거대한 자동화 프레스로 주변 적을 압착합니다.'},
 electric:{name:'뇌광 회로망',color:'#a6dfff',radius:COMBAT.rRadius,power:125,shape:'circuit',
  effect:'회로망 번개 · 감전(4초 동안 피해의 20% 추가)',description:'넓은 회로망의 적들에게 번개를 전달합니다.'},
 civil:{name:'지층의 수호자',color:'#dfc58c',radius:COMBAT.rRadius,power:115,heal:30,knockback:6,shape:'strata',
  effect:'지층 융기 · 체력 +30 · 진흙 구속(3초)',description:'지층을 솟구치게 해 적을 진흙에 3초 묶고 체력을 30 회복합니다.'},
};
export function progression(state){
 const completed=tourCount(state);
 const [weapon,armor]=DEPARTMENT_GEAR[state.department];
 return {completed,xp:completed*100,stage:completed===8?'3학년 · 전공 통달':completed>=4?'2학년 · 전공 응용':'1학년 · 탐방 시작',ultimate:completed===8,ultimateName:ULTIMATES[state.department].name,weapon,armor,next:completed<2?'탐방 2곳: 전공 방어구 · E 회복':completed<4?'탐방 4곳: 전공 무기 · Q 공명파':completed<8?'탐방 8곳: 전공 통달 · R 최고 기술':'모든 탐방 완료 · 금요일 운동장으로'};
}
export function claimGrowthRewards(state){
 state.growth??={xp:0,granted:[],pending:[]};
 const delivered=[];
 state.growth.pending=state.growth.pending.filter(id=>{if(!addItem(state,id))return true;delivered.push(ITEMS[id].name);return false;});
 return delivered;
}
export function rewardTour(state,id){
 if(state.quests.tour?.[id]!==true)return {xp:0,message:''};
 const progress=progression(state);
 state.growth??={xp:0,granted:[],pending:[]};
 const earned=Math.max(0,progress.xp-state.growth.xp);
 state.growth.xp=progress.xp;
 if(earned){gain(state,'combat',earned/40);gain(state,'life',earned/20);gain(state,state.department,earned/20);}
 for(const [threshold,item] of [[2,progress.armor],[4,progress.weapon]]){
  if(progress.completed<threshold||state.growth.granted.includes(item))continue;
  state.growth.granted.push(item);state.growth.pending.push(item);
 }
 const delivered=claimGrowthRewards(state);
 return {xp:earned,message:[earned?`경험치 +${earned}`:'',...delivered.map(name=>`${name} 지급 · 가방에서 착용`),state.growth.pending.length?'가방이 가득 찼습니다. 보상은 보관 중이며 빈칸을 만들고 가방을 열면 받습니다.':'',progress.ultimate?'3학년 · 전공 통달! R '+progress.ultimateName+' 해금':''].filter(Boolean).join(' · ')};
}
