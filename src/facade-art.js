import {shade} from './roof-colors.js';
import {wallTexture,wallStains,bandShadow,bandEdge,pierRelief,glassFx,sillFx,wearOf} from './surface-art.js';

export const WALL_MATERIALS = {
  white: '#e6e5df', architecture: '#993c33', machine: '#875a4b',
  gym: '#d3b77b', column: '#bd8c79', glass: '#47616c', frame: '#e4e5dd',
  civil: '#a9cec4', civilTrim: '#f3f2ea', civilCap: '#4f6f52',
  // 운동장 쪽 사진 기준: 본관은 붉은 벽돌 + 크림색 층 띠 + 밝은 회색 기둥띠.
  main: '#8b453f', mainBand: '#e0dac9', mainPier: '#cec8b8', electricBrick: '#9c473c',
  mainBase: '#b5afa0', mainStone: '#c9b394', mainStoneDark: '#a4886a',
  // 사진4·5 · 꿈키움홀은 가로 이음매가 보이는 흰 금속 패널, 아래쪽만 옅은 회색 걸레받이.
  dreamhall: '#eceadd', dreamhallBase: '#c3c2b6', dreamhallSign: '#c9402f',
  // 사진4 · 급식소는 주황빛 벽돌 2층 + 짙은 갈색 루버 띠 + 외부 계단.
  cafeteria: '#b06a45', cafeteriaLouver: '#4a3a30', cafeteriaTrim: '#e9e2cf',
  // 사진5 · 승리관(복싱장) 입구는 각진 유리 파사드 계단실 + 파란 「勝」 간판.
  jangseong: '#dcd8c8', jangseongGlass: '#7fa9b8', jangseongSign: '#1f5fa8',
  // 사진2·3 · 취업진로부는 아래 갈색 벽돌, 위 크림색 3층.
  career: '#ddd8c6', careerBrick: '#8a6553',
  // 사진1·2 · 자동화기계과: 1층 붉은 벽돌 + 2층 흰 벽, 급식소 쪽 끝만 밝은 회색 외장 패널 증축부,
  // 동측 외벽 한 구간에 밝은 노란색 프레임 포인트.
  machineWhite: '#e9e7dc', machinePanel: '#c4c4bb', machinePanelJoint: '#a3a39a',
  machineYellow: '#f2c21c', machineYellowDark: '#cf9c0c', machineYellowLight: '#fbdc62',
  machineAwning: '#3d4c80', machineAwningDark: '#2c3860'
};

// 자동화기계과 동측 외벽에서 급식소 쪽(북쪽) 끝 38 칸이 회색 패널 증축부다. 지붕 띠(building-art.js)도 같은 길이를 쓴다.
export const MACHINE_ANNEX = 38;
// 노란 프레임이 차지하는 구간(건물 북쪽 끝 b.y 기준 국소 좌표). 우측 현관(u = 381-301 = 80)의 바로
// 북쪽에 두어, 통로에서 현관을 바라보면 프레임이 현관 오른쪽에 오게 한다(실제 사진과 같은 배치).
// 앞쪽 38칸은 카페 증축부라 그 남쪽으로 14칸 띄운 자리에 세운다.
const MACHINE_YELLOW = { from: 52, to: 67 };

export function gradient(d, a, b, stops) {
  const p=d.p(a.x,a.y,a.z||0),q=d.p(b.x,b.y,b.z||0);
  const paint=d.c.createLinearGradient(p.x,p.y,q.x,q.y);
  stops.forEach(([position,color])=>paint.addColorStop(position,color));
  return paint;
}

export function facePoint(b,side,u,z,offset=0) {
  if(side==='front')return{x:b.x+u,y:b.y+b.d+offset,z};
  if(side==='back')return{x:b.x+u,y:b.y-offset,z};
  if(side==='left')return{x:b.x-offset,y:b.y+u,z};
  return{x:b.x+b.w+offset,y:b.y+u,z};
}

export function panel(d,b,side,u,z,width,height,fill,stroke) {
  d.poly([facePoint(b,side,u,z),facePoint(b,side,u+width,z),
    facePoint(b,side,u+width,z+height),facePoint(b,side,u,z+height)],fill,stroke,.65);
}

function window(d,b,side,u,z,w,h) {
  panel(d,b,side,u-.5,z-.5,w+1,h+1,'#626f6b');
  panel(d,b,side,u,z,w,h,gradient(d,facePoint(b,side,u,z+h),facePoint(b,side,u+w,z),
    [[0,'#9fbbbd'],[.3,WALL_MATERIALS.glass],[1,'#293f48']]),WALL_MATERIALS.frame);
  d.line([facePoint(b,side,u+w/2,z),facePoint(b,side,u+w/2,z+h)],WALL_MATERIALS.frame,.8);
  d.line([facePoint(b,side,u,z+h*.74),facePoint(b,side,u+w,z+h*.74)],'#b9c8c6',.7);
  d.line([facePoint(b,side,u+.4,z+.6),facePoint(b,side,u+w*.65,z+h-.5)],'#d6e6d140',.7);
  panel(d,b,side,u-.7,z-.8,w+1.4,.7,WALL_MATERIALS.frame);
  glassFx(d,b,side,u,z,w,h);                                   // Revision 60 · 하늘 반사·실내 깊이·사선 반사·오목 그림자
  sillFx(d,b,side,u,z,w);                                      // Revision 60 · 창대 윗면 빛 + 아래 그림자
}

const rand=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};

