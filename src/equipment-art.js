import {playerAttackPose} from './player-attack-pose.js';
import {ULTIMATES} from './growth.js';
import {weaponMotion} from './inventory.js';
import {weaponArt,drawWeapon} from './weapon-art.js';
import {HOLD_POSE,swingProfile} from './weapon-motion.js';
import {handAnchor} from './player-anchors.js';
import {spriteGeometry} from './player-sprite.js';

// ── 장착한 무기를 홍길동의 실제 손에 붙여 그린다 (2026-09-26 무기 리워크) ──────────
// 손 위치는 스프라이트 시트 프레임마다 적어 둔 표(player-anchors.js)에서 읽는다. 무기 그림을 캐릭터 위에 따로 띄우지 않는다.
// 사람 그리기(actors.js)는 이 함수를 두 번 부른다: 스프라이트보다 먼저 layer='back', 나중에 layer='front'.
//   주먹 무기(글러브·건틀릿)  보이는 손은 앞 레이어(손을 덮는다), 몸에 가려진 손은 뒤 레이어.
//   한 자루 무기(검·라켓·창·망치)  손잡이는 몸 뒤 레이어에 그려 스프라이트의 손이 손잡이를 쥔 것처럼 덮고,
//     손 앞으로 뻗은 부분(칼날·창끝)만 앞 레이어에 그린다. 후면에서는 무기가 몸 너머에 있으므로 통째로 뒤 레이어.
// 왼쪽은 오른쪽을 그대로 계산하고 캔버스만 뒤집는다(actors.js).
const DEFAULT_SHEET={front:'idle',back:'backWalk',right:'right'};
const GRIP_SPLIT=.8;                       // 손잡이 원점에서 이만큼 앞부터가 '손 앞' 부분(주먹 반지름쯤)
function frameOf(dir,visual){
 if(visual?.key)return {key:visual.key,index:visual.index,geometry:spriteGeometry(visual)};
 return {key:DEFAULT_SHEET[dir]||'idle',index:0,geometry:{}};
}
// 지금 그려야 할 무기 자세. 테스트와 QA 에서도 같은 값을 쓴다.
export function weaponPose(n,equipment,dir='front',visual=null){
 const art=weaponArt(equipment);if(!art)return null;
 const view=dir==='left'?'right':dir;
 const family=weaponMotion(equipment);
 const a=n?.attackAnimation?.remaining>0?n.attackAnimation:null;
 const progress=a?Math.min(1,Math.max(0,1-a.remaining/a.duration)):0;
 const attacking=!!a&&(!visual||visual.state==='attack');
 if(attacking&&family!=='punch'){
  const r=visual?.rig||playerAttackPose(family,view,progress,equipment),h=r.arms[0].hand;
  return {id:equipment,family,grip:'haft',view,attacking,progress,glow:r.glow,fallback:false,
   hands:[{x:h.x,y:h.y,angle:r.angle,split:r.split,glow:r.glow}]};
 }
 const {key,index,geometry}=frameOf(view,visual);
 const main=handAnchor(key,index,0,geometry),other=handAnchor(key,index,1,geometry);
 if(!main)return null;
 const glow=attacking?Math.max(0,1-Math.abs(progress-(a.impact/a.duration))/.14):0;
 if(art.grip==='fist'){
  const hands=[main,other].filter(Boolean).map((h,i)=>({x:h.x,y:h.y,angle:h.angle,layer:h.visible?'front':'back',flip:i===1,glow:i===0?glow:glow*.3}));
  return {id:equipment,family,grip:'fist',view,attacking,progress,glow,hands,key,index};
 }
 const angle=HOLD_POSE[art.hold||(art.heavy?'heavy':family)]?.[view]??HOLD_POSE.swing[view];
 return {id:equipment,family,grip:'haft',view,attacking,progress,glow,key,index,
  hands:[{x:main.x,y:main.y,angle,split:view==='back'?Infinity:GRIP_SPLIT,glow}],fallback:false};
}
function streak(c,art,length,alpha,width){
 if(alpha<=0)return;
 c.save();c.globalAlpha*=alpha;c.lineCap='round';
 c.strokeStyle=art.color;c.lineWidth=width;c.beginPath();c.moveTo(-length,0);c.lineTo(.2,0);c.stroke();
 c.strokeStyle='#fff8e8';c.lineWidth=width*.4;c.beginPath();c.moveTo(-length*.7,0);c.lineTo(0,0);c.stroke();
 c.restore();
}
export function equippedArm(c,n,equipment,dir='front',visual=null,layer='front',time=0){
 const pose=weaponPose(n,equipment,dir,visual);if(!pose)return;
 const art=weaponArt(equipment);
 if(pose.grip==='fist'){
  pose.hands.forEach((h,i)=>{
   if(h.layer!==layer)return;
   c.save();c.translate(h.x,h.y);c.rotate(h.angle);if(h.flip)c.scale(1,-1);
   if(i===0&&pose.attacking&&layer==='front')streak(c,art,4.5,pose.glow,1.3);   // 주먹이 뻗은 잔상
   drawWeapon(c,equipment,{glow:h.glow,t:time});
   c.restore();
  });
  return;
 }
 const h=pose.hands[0];
 c.save();c.translate(h.x,h.y);c.rotate(h.angle);
 if(layer==='back'&&h.split!==-Infinity)drawWeapon(c,equipment,{glow:h.glow,t:time,to:h.split});
 else if(layer==='front'&&h.split!==Infinity){
  if(pose.attacking){                                             // 공격 잔상: 찌르기는 곧은 선, 스윙은 호
   const fade=pose.glow;
   if(fade>0){
    c.save();c.globalAlpha*=fade*.8;c.strokeStyle=art.color;c.lineCap='round';
    if(pose.family==='thrust'){c.lineWidth=1.2;c.beginPath();c.moveTo(art.length*.35,0);c.lineTo(art.length+2.5,0);c.stroke();}
    else{const p=swingProfile(equipment),r=art.length*.6*p.reach;c.lineWidth=1;c.globalAlpha*=.7;c.beginPath();c.arc(0,0,r,-p.arc*.45,.1);c.stroke();}
    c.restore();
   }
  }
  drawWeapon(c,equipment,{glow:h.glow,t:time,from:h.split});
 }
 c.restore();
}
// 학과별 최고 기술의 연출. 어떤 모양을 그릴지는 ULTIMATES[dept].shape 가 정한다.
// (전기전자과 '뇌광 회로망'의 회로망 연출은 손대지 않고 그대로 둔다.)
export function drawUltimate(d,e){
 const c=d.c,style=ULTIMATES[e.department],p=d.p(e.x,e.y),progress=1-e.life/1.2;
 const shape=style.shape||e.department;
 c.save();c.globalAlpha=Math.max(0,Math.min(1,e.life));
 d.ellipse(e.x,e.y,e.radius,e.radius,style.color+'22',.4,style.color);
 c.strokeStyle=style.color;c.lineWidth=3;
 const line=(x,y,z=0)=>{const q=d.p(x,y,z);c.lineTo(q.x,q.y);};
 if(shape==='grid'){
  // 천공 설계진 — 도면이 펼쳐지듯 사각 설계선이 돌아가고, 네 귀퉁이에 치수 표시가 선다.
  // 마지막에 자기 몸을 감싸는 보호막 반구가 올라온다.
  const spin=progress*.5;
  for(const size of [e.radius*.55,e.radius]){c.beginPath();const q=d.p(e.x-size,e.y-size);c.moveTo(q.x,q.y);line(e.x+size,e.y-size);line(e.x+size,e.y+size);line(e.x-size,e.y+size);c.closePath();c.stroke();}
  c.lineWidth=1.4;c.globalAlpha*=.75;                                   // 회전하는 안쪽 설계선
  for(const size of [e.radius*.78]){
   c.beginPath();
   for(let i=0;i<=4;i++){const a=spin+i*Math.PI/2+Math.PI/4,x=e.x+Math.cos(a)*size*1.36,y=e.y+Math.sin(a)*size*1.36;
    const q=d.p(x,y);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);}
   c.stroke();
  }
  for(let i=0;i<8;i++){                                                 // 방사형 치수선
   const a=i*Math.PI/4,r0=e.radius*.55,r1=e.radius;
   c.beginPath();const q=d.p(e.x+Math.cos(a)*r0,e.y+Math.sin(a)*r0);c.moveTo(q.x,q.y);
   line(e.x+Math.cos(a)*r1,e.y+Math.sin(a)*r1);c.stroke();
  }
  c.globalAlpha=Math.max(0,Math.min(1,e.life));
  const rise=10+progress*26,tops=[];                                    // 네 귀퉁이에서 솟아오르는 설계 기둥
  for(let i=0;i<4;i++){const a=spin+i*Math.PI/2+Math.PI/4;
   const x=e.x+Math.cos(a)*e.radius*.9,y=e.y+Math.sin(a)*e.radius*.9,q=d.p(x,y);
   c.lineWidth=3.4;c.beginPath();c.moveTo(q.x,q.y);line(x,y,rise);c.stroke();
   const top=d.p(x,y,rise);tops.push(top);
   c.fillStyle=style.color;c.beginPath();c.arc(top.x,top.y,4,0,Math.PI*2);c.fill();}
  c.lineWidth=2;c.beginPath();                                          // 기둥 꼭대기를 잇는 천장 테두리
  tops.forEach((t,i)=>i?c.lineTo(t.x,t.y):c.moveTo(t.x,t.y));c.closePath();c.stroke();
  c.lineWidth=2.6;c.globalAlpha*=.85;                                   // 자신을 감싸는 보호막 반구
  const shell=15+progress*5;
  c.beginPath();c.ellipse(p.x,p.y-shell*.9,shell*1.5,shell*1.15,0,Math.PI,Math.PI*2);c.stroke();
  c.globalAlpha*=.6;
  c.beginPath();c.ellipse(p.x,p.y-shell*.9,shell*1.5,shell*.42,0,0,Math.PI*2);c.stroke();
 }else if(shape==='circuit'){
  for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(p.x,p.y);line(e.x+Math.cos(a)*e.radius*.4,e.y+Math.sin(a)*e.radius*.4,6);line(e.x+Math.cos(a+.12)*e.radius*.65,e.y+Math.sin(a+.12)*e.radius*.65);line(e.x+Math.cos(a)*e.radius,e.y+Math.sin(a)*e.radius,3);c.stroke();}
 }else if(shape==='press'){
  // 오버드라이브 프레스 — 네 기둥 사이로 쇳덩이가 떨어져 내리고, 닿는 순간 충격 고리가 퍼진다.
  const drop=Math.abs(Math.cos(progress*Math.PI)),height=10+drop*25;
  for(const s of [-1,1])for(const u of [-1,1]){                         // 프레스 기둥
   const x=e.x+s*e.radius*.62,y=e.y+u*e.radius*.62,q=d.p(x,y);
   c.lineWidth=3;c.strokeStyle='#8f6a4c';c.beginPath();c.moveTo(q.x,q.y);line(x,y,40);c.stroke();
  }
  const q=d.p(e.x,e.y,height);
  c.fillStyle='#bc7950';c.strokeStyle=style.color;c.lineWidth=3;
  c.fillRect(q.x-35,q.y-10,70,20);c.strokeRect(q.x-35,q.y-10,70,20);
  c.fillStyle='#8f5b3a';c.fillRect(q.x-35,q.y+6,70,4);                  // 프레스 아랫면
  for(let i=0;i<5;i++)c.fillRect(q.x-30+i*15,q.y-16,7,6);               // 윗면 리브
  c.beginPath();c.moveTo(q.x,q.y);c.lineTo(p.x,p.y);c.stroke();
  const slam=Math.max(0,1-drop*2.2);                                    // 내려찍힌 순간의 충격 고리
  if(slam>0){c.globalAlpha*=slam;c.lineWidth=4;
   for(const k of [1,1.5]){const r=e.radius*(.3+(1-slam)*.9)*k;
    d.ellipse(e.x,e.y,r,r,null,.35,style.color);}
   c.strokeStyle='#fff0c8';c.lineWidth=2;
   for(let i=0;i<8;i++){const a=i*Math.PI/4+.2;
    c.beginPath();const s0=d.p(e.x+Math.cos(a)*e.radius*.4,e.y+Math.sin(a)*e.radius*.4,2);
    c.moveTo(s0.x,s0.y);line(e.x+Math.cos(a)*e.radius*1.1,e.y+Math.sin(a)*e.radius*1.1,8);c.stroke();}
  }
 }else{
  // 지층의 수호자 — 여섯 지층판이 돌아가며 솟고, 가운데에서 회복의 기운이 올라온다.
  for(let i=0;i<6;i++){const a=i*Math.PI/3,x=e.x+Math.cos(a)*e.radius*.7,y=e.y+Math.sin(a)*e.radius*.7,q=d.p(x,y);c.fillStyle='#b69c68';c.beginPath();c.moveTo(q.x-9,q.y);line(x,y,8+12*Math.sin(progress*Math.PI));c.lineTo(q.x+9,q.y);c.closePath();c.fill();c.stroke();}
  for(let i=0;i<6;i++){                                                 // 바깥 고리에 늦게 솟는 얇은 판
   const a=i*Math.PI/3+Math.PI/6,x=e.x+Math.cos(a)*e.radius,y=e.y+Math.sin(a)*e.radius,q=d.p(x,y);
   const up=Math.max(0,Math.sin((progress-.18)*Math.PI))*15;
   c.fillStyle='#8f7a4e';c.lineWidth=2;c.beginPath();c.moveTo(q.x-6,q.y);line(x,y,4+up);c.lineTo(q.x+6,q.y);c.closePath();c.fill();c.stroke();
  }
  c.strokeStyle='#bfe3b4';c.lineWidth=2;c.globalAlpha*=.8;              // 체력을 채우는 초록 기운
  for(let i=0;i<5;i++){
   const a=progress*4+i*1.26,r=3+i*1.6,z=4+progress*22+i*2;
   const q=d.p(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r,z);
   c.beginPath();c.arc(q.x,q.y,2.6-i*.3,0,Math.PI*2);c.stroke();
  }
  c.strokeStyle=style.color;c.globalAlpha=Math.max(0,Math.min(1,e.life));
 }
 d.label(e.x,e.y,style.name,'#263c36',24);c.restore();
}
