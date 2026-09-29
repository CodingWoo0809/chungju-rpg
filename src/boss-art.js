// ── 금요일 보스 '운동장의 공명체' 그림 (Revision 75) ───────────────────────────────
// 1) drawBossBody  — 페이즈별 몸(시안 4장을 쿼터뷰 필드 보스로 다시 그림). creatures.js 가 c.scale(zoom) 뒤 발밑 기준으로 부른다.
//    단위는 월드 높이 1(= zoom px). 키는 약 22(홍길동 약 6의 네 배 가까이)로 위압감을 준다.
//      1 건축: 흰 설계 도면 판과 붉은 띠가 A자 치마처럼 늘어진 가는 몸, 양팔은 거대한 삼각자, 붉은 조준 눈 · 붉은 후광
//      2 기계: 넓은 어깨의 톱니 링, 거대한 블록 팔뚝 · 주황 피스톤, 짧고 굵은 다리, 브론즈 · 흰 판
//      3 전기: 뒤로 뻗은 칼날 날개, 흰 애자(碍子) 고리가 달린 전극 창 팔, 파란 회로 치마, 몸을 감도는 아크
//      4 토목: 콘크리트 · 암석 덩어리 몸, 노랑/검정 경고 줄무늬 판, 왼팔 드릴 · 오른팔 바위 주먹, 떠다니는 파편
// 2) drawBossGround — 바닥 전조(모든 물체보다 먼저). 판정과 같은 hazard 데이터를 그대로 그린다.
//    전조 동안 '채워지는 안쪽'(원 · 도형은 가운데서 커지고 선은 앞으로 차오름)이 남은 시간을 보여 준다.
// 3) drawBossFront — 판정 중인 공격의 세운 연출(번개 기둥 · 전극 · 전류선 · 돌진 불꽃)과 전조 문구.
// 4) drawBossFx / drawBossShift — 타격 순간의 폭발 · 절단 · 낙뢰 · 암석 분출, 페이즈 전환 연출.
import {CONFIG} from './config.js';
import {BOSS_PHASES,BOSS_PATTERNS} from './boss-combat.js';
import {rnd,groundEllipse,fxHex as hex,fxGlowPath as glowPath,fxStar as star,fxShard as shard,fxCrystal as crystal,
 fxSoftGlow as softGlow,fxBolt as bolt,fxPrism as prism,fxBurst as burst} from './combat-vfx.js';

const TAU=Math.PI*2;
const clamp01=v=>Math.max(0,Math.min(1,v));
const span=(u,a,b)=>clamp01((u-a)/(b-a));
export const phaseOf=m=>BOSS_PHASES[m?.bossStage||1]||BOSS_PHASES[1];

// ── 몸 그리기 도구(로컬 좌표) ───────────────────────────────
function poly(c,pts,fill,stroke,lw=.25){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.lineJoin='round';c.stroke();}}
function glowDot(c,x,y,r,color,a=1){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,hex('#ffffff',a));g.addColorStop(.25,hex(color,a));g.addColorStop(1,hex(color,0));c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
function gear(c,x,y,r,teeth,rot,fill,edge){
 c.save();c.translate(x,y);c.rotate(rot);c.beginPath();
 for(let i=0;i<teeth*2;i++){const a=i/(teeth*2)*TAU,rr=i%2?r:r*1.18;c.lineTo(Math.cos(a-.08)*rr,Math.sin(a-.08)*rr);c.lineTo(Math.cos(a+.08)*rr,Math.sin(a+.08)*rr);}
 c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=edge;c.lineWidth=.22;c.stroke();
 c.fillStyle=edge;c.beginPath();c.arc(0,0,r*.38,0,TAU);c.fill();c.restore();
}
function halo(c,y,r,color,t,dashes=12){
 c.save();c.strokeStyle=hex(color,.85);c.lineWidth=.22;c.beginPath();c.arc(0,y,r,0,TAU);c.stroke();
 for(let i=0;i<dashes;i++){const a=i/dashes*TAU+t*.4;c.beginPath();c.moveTo(Math.cos(a)*r,y+Math.sin(a)*r);c.lineTo(Math.cos(a)*(r+.6),y+Math.sin(a)*(r+.6));c.stroke();}
 c.restore();
}
function crown(c,y,main,light,edge){                                       // 머리 위 세 갈래 뿔 + 가운데 조준 눈
 poly(c,[[-1.4,y+.6],[0,y-3.4],[1.4,y+.6]],light,edge,.2);
 poly(c,[[-1.1,y],[-3.2,y-2.4],[-.4,y-.6]],light,edge,.2);poly(c,[[1.1,y],[3.2,y-2.4],[.4,y-.6]],light,edge,.2);
 poly(c,[[-1.2,y+.4],[1.2,y+.4],[0,y+2.2]],main,edge,.2);
}
function stripes(c,pts,w){                                               // 노랑/검정 경고 줄무늬 판
 c.save();poly(c,pts,'#f1b919','#2a2210',.2);c.clip();c.strokeStyle='#1d1a14';c.lineWidth=w*.45;
 const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x0=Math.min(...xs)-6,x1=Math.max(...xs)+6,y0=Math.min(...ys),y1=Math.max(...ys);
 for(let x=x0;x<x1;x+=w){c.beginPath();c.moveTo(x,y1);c.lineTo(x+(y1-y0),y0);c.stroke();}c.restore();
}

