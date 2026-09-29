import {ITEMS, playerStats} from './inventory.js';
import {formatStat} from './enhancement.js';
import { moveBody } from './world.js';
import { isStaggered, bossSpeedFactor } from './ult-status.js';

// ── 금요일 보스 '운동장의 공명체' (Revision 75 개편) ───────────────────────────────
// 총 체력 2배(1350 → 2700), 체력 구간에 따라 4페이즈. 페이즈마다 학과 형태와 공격 2종(총 8종).
//   1페이즈 100~75% 건축디자인과 형태 — 설계 절단선(선) · 기하학 폭쇄진(삼각형 · 사각형 · 원)
//   2페이즈  75~50% 자동화기계과 형태 — 토크 러시(돌진 두 번) · 서보 충격파(부채꼴 + 퍼지는 고리)
//   3페이즈  50~25% 전기전자과 형태 — 전류 창 낙뢰(따라오는 연속 낙뢰) · 아크 링크(전극 사이 전류선)
//   4페이즈  25~ 0% 토목시스템과 형태 — 지반 붕괴(안쪽 원 → 바깥 부채 구역) · 파일 드라이버 관통(직선 + 착탄점)
// 모든 공격은 '위험 구역(hazard)' 데이터로 만든다: 전조(warn) 동안 모양이 그대로 보이고, 전조가 끝나는 순간부터
// 짧은 판정 시간(act) 동안만 맞는다. 구역 하나는 한 번만 피해를 준다. 판정은 hazardContains 한 곳에서 계산하고
// 그림(boss-art.js)도 같은 데이터를 그대로 그리므로, 보이는 모양과 맞는 모양이 같다.
// 페이즈가 바뀌면 남아 있던 위험 구역을 모두 지우고 1.3초 전환(무적)한 뒤, 1초 동안 핵이 드러난다.

export const BOSS_HP = 2700;
export const BOSS_SHIFT_TIME = 1.3;
export const BOSS_RECOVER_TIME = 1.8;

// 페이즈 정의(그림 · 이름표 · 공격 순서). 색은 전조 판독을 위해 밝은 주색(main)과 테두리색(edge)을 따로 둔다.
export const BOSS_PHASES = [
  null,
  {id:'architecture', name:'설계 형태', dept:'건축디자인과', main:'#ff3d4a', edge:'#ffd6d9', deep:'#6e1016', patterns:['cut','geometry']},
  {id:'machine', name:'구동 형태', dept:'자동화기계과', main:'#ff8a2a', edge:'#ffe0bf', deep:'#5a3418', patterns:['rush','quake']},
  {id:'electric', name:'전하 형태', dept:'전기전자과', main:'#3f9bff', edge:'#d6ecff', deep:'#0f2a6e', patterns:['bolts','arc']},
  {id:'civil', name:'지반 형태', dept:'토목시스템과', main:'#ffc61f', edge:'#fff1bf', deep:'#5a4308', patterns:['collapse','pile']},
];
export const BOSS_PATTERNS = {
  cut:{name:'설계 절단선',hint:'붉은 선에서 옆으로 비키세요',damage:16},
  geometry:{name:'기하학 폭쇄진',hint:'빛나는 도형 밖으로',damage:18},
  rush:{name:'토크 러시',hint:'돌진 경로에서 옆으로',damage:20},
  quake:{name:'서보 충격파',hint:'부채꼴 밖 · 고리는 안쪽이나 바깥',damage:18},
  bolts:{name:'전류 창 낙뢰',hint:'표식이 따라옵니다 · 계속 움직이세요',damage:14},
  arc:{name:'아크 링크',hint:'전류선 위에 서지 마세요',damage:16},
  collapse:{name:'지반 붕괴',hint:'가운데를 벗어나 · 비어 있는 칸으로',damage:20},
  pile:{name:'파일 드라이버 관통',hint:'말뚝 선과 착탄점 밖으로',damage:22},
};

export function bossPhase(monster) {
  const ratio = monster.hp / monster.maxHp;
  return ratio > .75 ? 1 : ratio > .5 ? 2 : ratio > .25 ? 3 : 4;
}

