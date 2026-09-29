// ── 무기 그림 (2026-09-26 무기 리워크) ─────────────────────────
// 영웅·레전드 8종은 최종 컨셉 시트를 기준으로 캔버스 벡터로 새로 그린다(작은 화면에서 읽히도록 단순화).
// 보통 복싱 글러브 · 희귀 배드민턴 라켓은 확정 이미지(assets/weapons/*.png)를 그대로 쓴다.
//
// 좌표 규칙 — 한 자루 무기(검·라켓·창·망치): 손잡이를 쥐는 점(grip)이 원점, 무기 축이 +x 방향.
//             주먹 무기(글러브·건틀릿): 주먹 한가운데가 원점, 주먹이 뻗는 방향(손등→너클)이 +x, 팔뚝은 -x.
// 단위는 홍길동 스프라이트 좌표(키 24칸)와 같다.
//
// o.glow   0~1 공격 강조(타격 순간 발광·전류가 세진다)
// o.t      시간(초) — 전류·코어의 은은한 움직임
// o.from/o.to  축(x) 구간만 잘라 그리기 — 몸 앞/뒤 레이어로 나눠 그릴 때 쓴다

const TAU=Math.PI*2;
function poly(c,points,fill,stroke,width=.18){
 c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
 if(fill){c.fillStyle=fill;c.fill();}
 if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.stroke();}
}
function line(c,points,stroke,width=.2,cap='round'){
 c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
 c.strokeStyle=stroke;c.lineWidth=width;c.lineCap=cap;c.lineJoin='round';c.stroke();
}
function disc(c,x,y,r,fill,stroke,width=.16){
 c.beginPath();c.arc(x,y,r,0,TAU);
 if(fill){c.fillStyle=fill;c.fill();}
 if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function rect(c,x,y,w,h,fill,stroke,width=.16){
 if(fill){c.fillStyle=fill;c.fillRect(x,y,w,h);}
 if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.strokeRect(x,y,w,h);}
}
// 발광: 같은 선을 넓고 옅게 한 번 더 긋는다(shadowBlur 없이 가볍게).
function glowLine(c,points,color,width,alpha){
 if(alpha<=0)return;
 c.save();c.globalAlpha*=alpha;line(c,points,color,width);c.restore();
}
function gear(c,x,y,r,teeth,fill,stroke,spin=0){
 c.beginPath();
 for(let i=0;i<teeth*2;i++){
  const a=spin+i/(teeth*2)*TAU,rr=i%2?r*.78:r;
  const a0=a-TAU/(teeth*4)*.55,a1=a+TAU/(teeth*4)*.55;
  if(i===0)c.moveTo(x+Math.cos(a0)*rr,y+Math.sin(a0)*rr);else c.lineTo(x+Math.cos(a0)*rr,y+Math.sin(a0)*rr);
  c.lineTo(x+Math.cos(a1)*rr,y+Math.sin(a1)*rr);
 }
 c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=.12;c.stroke();
}
// 번개처럼 꺾이는 선. seed 가 같으면 모양이 같아 깜빡임이 너무 잦지 않다.
function bolt(c,x0,y0,x1,y1,seed,color,width){
 const n=5,dx=x1-x0,dy=y1-y0,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
 const pts=[[x0,y0]];
 for(let i=1;i<n;i++){const k=i/n,j=Math.sin(seed*12.9898+i*78.233)*43758.5453;const off=((j-Math.floor(j))-.5)*len*.28;pts.push([x0+dx*k+nx*off,y0+dy*k+ny*off]);}
 pts.push([x1,y1]);line(c,pts,color,width);
}

