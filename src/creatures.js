import {CONFIG} from './config.js';
import {bossPhase} from './boss-combat.js';
import {drawBossBody,drawBossBar,phaseOf} from './boss-art.js';
import {monsterDisplayName,monsterTag} from './combat.js';
import {drawHurdle} from './hurdle-art.js';
import {drawWhistle} from './whistle-art.js';
import {drawTray} from './tray-art.js';
import {drawSandbag} from './sandbag-art.js';
import {drawBrush} from './brush-art.js';
import {drawGolem,isGolemDormant} from './golem-art.js';
import {drawSurveySentinel} from './survey-sentinel-art.js';
import {drawDragonflyDrone} from './dragonfly-drone-art.js';
import {drawElectricFirefly,drawBrokenElevator} from './electric-pilot-art.js';
import {drawRagingCart,drawCuttingTurret} from './machine-pilot-art.js';
import {isNeutralPilot,neutralPose} from './neutral-pose.js';

// 몬스터 한 마리. 학과마다 생김새가 다르고, 공격 준비(windup) 동안은
// 바닥 예고 원 대신 몬스터 자신의 준비 동작으로 "지금 공격한다"를 알린다.
// (보스만 기존 빨간 예고 원을 그대로 쓴다 — 회피 타이밍이 그 원에 걸려 있다.)

const oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
const poly=(c,pts,fill,stroke=null,w=.3)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
 if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}};

// 준비 동작의 진행도 0→1. 몸을 움츠렸다가 펴는 데 쓴다.
function windupPhase(m){
 if(m.phase!=='windup')return 0;
 const full=m.windupFull||.8;
 return Math.max(0,Math.min(1,1-Math.max(0,m.timer)/full));
}