export function damagePlayer(state, damage, source, emit) {
  if (state.player.invulnerable > 0 || state.player.hp <= 0) return false;
  damage=Math.max(1,damage-playerStats(state).defense);   // 옷·투구·그 밖의 장비 방어력 합계
  const absorbed=Math.min(damage,state.player.shield||0);state.player.shield=Math.max(0,(state.player.shield||0)-absorbed);damage-=absorbed;
  const before = state.player.hp;
  state.player.hp = Math.max(0, before - damage);
  state.player.invulnerable = .8;
  state.effects ??= [];
  state.effects.push({kind:'hit',source:'monster',damage:before-state.player.hp,x:state.player.x,y:state.player.y,scene:state.scene,radius:3,life:.62,seed:(state.player.x*3+damage*7)%100});
  emit(`${source}의 공격! 체력 -${formatStat(before-state.player.hp)}`);   // 강화 방어력은 소수가 될 수 있어 표시만 다듬는다
  return true;
}

// ── 위험 구역 판정 ─────────────────────────────────────────────
function segDistance(px,py,x1,y1,x2,y2){
  const vx=x2-x1,vy=y2-y1,l=vx*vx+vy*vy||1,t=Math.max(0,Math.min(1,((px-x1)*vx+(py-y1)*vy)/l));
  return Math.hypot(px-(x1+vx*t),py-(y1+vy*t));
}
function inPolygon(px,py,pts){
  let inside=false;
  for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [xi,yi]=pts[i],[xj,yj]=pts[j];if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)inside=!inside;}
  return inside;
}
const angleDiff=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
// 점(px,py)이 구역 안인가. pad 는 몸 반지름(플레이어 1.6)만큼 넓혀 보는 값. front 는 퍼지는 고리의 현재 반지름.
export function hazardContains(h,px,py,pad=0,boss=null){
  switch(h.type){
    case 'line':return segDistance(px,py,h.x1,h.y1,h.x2,h.y2)<=h.w+pad;
    case 'circle':return Math.hypot(px-h.x,py-h.y)<=h.r+pad;
    case 'poly':return inPolygon(px,py,h.pts)||h.pts.some((p,i)=>{const q=h.pts[(i+1)%h.pts.length];return segDistance(px,py,p[0],p[1],q[0],q[1])<=pad;});
    case 'cone':{const d=Math.hypot(px-h.x,py-h.y);return d<=h.r+pad&&(d<=pad+2||angleDiff(Math.atan2(py-h.y,px-h.x),h.ang)<=h.spread/2);}
    case 'sector':{const d=Math.hypot(px-h.x,py-h.y);if(d<h.r0-pad||d>h.r1+pad)return false;return h.arcs.some(([a0,a1])=>angleDiff(Math.atan2(py-h.y,px-h.x),(a0+a1)/2)<=(a1-a0)/2);}
    case 'ring':{const d=Math.hypot(px-h.x,py-h.y);return d>=h.r0-pad&&d<=h.r1+pad;}           // 전조 · 회피 판단용: 고리가 지나갈 전체 범위
    case 'rush':return segDistance(px,py,h.x1,h.y1,h.x2,h.y2)<=h.w+pad;
    case 'links':return h.segs.some(([a,b])=>segDistance(px,py,a[0],a[1],b[0],b[1])<=h.w+pad);
  }
  return false;
}
// 판정 순간에 실제로 맞는가(고리는 지금 퍼지는 앞머리만, 돌진은 보스 몸만).
function hazardStrikes(h,px,py,boss){
  const pad=1.6;
  if(h.type==='ring'){const d=Math.hypot(px-h.x,py-h.y);return d>=h.r0&&Math.abs(d-h.front)<=2.4+pad;}
  if(h.type==='rush')return Math.hypot(px-boss.x,py-boss.y)<=boss.radius+pad;
  return hazardContains(h,px,py,pad,boss);
}
// 보스의 현재 위험 구역(전조 포함) 가운데 점을 덮는 것이 있는가 — QA 자동 전투 · 테스트 봇이 쓴다.
export function bossDangerAt(boss,x,y,pad=1.6,horizon=Infinity){
  return (boss.hazards||[]).some(h=>h.warn<=horizon&&hazardContains(h,x,y,pad,boss));
}