// ① 건축 — 설계 형태
function architecture(c,m,t,P){
 const sway=Math.sin(t*1.6)*.35;
 // 뒤쪽 붉은 띠(치마 뒤판)
 for(let i=-4;i<=4;i++){const x=i*1.6,b=i*2.1+sway*(1+Math.abs(i)*.2);poly(c,[[x*.35-.5,-11],[x*.35+.5,-11],[b+1.1,-.4],[b,.6],[b-1.1,-.4]],i%2?'#9d1f2b':'#c8303d','#5a1016',.15);}
 // 앞쪽 흰 도면 판(설계선 무늬)
 for(let i=-3;i<=3;i++){const x=i*1.9,b=i*2.5+sway*(1+Math.abs(i)*.25),top=-11.2+Math.abs(i)*.2,bot=-1.2-Math.abs(i)*.4;
  poly(c,[[x*.45-.9,top],[x*.45+.9,top],[b+1.5,bot],[b,bot+1.6],[b-1.5,bot]],'#ece6df','#6e5e5b',.15);
  c.strokeStyle='#8b7f86';c.lineWidth=.08;c.beginPath();c.rect(b*.8-.7,(top+bot)/2-.8,1.4,1.8);c.moveTo(b*.8-.7,(top+bot)/2);c.lineTo(b*.8+.7,(top+bot)/2);c.stroke();}
 // 몸통 · 허리
 poly(c,[[-2.4,-11],[2.4,-11],[3.4,-16.5],[0,-17.6],[-3.4,-16.5]],'#e3dcd6','#5a4a4a',.2);
 poly(c,[[-1.4,-11.4],[1.4,-11.4],[1.8,-15],[-1.8,-15]],'#b52734');
 // 양팔 삼각자(몸 옆에 세운 거대한 자)
 for(const s of [-1,1]){
  const sx=s*3.2,sy=-16.2;
  c.lineCap='round';c.strokeStyle='#8a2230';c.lineWidth=1.1;c.beginPath();c.moveTo(sx,sy);c.lineTo(s*6.4,-12);c.lineTo(s*7.2,-8);c.stroke();
  const pts=[[s*5.2,-19.5],[s*12.5,-3],[s*5.2,-3]];poly(c,pts,'#eee8e1','#4d3d3b',.22);
  poly(c,[[s*6.4,-15.4],[s*10.2,-4.6],[s*6.4,-4.6]],'#c42a38');
  c.strokeStyle='#4d3d3b';c.lineWidth=.1;for(let k=0;k<14;k++){const y=-18.4+k*1.1;c.beginPath();c.moveTo(s*5.2,y);c.lineTo(s*(5.2+(k%5?.4:.8)),y);c.stroke();}
  poly(c,[[s*7.4,-8.4],[s*8.6,-6.6],[s*7.9,-5.6]],'#9aa0a4','#3a3a3a',.12);            // 컴퍼스 집게 손
 }
 // 어깨 삼각 장식
 for(const s of [-1,1])poly(c,[[s*1.6,-17],[s*5,-20.5],[s*4.4,-16]],'#e6dfd8','#4d3d3b',.2);
 // 가슴 조준 코어 · 붉은 측정선
 glowDot(c,0,-14.6,2.6,P.main,.95);c.strokeStyle=hex(P.main,.9);c.lineWidth=.12;c.beginPath();c.arc(0,-14.6,1.3,0,TAU);c.moveTo(-2.4,-14.6);c.lineTo(2.4,-14.6);c.moveTo(0,-16.9);c.lineTo(0,-12.3);c.stroke();
 const scan=(t*.8)%1;c.strokeStyle=hex(P.main,.55*(1-scan));c.lineWidth=.1;c.beginPath();c.moveTo(-12,-3-scan*16);c.lineTo(12,-3-scan*16);c.stroke();
 halo(c,-20.2,3.4,P.main,t,16);crown(c,-19.6,'#c42a38','#ece6df','#4d3d3b');glowDot(c,0,-19.8,1.2,P.main);
}
// ② 기계 — 구동 형태
function machine(c,m,t,P){
 const pump=Math.sin(t*6)*.35,spin=t*1.4;
 for(const s of [-1,1]){                                                   // 다리 · 발
  poly(c,[[s*1.8,-8.5],[s*5.2,-8.5],[s*5.6,-2.2],[s*1.6,-2.2]],'#6d4a33','#2f2015',.2);
  poly(c,[[s*1,-2.6],[s*6.6,-2.6],[s*7.4,.6],[s*.4,.6]],'#8a5f3e','#2f2015',.2);poly(c,[[s*1.8,-1.8],[s*5.8,-1.8],[s*6.2,0],[s*1.4,0]],'#e7ddd1','#2f2015',.12);
  c.fillStyle=P.main;c.fillRect(s*3.4-.5,-7.6+pump*.4,1,3);
 }
 for(let i=-3;i<=3;i++)poly(c,[[i*1.3-.6,-9.4],[i*1.3+.6,-9.4],[i*1.9+.5,-4.8],[i*1.9-.5,-4.8]],i%2?'#a06a45':'#e3d7c8','#3a2718',.12);   // 허리판
 poly(c,[[-7.8,-9.4],[7.8,-9.4],[6.4,-17.8],[-6.4,-17.8]],'#7a5238','#2f2015',.25);                 // 몸통
 poly(c,[[-5.8,-11],[-1.2,-11],[-1.6,-16.8],[-5.2,-16.8]],'#e7ddd1','#3a2718',.12);poly(c,[[5.8,-11],[1.2,-11],[1.6,-16.8],[5.2,-16.8]],'#e7ddd1','#3a2718',.12);
 for(const s of [-1,1]){                                                   // 어깨 톱니 링 · 거대한 팔뚝
  gear(c,s*8.2,-16.4,3.1,12,spin*s,'#8a5f3e','#3a2718');
  poly(c,[[s*7.4,-14.5],[s*10.4,-14.5],[s*10.8,-9],[s*7.2,-9]],'#6d4a33','#2f2015',.2);
  c.fillStyle='#e07a2a';c.fillRect(s*8.9-.55,-13.6+pump,1.1,3.6);c.fillStyle='#c9c2b8';c.fillRect(s*8.9-.3,-10.4+pump,.6,1.6);
  poly(c,[[s*6.8,-9.6],[s*12.6,-9.6],[s*13.2,-2.4],[s*6.4,-2.4]],'#e7ddd1','#2f2015',.25);
  poly(c,[[s*8.2,-8.2],[s*11.6,-8.2],[s*10.2,-5.2]],P.main);
  for(let k=0;k<3;k++)poly(c,[[s*(6.8+k*2.1),-2.6],[s*(8.7+k*2.1),-2.6],[s*(8.5+k*2.1),-.4],[s*(7+k*2.1),-.4]],'#8a5f3e','#2f2015',.15);
 }
 gear(c,0,-14.4,2.6,10,-spin*1.6,'#a06a45','#3a2718');glowDot(c,0,-14.4,2.8,P.main,.95);                                   // 동력 코어
 poly(c,[[-1.6,-17.6],[1.6,-17.6],[1.2,-19.6],[-1.2,-19.6]],'#6d4a33','#2f2015',.15);
 c.save();c.translate(0,-21);gear(c,0,0,2.8,14,spin*.6,'#00000000','#e07a2a');c.restore();
 crown(c,-20.2,'#e07a2a','#e7ddd1','#3a2718');glowDot(c,0,-20.4,1.1,P.main);
 const puff=(t*.7)%1;softGlow(c,s0(t)*7,-18-puff*5,1.4+puff*2,1+puff*1.4,'#d8d0c8',.45*(1-puff));
}
const s0=t=>Math.sin(t*.9)>0?1:-1;
// ③ 전기 — 전하 형태
function electric(c,m,t,P){
 for(let i=0;i<5;i++)for(const s of [-1,1]){                               // 뒤로 뻗은 칼날 날개(위에서 바깥으로 부채처럼)
  const th=.3+i*.3,len=11.5-i*1.1,x0=s*2.4,y0=-15.6,x1=x0+s*Math.sin(th)*len,y1=y0-Math.cos(th)*len;
  poly(c,[[x0,y0],[x1,y1],[x0+s*1.5,y0+1.3]],i%2?'#dfe6ef':'#2b4fa8','#16244f',.15);
 }
 for(let i=-4;i<=4;i++){const b=i*2.2,top=-11,bot=-.6-Math.abs(i)*.5+(i%2)*.8;       // 파란 회로 치마
  poly(c,[[i*.5-.7,top],[i*.5+.7,top],[b+1.3,bot],[b,bot+1.8],[b-1.3,bot]],i%2?'#dfe6ef':'#2c55c9','#14224f',.13);
  if(i%2===0){c.strokeStyle=hex('#9fd3ff',.8);c.lineWidth=.1;c.beginPath();c.moveTo(i*.4,top+1);c.lineTo(b*.7,(top+bot)/2);c.lineTo(b*.7+.8,(top+bot)/2);c.lineTo(b*.9,bot);c.stroke();}}
 poly(c,[[-2.2,-11],[2.2,-11],[3.2,-16.6],[0,-18],[-3.2,-16.6]],'#e3e8f0','#1d2a55',.2);poly(c,[[-1.2,-11.6],[1.2,-11.6],[1.4,-15.4],[-1.4,-15.4]],'#2c55c9');
 for(const s of [-1,1]){                                                   // 전극 창 팔 + 애자 고리
  c.strokeStyle='#27345e';c.lineWidth=.9;c.lineCap='round';c.beginPath();c.moveTo(s*3,-16);c.lineTo(s*9.5,-3);c.stroke();
  for(let k=0;k<4;k++){const f=.25+k*.18,x=s*(3+6.5*f),y=-16+13*f;c.save();c.translate(x,y);c.rotate(s*-.45);c.fillStyle='#eef2f6';c.beginPath();c.ellipse(0,0,1.25,.45,0,0,TAU);c.fill();c.strokeStyle='#5a6a88';c.lineWidth=.12;c.stroke();c.restore();}
  poly(c,[[s*9,-4],[s*10.8,-.6],[s*11.8,1.8],[s*10,-1.4]],'#dfe6ef','#16244f',.15);glowDot(c,s*11.4,1,1.4,P.main,.8);
 }
 glowDot(c,0,-14.6,3,P.main,1);c.strokeStyle=hex('#cfe8ff',.9);c.lineWidth=.12;c.beginPath();c.arc(0,-14.6,1.5,0,TAU);c.stroke();
 halo(c,-20.4,3.2,P.main,t*2,20);crown(c,-19.8,'#2c55c9','#e3e8f0','#1d2a55');glowDot(c,0,-20,1.2,P.main);
 const f=Math.floor(t*12);c.save();c.strokeStyle=hex('#bfe4ff',.9);c.lineWidth=.14;       // 몸을 감도는 아크
 for(let k=0;k<3;k++){const a=rnd(f,k)*TAU,r=5+rnd(f,k+9)*5;let x=Math.cos(a)*r,y=-11+Math.sin(a)*r*.9;c.beginPath();c.moveTo(x,y);for(let j=0;j<4;j++){x+=(rnd(f,k*9+j)-.5)*2.4;y+=(rnd(f,k*7+j+3)-.5)*2.4;c.lineTo(x,y);}c.stroke();}
 c.restore();
}
// ④ 토목 — 지반 형태
function civil(c,m,t,P){
 const bob=Math.sin(t*1.4);
 for(let i=0;i<7;i++){const a=i/7*TAU+t*.25,x=Math.cos(a)*12.5,y=-12+Math.sin(a)*4.5+Math.sin(t*2+i)*.6;       // 떠다니는 암석
  if(Math.sin(a)<0)poly(c,[[x-.8,y-.6],[x+.6,y-.9],[x+.9,y+.5],[x-.5,y+.8]],'#8e8a82','#3d3a34',.12);}
 for(const s of [-1,1]){                                                   // 다리(돌 블록) · 줄무늬 받침
  poly(c,[[s*1.6,-9],[s*6,-9],[s*6.6,-2.6],[s*1.2,-2.6]],'#a19c92','#3d3a34',.22);
  stripes(c,[[s*.6,-3],[s*7.6,-3],[s*8.2,.6],[s*0,.6]],1.1);
 }
 poly(c,[[-8.4,-8.8],[8.4,-8.8],[7.4,-18.6],[-7.4,-18.6]],'#b2ada3','#3d3a34',.25);                 // 바위 몸통
 c.strokeStyle='#6b665e';c.lineWidth=.12;for(let k=0;k<6;k++){c.beginPath();c.moveTo(-7+k*2.6,-18.2);c.lineTo(-6+k*2.4+(k%2)*.8,-13);c.lineTo(-7.2+k*2.7,-9.2);c.stroke();}
 c.strokeStyle='#e0a616';c.lineWidth=.25;for(let k=0;k<4;k++){c.beginPath();c.moveTo(-1.4,-10-k*1.8);c.lineTo(1.4,-11.8-k*1.8);c.moveTo(1.4,-10-k*1.8);c.lineTo(-1.4,-11.8-k*1.8);c.stroke();}   // 가운데 트러스
 stripes(c,[[-7.8,-18.8],[-2.6,-18.8],[-3.4,-15.4],[-8.2,-15.4]],1);stripes(c,[[7.8,-18.8],[2.6,-18.8],[3.4,-15.4],[8.2,-15.4]],1);
 glowDot(c,0,-14.2,3.2,P.main,1);c.strokeStyle=hex('#fff0b0',.9);c.lineWidth=.14;for(let k=0;k<6;k++){const a=k/6*TAU+.3;c.beginPath();c.moveTo(Math.cos(a)*1.2,-14.2+Math.sin(a)*1.2);c.lineTo(Math.cos(a)*3.8,-14.2+Math.sin(a)*3.4);c.stroke();}
 // 왼팔 드릴 · 오른팔 바위 주먹
 poly(c,[[-8,-18.4],[-12.4,-17.6],[-13,-7],[-8.6,-7.6]],'#8a857c','#3d3a34',.22);stripes(c,[[-8.4,-12],[-12.8,-12],[-12.9,-10],[-8.5,-10]],.9);
 const spin=t*6;poly(c,[[-13.4,-7.4],[-8,-7.4],[-10.7,1.4]],'#9a948a','#3d3a34',.22);
 c.strokeStyle='#e0a616';c.lineWidth=.3;for(let k=0;k<4;k++){const y=-6.4+k*1.9+((spin*.3)%1)*1.9,w=(1-(y+7.4)/8.8)*2.7;c.beginPath();c.moveTo(-10.7-w,y);c.lineTo(-10.7+w,y+.8);c.stroke();}
 poly(c,[[8,-18.4],[12.6,-17.4],[13.2,-9],[8.6,-9.6]],'#a19c92','#3d3a34',.22);
 poly(c,[[8.2,-9.8],[13.8,-9.6],[14.4,-3.6],[12,-2.4],[8.6,-3.4]],'#b2ada3','#3d3a34',.25);stripes(c,[[9.6,-17],[12.4,-16.6],[12.6,-14.8],[9.6,-15]],.9);
 crown(c,-20.4,'#f1b919','#b2ada3','#3d3a34');halo(c,-21,3.3,P.main,t,14);glowDot(c,0,-20.6,1.2,P.main);
 for(let i=0;i<7;i++){const a=i/7*TAU+t*.25,x=Math.cos(a)*12.5,y=-12+Math.sin(a)*4.5+Math.sin(t*2+i)*.6;
  if(Math.sin(a)>=0)poly(c,[[x-.8,y-.6],[x+.6,y-.9],[x+.9,y+.5],[x-.5,y+.8]],'#a19c92','#3d3a34',.12);}
}
const FORMS=[null,architecture,machine,electric,civil];

