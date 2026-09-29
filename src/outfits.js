// ── 옷 장비 10종의 모습(2026-09-27 · CHMR 옷 에셋 시안) ─────────────────
// 각 옷은 outfit-paint.js 가 홍길동 스프라이트의 옷 픽셀을 다시 칠할 때 쓰는 '레시피'다.
// paint(p) 가 영역(몸통 · 소매 · 셔츠 · 테두리 · 바지 · 신발)과 위치(p.t 소매 위치, p.legT 바지 위치, 기준점 p.lm)를 보고 색을 정한다.
// 원래 픽셀의 밝기로 명암을 입히므로 주름 · 그림자는 그대로 남고, 몸 윤곽선은 늘 어둡게 유지된다.
//   보통   생활복 세트(gymShirt)            남색 카라티 + 남색 반바지 · 흰 양말 · 운동화
//   희귀   야구점퍼 세트(workJacket)        야구점퍼(남색 몸판 · 크림 소매 · 왼가슴 C · 오른팔 1979 · 줄무늬 립) + 진남색 슬랙스
//   영웅   학과 작업복 4종(탐방 보상)        건축 수호 작업복 · 자동 기동 작업복 · 아크 실습 자켓 · 지반 현장 작업복
//   레전드 학과 전공 보호복 4종              영웅 작업복을 바탕으로 긴 코트 자락 · 금속 장식 · 빛나는 선을 더한 판타지 업그레이드
// 옷은 이 10종뿐이다(공용 영웅 옷 '현장 조끼'는 2026-09-27 에 게임에서 없앴다).
import {REGION as R} from './outfit-paint.js';

// ── 작은 도트 글자(왼가슴 C · 소매 1979) ─────────────────────────
const DIGITS={'1':['010','110','010','010','111'],'9':['111','101','111','001','111'],'7':['111','001','010','010','010']};
// 글자 한 줄을 (ax,ay) 왼쪽 위에서부터 scale 배로 찍었을 때 (x,y) 가 글자 획 위인지. mirror 면 좌우를 뒤집어 찍는다(왼쪽 방향용).
export function onText(text,ax,ay,scale,x,y,mirror=false){
 const w=text.length*4*scale-scale;
 let lx=Math.floor((x-ax)/scale),ly=Math.floor((y-ay)/scale);
 if(mirror)lx=Math.floor((ax+w-1-x)/scale);
 if(ly<0||ly>=5||lx<0||lx>=text.length*4)return false;
 const ch=DIGITS[text[Math.floor(lx/4)]],col=lx%4;
 return col<3&&!!ch&&ch[ly][col]==='1';
}
// 두꺼운 'C' 한 글자. (cx,cy) 가운데, 반지름 r. 0 = 밖, 1 = 테두리(남색 외곽), 2 = 글자 속(크림).
export function onLetterC(cx,cy,r,x,y,squash=1,mirror=false){
 let dx=(x-cx)/squash,dy=y-cy;if(mirror)dx=-dx;
 const d=Math.hypot(dx,dy),open=dx>r*.18&&Math.abs(dy)<r*.46;
 if(open)return 0;
 if(d<=r&&d>=r*.34)return d>r-2.4||d<r*.34+2.4?1:2;
 return 0;
}

