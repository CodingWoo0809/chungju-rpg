// 바닥 재질. 재질마다 한 장의 타일 캔버스를 만들어 캔버스 패턴으로 캐시하고,
// surface() 가 월드 좌표계로 변환한 뒤 그 패턴으로 면을 채운다.
//
// 2026-09 질감 리워크(Revision 59) · 어떤 재질을 어디에 까는지(구획)는 전부 terrain.js 가 정하고,
// 이 파일은 "그 재질이 어떻게 생겼는지"만 정한다. 그래서 여기서 타일을 바꿔도 구획은 움직이지 않는다.
//  · 바꾼 재질: 잔디(grass) · 아스팔트(asphalt) · 보도블럭(brick) · 자갈(gravel, 측량 실습장에만 쓰임)
//  · 덧칠 전용(투명 바탕): 트랙 결(track) · 코트 결(court) · 평지붕 도장(roof) — 원래 색면 위에 같은 범위로만 얹는다.
//  · 그대로 둔 재질: 판석(stone) · 나무(wood) — 실내 바닥(본관 복도·교실·체육관 마루)도 같은 타일을 쓰므로
//    원래 코드(legacyTile)를 한 글자도 바꾸지 않고 보존한다.
const materials = new Map();
const sprites = {};
const hash = n => { const x=Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); };

// 타일 경계에서 이어지도록 격자를 주기적으로 감은 값 잡음. cells 는 타일 한 변의 격자 수.
function makeNoise(cells,seed){
 const v=new Float32Array(cells*cells);
 for(let i=0;i<v.length;i++)v[i]=hash(i+seed*7.3);
 const smooth=t=>t*t*(3-2*t);
 return (u,w)=>{                                   // u,w 는 0~1
  const fx=u*cells,fy=w*cells;
  const x0=Math.floor(fx)%cells,y0=Math.floor(fy)%cells;
  const x1=(x0+1)%cells,y1=(y0+1)%cells;
  const tx=smooth(fx-Math.floor(fx)),ty=smooth(fy-Math.floor(fy));
  const a=v[y0*cells+x0]+(v[y0*cells+x1]-v[y0*cells+x0])*tx;
  const b=v[y1*cells+x0]+(v[y1*cells+x1]-v[y1*cells+x0])*tx;
  return a+(b-a)*ty;
 };
}
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const rgb=c=>`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`;
const rgba=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;

// ── 잔디 ──────────────────────────────────────────────────────────────
// 약간 밝은 초록 + 밝은/누런/밟힌/짙은 자리가 섞이고, 발등 높이로 자라 있는 느낌(수풀은 아님).
// 풀잎 방향 트릭: 타일 좌표 (-1,-1) = 월드 (-x,-y) = 등각 투영의 화면 '위'. 대각선으로 그은 잎은 화면에서 선다.
// Revision 60 · 얼룩 대비와 잎 대비를 키워 일반 줌(7.2)에서도 잔디 결이 읽히게 했다. 색 기준은 그대로.
const GRASS_TONES={
 base:[126,158,90], light:[162,192,110], dry:[186,180,114], deep:[95,133,75], worn:[152,158,110]
};
function grassTile(size=256){
 const tile=document.createElement('canvas');tile.width=tile.height=size;
 const c=tile.getContext('2d');
 const T=GRASS_TONES;
 const patch=makeNoise(4,11),tint=makeNoise(3,29),detail=makeNoise(13,61),grain=makeNoise(38,47);
 const img=c.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,w=y/size;
  const p=patch(u,w),q=tint(u,w),e=detail(u,w);
  let col=p<.42?mix(T.deep,T.base,p/.42):mix(T.base,T.light,(p-.42)/.58);
  if(q>.7)col=mix(col,T.dry,(q-.7)/.3*.8);           // 누런 자리
  else if(q<.25)col=mix(col,T.worn,(.25-q)/.25*.55); // 밟힌 자리
  col=mix(col,e>.5?T.light:T.deep,Math.abs(e-.5)*.6);
  const g=(grain(u,w)-.5)*22+(hash(y*size+x+3)-.5)*18;
  const i=(y*size+x)*4;
  img.data[i]=col[0]+g;img.data[i+1]=col[1]+g;img.data[i+2]=col[2]+g;img.data[i+3]=255;
 }
 c.putImageData(img,0,0);
 for(let i=0;i<30;i++){                            // 살짝 누런 포기
  const x=hash(i*6.1+31)*size,y=hash(i*7.7+19)*size,r=5+hash(i*8.3+5)*11;
  c.fillStyle=rgba(T.dry,.2);c.beginPath();c.ellipse(x,y,r,r*.8,0,0,Math.PI*2);c.fill();
 }
 c.lineCap='round';
 const blades=Math.round(size*size/24);
 for(let i=0;i<blades;i++){
  const x=hash(i*1.7+5)*size,y=hash(i*2.3+91)*size;
  const len=4.6+hash(i*3.1+17)*7.4;                  // 발등 높이 정도
  const sway=(hash(i*4.7+63)-.5)*2.6;
  const p=patch(x/size,y/size);
  const root=p<.5?[64,100,54]:mix(T.base,T.deep,.55);
  const tip=mix(T.light,[222,232,164],hash(i*5.3+7)*.7);
  const dx=-len*.72+sway,dy=-len*.72;
  for(const [ox,oy] of [[0,0],[size,0],[-size,0],[0,size],[0,-size]]){
   if(ox||oy){ if(x+ox< -14||x+ox>size+14||y+oy< -14||y+oy>size+14)continue; }
   c.strokeStyle=rgba(root,.8);c.lineWidth=1.45;
   c.beginPath();c.moveTo(x+ox,y+oy);c.lineTo(x+ox+dx*.55,y+oy+dy*.55);c.stroke();
   c.strokeStyle=rgba(tip,.8);c.lineWidth=1;
   c.beginPath();c.moveTo(x+ox+dx*.5,y+oy+dy*.5);c.lineTo(x+ox+dx,y+oy+dy);c.stroke();
  }
 }
 return tile;
}