// rich 가 0(기본)이면 원본과 한 획도 다르지 않다 — 급식소·취업진로부 등 다른 건물은 그대로다.
// rich 가 1이면(본관·장성관, Revision 59) 같은 줄눈 위에 켜마다 톤 흔들림과 색이 조금 다른 벽돌 몇 장을 얹는다.
// Revision 59 · 원본 window() 와 똑같이 그린 뒤(같은 크기·같은 틀 색·같은 멀리언과 창대),
// 반투명 덧칠로만 유리다움을 더한다: 윗칸 하늘 반사, 아랫칸 실내 깊이, 창틀 안쪽 오목 그림자, 두 번째 사광, 창대 그림자.
// Revision 60 · 유리 표면감은 이제 window() 가 모든 건물에 공통으로 그린다. 이름만 남겨 둔다.
function glassPanel(d,b,side,u,z,w,h) {window(d,b,side,u,z,w,h);}

function masonry(d,b,side,length,base,from=0,rich=0) {
  for(let z=1;z<b.h-2;z+=1.5) {
    const course=Math.round(z/1.5);
    d.line([facePoint(b,side,from,z),facePoint(b,side,length,z)],rich?shade(base,.2+(rand(course*3.7)-.5)*.14):shade(base,.2),.45);
    const offset=from+(course%2?2:0);
    for(let u=offset;u<length;u+=4)
      d.line([facePoint(b,side,u,z),facePoint(b,side,u,z+1.5)],'#e6ccaa24',.4);
    if(!rich)continue;
    for(let u=offset;u<length-4;u+=4) {               // 14장 중 1장만 — 전부 칠하면 무겁고 시끄럽다
      const k=rand(course*131.7+u*7.3+(side==='front'?0:977));
      if(k>1/14)continue;
      panel(d,b,side,u+.35,z+.2,3.3,1.1,(k*14<.5?shade(base,.15):shade(base,-.14))+'99');
    }
  }
}

// 벽 발치에 옅게 깔리는 사용감. 위로 갈수록 사라지는 반투명 그라데이션 한 겹이라 바탕색을 바꾸지 않는다.
function weather(d,b,side,length,top,color='#5d5348') {
  d.poly([facePoint(b,side,0,0),facePoint(b,side,length,0),
    facePoint(b,side,length,top),facePoint(b,side,0,top)],
    gradient(d,facePoint(b,side,0,0),facePoint(b,side,0,top),
      [[0,color+'2a'],[.45,color+'10'],[1,color+'00']]));
}

export function faceDisc(d,b,side,u,z,r,fill,stroke) {
  const points=Array.from({length:28},(_,i)=>{
    const a=i/28*Math.PI*2;
    return facePoint(b,side,u+Math.cos(a)*r,z+Math.sin(a)*r*.98,.05);
  });
  d.poly(points,fill,stroke,1.1);
}

// 운동장 쪽 본관 사진: 3개 층 창 띠, 층마다 크림색 스팬드럴, 밝은 수직 기둥띠, 옥상 파라펫과 난간.
export function mainFacade(d,b,side) {
  const front=side==='front',length=front?b.w:b.d,M=WALL_MATERIALS;
  panel(d,b,side,0,0,length,b.h,gradient(d,facePoint(b,side,0,b.h),facePoint(b,side,length,0),
    [[0,shade(M.main,front?.1:.0)],[.55,M.main],[1,shade(M.main,-.16)]]));
  masonry(d,b,side,length,M.main,0,1);                 // Revision 59 · 같은 줄눈 + 켜마다 톤 흔들림 + 색 다른 벽돌 몇 장
  const wear=wearOf(b);
  wallTexture(d,b,side,0,0,length,b.h,'brick',1.1);    // Revision 60 · 벽돌 한 장 한 장의 색·입체·알갱이
  wallStains(d,b,side,0,length,b.h-2.4,wear);          // Revision 60 · 발치 흙때 + 파라펫 빗물 자국(본관은 약하게)
  panel(d,b,side,0,0,length,3.4,M.mainBase);
  wallTexture(d,b,side,0,0,length,3.4,'granite',1);    // Revision 60 · 화강석 기단 알갱이
  for(let u=0;u<length;u+=7.5)d.line([facePoint(b,side,u,.1),facePoint(b,side,u,3.3)],'#7f786ab0',.6);  // 기단 석재 줄눈
  d.line([facePoint(b,side,0,1.7),facePoint(b,side,length,1.7)],'#7f786a90',.5);
  panel(d,b,side,0,0,length,1.1,'#4a443c26');          // 기단 아랫단 그늘
  bandEdge(d,b,side,0,length,3.4,.6);
  panel(d,b,side,0,3.4,length,.7,M.mainBand);
  for(const z of [4.8,17.2,29.6]) {
    for(let u=3.3;u<length-8;u+=12)glassPanel(d,b,side,u,z,7.4,6.6);
    panel(d,b,side,0,z+7.4,length,1.6,M.mainBand);
    wallTexture(d,b,side,0,z+7.4,length,1.6,'render',.8);          // 층 띠 — 도장된 콘크리트
    panel(d,b,side,0,z+7.4,length,.3,'#a89f8b');
    bandEdge(d,b,side,0,length,z+9,.7);                            // 층 띠 윗면 빛
    bandShadow(d,b,side,0,length,z+7.4,1.4,.34);                   // 층 띠 아래 벽돌에 지는 그림자
  }
  for(let u=1.3;u<length-1;u+=12) {
    panel(d,b,side,u,4,1.1,b.h-7,M.mainPier);
    wallTexture(d,b,side,u,4,1.1,b.h-7,'render',.8);
    pierRelief(d,b,side,u,4,1.1,b.h-7,1);               // Revision 60 · 기둥띠 좌 빛 · 우 그늘 · 옆 벽 그림자
  }
  panel(d,b,side,0,b.h-2.4,length,2.4,M.mainBand);
  wallTexture(d,b,side,0,b.h-2.4,length,2.4,'render',.8);
  bandEdge(d,b,side,0,length,b.h,.75);                // 파라펫 윗면 빛
  bandShadow(d,b,side,0,length,b.h-2.4,1.6,.36);       // 파라펫 아래 그림자
  panel(d,b,side,0,b.h-2.9,length,.5,'#7d766645');
  for(let u=2;u<length;u+=3.5)d.line([facePoint(b,side,u,b.h),facePoint(b,side,u,b.h+2.1)],'#c2bdae',.7);
  d.line([facePoint(b,side,0,b.h+2.1),facePoint(b,side,length,b.h+2.1)],'#d6d1c2',1.5);
  if(!front) {                                     // 중앙현관 위 교표와 세로 석재 띠
    const u=b.d*.5;
    panel(d,b,side,u-5,3.4,10,b.h-4,shade(M.mainStone,.05));
    wallTexture(d,b,side,u-5,3.4,10,b.h-4,'granite',.7);          // Revision 60 · 석재 띠 결
    for(let z=7;z<b.h-1;z+=5.5)d.line([facePoint(b,side,u-5,z),facePoint(b,side,u+5,z)],'#9a8468a0',.5);
    panel(d,b,side,u-5,3.4,.7,b.h-4,M.mainStoneDark);
    panel(d,b,side,u+4.3,3.4,.7,b.h-4,M.mainStoneDark);
    pierRelief(d,b,side,u-5,3.4,10,b.h-4,.7);
    faceDisc(d,b,side,u,b.h-8,2.6,'#2f5f86','#e3ddcb');
    faceDisc(d,b,side,u,b.h-8,1.5,null,'#e3ddcb');
  }
}