// 몸 전체. 발밑 그림자, 코어 빛 번짐, 전환 중 섬광과 크기 튐.
// 입체감: 몸을 따로 그린 뒤 왼쪽 위 빛 · 오른쪽 그늘 · 발치 어둠 · 가장자리 역광을 몸 모양 안에만 입힌다.
let layerCanvas=null;
function bodyLayer(w,h){
 if(typeof document==='undefined'&&typeof OffscreenCanvas==='undefined')return null;
 if(!layerCanvas)layerCanvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):document.createElement('canvas');
 if(layerCanvas.width<w)layerCanvas.width=w;if(layerCanvas.height<h)layerCanvas.height=h;
 return layerCanvas;
}
function shadedForm(c,m,t,P,stage){
 const tr=typeof c.getTransform==='function'?c.getTransform():null,k=tr?Math.hypot(tr.a,tr.b):0;
 const L=k>0?bodyLayer(Math.ceil(34*k),Math.ceil(33*k)):null,b=L?.getContext('2d');
 if(!b){FORMS[stage](c,m,t,P);return;}
 const W=34,H=33,ox=17,oy=29;
 b.setTransform(1,0,0,1,0,0);b.clearRect(0,0,L.width,L.height);b.setTransform(k,0,0,k,ox*k,oy*k);
 FORMS[stage](b,m,t,P);
 b.globalCompositeOperation='source-atop';
 const side=b.createLinearGradient(-13,0,13,0);side.addColorStop(0,'rgba(255,255,255,.2)');side.addColorStop(.45,'rgba(255,255,255,0)');side.addColorStop(1,'rgba(10,14,30,.34)');
 b.fillStyle=side;b.fillRect(-ox,-oy,W,H);
 const foot=b.createLinearGradient(0,-7,0,1);foot.addColorStop(0,'rgba(0,0,0,0)');foot.addColorStop(1,'rgba(0,0,0,.3)');b.fillStyle=foot;b.fillRect(-ox,-oy,W,H);
 const rim=b.createRadialGradient(0,-14,4,0,-12,15);rim.addColorStop(0,'rgba(0,0,0,0)');rim.addColorStop(.8,hex(P.main,0));rim.addColorStop(1,hex(P.main,.35));b.fillStyle=rim;b.fillRect(-ox,-oy,W,H);
 const flash=m.flash>0?Math.min(1,m.flash/.26):0;                    // 피격 섬광은 몸 모양 안에만(큰 흰 타원이 몸을 덮지 않게)
 if(flash){b.fillStyle=`rgba(255,253,242,${(flash*.55).toFixed(3)})`;b.fillRect(-ox,-oy,W,H);}
 b.globalCompositeOperation='source-over';
 c.drawImage(L,0,0,W*k,H*k,-ox,-oy,W,H);
}
export function drawBossBody(c,m,t){
 const P=phaseOf(m),stage=m.bossStage||1;
 c.save();
 const g=c.createRadialGradient(0,0,0,0,0,12);g.addColorStop(0,'rgba(20,24,22,.42)');g.addColorStop(1,'rgba(20,24,22,0)');c.fillStyle=g;c.beginPath();c.ellipse(0,0,12,4.6,0,0,TAU);c.fill();
 const shift=m.phase==='shift'?clamp01(m.timer/1.3):0;
 if(shift>0){const pop=1+Math.sin(shift*Math.PI)*.08;c.scale(pop,pop);}
 const aura=c.createRadialGradient(0,-13,1,0,-13,13);aura.addColorStop(0,hex(P.main,.28+(m.phase==='recover'?.2:0)));aura.addColorStop(1,hex(P.main,0));c.fillStyle=aura;c.beginPath();c.ellipse(0,-12,13,13,0,0,TAU);c.fill();
 c.translate(0,Math.sin(t*2)*.25);
 shadedForm(c,m,t,P,stage);
 if(m.phase==='recover'){const k=.5+.5*Math.sin(t*10);glowDot(c,0,-14.5,4.5,'#ffffff',.35*k);}          // 핵 노출
 if(shift>0){const f=c.createRadialGradient(0,-13,0,0,-13,13);f.addColorStop(0,hex('#ffffff',.9*shift));f.addColorStop(.5,hex(P.edge,.55*shift));f.addColorStop(1,hex(P.main,0));c.fillStyle=f;c.beginPath();c.ellipse(0,-12,13,14,0,0,TAU);c.fill();}
 c.restore();
}

