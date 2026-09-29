// ── 투구를 홍길동 스프라이트에 직접 씌우기 (2026-09-27) ─────────────────────────
// 옷(outfit-paint.js)과 같은 방식이다: 몸 위에 그림을 얹는 오버레이가 아니라, 시트의 머리 픽셀을 투구로 다시 칠한 시트를 만든다.
//   1. 머리 찾기(headSheet): 프레임마다 머리카락 꼭대기(T) · 가운데(cx)를 재고, 머리 크기(R)와 눈 높이(faceY)는
//      시트 전체의 가운데값으로 고정한다 — 머리는 몸과 함께 움직이지만 투구 크기는 프레임마다 흔들리지 않는다.
//   2. 투구 모양(partAt): 머리를 공으로 보고, 공 위의 테(챙 · 머리띠)를 카메라가 살짝 위에서 본 타원으로 그린다.
//      같은 식으로 정면 · 뒤 · 옆이 이어진다(왼쪽은 오른쪽 그림을 뒤집으므로 오른쪽 좌표로 칠한다).
//   3. 칠하기(paintHelmetFrame): 공 명암(3~4단 툰) · 테두리 어두운 외곽선 · 부위 사이 경계선. 투구 밖으로 삐져나온
//      머리카락(투구에 눌린 부분)은 지우고, 투구가 머리보다 큰 곳은 새 픽셀을 더한다.
//      몸 앞에 있는 주먹 · 소매는 투구 위에 그대로 남는다(앞에 있는 것이 앞에 보인다).
import {REGION,COLOR_CLASS as C,rgb} from './outfit-paint.js';