// 사진5 · 꿈키움홀: 가로 이음매가 촘촘한 흰 금속 패널 벽, 작은 창, 붉은 '꿈키움홀' 표기.
function dreamhallFacade(d,b,side) {
  const front=side==='front',length=front?b.w:b.d,M=WALL_MATERIALS;
  panel(d,b,side,0,0,length,b.h,gradient(d,facePoint(b,side,0,b.h),facePoint(b,side,length,0),
    [[0,shade(M.dreamhall,.06)],[.6,M.dreamhall],[1,shade(M.dreamhall,-.12)]]));
  wallTexture(d,b,side,0,0,length,b.h,'panel',1);      // Revision 60 · 금속 헤어라인과 은은한 광택
  wallStains(d,b,side,0,length,b.h-1.6,wearOf(b));
  panel(d,b,side,0,0,length,1.8,M.dreamhallBase);
  for(let z=2.6;z<b.h-1.4;z+=1.9){                                 // 금속 패널 가로 이음매
    d.line([facePoint(b,side,0,z),facePoint(b,side,length,z)],'#c6c4b5',.55);
    d.line([facePoint(b,side,0,z-.18),facePoint(b,side,length,z-.18)],'#ffffff66',.45);   // Revision 60 · 이음매 아래 반사 선
  }
  for(let u=6;u<length-6;u+=13){                                   // 작은 창 · 안쪽 커튼이 비친다
    window(d,b,side,u,b.h*.42,5.6,5);
    panel(d,b,side,u+.6,b.h*.42+.5,4.4,4,'#e6b9bc80');
  }
  if(front) {                                                      // 붉은 표기판
    const u=length*.22;
    panel(d,b,side,u-.8,b.h*.32-.8,13.6,5.6,'#f6f3e6','#c9c5b4');
    panel(d,b,side,u,b.h*.32,12,4,M.dreamhallSign);
    for(let i=0;i<4;i++)panel(d,b,side,u+.9+i*2.9,b.h*.32+.8,2,2.4,'#f7f2e6');
  }
  panel(d,b,side,0,b.h-1.6,length,1.6,'#f4f2e6');
  panel(d,b,side,0,b.h-2,length,.4,'#a9a598');
}
// 사진4 · 급식소: 주황빛 벽돌 2층, 위층은 짙은 갈색 세로 루버, 옆으로 외부 계단이 붙는다.
function cafeteriaFacade(d,b,side) {
  const front=side==='front',length=front?b.w:b.d,M=WALL_MATERIALS;
  panel(d,b,side,0,0,length,b.h,gradient(d,facePoint(b,side,0,b.h),facePoint(b,side,length,0),
    [[0,shade(M.cafeteria,.08)],[.6,M.cafeteria],[1,shade(M.cafeteria,-.16)]]));
  masonry(d,b,side,length,M.cafeteria);
  wallTexture(d,b,side,0,0,length,b.h,'brick',1.1);    // Revision 60
  wallStains(d,b,side,0,length,9.6,wearOf(b));
  panel(d,b,side,0,0,length,1.6,'#7d5b49');
  for(let u=3;u<length-8;u+=12)window(d,b,side,u,3.4,7.4,5.4);     // 1층 창
  panel(d,b,side,0,9.6,length,1.2,M.cafeteriaTrim);
  panel(d,b,side,0,10.8,length,b.h-12.4,M.cafeteriaLouver);        // 2층 루버 띠
  for(let u=.8;u<length;u+=1.5){
    d.line([facePoint(b,side,u,11.2),facePoint(b,side,u,b.h-1.8)],'#6c584a',.7);
    d.line([facePoint(b,side,u+.45,11.2),facePoint(b,side,u+.45,b.h-1.8)],'#241a1452',.6);   // Revision 60 · 루버 날개 그늘
  }
  bandShadow(d,b,side,0,length,b.h-1.6,1.2,.34);
  bandShadow(d,b,side,0,length,9.6,1.1,.28);
  panel(d,b,side,0,b.h-1.6,length,1.6,M.cafeteriaTrim);
  if(front) {                                                      // 2층으로 오르는 외부 계단
    const u=length*.72,run=9;
    for(let i=0;i<7;i++)
      panel(d,b,side,u,1.2+i*1.3,run,1.3,i%2?'#cfcabb':'#dcd8ca','#a9a496');
    for(const side2 of [u,u+run])
      d.line([facePoint(b,side,side2,1.2,2.4),facePoint(b,side,side2,10.6,2.4)],'#cfd3cb',1.8);
    panel(d,b,side,u-1,10.4,run+2,1,'#c2beb0');
  }
}
// 사진5 · 승리관: 각진 유리 파사드 계단실과 파란 간판이 얼굴이다.
function jangseongFacade(d,b,side) {
  const front=side==='front',length=front?b.w:b.d,M=WALL_MATERIALS;
  panel(d,b,side,0,0,length,b.h,gradient(d,facePoint(b,side,0,b.h),facePoint(b,side,length,0),
    [[0,shade(M.jangseong,.06)],[.6,M.jangseong],[1,shade(M.jangseong,-.14)]]));
  wallTexture(d,b,side,0,0,length,b.h,'render',.9);    // Revision 60 · 도장된 콘크리트
  wallStains(d,b,side,0,length,b.h-1.8,wearOf(b));
  panel(d,b,side,0,0,length,2.2,'#a9a496');
  for(let z=4;z<b.h-3;z+=6)
    d.line([facePoint(b,side,0,z),facePoint(b,side,length,z)],'#b9b5a6',.55);
  if(!front) {                                                     // 옆면은 평범한 벽 + 창
    for(let u2=3;u2<length-9;u2+=13)window(d,b,side,u2,b.h*.4,7.6,6.4);
    panel(d,b,side,0,b.h-1.8,length,1.8,'#f1eee0');
    panel(d,b,side,0,b.h-2.2,length,.4,'#9d998c');
    return;
  }
  const u=length*.2,gw=Math.min(17,length*.34);
  // 유리 파사드 — 아래가 넓고 위로 좁아지는 각진 계단실(사진5 의 얼굴)
  d.poly([facePoint(b,side,u,1),facePoint(b,side,u+gw,1),
    facePoint(b,side,u+gw*.72,b.h-1),facePoint(b,side,u+gw*.1,b.h-1)],
    gradient(d,facePoint(b,side,u,b.h),facePoint(b,side,u+gw,1),
      [[0,'#cfe4ea'],[.45,M.jangseongGlass],[1,'#3e5f6c']]),'#e4e5dd',.9);
  for(let i=1;i<5;i++){                                            // 유리 멀리언
    const t=i/5;
    d.line([facePoint(b,side,u+gw*t,1),facePoint(b,side,u+gw*.1+gw*.62*t,b.h-1)],'#e4e5dd',.8);
  }
  for(let z=4;z<b.h-2;z+=4.2){
    const t=(z-1)/(b.h-2);
    d.line([facePoint(b,side,u+gw*t*.1,z),facePoint(b,side,u+gw*(1-t*.28),z)],'#dfe6e4a0',.7);
  }
  {                                                                // Revision 60 · 유리 계단실 사선 반사 두 줄
    const L=(t,z)=>u+gw*(.1*z/(b.h-1))+gw*(1-.38*z/(b.h-1))*t;     // 높이 z 에서 폭의 t 지점
    for(const [a0,a1,al] of [[.12,.3,.26],[.55,.62,.2]])
      d.poly([facePoint(b,side,L(a0,1),1),facePoint(b,side,L(a1,1),1),facePoint(b,side,L(a1+.3,b.h-1),b.h-1),facePoint(b,side,L(a0+.3,b.h-1),b.h-1)],`rgba(242,251,252,${al})`);
  }
  for(let u2=2;u2<length-8;u2+=13)if(u2<u-8||u2>u+gw+2)window(d,b,side,u2,b.h*.42,7,6);
  {                                                                // 파란 간판
    const su=Math.min(length-13,u+gw+2.4);
    panel(d,b,side,su-.7,b.h*.58-.7,12.4,6,'#e7e4d6');
    panel(d,b,side,su,b.h*.58,11,4.6,M.jangseongSign);
    panel(d,b,side,su+2.4,b.h*.58+1,6.2,2.6,'#f2f5f8');
  }
  panel(d,b,side,0,b.h-1.8,length,1.8,'#f1eee0');
  panel(d,b,side,0,b.h-2.2,length,.4,'#9d998c');
}
// 사진2·3 · 취업진로부: 갈색 벽돌 기단 위에 크림색 3층.
function careerFacade(d,b,side) {
  const front=side==='front',length=front?b.w:b.d,M=WALL_MATERIALS;
  panel(d,b,side,0,0,length,b.h,gradient(d,facePoint(b,side,0,b.h),facePoint(b,side,length,0),
    [[0,shade(M.career,.06)],[.6,M.career],[1,shade(M.career,-.13)]]));
  wallTexture(d,b,side,0,7,length,b.h-7,'render',1.05); // Revision 60 · 크림색 도장면
  panel(d,b,side,0,0,length,7,gradient(d,facePoint(b,side,0,7),facePoint(b,side,length,0),
    [[0,shade(M.careerBrick,.1)],[.6,M.careerBrick],[1,shade(M.careerBrick,-.14)]]));
  masonry(d,b,side,length,M.careerBrick,0);
  wallTexture(d,b,side,0,0,length,7,'brick',1.1);      // Revision 60 · 갈색 벽돌 기단
  wallStains(d,b,side,0,length,b.h-2,wearOf(b));
  bandShadow(d,b,side,0,length,7,1.2,.3);
  panel(d,b,side,0,7,length,.8,'#f1eee0');
  for(const z of [9.2,16.6]) {                                     // 2·3층 창 띠
    for(let u=2.4;u<length-7;u+=9.4)window(d,b,side,u,z,6.4,5.6);
    panel(d,b,side,0,z+5.8,length,1.1,'#f1eee0');
  }
  for(let u=.8;u<length;u+=9.4){panel(d,b,side,u,7.8,1.2,b.h-10,'#e9e5d5');pierRelief(d,b,side,u,7.8,1.2,b.h-10,.8);}
  for(let u=2.4;u<length-5;u+=9.4)window(d,b,side,u,2.2,5,3.6);    // 1층 창
  panel(d,b,side,0,b.h-2,length,2,'#f1eee0');
  panel(d,b,side,0,b.h-2.5,length,.5,'#a8a396');
}

