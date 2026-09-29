// ── 전투 연출(VFX) 개편 (2026-09-27) ─────────────────────────────────────
// 전투 수치 · 판정 · 사거리 · 쿨타임은 그대로 두고 '보이는 것'만 바꾼다. combat.js 가 만드는 효과(state.effects)를
// 여기서 그린다. 모든 그림은 화면 좌표(renderer.project)로 그리고, 무기와 캐릭터 스프라이트는 건드리지 않는다.
//
//  1. 일반 공격(효과 kind 'light'·'heavy') — 무기 모션군마다 모양이 다르다.
//       타격형(맨주먹 · 글러브 · 건틀릿)  주먹 끝의 짧은 섬광 + 작은 충격 고리 + 짧은 빛살 — '퍽' 하는 짧은 접촉감
//       스윙형(라켓 · 검 · 파쇄추)      무기 궤적을 따라가는 초승달 잔상. 라켓은 얇고 가볍게, 검은 날카롭게, 파쇄추는 두껍고
//                                     바닥 충격파 · 먼지까지(무게감)
//       찌르기형(창)                   앞으로 좁고 길게 뻗는 빛창 + 끝의 별 섬광 + 속도선
//     맞은 자리(효과 'impact-spark')도 모션군마다: 타격형 별 모양 충격, 스윙형 베인 자국, 찌르기형 관통선.
//     색: 맨주먹 · 복싱 글러브 · 배드민턴 라켓은 흰색, 영웅 · 레전드 무기는 무기 학과 색. 레전드는 영웅보다 크고 잔상 · 빛가루가 더 많다.
//  2. 공명 타격(Q, 효과 'q') — 무기와 상관없는 공통 연출. 공명 원 가장자리에서 흰 기류가 하늘로 치솟고, 원 안에는 옅은 균열과
//     작은 파편이 튄다. 학과 색은 기류 가장자리 · 원 테두리의 보조색으로만 쓴다(시안 Image A).
//  3. 최고 기술(R, 효과 'ultimate') — 학과별 판타지 연출(시안 Image B~E). 바닥 진 → 구조물 솟음 → 폭발 → 잔광의 네 단계.
//       건축  붉은 설계진 · 도면 패널 · 기둥과 트러스 · 붉은 결정 → 구조물 붕괴와 빛살
//       기계  톱니 링 · 기계 팔(피스톤) · 동력 코어 → 코어 폭발과 톱니 파편, 주황 소용돌이
//       전기  회로 마법진 · 노드 빛기둥 · 하늘에서 내려꽂히는 번개 → 방전 폭발과 푸른 결정, 잔류 아크
//       토목  금빛 측량선 → 지면 균열 · 판 들림 → 바위 기둥 분출 → 대지 폭발과 바위 · 흙먼지, 금빛 소용돌이
//  Q · R 은 바닥층(캐릭터 아래) · 뒤층(캐릭터 뒤) · 앞층(캐릭터 앞)으로 나눠 그려 기둥 · 기류가 캐릭터 앞뒤로 자연스럽게 겹친다.
//  홍길동은 Q · R 에서 공격 자세를 취하지 않고 무기를 든 기본 자세 그대로다(player-sprite.js pickPlayerFrame).
import {CONFIG} from './config.js';
import {ITEMS,weaponMotion} from './inventory.js';

export const STRIKE_LIFE=.3;               // 일반 공격 잔상 · 맞은 자리 효과의 길이(초). 연출용.
export const Q_LIFE=.9;                    // 공명 타격 연출 길이(초). 판정은 누르는 순간 끝난다.
export const R_LIFE=2.2;                   // 최고 기술 연출 길이(초). 판정은 누르는 순간 끝난다.

// 학과 색(보조색 glow · 주색 main · 짙은색 deep).
export const DEPT_FX={
 architecture:{main:'#ff3845',glow:'#ff8a8a',deep:'#7d0c16',light:'#ffe1e1'},
 machine:{main:'#f07a22',glow:'#ffb068',deep:'#6b3a14',light:'#fff0dc'},
 electric:{main:'#3b97ff',glow:'#8fd4ff',deep:'#0d2d7a',light:'#e3f5ff'},
 civil:{main:'#ffc21f',glow:'#ffe27a',deep:'#6b4a08',light:'#fff6d6'},
};
const WHITE={main:'#dfe9ff',glow:'#ffffff',deep:'#7d8aa3',light:'#ffffff'};

// 무기 하나의 연출 성격. 모션군(family) · 등급(tier) · 색(palette) · 무게(weight) · 크기(scale).
export function strikeStyle(equipment){
 const item=ITEMS[equipment]||null,family=weaponMotion(equipment);
 const tier=item?.rarity==='레전드'?'legend':item?.rarity==='영웅'?'hero':'plain';
 const palette=tier==='plain'?WHITE:DEPT_FX[item.department]||WHITE;
 const weight=equipment==='badmintonRacket'?'light':/^civil-(hero-)?weapon$/.test(equipment||'')?'heavy':family==='swing'?'blade':family==='thrust'?'spear':'fist';
 const scale=tier==='legend'?1.4:tier==='hero'?1.15:1;
 return {family,tier,palette,weight,scale};
}

// ── 작은 도구 ────────────────────────────────────────────────
// 잔디 · 바닥 위에서 'lighter' 합성은 붉은색 · 주황도 노랗게 바래 학과 색이 사라진다. 보통 합성으로 색을 지킨다.
const GLOW='source-over';
const TAU=Math.PI*2;
const clamp01=v=>Math.max(0,Math.min(1,v));
const span=(u,a,b)=>clamp01((u-a)/(b-a));                       // u 가 a→b 로 갈 때 0→1
const easeOut=v=>1-Math.pow(1-v,3);
const bell=(u,a,b,c)=>u<a||u>c?0:u<b?easeOut((u-a)/(b-a)):1-span(u,b,c);   // a~b 올라가고 b~c 내려간다
// 결정적인 난수(프레임마다 같은 값 — 파편이 흔들리지 않는다)
export function rnd(seed,i){let h=Math.imul((seed|0)^0x9e3779b9,0x85ebca6b)^Math.imul(i+1,0xc2b2ae35);h^=h>>>13;h=Math.imul(h,0x27d4eb2f);h^=h>>>16;return (h>>>0)/4294967296;}
const hex=(color,a)=>{const v=parseInt(color.slice(1),16);return `rgba(${v>>16&255},${v>>8&255},${v&255},${a.toFixed(3)})`;};
// 월드 원(반지름 r)을 화면 타원으로. 등각 투영에서 월드 원은 축에 나란한 타원이 된다(renderer.project 와 같은 비율).
export function groundEllipse(d,x,y,r,z=0){const p=d.p(x,y,z),k=CONFIG.zoom;return {x:p.x,y:p.y,rx:1.131*k*r,ry:.594*k*r};}
// 월드 방향(ax,ay)의 화면 각도와 1 단위 길이(px)
function screenAim(aim){const sx=(aim.x-aim.y)*.8,sy=(aim.x+aim.y)*.42;return {angle:Math.atan2(sy,sx),unit:Math.hypot(sx,sy)*CONFIG.zoom};}