// ── 공격 만들기 ────────────────────────────────────────────────
let hazardSerial=0;
function hazard(m,style,type,geom,warn,act,extra={}){
  const h={id:++hazardSerial,style,type,...geom,warn,warnFull:warn,act,actFull:act,damage:BOSS_PATTERNS[style].damage,hit:false,...extra};
  m.hazards.push(h);return h;
}
const unit=(x,y)=>{const l=Math.hypot(x,y)||1;return {x:x/l,y:y/l};};
function aimAt(m,state){return unit(state.player.x-m.x,state.player.y-m.y);}
function rotate(v,a){const c=Math.cos(a),s=Math.sin(a);return {x:v.x*c-v.y*s,y:v.x*s+v.y*c};}

// 패턴 하나는 '단계(step)' 목록이다. 단계는 패턴 시작 뒤 at 초에 실행되며, 실행 순간의 플레이어 위치로 조준한다.
const STEPS={
  cut:[{at:0,op:'cut',turn:0},{at:.4,op:'cut',turn:.42},{at:.8,op:'cut',turn:-.42}],
  geometry:[{at:0,op:'geometry'}],
  rush:[{at:0,op:'rush',warn:1.05},{at:2.05,op:'rush',warn:.85}],
  quake:[{at:0,op:'cone'},{at:1.45,op:'ring'}],
  bolts:[0,.4,.8,1.2,1.6].map((at,i)=>({at,op:'bolt',i})),
  arc:[{at:0,op:'arc'}],
  collapse:[{at:0,op:'collapse'}],
  pile:[{at:0,op:'pile',warn:1.3},{at:1.75,op:'pile',warn:1.05}],
};
function runStep(state,m,step){
  const aim=aimAt(m,state),px=state.player.x,py=state.player.y;
  switch(step.op){
    case 'cut':{const d=rotate(aim,step.turn);
      hazard(m,'cut','line',{x1:m.x-d.x*18,y1:m.y-d.y*18,x2:m.x+d.x*82,y2:m.y+d.y*82,w:2.6},1.05,.2);break;}
    case 'geometry':{
      const side={x:-aim.y,y:aim.x},dist=Math.hypot(px-m.x,py-m.y);
      const tri=(cx,cy,r,rot)=>[0,1,2].map(i=>[cx+Math.cos(rot+i*2.094)*r,cy+Math.sin(rot+i*2.094)*r]);
      const sq=(cx,cy,r,rot)=>[0,1,2,3].map(i=>[cx+Math.cos(rot+i*1.5708)*r,cy+Math.sin(rot+i*1.5708)*r]);
      hazard(m,'geometry','poly',{pts:tri(px,py,10,Math.atan2(aim.y,aim.x)),cx:px,cy:py,shape:'triangle'},1.3,.25);
      const mx=m.x+aim.x*Math.max(8,dist*.5)+side.x*15,my=m.y+aim.y*Math.max(8,dist*.5)+side.y*15;
      hazard(m,'geometry','poly',{pts:sq(mx,my,9.5,.785+Math.atan2(aim.y,aim.x)),cx:mx,cy:my,shape:'square'},1.65,.25);
      hazard(m,'geometry','circle',{x:m.x-side.x*16,y:m.y-side.y*16,r:9,shape:'circle'},2.0,.25);break;}
    case 'rush':{const len=Math.max(30,Math.min(56,Math.hypot(px-m.x,py-m.y)+16));
      hazard(m,'rush','rush',{x1:m.x,y1:m.y,x2:m.x+aim.x*len,y2:m.y+aim.y*len,w:m.radius,dx:aim.x,dy:aim.y,speed:62},step.warn,len/62);break;}
    case 'cone':hazard(m,'quake','cone',{x:m.x,y:m.y,ang:Math.atan2(aim.y,aim.x),spread:1.92,r:30},1.1,.25);break;
    case 'ring':hazard(m,'quake','ring',{x:m.x,y:m.y,r0:12,r1:34,front:12},1.0,.55);break;
    case 'bolt':hazard(m,'bolts','circle',{x:px,y:py,r:5.5,n:step.i},1.0,.15);break;
    case 'arc':{const base=Math.atan2(aim.y,aim.x),nodes=[0,1,2,3].map(i=>[m.x+Math.cos(base+i*Math.PI/2)*25,m.y+Math.sin(base+i*Math.PI/2)*25]);
      const segs=[[nodes[0],nodes[1]],[nodes[1],nodes[2]],[nodes[2],nodes[3]],[nodes[3],nodes[0]],[[m.x,m.y],nodes[0]],[[m.x,m.y],nodes[2]]];
      hazard(m,'arc','links',{nodes,segs,w:2.2},1.5,1.2);break;}
    case 'collapse':{
      hazard(m,'collapse','circle',{x:m.x,y:m.y,r:14},1.2,.3);
      // 바깥은 8칸 중 4칸. 지금 플레이어가 선 칸이 위험 칸이 되도록 맞춘다(옆 칸이 안전).
      const pa=Math.atan2(py-m.y,px-m.x),step8=Math.PI/4,base=pa-step8/2;          // 플레이어가 선 칸이 한가운데 오도록
      hazard(m,'collapse','sector',{x:m.x,y:m.y,r0:14,r1:34,arcs:[0,2,4,6].map(k=>[base+k*step8,base+(k+1)*step8])},2.05,.3);break;}
    case 'pile':{
      hazard(m,'pile','line',{x1:m.x,y1:m.y,x2:m.x+aim.x*72,y2:m.y+aim.y*72,w:3.8},step.warn,.2);
      hazard(m,'pile','circle',{x:px,y:py,r:8,impact:true},step.warn+.12,.2);break;}
  }
}