const median=list=>{const v=list.filter(Number.isFinite).sort((a,b)=>a-b);return v.length?v[v.length>>1]:NaN;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// 뒷모습에는 얼굴이 없으므로 정면 시트에서 잰 비율(머리 꼭대기 → 눈 높이 / 머리 폭)을 쓴다.
export const BACK_FACE_RATIO=.6;

// 프레임 하나의 머리 픽셀 판정. 손 둘레 · 팔(소매)은 머리가 아니다(앞에 있는 가림막).
export function headPixelTest(seg){
 const {size,cls,label,arms}=seg,N=seg.landmarks.neckY;
 const hands=(arms||[]).filter(a=>a[6]&2).map(a=>[a[4],a[5]]);
 const nearHand=(x,y)=>hands.some(([hx,hy])=>(x-hx)**2+(y-hy)**2<26*26);
 const head=(x,y)=>{
  if(x<0||y<0||x>=size||y>=size||y>=N)return false;
  const k=y*size+x,c=cls[k];
  return c!==C.BG&&c!==C.BLUE&&label[k]===REGION.KEEP&&!nearHand(x,y);
 };
 // 가림막: 머리 앞에 있는 손 · 팔 · 몸. 투구는 여기를 칠하지 않는다.
 const occluder=(x,y)=>{
  if(x<0||y<0||x>=size||y>=size)return false;
  const k=y*size+x,c=cls[k],l=label[k];
  if(c===C.BG)return false;
  if(l===REGION.HAND||l===REGION.SLEEVE||l===REGION.SLEEVE_TRIM)return true;
  if(y<N&&c===C.BLUE)return true;                                  // 머리 높이까지 올라온 소매
  if(y<N&&nearHand(x,y)&&(c===C.SKIN||c===C.BROWN))return true;    // 얼굴 앞의 주먹
  return false;
 };
 return {head,occluder,N};
}

function measure(seg){
 const {size,cls}=seg,{head,N}=headPixelTest(seg);
 let T=-1;
 for(let y=0;y<N&&T<0;y++){let n=0;for(let x=0;x<size;x++)if(head(x,y))n++;if(n>=8)T=y;}
 if(T<0)return null;
 const H=N-T;let W=0;
 for(let y=Math.round(T+.15*H);y<=T+.6*H;y++){let l=-1,r=-1;for(let x=0;x<size;x++)if(head(x,y)){if(l<0)l=x;r=x;}if(l>=0&&r-l>W)W=r-l;}
 let sx=0,sn=0;
 for(let y=T;y<T+.4*W;y++)for(let x=0;x<size;x++)if(head(x,y)&&cls[y*size+x]===C.DARK){sx+=x;sn++;}
 let faceTop=-1;
 for(let y=T;y<N&&faceTop<0;y++){let n=0;for(let x=0;x<size;x++)if(head(x,y)&&cls[y*size+x]===C.SKIN)n++;if(n>=.2*W)faceTop=y;}
 return {T,N,W,cx:sn?sx/sn:size/2,faceRatio:faceTop>0?(faceTop-T)/W:NaN};
}

// 시트 한 장의 프레임별 머리 기하. view: 'front' · 'back' · 'right'(왼쪽도 오른쪽 좌표).
export function headSheet(segs,view){
 const raw=segs.map(measure);
 const W=median(raw.map(r=>r?.W));
 const ratio=view==='back'?BACK_FACE_RATIO:(median(raw.map(r=>r?.faceRatio))||BACK_FACE_RATIO);
 return raw.map(r=>{
  if(!r||!Number.isFinite(W))return null;
  const R=W/2,T=r.T,cy=T+R;
  // 옆모습은 앞머리가 눈썹을 덮어 '살이 넓게 보이는 첫 줄'이 눈 가운데쯤이다 — 눈썹 높이로 올린다(R 의 0.3).
  const sideLift=view==='right'||view==='left'?.3*R:0;
  return {cx:r.cx,cy,R,T,N:r.N,faceY:T+ratio*W-sideLift,view:view==='left'?'right':view,ow:Math.max(2,Math.round(W/46))};
 });
}

// ── 모양 도구 ────────────────────────────────────────────────
const sq=v=>v*v;
// 머리 둘레의 수평 테(챙 · 머리띠 · 투구 아랫선). 카메라가 살짝 위에서 보므로 가까운 쪽(가운데)이 tilt 만큼 아래로 처진다.
export function ringY(g,x,base,tilt=.1,rx=1.1){
 const u=(x-g.cx)/(rx*g.R);
 return base+tilt*g.R*Math.sqrt(Math.max(0,1-u*u));
}
const inEllipse=(x,y,ex,ey,rx,ry)=>sq((x-ex)/rx)+sq((y-ey)/ry)<=1;
// 공 명암: 왼쪽 위에서 오는 빛. 툰 4단.
const LIGHT=(()=>{const v=[-.45,-.72,.53],n=Math.hypot(...v);return v.map(a=>a/n);})();
export function sphereShade(x,y,ox,oy,r){
 const ux=(x-ox)/r,uy=(y-oy)/r,uz=Math.sqrt(Math.max(0,1-ux*ux-uy*uy));
 const d=ux*LIGHT[0]+uy*LIGHT[1]+uz*LIGHT[2];
 const spec=d>.93;
 return {shade:d>.72?1.1:d>.38?1:d>.1?.84:.7,spec};
}
function toonBand(t){return t>.75?1.06:t>.4?.97:t>.15?.86:.74;}

// ── 부위 계산 ───────────────────────────────────────────────
// 반환: {part, color:[r,g,b], shade, spec?, over:'all'|'free'(머리가 아닌 곳만)} 또는 null.
// 투구 종류마다 필요한 기준값을 한 번 계산해 둔다.
export function helmetFrame(g,recipe){
 const R=g.R,kind=recipe.kind,side=g.view==='right';
 const f={g,R,kind,side,recipe};
 const lift=recipe.rimLift??.22;
 // 투구 껍데기(공): 머리카락보다 조금 크다.
 f.sx=g.cx;f.sy=g.cy-(recipe.shellRise??.05)*R;f.sr=(recipe.shell??1.1)*R;
 // 투구 아랫선(테). 정면 가운데에서 눈 위 lift*R.
 f.rimTilt=.1;
 f.rimC=g.faceY-lift*R-f.rimTilt*R;
 if(kind==='hardhat'||kind==='shell'){
  f.by=f.rimC+.06*R;                                       // 챙 타원의 가운데 높이
 }
 if(kind==='band'){
  f.bandTh=(recipe.bandTh??.3)*R;
  f.bandC=g.faceY-(recipe.bandLift??.06)*R-f.bandTh-.12*R;
  f.sr=1.05*R;f.sy=g.cy;
 }
 if(kind==='bandana'){
  f.sr=1.07*R;f.sy=g.cy-.02*R;
  f.rimC=g.faceY-(recipe.rimLift??.12)*R-.12*R;f.rimTilt=.12;
 }
 if(kind==='headgear'){
  f.sr=1.0*R;f.sy=g.cy+.03*R;
  f.bottom=Math.min(g.cy+.92*R,g.N-3);
  f.brow=g.faceY-.1*R;                                     // 이마 띠 아랫선(눈썹 위)
 }
 // 매듭 · 꼬리(머리띠 · 두건). 뒷모습은 뒤통수 가운데, 옆모습은 뒤쪽 끝.
 if(kind==='band'||kind==='bandana'){
  const bx=g.cx-.98*R;
  const knotY=side?(kind==='band'?bandTop(f,bx)+f.bandTh*.5:bandanaRim(f,bx)-.06*R)
   :(kind==='band'?f.bandC+.12*R+f.bandTh*.5:f.rimC+.12*R-.02*R);
  f.knot=g.view==='back'?{x:g.cx,y:knotY+.02*R}:side?{x:bx-.04*R,y:knotY}:null;
 }
 return f;
}

// 껍데기 아랫선: 정면 · 뒤는 가운데가 처진 타원, 옆은 귀 쪽(뒤)이 더 내려오게 할 수 있다(earDrop).
function rimAt(f,x){
 const g=f.g,R=f.R,base=ringY(g,x,f.rimC,f.rimTilt,f.sr/R);
 const drop=f.recipe.earDrop||0;
 if(!drop)return base;
 if(f.side)return base+drop*R*clamp((g.cx+.3*R-x)/(.8*R),0,1)*clamp((x-(g.cx-1.15*R))/(.35*R),0,1);
 if(f.g.view==='front'||f.g.view==='back'){const u=(x-g.cx)/f.sr;return base+drop*R*clamp((Math.abs(u)-.45)/.4,0,1);}
 return base;
}

// 옆모습의 머리띠 · 두건 테: 앞(이마)은 눈 위에서 시작해 뒤통수 쪽으로 내려간다(옆에서 본 머리띠는 앞이 높고 뒤가 낮다).
function sideRing(f,x,frontY,backDrop,tilt=.1){
 const g=f.g,R=f.R,t=clamp((x-(g.cx-R))/(2*R),0,1),u=(x-g.cx)/(1.06*R);
 return frontY+backDrop*R*(1-t)+tilt*R*Math.sqrt(Math.max(0,1-u*u));
}
export function bandTop(f,x){
 return f.side?sideRing(f,x,f.g.faceY-.5*f.R,.3):ringY(f.g,x,f.bandC,.12,1.05);
}
export function bandanaRim(f,x){
 return f.side?sideRing(f,x,f.g.faceY-.3*f.R,.5):ringY(f.g,x,f.rimC,f.rimTilt,1.07);
}

function tailPart(f,x,y){
 const g=f.g,R=f.R,k=f.knot;if(!k)return null;
 if(inEllipse(x,y,k.x,k.y,.2*R,.17*R))return 'knot';
 const tails=g.view==='back'
  ?[[k.x-.05*R,k.y,k.x-.27*R,k.y+.64*R],[k.x+.05*R,k.y,k.x+.2*R,k.y+.56*R]]
  :[[k.x,k.y,k.x-.3*R,k.y+.62*R],[k.x+.02*R,k.y,k.x-.08*R,k.y+.72*R]];
 for(const [ax,ay,bx,by] of tails){
  const vx=bx-ax,vy=by-ay,L2=vx*vx+vy*vy,t=((x-ax)*vx+(y-ay)*vy)/L2;
  if(t<0||t>1)continue;
  const px=ax+vx*t,py=ay+vy*t,d=Math.hypot(x-px,y-py),w=(.14-.03*t)*R;
  if(d>w)continue;
  if(t>.86){const notch=(t-.86)/.14*w;if(d<notch*.9&&t>.93)continue;}   // 꼬리 끝 V 자 홈
  return 'tail';
 }
 return null;
}

// 픽셀 하나의 부위 이름. null = 투구 아님.
export function partAt(f,x,y){
 const g=f.g,R=f.R,kind=f.kind,side=f.side;
 const inShell=sq(x-f.sx)+sq(y-f.sy)<=f.sr*f.sr;
 if(kind==='hardhat'||kind==='shell'){
  const shell=inShell&&y<=rimAt(f,x);
  let brim=false;
  if(kind==='hardhat'){
   const bx=g.cx+(side?.14*R:0),rx=(f.recipe.brim??1.32)*R,ry=side?.16*R:(y>f.by?.24*R:.2*R);
   brim=inEllipse(x,y,bx,f.by,rx,ry);
  }else if(f.recipe.peak){
   if(side)brim=x>g.cx+.1*R&&inEllipse(x,y,g.cx+.6*R,f.by,.72*R,.14*R);
   else if(g.view==='front')brim=y>=f.by&&inEllipse(x,y,g.cx,f.by,.92*R,.2*R);
  }
  if(brim&&(y>=f.by||!shell))return 'brim';
  if(shell)return 'shell';
  return null;
 }
 if(kind==='headgear'){
  // 머리에 딱 맞는 헤드기어: 정수리 · 이마띠(머리 둘레를 도는 테) · 볼 보호대 · 귀 보호대. 얼굴은 열려 있다.
  if(!inEllipse(x,y,f.sx,f.sy,f.sr,.98*R)||y>f.bottom)return null;
  const bandBot=ringY(g,x,f.brow-.1*R,.1,1.0),bandTop=bandBot-.24*R;
  if(y<bandTop)return 'shell';
  if(y<=bandBot)return 'band';
  const ox=side?g.cx+.22*R:g.cx,oy=f.brow+.62*R;
  if(g.view==='back')return y>g.cy+.78*R?null:'shell';
  if(inEllipse(x,y,ox,oy,.62*R,.68*R))return null;                       // 얼굴 구멍
  if(inEllipse(x,y,ox,oy,.73*R,.79*R))return 'trim';                     // 구멍 둘레 테
  if(side)return inEllipse(x,y,g.cx-.5*R,g.faceY+.24*R,.3*R,.34*R)?'pad':'shell';
  return Math.abs(x-g.cx)<=.96*R?'pad':null;
 }
 if(kind==='band'){
  const top=bandTop(f,x);
  if(inShell&&y>=top&&y<=top+f.bandTh)return 'band';
  const t=tailPart(f,x,y);if(t)return t;
  return null;
 }
 if(kind==='bandana'){
  const rim=bandanaRim(f,x);
  if(inShell&&y<=rim)return y>rim-.15*R?'hem':'cloth';
  const t=tailPart(f,x,y);if(t)return t;
  return null;
 }
 return null;
}

// 투구 때문에 지워야 하는 머리카락: 투구 아랫선 위쪽인데 투구 밖으로 삐져나온 부분(투구에 눌린 머리).
function eraseAt(f,x,y){
 const g=f.g,R=f.R;
 if(f.kind==='band')return false;
 const out=sq(x-f.sx)+sq(y-f.sy)>f.sr*f.sr;
 if(!out)return false;
 if(y>=g.faceY)return false;                                      // 눈 높이 아래(볼 · 귀)는 지우지 않는다
 if(f.kind==='headgear')return y<f.bottom;
 const rim=f.kind==='bandana'?bandanaRim(f,x):rimAt(f,x);
 return y<rim;
}

// ── 칠하기 ───────────────────────────────────────────────────
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const scale=(c,s)=>[c[0]*s,c[1]*s,c[2]*s];

function colorOf(f,part,x,y){
 const r=f.recipe,g=f.g,R=f.R;
 let base=rgb(r.colors[part]??r.colors.shell??r.colors.band??r.colors.cloth);
 let shade=1,spec=false;
 if(part==='shell'||part==='cloth'||part==='pad'||part==='trim'||part==='hem'||(part==='band'&&f.kind==='headgear')){
  const s=sphereShade(x,y,f.sx,f.sy,f.sr);shade=s.shade;spec=s.spec&&part==='shell'&&!r.matte;
  if(part==='hem')shade*=.9;
 }else if(part==='brim'){
  const bx=g.cx+(f.side?.14*R:0),rx=(r.brim??1.32)*R;
  const edge=f.kind==='hardhat'?!inEllipse(x,y-.07*R,bx,f.by,rx,f.side?.16*R:(y>f.by?.24*R:.2*R)):y>f.by+.1*R;
  shade=edge?.74:(y<f.by?1.08:.97);
 }else if(part==='band'){
  shade=toonBand(1-Math.abs((x-g.cx)/(1.05*R)));
  const top=bandTop(f,x);
  if(y-top<.07*R)shade*=1.08;else if(top+f.bandTh-y<.07*R)shade*=.84;
 }else if(part==='knot'){shade=1;}
 else if(part==='tail'){shade=.9;}
 const deco=r.deco?.(part,x,y,f);
 if(deco){
  if(deco.tint){base=mix(base,rgb(deco.tint),deco.amount??1);}
  else{base=rgb(deco.color??deco);if(deco.flat)shade=1;else shade=Math.max(.8,shade);spec=false;}
 }
 let c=scale(base,shade);
 if(spec)c=mix(c,[255,255,255],.45);
 return c;
}

// 투구 위에 겹쳐 그리는 부품(보안면 · 고글 · 헤드램프). {color, alpha?(보안면처럼 비치는 것), outline?} 또는 null.
function extraAt(f,x,y,px){
 return f.recipe.extra?.(x,y,f,px)||null;
}

export function paintHelmetFrame(out,width,fx,seg,g,recipe,side){
 if(!g||!recipe)return;
 const size=seg.size,{head,occluder}=headPixelTest(seg);
 const f=helmetFrame(g,recipe);
 const R=g.R;
 const x0=Math.max(0,Math.floor(g.cx-1.75*R)),x1=Math.min(size-1,Math.ceil(g.cx+1.75*R));
 const y0=Math.max(0,Math.floor(g.T-.5*R)),y1=Math.min(size-1,Math.ceil(g.N+1.1*R));
 const w=x1-x0+1,h=y1-y0+1;
 const parts=new Array(w*h).fill(null);
 const isFree=(x,y)=>!head(x,y);
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
  if(occluder(x,y))continue;
  let p=partAt(f,x,y);
  if(!p)continue;
  // 머리띠 · 두건 꼬리는 뒷모습에서는 등 위에, 옆모습에서는 머리 뒤쪽(머리가 없는 곳)에만 보인다.
  if((p==='tail'||p==='knot')&&g.view!=='back'&&head(x,y)&&p==='tail')continue;
  // 목 아래 몸 위에는 꼬리 · 매듭만 내려온다.
  if(y>=g.N-1&&p!=='tail'&&p!=='knot')continue;
  parts[(y-y0)*w+(x-x0)]=p;
 }
 const at=(x,y)=>x<x0||x>x1||y<y0||y>y1?null:parts[(y-y0)*w+(x-x0)];
 const ow=g.ow;
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
  const i=((y*width)+fx+x)*4,p=at(x,y);
  if(!p){
   if(head(x,y)&&eraseAt(f,x,y))out[i+3]=0;                   // 투구에 눌려 사라지는 머리카락
   continue;
  }
  let c=colorOf(f,p,x,y);
  // 외곽선: 투구가 아닌 곳과 맞닿은 테두리(가림막 쪽은 긋지 않는다 — 주먹이 투구 앞에 있다).
  let edge=false,seam=false;
  for(let d=1;d<=ow&&!edge;d++)for(const [ax,ay] of [[x-d,y],[x+d,y],[x,y-d],[x,y+d]]){
   const q=at(ax,ay);
   if(!q&&!occluder(ax,ay)){edge=true;break;}
   if(q&&q!==p&&d===1&&SEAM(p,q))seam=true;
  }
  const dark=rgb(recipe.colors.line??'#1b1b22');
  if(edge)c=mix(scale(c,.35),dark,.5);
  else if(seam)c=scale(c,.55);
  const ex=extraAt(f,x,y,p);
  if(ex){const e=rgb(ex.color);c=ex.alpha!=null?mix(c,e,ex.alpha):e;}
  out[i]=Math.min(255,c[0]);out[i+1]=Math.min(255,c[1]);out[i+2]=Math.min(255,c[2]);out[i+3]=255;
 }
 // 부품 중 투구 밖으로 나오는 것(보안면 · 램프)은 투구 부위가 없는 곳에도 칠한다.
 if(recipe.extraOutside)for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
  if(at(x,y)||occluder(x,y))continue;
  const ex=extraAt(f,x,y,null);if(!ex)continue;
  const i=((y*width)+fx+x)*4;
  const base=out[i+3]>10?[out[i],out[i+1],out[i+2]]:null;
  let c=rgb(ex.color);
  if(ex.alpha!=null){if(!base)continue;c=mix(base,c,ex.alpha);}
  out[i]=c[0];out[i+1]=c[1];out[i+2]=c[2];out[i+3]=255;
 }
}
// 경계선을 그을 부위 쌍(위에 있는 쪽에 긋는다).
function SEAM(p,q){
 return (p==='brim'&&q==='shell')||(p==='band'&&(q==='shell'||q==='pad'||q==='trim'))||(p==='pad'&&q==='shell')||(p==='trim'&&q==='pad')||(p==='hem'&&q==='cloth')||
  (p==='knot'&&q!=='knot')||(p==='tail'&&q==='band')||(p==='tail'&&q==='hem');
}

export function paintHelmetSheet(out,width,height,segs,heads,recipe,side){
 segs.forEach((seg,f)=>paintHelmetFrame(out,width,f*height,seg,heads[f],recipe,side));
 return out;
}
