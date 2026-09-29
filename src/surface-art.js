// Revision 60 · 건물 외벽 표면 질감.
//
// 이 파일은 "벽이 무슨 재질로 보이는가"만 다룬다. 건물의 크기·위치·창과 문 자리·그리는 순서는
// facade-art.js / building-art.js 가 정하고, 여기 함수들은 이미 그려진 면 위에 **반투명 덧칠**만 한다.
// 그래서 roof reveal(가릴 때 globalAlpha .42)도 그대로 따라간다 — 여기서는 globalAlpha 를 곱하기만 하고
// 절대값으로 덮어쓰지 않는다.
//
// 핵심 기법: 벽 한 면의 좌표 (u = 벽을 따라, z = 높이)는 화면 좌표와 1차(아핀) 관계다.
// 그래서 캔버스 변환을 그 면에 맞춰 두면, 손으로 칠한 타일 한 장을 패턴으로 깔아 벽 전체를 한 번에 칠할 수 있다.
// 작은 다각형 수백 개 대신 채우기 한 번이라 가볍고, 벽돌 한 장 한 장의 색 차이까지 일반 줌에서 읽힌다.
import {facePoint,gradient} from './facade-art.js';

const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const rgba=(r,g,b,a)=>`rgba(${r|0},${g|0},${b|0},${Math.max(0,Math.min(1,a)).toFixed(3)})`;

// 건물 유형별 사용감. 1 = 보통. 본관은 정돈, 실습동·체육관은 조금 더, 오래된 시설은 더, 현대식 패널은 깨끗하게.
export const WEAR={
  main:.72,            // 본관 · 가장 정돈된 건물
  gym:1.05,            // 장성관 · 넓은 벽이라 사용감이 잘 보인다
  machine:1.1, electric:1, architecture:1.05, civil:.95,   // 실습동
  cafeteria:1.3, career:1.25,                             // 오래된 시설
  jangseong:.95,
  dreamhall:.5         // 현대식 흰 금속 패널 · 깨끗하게
};
export const wearOf=b=>WEAR[b.id]??1;

// 값 잡음(타일 경계에서 이어지도록 주기적으로 감는다)
function noise(cells,seed){
  const v=Array.from({length:cells*cells},(_,i)=>hash(i*1.31+seed*7.7));
  const s=t=>t*t*(3-2*t);
  return (u,w)=>{
    const fx=u*cells,fy=w*cells,x0=Math.floor(fx)%cells,y0=Math.floor(fy)%cells,x1=(x0+1)%cells,y1=(y0+1)%cells;
    const tx=s(fx-Math.floor(fx)),ty=s(fy-Math.floor(fy));
    const a=v[y0*cells+x0]+(v[y0*cells+x1]-v[y0*cells+x0])*tx,b=v[y1*cells+x0]+(v[y1*cells+x1]-v[y1*cells+x0])*tx;
    return a+(b-a)*ty;
  };
}

// ── 타일(투명 바탕 덧칠용) ─────────────────────────────────────────────
// 타일 한 장은 면 좌표계에서 S px = 1 칸. 패턴 y 가 아래로 늘면 면에서는 z 가 위로 는다.
const TILES=new Map(),PATTERNS=new Map();
function tile(key,w,h,paint){
  if(!TILES.has(key)){const cv=document.createElement('canvas');cv.width=w;cv.height=h;paint(cv.getContext('2d'),w,h);TILES.set(key,cv);}
  return TILES.get(key);
}