function glowPath(c,path,color,width,alpha=1,glow=null){
 if(alpha<=0)return;
 c.save();c.lineCap='round';c.lineJoin='round';const base=c.globalAlpha*Math.min(1,alpha);
 c.globalAlpha=base*.25;c.strokeStyle=glow||color;c.lineWidth=width*3.4;path();c.stroke();   // 번짐
 c.globalAlpha=base*.9;c.strokeStyle=color;c.lineWidth=width*1.6;path();c.stroke();         // 색
 c.globalAlpha=base;c.strokeStyle='#ffffff';c.lineWidth=Math.max(.7,width*.45);path();c.stroke(); // 흰 심
 c.restore();
}
function ellipsePath(c,e,k=1){return ()=>{c.beginPath();c.ellipse(e.x,e.y,e.rx*k,e.ry*k,0,0,TAU);};}
function star(c,x,y,r,color,alpha=1,rot=0){                       // 4갈래 반짝임
 if(r<=.3||alpha<=0)return;
 c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(rot);c.fillStyle=color;
 c.beginPath();c.moveTo(0,-r);c.quadraticCurveTo(r*.12,-r*.12,r,0);c.quadraticCurveTo(r*.12,r*.12,0,r);c.quadraticCurveTo(-r*.12,r*.12,-r,0);c.quadraticCurveTo(-r*.12,-r*.12,0,-r);c.fill();
 c.fillStyle='#ffffff';c.beginPath();c.arc(0,0,r*.22,0,TAU);c.fill();
 c.restore();
}
function shard(c,x,y,s,rot,dark='#2b2426',edge='#8d7f7a',alpha=1){ // 어두운 돌 파편
 if(alpha<=0)return;
 c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(rot);
 c.fillStyle=dark;c.beginPath();c.moveTo(0,-s);c.lineTo(s*.7,-s*.2);c.lineTo(s*.4,s*.8);c.lineTo(-s*.5,s*.6);c.lineTo(-s*.7,-s*.3);c.closePath();c.fill();
 c.strokeStyle=edge;c.lineWidth=1;c.beginPath();c.moveTo(0,-s);c.lineTo(s*.7,-s*.2);c.stroke();
 c.restore();
}
function crystal(c,x,y,w,h,main,light,alpha=1,rot=0){             // 빛나는 결정(마름모)
 if(alpha<=0)return;
 c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(rot);
 const g=c.createLinearGradient(-w,0,w,0);g.addColorStop(0,main);g.addColorStop(.5,light);g.addColorStop(1,main);
 c.fillStyle=g;c.beginPath();c.moveTo(0,-h);c.lineTo(w,0);c.lineTo(0,h);c.lineTo(-w,0);c.closePath();c.fill();
 c.strokeStyle='#ffffff';c.lineWidth=1.2;c.stroke();
 c.globalAlpha*=.6;c.fillStyle='#ffffff';c.beginPath();c.moveTo(0,-h);c.lineTo(w*.35,0);c.lineTo(0,h*.2);c.closePath();c.fill();
 c.restore();
}
function rays(c,x,y,n,r0,r1,color,width,alpha,seed,rot=0,flat=.62){ // 방사형 빛살
 if(alpha<=0)return;
 c.save();c.globalCompositeOperation=GLOW;
 for(let i=0;i<n;i++){
  const a=rot+i/n*TAU+(rnd(seed,i)-.5)*.5,len=r1*(.55+rnd(seed,i+50)*.6);
  const x0=x+Math.cos(a)*r0,y0=y+Math.sin(a)*r0*flat,x1=x+Math.cos(a)*len,y1=y+Math.sin(a)*len*flat;
  glowPath(c,()=>{c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);},color,width*(.6+rnd(seed,i+90)*.7),alpha);
 }
 c.restore();
}
function softGlow(c,x,y,rx,ry,color,alpha){                       // 부드러운 빛 번짐(타원)
 if(alpha<=0)return;
 c.save();c.globalAlpha*=alpha;c.translate(x,y);c.scale(1,ry/rx);
 const g=c.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,hex(color,.9));g.addColorStop(.45,hex(color,.35));g.addColorStop(1,hex(color,0));
 c.fillStyle=g;c.beginPath();c.arc(0,0,rx,0,TAU);c.fill();c.restore();
}
// 번개(지그재그). 50ms 마다 모양이 바뀌어 번쩍인다.
function bolt(c,x0,y0,x1,y1,seed,t,color,width,alpha){
 if(alpha<=0)return;
 const frame=Math.floor(t*20),n=9,pts=[[x0,y0]];
 for(let i=1;i<n;i++){const u=i/n,j=(rnd(seed+frame*31,i)-.5)*Math.hypot(x1-x0,y1-y0)*.16;pts.push([x0+(x1-x0)*u+j,y0+(y1-y0)*u+j*.3]);}
 pts.push([x1,y1]);
 c.save();c.globalCompositeOperation=GLOW;
 glowPath(c,()=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));},color,width,alpha);
 const k=3+Math.floor(rnd(seed+frame,99)*3);                      // 곁가지
 const b=pts[k],e=[b[0]+(rnd(seed+frame,7)-.5)*60,b[1]+30+rnd(seed+frame,8)*30];
 glowPath(c,()=>{c.beginPath();c.moveTo(b[0],b[1]);c.lineTo((b[0]+e[0])/2+(rnd(seed+frame,9)-.5)*14,(b[1]+e[1])/2);c.lineTo(e[0],e[1]);},color,width*.5,alpha*.8);
 c.restore();
}
// 등각 사각 기둥(월드 좌표). 보이는 두 옆면 + 윗면.
function prism(d,x,y,s,h,z0,colors,alpha=1,edge=null){
 if(alpha<=0||h<=.05)return;
 const c=d.c;c.save();c.globalAlpha*=alpha;
 const P=(px,py,pz)=>d.p(px,py,pz);
 const face=(pts,fill)=>{c.beginPath();pts.forEach((v,i)=>{const q=P(...v);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);});c.closePath();c.fillStyle=fill;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=1.2;c.stroke();}};
 const x0=x-s,x1=x+s,y0=y-s,y1=y+s,z1=z0+h;
 face([[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],colors[0]);
 face([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],colors[1]);
 face([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],colors[2]);
 c.restore();
}

// ── 1. 일반 공격 ─────────────────────────────────────────────
// e: {kind:'light'|'heavy', x, y, aim, radius(사거리), equipment, life, full}
export function drawStrike(d,e){
 const c=d.c,st=strikeStyle(e.equipment),full=e.full||STRIKE_LIFE,u=clamp01(1-e.life/full);
 const {angle,unit}=screenAim(e.aim||{x:1,y:0}),o=d.p(e.x,e.y,3.2),pal=st.palette;
 const heavyKind=e.kind==='heavy'?1.2:1,S=st.scale*heavyKind;
 c.save();
 if(st.family==='punch')drawPunch(c,o,angle,unit,e,st,u,S);
 else if(st.family==='thrust')drawThrust(c,o,angle,unit,e,st,u,S);
 else drawSwing(d,c,o,angle,unit,e,st,u,S);
 c.restore();
}
function drawPunch(c,o,angle,unit,e,st,u,S){
 const pal=st.palette,reach=Math.min(e.radius*.55,5.2)*unit;
 const x=o.x+Math.cos(angle)*reach,y=o.y+Math.sin(angle)*reach;
 const a=1-span(u,.35,1);
 c.globalCompositeOperation=GLOW;
 softGlow(c,x,y,20*S,14*S,pal.main,a*.8*(1-u*.6));
 const ring=(6+u*24)*S;                                          // 짧게 퍼지는 충격 고리
 glowPath(c,()=>{c.beginPath();c.ellipse(x,y,ring,ring*.62,angle,0,TAU);},pal.main,1.6*S*(1-u),a*.9,pal.glow);
 if(st.tier!=='plain'){const r2=ring*.62;glowPath(c,()=>{c.beginPath();c.ellipse(x,y,r2,r2*.62,angle,0,TAU);},pal.glow,1*S,a*.6);}
 for(let i=0;i<6;i++){                                            // 짧은 빛살(주먹 방향으로 조금 더 길게)
  const ra=angle+(i-2.5)*.55+(rnd(e.seed||7,i)-.5)*.3,len=(8+rnd(e.seed||7,i+9)*9)*S*(1+Math.cos(ra-angle)*.4)*(.4+u*.9);
  glowPath(c,()=>{c.beginPath();c.moveTo(x+Math.cos(ra)*5*S,y+Math.sin(ra)*4*S);c.lineTo(x+Math.cos(ra)*(5*S+len),y+Math.sin(ra)*(4*S+len*.7));},pal.main,1.3*S,a*(1-u));
 }
 star(c,x,y,(12-u*8)*S,'#ffffff',a);
 if(st.tier==='legend')for(let i=0;i<5;i++){const r=(10+u*26)*S,ra=rnd(e.seed||3,i+20)*TAU;star(c,x+Math.cos(ra)*r,y+Math.sin(ra)*r*.6,3.5*S*(1-u),pal.glow,a);}
}
function drawThrust(c,o,angle,unit,e,st,u,S){
 const pal=st.palette,len=e.radius*1.02*unit,grow=easeOut(span(u,0,.3)),a=1-span(u,.45,1);
 const start=6,tip=start+len*grow,w=(st.tier==='legend'?7:st.tier==='hero'?5.2:4)*S*(1-u*.4);
 c.translate(o.x,o.y);c.rotate(angle);c.globalCompositeOperation=GLOW;
 c.save();c.globalAlpha*=a*.55;c.fillStyle=pal.main;                // 좁고 긴 빛창(끝이 뾰족)
 c.beginPath();c.moveTo(start,-w);c.lineTo(tip-w*2.4,-w*.55);c.lineTo(tip,0);c.lineTo(tip-w*2.4,w*.55);c.lineTo(start,w);c.closePath();c.fill();c.restore();
 glowPath(c,()=>{c.beginPath();c.moveTo(start+4,0);c.lineTo(tip,0);},pal.main,w*.55,a,pal.glow);
 for(const s of [-1,1]){                                          // 옆 속도선
  const off=s*w*2.1,l0=start+len*.15*grow,l1=start+len*(.62+(s>0?.08:0))*grow;
  glowPath(c,()=>{c.beginPath();c.moveTo(l0,off);c.lineTo(l1,off);},pal.main,.8*S,a*.7);
 }
 const flash=bell(u,.18,.3,.62);                                  // 창끝의 뾰족한 충돌파
 if(flash>0){
  star(c,tip,0,14*S*flash,'#ffffff',flash,0);
  glowPath(c,()=>{c.beginPath();c.ellipse(tip,0,5*S*(1+flash),11*S*flash,0,0,TAU);},pal.main,1.2*S,flash*.8);
 }
 if(st.tier==='legend'){                                          // 레전드: 겹쳐 뻗는 두 번째 빛창 · 빛가루
  glowPath(c,()=>{c.beginPath();c.moveTo(start,-w*1.2);c.lineTo(tip*.86,-w*.2);},pal.glow,.9*S,a*.6);
  glowPath(c,()=>{c.beginPath();c.moveTo(start,w*1.2);c.lineTo(tip*.86,w*.2);},pal.glow,.9*S,a*.6);
  for(let i=0;i<6;i++)star(c,start+rnd(e.seed||5,i)*tip,(rnd(e.seed||5,i+7)-.5)*w*5,3*S,pal.glow,a*(1-u));
 }
}
function drawSwing(d,c,o,angle,unit,e,st,u,S){
 const pal=st.palette,w=st.weight;
 const sweep=w==='heavy'?1.75:w==='light'?1.45:1.6;                  // 휘두르는 각(반쪽)
 const R=e.radius*(w==='heavy'?.72:.68)*unit;
 const thick=(w==='heavy'?15:w==='light'?6:10)*S;
 const speed=w==='light'?.32:w==='heavy'?.5:.4;
 const head=-sweep+2*sweep*easeOut(span(u,0,speed));
 const tail=Math.max(-sweep,head-(w==='light'?1.6:2.4));
 const a=1-span(u,speed*.9,1);
 c.save();c.translate(o.x,o.y);c.rotate(angle);c.scale(1,.58);   // 바닥과 나란한 수평 베기(위에서 본 원)
 c.globalCompositeOperation=GLOW;
 const crescent=(r,th,alpha,color)=>{
  if(alpha<=0||head-tail<.02)return;
  const n=24;c.beginPath();
  for(let i=0;i<=n;i++){const t=tail+(head-tail)*i/n;c.lineTo(Math.cos(t)*r,Math.sin(t)*r);}
  for(let i=n;i>=0;i--){const t=tail+(head-tail)*i/n,k=Math.pow(i/n,.8);c.lineTo(Math.cos(t)*(r-th*k),Math.sin(t)*(r-th*k));}
  c.closePath();c.globalAlpha=alpha;c.fillStyle=color;c.fill();c.globalAlpha=1;
 };
 crescent(R+thick*.35,thick*1.9,a*.22,pal.glow);                   // 번짐
 crescent(R,thick,a*.85,pal.main);                                 // 몸통
 crescent(R,thick*.2,a,'#ffffff');                                  // 날 끝의 흰 선
 if(st.tier==='legend')crescent(R*.72,thick*.6,a*.55,pal.glow);     // 레전드: 안쪽 두 번째 궤적
 if(w==='light'||st.tier!=='plain'){                               // 궤적 끝의 반짝임(라켓은 산뜻하게)
  const n=w==='light'?4:st.tier==='legend'?7:4;
  for(let i=0;i<n;i++){const t=tail+(head-tail)*rnd(e.seed||2,i),r=R-thick*rnd(e.seed||2,i+10);star(c,Math.cos(t)*r,Math.sin(t)*r,(w==='light'?4:3.2)*S,pal.glow,a);}
 }
 c.restore();
 if(w==='heavy'){                                                  // 파쇄추 · 해머: 내려찍은 자리의 바닥 충격파 · 먼지 · 돌조각
  const hit=bell(u,.3,.42,1);
  if(hit>0){
   const g=d.p(e.x+(e.aim?.x||1)*e.radius*.55,e.y+(e.aim?.y||0)*e.radius*.55,0),k=span(u,.3,1);
   c.save();c.globalCompositeOperation=GLOW;
   for(const m of [1,.62])glowPath(c,()=>{c.beginPath();c.ellipse(g.x,g.y,(10+k*38)*S*m,(5+k*20)*S*m,0,0,TAU);},pal.main,2.2*S*m,hit);
   c.restore();
   for(let i=0;i<5;i++)softGlow(c,g.x+(rnd(e.seed||4,i)-.5)*40*S,g.y-4-k*10*rnd(e.seed||4,i+5),12*S,8*S,'#c8b8a0',hit*.35);
   for(let i=0;i<6;i++){const ra=rnd(e.seed||4,i+20)*TAU,r=(8+k*30)*S,h=Math.sin(k*Math.PI)*16*S*rnd(e.seed||4,i+30);
    shard(c,g.x+Math.cos(ra)*r,g.y+Math.sin(ra)*r*.55-h,2.8*S,ra+k*4,'#3a302b','#9a8a78',hit);}
  }
 }
}