// 길게 이어지는 창 띠 한 토막. 흰 창틀 안에 유리와 촘촘한 멀리언이 들어간다.
function ribbon(d,b,side,from,to,z,h,frame='#eceadd',off=0) {
  const P=(u,zz)=>facePoint(b,side,u,zz,off);
  d.poly([P(from-.8,z-.9),P(to+.8,z-.9),P(to+.8,z+h+.9),P(from-.8,z+h+.9)],frame,null,.65);
  d.poly([P(from,z),P(to,z),P(to,z+h),P(from,z+h)],
    gradient(d,P(from,z+h),P(to,z),[[0,'#a8c3c4'],[.35,WALL_MATERIALS.glass],[1,'#2b4049']]),'#d7d9cf',.7);
  for(let u=from+3.4;u<to-.6;u+=3.4)d.line([P(u,z),P(u,z+h)],'#d9dbd0',.7);
  d.line([P(from,z+h*.62),P(to,z+h*.62)],'#c3d1cd',.6);
  d.line([P(from+.6,z+.7),P(from+(to-from)*.55,z+h-.6)],'#e2f0ea50',.8);
  glassFx(d,b,side,from,z,to-from,h,.9,off);                  // Revision 60
}

// 벽돌 1층의 줄눈. masonry() 와 달리 지정한 높이까지만, 지정한 구간에만 긋는다.
function machineBrickCourse(d,b,side,from,to,top) {
  const base=WALL_MATERIALS.machine;
  for(let z=1;z<top-.7;z+=1.4) {
    d.line([facePoint(b,side,from,z),facePoint(b,side,to,z)],shade(base,.18),.45);
    const offset=from+(Math.round(z/1.4)%2?1.9:0);
    for(let u=offset;u<to;u+=3.8)d.line([facePoint(b,side,u,z),facePoint(b,side,u,z+1.4)],'#e6ccaa22',.4);
  }
}