// ── 건축디자인과 · 붉은 계열 ─────────────────────────────
const RED={main:'#c8323c',dark:'#5a1520',wine:'#7a1f2b',bright:'#ff4d5a',glow:'#ff6a6a',steel:'#efe9e4',steelShade:'#b9b0ab',grip:'#3a1a1f'};
// 영웅 · 청사진 제도검 — 자(ruler)처럼 곧은 은빛 검신, 삼각자 모양 붉은 가드, 눈금과 비스듬히 자른 칼끝.
function blueprintDraftSword(c,o){
 const g=o.glow||0;
 poly(c,[[-3.3,0],[-2.9,-.5],[-2.6,0],[-2.9,.5]],RED.main,RED.dark,.12);           // 폼멜
 rect(c,-2.7,-.42,2.6,.84,RED.grip);                                               // 손잡이
 for(let x=-2.4;x<-.1;x+=.55)rect(c,x,-.44,.24,.88,RED.wine);                      // 감은 끈
 poly(c,[[1.2,-.66],[9.4,-.66],[11.5,.64],[1.2,.64]],RED.steel,RED.steelShade,.14); // 자 모양 검신 + 비스듬한 칼끝
 poly(c,[[1.2,-.66],[9.4,-.66],[9.72,-.46],[1.2,-.46]],RED.main);                   // 위쪽 붉은 날
 for(let i=0,x=1.7;x<9.2;i++,x+=.7)line(c,[[x,.64],[x,i%2?.28:.08]],RED.wine,.1,'butt'); // 눈금
 line(c,[[1.6,-.1],[8.9,-.1]],'#d85a64',.07);                                        // 제도선
 poly(c,[[.1,-2],[1.25,-2],[1.25,1.65]],RED.main,RED.dark,.14);                     // 삼각자 가드
 poly(c,[[.45,-1.45],[.95,-1.45],[.95,.45]],RED.dark);
 disc(c,.7,0,.34,'#ffe3e0',RED.dark,.1);                                            // 컴퍼스 축
 glowLine(c,[[1.2,-.56],[9.6,-.56],[11.5,.64]],RED.glow,.55,.35*g+.05);
}
// 레전드 · 천공 설계검 — 설계선으로 짜인 붉은 에너지 검신, 쌍삼각자 날개 가드와 코어, 떠다니는 치수선.
function skyDesignSword(c,o){
 const g=o.glow||0,t=o.t||0,pulse=.55+.45*Math.sin(t*4);
 poly(c,[[-3.9,0],[-3.35,-.65],[-2.8,0],[-3.35,.65]],RED.bright,RED.dark,.12);     // 폼멜(발광)
 rect(c,-3,-.46,2.8,.92,RED.grip);
 for(let x=-2.8;x<-.3;x+=.5)rect(c,x,-.48,.2,.96,RED.main);
 // 검신 외곽: 길고 공격적인 창날형, 앞쪽에 역날 톱니
 const edge=[[1.3,-1.25],[4,-1.35],[4.6,-1.75],[5.1,-1.3],[10.6,-1.05],[16.4,0],[10.6,1.05],[5.1,1.3],[4.6,1.75],[4,1.35],[1.3,1.25]];
 poly(c,edge,'rgba(90,21,32,.92)',RED.bright,.2);
 // 검신 안쪽: 구조 트러스(설계도 선)
 c.save();c.beginPath();edge.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
 const truss=[];for(let x=1.6,s=-1;x<15.6;x+=1.15,s=-s)truss.push([x,s*1.05]);
 line(c,truss,'#ff7b84',.1);
 line(c,[[1.4,0],[16,0]],'#ffd1d4',.16);
 c.restore();
 glowLine(c,edge.slice(4,7),RED.glow,.9,.25+.5*g);
 // 쌍삼각자 날개 가드 + 코어
 poly(c,[[.1,-3.3],[1.5,-1.2],[1.5,1.2],[.1,3.3],[-.25,1.1],[-.25,-1.1]],RED.main,RED.dark,.16);
 poly(c,[[.35,-2.3],[1.05,-1.1],[1.05,1.1],[.35,2.3]],RED.dark);
 disc(c,.62,0,.62,'#ffb2b6',RED.dark,.14);disc(c,.62,0,.3,'#fff3f2');
 glowLine(c,[[.62,-.1],[.62,.1]],RED.glow,1.8,(.25+.35*g)*pulse);
 // 떠다니는 홀로그램 치수선
 c.save();c.globalAlpha*=.45+.4*g;
 line(c,[[2,-2.35],[13.2,-1.75]],RED.bright,.08);
 for(const k of [0,.33,.66,1]){const x=2+11.2*k,y=-2.35+.6*k;line(c,[[x,y-.3],[x,y+.3]],RED.bright,.07);}
 line(c,[[3,2.25],[9.5,1.95]],RED.bright,.07);
 c.restore();
}