// 화면 위쪽(뒤)을 향한 일반 공격인가 — 그러면 잔상을 캐릭터 몸 뒤 층에 그린다.
export function strikeBehind(e){return (e.kind==='light'||e.kind==='heavy')&&e.source==='player'&&!!e.aim&&e.aim.x+e.aim.y<-.3;}

// 맞은 자리. 모션군마다 다른 반응. e: {x,y,aim,radius,equipment,kind,seed,life}
export function drawImpact(d,e){
 // Q 는 무기와 상관없이 흰 공명 충격, R 은 학과 색 충격(무기 모션군과 상관없는 공통 반응).
 const c=d.c,st=e.strike==='q'?{family:'punch',tier:'plain',palette:WHITE,weight:'fist',scale:1.1}:e.strike==='r'?{family:'punch',tier:'legend',palette:DEPT_FX[e.department]||WHITE,weight:'fist',scale:1.35}:strikeStyle(e.equipment),full=e.full||STRIKE_LIFE,u=clamp01(1-e.life/full),pal=st.palette;
 const heavy=e.strike==='heavy'||e.strike==='r'||e.strike==='q',S=st.scale*(heavy?1.25:1);
 const p=d.p(e.x,e.y,5),{angle}=screenAim(e.aim||{x:1,y:0}),a=1-span(u,.25,1);
 c.save();c.globalCompositeOperation=GLOW;
 softGlow(c,p.x,p.y,16*S,12*S,pal.main,a*.7*(1-u*.7));
 if(st.family==='swing'){                                           // 베인 자국: 진행 방향을 가로지르는 빛선 + 튀는 불똥
  const cut=angle+Math.PI/2.6,L=(16+u*10)*S*(st.weight==='heavy'?1.3:st.weight==='light'?.8:1);
  glowPath(c,()=>{c.beginPath();c.moveTo(p.x-Math.cos(cut)*L,p.y-Math.sin(cut)*L);c.lineTo(p.x+Math.cos(cut)*L,p.y+Math.sin(cut)*L);},pal.main,(st.weight==='heavy'?3.2:2.2)*S*(1-u*.6),a,pal.glow);
  for(let i=0;i<7;i++){const ra=angle+(rnd(e.seed||1,i)-.5)*1.4,r0=4*S,r1=r0+(8+rnd(e.seed||1,i+9)*16)*S*(.3+u);
   glowPath(c,()=>{c.beginPath();c.moveTo(p.x+Math.cos(ra)*r0,p.y+Math.sin(ra)*r0);c.lineTo(p.x+Math.cos(ra)*r1,p.y+Math.sin(ra)*r1);},pal.main,1*S,a*(1-u));}
  if(st.weight==='heavy'){const g=d.p(e.x,e.y,0);glowPath(c,()=>{c.beginPath();c.ellipse(g.x,g.y,(8+u*30)*S,(4+u*15)*S,0,0,TAU);},pal.main,2*S,a*.8);}
 }else if(st.family==='thrust'){                                    // 관통선: 몸을 꿰뚫고 뒤로 빠져나가는 빛 + 뾰족한 충돌파
  const back=10*S,front=(16+u*18)*S;
  glowPath(c,()=>{c.beginPath();c.moveTo(p.x-Math.cos(angle)*back,p.y-Math.sin(angle)*back);c.lineTo(p.x+Math.cos(angle)*front,p.y+Math.sin(angle)*front);},pal.main,2*S*(1-u*.5),a,pal.glow);
  glowPath(c,()=>{c.beginPath();c.ellipse(p.x,p.y,4*S*(1+u),12*S*(.5+u),angle,0,TAU);},pal.main,1.2*S,a*.8);
  star(c,p.x+Math.cos(angle)*front,p.y+Math.sin(angle)*front,7*S*(1-u),'#ffffff',a,angle);
 }else{                                                              // 타격: 별 모양 충격 + 짧은 고리
  const ring=(5+u*18)*S;
  glowPath(c,()=>{c.beginPath();c.ellipse(p.x,p.y,ring,ring*.7,0,0,TAU);},pal.main,1.6*S*(1-u),a);
  for(let i=0;i<8;i++){const ra=i/8*TAU+(rnd(e.seed||1,i)-.5)*.4,r0=3*S,r1=r0+(6+rnd(e.seed||1,i+3)*8)*S*(.4+u);
   glowPath(c,()=>{c.beginPath();c.moveTo(p.x+Math.cos(ra)*r0,p.y+Math.sin(ra)*r0*.8);c.lineTo(p.x+Math.cos(ra)*r1,p.y+Math.sin(ra)*r1*.8);},pal.main,1.4*S,a*(1-u));}
  star(c,p.x,p.y,(10-u*7)*S,'#ffffff',a);
 }
 if(st.tier==='legend')for(let i=0;i<5;i++){const ra=rnd(e.seed||9,i+40)*TAU,r=(8+u*24)*S;star(c,p.x+Math.cos(ra)*r,p.y+Math.sin(ra)*r*.7,3*S*(1-u),pal.glow,a);}
 c.restore();
}

