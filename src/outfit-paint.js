// ── 옷 장비 픽셀 칠하기 (2026-09-27) ──────────────────────────────
// 옷은 캐릭터 위에 그림을 한 장 얹지 않는다. 홍길동 스프라이트의 각 프레임에서 '옷이 있는 픽셀'을 찾아(분할),
// 같은 픽셀을 새 옷의 색과 무늬로 다시 칠한다. 그래서 옷은 모든 프레임에서 몸과 똑같이 움직이고, 크기 · 위치가 흔들리지 않으며,
// 원래 그림의 주름 · 명암(밝기)을 그대로 이어받는다. 기본 교복 픽셀은 하나도 남지 않는다(옷 영역 전체를 다시 칠한다).
//
// 이 파일은 순수 계산만 한다(캔버스 없음). 브라우저에서는 outfit-art.js 가 시트 이미지의 픽셀을 넘겨주고,
// 노드 테스트 · QA 스크립트는 PNG 를 직접 풀어 같은 함수를 부른다.
//
// 1) 색 분류: 피부 · 머리/외곽선(어두움) · 남색(재킷) · 갈색(벨트 · 가방 · 신발) · 밝음(셔츠 · 재킷 테두리)
// 2) 프레임 기준점: 목(깃 윗선) · 몸 가운데 · 벨트(바지 시작) · 발목 · 무릎 · 재킷 밑단
// 3) 팔: outfit-rig.js 의 어깨 · 팔꿈치 · 손 선분 둘레(캡슐)에 든 재킷 픽셀 = 소매. 어깨 0 → 손 1 의 위치 t 도 기록한다.
// 4) 칠하기: 영역별로 옷 레시피(outfits.js)가 색을 정하고, 원래 픽셀의 밝기 비율로 명암을 입힌다.
//    몸 바깥 윤곽선은 언제나 어둡게 남겨 도트 그림의 선이 유지된다.

export const REGION={BG:0,KEEP:1,HAND:2,TORSO:3,SLEEVE:4,TRIM:5,SLEEVE_TRIM:6,SHIRT:7,PANTS:8,SHOES:9,GEAR:10,ADDED:11};
const C={BG:0,DARK:1,BLUE:2,BROWN:3,LIGHT:4,SKIN:5};
export const COLOR_CLASS=C;

// 픽셀 하나의 색 분류(0~255 값).
export function colorClass(r,g,b,a){
 if(a<=10)return C.BG;
 const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/510;
 const s=mx===mn?0:(mx-mn)/255/Math.max(1e-6,1-Math.abs(2*l-1));
 const skin=r>g&&g>b&&r>140&&r-b>46&&l>.45;
 if(skin)return C.SKIN;
 if(b>r+10&&b>=g)return C.BLUE;
 if(r>g+15&&g>=b-5&&l<.5&&s>.45)return C.BROWN;
 if(l>.55&&s<.35)return C.LIGHT;
 return C.DARK;
}
export const luminance=(r,g,b)=>(.299*r+.587*g+.114*b)/255;

// 점과 선분 사이 거리. 할당 없이 결과를 SEG 에 넣는다(픽셀마다 불리므로).
const SEG={d:0,u:0};
function segmentDistance(px,py,ax,ay,bx,by){
 const dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy||1;
 const u=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/len));
 const qx=ax+dx*u-px,qy=ay+dy*u-py;
 SEG.d=Math.sqrt(qx*qx+qy*qy);SEG.u=u;return SEG;
}
// 팔 하나에 대해 (x,y) 가 소매 안인지. 안이면 {d, t(0 어깨 ~ .5 팔꿈치 ~ 1 손)}, 아니면 null.
export function armHit(arm,x,y){
 const [sx,sy,ex,ey,hx,hy,flags,r=13]=arm;
 let d=Infinity,t=0;
 if(flags&1){const h=segmentDistance(x,y,sx,sy,ex,ey);if(h.d<=r){d=h.d;t=h.u*.5;}}
 if(flags&2){const h=segmentDistance(x,y,ex,ey,hx,hy);if(h.d<=r*.92&&h.d<d){d=h.d;t=.5+h.u*.5;}}
 return d===Infinity?null:{d,t};
}