// 벽돌: masonry() 의 격자(줄 높이 ch, 벽돌 길이 bl, z0 에서 시작, 첫 줄은 반 장 밀림)에 정확히 맞춘다.
// 벽돌마다 명도·온도 차이, 윗모서리 밝은 선과 아랫모서리 그림자(살짝 튀어나온 입체), 표면 알갱이, 밝은 줄눈.
const BRICK_S=12;
function brickTile(ch,bl,z0){
  const S=BRICK_S,rows=8,cols=8,W=Math.round(cols*bl*S),H=Math.round(rows*ch*S);
  return tile(`brick:${ch}:${bl}:${z0}`,W,H,(c)=>{
    for(let k=0;k<rows;k++){
      const off=(k%2===0?bl/2:0);
      for(let j=-1;j<=cols;j++){
        const key=k*97+j*13;
        const r=hash(key+.5),t=hash(key*3.3+1.7);
        const bx=(off+j*bl)*S,by=((z0+k*ch)*S)%H,bw=bl*S,bh=ch*S;
        for(const dy of [0,-H])for(const dx of [0,W,-W]){
          const x=bx+dx,y=by+dy;
          if(x>W||x+bw<0||y>H||y+bh<0)continue;
          // 벽돌 한 장의 색 — 어둡게 / 밝게 / 따뜻하게 / 차갑게
          if(r<.28)c.fillStyle=rgba(38,16,10,.10+r*.45);
          else if(r>.74)c.fillStyle=rgba(255,232,210,.07+(r-.74)*.55);
          else if(t>.72)c.fillStyle=rgba(214,118,70,.13);
          else if(t<.16)c.fillStyle=rgba(92,92,104,.10);
          else c.fillStyle=rgba(0,0,0,0);
          c.fillRect(x+1,y+1,bw-2,bh-2);
          c.fillStyle=rgba(255,238,220,.20);c.fillRect(x+1,y+bh-2.2,bw-2,1.2);        // 윗모서리(면 좌표에서 위 = 타일 아래)
          c.fillStyle=rgba(30,12,8,.26);c.fillRect(x+1,y+1,bw-2,1.3);                  // 아랫모서리 그림자
          c.fillStyle=rgba(30,12,8,.16);c.fillRect(x+bw-2.2,y+1,1.2,bh-2);             // 오른쪽 그림자
          for(let s=0;s<7;s++){                                                        // 표면 알갱이
            const sx=x+2+hash(key*7.1+s)*(bw-4),sy=y+2+hash(key*5.3+s*1.9)*(bh-4);
            c.fillStyle=s%2?rgba(255,240,225,.22):rgba(20,8,4,.22);c.fillRect(sx,sy,1.2,1.2);
          }
          if(hash(key*9.1)<.12){c.fillStyle=rgba(30,12,8,.22);c.beginPath();c.moveTo(x+bw-1,y+bh-1);c.lineTo(x+bw-5,y+bh-1);c.lineTo(x+bw-1,y+bh-4);c.fill();} // 모서리 깨짐
        }
      }
      // 가로 줄눈
      c.fillStyle=rgba(232,222,206,.30);c.fillRect(0,((z0+k*ch)*S)%H-.6,W,1.2);
    }
  });
}

// 도장된 콘크리트(흰 벽·민트 벽·크림 벽): 넓은 얼룩 + 미세 알갱이 + 흙손 결 + 작은 기공.
function renderTile(){
  return tile('render',320,320,(c,W,H)=>{
    const big=noise(4,5),mid=noise(11,9);
    const img=c.createImageData(W,H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const m=(big(x/W,y/H)-.5)*1.3+(mid(x/W,y/H)-.5)*.8+(hash(y*W+x)-.5)*.55;
      const i=(y*W+x)*4,light=m>0;
      img.data[i]=light?255:40;img.data[i+1]=light?252:36;img.data[i+2]=light?244:30;
      img.data[i+3]=Math.min(40,Math.abs(m)*36)|0;
    }
    c.putImageData(img,0,0);
    for(let i=0;i<18;i++){                                   // 흙손 결 — 옅은 가로 붓질
      const y=hash(i+3)*H,x=hash(i+33)*W,l=40+hash(i+63)*90;
      c.strokeStyle=i%2?rgba(255,255,250,.10):rgba(60,55,45,.07);c.lineWidth=2+hash(i+93)*3;
      c.beginPath();c.moveTo(x,y);c.lineTo(x+l,y+(hash(i+7)-.5)*6);c.stroke();
    }
    for(let i=0;i<140;i++){c.fillStyle=rgba(40,36,30,.18);c.fillRect(hash(i+500)*W,hash(i+900)*H,1.1,1.1);}  // 기공
  });
}

// 금속 외장 패널: 가로 헤어라인 + 은은한 광택 띠 + 드문 점.
function panelTile(){
  return tile('panel',256,160,(c,W,H)=>{
    for(let y=0;y<H;y+=1.5){
      const r=hash(y*3.7);
      c.fillStyle=r>.5?rgba(255,255,255,.05+r*.07):rgba(40,44,48,.04+r*.06);
      c.fillRect(0,y,W,1);
    }
    const g=c.createLinearGradient(0,0,W,0);
    g.addColorStop(0,rgba(255,255,255,0));g.addColorStop(.45,rgba(255,255,255,.12));g.addColorStop(.6,rgba(255,255,255,0));
    c.fillStyle=g;c.fillRect(0,0,W,H);
    for(let i=0;i<60;i++){c.fillStyle=rgba(60,60,60,.18);c.fillRect(hash(i+11)*W,hash(i+41)*H,1,1);}
  });
}

// 화강석 기단: 소금·후추 알갱이 + 얼룩.
function graniteTile(){
  return tile('granite',192,96,(c,W,H)=>{
    const big=noise(3,21);
    const img=c.createImageData(W,H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const i=(y*W+x)*4,r=hash(y*W+x+77),m=big(x/W,y/H)-.5;
      if(r<.035){img.data[i]=40;img.data[i+1]=38;img.data[i+2]=34;img.data[i+3]=80;}
      else if(r>.975){img.data[i]=255;img.data[i+1]=252;img.data[i+2]=246;img.data[i+3]=70;}
      else{img.data[i]=m>0?255:50;img.data[i+1]=m>0?250:46;img.data[i+2]=m>0?240:40;img.data[i+3]=Math.abs(m)*48|0;}
    }
    c.putImageData(img,0,0);
  });
}