// ── 아스팔트 ───────────────────────────────────────────────────────────
// 학교 안 포장답게 정돈돼 있되 단순 회색 면이 아니게: 골재 알갱이, 톤 얼룩, 닳아 반들한 자리,
// 덧씌운 보수 조각, 아주 옅은 기름 얼룩. 균열은 넣지 않는다. 평균 밝기는 이전과 같다.
function asphaltTile(size=256){
 const tile=document.createElement('canvas');tile.width=tile.height=size;
 const c=tile.getContext('2d');
 const base=[116,120,116],blotch=makeNoise(3,73),mid=makeNoise(9,113),grain=makeNoise(48,97);
 const img=c.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,w=y/size;
  let col=mix(mix(base,[100,103,100],1-blotch(u,w)),[136,139,134],blotch(u,w)*.62);
  const m=mid(u,w);
  col=mix(col,m>.5?[140,143,138]:[96,99,96],Math.abs(m-.5)*.9);
  const g=(grain(u,w)-.5)*14+(hash(y*size+x)-.5)*22;
  const i=(y*size+x)*4;
  img.data[i]=col[0]+g;img.data[i+1]=col[1]+g;img.data[i+2]=col[2]+g;img.data[i+3]=255;
 }
 c.putImageData(img,0,0);
 for(let i=0;i<4;i++){                                // 덧씌운 보수 조각 — 살짝 어둡고 가장자리가 또렷하다
  const x=hash(i+700)*size,y=hash(i+740)*size,w=18+hash(i+780)*34,h=12+hash(i+820)*26;
  c.fillStyle='rgba(70,74,72,.16)';c.fillRect(x,y,w,h);
  c.strokeStyle='rgba(58,62,60,.28)';c.lineWidth=1.1;c.strokeRect(x,y,w,h);
 }
 for(let i=0;i<5200;i++){                             // 골재 알갱이
  const x=hash(i+200)*size,y=hash(i+1420)*size,r=.45+hash(i+2600)*1.05;
  c.fillStyle=i%3?'rgba(214,212,200,.34)':'rgba(66,70,66,.36)';
  c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
 }
 for(let i=0;i<8;i++){                                // 닳아서 반들해진 자리(밝게)
  const x=hash(i+40)*size,y=hash(i+60)*size,r=16+hash(i+80)*30;
  const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(170,172,166,.20)');g.addColorStop(1,'rgba(170,172,166,0)');
  c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
 }
 for(let i=0;i<3;i++){                                // 아주 옅은 기름 얼룩
  const x=hash(i+900)*size,y=hash(i+930)*size,r=6+hash(i+960)*10;
  const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(48,50,56,.18)');g.addColorStop(1,'rgba(48,50,56,0)');
  c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
 }
 return tile;
}

