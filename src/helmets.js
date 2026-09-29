// ── 투구 10종의 모습(2026-09-27 · CHMR 헬멧 · 머리 장비 컨셉 시안) ───────────────────
// helmet-paint.js 가 홍길동 머리 픽셀을 다시 칠할 때 쓰는 '레시피'. kind 가 모양을 정한다.
//   hardhat  공 모양 껍데기 + 둘레 챙(안전모)         shell   껍데기 + 앞 챙만(작업 헬멧)
//   headgear 얼굴 구멍이 뚫린 헤드기어                 band    이마를 두르는 머리띠 + 뒤 매듭 · 꼬리
//   bandana  머리 윗부분을 덮는 두건 + 뒤 매듭 · 꼬리
// colors: 부위별 색(shell · brim · band · pad · cloth · hem · knot · tail · line(외곽선)).
// deco(part,x,y,f): 줄무늬 · 로고 같은 무늬 → '#hex' | {color, flat} | {tint, amount} | null.
// extra(x,y,f,part): 투구 위에 겹치는 부품(보안면 · 고글 · 램프) → {color, alpha?} | null. extraOutside 면 투구 밖에도 그린다.
//   f.g = {cx, cy, R(머리 반지름), T(머리 꼭대기), N(목), faceY(눈 높이), view('front'·'back'·'right')}
//   보통   복싱 헤드기어(capHat)         남색 헤드기어, 얼굴은 열려 있고 이마 · 옆머리 · 볼을 감싼다
//   희귀   흰색 안전모(safetyHelmet)     흰 안전모 + 가운데 능선 · 파란 교표
//   영웅   학과 헬멧 4종                  건축 붉은 보안면 헬멧 · 기계 갈색 작업 헬멧(고글) · 전기 흰+파랑 절연 헬멧 · 토목 노란 측량 헬멧(램프)
//   레전드 학과 두건 · 머리띠 4종         건축 붉은 두건 · 기계 갈색 머리띠 · 전기 파란 머리띠 · 토목 노란 두건
import {bandTop,bandanaRim} from './helmet-paint.js';
const sq=v=>v*v;
const inEllipse=(x,y,ex,ey,rx,ry)=>sq((x-ex)/rx)+sq((y-ey)/ry)<=1;
const front=f=>f.g.view==='front',back=f=>f.g.view==='back',side=f=>f.g.view==='right';
// 앞면 무늬 자리: 정면은 이마 가운데, 옆모습은 앞쪽(오른쪽).
function emblemCenter(f,y){
 const g=f.g,R=f.R;
 if(front(f))return {x:g.cx,y};
 if(side(f))return {x:g.cx+.62*R,y:y+.02*R};
 return null;
}
// 머리띠 앞 무늬 자리(띠 두께의 가운데).
function bandEmblem(f){
 const g=f.g,R=f.R;
 if(front(f))return {x:g.cx,y:bandTop(f,g.cx)+f.bandTh*.5};
 if(side(f)){const x=g.cx+.62*R;return {x,y:bandTop(f,x)+f.bandTh*.5};}
 return null;
}
function bandanaEmblem(f){
 const g=f.g,R=f.R;
 if(front(f))return {x:g.cx,y:bandanaRim(f,g.cx)-.34*R};
 if(side(f)){const x=g.cx+.55*R;return {x,y:bandanaRim(f,x)-.32*R};}
 return null;
}
// 작은 무늬들(머리 반지름 R 기준 크기)
function bolt(x,y,c,s){                    // 번개
 const u=(x-c.x)/s,v=(y-c.y)/s;
 if(v<-1||v>1)return false;
 const mid=v<0?-.1+(-v)*.5:.1-v*.5;
 return Math.abs(u-mid*(v<0?1:1))<.28&&!(v>-.12&&v<.12&&u<-.3);
}
function gear(x,y,c,s){                    // 톱니
 const d=Math.hypot(x-c.x,y-c.y)/s,a=Math.atan2(y-c.y,x-c.x);
 const r=.72+.2*(Math.cos(a*8)>0?1:0);
 return d<=r&&d>=.3;
}
function triangle(x,y,c,s,hollow=true){    // 삼각자(건축) · 측량 표지(토목)
 const u=(x-c.x)/s,v=(y-c.y)/s;
 const inside=v<=.7&&v>=-.8&&Math.abs(u)<=(v+.8)*.62;
 if(!hollow)return inside;
 const inner=v<=.42&&v>=-.36&&Math.abs(u)<=(v+.36)*.62;
 return inside&&!inner;
}
function ring(x,y,c,r0,r1){const d=Math.hypot(x-c.x,y-c.y);return d>=r0&&d<=r1;}