function beginAttack(state, m) {
  const def=BOSS_PHASES[m.bossStage];
  m.patternIndex=(m.patternIndex||0)+1;
  m.pattern=def.patterns[m.patternIndex%2===1?0:1];
  m.phase='telegraph';m.clock=0;m.hazards=[];
  m.steps=STEPS[m.pattern].map(s=>({...s}));
  m.timer=Math.max(...m.steps.map(s=>s.at))+.1;m.telegraphDuration=m.timer;
  m.face=aimAt(m,state);
}

function startShift(state,m,stage,emit){
  const from=m.bossStage||1;
  m.bossStage=stage;m.phase='shift';m.timer=BOSS_SHIFT_TIME;m.hazards=[];m.steps=[];m.pattern=null;m.patternIndex=0;
  if(m.status){delete m.status.stagger;delete m.status.slow;delete m.status.slowAmount;}   // 토목 R 경직 · 둔화는 형태 전환과 함께 풀린다(Revision 78)
  state.effects??=[];
  state.effects.push({kind:'boss-shift',from,to:stage,x:m.x,y:m.y,scene:m.scene,life:BOSS_SHIFT_TIME+.3,full:BOSS_SHIFT_TIME+.3});
  const def=BOSS_PHASES[stage];emit(`공명체가 ${def.dept} 형태로 변했다! · ${stage}페이즈`);
}

// 예전 저장 파일에 남아 있던 3페이즈 보스(체력 1350)를 새 규칙으로 한 번 옮긴다. 체력 비율은 유지한다.
export function upgradeBoss(m){
  if(m.bossVersion===2)return m;
  if(m.raid&&m.maxHp<BOSS_HP){const ratio=m.hp/m.maxHp;m.maxHp=BOSS_HP;m.hp=Math.max(1,Math.round(BOSS_HP*ratio));}
  m.bossVersion=2;m.bossStage=bossPhase(m);m.hazards=[];m.steps=[];m.pattern=null;
  if(!['idle','chase'].includes(m.phase))m.phase='idle';
  for(const key of ['targetX','targetY','attackRadius','innerRadius','strikesRemaining','waveRadius'])delete m[key];
  return m;
}

function strike(state,m,h,emit){
  state.effects??=[];
  // 판정이 시작되는 순간의 화려한 타격 연출(그림 전용, 판정 없음)
  const {warn,warnFull,act,actFull,hit,...shape}=h;
  state.effects.push({kind:'boss-fx',style:h.style,stage:m.bossStage,scene:m.scene,x:h.x??h.cx??m.x,y:h.y??h.cy??m.y,life:.7,full:.7,shape,seed:h.id});
}

function tickHazards(state,m,dt,emit){
  const p=state.player;
  for(const h of m.hazards){
    if(h.warn>0){h.warn-=dt;if(h.warn<=0){h.warn=0;h.live=true;strike(state,m,h,emit);}else continue;}
    if(h.type==='ring')h.front=Math.min(h.r1,h.r0+(h.r1-h.r0)*(1-Math.max(0,h.act-dt)/h.actFull));
    if(h.type==='rush'){const step=Math.min(h.speed*dt,Math.max(0,h.act)*h.speed);const bx=m.x,by=m.y;moveBody(m,h.dx*step,h.dy*step,m.scene,m.radius);h.moved=(h.moved||0)+Math.hypot(m.x-bx,m.y-by);}
    if(!h.hit&&p.hp>0&&hazardStrikes(h,p.x,p.y,m)){h.hit=true;damagePlayer(state,h.damage,m.name,emit);}
    h.act-=dt;
  }
  m.hazards=m.hazards.filter(h=>h.warn>0||h.act>0);
}