// 사진1 · 급식소 쪽 증축부: 밝은 회색 사각 외장 패널, 큰 유리창, 1층 가운데 카페 출입구와 짙은 파란 차양.
function machineAnnexFace(d,b,side,len) {
  const M=WALL_MATERIALS,G=M.machinePanel,J=M.machinePanelJoint;
  panel(d,b,side,0,0,len,b.h,gradient(d,facePoint(b,side,0,b.h),facePoint(b,side,len,0),
    [[0,shade(G,.07)],[.55,G],[1,shade(G,-.13)]]));
  for(let z=2.6;z<b.h-2.6;z+=5.4)d.line([facePoint(b,side,0,z),facePoint(b,side,len,z)],J+'99',.6);
  for(let u=0;u<=len;u+=6.4)d.line([facePoint(b,side,u,0),facePoint(b,side,u,b.h-2.6)],J+'7a',.55);
  wallTexture(d,b,side,0,0,len,b.h,'panel',.9);           // Revision 60 · 증축부 외장 패널(깨끗하게)
  ribbon(d,b,side,4.2,14.6,12.8,11.2);                    // 가운데 큰 2층 통유리(사진1 의 얼굴)
  ribbon(d,b,side,18.4,25.4,14.8,7.2);
  ribbon(d,b,side,29,35.2,14.8,7.2);
  ribbon(d,b,side,29,35.2,4.4,6.2);
  const cu=17.2,cw=9.6;                                   // 카페 출입구 — 어두운 유리 양문
  panel(d,b,side,cu-1,0,cw+2,9.4,'#dedcd2');
  panel(d,b,side,cu,.3,cw,8.5,gradient(d,facePoint(b,side,cu,8.8),facePoint(b,side,cu+cw,.3),
    [[0,'#a3b8ba'],[.4,'#3b5158'],[1,'#22343b']]),'#eceadd',.8);
  for(let i=1;i<4;i++)d.line([facePoint(b,side,cu+cw*i/4,.4),facePoint(b,side,cu+cw*i/4,8.7)],'#eceadd',.8);
  d.line([facePoint(b,side,cu,3),facePoint(b,side,cu+cw,3)],'#b9c2c0',.7);
  const A=(u,z,off)=>facePoint(b,side,u,z,off);           // 짙은 파란 차양 — 벽에서 비스듬히 튀어나온다
  d.poly([A(cu-1.6,10.5,0),A(cu+cw+1.6,10.5,0),A(cu+cw+1.6,9.3,3.6),A(cu-1.6,9.3,3.6)],M.machineAwning);
  d.poly([A(cu-1.6,9.3,3.6),A(cu+cw+1.6,9.3,3.6),A(cu+cw+1.6,8.4,3.6),A(cu-1.6,8.4,3.6)],M.machineAwningDark);
  for(let i=1;i<5;i++)d.line([A(cu-1.6+(cw+3.2)*i/5,10.5,0),A(cu-1.6+(cw+3.2)*i/5,9.3,3.6)],'#4d5c93',.7);
  panel(d,b,side,0,b.h-2.6,len,2.6,'#e6e4d8');            // 파라펫
  panel(d,b,side,0,b.h-3,len,.4,'#9c9a8e');
  panel(d,b,side,len-.5,0,1,b.h,'#b4b3aa');               // 벽돌 본동과 만나는 이음매
}