// 프레임 하나를 영역으로 나눈다. data: RGBA 전체 시트, width: 시트 너비, fx: 프레임 왼쪽 x, size: 프레임 한 변.
// arms: ARM_RIG 의 그 프레임 값. view: 'front' · 'back' · 'right'(왼쪽도 오른쪽 프레임을 쓴다).
export function segmentFrame(data,width,fx,size,arms,view){
 const n=size*size,cls=new Uint8Array(n),label=new Uint8Array(n),armId=new Uint8Array(n),armT=new Uint8Array(n),lum=new Float32Array(n);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=((y*width)+fx+x)*4,k=y*size+x;
  cls[k]=colorClass(data[i],data[i+1],data[i+2],data[i+3]);
  lum[k]=luminance(data[i],data[i+1],data[i+2]);
 }
 const visible=arms.filter(a=>a[6]);
 const shoulders=arms.map(a=>[a[0],a[1]]);
 const cx=(shoulders[0][0]+shoulders[1][0])/2;
 const topShoulder=Math.min(shoulders[0][1],shoulders[1][1]);
 // 목(깃 윗선): 어깨 높이 근처에서, 몸 가운데 ±40px 띠에 재킷(남색) 픽셀이 처음으로 10개 이상 나오는 줄.
 // (눈동자의 푸른 반사처럼 얼굴 안의 작은 남색 점은 10개에 못 미친다.)
 let neckY=topShoulder-12;
 for(let y=Math.max(0,topShoulder-45);y<topShoulder+25;y++){
  let c=0;for(let x=Math.round(cx-40);x<=cx+40;x++)if(cls[y*size+x]===C.BLUE)c++;
  if(c>=10){neckY=y;break;}
 }
 // 벨트(바지 시작): 몸 가운데 갈색 픽셀의 가운데 줄. 없으면(뒷모습) 재킷 밑단.
 // 주먹을 몸 앞에 든 프레임은 주먹(갈색으로 읽히는 살색)이 벨트로 잡히지 않게, 보이는 손 둘레 18px 는 뺀다.
 const fists=arms.filter(a=>a[6]&2).map(a=>[a[4],a[5]]);
 const nearHandPoint=(x,y)=>fists.some(([hx,hy])=>(x-hx)**2+(y-hy)**2<324);
 const beltRows=[];
 for(let y=neckY+30;y<Math.min(size,neckY+150);y++){let c=0;for(let x=Math.round(cx-26);x<=cx+26;x++)if(cls[y*size+x]===C.BROWN&&!nearHandPoint(x,y))c++;if(c>=5)beltRows.push(y);}
 let hem=neckY;
 for(let y=neckY;y<size;y++){let c=0;for(let x=Math.round(cx-40);x<=cx+40;x++)if(cls[y*size+x]===C.BLUE)c++;if(c>=6)hem=y;}
 const pantsTop=view==='back'||!beltRows.length?hem-4:beltRows[Math.floor(beltRows.length/2)]+4;
 // 신발 윗선(발목): 맨 아래에서부터 갈색이 이어지는 띠의 윗줄(두 줄 넘게 끊기면 멈춘다 — 허리 가방은 넣지 않는다).
 let shoeTop=size,gap=0,seen=false;
 for(let y=size-1;y>pantsTop+40;y--){
  let c=0;for(let x=0;x<size;x++)if(cls[y*size+x]===C.BROWN)c++;
  if(c>=2){shoeTop=y;seen=true;gap=0;}else if(seen&&++gap>2)break;
 }
 const ankle=shoeTop,knee=Math.round(pantsTop+(ankle-pantsTop)*.52);
 // 신발 둘레 3px(발목 아래만): 신발 외곽선을 신발로 묶는 데 쓴다.
 const nearBrown=new Uint8Array(n);
 for(let y=Math.max(0,ankle-3);y<size;y++)for(let x=0;x<size;x++)if(cls[y*size+x]===C.BROWN)
  for(let yy=Math.max(ankle,y-3);yy<=Math.min(size-1,y+3);yy++)for(let xx=Math.max(0,x-3);xx<=Math.min(size-1,x+3);xx++)nearBrown[yy*size+xx]=1;
 // 불투명 픽셀이 있는 범위만 훑는다.
 let minX=size,maxX=-1,minY=size,maxY=-1;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(cls[y*size+x]!==C.BG){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
 // 픽셀별 영역
 const armList=arms.map((a,i)=>[a,i+1]).filter(([a])=>a[6]);
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
  const k=y*size+x,c=cls[k];
  if(c===C.BG){label[k]=REGION.BG;continue;}
  let hit=null,which=0;
  for(const [arm,id] of armList){const h=armHit(arm,x,y);if(h&&(!hit||h.d<hit.d)){hit=h;which=id;}}
  const cloth=c===C.BLUE||c===C.LIGHT||(c===C.DARK&&y>=neckY&&y<pantsTop);
  if(y<neckY&&!(hit&&c===C.BLUE)){label[k]=REGION.KEEP;continue;}
  if(c===C.SKIN){label[k]=hit&&hit.t>.62?REGION.HAND:REGION.KEEP;continue;}
  if(c===C.BROWN){label[k]=y>(pantsTop+ankle)/2?REGION.SHOES:REGION.GEAR;continue;}
  if(y>=pantsTop&&!hit){
   if(c===C.BLUE){label[k]=REGION.TORSO;continue;}            // 재킷 자락이 벨트 아래로 내려온 부분
   // 발목 아래라도 갈색 신발 가까이(3px)의 어두운 픽셀만 신발 외곽선 — 들어 올린 뒷발 때문에 앞다리 바지가 신발이 되지 않게.
   label[k]=y>=ankle&&nearBrown[k]?REGION.SHOES:REGION.PANTS;continue;
  }
  if(hit&&cloth){
   const trim=c===C.LIGHT;
   label[k]=trim?REGION.SLEEVE_TRIM:REGION.SLEEVE;armId[k]=which;armT[k]=Math.round(hit.t*255);continue;
  }
  if(c===C.LIGHT){
   // 셔츠는 앞섶(정면: 몸 가운데 띠 · 옆모습: 가슴 앞쪽 띠)에만 보인다. 그 밖의 밝은 픽셀은 재킷 테두리(파이핑).
   const i=((y*width)+fx+x)*4;
   const inBand=view==='front'?Math.abs(x-cx)<=20:view==='right'?x>=cx+4&&x<=cx+46:false;
   label[k]=inBand&&data[i+2]-data[i]<=8?REGION.SHIRT:REGION.TRIM;continue;
  }
  label[k]=REGION.TORSO;
 }
 // 줄마다 아랫몸(바지 · 재킷 자락 · 신발) 좌우 끝, 칸마다 몸통(소매 제외) 맨 아랫줄, 가슴 높이의 몸통 좌우 끝.
 // 손 둘레 18px 은 다리 폭 계산에서 뺀다(손 외곽선이 바지로 잡혀 다리가 넓어 보이지 않게).
 const hands=arms.map(a=>[a[4],a[5]]);
 const nearHand=(x,y)=>hands.some(([hx,hy])=>(x-hx)**2+(y-hy)**2<18*18);
 // bodyL/bodyR: 팔 · 손을 뺀 몸(몸통 · 셔츠 · 테두리 · 바지)의 줄별 좌우 끝.
 const rowL=new Int16Array(size).fill(-1),rowR=new Int16Array(size).fill(-1),colBottom=new Int16Array(size).fill(-1);
 const bodyL=new Int16Array(size).fill(-1),bodyR=new Int16Array(size).fill(-1);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const r=label[y*size+x];
  if(y>=pantsTop&&(r===REGION.PANTS||r===REGION.SHOES)&&!nearHand(x,y)){if(rowL[y]<0)rowL[y]=x;rowR[y]=x;}
  if(y>=neckY&&(r===REGION.TORSO||r===REGION.SHIRT||r===REGION.TRIM||r===REGION.PANTS)){if(bodyL[y]<0)bodyL[y]=x;bodyR[y]=x;}
  if(r===REGION.TORSO||r===REGION.TRIM||r===REGION.SHIRT)colBottom[x]=y;
 }
 const chestY=Math.min(size-1,neckY+36);let chestL=-1,chestR=-1;
 for(let x=0;x<size;x++){const r=label[chestY*size+x];if(r===REGION.TORSO||r===REGION.TRIM||r===REGION.SHIRT){if(chestL<0)chestL=x;chestR=x;}}
 return {size,label,armId,armT,lum,cls,arms,landmarks:{neckY,cx,pantsTop,hem,ankle,knee,shoulders,view,arms:visible.length,rowL,rowR,bodyL,bodyR,colBottom,chestY,chestL,chestR}};
}