// ── 위험 구역: 월드 좌표 모양을 화면 경로로 ─────────────────────
function worldPath(c,d,pts){c.beginPath();pts.forEach(([x,y],i)=>{const q=d.p(x,y,0);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);});c.closePath();}
function lineQuad(h,from=0,to=1){const vx=h.x2-h.x1,vy=h.y2-h.y1,l=Math.hypot(vx,vy)||1,nx=-vy/l*h.w,ny=vx/l*h.w;
 const ax=h.x1+vx*from,ay=h.y1+vy*from,bx=h.x1+vx*to,by=h.y1+vy*to;return [[ax+nx,ay+ny],[bx+nx,by+ny],[bx-nx,by-ny],[ax-nx,ay-ny]];}
function circlePts(x,y,r,n=40,a0=0,a1=TAU){const out=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;out.push([x+Math.cos(a)*r,y+Math.sin(a)*r]);}return out;}
function scalePts(pts,cx,cy,k){return pts.map(([x,y])=>[cx+(x-cx)*k,cy+(y-cy)*k]);}
function sectorPts(x,y,r0,r1,a0,a1){return [...circlePts(x,y,r1,12,a0,a1),...circlePts(x,y,r0,12,a1,a0)];}
function areaOf(h){                                                  // 판정 모양 = 채울 모양(여러 조각)
 switch(h.type){
  case 'line':case 'rush':return [lineQuad(h)];
  case 'circle':return [circlePts(h.x,h.y,h.r)];
  case 'poly':return [h.pts];
  case 'cone':return [[[h.x,h.y],...circlePts(h.x,h.y,h.r,20,h.ang-h.spread/2,h.ang+h.spread/2)]];
  case 'sector':return h.arcs.map(([a0,a1])=>sectorPts(h.x,h.y,h.r0,h.r1,a0,a1));
  case 'ring':return [[...circlePts(h.x,h.y,h.r1),...circlePts(h.x,h.y,h.r0).reverse()]];
  case 'links':return h.segs.map(([a,b])=>lineQuad({x1:a[0],y1:a[1],x2:b[0],y2:b[1],w:h.w}));
 }
 return [];
}
function chargeOf(h,k){                                              // 남은 시간을 보여 주는 '차오르는 안쪽'
 switch(h.type){
  case 'line':case 'rush':return [lineQuad(h,0,k)];
  case 'circle':return [circlePts(h.x,h.y,h.r*k)];
  case 'poly':return [scalePts(h.pts,h.cx,h.cy,k)];
  case 'cone':return [[[h.x,h.y],...circlePts(h.x,h.y,h.r*k,20,h.ang-h.spread/2,h.ang+h.spread/2)]];
  case 'sector':return h.arcs.map(([a0,a1])=>sectorPts(h.x,h.y,h.r0,h.r0+(h.r1-h.r0)*k,a0,a1));
  case 'ring':return [[...circlePts(h.x,h.y,h.r0+(h.r1-h.r0)*k),...circlePts(h.x,h.y,h.r0).reverse()]];
  case 'links':return h.segs.map(([a,b])=>lineQuad({x1:a[0],y1:a[1],x2:b[0],y2:b[1],w:h.w},0,k));
 }
 return [];
}
const STAGE_OF={cut:1,geometry:1,rush:2,quake:2,bolts:3,arc:3,collapse:4,pile:4};