// 사진2 · 우측 출입구 옆 노란 프레임: 창을 감싸고 사선 보강재가 들어간, 살짝 돌출된 입체 프레임.
function machineYellowFrame(d,b,side) {
  const {from,to}=MACHINE_YELLOW,M=WALL_MATERIALS,Y=M.machineYellow,Yd=M.machineYellowDark,Yl=M.machineYellowLight;
  const top=b.h+2.4,O=1.6,P=(u,z)=>facePoint(b,side,u,z,O);
  for(const u of [from,to])                                             // 벽에서 튀어나온 옆면
    d.poly([facePoint(b,side,u,0),facePoint(b,side,u,top),P(u,top),P(u,0)],u===from?Yd:shade(Yd,.1));
  d.poly([facePoint(b,side,from,top),facePoint(b,side,to,top),P(to,top),P(from,top)],Yl);
  d.poly([P(from,0),P(to,0),P(to,top),P(from,top)],
    gradient(d,P(from,top),P(to,0),[[0,Yl],[.5,Y],[1,Yd]]));
  ribbon(d,b,side,from+3.4,to-3.4,12.8,11.4,'#fbf6e0',O);               // 감싸인 2층 통유리
  ribbon(d,b,side,from+3.4,to-3.4,3.2,6.4,'#fbf6e0',O);
  const a=from+2.4,c=to-2.4,bar=(u1,z1,u2,z2,wd)=>d.line([P(u1,z1),P(u2,z2)],Y,wd);
  bar(a,12.2,c,23.8,4.6);bar(c,12.2,a,23.8,4.6);                        // 사선 보강재 X
  bar(a,18,c,18,3);                                                     // 가운데 가로 부재
  bar(a,11.2,c,11.2,3.4);bar(a,24.8,c,24.8,3.4);
  d.line([P(from+.9,1),P(from+.9,top-1)],Yl,1.6);                       // 모서리 하이라이트
  d.line([P(to-.9,1),P(to-.9,top-1)],Yd,1.6);
}

function machineFacade(d,b,side) {
  const front=side==='front',length=front?b.w:b.d,M=WALL_MATERIALS;
  const annex=front?0:MACHINE_ANNEX,brickTop=11,u0=annex,len=length-annex;
  panel(d,b,side,u0,0,len,b.h,gradient(d,facePoint(b,side,u0,b.h),facePoint(b,side,length,0),
    [[0,shade(M.machineWhite,.05)],[.6,M.machineWhite],[1,shade(M.machineWhite,-.12)]]));
  wallTexture(d,b,side,u0,brickTop,len,b.h-brickTop,'render',.85);    // Revision 60 · 흰 도장면
  panel(d,b,side,u0,0,len,brickTop,gradient(d,facePoint(b,side,u0,brickTop),facePoint(b,side,length,0),
    [[0,shade(M.machine,.1)],[.6,M.machine],[1,shade(M.machine,-.15)]]));
  machineBrickCourse(d,b,side,u0,length,brickTop);
  wallTexture(d,b,side,u0,0,len,brickTop,'brick14',1.1);              // Revision 60 · 1층 벽돌
  wallStains(d,b,side,u0,len,b.h-2.6,wearOf(b));
  panel(d,b,side,u0,0,len,1.6,'#6c483c');                               // 걸레받이
  panel(d,b,side,u0,brickTop,len,.9,'#f2f0e4');                         // 벽돌과 흰 벽 사이 띠
  bandEdge(d,b,side,u0,len,brickTop+.9,.6);bandShadow(d,b,side,u0,len,brickTop,1.1,.3);
  for(const [z,h] of [[4.3,5.4],[14.8,6.4]])                            // 길게 이어지는 창 띠 두 줄
    for(let u=u0+3;u<length-9.5;u+=10.5){
      const end=Math.min(u+8.2,length-3),porch=b.doors.find(door=>door.id==='machine:right-front');
      if(z<10&&side==='right'&&porch&&end>porch.y-b.y-porch.width/2-1.4&&u<porch.y-b.y+porch.width/2+1.4)continue;
      ribbon(d,b,side,u,end,z,h);
    }
  panel(d,b,side,u0,b.h-2.6,len,2.6,'#f2f0e4');                         // 흰 파라펫
  panel(d,b,side,u0,b.h-3,len,.4,'#a9a496');
  bandEdge(d,b,side,u0,len,b.h,.7);bandShadow(d,b,side,u0,len,b.h-3,1.3,.28);
  if(annex)machineAnnexFace(d,b,side,annex);
  if(!front)machineYellowFrame(d,b,side);
}