const sleeveBand=(p,a,b)=>p.t>=a&&p.t<b;
const collar=(p,h)=>p.y<p.lm.neckY+h;
// 몸통 · 셔츠 · 테두리가 합쳐진 앞판 영역인지
const front=r=>r===R.TORSO||r===R.SHIRT||r===R.TRIM;
// 재킷 자락이 벨트 아래로 내려온 부분(벨트 아래 몸통 픽셀)
const belowBelt=p=>p.y>=p.lm.pantsTop;
// 각 칸의 몸통 맨 아랫줄에서 h 픽셀 안쪽(밑단 립 · 띠)
const nearHem=(p,h)=>p.lm.colBottom[p.x]>=0&&p.lm.colBottom[p.x]-p.y<h&&p.y>p.lm.neckY+30;
// 정면에서 가슴 가운데 지퍼 · 여밈선
const centerLine=(p,w=1.5)=>p.view==='front'&&Math.abs(p.x-p.lm.cx)<=w;
// 바지 바깥 옆선(좌우 끝에서 w 픽셀)
const legOuter=(p,w=3)=>{const l=p.lm.rowL[p.y],r=p.lm.rowR[p.y];return l>=0&&(p.x-l<w||r-p.x<w);};
// 옆모습에서 가슴 앞쪽 끝
const chestFront=(p,w)=>p.view!=='front'&&p.view!=='back'&&p.lm.chestR>=0&&p.lm.chestR-p.x<w;

// 앞치마 주머니: 허리 아래 가로 박음선과 가운데 칸막이.
function apronPocket(x,y,lm,view){
 if(view!=='front')return null;
 const top=lm.pantsTop+10;
 if(y===top||y===top+1)return '#5c5f65';
 if(y>top&&y<top+18&&Math.abs(x-lm.cx)<1)return '#5c5f65';
 return null;
}
// 앞치마 끈: 정면은 가슴받이 위 모서리에서 목 옆으로, 뒷모습은 등에서 X 자로 엇갈린다.
function apronStrap(p){
 const lm=p.lm,top=lm.neckY+30;
 if(p.view==='front'&&p.y<top&&p.y>lm.neckY+6){
  const u=(top-p.y)/(top-lm.neckY-6);
  for(const s of [-1,1]){const x=lm.cx+s*(15+u*6);if(Math.abs(p.x-x)<2.2)return true;}
 }
 if(p.view==='back'&&p.y>lm.neckY+10&&p.y<lm.pantsTop-4){
  const u=(p.y-lm.neckY-10)/Math.max(1,lm.pantsTop-lm.neckY-14),w=30*(1-2*u);
  if(Math.abs(p.x-(lm.cx+w))<2.4||Math.abs(p.x-(lm.cx-w))<2.4)return true;
 }
 return false;
}
// 긴 코트 자락: 재킷 밑단에서 무릎 아래까지. 정면은 가운데가 트인 두 자락, 뒷모습은 한 장(가운데 트임), 옆모습은 한 장.
function coatShape(length,flare,gap){
 return (lm,view)=>{
  const top=Math.max(lm.pantsTop-6,lm.hem-10),bottom=Math.round(lm.knee+(lm.ankle-lm.knee)*length);
  const rows=[];let lastL=-1,lastR=-1;
  for(let y=top;y<=bottom;y++){
   // 다리 모양이 줄마다 튀지 않게 위아래 8줄 안의 가장 바깥 끝을 쓴다(자락 가장자리가 매끈하다).
   let l=-1,r=-1;
   for(let yy=y-8;yy<=y+8;yy++){const a=lm.rowL[yy],b=lm.rowR[yy];if(a>=0&&(l<0||a<l))l=a;if(b>=0&&b>r)r=b;}
   if(l<0){l=lastL;r=lastR;}if(l<0)continue;
   if(lastL>=0){l=lastL+(l-lastL)*.35;r=lastR+(r-lastR)*.35;}      // 줄 사이를 부드럽게 이어 계단을 없앤다
   lastL=l;lastR=r;
   const u=(y-top)/Math.max(1,bottom-top),f=2+flare*u;
   if(view==='front'){
    const g=gap*(.6+.6*u);
    rows.push([y,l-f,lm.cx-g]);rows.push([y,lm.cx+g,r+f]);
   }else if(view==='back')rows.push([y,l-f,r+f]);
   else rows.push([y,l-f*1.3,r+f*.5]);
  }
  return rows;
 };
}
// 앞치마(건축 수호 작업복): 정면은 가슴받이(좁음) + 허리 아래 넓은 자락(무릎까지, 다리 사이도 덮음),
// 옆모습은 몸 앞쪽 끝을 따라 붙은 좁은 띠, 뒷모습은 없다(등에는 끈만 칠한다).
function apronShape(lm,view,seg){
 const top=lm.neckY+30,waist=lm.pantsTop,bottom=Math.round(lm.knee+6),rows=[];
 for(let y=top;y<=bottom;y++){
  if(view==='front'){
   const w=y<waist?16+6*(y-top)/Math.max(1,waist-top):25+7*(y-waist)/Math.max(1,bottom-waist);
   const round=y>bottom-6?(y-(bottom-6))*1.6:0;                    // 아랫단 모서리를 둥글게
   rows.push([y,lm.cx-w+round,lm.cx+w-round]);
  }
 }
 if(view==='right'||view==='left')return sideApron(lm,top,waist,bottom,seg);
 return view==='back'?null:rows;
}