export function updateBoss(state, m, dt, emit) {
  upgradeBoss(m);
  m.hazards??=[];m.steps??=[];
  // 플레이어가 다른 장면에 있는 동안(기절해 보건실 등)은 보스가 멈춰 있다. 돌아오면 멈춰 있던 공격을 지우고 새로 시작한다.
  if(m.seenAt!==undefined&&state.time-m.seenAt>1&&(m.hazards.length||m.steps.length)){m.hazards=[];m.steps=[];m.pattern=null;m.phase='idle';}
  m.seenAt=state.time;
  const stage=bossPhase(m);
  if(m.phase!=='shift'&&stage>(m.bossStage||1)){startShift(state,m,stage,emit);return;}
  // 토목 R 진흙 구속(Revision 78): 1초 경직 동안 이동 · 패턴 진행(예고 · 판정 시계)이 함께 멈춘다. 경직은 1초로 끝나고 전환이 시작되면 풀린다.
  if(m.phase!=='shift'&&isStaggered(m))return;
  m.timer-=dt;
  if(m.phase==='shift'){if(m.timer<=0){m.phase='recover';m.timer=1;}return;}
  const dx=state.player.x-m.x,dy=state.player.y-m.y,distance=Math.hypot(dx,dy);
  // 플레이어가 멀리 떠나면(기절해 보건실로 옮겨지는 등) 진행 중인 공격을 모두 거둔다.
  if(distance>150&&(m.hazards.length||m.steps.length)){m.hazards=[];m.steps=[];m.phase='idle';return;}
  if(m.phase==='telegraph'){
    m.clock=(m.clock||0)+dt;
    while(m.steps.length&&m.steps[0].at<=m.clock)runStep(state,m,m.steps.shift());
    tickHazards(state,m,dt,emit);
    if(!m.steps.length&&!m.hazards.length){m.phase='recover';m.timer=BOSS_RECOVER_TIME;m.pattern=null;}
    return;
  }
  if(m.phase==='recover'){if(m.timer<=0)m.phase='idle';return;}
  if (distance < 26){beginAttack(state,m);while(m.steps.length&&m.steps[0].at<=0)runStep(state,m,m.steps.shift());}   // 첫 단계는 시작하는 순간의 위치를 노린다
  else if (distance < 120) { m.phase='chase'; const v=9*bossSpeedFactor(m);moveBody(m,dx/distance*v*dt,dy/distance*v*dt,m.scene,m.radius); }   // 둔화 중 40% 느리게(돌진 패턴 궤적은 예고 그대로)
  else m.phase='idle';
}

export function prepareBoss(state,boss){
 boss.raid=true;boss.hp=BOSS_HP;boss.maxHp=BOSS_HP;boss.bossVersion=2;boss.bossStage=1;boss.hazards=[];boss.steps=[];return boss;
}
// 전환 중에는 무적, 그리고 한 번의 공격으로 페이즈를 건너뛰지 않도록 현재 페이즈 경계까지만 깎는다(모든 페이즈를 반드시 거친다).
export function bossHpCap(m,damage){
 if(m.kind!=='boss')return damage;
 if(m.phase==='shift')return 0;
 const stage=m.bossStage||bossPhase(m);
 if(stage>=4)return damage;
 return Math.min(damage,Math.max(0,m.hp-m.maxHp*(1-stage*.25)));
}
// mult: 플레이어 쪽 배율(건축 R 구조 취약점 1.15, Revision 78) — 보스 방어 계산이 끝난 피해에 곱하고 페이즈 경계 상한을 적용한다.
export function bossDamage(monster,damage,kind,mult=1){
 if(monster.kind!=='boss')return damage*mult;
 if(!monster.raid)return bossHpCap(monster,damage*mult);
 if(kind==='r')return bossHpCap(monster,damage*.9*mult);
 const armor=monster.phase==='recover'?.8:.12;
 return bossHpCap(monster,damage*armor/(1+damage/35)*mult);
}