// ── 보도블럭 ───────────────────────────────────────────────────────────
// 줄눈이 확실히 읽히고(어두운 모래 줄눈 + 블록 모서리 턱), 블록마다 색이 다르고, 자주 밟혀 가운데가
// 반들한 블록과 모서리가 닳은 블록이 섞인다. 블록 크기(러닝본드 32×16)와 배율(.09)은 그대로다.
function brickTile(size=192){
 const tile=document.createElement('canvas');tile.width=tile.height=size;
 const c=tile.getContext('2d');
 const BW=32,BH=16,JOINT=2;
 c.fillStyle='#8a7866';c.fillRect(0,0,size,size);     // 줄눈(모래) — 이전보다 어둡게
 for(let i=0;i<900;i++){c.fillStyle=i%2?'rgba(180,165,140,.35)':'rgba(60,50,40,.3)';c.fillRect(hash(i+31)*size,hash(i+71)*size,1,1);}
 const tones=[[204,170,142],[186,150,124],[212,186,158],[178,126,102],
              [196,160,134],[206,182,154],[172,140,116],[216,194,168],[164,120,98]];
 for(let row=0;row*BH<size;row++){
  const oy=row*BH,shift=(row%2)*BW/2;
  for(let col=-1;col*BW+shift<size;col++){
   const ox=col*BW+shift;
   const key=(row*13+col*7+((row*col)%5))|0;
   const t=tones[((hash(key*1.7+3)*tones.length)|0)%tones.length];
   const lift=(hash(key*2.9+11)-.5)*22;
   const top=mix(t,[255,255,255],.12),bot=mix(t,[90,70,58],.18);
   const g=c.createLinearGradient(ox,oy,ox,oy+BH);
   g.addColorStop(0,rgb([top[0]+lift,top[1]+lift,top[2]+lift]));
   g.addColorStop(1,rgb([bot[0]+lift,bot[1]+lift,bot[2]+lift]));
   c.fillStyle=g;c.fillRect(ox+JOINT,oy+JOINT,BW-JOINT*2,BH-JOINT*2);
   c.fillStyle='rgba(255,250,240,.30)';c.fillRect(ox+JOINT,oy+JOINT,BW-JOINT*2,1);          // 모서리 턱 빛
   c.fillRect(ox+JOINT,oy+JOINT,1,BH-JOINT*2);
   c.fillStyle='rgba(60,42,32,.30)';c.fillRect(ox+JOINT,oy+BH-JOINT-1.2,BW-JOINT*2,1.2);    // 모서리 턱 그늘
   c.fillRect(ox+BW-JOINT-1.2,oy+JOINT,1.2,BH-JOINT*2);
   const r=hash(key*5.9+2);
   if(r<.22){                                          // 자주 밟혀 가운데가 반들한 블록
    const gg=c.createRadialGradient(ox+BW/2,oy+BH/2,1,ox+BW/2,oy+BH/2,BW*.45);
    gg.addColorStop(0,'rgba(255,245,230,.22)');gg.addColorStop(1,'rgba(255,245,230,0)');c.fillStyle=gg;c.fillRect(ox,oy,BW,BH);
   } else if(r>.86){                                   // 모서리가 닳은 블록
    c.fillStyle='rgba(120,98,82,.45)';c.beginPath();c.moveTo(ox+BW-JOINT,oy+BH-JOINT);c.lineTo(ox+BW-JOINT-5,oy+BH-JOINT);c.lineTo(ox+BW-JOINT,oy+BH-JOINT-4);c.fill();
   }
   for(let s=0;s<8;s++){
    const sx=ox+JOINT+hash(key*3.3+s)*(BW-JOINT*2),sy=oy+JOINT+hash(key*4.1+s*2)*(BH-JOINT*2);
    c.fillStyle=s%2?'rgba(255,255,255,.2)':'rgba(0,0,0,.16)';c.fillRect(sx,sy,1,1);
   }
  }
 }
 return tile;
}

