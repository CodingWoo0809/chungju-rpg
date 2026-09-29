import {ITEMS} from './inventory.js';
import {CONFIG} from './config.js';
import {drawWeaponIcon} from './weapon-art.js';

// 바닥에 떨어진 아이템을 종류별로 다르게 그린다.
// 모든 그림은 (0,0) = 아이템이 놓인 바닥 지점, y 음수 = 위쪽인 화면 좌표계에서 그린다.
// 크기는 zoom 기준으로 맞춰 두어 멀리서도 형태가 구분된다.

const RARITY={
 '보통':{edge:'#8b9a90',glow:null},
 '희귀':{edge:'#4f86b8',glow:'#8fc6f0'},
 '영웅':{edge:'#a2618f',glow:'#d8aee4'},
 '레전드':{edge:'#c07a1e',glow:'#f0cd86'}
};
export function lootRarity(itemId){return RARITY[ITEMS[itemId]?.rarity]||RARITY['보통'];}
// 희귀 이상만 바닥 고리와 느린 반짝임을 받는다.
export function lootPrecious(itemId){return !!lootRarity(itemId).glow;}

const fill=(c,path,color,stroke=null,w=.7)=>{c.fillStyle=color;c.beginPath();path(c);c.closePath();c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}};
const box=(c,x,y,w,h,color,stroke=null,lw=.7)=>{c.fillStyle=color;c.fillRect(x,y,w,h);if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.strokeRect(x,y,w,h);}};

// ── 무기: 무기 그림(weapon-art.js)을 작게 눕혀 놓는다 ─────────────────
// 10종 모두 손에 든 모습과 같은 그림을 쓴다(보통 복싱 글러브는 한 켤레 이미지).
const WEAPON_IDS=['boxingGlove','badmintonRacket','architecture-hero-weapon','machine-hero-weapon','electric-hero-weapon','civil-hero-weapon',
 'architecture-weapon','machine-weapon','electric-weapon','civil-weapon'];
const WEAPON_SHAPES=Object.fromEntries(WEAPON_IDS.map(id=>[id,(c,t=0)=>drawWeaponIcon(c,id,t,15)]));
// ── 방어구: 개어 놓은 상의 형태 ────────────────────────────
function armour(c,color){
 fill(c,p=>{p.moveTo(-4.6,-5.4);p.lineTo(-1.8,-6.4);p.lineTo(1.8,-6.4);p.lineTo(4.6,-5.4);p.lineTo(5.4,-1.4);
  p.lineTo(3.2,-.6);p.lineTo(3.4,4.4);p.lineTo(-3.4,4.4);p.lineTo(-3.2,-.6);p.lineTo(-5.4,-1.4);},color,'#f0dca2',.6);
 c.strokeStyle='#ffffff5e';c.lineWidth=.6;c.beginPath();c.moveTo(0,-6.2);c.lineTo(0,4.2);c.stroke();
 fill(c,p=>{p.moveTo(-1.8,-6.4);p.lineTo(0,-3.6);p.lineTo(1.8,-6.4);},'#f3ecd8');   // 깃
}
// ── 충공 코인 (2026-09-27) · 강화에 쓰는 은빛 코인 ───────────────
// 상점 포인트(금색 '점' 동전)와 헷갈리지 않게 은청색 몸통에 남색 테두리, 가운데에 '충' 자를 새긴다.
function chungCoin(c,t){
 const tilt=.55+Math.sin(t*1.8+1.3)*.12;
 c.fillStyle='#5f7488';c.beginPath();c.ellipse(0,-1.2,4.4,4.4*tilt,0,0,Math.PI*2);c.fill();          // 옆면
 c.fillStyle='#d9e3ea';c.beginPath();c.ellipse(0,-2,4.4,4.4*tilt,0,0,Math.PI*2);c.fill();
 c.strokeStyle='#2f4a66';c.lineWidth=.6;c.stroke();
 c.strokeStyle='#8aa3b8';c.lineWidth=.4;c.beginPath();c.ellipse(0,-2,3.3,3.3*tilt,0,0,Math.PI*2);c.stroke();
 c.fillStyle='#2f4a66';c.font='bold 3.3px "Malgun Gothic",sans-serif';c.textAlign='center';c.textBaseline='middle';
 c.fillText('충',0,-2);
 c.fillStyle='#ffffffb0';c.beginPath();c.ellipse(-1.9,-3.1,.9,.45*tilt+.1,-.5,0,Math.PI*2);c.fill();   // 반짝임
}
// ── 소모품 ──────────────────────────────────────────────
function snackBag(c){                                               // 든든한 간식 · 봉지 과자
 fill(c,p=>{p.moveTo(-3.6,-5.6);p.lineTo(3.6,-5.6);p.lineTo(4.4,4.2);p.lineTo(-4.4,4.2);},'#d9713f','#a9502a',.7);
 c.fillStyle='#f3e2bd';c.fillRect(-3.4,-2.4,6.8,3);
 c.fillStyle='#b8492a';c.beginPath();c.arc(0,-.9,1.1,0,Math.PI*2);c.fill();
 c.fillStyle='#e8a05f';c.beginPath();c.moveTo(-3.6,-5.6);c.lineTo(-4.8,-7);c.lineTo(4.8,-7);c.lineTo(3.6,-5.6);c.closePath();c.fill();
 c.strokeStyle='#ffffff55';c.lineWidth=.6;c.beginPath();c.moveTo(-2.4,-4.6);c.lineTo(-2.4,3.4);c.stroke();
}
function milkCarton(c){                                             // 급식 우유 · 지붕형 우유갑
 fill(c,p=>{p.moveTo(-3.2,-3.6);p.lineTo(3.2,-3.6);p.lineTo(3.2,4.2);p.lineTo(-3.2,4.2);},'#f4f2e8','#bcc2b8',.7);
 fill(c,p=>{p.moveTo(-3.2,-3.6);p.lineTo(0,-7.2);p.lineTo(3.2,-3.6);},'#e6e6dc','#bcc2b8',.6);
 c.strokeStyle='#9aa3a8';c.lineWidth=.6;c.beginPath();c.moveTo(0,-7.2);c.lineTo(0,-3.6);c.stroke();
 box(c,-2.4,-1.6,4.8,3.4,'#7fb3d5','#4f88ae',.5);
 c.fillStyle='#f7fbff';c.beginPath();c.ellipse(0,.2,1.5,1.1,0,0,Math.PI*2);c.fill();
}