// ── 자동화기계과 · 갈색/브론즈 계열 ─────────────────────────
const BRONZE={main:'#a8672f',light:'#d08a45',dark:'#4a3122',iron:'#3a302d',ironLight:'#5d504a',copper:'#c4743a',core:'#ff9a3c',coreHot:'#ffe0a8'};
// 영웅 · 서보 기어 건틀릿 — 손등 기어, 너클 판, 팔뚝의 피스톤·링크. 몸을 가리지 않는 크기.
function servoGearGauntlet(c,o){
 const g=o.glow||0,spin=(o.t||0)*2.4+g*3;
 rect(c,-3.5,-1.12,2.6,2.24,BRONZE.iron,BRONZE.dark,.14);                          // 팔뚝 커프
 for(const x of [-3.2,-2.2])rect(c,x,-1.16,.36,2.32,BRONZE.copper);                 // 브론즈 밴드
 line(c,[[-3.3,-1.42],[-.95,-1.42]],BRONZE.light,.26);                                // 피스톤 로드
 rect(c,-3.35,-1.62,.9,.42,BRONZE.dark);
 line(c,[[-1.9,1.3],[-.9,.9]],BRONZE.light,.2);                                       // 링크
 poly(c,[[-1.05,-1.35],[1.2,-1.35],[1.75,-.9],[1.75,.9],[1.2,1.35],[-1.05,1.35]],BRONZE.main,BRONZE.dark,.16); // 주먹
 for(let i=0;i<4;i++)rect(c,1.25,-1.15+i*.6,.52,.44,BRONZE.light,BRONZE.dark,.08);  // 너클 판
 gear(c,-.1,-.1,.95,8,BRONZE.dark,'#2a1c14',spin);                                   // 손등 기어
 disc(c,-.1,-.1,.34,BRONZE.core,null);
 glowLine(c,[[-.1,-.2],[-.1,0]],BRONZE.core,1.3,.2+.55*g);
}
// 레전드 · 오토매틱 드라이브 건틀릿 — 팔뚝 전체를 감싼 구동 드럼과 동력 코어 링, 겹겹의 피스톤·관절.
function autoDriveGauntlet(c,o){
 const g=o.glow||0,t=o.t||0,spin=t*5+g*6,pulse=.6+.4*Math.sin(t*6);
 // 구동 드럼(팔뚝)
 poly(c,[[-5,-1.25],[-4.6,-1.6],[-1.5,-1.6],[-1.2,-1.3],[-1.2,1.3],[-1.5,1.6],[-4.6,1.6],[-5,1.25]],BRONZE.iron,'#1d1512',.16);
 for(const x of [-4.4,-3.55,-2.7,-1.85])rect(c,x,-1.64,.42,3.28,BRONZE.ironLight,'#1d1512',.08);
 // 동력 코어 링(드럼 옆면)
 disc(c,-3.1,0,1.05,'#2a1a10',BRONZE.copper,.22);
 disc(c,-3.1,0,.7,BRONZE.core,null);disc(c,-3.1,0,.34,BRONZE.coreHot,null);
 glowLine(c,[[-3.1,-.05],[-3.1,.05]],BRONZE.core,2.5,(.25+.5*g)*pulse);
 // 위아래 피스톤(압축된 구동부)
 for(const s of [-1,1]){
  rect(c,-4.8,s*1.6-(s<0?.62:0),2.1,.62,BRONZE.dark,'#1d1512',.08);
  line(c,[[-2.7,s*1.9],[-.8,s*1.55]],BRONZE.light,.3);
 }
 disc(c,-1.2,-1.35,.3,BRONZE.copper,'#1d1512',.08);disc(c,-1.2,1.35,.3,BRONZE.copper,'#1d1512',.08); // 관절 핀
 // 주먹 블록: 크고 두꺼운 판금 너클
 poly(c,[[-1.35,-1.8],[1.4,-1.8],[2.35,-1.15],[2.35,1.15],[1.4,1.8],[-1.35,1.8]],BRONZE.main,'#2a1c14',.18);
 for(let i=0;i<4;i++)poly(c,[[1.45,-1.55+i*.8],[2.45,-1.4+i*.8],[2.45,-.95+i*.8],[1.45,-.85+i*.8]],BRONZE.light,'#2a1c14',.08);
 gear(c,.1,0,1.05,10,BRONZE.dark,'#1d1512',spin);
 gear(c,.1,0,.6,6,BRONZE.copper,'#1d1512',-spin*1.6);
 line(c,[[1.5,-1.7],[2.4,-1.1]],BRONZE.coreHot,.12);                                  // 너클 가장자리 광
 glowLine(c,[[2.45,-1.2],[2.45,1.2]],BRONZE.core,.9,.15+.6*g);
}

