// ── 최대 강화 오라 (2026-09-27) ─────────────────────────────
// 무기 +7 · 옷 +5 · 투구 +5 를 '착용'하고 있을 때만 필드의 홍길동에게 아주 옅은 빛이 돈다. 순수한 시각 효과다
// (능력치 · 판정 · 충돌과 무관). 부위도 그 장비 자리로만 한정한다 — 무기는 무기 가장자리, 옷은 몸통, 투구는 머리.
// 색은 장비의 학과: 건축 빨강 · 기계 갈색/청동 · 전기 파랑 · 토목 노랑 · 학과 없음 은백색.
// 여러 개가 동시에 최대면 부위마다 알파를 나눠 전체가 AURA_ALPHA.cap 을 넘지 않게 한다.
import {ITEMS,itemLevel} from './inventory.js';
import {maxLevel} from './enhancement.js';
import {CONFIG} from './config.js';

export const AURA_COLOR=Object.freeze({architecture:'#ff4d55',machine:'#c98a45',electric:'#4d96ff',civil:'#ffd23f',none:'#e8eff6'});
export const AURA_ALPHA=Object.freeze({single:.32,cap:.5});
// 학과 전용 영웅 옷 4종은 아이템 정의에 department 가 없어 여기서 학과를 알려 준다(아이템 정의는 건드리지 않는다).
const ARMOR_DEPARTMENT={draftMantle:'architecture',servoVest:'machine',arcJacket:'electric',strataCoat:'civil'};
const PARTS=[['equipment','weapon','weapon'],['armor','armor','torso'],['helmet','helmet','head']];
export function auraDepartment(id){return ITEMS[id]?.department??ARMOR_DEPARTMENT[id]??null;}

// 지금 보여 줄 오라 목록. [{part, slot, id, department, color, alpha}]
export function enhanceAura(state){
 const layers=[];
 for(const [field,slot,part] of PARTS){
  const id=state?.[field],item=ITEMS[id];
  if(!item||item.type!=='gear'||item.slot!==slot||!state.inventory?.some(e=>e.id===id))continue;
  if(itemLevel(state,id)<maxLevel(slot))continue;
  const department=auraDepartment(id);
  layers.push({part,slot,id,department,color:AURA_COLOR[department]||AURA_COLOR.none});
 }
 const alpha=Math.min(AURA_ALPHA.single,AURA_ALPHA.cap/Math.max(1,layers.length));
 return layers.map(layer=>({...layer,alpha}));
}

const hex=(color,alpha)=>color+Math.round(Math.max(0,Math.min(1,alpha))*255).toString(16).padStart(2,'0');
const pulse=(t,seed)=>.82+Math.sin(t*2.1+seed)*.18;
// 몸통 · 머리 오라. 스프라이트보다 먼저(뒤에) 그려 몸 가장자리에만 옅게 번진다. 좌표는 actors.js person() 의 발 기준 로컬 좌표.
const BODY={torso:{x:0,y:-12,rx:8.2,ry:9,seed:0},head:{x:0,y:-20.8,rx:6,ry:5.6,seed:1.7}};
export function drawBodyAura(c,layers,t=0){
 for(const layer of layers){
  const b=BODY[layer.part];if(!b)continue;
  const a=layer.alpha*pulse(t,b.seed);
  c.save();c.translate(b.x,b.y);c.scale(1,b.ry/b.rx);
  const g=c.createRadialGradient(0,0,b.rx*.25,0,0,b.rx);
  g.addColorStop(0,hex(layer.color,a));g.addColorStop(.62,hex(layer.color,a*.75));g.addColorStop(1,hex(layer.color,0));
  c.fillStyle=g;c.beginPath();c.arc(0,0,b.rx,0,Math.PI*2);c.fill();c.restore();
  // 부위 가까이에서 천천히 떠오르는 작은 빛 두 점
  for(let i=0;i<2;i++){
   const u=(t*.45+i*.5+b.seed)%1,x=b.x+(i?1:-1)*b.rx*.62+Math.sin(t*1.3+i)*.6,y=b.y+b.ry*.35-u*b.ry*1.1;
   c.fillStyle=hex(layer.color,a*1.6*Math.sin(u*Math.PI));c.beginPath();c.arc(x,y,.45,0,Math.PI*2);c.fill();
  }
 }
}
// 무기 오라: 무기 그림 테두리에 옅은 색 번짐(캔버스 그림자). 무기 그리기 코드는 그대로 두고 그 앞뒤로 설정만 바꾼다.
export function withWeaponAura(c,layers,t,draw){
 const layer=layers?.find(l=>l.part==='weapon');
 if(!layer){draw();return;}
 c.save();c.shadowColor=hex(layer.color,Math.min(1,layer.alpha*2.6*pulse(t,3.1)));c.shadowBlur=2.1*CONFIG.zoom;c.shadowOffsetX=0;c.shadowOffsetY=0;
 draw();c.restore();
}