export function facade(d,b,side) {
  if(b.id==='main'){mainFacade(d,b,side);return;}
  if(b.id==='machine'){machineFacade(d,b,side);return;}
  if(b.id==='dreamhall'){dreamhallFacade(d,b,side);return;}
  if(b.id==='cafeteria'){cafeteriaFacade(d,b,side);return;}
  if(b.id==='jangseong'){jangseongFacade(d,b,side);return;}
  if(b.id==='career'){careerFacade(d,b,side);return;}
  const front=side==='front',length=front?b.w:b.d;
  const brick=b.id==='architecture'||b.id==='machine';
  const white=b.id==='electric';
  const base=WALL_MATERIALS[b.id]||(white?WALL_MATERIALS.white:'#d3cbb7');
  panel(d,b,side,0,0,length,b.h,gradient(d,facePoint(b,side,0,b.h),facePoint(b,side,length,0),
    [[0,shade(base,front?.08:-.04)],[.6,base],[1,shade(base,-.15)]]));
  // Revision 60 · 벽돌 건물은 벽돌, 흰 벽·민트 벽은 도장된 콘크리트로 읽히게 한다.
  wallTexture(d,b,side,0,0,length,b.h,(brick||b.id==='gym')?'brick':'render',b.id==='gym'?.8:brick?1.05:.85);
  if(b.id==='electric'&&!front) {               // 사진7 · 우측 입구를 지나면 흰 벽에서 붉은 벽돌로 바뀐다
    const cut=length*.5,bk=WALL_MATERIALS.electricBrick;
    panel(d,b,side,0,0,cut,b.h,gradient(d,facePoint(b,side,0,b.h),facePoint(b,side,cut,0),
      [[0,shade(bk,.08)],[.6,bk],[1,shade(bk,-.15)]]));
    masonry(d,b,side,cut,bk,0);
    wallTexture(d,b,side,0,0,cut,b.h,'brick',1.1);     // Revision 60
    panel(d,b,side,cut-.7,0,1.4,b.h,WALL_MATERIALS.frame);
    pierRelief(d,b,side,cut-.7,0,1.4,b.h,.8);
  }
  if(b.id==='civil') {                          // 사진7 · 민트색 벽, 흰 창틀과 기둥, 옥상 난간이 있는 짙은 초록 파라펫
    const M=WALL_MATERIALS;
    wallStains(d,b,side,0,length,b.h-2.4,wearOf(b));   // Revision 60
    panel(d,b,side,0,0,length,2.6,M.civilTrim);
    for(const z of [4.5,15.5]) {
      for(let u=2.6;u<length-6;u+=9.2)window(d,b,side,u,z,6.2,7.4);
      panel(d,b,side,0,z-1.1,length,1.1,M.civilTrim);
      panel(d,b,side,0,z+7.4,length,1.3,M.civilTrim);
    }
    for(let u=.8;u<length;u+=9.2){panel(d,b,side,u,2.6,1.6,b.h-5,M.civilTrim);pierRelief(d,b,side,u,2.6,1.6,b.h-5,.8);}
    panel(d,b,side,0,b.h-2.4,length,2.4,M.civilCap);
    bandShadow(d,b,side,0,length,b.h-2.4,1.3,.3);
    for(let u=1.5;u<length;u+=2.6)d.line([facePoint(b,side,u,b.h),facePoint(b,side,u,b.h+2.6)],'#8e9a90',.8);
    d.line([facePoint(b,side,0,b.h+2.6),facePoint(b,side,length,b.h+2.6)],'#9aa79c',1.4);
    d.line([facePoint(b,side,0,b.h+1.5),facePoint(b,side,length,b.h+1.5)],'#9aa79c',1);
    panel(d,b,side,0,b.h-2.8,length,.4,'#3d5a40');
    return;
  }
  if(brick||b.id==='gym')masonry(d,b,side,length,base,0,b.id==='gym'?1:0);
  wallStains(d,b,side,0,length,b.h-2,wearOf(b));      // Revision 60 · 발치 흙때·빗물 자국(건물 유형별 강도)
  // 원본과 같이 '벽돌이 아닌 건물'에만 가로 줄을 긋는다(Revision 59 에서 건축디자인과에도 그어지던 실수 복구).
  if(!(brick||b.id==='gym'))for(let z=5;z<b.h-2;z+=6)
    d.line([facePoint(b,side,0,z),facePoint(b,side,length,z)],'#727c762b',.6);
  panel(d,b,side,0,0,length,2,'#8e9690');
  if(b.id==='gym') {
    if(front)for(let u=5;u<length-10;u+=18) {
      glassPanel(d,b,side,u,b.h-7,12,4);
      panel(d,b,side,u-3,2,2.8,b.h-4,WALL_MATERIALS.column);
      wallTexture(d,b,side,u-3,2,2.8,b.h-4,'render',.9);
      panel(d,b,side,u-3,2,.6,b.h-4,'#e0b69c');
      pierRelief(d,b,side,u-3,2,2.8,b.h-4,1.1);          // Revision 60 · 기둥 입체(좌 빛·우 그늘·벽 그림자)
    }
    else {
      panel(d,b,side,length*.47,2,6,b.h-3,WALL_MATERIALS.column);
      wallTexture(d,b,side,length*.47,2,6,b.h-3,'render',.9);
      pierRelief(d,b,side,length*.47,2,6,b.h-3,1.1);
      glassPanel(d,b,side,length*.47+1,b.h*.38,3.7,4.5);
    }
  } else if(front&&['architecture','electric','machine','main'].includes(b.id)) {
    if(b.id==='machine')window(d,b,side,length*.31,b.h*.43,5.5,6);
    if(b.id==='main') {
      window(d,b,side,length*.45,b.h-13,7,8);
      panel(d,b,side,0,0,length,1.5,'#8bb8c3');
    }
  } else {
    const floors=b.id==='architecture'?[3.5]:Array.from({length:Math.max(1,Math.floor(b.h/13))},(_,i)=>4+i*13);
    for(const z of floors) {
      for(let u=4;u<length-9;u+=12)window(d,b,side,u,z,8,b.id==='architecture'?7:8.2);
      panel(d,b,side,0,z+9,length,1.5,WALL_MATERIALS.frame);
      bandEdge(d,b,side,0,length,z+10.5,.6);bandShadow(d,b,side,0,length,z+9,1.2,.3);   // Revision 60
    }
    if(brick||white)for(let u=1;u<length;u+=12){panel(d,b,side,u,2,1.2,b.h-3,WALL_MATERIALS.frame);pierRelief(d,b,side,u,2,1.2,b.h-3,.8);}
  }
  panel(d,b,side,0,b.h-2,length,2,WALL_MATERIALS.frame);
  panel(d,b,side,0,b.h-2.7,length,.6,'#364f4940');
  bandEdge(d,b,side,0,length,b.h,.7);bandShadow(d,b,side,0,length,b.h-2.7,1.2,.26);   // Revision 60 · 파라펫
}