function pattern(c,key,make){
  if(!PATTERNS.has(key))PATTERNS.set(key,c.createPattern(make(),'repeat'));
  return PATTERNS.get(key);
}

// 벽 한 면의 직사각형 (u, z, w, h)을 재질 타일로 덧칠한다.
function faceFill(d,b,side,u,z,w,h,pat,scale,alpha,off=0){
  const c=d.c,O=facePoint(b,side,0,0,off),A=facePoint(b,side,1,0,off),V=facePoint(b,side,0,1,off);
  const o=d.p(O.x,O.y,O.z),a=d.p(A.x,A.y,A.z),v=d.p(V.x,V.y,V.z);
  c.save();
  c.transform(a.x-o.x,a.y-o.y,v.x-o.x,v.y-o.y,o.x,o.y);
  pat.setTransform(new DOMMatrix().scale(scale));
  c.globalAlpha*=alpha;c.fillStyle=pat;c.fillRect(u,z,w,h);
  c.restore();
}

// kind: 'brick' | 'brick14'(자동화기계과 1층) | 'render' | 'panel' | 'granite'
export function wallTexture(d,b,side,u,z,w,h,kind,strength=1){
  const c=d.c;
  // 캔버스가 없는 환경(노드 테스트의 가짜 컨텍스트 등)에서는 질감만 건너뛴다. 모양·순서·반투명 판정은 그대로다.
  if(typeof document==='undefined'||!c.createPattern||!c.transform)return;
  if(kind==='brick')faceFill(d,b,side,u,z,w,h,pattern(c,'brick',()=>brickTile(1.5,4,1)),1/BRICK_S,Math.min(1,.9*strength));
  else if(kind==='brick14')faceFill(d,b,side,u,z,w,h,pattern(c,'brick14',()=>brickTile(1.4,3.8,1)),1/BRICK_S,Math.min(1,.9*strength));
  else if(kind==='render')faceFill(d,b,side,u,z,w,h,pattern(c,'render',renderTile),1/11,Math.min(1,.95*strength));
  else if(kind==='panel')faceFill(d,b,side,u,z,w,h,pattern(c,'panel',panelTile),1/14,Math.min(1,strength));
  else if(kind==='granite')faceFill(d,b,side,u,z,w,h,pattern(c,'granite',graniteTile),1/18,Math.min(1,strength));
}

// 생활 오염: 발치 흙때, 파라펫에서 흘러내린 빗물 자국, 드문 습기 얼룩. 모두 창보다 먼저 그려 벽에만 남는다.
export function wallStains(d,b,side,u0,len,top,wear=1){
  if(wear<=0)return;
  const P=(u,z)=>facePoint(b,side,u,z),seed=(b.id.length*31+(side==='front'?7:3))*1.7;
  const grime=Math.min(.34,.26*wear),gh=4+wear*4;
  d.poly([P(u0,0),P(u0+len,0),P(u0+len,gh),P(u0,gh)],
    gradient(d,P(u0,0),P(u0,gh),[[0,rgba(66,56,44,grime)],[.35,rgba(66,56,44,grime*.45)],[1,rgba(66,56,44,0)]]));
  d.poly([P(u0,0),P(u0+len,0),P(u0+len,.9),P(u0,.9)],rgba(52,44,36,.12*wear));   // 빗물 튄 자국
  for(let u=u0+1+hash(seed)*5,i=0;u<u0+len-1;i++){
    const r=hash(seed+i*3.1),wd=.7+r*1.2,l=(3+hash(seed+i*5.7)*9)*Math.min(1.3,wear+.2);
    const a=(.05+r*.065)*wear;                               // 흐름 자국은 옅게 — 흰 벽이 지저분해 보이지 않게
    d.poly([P(u,top),P(u+wd,top),P(u+wd*.85,top-l*.45),P(u+wd*.15,top-l*.45)],rgba(62,56,48,a));
    d.poly([P(u+wd*.15,top-l*.45),P(u+wd*.85,top-l*.45),P(u+wd*.7,top-l),P(u+wd*.3,top-l)],rgba(62,56,48,a*.45));
    u+=4.5+hash(seed+i*7.3)*9;
  }
  for(let i=0;i<Math.round(len/26);i++){                    // 드문 습기 얼룩
    const u=u0+hash(seed+i*11.3)*len,z=2+hash(seed+i*13.9)*(top-6),r=1.6+hash(seed+i*17.1)*2.6;
    d.poly([P(u-r,z-r*.6),P(u+r,z-r*.7),P(u+r*.8,z+r*.6),P(u-r*.7,z+r*.5)],rgba(70,62,52,.05*wear));
  }
}