// ── 건축디자인과 ───────────────────────────────────────
function golem(c,m,t,w,bob){                                    // 벽돌 골렘 · 팔을 들었다 내려찍는다
 const lift=w?Math.sin(w*Math.PI*.8)*3.4:0;
 poly(c,[[-4.6,-1],[4.6,-1],[3.8,1.6],[-3.8,1.6]],'#7d6047');   // 받침 기단
 for(let i=0;i<3;i++){                                          // 벽돌 층
  const y=-2.4-i*2.7,hw=4.3-i*.45;
  poly(c,[[-hw,y],[hw,y],[hw-.25,y-2.5],[-hw+.25,y-2.5]],i%2?'#c39568':'#b5865c','#8a6541',.35);
  c.strokeStyle='#96704c';c.lineWidth=.25;
  c.beginPath();c.moveTo(i%2?-1.4:1.4,y);c.lineTo(i%2?-1.4:1.4,y-2.5);c.stroke();
 }
 poly(c,[[-3.1,-10.6],[3.1,-10.6],[2.4,-13.4],[-2.4,-13.4]],'#c9a178','#8a6541',.35);   // 머리
 oval(c,-1,-12.1,.5,.42,'#5d4a36');oval(c,1,-12.1,.5,.42,'#5d4a36');
 for(const s of [-1,1]){                                        // 팔 — 준비 동작에서 위로 든다
  c.save();c.translate(s*4.4,-8+bob*.3);c.rotate(s*(-.2-lift*.22));
  poly(c,[[-1.1,-1],[1.1,-1],[1.5,4.6],[-1.5,4.6]],'#b5865c','#8a6541',.3);
  poly(c,[[-1.6,4.4],[1.6,4.4],[1.6,6.6],[-1.6,6.6]],'#a9794f','#7d5a39',.3);
  c.restore();
 }
}
function brush(c,m,t,w,bob){                                    // 붓 도깨비 · 붓을 뒤로 당겼다 튕긴다
 const pull=w?Math.sin(w*Math.PI)*1:0;
 oval(c,0,-5.4-bob,3.5,3.9,'#efd9c4');                          // 작은 몸통
 oval(c,-1.2,-6.4-bob,.52,.62,'#3d3a36');oval(c,1.2,-6.4-bob,.52,.62,'#3d3a36');
 poly(c,[[-1.4,-4.2-bob],[1.4,-4.2-bob],[0,-3.1-bob]],'#d8657f');   // 입
 for(const s of [-1,1])poly(c,[[s*2.6,-8.8-bob],[s*4.1,-11.4-bob],[s*1.1,-8.4-bob]],'#e8c3a8','#c49a7c',.25);  // 뿔
 c.save();                                                      // 붓
 c.translate(3.2,-5-bob);c.rotate(-.6+pull*1.15);
 c.strokeStyle='#9b7448';c.lineWidth=1.1;c.beginPath();c.moveTo(0,0);c.lineTo(4.4,-2.6);c.stroke();
 poly(c,[[4.2,-2.2],[7.2,-4.6],[6.2,-5.9],[3.6,-3.2]],'#d8657f','#a8455c',.25);
 if(w>.55)for(let i=0;i<3;i++)oval(c,7.4+i*1.5,-5.2-i*.5,.55,.55,'#d8657fbb');
 c.restore();
 oval(c,0,-1.4,2.6,1.3,'#efd9c4');                              // 발
}
// ── 토목시스템과 ───────────────────────────────────────
function mud(c,m,t,w,bob){                                      // 진흙 덩이 · 부풀었다 덮친다
 const swell=w?1+Math.sin(w*Math.PI*.7)*.18:1;
 c.save();c.scale(swell,2-swell);
 poly(c,[[-4.8,0],[-5.2,-3.4],[-3,-6.2],[0,-7.4],[3.2,-6],[5.2,-3.2],[4.6,0]],'#8a7551','#63523a',.35);
 poly(c,[[-3.4,-6.6],[-1.4,-9.4],[.6,-7],[2.6,-9.8],[3.8,-6.2]],'#9b855f');   // 흘러내린 윗면
 for(const [x,y,r] of [[-2.2,-4.2,.8],[1.6,-3.2,.6],[.2,-5.4,.5]])oval(c,x,y,r,r*.8,'#6d5c40');
 oval(c,-1.5,-4.8,.62,.7,'#f2e6c8');oval(c,1.5,-4.4,.62,.7,'#f2e6c8');
 oval(c,-1.5,-4.8,.28,.34,'#2f2a1e');oval(c,1.5,-4.4,.28,.34,'#2f2a1e');
 c.restore();
 for(let i=0;i<3;i++)oval(c,-4+i*4,.4,1.5-i*.2,.5,'#5f5039aa');  // 바닥에 남는 흙자국
}
function drone(c,m,t,w,bob){                                    // 측량 드론 · 렌즈를 조준하며 낮게 내려온다
 const hover=-9-bob*1.6-(w?(1-w)*1.6:0);
 c.strokeStyle='#7d8c88';c.lineWidth=.45;
 c.beginPath();c.moveTo(0,hover+2.4);c.lineTo(0,hover+4.2);c.stroke();
 for(const s of [-1,1]){                                        // 로터 암
  poly(c,[[s*1.6,hover-.4],[s*5.2,hover-1.8],[s*5.4,hover-.9],[s*1.8,hover+.5]],'#9fc4bd','#6d8a85',.3);
  const blur=Math.abs(Math.sin(t*22+s))*.5+1.4;
  oval(c,s*5.2,hover-1.9,2.5,blur*.32,'#cfe6e133');
  c.strokeStyle='#8fb0aa';c.lineWidth=.35;
  c.beginPath();c.ellipse(s*5.2,hover-1.9,2.5,.5,0,0,Math.PI*2);c.stroke();
 }
 poly(c,[[-2.6,hover-1.6],[2.6,hover-1.6],[2,hover+2.2],[-2,hover+2.2]],'#b6d2cc','#6d8a85',.35);
 c.fillStyle=w>.5?'#ff9a6b':'#4fb3a2';                          // 조준 렌즈 — 발사 직전 붉게 변한다
 c.beginPath();c.arc(0,hover+.4,1.25,0,Math.PI*2);c.fill();
 c.strokeStyle='#2f4e49';c.lineWidth=.3;c.stroke();
 if(w>.35){                                                     // 조준선
  c.strokeStyle=`rgba(255,154,107,${.3+w*.5})`;c.lineWidth=.6;c.setLineDash([1.6,1.4]);
  c.beginPath();c.moveTo(0,hover+.4);c.lineTo(11,hover+.4);c.stroke();c.setLineDash([]);
 }
}
// ── 전기전자과 ────────────────────────────────────────
function firefly(c,m,t,w,bob){                                  // 회로 반딧불 · 밝아졌다 튀어 든다
 const charge=w?.55+w*.9:0;
 const glow=c.createRadialGradient(0,-5,0,0,-5,7+charge*3);
 glow.addColorStop(0,'#fff6bf');glow.addColorStop(.3,`rgba(220,202,104,${.73+charge*.2})`);glow.addColorStop(1,'#dcca6800');
 oval(c,0,-5,7+charge*3,7+charge*3,glow);
 oval(c,0,-5,1.3+charge*.5,2+charge*.5,'#fff7c7');
 for(let i=0;i<3;i++)oval(c,Math.cos(t*3+i*2)*(4+charge*2),-5+Math.sin(t*3+i*2)*3,.5,.5,'#ffefb6');
 if(w>.4){c.strokeStyle=`rgba(255,247,199,${w*.8})`;c.lineWidth=.5;   // 방전 스파크
  for(let i=0;i<4;i++){const a=t*7+i*1.6;c.beginPath();c.moveTo(Math.cos(a)*3,-5+Math.sin(a)*3);
   c.lineTo(Math.cos(a)*(6+w*3),-5+Math.sin(a)*(6+w*3));c.stroke();}}
}
function android(c,m,t,w,bob){                                  // 광선 휴머노이드 · 총을 들어 겨눈다
 const aimLift=w?Math.min(1,w*1.8):0;
 c.strokeStyle='#5f7788';c.lineWidth=1.3;c.lineCap='round';
 for(const s of [-1,1]){c.beginPath();c.moveTo(s*1.1,-5.4);c.lineTo(s*1.5,-.2);c.stroke();}   // 다리
 poly(c,[[-2.4,-12.4],[2.4,-12.4],[3,-5.2],[-3,-5.2]],'#8fb6cc','#4f6f82',.35);               // 몸통
 poly(c,[[-1.6,-11.2],[1.6,-11.2],[1.6,-8.4],[-1.6,-8.4]],'#2f4b5c');
 c.fillStyle=w>.55?'#ffd27a':'#63d0f5';c.beginPath();c.arc(0,-9.8,.85,0,Math.PI*2);c.fill();  // 코어
 poly(c,[[-2,-17.4],[2,-17.4],[2.3,-12.6],[-2.3,-12.6]],'#a8c8da','#4f6f82',.35);             // 머리
 c.fillStyle='#2f4b5c';c.fillRect(-1.7,-16.2,3.4,1.4);
 c.fillStyle=w>.55?'#ffd27a':'#63d0f5';c.fillRect(-1.4,-15.9,2.8,.8);
 c.save();c.translate(2.6,-11.4);c.rotate(-aimLift*.55+.35);                                  // 광선총을 든 팔
 c.strokeStyle='#7f9fb0';c.lineWidth=1.2;c.beginPath();c.moveTo(0,0);c.lineTo(3.4,0);c.stroke();
 poly(c,[[3.2,-1.2],[7.4,-1],[7.6,.6],[3.2,1.2]],'#4f6f82','#2f4b5c',.3);
 if(w>.3){const p=Math.min(1,(w-.3)/.7);
  c.fillStyle=`rgba(99,208,245,${.35+p*.6})`;c.beginPath();c.arc(7.8,-.2,.7+p*1.2,0,Math.PI*2);c.fill();}
 c.restore();
}
// ── 자동화기계과 ──────────────────────────────────────
function servo(c,m,t,w,bob){                                    // 공정 로봇 · 집게를 벌렸다 찍는다
 const snap=w?Math.sin(w*Math.PI*.85):0;
 poly(c,[[-4.4,0],[4.4,0],[3.4,-2.2],[-3.4,-2.2]],'#6f6a58','#4d4a3c',.3);                    // 캐터필러
 for(let i=0;i<4;i++)oval(c,-3+i*2,-1.1,.6,.6,'#4d4a3c');
 poly(c,[[-3.4,-2.6],[3.4,-2.6],[3,-9.4],[-3,-9.4]],'#c2a94f','#8e7a2f',.35);                 // 본체
 c.fillStyle='#3f4438';c.fillRect(-2.2,-8.2,4.4,2.6);
 for(let i=0;i<3;i++){c.fillStyle=w>i*.3?'#ffd66b':'#7d7a5c';c.fillRect(-1.8+i*1.4,-7.6,.9,1.4);}
 poly(c,[[-1.8,-12.4],[1.8,-12.4],[2.2,-9.6],[-2.2,-9.6]],'#d6bd62','#8e7a2f',.3);            // 머리
 oval(c,0,-11,.9,.75,'#ff8f5e');
 c.save();c.translate(3,-7.4);c.rotate(-.3-snap*.5);                                          // 집게 팔
 c.strokeStyle='#9a8a3f';c.lineWidth=1.2;c.beginPath();c.moveTo(0,0);c.lineTo(4,-1);c.stroke();
 for(const s of [-1,1]){c.save();c.translate(4,-1);c.rotate(s*(.35+snap*.55));
  poly(c,[[0,-.5],[3.4,-1.2],[3.6,.2],[0,.6]],'#b09a45','#7d6c2c',.25);c.restore();}
 c.restore();
}
function cogger(c,m,t,w,bob){                                   // 톱니 사출기 · 톱니를 장전해 회전시킨다
 const spin=t*2+(w?w*22:0);
 poly(c,[[-5,0],[5,0],[4,-3.2],[-4,-3.2]],'#8a8371','#5f5a4c',.35);                           // 받침
 poly(c,[[-3.6,-3.4],[3.6,-3.4],[3,-9],[-3,-9]],'#a9a08a','#6f6a58',.35);                     // 몸통
 c.fillStyle='#4f4b3f';c.fillRect(-2,-8,4,2);
 oval(c,-1,-7,.5,.5,'#ffd66b');oval(c,1,-7,.5,.5,'#ffd66b');
 c.save();c.translate(0,-11.4);c.rotate(spin);                                                // 장전된 톱니
 const R=w?3.2+w*1.1:3.2;
 c.fillStyle=w>.5?'#e2c268':'#c8ab52';c.beginPath();
 for(let i=0;i<10;i++){const a=i/10*Math.PI*2;
  c.lineTo(Math.cos(a)*R,Math.sin(a)*R);c.lineTo(Math.cos(a+.16)*(R+1.3),Math.sin(a+.16)*(R+1.3));}
 c.closePath();c.fill();c.strokeStyle='#8e7a2f';c.lineWidth=.3;c.stroke();
 c.fillStyle='#6f6a58';c.beginPath();c.arc(0,0,1.1,0,Math.PI*2);c.fill();
 c.restore();
 c.strokeStyle='#6f6a58';c.lineWidth=.9;c.beginPath();c.moveTo(0,-9);c.lineTo(0,-11.4);c.stroke();
}
// ── 중립 몬스터 4종 ────────────────────────────────────
// 학과 건물이 아니라 운동장 트랙 · 장성관 · 승리관 · 급식소 주변에서 만난다.
function hurdle(c,m,t,w,bob){                                   // 허들 도깨비 · 몸을 접었다가 가로대로 후려친다
 const fold=w?Math.sin(w*Math.PI*.85):0;
 const lean=fold*.5;
 c.save();c.rotate(-lean*.24);
 for(const s of [-1,1]){                                        // 육상 허들의 두 다리
  c.strokeStyle='#8d8577';c.lineWidth=1.1;c.lineCap='round';
  c.beginPath();c.moveTo(s*3.2,0);c.lineTo(s*2.1,-7.2+fold*1.6);c.stroke();
  c.beginPath();c.moveTo(s*3.2,0);c.lineTo(s*4.6,-1.4);c.stroke();          // 뒤로 뻗은 받침
 }
 for(let i=0;i<2;i++){                                          // 흰·주황 줄무늬 가로대 두 줄
  const y=-7.4-i*3.2+fold*1.6;
  poly(c,[[-3.6,y],[3.6,y],[3.6,y-1.5],[-3.6,y-1.5]],'#f2ece0','#9c9384',.3);
  for(let k=0;k<3;k++)c.fillStyle='#e07a45',c.fillRect(-3.4+k*2.3,y-1.4,1.1,1.3);
 }
 oval(c,-1.3,-12.6+fold*1.6,.62,.72,'#3a3a34');                 // 눈
 oval(c,1.3,-12.6+fold*1.6,.62,.72,'#3a3a34');
 if(w>.5){                                                      // 후려치기 직전 가로대에서 이는 바람
  c.strokeStyle=`rgba(255,232,196,${(w-.5)*1.4})`;c.lineWidth=.6;
  for(let i=0;i<3;i++){c.beginPath();c.moveTo(4.2,-9-i*2.4);c.lineTo(9.5+w*3,-9.6-i*2.4);c.stroke();}
 }
 c.restore();
}
function whistle(c,m,t,w,bob){                                  // 호루라기 정령 · 숨을 크게 들이켰다 소리 고리를 분다
 const puff=w?.4+w*1.1:0,y=-8.6-bob*1.4;
 const glow=c.createRadialGradient(0,y,0,0,y,6.4+puff*2.2);
 glow.addColorStop(0,'#ffffff');glow.addColorStop(.42,`rgba(200,232,244,${.5+puff*.3})`);glow.addColorStop(1,'#c8e8f400');
 oval(c,0,y,6.4+puff*2.2,6.4+puff*2.2,glow);
 poly(c,[[-2.6,y-1.8],[2.2,y-2.2],[3,y+1.4],[-2.2,y+1.8]],'#eef7fb','#8fb4c4',.32);   // 호루라기 몸통
 poly(c,[[2.6,y-1.4],[6.2,y-.6],[6.2,y+1],[2.8,y+1.2]],'#dceaf0','#8fb4c4',.3);       // 부리(공기구멍)
 oval(c,-.4,y-.2,.9,.7,'#5d7f8e');                                                    // 울림구멍
 oval(c,-1.4,y-2.6,.5,.58,'#38505c');oval(c,.9,y-2.8,.5,.58,'#38505c');               // 눈
 c.strokeStyle='#b9cfd9';c.lineWidth=.5;                                              // 목에 걸린 끈
 c.beginPath();c.arc(0,y+2.6,3.4,Math.PI*.15,Math.PI*.85);c.stroke();
 for(let i=0;i<3;i++){                                          // 항상 맴도는 작은 소리 고리
  const r=2.4+i*1.5+Math.sin(t*2.4+i)*.4;
  c.strokeStyle=`rgba(234,249,255,${.34-i*.08+puff*.3})`;c.lineWidth=.5;
  c.beginPath();c.ellipse(5.4+i*.8,y+.2,r*.5,r,0,0,Math.PI*2);c.stroke();
 }
}
function sandbag(c,m,t,w,bob){                                  // 샌드백 장수 · 몸을 비틀었다가 통째로 들이받는다
 const twist=w?Math.sin(w*Math.PI*.9):0;
 c.save();c.rotate(twist*.3);
 c.strokeStyle='#6e5a48';c.lineWidth=.6;                        // 천장 고리 대신 남은 쇠사슬
 c.beginPath();c.moveTo(0,-15.4);c.lineTo(0,-17.6);c.stroke();
 for(let i=0;i<3;i++){c.beginPath();c.ellipse(0,-15.6-i*.8,.55,.42,0,0,Math.PI*2);c.stroke();}
 poly(c,[[-3.6,-1.2],[3.6,-1.2],[4.2,-14.2],[-4.2,-14.2]],'#9c6a44','#6b4527',.4);    // 가죽 몸통
 poly(c,[[-4.2,-14.2],[4.2,-14.2],[3.8,-15.6],[-3.8,-15.6]],'#7c5233');               // 상단 마개
 for(const y of [-4.6,-8.4,-12])                                                      // 박음질 띠
  {c.strokeStyle='#d8b784';c.lineWidth=.35;c.beginPath();c.moveTo(-4,y);c.lineTo(4,y);c.stroke();}
 for(let i=0;i<5;i++)oval(c,-3.2+i*1.6,-6.4+(i%2)*3.1,.36,.36,'#c9a06e');             // 오래된 자국
 oval(c,-1.5,-11.4,.66,.78,'#f4ece0');oval(c,1.5,-11.4,.66,.78,'#f4ece0');
 oval(c,-1.5+twist*.3,-11.4,.32,.4,'#2b1f16');oval(c,1.5+twist*.3,-11.4,.32,.4,'#2b1f16');
 for(const s of [-1,1]){                                        // 모래가 뭉친 두 팔
  c.save();c.translate(s*4,-9.6);c.rotate(s*(-.4-twist*.9));
  poly(c,[[-1,-1],[1,-1],[1.5,4.4],[-1.5,4.4]],'#8c5c3a','#6b4527',.3);
  oval(c,0,4.8,1.8,1.6,'#a3704a');c.restore();
 }
 if(w>.55){c.strokeStyle=`rgba(216,183,132,${(w-.55)*1.6})`;c.lineWidth=.55;          // 흩날리는 모래
  for(let i=0;i<4;i++){const a=t*5+i*1.5;c.beginPath();
   c.moveTo(Math.cos(a)*4.4,-8+Math.sin(a)*4);c.lineTo(Math.cos(a)*7.4,-8+Math.sin(a)*6.4);c.stroke();}}
 c.restore();
}
function tray(c,m,t,w,bob){                                     // 식판 요정 · 식판을 뒤로 젖혔다가 원반처럼 던진다
 const wind=w?Math.sin(w*Math.PI*.8):0,y=-7.4-bob*1.3;
 c.strokeStyle='#9fb0b7';c.lineWidth=.5;                        // 떠 있는 작은 몸
 oval(c,0,y,2.8,3.2,'#eef3f5');
 for(const s of [-1,1])poly(c,[[s*2.4,y-.6],[s*5.2,y-3.4],[s*4.6,y-1.6]],'#dbe6ea','#9fb0b7',.25);  // 냅킨 날개
 oval(c,-1,y-.9,.52,.6,'#43555c');oval(c,1,y-.9,.52,.6,'#43555c');
 poly(c,[[-.9,y+1.1],[.9,y+1.1],[0,y+2.1]],'#8fb7a0');          // 입
 c.save();                                                      // 들고 있는 식판
 c.translate(3.4,y+.6);c.rotate(.5+wind*1.5);
 poly(c,[[-4.2,-2.4],[4.2,-2.4],[4.2,2.4],[-4.2,2.4]],'#c3d0d6','#8d9ba2',.35);
 for(const [ox,oy,rx,ry] of [[-2.4,-.9,1.4,.9],[.4,-1,1,.8],[2.5,-.9,1,.8],[-1,1.2,2.4,.9],[2.6,1.2,1.2,.9]])
  {c.strokeStyle='#8d9ba2';c.lineWidth=.28;c.beginPath();c.ellipse(ox,oy,rx,ry,0,0,Math.PI*2);c.stroke();}
 oval(c,-2.4,-.9,1,.6,'#e6d7a8');                               // 남은 밥 한 덩이
 c.restore();
 if(w>.45){c.strokeStyle=`rgba(244,248,249,${(w-.45)*1.5})`;c.lineWidth=.6;
  c.beginPath();c.arc(3.4,y+.6,6.2,-.6,1.4);c.stroke();}
}
function resonance(c,m,t,w,bob){                                // 금요일 공명체 — 기존 모습 유지
 const r=m.radius||7;
 const metal=c.createLinearGradient(-r,-r*2,r,r);
 metal.addColorStop(0,'#b7a3bb');metal.addColorStop(.4,m.color||'#929b92');metal.addColorStop(1,'#4d5553');
 for(const sign of [-1,1]){oval(c,sign*r*.65,-1,r*.5,r*.4,'#555d57');oval(c,sign*r,-r*.9+bob,r*.45,r*.75,metal);}
 oval(c,0,-r*1.1+bob,r,r*1.05,metal);oval(c,0,-r*2+bob,r*.66,r*.55,metal);
 c.strokeStyle='#4b534e';c.lineWidth=.25;c.beginPath();c.moveTo(-r*.7,-r*1.2);c.lineTo(0,-r*.9);c.lineTo(r*.55,-r*1.3);c.stroke();
 oval(c,-r*.25,-r*2.05+bob,.42,.35,'#f2d383');oval(c,r*.25,-r*2.05+bob,.42,.35,'#f2d383');
 oval(c,0,-r*1.05,1.3,1.8,'#eed5ed');
}
const BODY={golem,brush,mud,drone,firefly,android,servo,cogger,
 hurdle,whistle,sandbag,tray,boss:resonance};