export function drawGymRoof(d,b,color) {
  const {x,y,w,d:depth,h}=b,rise=12,segments=24;
  const arc=(u)=>h+Math.sin(u*Math.PI)*rise;
  for(let i=0;i<segments;i++) {
    const a=i/segments,c=(i+1)/segments;
    d.poly([{x,y:y+depth*a,z:arc(a)},{x:x+w,y:y+depth*a,z:arc(a)},
      {x:x+w,y:y+depth*c,z:arc(c)},{x,y:y+depth*c,z:arc(c)}],
      shade(color,.25-Math.max(0,a-.25)*.65));
  }
  // Revision 60 · 금속 지붕 표면: 판마다 아주 약한 톤 차이, 볕 받는 쪽 광택 띠, 처마 쪽 흐름 자국.
  for(let i=0;i<segments;i++) {
    const a=i/segments,c=(i+1)/segments,k=rand(i*7.3+1.1);
    const spec=Math.max(0,.2-Math.abs(a-.3)*.8),dirt=Math.max(0,.1-Math.min(a,1-a)*.5);
    const quad=[{x,y:y+depth*a,z:arc(a)+.03},{x:x+w,y:y+depth*a,z:arc(a)+.03},{x:x+w,y:y+depth*c,z:arc(c)+.03},{x,y:y+depth*c,z:arc(c)+.03}];
    if(spec>.01)d.poly(quad,`rgba(235,248,252,${spec.toFixed(3)})`);
    d.poly(quad,k>.5?`rgba(255,255,255,${((k-.5)*.08).toFixed(3)})`:`rgba(10,40,52,${((.5-k)*.1+dirt).toFixed(3)})`);
  }
  for(let u=2;u<w;u+=4) {
    const points=Array.from({length:segments+1},(_,i)=>({x:x+u,y:y+depth*i/segments,z:arc(i/segments)+.1}));
    d.line(points.map(p=>({...p,x:p.x+.45})),'rgba(16,58,72,.34)',.8);   // Revision 60 · 골 그늘(판 이음이 입체로 읽힌다)
    d.line(points,'#b4d4df80',.7);
  }
  for(let u=3;u<w;u+=9) {                                            // Revision 60 · 처마로 흘러내린 옅은 자국
    const r=rand(u*3.9),l=.12+r*.16;
    for(const end of [0,1]) {
      const pts=Array.from({length:6},(_,i)=>{const t=end?1-l*i/5:l*i/5;return{x:x+u+r*1.5,y:y+depth*t,z:arc(t)+.12};});
      d.line(pts,`rgba(20,52,60,${(.14+r*.1).toFixed(3)})`,1.3);
    }
  }
  for(const endX of [x,x+w]) {
    const rim=Array.from({length:segments+1},(_,i)=>({x:endX,y:y+depth*i/segments,z:arc(i/segments)+2}));
    if(endX===x+w)d.poly([{x:endX,y,z:h},...rim.map(p=>({...p,z:p.z-2})),{x:endX,y:y+depth,z:h}],'#bdada0');
    d.poly([...rim,...rim.slice().reverse().map(p=>({...p,z:p.z-3.5}))],'#aeb7bb');
    d.line(rim,'#e0e5e4',1.1);
  }
}