// 영역별 평균 밝기(아주 어두운 외곽선은 빼고). 명암을 옮길 때 기준이 된다.
function regionMeans(seg){
 const sum=new Float64Array(12),cnt=new Float64Array(12);
 for(let k=0;k<seg.label.length;k++){const r=seg.label[k];if(r>=REGION.TORSO&&seg.lum[k]>.08){sum[r]+=seg.lum[k];cnt[r]++;}}
 return Array.from(sum,(s,i)=>cnt[i]?s/cnt[i]:.3);
}

// 16진 색 → [r,g,b]
export function rgb(hex){
 if(Array.isArray(hex))return hex;
 const v=parseInt(hex.slice(1),16);
 return [v>>16&255,v>>8&255,v&255];
}
const SKIN=[240,182,140];

// 프레임 하나를 옷 레시피로 칠한다. out 은 data 와 같은 모양의 배열(미리 data 를 복사해 둔 것).
// recipe.paint(p) 는 칠할 색을 돌려준다: [r,g,b] · '#hex' · {color, contrast, flat} · 'skin' · null(원래 픽셀 유지).
// p = {region, x, y, t(소매 위치 0~1), arm(0 · 1 · 2), side('L'·'R' 몸의 실제 좌우), legT(바지 위치 0 벨트 ~ 1 발목),
//      lm(기준점), view('front' · 'back' · 'right' · 'left'), lum(원래 밝기), rel(영역 평균 대비 밝기), edge(윤곽선 픽셀)}
export function paintFrame(data,out,width,fx,seg,recipe,view){
 const {size,label,armId,armT,lum,landmarks:lm}=seg;
 const means=regionMeans(seg);
 const mirrored=view==='left';
 const p={lm,view};
 const bodyAt=(x,y)=>x>=0&&y>=0&&x<size&&y<size&&label[y*size+x]!==REGION.BG;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const k=y*size+x,region=label[k];
  if(region<REGION.TORSO)continue;
  if(region===REGION.GEAR&&!recipe.gear)continue;
  p.region=region;p.x=x;p.y=y;p.t=armT[k]/255;p.arm=armId[k];p.lum=lum[k];p.rel=lum[k]/means[region];
  p.side=sideOf(view,x,lm,p.arm,seg);
  p.legT=(y-lm.pantsTop)/Math.max(1,lm.ankle-lm.pantsTop);
  p.edge=!bodyAt(x-1,y)||!bodyAt(x+1,y)||!bodyAt(x,y-1)||!bodyAt(x,y+1);
  p.mirrored=mirrored;
  p.armAxis=p.arm?armPoint(seg.arms[p.arm-1],.7):null;
  let v=recipe.paint(p);
  if(v==null)continue;
  let contrast=recipe.contrast??.85,flat=false,color;
  if(v==='skin')color=SKIN;
  else if(typeof v==='string'||Array.isArray(v))color=rgb(v);
  else{color=v.color==='skin'?SKIN:rgb(v.color);if(v.contrast!=null)contrast=v.contrast;flat=!!v.flat;}
  let shade=flat?1:1+(Math.min(2.2,p.rel)-1)*contrast;
  if(p.lum<.09)shade=Math.min(shade,.3);                          // 선(외곽 · 주름선)은 어둡게 남긴다
  if(p.edge)shade=Math.min(shade,.42);
  shade=Math.max(.16,Math.min(1.75,shade));
  const i=((y*width)+fx+x)*4;
  out[i]=Math.min(255,color[0]*shade);out[i+1]=Math.min(255,color[1]*shade);out[i+2]=Math.min(255,color[2]*shade);
 }
 if(recipe.panels)for(const panel of recipe.panels)addPanel(out,width,fx,seg,panel,view,means);
}