// 머리 위 이름표. 배경 박스 없이 외곽선만 둘러 배경을 가리지 않는다.
function nameplate(d,m,z){
 const c=d.c,p=d.p(m.x,m.y,z),tag=monsterTag(m.kind);
 const label=monsterDisplayName(m);
 if(!label)return;
 c.save();c.font='700 12px "Malgun Gothic",sans-serif';c.textAlign='left';c.textBaseline='middle';
 const bracket=tag?`[${tag.short}] `:'';
 const total=c.measureText(bracket+label).width;
 let x=p.x-total/2;
 c.lineJoin='round';c.lineWidth=3.2;c.strokeStyle='#1d2b26d9';
 if(bracket){c.strokeText(bracket,x,p.y);c.fillStyle=tag.color;c.fillText(bracket,x,p.y);x+=c.measureText(bracket).width;}
 c.strokeText(label,x,p.y);c.fillStyle='#f4f1e4';c.fillText(label,x,p.y);
 c.restore();
}

export function creature(d,m,t,viewerDistance=Infinity){
 const c=d.c,r=m.radius||3,u=CONFIG.zoom,pilot=isNeutralPilot(m);
 // 막 나타난 몬스터는 잠깐 투명한 상태에서 또렷해진다.
 const appear=m.fade>0?Math.max(0,Math.min(1,1-m.fade/(CONFIG.spawnFade||.6))):1;
 if(appear<1){c.save();c.globalAlpha=.15+appear*.85;}
 const kick=m.recoil>0&&m.recoilFull?Math.sin(m.recoil/m.recoilFull*Math.PI)*1:0;
 const p=d.p(m.x+(m.recoilX||0)*kick,m.y+(m.recoilY||0)*kick,0);
 const flash=m.flash>0?Math.min(1,m.flash/.26):0;
 const w=windupPhase(m);
 d.ellipse(m.x,m.y,r+1,r*.65,'#202b2738');
 // 보스의 공격 전조는 renderer 가 바닥층에 그린다(boss-art.js drawBossGround).
 c.save();c.translate(p.x,p.y);
 if(pilot){
  c.scale(u,u);const pose=neutralPose(m);
  if(m.kind==='hurdle')drawHurdle(c,m,pose);
  else if(m.kind==='whistle')drawWhistle(c,m,pose);
  else if(m.kind==='tray')drawTray(c,m,pose);
  else if(m.kind==='sandbag')drawSandbag(c,m,pose);
  else if(m.kind==='brush')drawBrush(c,m,pose);
  else if(m.kind==='mud')drawSurveySentinel(c,m,pose);
  else if(m.kind==='drone')drawDragonflyDrone(c,m,pose);
  else if(m.kind==='firefly')drawElectricFirefly(c,m,pose);
  else if(m.kind==='android')drawBrokenElevator(c,m,pose);
  else if(m.kind==='servo')drawRagingCart(c,m,pose);
  else if(m.kind==='cogger')drawCuttingTurret(c,m,pose);
  else drawGolem(c,m,pose,viewerDistance);
 }else{
  if(flash){const squash=1+flash*.13;c.scale(u*squash,u*(2-squash));}else c.scale(u,u);
  // 준비 동작 동안 공격 방향으로 몸을 살짝 기울인다 — 어디를 노리는지 읽힌다.
  if(w&&m.face){const lean=Math.sin(w*Math.PI)*.16;c.rotate((m.face.x-m.face.y)*lean*.5);}
  const bob=Math.sin(t*3+m.x)*.4;
  if(w){                                                           // 공격 준비 — 몸 뒤로 번지는 따뜻한 테두리가 점점 진해진다
   const glow=Math.pow(Math.min(1,w),.7),cy=-r*1.7;
   const rx=r*2.1+glow*1.3,ry=r*2.8+glow*1.7;
   const halo=c.createRadialGradient(0,cy,r*.5,0,cy,ry);   // 가장자리로 갈수록 스르르 사라지는 기운
   halo.addColorStop(0,'rgba(255,214,140,0)');
   halo.addColorStop(.55,`rgba(255,219,150,${glow*.42})`);
   halo.addColorStop(.82,`rgba(255,196,104,${glow*.5})`);
   halo.addColorStop(1,'rgba(255,196,104,0)');
   c.fillStyle=halo;c.beginPath();c.ellipse(0,cy,rx,ry,0,0,Math.PI*2);c.fill();
  }
  if(m.kind==='boss')drawBossBody(c,m,t);else (BODY[m.kind]||resonance)(c,m,t,w,bob);
  if(flash&&m.kind!=='boss'){                                     // 피격 백색 플래시 · 몬스터에만 얹는다(보스는 boss-art 가 몸 모양 안에만 입힌다)
   c.globalAlpha=flash*.52;c.fillStyle='#fffdf2';c.beginPath();
   c.ellipse(0,-r*1.7,r*1.5,r*2.1,0,0,Math.PI*2);
   c.fill();c.globalAlpha=1;
  }
 }
 c.restore();
 if(m.kind==='boss'&&m.raid&&m.phase!=='telegraph')d.label(m.x,m.y,m.phase==='shift'?'형태 전환 중 · 무적':m.phase==='recover'?'핵 노출 · 지금 공격!':'장갑 보호 · 공격 예고를 피하세요',m.phase==='shift'?phaseOf(m).deep:'#8a6a2c',-6);
 const top=m.kind==='boss'?26:pilot?22:r*2+9;
 if(m.kind==='boss')drawBossBar(d,m,top);
 else if(m.hp<m.maxHp){
  const h=d.p(m.x,m.y,top);
  c.fillStyle='#1d2b26c9';c.fillRect(h.x-21,h.y,42,4);
  c.fillStyle='#dca85c';c.fillRect(h.x-20.5,h.y+.5,41*Math.max(0,m.hp/m.maxHp),3);
 }
 if(m.kind!=='golem'||!isGolemDormant(m))nameplate(d,m,top+(m.kind==='boss'?6:5.5));
 if(m.kind==='boss'){const P=phaseOf(m);d.label(m.x,m.y,`${m.bossStage||bossPhase(m)}페이즈 · ${P.dept} ${P.name}`,P.deep,top+11);}
 if(appear<1)c.restore();
}