// ── 2. 공명 타격(Q) ──────────────────────────────────────────
// e: {kind:'q', x, y, radius, department, life, full}. layer: 'ground' | 'back' | 'front'
export function drawResonance(d,e,layer,t=0){
 const c=d.c,full=e.full||Q_LIFE,u=clamp01(1-e.life/full),pal=DEPT_FX[e.department]||WHITE;
 const g=groundEllipse(d,e.x,e.y,e.radius),seed=Math.round(e.x*13+e.y*7);
 const fade=1-span(u,.7,1);
 c.save();
 if(layer==='ground'){
  const open=easeOut(span(u,0,.14));
  softGlow(c,g.x,g.y,g.rx,g.ry,'#ffffff',.16*fade);
  softGlow(c,g.x,g.y,g.rx*.9,g.ry*.9,pal.main,.12*fade);
  // 원 안의 옅은 균열(가운데에서 바깥으로 자라난다)
  const grow=easeOut(span(u,.04,.3));
  c.lineCap='round';
  for(let i=0;i<9;i++){
   const a0=i/9*TAU+rnd(seed,i)*.5,len=(.45+rnd(seed,i+20)*.35)*grow;let x=g.x+Math.cos(a0)*g.rx*.12,y=g.y+Math.sin(a0)*g.ry*.12;
   c.beginPath();c.moveTo(x,y);
   for(let k=1;k<=4;k++){const a=a0+(rnd(seed,i*9+k)-.5)*.5,r=.12+len*k/4;x=g.x+Math.cos(a)*g.rx*r;y=g.y+Math.sin(a)*g.ry*r;c.lineTo(x,y);}
   c.globalAlpha=.4*fade;c.strokeStyle='#2c2522';c.lineWidth=2.2;c.stroke();
   c.globalAlpha=.55*fade;c.strokeStyle=pal.glow;c.lineWidth=.9;c.stroke();
  }
  c.globalAlpha=1;c.globalCompositeOperation=GLOW;
  // 공명 원: 바깥 테 + 안쪽 가는 테 + 네 방향 마름모 표식
  glowPath(c,ellipsePath(c,g,.86+.14*open),'#f4f8ff',3.2,fade,pal.main);   // 흰 공명 테 + 학과 색 번짐
  glowPath(c,ellipsePath(c,g,.8*open),pal.glow,1.1,fade*.7);
  for(let i=0;i<4;i++){const b=i*Math.PI/2,x=g.x+Math.cos(b)*g.rx*(.86+.14*open),y=g.y+Math.sin(b)*g.ry*(.86+.14*open);
   crystal(c,x,y,5,8,pal.main,'#ffffff',fade*open);}
  c.restore();return;
 }
 // 가장자리에서 치솟는 흰 기류. 원의 뒤쪽 절반은 캐릭터 뒤, 앞쪽 절반은 앞에 그린다.
 // ① 둘레를 따라 서는 옅은 바람벽(아래가 진하고 위로 사라지는 흰 막) ② 그 위로 너울대는 불꽃 모양 기류 혀.
 c.globalCompositeOperation=GLOW;
 const rise=bell(u,.03,.24,.85),wall=62*rise,front=layer==='front';
 if(wall>1){
  const n=48;
  for(let i=0;i<n;i++){
   const b0=i/n*TAU,b1=(i+1)/n*TAU;if((Math.sin((b0+b1)/2)>0)!==front)continue;
   const x0=g.x+Math.cos(b0)*g.rx,y0=g.y+Math.sin(b0)*g.ry,x1=g.x+Math.cos(b1)*g.rx,y1=g.y+Math.sin(b1)*g.ry;
   const h=wall*(.75+.25*Math.sin(b0*5+u*9));
   const gr=c.createLinearGradient(0,Math.min(y0,y1),0,Math.min(y0,y1)-h);
   gr.addColorStop(0,hex('#ffffff',.5*fade));gr.addColorStop(.35,hex(pal.glow,.22*fade));gr.addColorStop(1,hex(pal.glow,0));
   c.fillStyle=gr;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.lineTo(x1,y1-h);c.lineTo(x0,y0-h);c.closePath();c.fill();
  }
 }
 const N=34;
 for(let i=0;i<N;i++){
  const b=i/N*TAU+rnd(seed,i+100)*.15;if((Math.sin(b)>0)!==front)continue;
  const x=g.x+Math.cos(b)*g.rx,y=g.y+Math.sin(b)*g.ry;
  const lift=bell(u,.03+rnd(seed,i+130)*.08,.22+rnd(seed,i+131)*.1,.85);
  const tall=(60+rnd(seed,i+140)*70)*(i%5===0?1.4:1)*lift,sway=(rnd(seed,i+170)-.5)*30+Math.sin(u*8+i)*6,w=16+rnd(seed,i+190)*14;
  if(tall<3)continue;
  const tongue=(k,ww)=>{c.beginPath();c.moveTo(x-ww*.5,y);c.bezierCurveTo(x-ww*.7,y-tall*k*.35,x-ww*.1+sway*.6,y-tall*k*.6,x+sway,y-tall*k);c.bezierCurveTo(x+ww*.2+sway*.6,y-tall*k*.6,x+ww*.7,y-tall*k*.35,x+ww*.5,y);c.closePath();};
  const gr=c.createLinearGradient(0,y,0,y-tall);gr.addColorStop(0,hex(pal.main,.55*fade));gr.addColorStop(.6,hex(pal.glow,.25*fade));gr.addColorStop(1,hex(pal.glow,0));
  c.fillStyle=gr;tongue(1,w);c.fill();                                   // 학과 색 가장자리
  const gw=c.createLinearGradient(0,y,0,y-tall*.85);gw.addColorStop(0,hex('#ffffff',.95*fade));gw.addColorStop(.55,hex('#ffffff',.6*fade));gw.addColorStop(1,hex('#ffffff',0));
  c.fillStyle=gw;tongue(.85,w*.55);c.fill();                             // 흰 기류 심
 }
 // 작은 파편(원 안에서 튀어 올랐다 떨어진다)
 c.globalCompositeOperation='source-over';
 for(let i=0;i<16;i++){
  const b=rnd(seed,i+300)*TAU,r=.2+rnd(seed,i+320)*.65,bx=g.x+Math.cos(b)*g.rx*r,by=g.y+Math.sin(b)*g.ry*r;
  if((layer==='front')!==(by>g.y))continue;
  const k=span(u,.05+rnd(seed,i+340)*.1,.75);if(k<=0||k>=1)continue;
  const h=Math.sin(k*Math.PI)*(18+rnd(seed,i+360)*26),out=k*10*(rnd(seed,i+380)-.5);
  shard(c,bx+out,by-h,2.2+rnd(seed,i+400)*2,k*6+i,'#2b2426','#b8aca6',fade);
 }
 if(layer==='front'){                                                // 떠오르는 빛가루
  for(let i=0;i<10;i++){const b=rnd(seed,i+500)*TAU,x=g.x+Math.cos(b)*g.rx*(.9+rnd(seed,i+520)*.15),y=g.y+Math.sin(b)*g.ry-span(u,.1,1)*90*rnd(seed,i+540);
   star(c,x,y,3.5*(1-u),'#ffffff',fade);}
 }
 c.restore();
}

// ── 3. 최고 기술(R) ──────────────────────────────────────────
// e: {kind:'ultimate', department, x, y, radius, life, full, name}. layer: 'ground' | 'back' | 'front'
export function drawUltimateVfx(d,e,layer,t=0){
 const full=e.full||R_LIFE,u=clamp01(1-e.life/full);
 const draw=ULT[e.department]||ULT.architecture;
 const c=d.c;c.save();
 // Revision 82: g 는 실제 판정 반경(e.radius = COMBAT.rRadius) 그대로의 지면 타원 — 바닥 원 · 마법진 · 균열 · 둘레 장식은 이 안에 그린다
 // (둘레 밖으로 나가던 눈금 · 점선 · 충격파 고리를 원 안으로 당겼다). 폭발 빛살 크기만 g.detail 로 예전 학과 연출 크기를 유지한다.
 const g=groundEllipse(d,e.x,e.y,e.radius);g.detail=Math.min(1,(ULT_BURST_RADIUS[e.department]||e.radius)/(e.radius||1));
 draw(d,e,layer,u,t,g,Math.round(e.x*7+e.y*11+(e.department||'').length*97));
 c.restore();
 if(layer==='front'&&e.name&&u<.85){d.c.save();d.c.globalAlpha=1-span(u,.7,.85);d.label(e.x,e.y,e.name,'#263c36',30);d.c.restore();}
}
const inFront=(g,y,layer)=>(layer==='front')===(y>g.y);
// 폭발 빛살(burstFx) 크기의 기준 반경 — Revision 82 이전 학과별 R 반경. 범위가 54 로 넓어져도 화면을 덮지 않게 폭발 크기만 예전대로 둔다.
const ULT_BURST_RADIUS={architecture:42,machine:30,electric:52,civil:36};
// 원 둘레의 점(화면). b: 화면 타원 각도, k: 반지름 비율
const ringPt=(g,b,k=1)=>({x:g.x+Math.cos(b)*g.rx*k,y:g.y+Math.sin(b)*g.ry*k,front:Math.sin(b)>0});