// ── 3칸 장비의 기본 형태 ────────────────────────────────
function helmetShape(c){                                            // 투구 · 챙이 달린 안전모
 fill(c,p=>{p.moveTo(-5.4,1.2);p.lineTo(5.4,1.2);p.lineTo(4.4,2.4);p.lineTo(-4.4,2.4);},'#d8bb56','#9f8a34',.6);   // 챙
 fill(c,p=>{p.moveTo(-4.2,1.4);p.bezierCurveTo(-4.2,-5.4,4.2,-5.4,4.2,1.4);},'#e8cb63','#9f8a34',.7);              // 돔
 c.strokeStyle='#a68f36';c.lineWidth=.6;
 c.beginPath();c.moveTo(0,-4.4);c.lineTo(0,1.2);c.stroke();
 c.beginPath();c.moveTo(-3.4,-1.2);c.lineTo(3.4,-1.2);c.stroke();
 c.fillStyle='#fff6d4';c.beginPath();c.ellipse(-1.6,-2.6,1,.7,-.4,0,Math.PI*2);c.fill();
}
// ── 투구 10종(2026-09-27): 입었을 때(helmets.js)와 같은 색 · 형태의 작은 그림 ──────────────
// 안전모 계열: 돔 + 챙(full) 또는 앞 챙(peak). 헤드기어: 얼굴 구멍이 뚫린 둥근 머리. 두건 · 머리띠: 천 + 매듭 꼬리.
function hardHat(c,{shell,edge,brim=null,peak=null,stripe=null,dot=null}){
 if(brim)fill(c,p=>{p.moveTo(-5.6,1.2);p.lineTo(5.6,1.2);p.lineTo(4.6,2.5);p.lineTo(-4.6,2.5);},brim,edge,.6);
 fill(c,p=>{p.moveTo(-4.2,1.4);p.bezierCurveTo(-4.2,-5.4,4.2,-5.4,4.2,1.4);},shell,edge,.7);
 if(peak)fill(c,p=>{p.moveTo(-3.2,1.2);p.lineTo(3.2,1.2);p.lineTo(2.6,2.6);p.lineTo(-2.6,2.6);},peak,edge,.6);
 if(stripe){c.fillStyle=stripe;c.fillRect(-.7,-4.1,1.4,5.4);}
 if(dot){c.fillStyle=dot;c.beginPath();c.arc(0,-1.2,1,0,Math.PI*2);c.fill();}
 c.fillStyle='#ffffff88';c.beginPath();c.ellipse(-1.8,-2.6,1,.7,-.4,0,Math.PI*2);c.fill();
}
function headgearIcon(c){
 fill(c,p=>{p.moveTo(-4.4,3.2);p.lineTo(-4.4,-1);p.bezierCurveTo(-4.4,-6.4,4.4,-6.4,4.4,-1);p.lineTo(4.4,3.2);p.lineTo(2.6,3.2);p.lineTo(2.6,-.6);p.lineTo(-2.6,-.6);p.lineTo(-2.6,3.2);},'#34488c','#0e1428',.7);
 box(c,-3.6,-2.2,7.2,1.6,'#2a3b75');box(c,-1,-1.9,2,.8,'#eef1f8');
}
function clothIcon(c,{cloth,edge,band=false,mark='#ffffff'}){
 if(band){
  fill(c,p=>{p.moveTo(-5,-1.4);p.lineTo(5,-1.4);p.lineTo(5,1.2);p.lineTo(-5,1.2);},cloth,edge,.6);
 }else fill(c,p=>{p.moveTo(-4.8,1.2);p.bezierCurveTo(-4.8,-5.4,4.8,-5.4,4.8,1.2);},cloth,edge,.7);
 fill(c,p=>{p.moveTo(4,0);p.lineTo(7,3.2);p.lineTo(5.4,3.6);p.lineTo(3.4,.8);},cloth,edge,.5);        // 꼬리
 fill(c,p=>{p.moveTo(4,0);p.lineTo(5.6,4.4);p.lineTo(4.2,4.6);p.lineTo(3.2,.8);},cloth,edge,.5);
 c.fillStyle=mark;c.beginPath();c.arc(0,band?-.1:-1.8,.9,0,Math.PI*2);c.fill();
}
const HELMET_ICONS={
 capHat:headgearIcon,
 safetyHelmet:c=>hardHat(c,{shell:'#eef1f4',brim:'#e2e6ec',edge:'#6b7584',stripe:'#d3d9e1',dot:'#2f63b8'}),
 'architecture-hero-helmet':c=>{hardHat(c,{shell:'#c3262f',edge:'#3a0c10'});fill(c,p=>{p.moveTo(-3.4,1.2);p.lineTo(3.4,1.2);p.lineTo(2.6,4.6);p.lineTo(-2.6,4.6);},'#c8ecfa99','#9fdcf2',.5);},
 'machine-hero-helmet':c=>{hardHat(c,{shell:'#86532c',peak:'#6f4322',edge:'#2a170b'});for(const x of [-1.6,1.6]){c.fillStyle='#d9a441';c.beginPath();c.arc(x,-.6,1.1,0,Math.PI*2);c.fill();c.fillStyle='#28323a';c.beginPath();c.arc(x,-.6,.6,0,Math.PI*2);c.fill();}},
 'electric-hero-helmet':c=>hardHat(c,{shell:'#f1f4f8',peak:'#2c62c9',edge:'#1c2a4a',stripe:'#2c62c9'}),
 'civil-hero-helmet':c=>{hardHat(c,{shell:'#e5b21a',brim:'#d8a414',edge:'#3a2a05'});box(c,-1.2,-2,2.4,1.8,'#4e535a');c.fillStyle='#fff6c8';c.beginPath();c.arc(0,-1.1,.6,0,Math.PI*2);c.fill();},
 'architecture-helmet':c=>clothIcon(c,{cloth:'#c42a2f',edge:'#3f0b0e'}),
 'machine-helmet':c=>clothIcon(c,{cloth:'#7b4a26',edge:'#241208',band:true,mark:'#e8d3a6'}),
 'electric-helmet':c=>clothIcon(c,{cloth:'#2458c8',edge:'#0c1a45',band:true}),
 'civil-helmet':c=>clothIcon(c,{cloth:'#e3b02a',edge:'#3d2c06',mark:'#fff6da'}),
};
function heavyBlade(c){                                             // 상위 등급 무기 · 두꺼운 양날
 c.rotate(-.34);
 box(c,-6.2,-1.3,4.6,2.6,'#4d5f68','#33454e');
 fill(c,p=>{p.moveTo(-1.8,-2.6);p.lineTo(5.4,-2);p.lineTo(9.4,0);p.lineTo(5.4,2);p.lineTo(-1.8,2.6);},'#e6f3f7','#7fa8b6',.7);
 c.strokeStyle='#8fbfd0';c.lineWidth=.5;c.beginPath();c.moveTo(-1.2,0);c.lineTo(8.6,0);c.stroke();
 c.fillStyle='#ffd98a';c.beginPath();c.arc(-2.2,0,1.2,0,Math.PI*2);c.fill();
}
function pointCoin(c,t){                                            // 상점 포인트 · 교표가 찍힌 동전
 const tilt=.55+Math.sin(t*1.8)*.12;
 c.fillStyle='#b98a2e';c.beginPath();c.ellipse(0,-1.2,4.4,4.4*tilt,0,0,Math.PI*2);c.fill();
 c.fillStyle='#e8c15c';c.beginPath();c.ellipse(0,-2,4.4,4.4*tilt,0,0,Math.PI*2);c.fill();
 c.strokeStyle='#8f6a1e';c.lineWidth=.5;c.stroke();
 c.fillStyle='#fff0bd';c.beginPath();c.ellipse(0,-2,2.7,2.7*tilt,0,0,Math.PI*2);c.fill();
 c.fillStyle='#8f6a1e';c.font='3.4px "Malgun Gothic",sans-serif';c.textAlign='center';c.textBaseline='middle';
 c.fillText('점',0,-2);
}