// 팔 선분 위의 한 점(t: 0 어깨 ~ .5 팔꿈치 ~ 1 손). 소매 글자 · 무늬의 기준점.
export function armPoint(arm,t){
 const [sx,sy,ex,ey,hx,hy]=arm;
 if(t<=.5){const u=t/.5;return {x:sx+(ex-sx)*u,y:sy+(ey-sy)*u};}
 const u=(t-.5)/.5;return {x:ex+(hx-ex)*u,y:ey+(hy-ey)*u};
}
// 몸의 실제 좌우. 정면: 그림 왼쪽 = 오른쪽 몸. 뒷모습: 그림 왼쪽 = 왼쪽 몸.
// 옆모습(오른쪽을 봄): 보이는 쪽 = 왼쪽 몸. 왼쪽을 볼 때는 그림을 뒤집으므로 보이는 쪽 = 오른쪽 몸.
function sideOf(view,x,lm,arm,seg){
 if(view==='front')return x<lm.cx?'R':'L';
 if(view==='back')return x<lm.cx?'L':'R';
 const near=view==='right'?'L':'R',far=near==='L'?'R':'L';
 if(arm)return arm===1?near:far;                                  // 옆모습 표의 첫 팔 = 보이는 쪽 팔
 return near;
}

// 몸에 붙은 천 조각(앞치마 · 긴 코트 자락 등)을 더한다. panel.shape(lm, view, seg) 가 줄마다 [왼쪽, 오른쪽] 범위를 돌려준다.
// 범위 안의 몸 픽셀과(다리 사이 빈틈을 메울 때는) 빈 픽셀까지 천 색으로 칠하고, 바깥 경계에 어두운 외곽선을 둔다.
function addPanel(out,width,fx,seg,panel,view,means){
 const {size,label,lum,landmarks:lm}=seg;
 const rows=panel.shape(lm,view,seg);
 if(!rows)return;
 const color=rgb(panel.color),edge=rgb(panel.edge||'#161616'),trim=panel.trim?rgb(panel.trim):null;
 const filled=new Uint8Array(size*size),fill=typeof panel.fill==='function'?panel.fill(view):panel.fill;
 for(const [y,x0,x1] of rows){
  if(y<0||y>=size)continue;
  for(let x=Math.max(0,Math.round(x0));x<=Math.min(size-1,Math.round(x1));x++){
   const k=y*size+x,region=label[k];
   if(region===REGION.HAND||region===REGION.KEEP||region===REGION.SHOES||region===REGION.GEAR)continue;   // 손 · 머리 · 신발 · 가방은 천 위에 보인다
   if(region===REGION.SLEEVE||region===REGION.SLEEVE_TRIM)continue;   // 팔은 천 위에 그대로 보인다
   if(region===REGION.BG&&!fill)continue;
   filled[k]=1;
  }
 }
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const k=y*size+x;if(!filled[k])continue;
  const i=((y*width)+fx+x)*4;
  const border=x===0||y===0||x===size-1||y===size-1||!filled[k-1]||!filled[k+1]||!filled[k-size]||!filled[k+size];
  const outside=border&&(label[k]===REGION.BG||!filled[k-1]&&label[k-1]===REGION.BG||!filled[k+1]&&label[k+1]===REGION.BG||!filled[k+size]&&label[k+size]===REGION.BG);
  // 천 밑에 깔린 옷의 명암(주름)만 옮긴다. 밑이 밝은 셔츠든 어두운 바지든 앞치마 · 자락 색은 같은 밝기로 보인다.
  const base=label[k]===REGION.BG?0:means?.[label[k]]||0;
  let c=color,shade=base?Math.max(.7,Math.min(1.2,1+(lum[k]/base-1)*.5)):.92;
  // 테두리 장식은 바지가 보이는 쪽(앞 트임 · 밑단)에만. 위쪽 몸판과 이어지는 경계에는 긋지 않는다.
  const opening=[k-1,k+1,k-size,k+size].some(j=>!filled[j]&&(label[j]===REGION.PANTS||label[j]===REGION.SHOES));
  if(border){
   if(outside){c=edge;shade=1;}
   else if(trim&&opening){c=trim;shade=1;}
  }else if(panel.detail){
   const d=panel.detail(x,y,lm,view);if(d){c=rgb(d);shade=Math.min(shade,1);}
  }
  if(!border&&trim&&panel.trimInset){
   const near=[k-2,k+2,k-2*size,k+2*size].some(j=>!filled[j]&&(label[j]===REGION.PANTS||label[j]===REGION.SHOES||label[j]===REGION.BG));
   if(near){c=trim;shade=1;}
  }
  out[i]=Math.min(255,c[0]*shade);out[i+1]=Math.min(255,c[1]*shade);out[i+2]=Math.min(255,c[2]*shade);out[i+3]=255;
  label[k]=REGION.ADDED;
 }
}

// 시트 한 장(여러 프레임)을 옷으로 칠한 새 RGBA 를 돌려준다. segs 는 프레임별 segmentFrame 결과(재사용 가능).
export function paintSheet(data,width,height,segs,recipe,view){
 const out=new Uint8ClampedArray(data);
 segs.forEach((seg,f)=>{
  const copy={...seg,label:seg.label.slice()};                   // 천 조각이 label 을 바꾸므로 프레임마다 복사
  paintFrame(data,out,width,f*height,copy,recipe,view);
 });
 return out;
}
export function segmentSheet(data,width,height,rigFrames,view){
 const frames=Math.max(1,Math.round(width/height));
 return Array.from({length:frames},(_,f)=>segmentFrame(data,width,f*height,height,rigFrames[Math.min(f,rigFrames.length-1)],view==='left'?'right':view));
}