// ── 전기전자과 · 파란 계열 ────────────────────────────────
const BLUE={main:'#3d7fe0',deep:'#1c2c5a',navy:'#15203f',light:'#8fd0ff',white:'#eef8ff',brass:'#c9a24a',shaft:'#2a3350'};
// 영웅 · 쌍극 아크창 — 긴 자루, 창끝(+)과 물미(-) 두 전극, 창끝 아래 코일, 양 옆 전극 날.
function bipolarArcSpear(c,o){
 const g=o.glow||0,t=o.t||0;
 line(c,[[-6.3,0],[10.3,0]],BLUE.shaft,.5,'butt');                                   // 자루
 line(c,[[-6.3,-.1],[10.3,-.1]],'#4a5a86',.12,'butt');
 for(const x of [-.9,.9,6.2])rect(c,x-.22,-.34,.44,.68,BLUE.brass);                  // 황동 링
 for(let x=7.9;x<9.9;x+=.36)line(c,[[x,-.45],[x+.2,.45]],'#e08a3c',.14);               // 구리 코일
 // 물미(-) 전극
 poly(c,[[-6.3,-.42],[-7.6,0],[-6.3,.42]],BLUE.deep,BLUE.main,.12);
 line(c,[[-7.05,0],[-6.65,0]],BLUE.white,.1);
 // 창끝(+) 전극: 가운데 긴 날 + 양옆 짧은 전극 날
 poly(c,[[10.1,-.55],[13,0],[10.1,.55]],BLUE.main,BLUE.navy,.14);
 line(c,[[10.3,0],[12.6,0]],BLUE.light,.12);
 for(const s of [-1,1])poly(c,[[9.8,s*.3],[11.2,s*1.45],[11.5,s*1.2],[10.4,s*.35]],BLUE.deep,BLUE.main,.1);
 line(c,[[10.55,-.2],[10.55,.2]],BLUE.white,.08);line(c,[[10.35,0],[10.75,0]],BLUE.white,.08); // +
 // 두 전극 사이에 흐르는 전류
 c.save();c.globalAlpha*=.35+.55*g;
 bolt(c,11.3,-1.3,11.3,1.3,Math.floor(t*12),BLUE.light,.1);
 c.restore();
 glowLine(c,[[10.1,0],[13,0]],BLUE.light,.9,.1+.45*g);
}
// 레전드 · 뇌극 성광창 — 더 긴 번개 에너지 날, 가운데 에너지 코어와 전극 프레임, 고전압 아크.
function lightningPoleSpear(c,o){
 const g=o.glow||0,t=o.t||0,pulse=.6+.4*Math.sin(t*7);
 line(c,[[-7.2,0],[10,0]],BLUE.navy,.58,'butt');
 line(c,[[-7.2,0],[10,0]],BLUE.main,.14,'butt');                                    // 자루 속 전류 선
 for(const x of [-1,1,5.2])rect(c,x-.25,-.38,.5,.76,BLUE.brass);
 // 물미 전극
 poly(c,[[-7.2,-.55],[-8.8,0],[-7.2,.55]],BLUE.deep,BLUE.light,.12);
 disc(c,-7.5,0,.3,BLUE.light);
 // 전극 프레임 + 에너지 코어
 for(const s of [-1,1]){
  line(c,[[8.4,s*.35],[9.2,s*1.75],[11.2,s*1.95],[12.4,s*.7]],BLUE.brass,.2);
  line(c,[[9.2,s*1.75],[10.6,s*1.2]],BLUE.brass,.12);
 }
 disc(c,10.6,0,1.35,BLUE.navy,BLUE.brass,.2);
 disc(c,10.6,0,.95,BLUE.main);disc(c,10.6,0,.5,BLUE.white);
 glowLine(c,[[10.6,-.05],[10.6,.05]],BLUE.light,3,(.3+.5*g)*pulse);
 // 갈라진 번개 에너지 날
 poly(c,[[12,-.95],[14,-.5],[13.6,-.95],[17.8,0],[13.6,.95],[14,.5],[12,.95]],BLUE.main,BLUE.white,.14);
 line(c,[[12.2,0],[17.2,0]],BLUE.white,.16);
 for(const s of [-1,1])poly(c,[[12.4,s*.8],[13.3,s*1.7],[13.05,s*1.45],[14.9,s*2.6],[13.7,s*1.15]],BLUE.light,BLUE.main,.08);
 // 고전압 아크
 c.save();c.globalAlpha*=.35+.6*g;
 const seed=Math.floor(t*14);
 bolt(c,9.2,-1.75,12.4,-.7,seed,BLUE.white,.1);bolt(c,9.2,1.75,12.4,.7,seed+3,BLUE.white,.1);
 if(g>.2)bolt(c,14,0,18.8,0,seed+7,BLUE.light,.14);
 c.restore();
 glowLine(c,[[12,0],[17.8,0]],BLUE.light,1.3,.15+.55*g);
}