const SHAPES={
 ...WEAPON_SHAPES,
 // 옷 색은 실제로 입었을 때(outfits.js)의 몸판 색과 같다(2026-09-27).
 gymShirt:c=>armour(c,'#26345c'),workJacket:c=>armour(c,'#1f2a4a'),
 draftMantle:c=>armour(c,'#b3262d'),servoVest:c=>armour(c,'#7a4a26'),
 arcJacket:c=>armour(c,'#1c2b52'),strataCoat:c=>armour(c,'#e2b21c'),
 'architecture-armor':c=>armour(c,'#a3202a'),'machine-armor':c=>armour(c,'#6d4124'),
 'electric-armor':c=>armour(c,'#172650'),'civil-armor':c=>armour(c,'#dca519'),
 ...HELMET_ICONS,
 chungCoin:chungCoin,
 snack:snackBag,lunchMilk:milkCarton,shopPoint:pointCoin
};
// 등급 사다리로 만들어진 장비는 칸별 기본 형태를 쓴다(등급은 바닥 고리로 구분).
const BY_SLOT={weapon:heavyBlade,helmet:helmetShape};
// 이름을 모르는 아이템도 큐브가 아니라 종류에 맞는 기본 형태로 떨어진다.
function fallback(itemId){
 const item=ITEMS[itemId];
 if(item?.type==='gear'){
  if(item.slot==='armor')return c=>armour(c,item.color||'#8d9aa4');
  return BY_SLOT[item.slot]||heavyBlade;
 }
 if(item?.type==='consumable')return snackBag;
 return chungCoin;
}
export function lootShape(itemId){return SHAPES[itemId]||fallback(itemId);}

