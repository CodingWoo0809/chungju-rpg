import {schoolEnd} from './clock.js';
import {sceneName,transitionInterior} from './world.js';
import {GameAudio} from './audio.js';
import {CONFIG,COMBAT} from './config.js';
import {createState} from './state.js';
import {advanceClock,getPeriod,nextDay} from './clock.js';
import {HOMEROOM_NOTICE} from './tour-data.js';
import {MENU_HOTKEYS,hotkeyAction} from './controls.js';
import {SaveService} from './save.js';
import {gain} from './inventory.js';
import {moveBody,building,BUILDINGS,enterBuilding,leaveBuilding} from './world.js';
import {PARTY,partySpot} from './celebration.js';
import {initSimulation,updateSimulation,attack,heldBall,shootBall,releaseBall,toggleMatch,CHARGE_TIME} from './simulation.js';
import {MATCH_MARKER} from './minigame.js';
const AIM_HEIGHT={basketball:12,soccer:0};   // 조준 기준 평면 높이
import {Renderer} from './renderer.js';
import {UI,DAYS,THEMES} from './ui.js';
import {nearest,interact,interactionCandidates,REACH} from './interactions.js';
// 우클릭 상호작용 판정. 클릭 지점에서 PICK_RADIUS(px) 안에 들어온 대상을 고르되, 바닥점 하나가 아니라
// 바닥(z=0)~머리(z=PICK_TOP) 를 잇는 세로 구간 전체를 클릭 판정으로 써서 사람·문도 몸통을 누르면 잡힌다.
const PICK_RADIUS=22;
const PICK_TOP={npc:18,door:14,drop:5,ball:5},PICK_TOP_DEFAULT=11;
// 줍는 동작만 F 와 같은 사거리를 지킨다. 대화·시설 이용·장비 강화 등은 화면에 보이면 거리 제한이 없다.
const PICK_NEEDS_REACH=new Set(['drop','ball']);
// 겹쳐 있을 때의 우선순위. 클릭 거리(px)에 이 값을 더해 비교하므로, 정확히 겹친 경우에는 작은 쪽이 이기고
// 확실히 더 가까이 찍은 경우에는 여전히 찍은 쪽이 이긴다. 바닥 아이템이 건물 출입구에 겹쳐 놓여도
// 아이템이 먼저 잡히고, 씬이 바뀌는 문·계단은 또렷하게 눌러야만 열린다.
const PICK_BIAS={drop:0,ball:0,npc:3,door:9,stairs:9,exit:9},PICK_BIAS_DEFAULT=5;
import {handleAction} from './actions.js';
import {advancePlayerGait} from './player-sprite.js';
class Game{
 constructor(){this.audio=new GameAudio();this.heard=new WeakSet();this.state=createState('machine');initSimulation(this.state);this.running=false;this.keys=new Set();this.selected='';this.saves=new SaveService();this.renderer=new Renderer(document.querySelector('#world'));this.ui=new UI((a,v)=>handleAction(this,a,v));this.emit=m=>this.ui.toast(m);this.save=()=>{if(this.admin)return true;try{this.saves.save(this.state);return true;}catch(e){this.emit(e.message);return false;}};/* 관리자 모드는 저장하지 않는다 */this.auto=0;this.last=performance.now();this.ui.title();this.bind();requestAnimationFrame(t=>this.frame(t));}
 bind(){window.addEventListener('pointerdown',()=>this.audio.unlock());window.addEventListener('keydown',()=>this.audio.unlock());window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright','tab'].includes(k)&&!this.ui.dialog.open&&k!=='tab')e.preventDefault();if(e.repeat)return;if(MENU_HOTKEYS.menu.includes(k)){e.preventDefault();handleAction(this,this.ui.dialog.open?'close':'menu');return;}if(this.ui.dialog.open||!this.running)return;this.keys.add(k);if(k==='f')interact(this.state,nearest(this.state),this);{const menuAction=hotkeyAction(k);if(menuAction)handleAction(this,menuAction);}/* 메뉴 단축키 표: controls.js MENU_HOTKEYS(퀵 메뉴 키 표시와 같은 표) */if(k==='q'||k==='e'||k==='r'){attack(this.state,k,this.state.player.facing,this.emit);}if(k===' '&&!(this.state.player.dodgeCooldown>0)){this.audio.play('dodge');this.state.player.dodge=.18;this.state.player.invulnerable=.35;this.state.player.dodgeCooldown=1.3;}});window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>this.keys.clear());document.addEventListener('visibilitychange',()=>{this.keys.clear();this.last=performance.now();if(document.hidden&&this.running)this.save();});const canvas=this.renderer.canvas;canvas.addEventListener('contextmenu',e=>e.preventDefault());
  const at=e=>{const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
  canvas.addEventListener('pointerdown',e=>{if(!this.running||this.ui.dialog.open)return;const p=at(e);
   if(e.button===0&&this.onMarker(p)){toggleMatch(this.state,this.emit);this.save();return;}
   const ball=heldBall(this.state);
   if(ball){
    if(e.button===2){releaseBall(this.state,ball,this.emit);return;}
    this.charge={t:0,aim:this.shotAim(p,ball)};this.state.player.facing=this.charge.aim;
    try{canvas.setPointerCapture(e.pointerId);}catch{}return;
   }
   // 우클릭은 공격이 아니라 상호작용 전용이다 — 클릭한 대상을 그대로 집어 F 와 같은 처리로 넘긴다.
   if(e.button===2){const target=this.interactUnderPointer(p);if(target)interact(this.state,target,this);return;}
   const aim=this.renderer.aim(p.x,p.y,this.state.player);this.state.player.facing=aim;
   attack(this.state,'light',aim,this.emit);});
  canvas.addEventListener('pointermove',e=>{if(!this.charge)return;const ball=heldBall(this.state);if(!ball)return;this.charge.aim=this.shotAim(at(e),ball);this.state.player.facing=this.charge.aim;});
  const release=()=>{const c=this.charge;this.charge=null;if(!c)return;const ball=heldBall(this.state);if(ball)shootBall(this.state,ball,c.aim,c.t/CHARGE_TIME,this.emit);};
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',()=>{this.charge=null;});
  window.addEventListener('blur',()=>{this.charge=null;});
  window.addEventListener('beforeunload',()=>{if(this.running)this.save();});}
 // 농구는 림 높이(12), 축구는 지면(0) 평면에서 마우스 지점을 되돌려 정확히 그쪽으로 향하게 한다.
 shotAim(p,ball){return this.renderer.aim(p.x,p.y,this.state.player,AIM_HEIGHT[ball.type]??0);}
 onMarker(p){if(this.state.scene!=='campus')return false;const q=this.renderer.project(MATCH_MARKER.x,MATCH_MARKER.y,MATCH_MARKER.z);return Math.hypot(q.x-p.x,q.y-p.y)<20;}
 // 우클릭한 화면 지점에 실제로 놓인 상호작용 대상 하나를 고른다. F 의 nearest() 와 같은 후보 목록을 쓰되
 // "플레이어에게 가장 가까운 것"이 아니라 "커서가 가리킨 것"을 고르므로, 아이템과 건물 출입구가 같은 좌표에
 // 겹쳐 있어도 원하는 쪽이 정확히 잡힌다. 줍기만 F 사거리를 지키고 나머지는 화면에 보이면 닿는다.
 interactUnderPointer(p){
  const s=this.state,r=this.renderer;let best=null,bestScore=Infinity;
  for(const o of interactionCandidates(s)){
   if(PICK_NEEDS_REACH.has(o.type)&&o.distance>=(o.reach??REACH))continue;
   const foot=r.project(o.x,o.y,0),head=r.project(o.x,o.y,PICK_TOP[o.type]??PICK_TOP_DEFAULT);
   if(foot.x<-40||foot.x>r.width+40||foot.y<-40||head.y>r.height+40)continue;   // 화면 밖이면 "보이지 않는" 것이다
   const dy=p.y>foot.y?p.y-foot.y:p.y<head.y?head.y-p.y:0;                      // 바닥~머리 세로 구간 안이면 0
   const px=Math.hypot(p.x-foot.x,dy);
   if(px>PICK_RADIUS)continue;
   const score=px+(PICK_BIAS[o.type]??PICK_BIAS_DEFAULT);
   if(score<bestScore){bestScore=score;best=o;}
  }
  return best;
 }
 /* Revision 81: 조회 시작(첫날 08:40) · 조회 전 상태로 불러오기 때 위쪽 배너로 첫 목표를 알린다 */
 homeroomBanner(){this.emit(HOMEROOM_NOTICE);this.ui.banner(HOMEROOM_NOTICE,'본관 정문 → 왼쪽 계단 → 2층 1학년 교실의 담임선생님');}
 start(state){this.lifeFriend=null;this.charge=null;this.state=state;initSimulation(state);this.running=true;this.keys.clear();this.renderer.snap(state.player);this.ui.lowHp={warned:false};this.ui.close();this.auto=0;if(state.story.ended)this.ending();else if(state.time>=CONFIG.dayEnd)this.dayEnd();else{this.emit(`${DAYS[state.day]}, ${THEMES[state.day]}. 마음 가는 곳으로 걸어가 보자.`);if(!state.quests.homeroom&&!(state.day===0&&state.time<520))this.homeroomBanner();}}
 transition(scene,entranceId){const s=this.state;if(scene==='campus')leaveBuilding(s,entranceId);else enterBuilding(s,scene,entranceId);if(!s.stats.found.includes(scene))s.stats.found.push(scene);s.player.dodge=0;s.player.invulnerable=1;this.renderer.snap(s.player);this.renderer.canvas.animate([{opacity:0},{opacity:1}],{duration:300});this.keys.clear();this.emit(scene==='campus'?'다시, 캠퍼스의 바람 속으로.':sceneName(scene)+'에 들어왔다.');this.save();}
 frame(now){const dt=Math.min(.1,(now-this.last)/1000);this.last=now;const s=this.state;const paused=!this.running||this.ui.dialog.open||document.hidden||s.story.ended;if(!paused){this.control(dt);const events=advanceClock(s,dt);s.viewport={width:this.renderer.width,height:this.renderer.height,zoom:CONFIG.zoom};updateSimulation(s,dt,this.emit);this.attendance(dt);this.checkMilestones();if(events.includes('warning'))this.emit('18:20, 귀가 시간이 다가옵니다. 오늘의 발걸음을 마무리해요.');if(events.includes('period')){this.audio.play('bell');this.emit(getPeriod(s.time,s.day).name+'이 시작되었습니다.');this.save();}if(s.player.hp<=0)this.faint();if(s.story.bossDefeated&&!s.flags.partyStarted&&!s.lootFountain)this.celebrate();else if(events.includes('dayEnd'))this.dayEnd();this.auto+=dt;if(this.auto>=60){this.save();this.auto=0;}}
 if(this.charge)this.charge.t=Math.min(CHARGE_TIME,this.charge.t+dt);
 const carried=this.running?heldBall(s):null;
 this.renderer.charge=!paused&&this.charge&&carried?{power:this.charge.t/CHARGE_TIME,aim:this.charge.aim,type:carried.type,ball:{x:carried.x,y:carried.y,z:carried.z}}:null;
 this.audio.update(s,paused||this.ui.dialog.open);if(!paused)for(const e of s.effects||[]){if(this.heard.has(e))continue;this.heard.add(e);this.audio.play(e.kind==='hit'?'hit':e.kind==='heavy'?'heavy':['light','q'].includes(e.kind)?'light':'');}const target=this.running?nearest(s):null;this.renderer.playerHp=this.running&&!s.story.ended;this.renderer.render(s,dt,target);if(this.running)this.ui.hud(s,target);requestAnimationFrame(t=>this.frame(t));}
 control(dt){const p=this.state.player;let sx=(this.keys.has('d')?1:0)-(this.keys.has('a')?1:0),sy=(this.keys.has('s')?1:0)-(this.keys.has('w')?1:0);let dx=sx+sy,dy=sy-sx;const n=Math.hypot(dx,dy);p.moving=n>0;p.running=this.keys.has('shift');if(n){dx/=n;dy/=n;p.facing={x:dx,y:dy};}p.dodgeCooldown=Math.max(0,(p.dodgeCooldown||0)-dt);if(p.dodge>0){dx=p.facing.x;dy=p.facing.y;p.dodge=Math.max(0,p.dodge-dt);}const a=p.attackAnimation;
  // 때리는 순간에만 발이 살짝 느려진다. 평소 걸음과 회피는 그대로다.
  const striking=a&&a.remaining>0&&(a.duration-a.remaining)<((a.impact??0)+COMBAT.impactDragWindow);
  const drag=p.dodge>0||!striking?1:COMBAT.impactDrag;
  const speed=(p.dodge>0?65:this.keys.has('shift')?CONFIG.runSpeed:CONFIG.walkSpeed)*drag;
  const oldX=p.x,oldY=p.y;
  moveBody(p,dx*speed*dt,dy*speed*dt,this.state.scene,CONFIG.playerRadius);
  advancePlayerGait(p,Math.hypot(p.x-oldX,p.y-oldY));}
 attendance(dt){const s=this.state,p=getPeriod(s.time,s.day);if(!['class','club'].includes(p.type)||(building(s.scene)?.type!=='class'&&!['main-2','main-3'].includes(s.scene)))return;const key=`attendance:${s.day}:${s.scene}:${p.start}`;if(s.flags[key]===true)return;s.flags[key]=(s.flags[key]||0)+dt;if(s.flags[key]>=CONFIG.attendanceSeconds){s.flags[key]=true;gain(s,['main-2','main-3'].includes(s.scene)?s.department:s.scene,8);s.stats.classes++;this.emit('수업에 함께하며 전공 숙련이 쌓였다. 자유롭게 활동해도 좋다.');this.save();}}
 faint(){const s=this.state;s.time=Math.min(CONFIG.dayEnd,s.time+CONFIG.faintMinutes);s.scene='main-2';Object.assign(s.player,{x:87,y:52,hp:s.player.maxHp,dodge:0,invulnerable:2});this.keys.clear();this.renderer.snap(s.player);this.ui.show(`${this.ui.header('홍길동이 기절했습니다.')}<p>보건실의 조용한 침대에서 눈을 뜹니다.<br>아이템과 장비, 숙련도는 그대로입니다. 학교 시간이 ${CONFIG.faintMinutes}분 지났습니다.</p><button class="primary" data-action="recover">일어나기</button>`);this.save();}
 dayEnd(){const s=this.state;this.keys.clear();
  if(s.day===4){if(s.story.bossDefeated){this.ui.close();return;}this.finalDayChoice();return;}this.ui.show(`<span class="eyebrow">${DAYS[s.day]} · 18:30 귀가</span><h2>오늘도, 나만의 하루였다.</h2><p>수업 ${s.stats.classes}회 · 작은 소동 ${s.stats.kills}마리<br>발견한 공간 ${s.stats.found.length}곳 · 공을 찬 횟수 ${s.stats.kicks}회</p><p>내일은 또 어떤 일이 기다릴까?</p><button class="primary" data-action="nextday">${DAYS[s.day+1]} 아침으로</button>`);this.save();}
 changeFloor(scene,spawn){const s=this.state;transitionInterior(s,scene,spawn);this.keys.clear();this.renderer.snap(s.player);this.emit(sceneName(scene));this.save();}
 checkMilestones(){const s=this.state;if(!s.quests.homeroom&&!(s.day===0&&s.time<520)&&!s.flags.homeroomNotice){s.flags.homeroomNotice=true;this.homeroomBanner();}
 if(s.time>=schoolEnd(s.day)&&s.time<CONFIG.dayEnd&&!s.flags['afterSchool:'+s.day]&&!this.ui.dialog.open){s.flags['afterSchool:'+s.day]=true;this.keys.clear();this.ui.show(s.day===4
   ?`${this.ui.header('운동장에 공명체가 나타났습니다!')}<p>선생님들과 친구들이 이미 운동장에 모여 기다리고 있습니다.<br>오늘은 귀가할 수 없습니다. 함께 맞서러 갑시다.</p><div class="stack"><button class="primary" data-action="boss-go">운동장으로 향하기</button></div>`
   :`${this.ui.header('오늘 수업이 끝났습니다.')}<p>이제부터 18:30까지는 자유시간입니다.</p><div class="stack"><button class="primary" data-action="after-continue">방과후 활동 계속하기</button><button data-action="go-home">오늘 일과를 마치고 귀가하기</button></div>`);this.save();}}
 goHome(){const s=this.state;if(s.time<schoolEnd(s.day))return;if(s.day===4){if(!s.story.bossDefeated)this.finalDayChoice();return;}this.nextDay();}
 // 금요일은 선택지가 없다. 공명체를 이겨야 일주일이 마무리된다.
 finalDayChoice(){this.keys.clear();this.ui.show(`${this.ui.header('금요일 · 운동장으로')}<p>공명체가 아직 운동장에 남아 있습니다. 선생님과 친구들이 기다리고 있어요.<br>귀가 종이 울렸지만, 오늘만큼은 끝까지 함께합니다.</p><div class="stack"><button class="primary" data-action="boss-go">운동장으로 향하기</button></div>`);}
 // 공명체를 이긴 뒤: 운동장 축하 파티. 게임 종료를 누르기 전까지 자유롭게 학교를 돌아다닐 수 있다.
 celebrate(){const s=this.state;s.flags.partyStarted=true;s.story.party=true;s.monsters=[];s.drops=s.drops.filter(d=>d.bossLoot);/* 보스 보상(Revision 78)은 파티가 시작돼도 운동장에 남는다 */
  s.npcs.forEach((n,i)=>{const spot=partySpot(i,s.npcs.length);           // 운동장 가장자리에서 가운데로 모여든다
   Object.assign(n,{scene:'campus',path:[],destination:null,dance:false,
    x:PARTY.x+(spot.x-PARTY.x)*1.55,y:PARTY.y+(spot.y-PARTY.y)*1.55});});
  this.keys.clear();this.renderer.snap(s.player);
  this.ui.show(`${this.ui.header('공명체를 함께 이겨냈습니다!')}<p>운동장 한가운데로 선생님들과 친구들이 모여듭니다. 색종이가 날리고, 풍선이 떠오르고, 누군가 박수를 치기 시작합니다.</p><p>이제 시간에 쫓기지 않아도 됩니다. 학교 어디든 마음껏 돌아다니다가, 준비가 되면 메뉴에서 <strong>게임 종료</strong>를 눌러 일주일을 마무리하세요.</p><div class="stack"><button class="primary" data-action="close">파티에 함께하기</button><button data-action="quiet-ending">바로 일주일 마무리하기</button></div>`);this.save();}
 goToFinale(){const s=this.state;s.scene='campus';delete s.returnEntrance;Object.assign(s.player,{x:640,y:285,hp:s.player.maxHp,invulnerable:2});s.flags['afterSchool:'+s.day]=true;this.renderer.snap(s.player);this.ui.close();this.save();}
 nextDay(){if(nextDay(this.state)){initSimulation(this.state);this.renderer.snap(this.state.player);this.ui.close();this.save();this.emit(`${DAYS[this.state.day]} 08:10 · ${THEMES[this.state.day]}`);}else this.ending();}
 ending(){const s=this.state;s.story.ended=true;this.keys.clear();const friends=s.npcs.filter(n=>(s.relations[n.id]||0)>=3).map(n=>n.name).join(', ');this.ui.show(`<div class="ending"><span class="eyebrow">FRIDAY · OUR LITTLE WEEK</span><p>${s.story.bossDefeated?'학교를 누비며 배운 기술과 친구들의 응원이 하나로 모였다. 마지막 도전을 마친 운동장에 다시 웃음이 돌아왔다.':'귀가 종이 울렸다. 운동장의 빛은 선생님과 친구들이 돌보는 사이, 길동은 자신만의 일주일을 마음에 담았다.'}</p><h1>같이 보낸 시간은,<br>우리 안에 남는다.</h1><hr class="divider"><p>수업 ${s.stats.classes}회 · 해결한 소동 ${s.stats.kills}마리<br>공을 찬 횟수 ${s.stats.kicks}회 · 발견한 장소 ${s.stats.found.length}곳</p><p>${friends?'함께한 친구들: '+friends:'새로운 친구들과 나눈 첫 인사들.'}</p><span class="eyebrow">THE END</span><p><button class="primary" data-action="title">일주일을 기록하고 돌아가기</button></p></div>`);this.save();}
}
const game=new Game();