// 옆모습 앞치마: 몸 앞면(옆모습에서 셔츠가 보이는 가슴 앞 띠)을 가슴받이가 덮고, 허리 아래 자락은
// 그 띠에서 곧게 늘어뜨린다(다리 모양을 따라가지 않아서 걸을 때도 한 장으로 보인다). 띠의 좌우 끝은 위아래 5줄 가운데값으로 매끈하게.
function sideApron(lm,top,waist,bottom,seg){
 const {size,label}=seg,band=[];
 for(let y=top;y<waist;y++){
  let l=-1,r=-1;
  for(let x=0;x<size;x++)if(label[y*size+x]===R.SHIRT){if(l<0)l=x;r=x;}
  band.push(l<0?null:[l,r]);
 }
 const med=(i,j)=>{const v=[];for(let k=i-5;k<=i+5;k++)if(band[k])v.push(band[k][j]);if(!v.length)return -1;v.sort((a,b)=>a-b);return v[v.length>>1];};
 const rows=[];let last=null;
 band.forEach((_,i)=>{
  let l=med(i,0),r=med(i,1);if(l<0)return;
  if(last){l=last[0]+Math.max(-1.5,Math.min(1.5,l-last[0]));r=last[1]+Math.max(-1.5,Math.min(1.5,r-last[1]));}
  last=[l,r];rows.push([top+i,l-3,r+2]);
 });
 if(!last)return rows;
 for(let y=waist;y<=bottom;y++){
  const d=y-waist,round=y>bottom-5?(y-(bottom-5))*1.4:0;
  rows.push([y,last[0]-6-d*.04+round*.5,last[1]+3+d*.06-round]);
 }
 return rows;
}