// 튀어나온 띠·파라펫·창대 바로 아래에 지는 그림자(앰비언트 오클루전).
export function bandShadow(d,b,side,u0,len,z,depth=1.3,a=.3){
  const P=(u,zz)=>facePoint(b,side,u,zz),m=z-depth*.4;
  d.poly([P(u0,z),P(u0+len,z),P(u0+len,m),P(u0,m)],rgba(28,18,12,a*.8));             // 바로 아래 진한 그늘
  d.poly([P(u0,m),P(u0+len,m),P(u0+len,z-depth),P(u0,z-depth)],rgba(28,18,12,a*.3)); // 그 아래 옅은 그늘
}
// 띠 윗면 밝은 모서리.
export function bandEdge(d,b,side,u0,len,z,a=.55){
  d.line([facePoint(b,side,u0,z),facePoint(b,side,u0+len,z)],rgba(255,253,244,a),.9);
}

// 세로 기둥·기둥띠의 입체: 왼쪽 빛, 오른쪽 그늘, 그리고 기둥 옆 벽에 떨어지는 그림자.
export function pierRelief(d,b,side,u,z,w,h,k=1){
  const P=(uu,zz)=>facePoint(b,side,uu,zz);
  d.poly([P(u,z),P(u+w*.28,z),P(u+w*.28,z+h),P(u,z+h)],rgba(255,255,250,.34*k));
  d.poly([P(u+w*.7,z),P(u+w,z),P(u+w,z+h),P(u+w*.7,z+h)],rgba(40,30,26,.26*k));
  d.poly([P(u+w,z),P(u+w+.45,z),P(u+w+.45,z+h),P(u+w,z+h)],rgba(30,20,16,.24*k));
  d.poly([P(u+w+.45,z),P(u+w+.95,z),P(u+w+.95,z+h),P(u+w+.45,z+h)],rgba(30,20,16,.09*k));
}

// 유리: 윗단 하늘 반사, 아랫단 실내 깊이, 사선 반사 띠 두 줄, 창틀 안쪽 오목 그림자.
// 원래 창 그림(틀·멀리언·창대)은 그대로 두고 그 위에만 얹는다. off 는 벽에서 튀어나온 창(노란 프레임 등).
export function glassFx(d,b,side,u,z,w,h,k=1,off=0){
  const P=(uu,zz)=>facePoint(b,side,uu,zz,off);
  const r=hash(u*3.17+z*7.31+(side==='front'?11:0)),sh=(r-.5)*.16;
  const band=(a0,a1,b0,b1,al)=>d.poly([P(u+w*(a0+sh),z),P(u+w*(a1+sh),z),P(u+w*(b1+sh),z+h),P(u+w*(b0+sh),z+h)],rgba(242,251,252,al*k));
  d.poly([P(u,z+h*.7),P(u+w,z+h*.7),P(u+w,z+h),P(u,z+h)],rgba(230,243,245,.3*k));          // 하늘 반사(윗단)
  band(.1,.3,.36,.56,.2+r*.06);                                                          // 사선 반사
  // 화면에서 작게 보이는 창(먼 줌)은 여기까지만 — 그릴 거리를 줄여 전체 맵에서도 가볍게 유지한다.
  const p0=d.p(P(u,z).x,P(u,z).y,P(u,z).z),p1=d.p(P(u+w,z).x,P(u+w,z).y,P(u+w,z).z);
  if(Math.hypot(p1.x-p0.x,p1.y-p0.y)<26)return;
  d.poly([P(u,z),P(u+w,z),P(u+w,z+h*.26),P(u,z+h*.26)],rgba(6,16,22,.24*k));             // 실내 깊이(아랫단)
  if(r>.3)band(.6,.66,.8,.86,.14);
  d.poly([P(u,z),P(u+.28,z),P(u+.28,z+h-.32),P(u+w,z+h-.32),P(u+w,z+h),P(u,z+h)],rgba(12,22,28,.36*k));   // 창틀 안쪽 오목 그림자(위·왼쪽)
}

// 창대(sill) 강조: 윗면 하이라이트와 아래로 떨어지는 그림자.
export function sillFx(d,b,side,u,z,w,k=1){
  const P=(uu,zz)=>facePoint(b,side,uu,zz);
  d.line([P(u-.7,z-.12),P(u+w+.7,z-.12)],rgba(255,255,250,.7*k),.8);
  d.poly([P(u-.7,z-.8),P(u+w+.7,z-.8),P(u+w+.5,z-1.6),P(u-.5,z-1.6)],rgba(28,18,12,.24*k));   // 창대 아래 그림자(한 겹)
}