export const HELMETS={
 // 보통 · 복싱 헤드기어
 capHat:{name:'복싱 헤드기어',kind:'headgear',matte:true,
  colors:{shell:'#34488c',band:'#2a3b75',pad:'#3a5096',trim:'#22305e',line:'#0e1428'},
  deco(part,x,y,f){
   const g=f.g,R=f.R;
   if(part==='band'&&front(f)&&Math.abs(x-g.cx)<.2*R&&Math.abs(y-(f.brow-.22*R))<.06*R)return {color:'#eef1f8',flat:true};  // 이마 로고
   if(part==='band'&&side(f)&&Math.abs(x-(g.cx+.3*R))<.14*R&&Math.abs(y-(f.brow-.24*R))<.05*R)return {color:'#eef1f8',flat:true};
   if(part==='shell'&&!side(f)&&Math.abs(x-g.cx)<.025*R&&y<f.brow-.4*R)return '#22305e';                  // 정수리 이음선
   if(part==='shell'&&side(f)){const d=Math.hypot(x-f.sx,y-f.sy);if(Math.abs(d-.72*R)<.025*R&&y<f.brow-.35*R)return '#22305e';}
   if(part==='shell'&&back(f)&&y>f.brow-.1*R){                                                            // 뒤 끈
    if(Math.abs(x-g.cx)<.05*R)return '#16204a';
    if(Math.abs(x-g.cx)<.17*R&&Math.round((y-g.cy)/(.12*R))%2===0)return {color:'#dfe5f0',flat:true};
   }
   if(part==='pad'&&side(f)&&Math.hypot(x-(g.cx-.5*R),y-(g.faceY+.24*R))<.13*R)return '#22305e';
   if(part==='pad'&&front(f)&&Math.abs(Math.abs(x-g.cx)-.84*R)<.025*R)return '#2a3b75';
   return null;
  }},
 // 희귀 · 흰색 안전모
 safetyHelmet:{name:'흰색 안전모',kind:'hardhat',
  colors:{shell:'#eef1f4',brim:'#e6e9ee',line:'#3a4150'},
  deco(part,x,y,f){
   const g=f.g,R=f.R;
   if(part==='shell'&&!side(f)&&Math.abs(x-g.cx)<.1*R&&y<f.rimC)return {color:'#d6dbe3'};              // 가운데 능선
   if(part==='shell'&&side(f)){const d=Math.hypot(x-f.sx,y-f.sy);if(d>f.sr-.2*R&&y<f.sy-.1*R&&d<f.sr-.08*R)return {color:'#d6dbe3'};}
   const e=emblemCenter(f,f.rimC-.22*R);
   if(part==='shell'&&e&&ring(x,y,e,0,.15*R))return ring(x,y,e,.08*R,.15*R)?{color:'#2f63b8',flat:true}:{color:'#ffffff',flat:true};
   return null;
  }},
 // 영웅 · 건축디자인과 · 보안면 헬멧: 붉은 껍데기(귀까지) + 투명 보안면, 얼굴이 잘 보인다
 'architecture-hero-helmet':{name:'보안면 헬멧',kind:'shell',earDrop:.34,rimLift:.3,peak:false,extraOutside:true,
  colors:{shell:'#c3262f',line:'#3a0c10'},
  deco(part,x,y,f){
   const g=f.g,R=f.R;
   if(part!=='shell')return null;
   // 윗면 통풍 홈 3줄
   if(!side(f)){for(const o of [-.32,0,.32])if(Math.abs(x-(g.cx+o*R))<.045*R&&y<f.sy-.55*R&&y>f.sy-.95*R)return '#6d1218';}
   else if(y<f.sy-.5*R&&y>f.sy-.95*R){for(const o of [-.35,0,.35])if(Math.abs(x-(g.cx+o*R))<.04*R)return '#6d1218';}
   // 흰 줄(설계선)
   const rim=f.rimC+.1*R;
   if(Math.abs(y-(rim-.16*R))<.035*R)return '#f2e9e6';
   return null;
  },
  extra(x,y,f,part){
   const g=f.g,R=f.R;
   if(back(f))return null;
   const top=f.rimC+.1*R-.02*R,bottom=Math.min(g.N-4,g.faceY+.95*R);
   let inShield=false,edge=false;
   if(front(f)){
    const rx=.98*R,ry=bottom-top;
    inShield=y>=top&&inEllipse(x,y,g.cx,top,rx,ry);
    edge=inShield&&!inEllipse(x,y,g.cx,top,rx-.07*R,ry-.07*R);
   }else{
    // 옆모습은 3/4 각도라 얼굴이 앞쪽으로 치우쳐 보인다 — 보안면도 앞쪽으로 옮기고 앞 가장자리를 더 둥글게.
    const ex=g.cx+.28*R,rx=.82*R,ry=bottom-top;
    inShield=y>=top&&inEllipse(x,y,ex,top,rx,ry);
    edge=inShield&&(!inEllipse(x,y,ex,top,rx-.07*R,ry-.07*R));
   }
   if(!inShield)return null;
   if(edge)return {color:'#9fdcf2'};
   const u=(x-g.cx)/R,v=(y-top)/R;
   if(u<-.42&&(Math.abs(u+v*.9-(-.62))<.05||Math.abs(u+v*.9-(-.8))<.03))return {color:'#ffffff',alpha:.45};   // 반사광(눈을 피해 가장자리에만)
   return {color:'#c8ecfa',alpha:.16};
  }},
 // 영웅 · 자동화기계과 · 작업용 헬멧: 갈색 껍데기 + 앞 챙 + 이마에 올린 고글 · 리벳
 'machine-hero-helmet':{name:'작업용 헬멧',kind:'shell',peak:true,rimLift:.24,extraOutside:false,
  colors:{shell:'#86532c',brim:'#6f4322',line:'#2a170b'},
  deco(part,x,y,f){
   const g=f.g,R=f.R;
   if(part==='shell'){
    // 고글 끈: 테 위 가로띠
    const sy=f.rimC-.02*R;
    if(y>sy-.2*R&&y<sy-.02*R)return '#3a2a1f';
    // 리벳
    for(const o of [-.75,-.4,.4,.75])if(!side(f)&&Math.hypot(x-(g.cx+o*R),y-(sy+.1*R))<.05*R)return {color:'#d6a652',flat:true};
    if(!side(f)&&Math.abs(x-g.cx)<.08*R&&y<sy-.2*R)return '#9a6536';
   }
   return null;
  },
  extra(x,y,f,part){
   const g=f.g,R=f.R;if(!part||back(f))return null;
   const cy=f.rimC-.11*R;
   const lenses=front(f)?[[g.cx-.36*R,.2*R],[g.cx+.36*R,.2*R]]:[[g.cx+.72*R,.17*R]];
   for(const [lx,r] of lenses){
    const rx=side(f)?r*.62:r;
    if(inEllipse(x,y,lx,cy,rx,r)){
     if(!inEllipse(x,y,lx,cy,rx-.06*R,r-.06*R))return {color:'#d9a441'};            // 황동 테
     if(inEllipse(x,y,lx-.05*R,cy-.05*R,rx*.35,r*.35))return {color:'#bfe3ef'};    // 반사
     return {color:'#28323a'};
    }
   }
   return null;
  }},
 // 영웅 · 전기전자과 · 절연 안전 헬멧: 흰 껍데기 + 파란 줄 · 파란 앞 챙 · 번개 표시
 'electric-hero-helmet':{name:'절연 안전 헬멧',kind:'shell',peak:true,rimLift:.24,
  colors:{shell:'#f1f4f8',brim:'#2c62c9',line:'#1c2a4a'},
  deco(part,x,y,f){
   const g=f.g,R=f.R;
   if(part!=='shell')return null;
   if(!side(f)&&Math.abs(x-g.cx)<.16*R)return {color:'#2c62c9'};
   if(side(f)){const d=Math.hypot(x-f.sx,y-f.sy);if(d>f.sr-.28*R&&y<f.sy+.1*R&&x<g.cx+.7*R)return {color:'#2c62c9'};}
   if(Math.abs(y-(f.rimC+.02*R))<.06*R)return {color:'#2c62c9'};
   const c=front(f)?null:side(f)?{x:g.cx+.3*R,y:f.rimC-.35*R}:null;
   if(c&&bolt(x,y,c,.2*R))return {color:'#ffd23a',flat:true};
   if(front(f)){for(const s of [-1,1]){const cc={x:g.cx+s*.55*R,y:f.rimC-.32*R};if(bolt(x,y,cc,.16*R))return {color:'#2c62c9',flat:true};}}
   return null;
  }},
 // 영웅 · 토목시스템과 · 측량용 헬멧: 노란 안전모 + 헤드램프 · 반사띠
 'civil-hero-helmet':{name:'측량용 헬멧',kind:'hardhat',brim:1.36,rimLift:.2,
  colors:{shell:'#e5b21a',brim:'#d8a414',line:'#3a2a05'},
  deco(part,x,y,f){
   const g=f.g,R=f.R;
   if(part!=='shell')return null;
   if(Math.abs(y-(f.rimC-.02*R))<.07*R)return {color:'#c9ccd2'};                     // 반사띠
   if(!side(f)&&Math.abs(x-g.cx)<.1*R&&y<f.rimC-.1*R)return {color:'#f3c93a'};        // 능선
   return null;
  },
  extra(x,y,f,part){
   const g=f.g,R=f.R;if(!part)return null;
   if(front(f)){
    const top=f.rimC-.42*R,bot=f.rimC-.1*R;
    if(Math.abs(x-g.cx)<=.24*R&&y>=top&&y<=bot){
     if(Math.hypot(x-g.cx,y-(top+bot)/2)<.11*R)return {color:'#fff6c8'};
     if(Math.abs(x-g.cx)>.19*R||y<top+.04*R||y>bot-.04*R)return {color:'#262626'};
     return {color:'#5a5f66'};
    }
   }else if(side(f)){
    const x0=g.cx+.78*R,top=f.rimC-.4*R,bot=f.rimC-.1*R;
    if(x>=x0&&x<=x0+.28*R&&y>=top&&y<=bot)return x>x0+.2*R?{color:'#fff6c8'}:{color:'#4e535a'};
   }else if(Math.abs(x-g.cx)<=.2*R&&y>=f.rimC-.4*R&&y<=f.rimC-.12*R)return {color:'#34383e'};   // 뒤 배터리
   return null;
  }},
 // 레전드 · 건축디자인과 · 디자인 스카프(붉은 두건)
 'architecture-helmet':{name:'디자인 스카프',kind:'bandana',matte:true,
  colors:{cloth:'#c42a2f',hem:'#9b1d23',knot:'#b0242a',tail:'#a8232a',line:'#3f0b0e'},
  deco(part,x,y,f){
   const g=f.g,R=f.R;
   if(part==='cloth'){
    const c=bandanaEmblem(f);
    if(c&&triangle(x,y,c,.2*R))return {color:'#f6eee6',flat:true};
    if(Math.abs((x-g.cx)*.6+(y-g.cy)*1-(-.55*R))<.03*R)return '#9b1d23';          // 천 주름
   }
   return null;
  }},
 // 레전드 · 자동화기계과 · 정비 헤드밴드(갈색 머리띠)
 'machine-helmet':{name:'정비 헤드밴드',kind:'band',matte:true,
  colors:{band:'#7b4a26',knot:'#6c401f',tail:'#6a3f1f',line:'#241208'},
  deco(part,x,y,f){
   const g=f.g,R=f.R;
   if(part==='band'){
    const c=bandEmblem(f);
    if(c&&gear(x,y,c,.13*R))return {color:'#e8d3a6',flat:true};
   }
   return null;
  }},
 // 레전드 · 전기전자과 · 테크 헤드밴드(파란 머리띠)
 'electric-helmet':{name:'테크 헤드밴드',kind:'band',matte:true,
  colors:{band:'#2458c8',knot:'#1f4db0',tail:'#1d49a6',line:'#0c1a45'},
  deco(part,x,y,f){
   const g=f.g,R=f.R;
   if(part==='band'){
    const c=bandEmblem(f);
    if(c&&bolt(x,y,c,.14*R))return {color:'#ffffff',flat:true};
   }
   return null;
  }},
 // 레전드 · 토목시스템과 · 필드 스카프(노란 두건)
 'civil-helmet':{name:'필드 스카프',kind:'bandana',matte:true,
  colors:{cloth:'#e3b02a',hem:'#c08f17',knot:'#d6a31f',tail:'#cc9a1c',line:'#3d2c06'},
  deco(part,x,y,f){
   const g=f.g,R=f.R;
   if(part==='cloth'){
    const c=bandanaEmblem(f);
    if(c&&triangle(x,y,c,.2*R))return {color:'#fff6da',flat:true};
    if(Math.abs((x-g.cx)*.6+(y-g.cy)*1-(-.55*R))<.03*R)return '#c08f17';
   }
   return null;
  }},
};