// ── 우레탄 트랙 · 코트 결(투명 덧칠) ────────────────────────────────────
// 색은 terrain.js / campus-props.js 가 까는 원래 색면이 그대로 정한다. 이 타일들은 투명 바탕에
// 고무칩 알갱이와 옅은 얼룩만 얹는다 — 색·범위·라인은 하나도 바뀌지 않는다.
function grainOverlay(size,seed,light,dark,maxA,chips){
 const tile=document.createElement('canvas');tile.width=tile.height=size;
 const c=tile.getContext('2d');
 const blotch=makeNoise(3,seed);
 const img=c.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const b=blotch(x/size,y/size)-.5,g=hash(y*size+x+seed)-.5;
  const isLight=b+g*.9>0,col=isLight?light:dark,i=(y*size+x)*4;
  img.data[i]=col[0];img.data[i+1]=col[1];img.data[i+2]=col[2];
  img.data[i+3]=Math.min(maxA,Math.abs(b*50+g*38))|0;
 }
 c.putImageData(img,0,0);
 for(let i=0;i<chips;i++){
  c.fillStyle=i%3?`rgba(${dark},.22)`:`rgba(${light},.26)`;
  c.fillRect(hash(i+seed*3)*size,hash(i+seed*5+777)*size,1.3,1.3);
 }
 return tile;
}
function trackTile(){return grainOverlay(192,131,[240,200,172],[40,22,14],60,2200);}      // 최대 24% 불투명
function courtTile(){return grainOverlay(192,151,[200,226,244],[14,34,54],44,1600);}     // 최대 17% 불투명

// ── 자갈(측량 실습장 · 바깥에서만 쓰는 재질) ─────────────────────────────
function gravelTile(size=192){
 const tile=document.createElement('canvas');tile.width=tile.height=size;
 const c=tile.getContext('2d');
 const blotch=makeNoise(4,171);
 const img=c.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const m=(blotch(x/size,y/size)-.5)*26+(hash(y*size+x+5)-.5)*20,i=(y*size+x)*4;
  img.data[i]=163+m;img.data[i+1]=161+m;img.data[i+2]=146+m;img.data[i+3]=255;
 }
 c.putImageData(img,0,0);
 for(let i=0;i<1100;i++){                             // 자갈 한 알 — 그림자 + 몸 + 빛
  const x=hash(i+200)*size,y=hash(i+850)*size,r=.7+hash(i+1600)*1.5,t=hash(i+2400);
  const col=t<.3?[138,136,124]:t<.6?[184,181,166]:t<.85?[170,163,146]:[198,195,182];
  c.fillStyle='rgba(60,58,50,.25)';c.beginPath();c.ellipse(x+.5,y+.6,r,r*.7,0,0,Math.PI*2);c.fill();
  c.fillStyle=rgb(col);c.beginPath();c.ellipse(x,y,r,r*.7,0,0,Math.PI*2);c.fill();
  c.fillStyle='rgba(255,255,250,.2)';c.beginPath();c.ellipse(x-r*.3,y-r*.25,r*.35,r*.22,0,0,Math.PI*2);c.fill();
 }
 return tile;
}

// ── 평지붕 방수 도장(투명 덧칠) ─────────────────────────────────────────
// 지붕 색은 roof-colors.js 가 정한다. 여기서는 얼룩·보수 자국·배수구 쪽 흐름 자국·알갱이만 얹는다.
function roofTile(size=256){
 const tile=document.createElement('canvas');tile.width=tile.height=size;
 const c=tile.getContext('2d');
 const big=makeNoise(3,191),mid=makeNoise(10,211);
 const img=c.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const m=(big(x/size,y/size)-.5)*1.2+(mid(x/size,y/size)-.5)*.7+(hash(y*size+x+9)-.5)*.5;
  const i=(y*size+x)*4,light=m>0;
  img.data[i]=light?255:24;img.data[i+1]=light?255:34;img.data[i+2]=light?246:30;
  img.data[i+3]=Math.min(42,Math.abs(m)*40)|0;
 }
 c.putImageData(img,0,0);
 for(let i=0;i<5;i++){                                // 덧칠 보수 자국
  const x=hash(i+300)*size,y=hash(i+330)*size,w=22+hash(i+360)*40,h=14+hash(i+390)*28;
  c.fillStyle='rgba(20,30,26,.07)';c.fillRect(x,y,w,h);
  c.strokeStyle='rgba(255,255,245,.13)';c.lineWidth=1;c.strokeRect(x,y,w,h);
 }
 for(let i=0;i<10;i++){                               // 빗물 흐른 자국
  const x=hash(i+500)*size,y=hash(i+530)*size,l=20+hash(i+560)*50;
  c.strokeStyle='rgba(30,36,32,.10)';c.lineWidth=3+hash(i+590)*5;
  c.beginPath();c.moveTo(x,y);c.lineTo(x+l*.3,y+l);c.stroke();
 }
 return tile;
}