// ── 10종 ─────────────────────────────────────────────────────
const NAVY='#1f2a4a';
export const OUTFITS={
 // 보통 · 생활복 세트: 남색 카라티(흰 줄 카라 · 소매 끝) + 남색 반바지, 흰 양말, 흰 운동화
 gymShirt:{name:'생활복 세트',contrast:.7,paint(p){
  const r=p.region;
  if(r===R.SLEEVE||r===R.SLEEVE_TRIM){
   if(p.t<.33)return NAVY;
   if(p.t<.37)return {color:'#eef0f2',contrast:.35};                  // 소매 끝 흰 줄
   return {color:'skin',contrast:.55};                                // 반팔 아래 팔
  }
  if(front(r)){
   if(belowBelt(p))return '#1d2744';                                 // 반바지 허리
   if(collar(p,15)&&Math.abs(p.x-p.lm.cx)<28)return p.y>p.lm.neckY+11?{color:'#eef0f2',contrast:.3}:'#243157';  // 카라와 흰 줄
   if(centerLine(p,1.5)&&p.y<p.lm.neckY+40)return '#141c33';          // 앞 단추 여밈
   return NAVY;
  }
  if(r===R.PANTS){
   if(p.legT<.4)return p.legT>.36?'#141b31':'#1d2744';               // 반바지 + 밑단
   if(p.legT>.84)return {color:'#f3f3f3',contrast:.4};               // 흰 양말
   return {color:'skin',contrast:.5};
  }
  if(r===R.SHOES)return {color:'#ececec',contrast:.6};
  return null;
 }},
 // 희귀 · 야구점퍼 세트: 야구점퍼 + 진남색 슬랙스
 workJacket:{name:'야구점퍼 세트',contrast:.78,paint(p){
  const r=p.region,lm=p.lm;
  if(r===R.SLEEVE||r===R.SLEEVE_TRIM){
   if(p.t>.84)return (p.t>.87&&p.t<.895)||(p.t>.92&&p.t<.945)?{color:'#f1ece0',contrast:.3}:'#1b2340'; // 줄무늬 소매 립
   if(p.side==='R'&&p.t>.6&&p.t<.82&&p.armAxis&&onText('1979',p.armAxis.x-7,p.armAxis.y-2,1,p.x,p.y,p.mirrored))
    return {color:'#1b2340',flat:true};                                // 오른팔 1979
   return {color:'#ebe1c8',contrast:.7};                              // 크림 가죽 소매
  }
  if(r===R.SHIRT)return {color:'#f3f3f3',contrast:.6};                // 안에 입은 흰 티
  if(front(r)){
   if(collar(p,11))return p.y>lm.neckY+5&&p.y<lm.neckY+8?'#f1ece0':'#1b2340';  // 줄무늬 카라 립
   if(nearHem(p,9))return (lm.colBottom[p.x]-p.y)%6<2?'#f1ece0':'#1b2340';  // 밑단 줄무늬 립
   if(r===R.TRIM)return {color:'#e9e0c8',contrast:.5};                // 여밈 테두리
   const c=letterC(p);if(c)return c;
   return '#1b2340';
  }
  if(r===R.PANTS)return '#161b2e';
  if(r===R.SHOES)return {color:'#dcdcdc',contrast:.65};
  return null;
 }},
 // 영웅 · 건축 수호 작업복: 붉은 작업복 + 회색 앞치마
 draftMantle:{name:'건축 수호 작업복',contrast:.8,paint(p){
  const r=p.region;
  if(r===R.SLEEVE||r===R.SLEEVE_TRIM){
   if(p.t>.86)return '#2a2a2e';                                        // 검은 소매 끝
   if(sleeveBand(p,.42,.5))return '#6f1419';                           // 팔꿈치 보강
   return '#b3262d';
  }
  if(r===R.SHIRT)return '#3a3a40';
  if(front(r)){
   if(collar(p,9))return '#2a2a2e';
   if(apronStrap(p))return {color:'#8d9096',contrast:.4};             // 앞치마 끈
   if(r===R.TRIM)return '#e04a4f';
   if(belowBelt(p))return '#8f1c22';
   return '#b3262d';
  }
  if(r===R.PANTS){if(p.legT>.44&&p.legT<.58)return '#262629';return '#7c1a1f';}
  if(r===R.SHOES)return '#2b2b2e';
  return null;
 },panels:[{shape:apronShape,color:'#8d9096',edge:'#1c1c1e',trim:'#6f7278',fill:true,detail:apronPocket}]},
 // 영웅 · 자동 기동 작업복: 갈색 몸판 + 갈색 · 검정 소매, 검정 작업 바지
 servoVest:{name:'자동 기동 작업복',contrast:.8,paint(p){
  const r=p.region;
  if(r===R.SLEEVE||r===R.SLEEVE_TRIM){
   if(p.t>.5)return p.t>.86?'#7a4a26':'#262321';                       // 검정 아래팔 · 갈색 소매 끝
   return sleeveBand(p,.1,.16)?'#262321':'#7a4a26';
  }
  if(r===R.SHIRT)return '#2b2622';
  if(front(r)){
   if(collar(p,12))return '#262321';                                   // 검정 어깨 요크
   if(centerLine(p,1.5))return '#c9964a';                              // 황동 지퍼
   if(r===R.TRIM)return '#a8692f';
   if(belowBelt(p))return '#5c371c';
   return '#7a4a26';
  }
  if(r===R.PANTS){if(p.legT>.44&&p.legT<.58)return '#6d4121';return '#2b2926';}
  if(r===R.SHOES)return '#3a2a1e';
  return null;
 }},
 // 영웅 · 아크 실습 자켓: 허리까지 오는 남색 짧은 자켓, 큰 카라, 모자 없음, 푸른 파이핑
 arcJacket:{name:'아크 실습 자켓',contrast:.8,paint(p){
  const r=p.region,lm=p.lm;
  if(r===R.SLEEVE||r===R.SLEEVE_TRIM){
   if(p.t>.84)return p.t>.87&&p.t<.9?{color:'#5fb8ff',flat:true}:'#131c36';
   return '#1c2b52';
  }
  if(r===R.SHIRT)return '#141c33';
  if(front(r)){
   if(belowBelt(p))return '#16181f';                                   // 짧은 자켓 — 벨트 아래는 바지
   if(collar(p,22)&&Math.abs(p.x-lm.cx)<44){                           // 큰 카라
    return p.y>lm.neckY+19?{color:'#5fb8ff',flat:true}:'#24365f';
   }
   if(centerLine(p,1))return {color:'#6fc4ff',flat:true};               // 지퍼선
   if(r===R.TRIM)return {color:'#4aa6f0',contrast:.3};                  // 푸른 파이핑
   return '#1c2b52';
  }
  if(r===R.PANTS)return legOuter(p,3)&&p.legT<.8?{color:'#3d8ee0',contrast:.4}:'#16181f';
  if(r===R.SHOES)return '#1d1f26';
  return null;
 }},
 // 영웅 · 지반 현장 작업복: 노란 작업복 + 검정 요크 · 반사띠, 검정 카고 바지
 strataCoat:{name:'지반 현장 작업복',contrast:.8,paint(p){
  const r=p.region,lm=p.lm;
  if(r===R.SLEEVE||r===R.SLEEVE_TRIM){
   if(sleeveBand(p,.7,.77))return {color:'#d9dde2',contrast:.35};      // 반사띠
   if(p.t>.86)return '#242424';
   return p.t<.14?'#242424':'#e2b21c';
  }
  if(r===R.SHIRT)return '#2a2a2a';
  if(front(r)){
   if(collar(p,14))return '#242424';
   if(p.y>lm.chestY+6&&p.y<lm.chestY+12)return {color:'#d9dde2',contrast:.35};  // 가슴 반사띠
   if(r===R.TRIM)return '#242424';
   if(belowBelt(p))return '#c9990f';
   return '#e2b21c';
  }
  if(r===R.PANTS){
   if(p.legT>.6&&p.legT<.66)return {color:'#d9dde2',contrast:.35};
   if(p.legT>.44&&p.legT<.58)return '#e2b21c';                          // 노란 무릎 보호대
   return '#2a2a2a';
  }
  if(r===R.SHOES)return '#4a3521';
  return null;
 }},
};