// 바닥 전조 · 판정 중 바닥 표시
export function drawBossGround(d,m,t){
 const hz=m.hazards||[];if(!hz.length&&m.phase!=='telegraph')return;
 const c=d.c;c.save();
 for(const h of hz){
  const P=BOSS_PHASES[STAGE_OF[h.style]]||phaseOf(m),k=h.warn>0?1-h.warn/h.warnFull:1,live=h.warn<=0;
  const blink=k>.78&&!live?(Math.sin(t*38)>0?1:.55):1;
  // 전조 모양별 장식(판정보다 먼저, 아래에)
  decorate(c,d,h,P,k,t);
  for(const pts of areaOf(h)){worldPath(c,d,pts);c.fillStyle=hex(P.main,(live?.34:.1+.1*k)*blink);c.fill();}
  for(const pts of chargeOf(h,live?1:k)){worldPath(c,d,pts);c.fillStyle=hex(P.main,live?.25:.26*blink);c.fill();}
  for(const pts of areaOf(h)){worldPath(c,d,pts);c.lineJoin='round';c.strokeStyle=hex(P.deep,.55);c.lineWidth=4;c.stroke();c.strokeStyle=hex(k>.78?'#ffffff':P.edge,.95*blink);c.lineWidth=1.6;c.stroke();}
 }
 c.restore();
}
// 모양마다 학과성이 드러나는 바닥 장식(자 눈금 · 도형 보조선 · 톱니 · 전극 고리 · 균열 · 경고 줄무늬)
function decorate(c,d,h,P,k,t){
 const s=h.style;
 if(s==='cut'){                                                      // 자 눈금 + 레이저 가이드 점선
  const vx=h.x2-h.x1,vy=h.y2-h.y1,l=Math.hypot(vx,vy),nx=-vy/l,ny=vx/l;c.strokeStyle=hex(P.main,.8);c.lineWidth=1;
  for(let i=0;i<=l;i+=3){const a=d.p(h.x1+vx*i/l+nx*h.w,h.y1+vy*i/l+ny*h.w),b=d.p(h.x1+vx*i/l+nx*(h.w+(i%15?1:2.4)),h.y1+vy*i/l+ny*(h.w+(i%15?1:2.4)));c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
  const a=d.p(h.x1,h.y1),b=d.p(h.x2,h.y2);c.save();c.setLineDash([10,6]);c.lineDashOffset=-t*60;c.strokeStyle=hex('#ffffff',.9);c.lineWidth=1.2;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.restore();
 }else if(s==='geometry'){                                           // 도형 보조선(외접원 · 대각선 · 십자) — 천천히 도는 도면
  const cx=h.cx??h.x,cy=h.cy??h.y,r=h.r||Math.hypot(h.pts[0][0]-cx,h.pts[0][1]-cy);
  c.strokeStyle=hex(P.edge,.6);c.lineWidth=.9;worldPath(c,d,circlePts(cx,cy,r*1.08,40));c.stroke();
  const rot=t*.6;c.beginPath();for(let i=0;i<4;i++){const a=rot+i*Math.PI/2,p0=d.p(cx,cy),p1=d.p(cx+Math.cos(a)*r*1.25,cy+Math.sin(a)*r*1.25);c.moveTo(p0.x,p0.y);c.lineTo(p1.x,p1.y);}c.stroke();
 }else if(s==='rush'){                                               // 진행 방향 화살표(쉐브론)가 흘러감
  const l=Math.hypot(h.x2-h.x1,h.y2-h.y1);c.strokeStyle=hex('#ffe0bf',.9);c.lineWidth=2.2;c.lineJoin='miter';
  for(let i=((t*24)%6);i<l;i+=6){const f=i/l,x=h.x1+(h.x2-h.x1)*f,y=h.y1+(h.y2-h.y1)*f,a=d.p(x-h.dy*h.w*.6-h.dx*2,y+h.dx*h.w*.6-h.dy*2),b=d.p(x,y),e=d.p(x+h.dy*h.w*.6-h.dx*2,y-h.dx*h.w*.6-h.dy*2);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.lineTo(e.x,e.y);c.stroke();}
 }else if(s==='quake'&&h.type==='cone'){                             // 부채꼴 안 균열
  c.strokeStyle=hex('#2a1a10',.55);c.lineWidth=1.4;for(let i=0;i<7;i++){const a=h.ang-h.spread/2+h.spread*(i+.5)/7,p0=d.p(h.x,h.y);c.beginPath();c.moveTo(p0.x,p0.y);for(let j=1;j<=4;j++){const r=h.r*k*j/4,q=d.p(h.x+Math.cos(a+(rnd(h.id,i*5+j)-.5)*.3)*r,h.y+Math.sin(a+(rnd(h.id,i*5+j)-.5)*.3)*r);c.lineTo(q.x,q.y);}c.stroke();}
 }else if(s==='quake'&&h.type==='ring'){                             // 안쪽 안전 원(흰 점선) — 안쪽이나 바깥은 안전
  const e=groundEllipse(d,h.x,h.y,h.r0);c.save();c.setLineDash([6,5]);c.strokeStyle=hex('#ffffff',.85);c.lineWidth=1.4;c.beginPath();c.ellipse(e.x,e.y,e.rx,e.ry,0,0,TAU);c.stroke();c.restore();
 }else if(s==='bolts'){                                              // 좁혀 드는 전극 고리 + 조준 십자
  const e=groundEllipse(d,h.x,h.y,h.r),q=1.9-.9*k;c.strokeStyle=hex('#cfe8ff',.9);c.lineWidth=1.4;
  c.beginPath();c.ellipse(e.x,e.y,e.rx*q,e.ry*q,0,0,TAU);c.stroke();c.save();c.setLineDash([4,4]);c.lineDashOffset=t*40;c.beginPath();c.ellipse(e.x,e.y,e.rx*(q+.35),e.ry*(q+.35),0,0,TAU);c.stroke();c.restore();
  c.beginPath();c.moveTo(e.x-e.rx*1.2,e.y);c.lineTo(e.x+e.rx*1.2,e.y);c.moveTo(e.x,e.y-e.ry*1.2);c.lineTo(e.x,e.y+e.ry*1.2);c.stroke();
 }else if(s==='arc'){                                                // 전극 받침 고리
  for(const [x,y] of h.nodes){const e=groundEllipse(d,x,y,3.2);c.strokeStyle=hex('#cfe8ff',.9);c.lineWidth=2;c.beginPath();c.ellipse(e.x,e.y,e.rx,e.ry,0,0,TAU);c.stroke();}
 }else if(s==='collapse'){                                           // 퍼지는 균열 + 가장자리 경고 줄무늬
  c.strokeStyle=hex('#2a2210',.6);c.lineWidth=1.6;const R=(h.r1||h.r)*Math.min(1,k*1.2);
  for(let i=0;i<10;i++){const a0=i/10*TAU+rnd(h.id,i)*.4;let p0=d.p(h.x,h.y);c.beginPath();c.moveTo(p0.x,p0.y);for(let j=1;j<=4;j++){const a=a0+(rnd(h.id,i*7+j)-.5)*.5,q=d.p(h.x+Math.cos(a)*R*j/4,h.y+Math.sin(a)*R*j/4);c.lineTo(q.x,q.y);}c.stroke();}
  for(const pts of areaOf(h)){worldPath(c,d,pts);c.save();c.setLineDash([7,7]);c.lineDashOffset=t*20;c.strokeStyle='#1d1a14';c.lineWidth=5;c.stroke();c.restore();}
 }else if(s==='pile'){                                               // 말뚝 선의 경고 줄무늬 테두리 + 착탄점 조준
  for(const pts of areaOf(h)){worldPath(c,d,pts);c.save();c.setLineDash([6,6]);c.lineDashOffset=-t*30;c.strokeStyle='#1d1a14';c.lineWidth=4.5;c.stroke();c.restore();}
  if(h.impact){const e=groundEllipse(d,h.x,h.y,h.r*1.25);c.strokeStyle=hex('#fff1bf',.9);c.lineWidth=1.4;c.beginPath();for(let i=0;i<4;i++){const a=i*Math.PI/2+t*1.5;c.moveTo(e.x+Math.cos(a)*e.rx*.5,e.y+Math.sin(a)*e.ry*.5);c.lineTo(e.x+Math.cos(a)*e.rx,e.y+Math.sin(a)*e.ry);}c.stroke();}
 }
}

// 세워서 그리는 공격 연출(캐릭터 앞 층)과 전조 문구
export function drawBossFront(d,m,t){
 const c=d.c,P=phaseOf(m);c.save();
 for(const h of m.hazards||[]){
  const live=h.warn<=0,k=live?1:1-h.warn/h.warnFull;
  if(h.style==='arc'){                                               // 전극 기둥(애자 고리) + 전류선
   for(const [x,y] of h.nodes){const b=d.p(x,y,0),top=d.p(x,y,9);c.strokeStyle='#2a3450';c.lineWidth=3;c.beginPath();c.moveTo(b.x,b.y);c.lineTo(top.x,top.y);c.stroke();
    for(let i=0;i<4;i++){const q=d.p(x,y,2+i*1.8);c.fillStyle='#eef2f6';c.beginPath();c.ellipse(q.x,q.y,7,2.6,0,0,TAU);c.fill();c.strokeStyle='#6a7898';c.lineWidth=.8;c.stroke();}
    softGlow(c,top.x,top.y,16,16,'#3f9bff',.5+.5*k);star(c,top.x,top.y,6+4*k,'#ffffff',.9);}
   for(const [a,b] of h.segs){const pa=d.p(a[0],a[1],live?1.5:1),pb=d.p(b[0],b[1],live?1.5:1);
    if(live)bolt(c,pa.x,pa.y,pb.x,pb.y,h.id+a[0],t,'#3f9bff',3,1);
    else if(rnd(Math.floor(t*14),Math.round(a[0]))<.25+k*.5){c.strokeStyle=hex('#cfe8ff',.4+.4*k);c.lineWidth=1;c.beginPath();c.moveTo(pa.x,pa.y);c.lineTo(pb.x,pb.y);c.stroke();}}
  }else if(h.style==='bolts'&&!live&&k>.55){                           // 모이는 전하
   const q=d.p(h.x,h.y,0);for(let i=0;i<5;i++){const a=i/5*TAU+t*6,r=(1-k)*40+6;star(c,q.x+Math.cos(a)*r,q.y-10+Math.sin(a)*r*.5,3,'#cfe8ff',.9);}
  }else if(h.style==='rush'&&live){                                  // 돌진 마찰 불꽃
   const b=d.p(m.x,m.y,0);for(let i=0;i<10;i++){const a=Math.atan2(-h.dy,-h.dx)+(rnd(Math.floor(t*30),i)-.5)*1.4,r=10+rnd(Math.floor(t*30),i+20)*30;
    const q=d.p(m.x+Math.cos(a)*r/8,m.y+Math.sin(a)*r/8,0);c.strokeStyle=hex(i%2?'#ffb35a':'#ffe0a0',.9);c.lineWidth=1.6;c.beginPath();c.moveTo(q.x,q.y-2);c.lineTo(q.x-(h.dx-h.dy)*8,q.y-(h.dx+h.dy)*4-4);c.stroke();}
   softGlow(c,b.x,b.y-6,40,18,'#ff8a2a',.4);
  }else if(h.style==='quake'&&h.type==='ring'&&live){                   // 퍼지는 충격 고리(톱니 앞머리)
   const e=groundEllipse(d,h.x,h.y,h.front);glowPath(c,()=>{c.beginPath();c.ellipse(e.x,e.y,e.rx,e.ry,0,0,TAU);},'#ff8a2a',4,1,'#ffe0bf');
   for(let i=0;i<24;i++){const a=i/24*TAU;shard(c,e.x+Math.cos(a)*e.rx,e.y+Math.sin(a)*e.ry-4,2.4,a+t*4,'#5a3418','#ffb35a',.9);}
  }else if(h.style==='pile'&&h.impact&&!live){                         // 떠 있는 말뚝(내려칠 준비) — 압력 게이지처럼 차오름
   const top=d.p(h.x,h.y,28-k*10),g=d.p(h.x,h.y,0);c.save();c.globalAlpha=.4+.6*k;c.fillStyle='#3a3228';c.fillRect(top.x-5,top.y-26,10,26);stripesScreen(c,top.x-7,top.y-34,14,10);
   c.fillStyle='#8e8a82';c.beginPath();c.moveTo(top.x-5,top.y);c.lineTo(top.x+5,top.y);c.lineTo(top.x,top.y+10);c.closePath();c.fill();c.restore();
   c.strokeStyle=hex('#fff1bf',.5);c.setLineDash([3,4]);c.beginPath();c.moveTo(top.x,top.y+10);c.lineTo(g.x,g.y);c.stroke();c.setLineDash([]);
  }
 }
 if(m.phase==='telegraph'&&m.pattern){const def=BOSS_PATTERNS[m.pattern];d.label(m.x,m.y,`${def.name} · ${def.hint}`,P.deep,-6);}
 c.restore();
}
function stripesScreen(c,x,y,w,h){c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.fillStyle='#f1b919';c.fillRect(x,y,w,h);c.strokeStyle='#1d1a14';c.lineWidth=3;for(let i=-h;i<w;i+=6){c.beginPath();c.moveTo(x+i,y+h);c.lineTo(x+i+h,y);c.stroke();}c.restore();}

// 타격 순간 연출(판정 없음, 효과 목록 'boss-fx')
export function drawBossFx(d,e,t,layer='front'){
 if(layer==='back'&&e.style!=='collapse')return;
 const c=d.c,u=clamp01(1-e.life/(e.full||.7)),a=1-u,h=e.shape||{},P=BOSS_PHASES[e.stage]||BOSS_PHASES[STAGE_OF[e.style]||1];
 const pal={main:P.main};c.save();
 switch(e.style){
  case 'cut':{const p1=d.p(h.x1,h.y1,1.5),p2=d.p(h.x2,h.y2,1.5),g=span(u,0,.25);
   glowPath(c,()=>{c.beginPath();c.moveTo(p1.x,p1.y);c.lineTo(p1.x+(p2.x-p1.x)*g,p1.y+(p2.y-p1.y)*g);},P.main,7*a,1,'#ffd6d9');
   for(let i=0;i<14;i++){const f=rnd(e.seed,i),x=p1.x+(p2.x-p1.x)*f,y=p1.y+(p2.y-p1.y)*f;crystal(c,x+(rnd(e.seed,i+30)-.5)*30*u,y-u*30*rnd(e.seed,i+40),2.5,6,P.main,'#ffffff',a,f*6);}break;}
  case 'geometry':{const pts=h.pts||circlePts(h.x,h.y,h.r);worldPath(c,d,scalePts(pts,h.cx??h.x,h.cy??h.y,1+u*.4));c.strokeStyle=hex(P.edge,a);c.lineWidth=3;c.stroke();
   const q=d.p(h.cx??h.x,h.cy??h.y,0);burst(c,q.x,q.y-10,90,pal,a,e.seed,12,.6);for(let i=0;i<5;i++){const f=rnd(e.seed,i);c.fillStyle=hex(P.main,.5*a);c.fillRect(q.x-30+f*60,q.y-60-u*40,2.5,60);}break;}
  case 'rush':{const q=d.p(h.x1,h.y1,0);softGlow(c,q.x,q.y,50,22,'#ff8a2a',.6*a);for(let i=0;i<8;i++)shard(c,q.x+(rnd(e.seed,i)-.5)*60*u,q.y-rnd(e.seed,i+9)*40*u,3,i+u*6,'#5a3418','#ffb35a',a);break;}
  case 'quake':{if(h.type==='cone'){const q=d.p(h.x,h.y,0);for(const pts of areaOf(h)){worldPath(c,d,pts);c.fillStyle=hex('#ffb35a',.35*a);c.fill();}
    for(let i=0;i<16;i++){const ang=h.ang+(rnd(e.seed,i)-.5)*h.spread,r=rnd(e.seed,i+5)*h.r,p=d.p(h.x+Math.cos(ang)*r,h.y+Math.sin(ang)*r,0);shard(c,p.x,p.y-Math.sin(u*Math.PI)*30,3,i+u*5,'#5a3418','#ffb35a',a);}
    for(let i=0;i<4;i++){const gx=q.x+(rnd(e.seed,i+50)-.5)*80,gy=q.y-10-u*40;c.save();c.translate(gx,gy);c.rotate(u*6+i);c.strokeStyle=hex('#c98a4a',a);c.lineWidth=3;c.beginPath();c.arc(0,0,6,0,TAU);c.stroke();c.restore();}}
   else{const q=d.p(h.x,h.y,0);softGlow(c,q.x,q.y,60,30,'#ff8a2a',.4*a);}break;}
  case 'bolts':{const g=d.p(h.x,h.y,0),top=g.y-340;
   if(u<.45)bolt(c,g.x+(rnd(e.seed,1)-.5)*60,top,g.x,g.y,e.seed,t,P.main,6*(1-u),1);
   softGlow(c,g.x,g.y,44,22,'#ffffff',a*.8);softGlow(c,g.x,g.y,70,34,P.main,a*.6);
   for(let i=0;i<8;i++){const ang=rnd(e.seed,i)*TAU,r=10+u*40;star(c,g.x+Math.cos(ang)*r,g.y+Math.sin(ang)*r*.5-10*u,3.4,'#cfe8ff',a);}break;}
  case 'arc':break;
  case 'collapse':{const area=areaOf(h);if(layer==='back')for(const pts of area){worldPath(c,d,pts);c.fillStyle=hex('#8a7a55',.35*a);c.fill();}
   const R=h.r1||h.r,n=h.type==='sector'?14:8;
   for(let i=0;i<n;i++){let x,y;if(h.type==='sector'){const arc=h.arcs[i%h.arcs.length],ang=arc[0]+(arc[1]-arc[0])*rnd(e.seed,i),r=h.r0+(h.r1-h.r0)*rnd(e.seed,i+20);x=h.x+Math.cos(ang)*r;y=h.y+Math.sin(ang)*r;}
    else{const ang=rnd(e.seed,i)*TAU,r=rnd(e.seed,i+20)*h.r;x=h.x+Math.cos(ang)*r;y=h.y+Math.sin(ang)*r;}
    if((x+y<e.x+e.y)!==(layer==='back'))continue;                // 보스 뒤쪽 바위는 몸 뒤에, 앞쪽 바위는 몸 앞에
    const rise=Math.sin(Math.min(1,u*2.2)*Math.PI*.5)*(1-span(u,.6,1));prism(d,x,y,1.3+rnd(e.seed,i+40),7*rise*(.6+rnd(e.seed,i+50)),0,['#6e6a60','#8e8a82','#c7c1b4'],a,'#2a2210');}
   if(layer==='front')for(let i=0;i<6;i++){const ang=rnd(e.seed,i+70)*TAU,q=d.p(h.x+Math.cos(ang)*R*.7,h.y+Math.sin(ang)*R*.7,0);softGlow(c,q.x,q.y-10-u*20,40,20,'#cdb892',.5*a);}break;}
  case 'pile':{if(h.impact){const g=d.p(h.x,h.y,0),down=span(u,0,.15),top=d.p(h.x,h.y,18-18*down);
    c.fillStyle='#3a3228';c.fillRect(top.x-6,top.y-40,12,40);stripesScreen(c,top.x-8,top.y-48,16,10);
    burst(c,g.x,g.y-6,110,pal,a,e.seed,14,.55);for(let i=0;i<12;i++){const ang=rnd(e.seed,i)*TAU,r=u*70;shard(c,g.x+Math.cos(ang)*r,g.y+Math.sin(ang)*r*.5-Math.sin(u*Math.PI)*40,4,i+u*6,'#5a4630','#f0c860',a);}}
   else{const p1=d.p(h.x1,h.y1,0),p2=d.p(h.x2,h.y2,0);glowPath(c,()=>{c.beginPath();c.moveTo(p1.x,p1.y);c.lineTo(p2.x,p2.y);},P.main,9*a,1,'#fff1bf');}break;}
 }
 c.restore();
}

// 페이즈 전환: 새 색의 충격 고리 · 이전 형태 파편 · 큰 이름 띠
export function drawBossShift(d,e,t){
 const c=d.c,u=clamp01(1-e.life/(e.full||1.6)),a=1-span(u,.7,1),from=BOSS_PHASES[e.from]||BOSS_PHASES[1],to=BOSS_PHASES[e.to]||BOSS_PHASES[2];
 const g=d.p(e.x,e.y,0),core=d.p(e.x,e.y,14);c.save();
 const ring=groundEllipse(d,e.x,e.y,6+u*40);glowPath(c,()=>{c.beginPath();c.ellipse(ring.x,ring.y,ring.rx,ring.ry,0,0,TAU);},to.main,6*(1-u)+1,a,to.edge);
 if(u<.5)burst(c,core.x,core.y,160*(.4+u),{main:to.main},1-u*2,e.to*31,16,.8);
 for(let i=0;i<16;i++){const ang=rnd(e.to*7,i)*TAU,r=40+Math.sqrt(u)*170;crystal(c,core.x+Math.cos(ang)*r,core.y+Math.sin(ang)*r*.6+u*u*60,4.5,9,from.main,from.edge,a*(1-u*.5),ang+u*8);}   // 이전 형태가 조각나 흩어진다
 softGlow(c,g.x,g.y,90,40,to.main,.35*a);
 // 큰 이름 띠
 const y=core.y-232,text=`${e.to}페이즈 · ${to.dept}`,sub=to.name;c.globalAlpha=a*Math.min(1,u*5);
 c.font='900 22px "Malgun Gothic",sans-serif';c.textAlign='center';const w=c.measureText(text).width+40;
 c.fillStyle=hex(to.deep,.85);c.fillRect(g.x-w/2,y-22,w,40);c.fillStyle=to.main;c.fillRect(g.x-w/2,y-22,w,3);c.fillRect(g.x-w/2,y+15,w,3);
 c.fillStyle='#ffffff';c.fillText(text,g.x,y+4);c.font='700 12px "Malgun Gothic",sans-serif';c.fillStyle=to.edge;c.fillText(`공명체 ${sub}`,g.x,y+34);
 c.restore();
}

// 보스 체력 띠(머리 위): 페이즈 색, 75 · 50 · 25% 눈금.
export function drawBossBar(d,m,z){
 const c=d.c,P=phaseOf(m),h=d.p(m.x,m.y,z),w=72;
 c.fillStyle='#1d2b26d9';c.fillRect(h.x-w/2-1,h.y-1,w+2,7);
 c.fillStyle=P.main;c.fillRect(h.x-w/2,h.y,w*Math.max(0,m.hp/m.maxHp),5);
 c.fillStyle='#fffdf5';for(const f of [.25,.5,.75])c.fillRect(h.x-w/2+w*f-.5,h.y-1,1,7);
}