// ── 원본 타일(변경 금지) ─────────────────────────────────────────────────
// Revision 56 이전의 noiseTile 그대로. stone·wood·gravel 은 여기서만 만든다.
function legacyTile(kind){
 const tile=document.createElement('canvas');tile.width=tile.height=192;
 const c=tile.getContext('2d');
 const colors={asphalt:[110,115,110],stone:[175,170,155],grass:[112,129,82],wood:[166,140,100],gravel:[163,161,146],brick:[184,156,136]};
 const base=colors[kind];const pixels=c.createImageData(192,192);
 for(let i=0;i<192*192;i++){const variation=(hash(i+13)-.5)*(kind==='grass'?35:23);for(let j=0;j<3;j++)pixels.data[i*4+j]=base[j]+variation;pixels.data[i*4+3]=255;}c.putImageData(pixels,0,0);
 if(kind==='gravel'){for(let i=0;i<650;i++){const x=hash(i+200)*192,y=hash(i+850)*192,size=.5+hash(i+1600)*1.8;c.fillStyle=i%3?'#dad8c570':'#6e756455';c.fillRect(x,y,size,size*.65);}}
 if(kind==='stone'){c.strokeStyle='#e0dacb60';c.lineWidth=1;for(let y=0;y<192;y+=24){c.beginPath();c.moveTo(0,y);c.lineTo(192,y);c.stroke();for(let x=(y/24%2)*24;x<192;x+=48){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+24);c.stroke();}}}
 if(kind==='brick'){                                   // 보도블럭: 러닝본드 + 색 변화
  const tones=['#c9a98f','#bb9880','#d0b89e','#b5836c','#c2a189','#cbb49b'];
  for(let y=0;y<192;y+=16)for(let x=(y/16%2)*16;x<192;x+=32){
   c.fillStyle=tones[((x*7+y*3)/16|0)%tones.length];c.fillRect(x+.6,y+.6,30.8,14.8);
  }
 }
 if(kind==='asphalt'){for(let i=0;i<10;i++){c.strokeStyle='#444a4318';c.beginPath();c.moveTo(hash(i)*192,hash(i+30)*192);c.lineTo(hash(i)*192+hash(i+60)*15,hash(i+30)*192+hash(i+80)*12);c.stroke();}}
 return tile;
}
function noiseTile(kind){
 if(kind==='grass')return grassTile();
 if(kind==='asphalt')return asphaltTile();
 if(kind==='brick')return brickTile();
 if(kind==='track')return trackTile();
 if(kind==='court')return courtTile();
 if(kind==='gravel')return gravelTile();
 if(kind==='roof')return roofTile();
 return legacyTile(kind);
}
// 패턴 배율: stone .18 · brick .09 · 나머지 .25 는 원본 그대로. track 은 신규, grass 는 로드 전후를 .22 로 맞춘다.
const SCALE={stone:.18,brick:.09,track:.16,court:.16,roof:.2,grass:.22};   // 잔디는 사진 로드 전후 같은 칠 타일이라 같은 배율(.22)
export function getMaterial(ctx,kind){
 if(!materials.has(kind)){const pattern=ctx.createPattern(noiseTile(kind),'repeat');pattern.setTransform(new DOMMatrix().scale(SCALE[kind]||.25));materials.set(kind,pattern);}
 return materials.get(kind);
}
export function loadMaterials(){
 // 잔디는 절차적으로 칠한 타일이 기본이고, 사진 텍스처는 그 위에 아주 옅게 얹어
 // 규칙적인 느낌만 깬다(색·밝기는 칠한 쪽이 결정한다).
 const grass=new Image();grass.src=new URL('../assets/lawn-texture.png',import.meta.url).href;
 grass.onload=()=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const c=canvas.getContext('2d');
  c.drawImage(grassTile(256),0,0);
  c.save();c.globalAlpha=.11;c.globalCompositeOperation='overlay';
  c.drawImage(grass,0,0,256,256);c.restore();
  const pattern=c.createPattern(canvas,'repeat');
  pattern.setTransform(new DOMMatrix().scale(.22));
  materials.set('grass',pattern);
 };
 const tree=new Image();tree.src=new URL('../assets/zelkova-tree.png',import.meta.url).href;tree.onload=()=>{sprites.tree=tree;};
}
export function treeSprite(){return sprites.tree;}
export function surface(d,x,y,w,depth,kind,z=0){const c=d.c,o=d.p(0,0,z),a=d.p(1,0,z),b=d.p(0,1,z);c.save();c.transform(a.x-o.x,a.y-o.y,b.x-o.x,b.y-o.y,o.x,o.y);c.fillStyle=getMaterial(c,kind);c.fillRect(x,y,w,depth);c.restore();}