// 드랍 연출: 몬스터 자리에서 살짝 튀어올라 제자리에 떨어진다.
export function lootPose(o){
 const full=o.popFull||.55,left=Math.max(0,o.pop||0),u=full?1-left/full:1;
 const ease=Math.min(1,u);
 return {
  x:(o.fromX??o.x)+(o.x-(o.fromX??o.x))*ease,
  y:(o.fromY??o.y)+(o.y-(o.fromY??o.y))*ease,
  // 몬스터 몸 높이에서 튀어나와 한 번 떠올랐다가 바닥에 내려앉는다.
  z:left>0?(o.lift??3.2)*(1-ease)+(o.arc||6.6)*4*ease*(1-ease):0,   // 보스 보상은 더 높이서 더 크게 튄다(arc · lift, Revision 78)
  spin:left>0?(1-ease)*2.6:0,
  settled:left<=0
 };
}

export function drawDrop(d,o,t){
 const c=d.c,pose=lootPose(o),r=lootRarity(o.itemId),precious=!!r.glow;
 const scale=CONFIG.zoom/7.2;
 d.ellipse(pose.x,pose.y,2.1,1.25,`rgba(32,43,39,${pose.z>0?.13:.24})`);          // 접지 그림자
 if(precious&&pose.settled){                                                      // 희귀 이상만 조용한 바닥 고리
  const pulse=.45+Math.sin(t*2.1+o.x)*.22;
  d.ellipse(pose.x,pose.y,3.9,2.3,null,.05,`rgba(${r.glow==='#8fc6f0'?'143,198,240':r.glow==='#d8aee4'?'216,174,228':'240,205,134'},${pulse})`);
 }
 const bob=pose.settled?Math.sin(t*1.9+o.x*.4)*.5:0;
 const p=d.p(pose.x,pose.y,pose.z+bob+.2);
 c.save();c.translate(p.x,p.y);c.scale(scale*1.62,scale*1.62);   // 멀리서도 형태가 읽히도록 넉넉하게
 if(pose.spin)c.rotate(pose.spin);
 c.lineJoin='round';
 lootShape(o.itemId)(c,t);
 c.restore();
 if((o.quantity||1)>1){                                                           // 수량 표기
  const q=d.p(pose.x,pose.y,pose.z+bob+.2);
  c.save();c.font='600 11px "Malgun Gothic", sans-serif';c.textAlign='center';c.textBaseline='middle';
  c.lineWidth=3;c.strokeStyle='#263c36';c.strokeText('×'+o.quantity,q.x+11,q.y+6);
  c.fillStyle='#fdf6de';c.fillText('×'+o.quantity,q.x+11,q.y+6);c.restore();
 }
}