// 최고 기술 공통 도구
// 아래는 밝고 위로 사라지는 빛기둥
function beam(c,x,y,h,w,color,alpha){
 if(alpha<=0||h<=1)return;
 c.save();
 const g=c.createLinearGradient(0,y,0,y-h);g.addColorStop(0,hex(color,.75*alpha));g.addColorStop(.5,hex(color,.35*alpha));g.addColorStop(1,hex(color,0));
 c.fillStyle=g;c.beginPath();c.moveTo(x-w,y);c.lineTo(x-w*.55,y-h);c.lineTo(x+w*.55,y-h);c.lineTo(x+w,y);c.closePath();c.fill();
 const k=c.createLinearGradient(0,y,0,y-h*.9);k.addColorStop(0,hex('#ffffff',.95*alpha));k.addColorStop(1,hex('#ffffff',0));
 c.fillStyle=k;c.fillRect(x-w*.22,y-h*.9,w*.44,h*.9);
 c.restore();
}
// 굵은 폭발 빛살(끝이 가늘어지는 삼각형) + 흰 중심. flat: 세로 납작함(바닥 원근).
function burstFx(c,x,y,R,pal,alpha,seed,n=16,flat=.62){
 if(alpha<=0)return;
 c.save();
 for(let i=0;i<n;i++){
  const a=i/n*TAU+(rnd(seed,i)-.5)*.35,len=R*(.55+rnd(seed,i+40)*.55),w=(5+rnd(seed,i+80)*7)*(R/200+.6);
  const ex=x+Math.cos(a)*len,ey=y+Math.sin(a)*len*flat,nx=-Math.sin(a)*w,ny=Math.cos(a)*w*flat;
  const g=c.createLinearGradient(x,y,ex,ey);g.addColorStop(0,hex('#ffffff',.95*alpha));g.addColorStop(.25,hex(pal.main,.9*alpha));g.addColorStop(1,hex(pal.main,0));
  c.fillStyle=g;c.beginPath();c.moveTo(x+nx,y+ny);c.lineTo(ex,ey);c.lineTo(x-nx,y-ny);c.closePath();c.fill();
 }
 softGlow(c,x,y,R*.36,R*.36*flat,pal.main,alpha*.45);                  // 중심 번짐은 짧고 옅게 — 홍길동을 오래 가리지 않는다
 softGlow(c,x,y,R*.1,R*.1*flat,'#ffffff',alpha*.7);
 c.restore();
}
// 바닥을 따라 퍼지는 충격파 고리
function shockRing(c,g,k,color,alpha,width=6){
 if(alpha<=0||k<=0)return;
 glowPath(c,()=>{c.beginPath();c.ellipse(g.x,g.y,g.rx*k,g.ry*k,0,0,TAU);},color,width*(1-k*.4),alpha);
}
// 둘레를 도는 원호 띠(소용돌이). 앞층은 앞쪽 반, 뒤층은 뒤쪽 반.
function swirl(c,g,h,k,rot,color,alpha,layer,width=3){
 if(alpha<=0)return;
 const a0=layer==='front'?0:Math.PI;
 for(let i=0;i<3;i++){
  const s=a0+((rot+i/3*Math.PI)%Math.PI),e=Math.min(a0+Math.PI,s+.9);if(e<=s)continue;
  glowPath(c,()=>{c.beginPath();c.ellipse(g.x,g.y-h,g.rx*k,g.ry*k,0,s,e);},color,width,alpha);
 }
}
// 날아올랐다 떨어지는 파편 공통 궤적(0~1)
function fling(g,seed,i,k,spread=1){
 const a=rnd(seed,i)*TAU,r=easeOut(k)*g.rx*(.25+rnd(seed,i+1)*.75)*spread,gy=g.y+Math.sin(a)*r*g.ry/g.rx;
 return {x:g.x+Math.cos(a)*r,y:gy-Math.sin(k*Math.PI)*(50+rnd(seed,i+2)*90),ground:gy,rot:k*7+i};
}

