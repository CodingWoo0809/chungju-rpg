import {drawStrike,drawImpact,drawResonance,drawUltimateVfx,strikeBehind,groundEllipse} from './combat-vfx.js';
import {hitRadius} from './combat.js';
import {drawBossGround,drawBossFront,drawBossFx,drawBossShift} from './boss-art.js';
import {drawDrop} from './loot-art.js';
import {drawHeadHpBar} from './hp-ui.js';
import {drawStatusGround,drawStatusFront,drawLootBurst} from './status-art.js';
import {enhanceAura} from './enhance-aura.js';
import {COMBAT} from './config.js';
import {drawMainObject,drawMainLabels} from './main-interior-art.js';
import {CAMPUS_PROPS,drawCampusProp} from './campus-props.js';
import {room} from './interior-art.js';
import {creature} from './creatures.js';
import {Draw,PALETTE as P} from './drawing.js';
import {CONFIG} from './config.js';
import {BUILDINGS,furniture,OUTDOOR_OBJECTS,mainFloor} from './world.js';
import {drawObject} from './scenery.js';
import {ground,TREES} from './terrain.js';
import {drawBuilding} from './building-art.js';
import {drawParty} from './celebration.js';
import {loadMaterials,surface} from './materials.js';
import {loadPlayerSprites} from './player-sprite.js';
import {loadWeaponImages} from './weapon-art.js';
import {loadHurdleArt} from './hurdle-art.js';
import {loadWhistleArt} from './whistle-art.js';
import {loadTrayArt,drawTrayDisc} from './tray-art.js';
import {loadSandbagArt} from './sandbag-art.js';
import {loadBrushArt} from './brush-art.js';
import {loadGolemArt} from './golem-art.js';
import {loadSurveySentinelArt} from './survey-sentinel-art.js';
import {loadDragonflyDroneArt,drawDroneTornado} from './dragonfly-drone-art.js';
import {loadElectricPilotArt} from './electric-pilot-art.js';
import {loadMachinePilotArt} from './machine-pilot-art.js';
import {MATCH_MARKER,matchActors} from './minigame.js';
import {predictShot} from './physics.js';
import {blockerBoxes,actorDepth} from './depth.js';
import {questGuideTarget} from './quest-guide.js';
export class Renderer{
 constructor(canvas){loadMaterials();loadPlayerSprites();loadWeaponImages();loadHurdleArt();loadWhistleArt();loadTrayArt();loadSandbagArt();loadBrushArt();loadGolemArt();loadSurveySentinelArt();loadDragonflyDroneArt();loadElectricPilotArt();loadMachinePilotArt();this.canvas=canvas;this.ctx=canvas.getContext('2d');this.camera={x:514,y:537};this.width=0;this.height=0;this.t=0;this.d=new Draw(this.ctx,(x,y,z)=>this.project(x,y,z));this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.charge=null;
 /* Revision 82 · 개발 확인용: 로컬 주소에 ?rdebug 를 붙였을 때만 R 판정 원과 몬스터 몸체 판정 원을 얇은 선으로 그린다(일반 플레이 · 배포 주소에서는 꺼짐) */
 this.debugHit=(()=>{try{return ['127.0.0.1','localhost'].includes(location.hostname)&&new URLSearchParams(location.search).has('rdebug');}catch{return false;}})();}
 resize(){const r=this.canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio,2);if(r.width!==this.width||r.height!==this.height){this.width=r.width;this.height=r.height;this.canvas.width=r.width*ratio;this.canvas.height=r.height*ratio;this.ctx.setTransform(ratio,0,0,ratio,0,0);}}
 project(x,y,z=0){const dx=x-this.camera.x,dy=y-this.camera.y;return{x:this.width/2+(dx-dy)*.8*CONFIG.zoom,y:this.height*.55+(dx+dy)*.42*CONFIG.zoom-z*CONFIG.zoom};}
 // 화면 좌표를 높이 z 평면 위의 월드 좌표로 되돌린다(project 의 정확한 역변환).
 aimPoint(screenX,screenY,z=0){
  const a=(screenX-this.width/2)/(.8*CONFIG.zoom);
  const b=(screenY-this.height*.55+z*CONFIG.zoom)/(.42*CONFIG.zoom);
  return {x:this.camera.x+(a+b)/2,y:this.camera.y+(b-a)/2};
 }
 aim(screenX,screenY,player,z=0){
  const t=this.aimPoint(screenX,screenY,z);
  const x=t.x-player.x,y=t.y-player.y,m=Math.hypot(x,y)||1;
  return {x:x/m,y:y/m,target:t,targetZ:z};
 }
 snap(player){this.camera.x=player.x;this.camera.y=player.y;}
 render(s,dt,near){this.resize();this.t+=dt;const factor=this.reduced?1:1-Math.exp(-dt*12);this.camera.x+=(s.player.x-this.camera.x)*factor;this.camera.y+=(s.player.y-this.camera.y)*factor;const c=this.ctx,d=this.d;c.clearRect(0,0,this.width,this.height);c.fillStyle='#828b72';c.fillRect(0,0,this.width,this.height);
if(s.scene==='campus')ground(d);else room(d,s.scene);
if(s.scene==='gym'){surface(d,14,12,82,64,'wood');d.rect(18,16,74,56,null,0,'#fffdf5');d.line([{x:18,y:44},{x:92,y:44}],'#fffdf5');d.ellipse(55,44,12,12,null,0,'#fffdf5');d.rect(39,16,32,18,null,0,'#fffdf5');d.rect(39,54,32,18,null,0,'#fffdf5');}else if(s.scene!=='campus'){if(s.scene!=='dreamhall'&&!mainFloor(s.scene))d.label(55,4,BUILDINGS.find(b=>b.id===s.scene)?.name||'실습실','#315f50',12);if(s.scene==='jangseong'){d.rect(18,16,65,48,'#789fad');d.rect(23,21,55,38,null,0,'#fffdf5');}}
const questTarget=questGuideTarget(s);if(questTarget)this.questPath(d,s,questTarget);

const drawables=[];const add=(x,y,fn)=>drawables.push({depth:x+y,fn});
// 큰 상자 앞에 선 사람·몬스터가 상자 뒤로 밀려 사라지지 않도록 깊이를 보정한다(depth.js).
const blockers=s.scene==='campus'
 ? blockerBoxes([...BUILDINGS,...CAMPUS_PROPS.filter(o=>o.solid&&o.h>3.5)])
 : [];
const addActor=(x,y,fn)=>drawables.push({depth:actorDepth(x,y,blockers),fn});
// 야외 오브젝트(장이쉼터·음수대·수위실 상점)만 예전에 '가까운 모서리(o.x,o.y)' 로 정렬돼 있었다.
// 건물·프롭·실내 가구는 모두 '먼 모서리(x+w,y+d)' 를 쓰므로, 장이쉼터처럼 큰 야외 오브젝트가
// 옆 건물보다 늘 먼저 그려져(=뒤로 밀려) 건물에 덮이는 문제가 있었다. 같은 기준으로 통일한다.
// 캠퍼스 프롭(차·비막이·수돗가·벤치…)도 같은 규칙을 쓴다. 건물 '앞'에 놓인 물건이
// 건물보다 작은 x+y 를 가져 건물 아래로 밀려 사라지던 문제를 막는다(예전에는 주차된 차가 통째로 가려졌다).
const buildingBlockers=s.scene==='campus'?blockerBoxes(BUILDINGS):[];
const addProp=(x,y,fn,bias=0)=>drawables.push({depth:actorDepth(x,y,buildingBlockers)+bias,fn});
if(s.scene==='campus'){CAMPUS_PROPS.forEach(o=>{
 if(o.h<=.3)return add(-2000,0,()=>drawCampusProp(d,o,s));          // 바닥 표시는 맨 먼저
 if(o.ground)return add(-1900,0,()=>drawCampusProp(d,o,s));         // 지형(뒤쪽 단차)도 이른 층
 if(o.type==='canopy'){                                             // 긴 비막이는 토막내서 정렬해야 아래 사람·차가 가려지지 않는다
  const alongY=o.axis!=='x',span=alongY?o.d:o.w,step=22;
  for(let t=0;t<span;t+=step){
   const len=Math.min(step,span-t);
   const part=alongY?{...o,y:o.y+t,d:len}:{...o,x:o.x+t,w:len};
   addProp(part.x+part.w,part.y+part.d,()=>drawCampusProp(d,part,s));
  }
  return;
 }
 addProp(o.x+o.w,o.y+o.d,()=>drawCampusProp(d,o,s),o.id==='machine-wash'?.001:0);
});BUILDINGS.forEach(b=>add(b.x+b.w,b.y+b.d,()=>drawBuilding(d,b,s)));TREES.forEach(t=>add(t.x,t.y,()=>d.tree(t.x,t.y,t.h,t.z||0)));OUTDOOR_OBJECTS.forEach(o=>add(o.x+o.w,o.y+o.d,()=>drawObject(d,o,s)));}else furniture(s.scene).forEach(o=>add(o.x+o.w,o.y+o.d,()=>{if(!drawMainObject(d,o))drawObject(d,o);} ));
for(const n of s.npcs.filter(n=>n.scene===s.scene))addActor(n.x,n.y,()=>{d.person(n,this.t);if(near?.id===n.id)d.label(n.x,n.y,n.name,'#263c36',10);});
for(const a of matchActors(s))if(a.scene===s.scene)addActor(a.x,a.y,()=>{d.ellipse(a.x,a.y,3,1.7,a.team?'#c9725f33':'#4f9e8533',.04,a.team?'#c9725f':'#4f9e85');d.person(a,this.t);if(Math.hypot(a.x-s.player.x,a.y-s.player.y)<16)d.label(a.x,a.y,a.name,a.team?'#8a4b44':'#2b5b4c',10);});
for(const m of s.monsters.filter(m=>m.scene===s.scene&&m.hp>0))addActor(m.x,m.y,()=>{if(m.status)drawStatusGround(d,m,this.t);this.monster(m,s.player);if(m.status)drawStatusFront(d,m,this.t);});
for(const o of s.drops.filter(o=>o.scene===s.scene))addActor(o.x,o.y,()=>drawDrop(d,o,this.t));
for(const p of (s.projectiles||[]).filter(p=>p.scene===s.scene))addActor(p.x,p.y,()=>this.projectile(d,p));
for(const b of s.balls.filter(b=>b.scene===s.scene))addActor(b.x,b.y,()=>{const x=b.x,y=b.y,z=b.z||0;d.ellipse(x,y,1.5,1.5,'#263c3629');const p=this.project(x,y,z+1);c.fillStyle=b.type==='basketball'?'#bc804c':'#fffdf5';c.beginPath();c.arc(p.x,p.y,4.2,0,Math.PI*2);c.fill();c.strokeStyle='#4f6054';c.lineWidth=1;c.stroke();c.beginPath();c.moveTo(p.x-4,p.y);c.lineTo(p.x+4,p.y);c.stroke();});
// 금요일 보스의 공격 전조는 바닥층(모든 물체 전)에 그린다(boss-art.js).
for(const m of s.monsters)if(m.kind==='boss'&&m.scene===s.scene&&m.hp>0)add(-1790,0,()=>drawBossGround(d,m,this.t));
for(const e of (s.effects||[]).filter(e=>e.kind==='boss-fx'&&e.scene===s.scene))add(-1780,0,()=>drawBossFx(d,e,this.t,'back'));
// 공명 타격(Q) · 최고 기술(R) 연출은 세 층: 바닥(모든 물체보다 먼저) · 캐릭터 뒤 · 캐릭터 앞(아래 효과 반복문).
for(const e of (s.effects||[]).filter(e=>e.scene===s.scene&&(e.kind==='q'||e.kind==='ultimate'))){const fn=e.kind==='q'?drawResonance:drawUltimateVfx;add(-1800,0,()=>fn(d,e,'ground',this.t));addActor(e.x-.05,e.y-.05,()=>fn(d,e,'back',this.t));}
// 뒤(화면 위쪽)를 향한 일반 공격 잔상은 홍길동 몸 뒤에 그린다.
for(const e of (s.effects||[]).filter(e=>e.scene===s.scene&&strikeBehind(e)))addActor(e.x-.05,e.y-.05,()=>drawStrike(d,e));
addActor(s.player.x,s.player.y,()=>{if((s.player.invulnerable||0)>0)c.globalAlpha=.65;d.person(s.player,this.t,true,s.equipment,s.armor,enhanceAura(s),s.helmet);c.globalAlpha=1;});drawables.sort((a,b)=>a.depth-b.depth).forEach(o=>o.fn());
if(questTarget?.npc)this.questMark(questTarget.npc);
drawMainLabels(d,s.scene);
drawParty(d,s,this.t);
this.matchOverlay(d,s);this.chargeOverlay(d,s);
if(near){const p=this.project(near.x,near.y,8);c.strokeStyle='#fffdf5';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,7,0,Math.PI*2);c.stroke();}
for(const m of s.monsters)if(m.kind==='boss'&&m.scene===s.scene&&m.hp>0)drawBossFront(d,m,this.t);
for(const e of (s.effects||[]).filter(e=>e.scene===s.scene)){
 if(e.kind==='boss-fx'){drawBossFx(d,e,this.t);continue;}
 if(e.kind==='boss-shift'){drawBossShift(d,e,this.t);continue;}
 if(e.kind==='loot-burst'){drawLootBurst(d,e,this.t);continue;}
 if(e.kind==='ultimate'){drawUltimateVfx(d,e,'front',this.t);continue;}
 if(e.kind==='q'&&e.source==='player'){drawResonance(d,e,'front',this.t);continue;}
 if((e.kind==='light'||e.kind==='heavy')&&e.source==='player'){if(!strikeBehind(e))drawStrike(d,e);continue;}
 if(e.kind==='r'&&e.source==='player')continue;
 if(e.kind==='hit'){this.damageNumber(e);continue;}
 if(e.kind==='impact-spark'){if(e.strike)drawImpact(d,e);else this.impactSpark(d,e);continue;}
 if(['swipe','muzzle','burst'].includes(e.kind)){this.monsterEffect(d,e);continue;}
 const color=e.kind==='heal'?'#8fc69d':'#f2d782';if(e.sourceX!==undefined)d.line([{x:e.sourceX,y:e.sourceY,z:4},{x:e.x,y:e.y,z:4}],color,3);d.ellipse(e.x,e.y,e.radius||6,e.radius||6,null,1,color);}