// ── 토목시스템과 · 노란 계열 ──────────────────────────────
const YEL={main:'#e2b21c',light:'#f5cf45',dark:'#8a6a0e',black:'#1f1f22',iron:'#555a61',ironLight:'#80868e',core:'#ffd23c',coreHot:'#fff2b0'};
function hazard(c,x,y,w,h,step=.7){
 c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
 c.fillStyle=YEL.main;c.fillRect(x,y,w,h);c.fillStyle=YEL.black;
 for(let k=x-h;k<x+w+h;k+=step*2){c.beginPath();c.moveTo(k,y);c.lineTo(k+step,y);c.lineTo(k+step+h,y+h);c.lineTo(k+h,y+h);c.closePath();c.fill();}
 c.restore();
}
// 영웅 · 지반 파쇄추 — 긴 철제 자루 끝에 노란 암반 파쇄 헤드. 무게중심이 헤드 쪽에 있다.
function groundBreakerHammer(c,o){
 const g=o.glow||0;
 line(c,[[-2.2,0],[8.6,0]],YEL.iron,.62,'butt');                                    // 철제 자루
 rect(c,-2.2,-.4,3.2,.8,YEL.black);for(let x=-2;x<.9;x+=.55)rect(c,x,-.42,.22,.84,YEL.main); // 손잡이
 rect(c,6.8,-.42,1.8,.84,YEL.dark);                                                   // 헤드 목
 rect(c,8.4,-2.7,3.4,5,YEL.main,YEL.black,.2);                                        // 헤드 몸통
 hazard(c,8.55,-.9,3.1,1.5,.5);                                                       // 경고 줄무늬 띠
 rect(c,8.2,-3,3.8,.55,YEL.iron,YEL.black,.12);rect(c,8.2,1.95,3.8,.55,YEL.iron,YEL.black,.12); // 타격면 철판
 for(const [x,y] of [[8.8,-2.1],[11.4,-2.1],[8.8,1.4],[11.4,1.4]])disc(c,x,y,.2,YEL.black);   // 리벳
 glowLine(c,[[8.2,-3],[12,-3]],YEL.core,.9,.1+.45*g);
}
// 레전드 · 대지붕괴 파쇄추 — 거대한 드럼형 파쇄 헤드, 가운데 에너지 코어, 뒤쪽 압축 실린더, 이빨 달린 타격면.
function earthCollapseCrusher(c,o){
 const g=o.glow||0,t=o.t||0,spin=t*3+g*5,pulse=.6+.4*Math.sin(t*5);
 line(c,[[-2.5,0],[9.6,0]],YEL.black,.8,'butt');
 line(c,[[-1,-.55],[9.4,-.55]],YEL.iron,.22,'butt');                                  // 유압 배관
 rect(c,-2.5,-.48,3.4,.96,YEL.black);for(let x=-2.3,i=0;x<.8;x+=.55,i++)rect(c,x,-.5,.24,1,i%2?YEL.main:YEL.dark);
 disc(c,-2.6,0,.55,YEL.main,YEL.black,.12);                                            // 자루 끝 추
 // 압축 실린더 두 개(헤드 뒤)
 for(const s of [-1,1]){rect(c,7.2,s*1.15-.5,2.6,1,YEL.iron,YEL.black,.1);rect(c,7.4,s*1.15-.3,1.2,.6,YEL.ironLight);}
 // 드럼 헤드
 poly(c,[[9.6,-3.9],[14.4,-3.9],[15.1,-3.1],[15.1,3.1],[14.4,3.9],[9.6,3.9],[9.2,3.1],[9.2,-3.1]],YEL.main,YEL.black,.22);
 hazard(c,9.4,-3.75,5.5,1.1,.55);hazard(c,9.4,2.65,5.5,1.1,.55);
 gear(c,12.2,0,2.3,12,YEL.black,'#000',spin);                                         // 회전 구조
 disc(c,12.2,0,1.45,'#3a2a08',YEL.light,.16);
 disc(c,12.2,0,1,YEL.core);disc(c,12.2,0,.48,YEL.coreHot);                             // 에너지 코어
 glowLine(c,[[12.2,-.05],[12.2,.05]],YEL.core,3.4,(.25+.55*g)*pulse);
 // 타격면 이빨(위·아래 끝)
 for(const s of [-1,1])for(let i=0;i<4;i++){const x=9.7+i*1.3;poly(c,[[x,s*3.9],[x+.6,s*4.7],[x+1.2,s*3.9]],YEL.iron,YEL.black,.1);}
 glowLine(c,[[9.6,-3.9],[14.4,-3.9]],YEL.core,.8,.1+.5*g);
}