const ULT={
 // 건축디자인과 · 천공 설계진(Image B): 붉은 설계진 → 도면 패널 · 기둥 · 트러스 → 붉은 결정 · 공간 재단 → 붕괴 폭발 → 잔광
 architecture(d,e,layer,u,t,g,seed){
  const c=d.c,pal=DEPT_FX.architecture,fade=1-span(u,.84,1),open=easeOut(span(u,0,.14));
  const build=easeOut(span(u,.14,.36)),collapse=span(u,.58,.8),boomK=span(u,.58,.9),boom=bell(u,.57,.62,.8);
  // 기둥은 화면 대각선 네 곳(월드 0° · 90° · 180° · 270°) — 가운데 홍길동을 가리지 않는다.
  const P=[0,1,2,3].map(i=>{const a=i*Math.PI/2,wx=e.x+Math.cos(a)*e.radius*.56,wy=e.y+Math.sin(a)*e.radius*.56;return {a,wx,wy,base:d.p(wx,wy,0),top:d.p(wx,wy,24*build)};});
  const core=d.p(e.x,e.y,17+2*Math.sin(t*3));
  if(layer==='ground'){
   softGlow(c,g.x,g.y,g.rx,g.ry,pal.main,.32*fade);
   c.save();c.beginPath();c.ellipse(g.x,g.y,g.rx*open,g.ry*open,0,0,TAU);c.clip();          // 도면 격자(월드 격자)
   c.globalAlpha=.4*fade;c.strokeStyle=pal.glow;c.lineWidth=1;
   const n=10,step=e.radius/n*2;
   for(let i=-n;i<=n;i++){const a=d.p(e.x+i*step/2,e.y-e.radius),b=d.p(e.x+i*step/2,e.y+e.radius),a2=d.p(e.x-e.radius,e.y+i*step/2),b2=d.p(e.x+e.radius,e.y+i*step/2);
    c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.moveTo(a2.x,a2.y);c.lineTo(b2.x,b2.y);c.stroke();}
   c.restore();
   for(const k of [1,.8,.58,.3])glowPath(c,ellipsePath(c,g,k*open),pal.main,k===1?3.4:1.5,fade*(k===1?1:.75),pal.glow);
   c.save();c.setLineDash([18,10]);c.lineDashOffset=-u*160;glowPath(c,ellipsePath(c,g,.92*open),pal.main,1.4,fade*.8);c.restore();
   glowPath(c,()=>{c.beginPath();for(const [ax,ay] of [[1,0],[0,1]]){const a=d.p(e.x-ax*e.radius*open,e.y-ay*e.radius*open),b=d.p(e.x+ax*e.radius*open,e.y+ay*e.radius*open);c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);}},pal.main,1.6,fade);
   for(let i=0;i<32;i++){const b=i/32*TAU,a=ringPt(g,b,1),q=ringPt(g,b,i%4===0?.86:.94);                // 치수 눈금(원 안쪽으로)
    glowPath(c,()=>{c.beginPath();c.moveTo(a.x,a.y);c.lineTo(q.x,q.y);},pal.main,1.1,fade*open);}
   for(let i=0;i<6;i++){const q=ringPt(g,i/6*TAU+.4,.72),w=38,h=22,a=bell(u,.02,.1,.4);         // 바닥 도면 칸(격자 패널)
    if(a<=0)continue;c.save();c.globalAlpha=a*.75;c.translate(q.x,q.y);c.transform(1,.52,-1,.52,0,0);
    c.fillStyle=hex(pal.main,.35);c.fillRect(-w/2,-h/2,w,h);c.strokeStyle=pal.glow;c.lineWidth=1.2;c.strokeRect(-w/2,-h/2,w,h);
    c.beginPath();for(let k=1;k<4;k++){c.moveTo(-w/2+k*w/4,-h/2);c.lineTo(-w/2+k*w/4,h/2);}c.moveTo(-w/2,0);c.lineTo(w/2,0);c.stroke();c.restore();}
   shockRing(c,g,boomK,pal.main,boom,8);
   return;
  }
  // 둘레에서 솟는 붉은 설계 빛기둥
  for(let i=0;i<12;i++){const q=ringPt(g,i/12*TAU+.13,1);if(q.front!==(layer==='front'))continue;beam(c,q.x,q.y,(90+rnd(seed,i)*60)*bell(u,.04,.2,.62),7,pal.main,fade);}
  // 떠오르는 도면 패널
  for(let i=0;i<6;i++){const q=ringPt(g,i/6*TAU+.95,.9);if(q.front!==(layer==='front'))continue;
   const a=bell(u,.1,.24,.6);if(a<=0)continue;const w=46,h=54,y=q.y-50-a*40;
   c.save();c.globalAlpha=a*.85;c.fillStyle=hex(pal.main,.3);c.fillRect(q.x-w/2,y-h,w,h);c.strokeStyle=pal.glow;c.lineWidth=1.4;c.strokeRect(q.x-w/2,y-h,w,h);
   c.lineWidth=.8;c.beginPath();for(let k=1;k<5;k++){c.moveTo(q.x-w/2+k*w/5,y-h);c.lineTo(q.x-w/2+k*w/5,y);c.moveTo(q.x-w/2,y-h+k*h/5);c.lineTo(q.x+w/2,y-h+k*h/5);}c.stroke();
   c.strokeStyle='#ffffff';c.lineWidth=1.4;c.beginPath();c.moveTo(q.x-w*.3,y-h*.25);c.lineTo(q.x,y-h*.7);c.lineTo(q.x+w*.3,y-h*.25);c.stroke();c.restore();}
  // 네 기둥(검붉은 석재 + 붉은 테) — 붕괴 때 조각으로 흩어진다
  for(const pl of P){
   if((pl.base.y>g.y)!==(layer==='front'))continue;
   if(collapse<=0)prism(d,pl.wx,pl.wy,1.9,24*build,0,['#3a2a2e','#57424a','#a88a92'],fade,pal.main);
   else for(let k=0;k<4;k++){const f=fling(g,seed+k*13,pl.a*10+k,collapse,.3),ox=pl.base.x+(f.x-g.x)*1.4,oy=pl.base.y-40-k*30+(f.y-g.y);
    c.save();c.globalAlpha=(1-collapse)*fade;c.translate(ox,oy);c.rotate(f.rot*.4);c.fillStyle='#4a363c';c.fillRect(-7,-14,14,28);c.strokeStyle=pal.main;c.lineWidth=1.6;c.strokeRect(-7,-14,14,28);c.restore();}
  }
  if(layer==='front'){
   const s=build*(1-collapse);
   if(s>0){                                                        // 트러스 보 + 결정으로 모이는 구조선
    c.save();c.globalAlpha=s*fade;
    for(let i=0;i<4;i++){const a=P[i].top,b=P[(i+1)%4].top,a2={x:a.x,y:a.y+10},b2={x:b.x,y:b.y+10};
     glowPath(c,()=>{c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.moveTo(a2.x,a2.y);c.lineTo(b2.x,b2.y);
      for(let k=0;k<5;k++){const u0=k/5,u1=(k+1)/5;c.moveTo(a.x+(b.x-a.x)*u0,a.y+(b.y-a.y)*u0);c.lineTo(a2.x+(b2.x-a2.x)*u1,a2.y+(b2.y-a2.y)*u1);}},pal.main,1.5,1);
     glowPath(c,()=>{c.beginPath();c.moveTo(a.x,a.y);c.lineTo(core.x,core.y);},pal.glow,1,span(u,.3,.42));}
    c.restore();
   }
   const glowK=bell(u,.26,.5,.62);                                   // 가운데 붉은 결정(머리 위)
   if(collapse<1&&build>0){softGlow(c,core.x,core.y,60,60,pal.main,glowK*.85);beam(c,core.x,core.y-26,140*glowK,10,pal.main,glowK*.8);
    crystal(c,core.x,core.y,13+glowK*6,26+glowK*12,pal.main,'#ffe1e1',build*(1-collapse));}
   const cut=bell(u,.44,.5,.6);                                      // 공간 재단: 원을 가로지르는 붉은 절단선
   if(cut>0)for(let i=0;i<4;i++){const a=i*.8+.3,dx=Math.cos(a)*g.rx,dy=Math.sin(a)*g.ry,k=span(u,.44+i*.02,.52+i*.02);
    glowPath(c,()=>{c.beginPath();c.moveTo(g.x-dx,g.y-dy-20);c.lineTo(g.x-dx+2*dx*k,g.y-dy-20+2*dy*k);},pal.main,3.2,cut,pal.glow);}
   if(boom>0){burstFx(c,core.x,core.y,g.rx*1.1*g.detail,pal,boom,seed,18,.7);
    for(let i=0;i<16;i++){const f=fling(g,seed,i*3+200,boomK);crystal(c,f.x,f.y-30,5,11,pal.main,'#ffe1e1',boom,f.rot);}}
   const dome=span(u,.64,.8)*fade;                                   // 보호막 35: 자신을 감싸는 붉은 반구
   if(dome>0){const p=d.p(e.x,e.y,0);c.save();c.globalAlpha=dome*.8;c.strokeStyle=pal.glow;c.lineWidth=2;
    c.beginPath();c.ellipse(p.x,p.y-22,36,40,0,Math.PI,TAU);c.ellipse(p.x,p.y,36,15,0,0,Math.PI);c.stroke();c.globalAlpha=dome*.14;c.fillStyle=pal.main;c.beginPath();c.ellipse(p.x,p.y-22,36,40,0,Math.PI,TAU);c.fill();c.restore();}
  }
  for(let i=0;i<24;i++){                                            // 흩날리는 파편
   const k=span(u,.58+rnd(seed,i+140)*.06,.98);if(k<=0||k>=1)continue;const f=fling(g,seed,i*3+400,k);
   if((f.ground>g.y)!==(layer==='front'))continue;shard(c,f.x,f.y,3+rnd(seed,i+180)*4,f.rot,'#2a1d21','#e06a74',fade);}
  if(layer==='front')for(let i=0;i<10;i++){const q=ringPt(g,rnd(seed,i+200)*TAU,rnd(seed,i+220)),a=bell(u,.74,.82,1);   // 잔광: 떨어지는 붉은 빛선
   if(a>0)glowPath(c,()=>{c.beginPath();c.moveTo(q.x,q.y-(1-a)*20);c.lineTo(q.x,q.y-60-rnd(seed,i+240)*70);},pal.main,1.3,a*.8);}
 },
 // 자동화기계과 · 오버드라이브 프레스(Image C): 톱니 링 · 동력 코어 → 기계 팔 · 피스톤 → 과부하 → 코어 폭발 · 톱니 파편 → 소용돌이
 machine(d,e,layer,u,t,g,seed){
  const c=d.c,pal=DEPT_FX.machine,fade=1-span(u,.86,1),open=easeOut(span(u,0,.14)),spin=u*3;
  const arm=easeOut(span(u,.12,.34)),over=bell(u,.34,.52,.58),boom=bell(u,.54,.59,.78),boomK=span(u,.54,.9),gone=span(u,.54,.6);
  const core=d.p(e.x,e.y,15),press=Math.max(0,Math.sin(t*16))*arm*(1-gone);
  if(layer==='ground'){
   softGlow(c,g.x,g.y,g.rx,g.ry,pal.main,.3*fade);
   c.save();c.globalAlpha=fade*open;                                  // 청동 톱니 링(돈다) — 톱니 끝이 판정 원(1.0)
   const rim=c.createLinearGradient(g.x,g.y-g.ry,g.x,g.y+g.ry);rim.addColorStop(0,'#8a5a32');rim.addColorStop(.5,'#c98a4a');rim.addColorStop(1,'#5a3a22');
   c.fillStyle=rim;c.beginPath();c.ellipse(g.x,g.y,g.rx*.94*open,g.ry*.94*open,0,0,TAU);c.ellipse(g.x,g.y,g.rx*.8*open,g.ry*.8*open,0,0,TAU);c.fill('evenodd');
   c.fillStyle='#6b4428';for(let i=0;i<40;i++){const b=i/40*TAU+spin*.3,a=ringPt(g,b,.94*open),q=ringPt(g,b+.05,open),r=ringPt(g,b+.1,.94*open);
    c.beginPath();c.moveTo(a.x,a.y);c.lineTo(q.x,q.y);c.lineTo(r.x,r.y);c.closePath();c.fill();}
   c.fillStyle='#2a1a10';for(let i=0;i<12;i++){const q=ringPt(g,i/12*TAU+spin*.3,.87*open);c.beginPath();c.ellipse(q.x,q.y,3,2,0,0,TAU);c.fill();}   // 리벳
   c.restore();
   for(const k of [.84,.6,.38])glowPath(c,ellipsePath(c,g,k*open),pal.main,k>.8?2.6:1.6,fade,pal.glow);
   c.save();c.globalAlpha=.8*fade;c.strokeStyle=pal.main;c.lineWidth=4;                     // 가운데 기어(반대로 돈다)
   for(let i=0;i<16;i++){const b=i/16*TAU-spin*1.5,a=ringPt(g,b,.3),q=ringPt(g,b,.38);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(q.x,q.y);c.stroke();}c.restore();
   softGlow(c,g.x,g.y,g.rx*.3,g.ry*.3,pal.glow,(.45+.3*Math.sin(t*14))*fade*open);
   for(let i=0;i<4;i++){const a=i*Math.PI/2,q=d.p(e.x+Math.cos(a)*e.radius*.66,e.y+Math.sin(a)*e.radius*.66,0);   // 피스톤 자리 충격
    shockRing(c,{x:q.x,y:q.y,rx:40,ry:20},.4+press*.6,pal.main,press*.8*fade,4);}
   shockRing(c,g,boomK,pal.main,boom,9);
   return;
  }
  // 네 기계 팔: 둘레에서 솟아 코어를 향해 굽고, 끝의 피스톤이 쿵쿵 찧는다
  for(let i=0;i<4;i++){
   const a=i*Math.PI/2,bx=e.x+Math.cos(a)*e.radius*.95,by=e.y+Math.sin(a)*e.radius*.95,base=d.p(bx,by,0);
   if((base.y>g.y)!==(layer==='front')||arm<=0||gone>=1)continue;
   const j1=d.p(e.x+Math.cos(a)*e.radius*.95,e.y+Math.sin(a)*e.radius*.95,18*arm);
   const tip=d.p(e.x+Math.cos(a)*e.radius*.66,e.y+Math.sin(a)*e.radius*.66,(14-press*9)*arm);
   c.save();c.globalAlpha=(1-gone)*fade;c.lineCap='round';
   for(const [p0,p1,w] of [[base,j1,22],[j1,tip,17]]){
    c.strokeStyle='#2e1e12';c.lineWidth=w+4;c.beginPath();c.moveTo(p0.x,p0.y);c.lineTo(p1.x,p1.y);c.stroke();
    const gr=c.createLinearGradient(p0.x-w,p0.y,p0.x+w,p0.y);gr.addColorStop(0,'#7a4e2a');gr.addColorStop(.5,'#d99a58');gr.addColorStop(1,'#6b4226');
    c.strokeStyle=gr;c.lineWidth=w;c.stroke();c.strokeStyle=hex(pal.main,.9);c.lineWidth=3;c.stroke();
   }
   c.fillStyle='#5a3a22';c.strokeStyle='#2e1e12';c.lineWidth=2;c.fillRect(tip.x-14,tip.y-4,28,26);c.strokeRect(tip.x-14,tip.y-4,28,26);    // 피스톤 머리
   c.fillStyle=pal.glow;c.fillRect(tip.x-10,tip.y+16,20,4);
   for(const j of [base,j1]){c.fillStyle='#8a5a32';c.beginPath();c.arc(j.x,j.y,10,0,TAU);c.fill();c.strokeStyle='#2e1e12';c.stroke();c.fillStyle=pal.glow;c.beginPath();c.arc(j.x,j.y,4,0,TAU);c.fill();}
   c.restore();
  }
  swirl(c,g,26*arm,.72,spin,pal.main,bell(u,.12,.3,.95)*.9,layer,3.4);
  swirl(c,g,58*arm,.52,-spin*1.3,pal.glow,bell(u,.16,.34,.95)*.8,layer,2.6);
  if(layer==='front'){
   const pulse=Math.max(over,bell(u,.14,.3,.56)*.6);                   // 동력 코어(머리 위): 톱니 테 + 과부하 박동
   if(gone<1&&arm>0){
    softGlow(c,core.x,core.y,40+over*40,40+over*40,pal.main,pulse*(1-gone));
    c.save();c.globalAlpha=(1-gone)*arm;c.translate(core.x,core.y);c.rotate(spin*2);c.strokeStyle='#8a5a32';c.lineWidth=5;c.beginPath();c.arc(0,0,17,0,TAU);c.stroke();
    for(let i=0;i<10;i++){c.save();c.rotate(i/10*TAU);c.fillStyle='#b07840';c.fillRect(-3,-23,6,7);c.restore();}c.restore();
    star(c,core.x,core.y,(11+over*12)*(1-gone),'#fff4dc',arm*(1-gone));
    if(over>0)for(let i=0;i<6;i++){const a=rnd(seed+Math.floor(t*20),i)*TAU;glowPath(c,()=>{c.beginPath();c.moveTo(core.x,core.y);c.lineTo(core.x+Math.cos(a)*40,core.y+Math.sin(a)*30);},pal.main,1.4,over);}
   }
   if(boom>0)burstFx(c,core.x,core.y,g.rx*1.25*g.detail,pal,boom,seed,20,.7);
  }
  for(let i=0;i<22;i++){                                            // 날아가는 톱니 · 쇳조각 · 연기
   const k=span(u,.55+rnd(seed,i+5)*.04,.97);if(k<=0||k>=1)continue;const f=fling(g,seed,i*3+50,k,1.1);
   if((f.ground>g.y)!==(layer==='front'))continue;
   c.save();c.globalAlpha=(1-k*.5)*fade;c.translate(f.x,f.y);c.rotate(f.rot);
   if(i%3===0){const r=8+rnd(seed,i+9)*6;c.strokeStyle='#a8703c';c.lineWidth=5;c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();c.fillStyle='#a8703c';for(let k2=0;k2<8;k2++){c.save();c.rotate(k2/8*TAU);c.fillRect(-2,-r-5,4,5);c.restore();}}
   else{c.fillStyle='#5a3a22';c.fillRect(-6,-3,12,6);c.fillStyle=pal.glow;c.fillRect(-6,-3,12,1.5);}
   c.restore();
  }
  for(let i=0;i<8;i++){const f=fling(g,seed,i+700,span(u,.56,1),.8);if((f.ground>g.y)!==(layer==='front'))continue;softGlow(c,f.x,f.ground-20,46,26,'#6a5a50',bell(u,.56,.66,1)*.4);}
  if(layer==='front'){for(let i=0;i<16;i++){const q=ringPt(g,rnd(seed,i+50)*TAU,.3+rnd(seed,i+60)*.7),k=(u*1.8+rnd(seed,i+70))%1;star(c,q.x,q.y-k*120,3.4,pal.glow,fade*(1-k)*span(u,.05,.2));}}
 },
 // 전기전자과 · 뇌광 회로망(Image D): 회로 마법진 → 노드 빛바늘 → 노드마다 번개 → 가운데 대방전 · 푸른 결정 → 잔류 아크
 electric(d,e,layer,u,t,g,seed){
  const c=d.c,pal=DEPT_FX.electric,fade=1-span(u,.86,1),open=easeOut(span(u,0,.14));
  const nodes=[0,1,2,3,4,5,6,7].map(i=>ringPt(g,i/8*TAU+.2,i%2?.82:.56));
  const boom=bell(u,.5,.55,.76),boomK=span(u,.5,.9);
  if(layer==='ground'){
   softGlow(c,g.x,g.y,g.rx,g.ry,pal.main,.34*fade);
   c.save();c.setLineDash([26,10,4,10]);c.lineDashOffset=-u*220;glowPath(c,ellipsePath(c,g,open),pal.main,3,fade,pal.glow);
   c.setLineDash([12,12]);c.lineDashOffset=u*300;glowPath(c,ellipsePath(c,g,.9*open),pal.glow,1.6,fade);c.restore();
   for(const k of [.7,.42,.2])glowPath(c,ellipsePath(c,g,k*open),pal.main,1.8,fade);
   c.save();c.globalAlpha=fade*open;c.translate(g.x,g.y);c.scale(1,g.ry/g.rx);c.rotate(u*1.2);             // 마법진 안쪽 육각형 · 룬 눈금
   glowPath(c,()=>{c.beginPath();for(let i=0;i<=6;i++){const a=i/6*TAU;c.lineTo(Math.cos(a)*g.rx*.42,Math.sin(a)*g.rx*.42);}},pal.glow,1.4,1);
   glowPath(c,()=>{c.beginPath();for(let i=0;i<=3;i++){const a=i/3*TAU;c.lineTo(Math.cos(a)*g.rx*.7,Math.sin(a)*g.rx*.7);}c.moveTo(g.rx*.7*Math.cos(Math.PI/3),g.rx*.7*Math.sin(Math.PI/3));for(let i=0;i<=3;i++){const a=i/3*TAU+Math.PI/3;c.lineTo(Math.cos(a)*g.rx*.7,Math.sin(a)*g.rx*.7);}},pal.main,1.2,.8);
   c.restore();
   for(const [i,n] of nodes.entries()){                               // 회로 배선(꺾인 선) + 노드 패드
    const m=nodes[(i+1)%nodes.length];
    glowPath(c,()=>{c.beginPath();c.moveTo(n.x,n.y);c.lineTo(m.x,n.y);c.lineTo(m.x,m.y);},pal.main,1.2,fade*open*.8);
    const on=span(u,.08+i*.01,.2);glowPath(c,()=>{c.beginPath();c.ellipse(n.x,n.y,13,6.5,0,0,TAU);},on>0?pal.glow:pal.main,2,fade*open);
    softGlow(c,n.x,n.y,20,10,'#ffffff',on*fade*.8);}
   shockRing(c,g,boomK,pal.glow,boom,8);
   return;
  }
  const needle=bell(u,.08,.2,.6);                                     // 노드에서 솟는 빛바늘
  for(const n of nodes){if((n.y>g.y)!==(layer==='front'))continue;beam(c,n.x,n.y,110*needle,6,pal.main,needle);}
  const top=g.y-g.ry-300,strike=bell(u,.22,.3,.62);                    // 하늘에서 노드로 내리꽂는 번개
  nodes.forEach((n,i)=>{if((n.y>g.y)!==(layer==='front'))return;const on=span(u,.22+i*.018,.25+i*.018);const a=strike*on*(rnd(Math.floor(t*14),i)>.2?1:.4);
   bolt(c,n.x+(rnd(seed,i)-.5)*120,top,n.x,n.y,seed+i*17,t,pal.main,4,a);if(a>.3){softGlow(c,n.x,n.y,34,17,'#ffffff',a*.9);star(c,n.x,n.y,12*a,'#ffffff',a);}});
  if(layer==='front'){
   const mid=bell(u,.42,.5,.66);
   if(mid>0){bolt(c,g.x+14,top-60,g.x,g.y-6,seed+99,t,pal.main,7,mid);bolt(c,g.x-50,top,g.x,g.y-6,seed+131,t+.5,pal.glow,4,mid*.85);bolt(c,g.x+70,top+20,g.x,g.y-6,seed+177,t+.3,pal.glow,3,mid*.7);}
   if(boom>0)burstFx(c,g.x,g.y-70,g.rx*1.05*g.detail,pal,boom,seed,22,.66);
   const arc=bell(u,.62,.72,1);                                       // 잔류 아크: 노드끼리 튀는 작은 번개
   if(arc>0)for(let i=0;i<nodes.length;i++){const a=nodes[i],b=nodes[(i+3)%nodes.length];if(rnd(Math.floor(t*12),i)<.4)bolt(c,a.x,a.y-8,b.x,b.y-8,seed+i*5,t,pal.glow,1.6,arc*fade);}
  }
  for(let i=0;i<20;i++){const k=span(u,.52+rnd(seed,i+30)*.04,.96);if(k<=0||k>=1)continue;const f=fling(g,seed,i*3+300,k);   // 푸른 결정 파편
   if((f.ground>g.y)!==(layer==='front'))continue;crystal(c,f.x,f.y,6+rnd(seed,i+40)*3,13+rnd(seed,i+41)*6,pal.main,pal.light,(1-k*.4)*fade,f.rot*.3);}
  for(let i=0;i<10;i++){const q=ringPt(g,rnd(seed,i+60)*TAU,.5+rnd(seed,i+61)*.5);if((q.y>g.y)!==(layer==='front'))continue;   // 바닥에 박힌 결정(잔광)
   const a=span(u,.6,.7)*fade;crystal(c,q.x,q.y-8,4,9,pal.deep,pal.glow,a,(rnd(seed,i+62)-.5)*.6);}
 },
 // 토목시스템과 · 지층의 수호자(Image E): 금빛 측량선 → 지면 균열 · 판 들림 → 바위 기둥 분출 → 대지 폭발 · 흙먼지 → 금빛 소용돌이
 civil(d,e,layer,u,t,g,seed){
  const c=d.c,pal=DEPT_FX.civil,fade=1-span(u,.86,1),open=easeOut(span(u,0,.12));
  const crack=easeOut(span(u,.1,.3)),lift=bell(u,.22,.34,.6),rise=easeOut(span(u,.3,.44)),gone=span(u,.54,.62);
  const boom=bell(u,.53,.58,.78),boomK=span(u,.53,.92);
  const shake=(u>.3&&u<.6)?Math.sin(t*70)*1.6:0;
  if(layer==='ground'){
   softGlow(c,g.x,g.y,g.rx,g.ry,pal.main,.3*fade);
   glowPath(c,ellipsePath(c,g,open),pal.main,3,fade,pal.glow);
   glowPath(c,ellipsePath(c,g,.34*open),pal.glow,1.4,fade);
   const pts=[0,1,2,3].map(i=>ringPt(g,i*Math.PI/2,.9*open)),sv=fade*(1-span(u,.34,.5));   // 측량선 · 표지
   glowPath(c,()=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.moveTo(pts[0].x,pts[0].y);c.lineTo(pts[2].x,pts[2].y);c.moveTo(pts[1].x,pts[1].y);c.lineTo(pts[3].x,pts[3].y);},pal.main,1.4,sv);
   for(const q of pts){c.save();c.globalAlpha=sv;c.fillStyle=pal.main;c.beginPath();c.moveTo(q.x,q.y-14);c.lineTo(q.x+6,q.y);c.lineTo(q.x-6,q.y);c.closePath();c.fill();c.restore();}
   c.save();c.translate(shake,0);                                     // 지면 균열(빛이 새는 틈) + 들리는 판
   for(let i=0;i<12;i++){const a0=i/12*TAU+rnd(seed,i)*.35;c.beginPath();c.moveTo(g.x,g.y);
    for(let k=1;k<=5;k++){const a=a0+(rnd(seed,i*7+k)-.5)*.5,r=k/5*crack;c.lineTo(g.x+Math.cos(a)*g.rx*r,g.y+Math.sin(a)*g.ry*r);}
    c.globalAlpha=.75*fade;c.strokeStyle='#2f2412';c.lineWidth=6;c.stroke();c.globalAlpha=fade;c.strokeStyle=pal.main;c.lineWidth=2.4;c.stroke();c.strokeStyle='#fff6d6';c.lineWidth=.8;c.stroke();}
   c.globalAlpha=1;
   for(let i=0;i<9;i++){if(lift<=0)break;const q=ringPt(g,rnd(seed,i+50)*TAU,.35+rnd(seed,i+51)*.5),w=26+rnd(seed,i+52)*16,h=lift*(6+rnd(seed,i+53)*10);
    c.save();c.globalAlpha=fade;c.translate(q.x,q.y);c.rotate((rnd(seed,i+54)-.5)*.4);
    c.fillStyle='#4a3a22';c.beginPath();c.moveTo(-w/2,0);c.lineTo(w/2,0);c.lineTo(w/2,-h);c.lineTo(-w/2,-h);c.closePath();c.fill();
    c.fillStyle='#8c7a58';c.beginPath();c.moveTo(-w/2,-h);c.lineTo(0,-h-w*.26);c.lineTo(w/2,-h);c.lineTo(0,-h+w*.26);c.closePath();c.fill();
    c.strokeStyle=pal.main;c.lineWidth=1.4;c.stroke();c.restore();}
   c.restore();
   shockRing(c,g,boomK,pal.main,boom,10);shockRing(c,g,boomK*.8,'#d8c7a4',boom*.7,6);
   return;
  }
  // 바위 기둥 분출 — 둘레 안쪽 여덟 곳(가운데 홍길동은 비워 둔다)
  for(let i=0;i<8;i++){
   const a=i/8*TAU+.2,r=e.radius*(i%2?.62:.4),wx=e.x+Math.cos(a)*r,wy=e.y+Math.sin(a)*r,base=d.p(wx,wy,0);
   if((base.y>g.y)!==(layer==='front')||rise<=0||gone>=1)continue;
   const h=(i%2?13:19)*span(u,.3+i*.012,.42+i*.012),s=i%2?1.5:2.1;
   prism(d,wx,wy,s,h,0,['#4d3c26','#6e5838','#b09a6c'],(1-gone)*fade,'#2a2010');
   const top=d.p(wx,wy,h*.9),bot=d.p(wx,wy,h*.2);glowPath(c,()=>{c.beginPath();c.moveTo(bot.x-3,bot.y);c.lineTo(top.x+2,(bot.y+top.y)/2);c.lineTo(top.x-2,top.y);},pal.main,1.3,(1-gone)*fade);
   softGlow(c,base.x,base.y,30,14,'#d8c7a4',span(u,.3,.4)*(1-gone)*.6);
  }
  if(layer==='front'&&boom>0)burstFx(c,g.x,g.y-66,g.rx*1.15*g.detail,pal,boom,seed,18,.66);
  for(let i=0;i<12;i++){const f=fling(g,seed,i+300,span(u,.54,1),.9);if((f.ground>g.y)!==(layer==='front'))continue;   // 흙먼지 구름
   softGlow(c,f.x,f.ground-18,50+boomK*40,26+boomK*18,'#cdb892',bell(u,.54,.64,1)*.55);}
  for(let i=0;i<28;i++){const k=span(u,.54+rnd(seed,i+110)*.05,.97);if(k<=0||k>=1)continue;const f=fling(g,seed,i*3+100,k,1.05);   // 날아가는 바위
   if((f.ground>g.y)!==(layer==='front'))continue;shard(c,f.x,f.y,5+rnd(seed,i+140)*8,f.rot,'#5a4630','#f0c860',(1-k*.35)*fade);}
  swirl(c,g,10+boomK*30,.66,u*9,pal.main,bell(u,.6,.72,1),layer,3.6);
  swirl(c,g,30+boomK*50,.46,-u*11,pal.glow,bell(u,.64,.76,1),layer,2.6);
  if(layer==='front'){const p=d.p(e.x,e.y,0),heal=bell(u,.62,.74,1);                           // 체력 +30: 발밑에서 오르는 초록 빛
   for(let i=0;i<8;i++){const k=(u*1.4+i/8)%1;star(c,p.x+Math.sin(i*2.1+u*6)*18,p.y-8-k*64,4.5,'#bff5b0',heal*(1-k));}}
 },
};

// 보스 연출(boss-art.js)이 같은 그리기 도구를 쓴다(Revision 75).
export {hex as fxHex,glowPath as fxGlowPath,star as fxStar,shard as fxShard,crystal as fxCrystal,softGlow as fxSoftGlow,bolt as fxBolt,prism as fxPrism,burstFx as fxBurst};