// 야구점퍼 왼가슴 C: 정면은 그림 오른쪽 가슴, 오른쪽 옆모습은 가슴 앞쪽(좁게), 왼쪽 옆모습 · 뒷모습에는 없다.
function letterC(p){
 const lm=p.lm;
 if(p.view==='front'){
  const hit=onLetterC(lm.cx+27,lm.neckY+42,15,p.x,p.y);
  return hit===2?{color:'#f1ece0',contrast:.35}:hit===1?'#101624':null;
 }
 if(p.view==='right'&&lm.chestR>0){
  const hit=onLetterC(lm.chestR-14,lm.neckY+40,12,p.x,p.y,.6);
  return hit===2?{color:'#f1ece0',contrast:.35}:hit===1?'#101624':null;
 }
 return null;
}

// ── 레전드 · 학과 전공 보호복: 영웅 작업복을 바탕으로 긴 코트 자락 · 금속 장식 · 빛나는 선을 더한다(현실 50 : 판타지 50) ──
// 공통 뼈대: 몸판 · 소매 · 깃 · 어깨 장식 · 소매 끝 장식 · 가슴 문장 · 바지 · 신발 · 코트 자락 색을 받아 레시피를 만든다.
function legendCoat(o){
 return {name:o.name,contrast:.82,paint(p){
  const r=p.region,lm=p.lm;
  if(r===R.SLEEVE||r===R.SLEEVE_TRIM){
   if(p.t<.13)return {color:o.shoulder,contrast:.55};                // 어깨 장식
   if(sleeveBand(p,.13,.16))return {color:o.metal,contrast:.4};
   if(p.t>.82)return sleeveBand(p,.82,.85)?{color:o.metal,contrast:.4,flat:o.glow}:{color:o.cuff,contrast:.6};
   if(o.forearm&&p.t>.52)return o.forearm;
   if(o.band&&sleeveBand(p,.5,.53))return {color:o.band,flat:o.glow};
   return o.body;
  }
  if(r===R.SHIRT)return centerLine(p,1.5)?{color:o.metal,flat:o.glow}:o.inner;
  if(front(r)){
   if(collar(p,12))return p.y>lm.neckY+9?{color:o.metal,flat:o.glow}:o.collar;   // 높은 깃 + 금속 테
   if(r===R.TRIM)return {color:o.lapel,contrast:.45,flat:o.glow};              // 앞판 테두리 · 라펠
   if(o.emblem&&p.view==='front'){const d=Math.abs(p.x-(lm.cx+26))+Math.abs(p.y-(lm.neckY+36));if(d<7)return {color:o.metal,contrast:.3};}
   if(o.reflect&&p.y>lm.chestY+8&&p.y<lm.chestY+13)return {color:'#d9dde2',contrast:.35};
   return o.body;
  }
  if(r===R.PANTS){
   if(o.stripe&&legOuter(p,3)&&p.legT<.85)return {color:o.stripe,flat:o.glow};
   if(p.legT>.44&&p.legT<.58)return o.knee;
   return o.pants;
  }
  if(r===R.SHOES)return o.shoes;
  return null;
 },panels:[{shape:coatShape(o.length??.55,o.flare??10,o.gap??9),color:o.skirt??o.body,edge:'#141414',trim:o.skirtTrim??o.metal,fill:true,trimInset:true}]};
}
Object.assign(OUTFITS,{
 'architecture-armor':legendCoat({name:'건축 전공 보호복',body:'#a3202a',shoulder:'#d6d8de',metal:'#d9a441',cuff:'#d6d8de',collar:'#1f1f24',
  lapel:'#e8e8ec',inner:'#26262c',pants:'#2a1719',knee:'#a3202a',shoes:'#1c1c1f',emblem:true,skirtTrim:'#e3e4e8'}),
 'machine-armor':legendCoat({name:'자동 전공 보호복',body:'#6d4124',shoulder:'#b98a45',metal:'#d0a052',cuff:'#26221e',collar:'#26221e',
  lapel:'#c89a4a',inner:'#211d1a',forearm:'#2a2520',pants:'#221f1c',knee:'#6d4124',shoes:'#3a291c',emblem:true}),
 'electric-armor':legendCoat({name:'전기 전공 보호복',body:'#172650',shoulder:'#2a3d72',metal:'#5ad8ff',cuff:'#101a38',collar:'#101a38',
  lapel:'#48c8ff',inner:'#0f1630',band:'#5ad8ff',pants:'#12151d',knee:'#1d2d57',shoes:'#141821',stripe:'#3fb6f2',glow:true,emblem:true}),
 'civil-armor':legendCoat({name:'토목 전공 보호복',body:'#dca519',shoulder:'#2a2a2a',metal:'#f0cf5a',cuff:'#232323',collar:'#232323',
  lapel:'#232323',inner:'#262626',pants:'#252525',knee:'#dca519',shoes:'#4a3521',reflect:true,skirtTrim:'#262626',emblem:true}),
});