// ── 보통 · 희귀 확정 이미지 ────────────────────────────────
// 복싱 글러브는 한 짝 이미지를 양손에 쓰고, 라켓은 손잡이 테이프 가운데를 쥔다.
// badminton-racket-small.png 은 같은 라켓 이미지를 가는 테두리가 뭉개지지 않게(선 굵기 보존) 작게 줄인 것 — 손에 든 모습용.
const IMAGE_FILES={boxingGlove:'boxing-glove.png',boxingGlovePair:'boxing-glove-pair.png',badmintonRacket:'badminton-racket.png',badmintonRacketSmall:'badminton-racket-small.png'};
const images={};
export function loadWeaponImages(){
 if(typeof Image==='undefined')return;
 for(const [key,file] of Object.entries(IMAGE_FILES)){
  if(images[key])continue;
  const img=new Image();img.src=new URL(`../assets/weapons/${file}`,import.meta.url).href;images[key]=img;
 }
}
const ready=img=>img&&img.complete&&img.naturalWidth>0;
// 글러브 이미지(139×192): 커프가 아래, 주먹이 위. 주먹 가운데(70,78)를 원점으로 두고 주먹 방향을 +x 로 돌린다.
function boxingGlove(c){
 const img=images.boxingGlove;if(!ready(img))return;
 const s=3.3/img.naturalHeight;
 c.save();c.rotate(Math.PI/2);c.drawImage(img,-70*s,-78*s,img.naturalWidth*s,img.naturalHeight*s);c.restore();
}
// 라켓 이미지(원본 210×320 기준): 손잡이 끝(204,314) → 헤드 끝(18,6). 손잡이 테이프 가운데(178,262)를 쥔다.
// 좌표는 원본 크기 비율이라 작게 줄인 이미지에도 그대로 맞는다.
const RACKET={size:[210,320],grip:[178,262],butt:[204,314],tip:[18,6],length:11};
function badmintonRacket(c,o={}){
 const img=o.icon?images.badmintonRacket:(ready(images.badmintonRacketSmall)?images.badmintonRacketSmall:images.badmintonRacket);
 if(!ready(img))return;
 const [gx,gy]=RACKET.grip,[bx,by]=RACKET.butt,[tx,ty]=RACKET.tip,k=img.naturalWidth/RACKET.size[0];
 const s=RACKET.length/Math.hypot(tx-bx,ty-by),axis=Math.atan2(ty-gy,tx-gx);
 c.save();c.rotate(-axis);c.drawImage(img,-gx*s,-gy*s,img.naturalWidth/k*s,img.naturalHeight/k*s);c.restore();
}