if(s.time>1000){c.fillStyle=`rgba(182,118,63,${Math.min(.13,(s.time-1000)/900)})`;c.fillRect(0,0,this.width,this.height);}
 /* Revision 81: 플레이어 머리 위 작은 체력바 — 모든 효과 위에 그려 가려지지 않는다(hp-ui.js) */
 if(this.playerHp)drawHeadHpBar(c,(x,y,z)=>this.project(x,y,z),s.player);
 if(this.debugHit)this.hitDebug(d,s); }
 hitDebug(d,s){const c=this.ctx;c.save();c.lineWidth=1.5;c.setLineDash([6,4]);
  for(const e of s.effects||[])if(e.kind==='ultimate'&&e.scene===s.scene){const g=groundEllipse(d,e.x,e.y,e.radius);c.strokeStyle='#00e5ff';c.beginPath();c.ellipse(g.x,g.y,g.rx,g.ry,0,0,Math.PI*2);c.stroke();}
  c.setLineDash([]);for(const m of s.monsters)if(m.scene===s.scene&&m.hp>0){const g=groundEllipse(d,m.x,m.y,hitRadius(m));c.strokeStyle='#ff3df2';c.beginPath();c.ellipse(g.x,g.y,g.rx,g.ry,0,0,Math.PI*2);c.stroke();}
  c.restore();}
 // 지금 대화해야 할 선생님까지, 바닥에 투명하고 아주 약간 반짝이는 유도선을 점점이 그린다.
 // 벽을 피해가는 실제 길찾기는 아니고 직선 안내다 — 방 하나짜리 실습실·건물은 충분하고,
 // 본관처럼 긴 복도는 questGuideTarget 이 정문→계단→교무실 순서로 목표를 나눠 주므로 각 구간이 짧다.
 questPath(d,s,target){
  const px=s.player.x,py=s.player.y,dx=target.x-px,dy=target.y-py,dist=Math.hypot(dx,dy);
  if(dist<2)return;
  const steps=Math.max(3,Math.min(26,Math.round(dist/3)));
  const hex=v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0');
  for(let i=1;i<steps;i++){
   const u=i/steps,x=px+dx*u,y=py+dy*u;
   const pulse=(Math.sin(this.t*2.4-u*7)+1)/2;                     // 목표 쪽으로 흐르는 듯한 반짝임
   // 은은한 겉불빛 + 살짝 밝은 속 점, 두 겹으로 그려야 밝은 잔디든 어두운 실내 바닥이든 눈에 띈다.
   d.ellipse(x,y,2.1,1.1,`#fff6ce${hex(30+pulse*35)}`,.16);
   d.ellipse(x,y,.9,.48,`#fffdf0${hex(70+pulse*70)}`,.18);
  }
 }
 // 대화해야 할 선생님 머리 위에 살짝 까닥이는 느낌표. F 상호작용 거리와 무관하게, 같은 씬에 있으면 항상 보인다.
 questMark(npc){
  const c=this.ctx,bob=Math.sin(this.t*3)*1.1,p=this.project(npc.x,npc.y,23+bob);
  if(p.x<-20||p.x>this.width+20||p.y<-20||p.y>this.height+20)return;
  c.save();
  c.fillStyle='#dca85c';c.strokeStyle='#8a5f24';c.lineWidth=1.3;
  c.beginPath();c.ellipse(p.x,p.y,6.4,8.2,0,0,Math.PI*2);c.fill();c.stroke();
  c.fillStyle='#3a2c12';c.font='900 12px "Malgun Gothic",sans-serif';c.textAlign='center';c.textBaseline='middle';
  c.fillText('!',p.x,p.y-1);
  c.restore();
 }
 matchOverlay(d,s){
  if(s.scene!=='campus')return;
  const c=this.ctx,on=!!s.match?.on;
  if(on){                                                        // 화면 상단 고정 점수판
   const text=`우리 ${s.match.score[0]} : ${s.match.score[1]} 친구들`;
   c.save();c.font='600 15px "Malgun Gothic",sans-serif';c.textAlign='center';c.textBaseline='middle';
   const w=c.measureText(text).width+54,x=this.width/2,y=116;
   c.fillStyle='#263c36e8';c.beginPath();c.roundRect(x-w/2,y-15,w,30,15);c.fill();
   c.fillStyle='#fffdf5';c.fillText(text,x+9,y+1);
   c.font='15px "Malgun Gothic","Segoe UI Emoji",sans-serif';c.fillText(MATCH_MARKER.emoji,x-w/2+19,y+1);
   c.restore();
  }
  const p=this.project(MATCH_MARKER.x,MATCH_MARKER.y,MATCH_MARKER.z);
  if(p.x<-40||p.x>this.width+40||p.y<-40||p.y>this.height+40)return;
  c.save();
  c.beginPath();c.arc(p.x,p.y,15,0,Math.PI*2);
  c.fillStyle=on?'#dca85cf2':'#fffdf5f2';c.fill();
  c.lineWidth=2.2;c.strokeStyle=on?'#8a5f24':'#5c6b5f';c.stroke();
  c.font='17px "Malgun Gothic","Segoe UI Emoji",sans-serif';c.textAlign='center';c.textBaseline='middle';
  c.fillText(MATCH_MARKER.emoji,p.x,p.y+1);
  c.restore();
  d.label(MATCH_MARKER.x,MATCH_MARKER.y+3,on?'미니 게임 종료':'친구들과 미니 게임','#314337',MATCH_MARKER.z-5);
 }
 chargeOverlay(d,s){
  const ch=this.charge;if(!ch)return;
  const c=this.ctx,b=ch.ball,aimZ=ch.aim.targetZ||0;
  const {flight,at,mark,short}=predictShot(ch.type,ch.power,b,ch.aim,aimZ,ch.aim.target);
  const foot=this.project(b.x,b.y,b.z),land=this.project(mark.x,mark.y,aimZ);
  c.save();c.setLineDash([7,6]);c.strokeStyle='#fff6ce55';c.lineWidth=2;
  c.beginPath();c.moveTo(foot.x,foot.y);c.lineTo(land.x,land.y);c.stroke();c.restore();
  for(let i=1;i<=15;i++){
   const q=at(flight*i/15),p=this.project(q.x,q.y,Math.max(0,q.z));
   c.fillStyle=`rgba(255,246,206,${.85-i*.035})`;c.beginPath();c.arc(p.x,p.y,5.2-i*.2,0,Math.PI*2);c.fill();
  }
  const onTarget=!short&&Math.hypot(mark.x-ch.aim.target.x,mark.y-ch.aim.target.y)<3.2;
  const cross=this.project(ch.aim.target.x,ch.aim.target.y,aimZ);   // 마우스가 가리키는 지점
  c.strokeStyle=onTarget?'#ffd27a':'#fff6ce99';c.lineWidth=1.6;
  c.beginPath();c.moveTo(cross.x-7,cross.y);c.lineTo(cross.x+7,cross.y);c.moveTo(cross.x,cross.y-5);c.lineTo(cross.x,cross.y+5);c.stroke();
  c.strokeStyle=onTarget?'#ffcf6e':'#fff6cedd';c.lineWidth=onTarget?3:2;
  c.beginPath();c.ellipse(land.x,land.y,10,5,0,0,Math.PI*2);c.stroke();
  const head=this.project(s.player.x,s.player.y,17);
  c.fillStyle='#263c36b3';c.beginPath();c.roundRect(head.x-27,head.y-9,54,8,4);c.fill();
  c.fillStyle=ch.power>.85?'#e79a54':ch.power>.5?'#e8c66d':'#cfd9b6';
  c.beginPath();c.roundRect(head.x-25.5,head.y-7.5,51*Math.min(1,ch.power),5,2.5);c.fill();
 }
 // 데미지 숫자: 튀어오르며 커졌다가 천천히 떠오르고 사라진다. 화면 전체는 건드리지 않는다.
 damageNumber(e){
  const c=this.ctx,full=e.life>COMBAT.numberLife?e.life:COMBAT.numberLife;
  const u=Math.max(0,Math.min(1,1-e.life/full));                     // 0=방금 맞음, 1=사라지기 직전
  const pop=u<.18?1+Math.sin(u/.18*Math.PI)*.42:1;                   // 뜨는 순간의 팝
  const rise=COMBAT.numberRise*(1-Math.pow(1-u,2.2));
  const sway=((e.seed||0)%13-6)*.55;
  const p=this.project(e.x,e.y,COMBAT.numberBase+rise);
  const monster=e.source==='monster';
  const size=(e.shock?16:monster?21:e.critical?30:25)*pop;
  c.save();
  c.globalAlpha=u>.72?Math.max(0,1-(u-.72)/.28):1;
  c.font=`900 ${size.toFixed(1)}px "Malgun Gothic",sans-serif`;
  c.textAlign='center';c.textBaseline='middle';
  const text=String(Math.round(e.damage));
  const x=p.x+sway,y=p.y;
  c.lineJoin='round';
  c.lineWidth=size*.26;c.strokeStyle='#1d2b26';c.strokeText(text,x,y);   // 두꺼운 외곽선으로 배경과 분리
  const g=c.createLinearGradient(0,y-size*.6,0,y+size*.5);
  if(e.shock){g.addColorStop(0,'#eaf7ff');g.addColorStop(1,'#5fb4ff');}   // 감전 틱(Revision 78): 작고 파랗게
  else if(monster){g.addColorStop(0,'#ffd9cd');g.addColorStop(1,'#e8664f');}
  else if(e.critical){g.addColorStop(0,'#fff6d2');g.addColorStop(.55,'#ffcf5f');g.addColorStop(1,'#e88a2c');}
  else {g.addColorStop(0,'#fffdf2');g.addColorStop(1,'#f4d878');}
  c.fillStyle=g;c.fillText(text,x,y);
  if(e.critical){c.font=`900 ${(size*.5).toFixed(1)}px "Malgun Gothic",sans-serif`;
   c.lineWidth=size*.16;c.strokeStyle='#1d2b26';c.strokeText('!',x+size*.62,y-size*.12);
   c.fillStyle='#ffe08a';c.fillText('!',x+size*.62,y-size*.12);}
  c.restore();
 }
 // 타격 지점의 작은 충격 표현: 퍼지는 고리 + 짧은 불똥. 국소적이라 화면이 번쩍이지 않는다.
 impactSpark(d,e){
  const c=this.ctx,full=.3,u=Math.max(0,Math.min(1,1-e.life/full));
  const p=this.project(e.x,e.y,5.5),zoom=CONFIG.zoom;
  const aim=e.aim||{x:1,y:0},base=Math.atan2((aim.x+aim.y)*.42,(aim.x-aim.y)*.8);
  c.save();c.translate(p.x,p.y);
  c.globalAlpha=(1-u)*.9;
  c.strokeStyle='#fff4cf';c.lineWidth=2.6*(1-u)+.6;                  // 퍼지는 고리
  c.beginPath();c.ellipse(0,0,e.radius*zoom*.2*(.35+u*1.15),e.radius*zoom*.11*(.35+u*1.15),base,0,Math.PI*2);c.stroke();
  c.strokeStyle='#ffd98a';c.lineWidth=2.2*(1-u)+.4;                  // 진행 방향으로 튀는 불똥
  for(let i=0;i<5;i++){
   const a=base+((e.seed||0)%7-3)*.16+(i-2)*.42;
   const near=e.radius*zoom*.1,far=near+e.radius*zoom*(.14+u*.3)+i%2*3;
   c.beginPath();c.moveTo(Math.cos(a)*near,Math.sin(a)*near*.55);c.lineTo(Math.cos(a)*far,Math.sin(a)*far*.55);c.stroke();
  }
  c.globalAlpha=(1-u)*.5;c.fillStyle='#fffaf0';                      // 중심의 짧은 섬광
  c.beginPath();c.ellipse(0,0,e.radius*zoom*.09*(1-u*.5),e.radius*zoom*.06*(1-u*.5),0,0,Math.PI*2);c.fill();
  c.restore();
 }
 // 원거리 몬스터가 쏜 것. 종류마다 모양이 달라 무엇이 날아오는지 바로 읽힌다.
 projectile(d,p){
  const c=this.ctx,z=p.visual==='brushPaint'?5.2+12*Math.max(0,1-(p.spin||0)/1.44):p.visual==='metalChip'?3.2+10.5*Math.max(0,1-(p.spin||0)/1.35):p.kind==='cog'?3.2:p.kind==='disc'?3.8:5.2,q=this.project(p.x,p.y,z),zoom=CONFIG.zoom;
  const back=this.project(p.x-p.vx*.07,p.y-p.vy*.07,z);
  d.ellipse(p.x,p.y,p.radius*.8,p.radius*.45,'#202b2733');                 // 바닥 그림자
  c.save();
  c.strokeStyle=p.visual==='tornado'?'#a4eff6a8':p.visual==='elevatorBeam'?'#ff695dba':p.visual==='metalChip'?'#d8c39faa':p.trail+'7a';
  c.lineWidth=p.visual==='tornado'?2.2:p.radius*zoom*.42;c.lineCap='round';
  c.beginPath();c.moveTo(back.x,back.y);
  if(p.visual==='tornado')c.quadraticCurveTo((back.x+q.x)/2+Math.sin(p.spin)*5,(back.y+q.y)/2,q.x,q.y);
  else c.lineTo(q.x,q.y);
  c.stroke();
  const R=p.radius*zoom*.42;   // 멀리서도 무엇이 날아오는지 보이도록 넉넉하게
  if(p.visual==='tornado'){
   drawDroneTornado(c,q.x,q.y,Math.max(5.8,R*2.5),p.spin);
  }else if(p.visual==='metalChip'){
   c.save();c.translate(q.x,q.y);c.rotate(p.spin*1.7);
   c.fillStyle='#a8a9a4';c.strokeStyle='#f9d392';c.lineWidth=1.1;
   c.beginPath();c.moveTo(-R*1.65,-R*.45);c.lineTo(-R*.25,-R*.7);
   c.lineTo(R*1.3,-R*.28);c.lineTo(R*1.65,R*.32);
   c.lineTo(-R*.12,R*.72);c.lineTo(-R*.92,R*.26);c.closePath();c.fill();c.stroke();
   c.strokeStyle='#f8ede0';c.lineWidth=.7;c.beginPath();c.moveTo(-R*.55,-R*.27);
   c.lineTo(R*.75,-R*.05);c.stroke();c.restore();
  }else if(p.kind==='cog'){                                                      // 톱니 — 회전하는 기어
   c.save();c.translate(q.x,q.y);c.rotate(p.spin);
   c.fillStyle=p.color;c.beginPath();
   for(let i=0;i<8;i++){const a=i/8*Math.PI*2;
    c.lineTo(Math.cos(a)*R,Math.sin(a)*R*.62);c.lineTo(Math.cos(a+.2)*(R*1.4),Math.sin(a+.2)*R*.86);}
   c.closePath();c.fill();c.strokeStyle='#8e7a2f';c.lineWidth=1;c.stroke();
   c.fillStyle='#6f6a58';c.beginPath();c.ellipse(0,0,R*.3,R*.2,0,0,Math.PI*2);c.fill();
   c.restore();
  }else if(p.kind==='disc'){                                              // 식판 — 납작하게 돌며 날아가는 원반
   if(!drawTrayDisc(c,q.x,q.y,R*3.3,p.spin)){
    c.save();c.translate(q.x,q.y);c.rotate(Math.sin(p.spin)*.5);
    c.fillStyle=p.color;c.strokeStyle='#8d9ba2';c.lineWidth=1;
    c.beginPath();c.ellipse(0,0,R*1.5,R*.55,0,0,Math.PI*2);c.fill();c.stroke();c.restore();
   }
  }else if(p.kind==='ring'){                                              // 소리 고리 — 진행 방향으로 선 빈 고리
   c.save();c.translate(q.x,q.y);c.rotate(Math.atan2(q.y-back.y,q.x-back.x));
   for(let i=0;i<2;i++){
    const s=1+i*.45,wob=1+Math.sin(p.spin*1.4+i)*.12;
    c.strokeStyle=i?p.trail+'88':p.color;c.lineWidth=(i?1.2:2.4);
    c.beginPath();c.ellipse(-i*R*.7,0,R*.45*s,R*1.25*s*wob,0,0,Math.PI*2);c.stroke();
   }
   c.restore();
  }else if(p.kind==='laser'){                                             // 광선 — 길게 늘어난 빛줄기
   c.save();c.translate(q.x,q.y);c.rotate(Math.atan2(q.y-back.y,q.x-back.x));
   c.fillStyle=p.visual==='elevatorBeam'?'#ff695d':p.trail;c.beginPath();c.ellipse(0,0,R*2.2,R*.5,0,0,Math.PI*2);c.fill();
   c.fillStyle=p.visual==='elevatorBeam'?'#fff2dc':p.color;c.beginPath();c.ellipse(0,0,R*1.5,R*.28,0,0,Math.PI*2);c.fill();
   c.restore();
  }else{                                                                  // 물감·측량 빔 — 둥근 덩어리
   const g=c.createRadialGradient(q.x-R*.3,q.y-R*.3,0,q.x,q.y,R*1.3);
   g.addColorStop(0,p.trail);g.addColorStop(1,p.color);
   c.fillStyle=g;c.beginPath();c.arc(q.x,q.y,R,0,Math.PI*2);c.fill();
   if(p.kind==='blob'){c.fillStyle=p.color+'99';
    for(let i=0;i<3;i++)c.fillRect(q.x-R*1.3+i*R*.9,q.y+R*.6,R*.5,R*.5);}
  }
  c.restore();
 }
 // 몬스터 공격의 순간 표현: 근접 휘두름 · 발사 섬광 · 착탄 파열.
 monsterEffect(d,e){
  const c=this.ctx,zoom=CONFIG.zoom;
  const full=e.kind==='swipe'?.28:e.kind==='muzzle'?.18:e.kind==='burst'?.24:.25;
  const u=Math.max(0,Math.min(1,1-e.life/full)),p=this.project(e.x,e.y,e.visual==='brushPaint'?17.2:e.visual==='metalChip'?13.7:e.kind==='swipe'?4:5);
  const aim=e.aim||{x:1,y:0},base=Math.atan2((aim.x+aim.y)*.42,(aim.x-aim.y)*.8);
  c.save();c.translate(p.x,p.y);c.globalAlpha=(1-u)*.85;
  if(e.kind==='swipe'){                                                   // 근접: 진행 방향으로 지나가는 호
   c.rotate(base);c.strokeStyle=e.color||'#f6e8c8';c.lineWidth=(1-u)*5+1.2;c.lineCap='round';
   const R=e.radius*zoom*.2;
   c.beginPath();c.ellipse(0,0,R,R*.55,0,-1+u*1.4,.5+u*1.4);c.stroke();
  }else if(e.kind==='muzzle'){                                            // 발사구 섬광
   c.rotate(base);c.fillStyle=e.color;
   c.beginPath();c.ellipse(0,0,e.radius*zoom*.4*(1-u*.4),e.radius*zoom*.14,0,0,Math.PI*2);c.fill();
  }else{                                                                  // 착탄 파열
   c.strokeStyle=e.color||'#f6e8c8';c.lineWidth=(1-u)*2.6+.6;
   c.beginPath();c.ellipse(0,0,e.radius*zoom*.16*(.5+u*1.4),e.radius*zoom*.09*(.5+u*1.4),0,0,Math.PI*2);c.stroke();
   for(let i=0;i<5;i++){const a=i/5*Math.PI*2+(e.x||0);
    const n=e.radius*zoom*.1,f=n+e.radius*zoom*(.1+u*.26);
    c.beginPath();c.moveTo(Math.cos(a)*n,Math.sin(a)*n*.6);c.lineTo(Math.cos(a)*f,Math.sin(a)*f*.6);c.stroke();}
  }
  c.restore();
 }
 monster(m,player){creature(this.d,m,this.t,Math.hypot(m.x-player.x,m.y-player.y));}
}