// id → 그림 정보. grip: 'fist'(주먹 무기, 양손) | 'haft'(한 자루 무기).
// length 는 손잡이 원점에서 끝까지(대략), butt 는 원점 뒤로 나온 길이 — 레이어 분할·아이콘 크기에 쓴다.
// scale 은 주먹 무기를 손 크기에 맞추는 배율(글러브·건틀릿은 맨손보다 훨씬 크다).
export const WEAPON_ART={
 boxingGlove:{draw:boxingGlove,grip:'fist',length:1.8,butt:1.5,scale:1.3,color:'#d03030',image:true},
 badmintonRacket:{draw:badmintonRacket,grip:'haft',length:8.7,butt:2,color:'#4a8fe8',image:true},
 'architecture-hero-weapon':{draw:blueprintDraftSword,grip:'haft',length:11.5,butt:3.3,color:RED.bright},
 'architecture-weapon':{draw:skyDesignSword,grip:'haft',length:16.4,butt:3.9,color:RED.bright,hold:'upright'},
 'machine-hero-weapon':{draw:servoGearGauntlet,grip:'fist',length:1.8,butt:3.5,scale:1.2,color:BRONZE.core},
 'machine-weapon':{draw:autoDriveGauntlet,grip:'fist',length:2.5,butt:5,scale:1.22,color:BRONZE.core},
 'electric-hero-weapon':{draw:bipolarArcSpear,grip:'haft',length:13,butt:7.6,color:BLUE.light},
 'electric-weapon':{draw:lightningPoleSpear,grip:'haft',length:17.8,butt:8.8,color:BLUE.light},
 'civil-hero-weapon':{draw:groundBreakerHammer,grip:'haft',length:12,butt:2.2,color:YEL.core,heavy:true},
 'civil-weapon':{draw:earthCollapseCrusher,grip:'haft',length:15.1,butt:2.6,color:YEL.core,heavy:true},
};
export function weaponArt(id){return WEAPON_ART[id]||null;}

// 무기 하나를 현재 좌표계(원점 = 손잡이/주먹, +x = 무기 방향)에 그린다. from/to 로 축 구간만 잘라 그릴 수 있다.
export function drawWeapon(c,id,o={}){
 const art=WEAPON_ART[id];if(!art)return false;
 const clip=Number.isFinite(o.from)||Number.isFinite(o.to);
 c.save();
 if(clip){const x0=Number.isFinite(o.from)?o.from:-50,x1=Number.isFinite(o.to)?o.to:50;c.beginPath();c.rect(x0,-50,x1-x0,100);c.clip();}
 if(art.scale)c.scale(art.scale,art.scale);
 art.draw(c,o);
 c.restore();
 return true;
}
// 바닥에 떨어진 무기 · 아이콘. size 칸 안에 들어가도록 비스듬히 눕혀 그린다.
export function drawWeaponIcon(c,id,t=0,size=15){
 const art=WEAPON_ART[id];if(!art)return false;
 if(id==='boxingGlove'){const img=images.boxingGlovePair;if(ready(img)){const s=size*.62/img.naturalHeight;c.drawImage(img,-img.naturalWidth*s/2,-img.naturalHeight*s*.62,img.naturalWidth*s,img.naturalHeight*s);}return true;}
 const total=art.length+art.butt,s=Math.min(1,size/total);
 c.save();c.rotate(art.grip==='fist'?-.35:-.62);c.scale(s,s);c.translate((art.butt-art.length)/2,0);
 art.draw(c,{t,glow:0,icon:true});
 c.restore();return true;
}
