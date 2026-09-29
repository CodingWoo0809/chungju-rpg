import {mainFloor,westWallRuns} from './main-interior.js';
import {surface} from './materials.js';
import {PALETTE as P} from './drawing.js';
// 사진 참고: 정문 내부 계단·택배실, 학생부 앞 복도, 중앙현관 좌/우 입구, 동편현관 좌/우 입구, 운동장 쪽 외관.
const WALL='#eae6d8',TRIM='#b7c2b3',GLASS='#6f98a0',FRAME='#f4f1e6';
const DADO='#d9c6b3',DADO_EDGE='#c0a892',SKIRT='#9aa29a';
const WOOD='#c9a273',WOOD_DARK='#9d7a51',DOORGLASS='#cfe0d8';
const MINT='#2f9e8d',MINT_DARK='#1f7b6d',MINT_PALE='#bfded6';
const TACTILE='#e5c24d',EXTINGUISHER='#b0453a';
const PANEL='#dcc09a',PANEL_DARK='#b4926a',NAVY='#22386b',GOLD='#e7c66d';
const SIGN='#f3f5f7',SIGN_EDGE='#5d7da8',STONE='#cdc7b6',DAY='#fff8dd';
const RAINBOW=['#d9534a','#e08a3c','#e7c454','#5aa45c','#3f7fb5','#6b5aa6'];
const wallX=(d,x,y0,y1,z0,z1,fill,stroke=null,w=1)=>d.poly([{x,y:y0,z:z0},{x,y:y1,z:z0},{x,y:y1,z:z1},{x,y:y0,z:z1}],fill,stroke,w);
const wallY=(d,y,x0,x1,z0,z1,fill,stroke=null,w=1)=>d.poly([{x:x0,y,z:z0},{x:x1,y,z:z0},{x:x1,y,z:z1},{x:x0,y,z:z1}],fill,stroke,w);

// 학생부 앞 복도 사진의 흰 알루미늄 창: 창틀·중간 멀리언·창대·바닥으로 떨어지는 햇빛.
function corridorWindow(d,wx,y0,y1){
 const X=wx;
 wallX(d,X+.2,y0-.8,y1+.8,4.4,14.6,FRAME);
 wallX(d,X+.25,y0,y1,5,14,GLASS,FRAME,1.6);
 d.line([{x:X+.35,y:(y0+y1)/2,z:5},{x:X+.35,y:(y0+y1)/2,z:14}],FRAME,1.8);
 d.line([{x:X+.35,y:y0,z:9.2},{x:X+.35,y:y1,z:9.2}],FRAME,1.2);
 d.line([{x:X+.4,y:y0+1,z:5.6},{x:X+.4,y:y0+(y1-y0)*.62,z:13.2}],'#eaf3ec3a',2.2);
 wallX(d,X+.3,y0-1,y1+1,4.1,4.6,FRAME);
 d.poly([{x:X+1,y:y0,z:.05},{x:X+1,y:y1,z:.05},{x:X+26,y:y1+10,z:.05},{x:X+26,y:y0+10,z:.05}],'#fff7dc26');
}

// 밝은 목재 문틀 + 상부 유리(사진2). 실 이름은 아래 namePlate 가 문 옆 벽에 붙인다.
function sideDoor(d,r){
 const y=r.doorY,face=r.side==='west'?r.x+r.w-1.6:r.x,inward=1;
 for(const dy of [-7.4,6.2])d.box(face,y+dy,1.6,1.2,9.4,WOOD_DARK,WOOD,WOOD_DARK);
 const leaf=face+1.55;   // 보이는 면(=창문과 같은 라인)에 문짝을 붙인다
 wallX(d,leaf,y-6.2,y+6.2,0,7.2,WOOD);
 wallX(d,leaf+inward*.05,y-5.2,y+5.2,2.6,6.6,DOORGLASS,FRAME,.8);
 d.line([{x:leaf,y,z:0},{x:leaf,y,z:7.2}],WOOD_DARK,1.4);
 wallX(d,leaf,y-6.2,y+6.2,7.2,8.9,DOORGLASS,WOOD,1);
 d.box(face,y-7.4,1.6,14.8,1.1,WOOD_DARK,WOOD,WOOD_DARK,8.9);
}

// ── 실 이름 명패 ──────────────────────────────────────────────
// 화면에 뜨는 UI 라벨 대신 문 옆(도서관은 문 위) 벽에 붙는 작은 판.
// 모든 층·모든 실이 같은 규격·같은 색을 쓴다.
const PLATE_FACE='#f4f6f4',PLATE_EDGE='#8fa0ac',PLATE_BAR='#2f6f63',PLATE_INK='#27332f';
function plateSpan(r){
 const L=Math.max(7.6,r.name.length*2+2.8);       // 글자 수에 맞춘 판 길이(작게 유지)
 if(r.side==='north')return {axis:'x',a:r.doorX-L/2,b:r.doorX+L/2,at:r.y+r.d-.08,z0:10.5,z1:12.6};
 const at=r.side==='west'?r.x+r.w+.14:r.x+1.74;   // 복도에서 보이는 벽면
 return {axis:'y',a:r.doorY+7.2,b:r.doorY+7.2+L,at,z0:7.4,z1:9.5};
}
function namePlate(d,r){
 const s=plateSpan(r);
 if(s.axis==='x'){
  wallY(d,s.at+.06,s.a-.45,s.b+.45,s.z0-.32,s.z1+.32,PLATE_EDGE);
  wallY(d,s.at,s.a,s.b,s.z0,s.z1,PLATE_FACE);
  wallY(d,s.at-.04,s.a,s.b,s.z1-.42,s.z1,PLATE_BAR);
 }else{
  const push=r.side==='west'?.06:-.06;
  wallX(d,s.at-push,s.a-.45,s.b+.45,s.z0-.32,s.z1+.32,PLATE_EDGE);
  wallX(d,s.at,s.a,s.b,s.z0,s.z1,PLATE_FACE);
  wallX(d,s.at+push,s.a,s.b,s.z1-.42,s.z1,PLATE_BAR);
 }
}
// 판 위에 눕혀 쓰는 글자. 판과 같은 기울기라 건물에 붙은 표찰처럼 읽힌다.
function plateLabel(d,r){
 const s=plateSpan(r),z=(s.z0+s.z1)/2-.35,c=d.c;
 let p0=s.axis==='x'?d.p(s.a+1.4,s.at,z):d.p(s.at,s.a+1.4,z);
 let p1=s.axis==='x'?d.p(s.b-1.4,s.at,z):d.p(s.at,s.b-1.4,z);
 if(p1.x<p0.x){const t=p0;p0=p1;p1=t;}
 const dx=p1.x-p0.x,dy=p1.y-p0.y,len=Math.hypot(dx,dy);
 const view=c.canvas.getBoundingClientRect(),mx=(p0.x+p1.x)/2,my=(p0.y+p1.y)/2;
 if(len<15||mx<-len||mx>view.width+len||my<-30||my>view.height+30)return;
 c.save();c.translate(mx,my);c.rotate(Math.atan2(dy,dx));
 let size=Math.min(10.5,Math.max(7.5,len/(r.name.length*1.06)));
 const font=v=>`600 ${v.toFixed(1)}px "Malgun Gothic", sans-serif`;
 c.font=font(size);
 while(c.measureText(r.name).width>len&&size>6.5){size-=.5;c.font=font(size);}
 c.textAlign='center';c.textBaseline='middle';
 c.fillStyle=PLATE_INK;c.fillText(r.name,0,0);
 c.restore();
}

// 복도 끝에서 정면으로 보이는 도서관 출입구(사진 참고: 복도 막다른 면의 양개 유리문).
function endDoor(d,r){
 const y=r.y+r.d,x=r.doorX;
 for(const dx of [-7.6,6])d.box(x+dx,y-1.6,1.6,1.6,9.6,WOOD_DARK,WOOD,WOOD_DARK);
 wallY(d,y-.1,x-6,x+6,0,7.4,WOOD);
 wallY(d,y-.15,x-5,x+5,2.6,6.8,DOORGLASS,FRAME,.9);
 d.line([{x,y:y-.15,z:0},{x,y:y-.15,z:7.4}],WOOD_DARK,1.4);
 wallY(d,y-.1,x-6,x+6,7.4,9.2,DOORGLASS,WOOD,1);
 d.box(x-7.6,y-1.6,15.2,1.6,1.2,WOOD_DARK,WOOD,WOOD_DARK,9.2);
 wallY(d,y-.05,x-13,x-7.8,4.2,9.4,'#eef0e6',PANEL_DARK,1);
 wallY(d,y-.05,x+7.8,x+13,4.2,9.4,'#eef0e6',PANEL_DARK,1);
}

function terrazzo(d,f){
 const x0=f.wx;
 surface(d,x0,0,f.w-x0,f.d,'stone');
 d.rect(x0,0,f.w-x0,f.d,'#efe7d51e');
 for(let y=0;y<f.d;y+=18)d.line([{x:x0+1,y},{x:f.w-1,y}],'#b8b3a126',.6);
 for(let x=x0+10;x<f.w;x+=26)d.line([{x,y:1},{x,y:f.d-1}],'#b8b3a11f',.6);
}

function slab(d,l,wx,tone='#d6cfba'){
 const x0=wx+1,w=107-wx;
 d.rect(x0,l.y,w,l.d,tone);
 surface(d,x0,l.y,w,l.d,'stone');
 d.rect(x0,l.y,w,l.d,'#e7dec71c');
 for(let y=l.y+5;y<l.y+l.d;y+=14)d.line([{x:x0+1,y},{x:106,y}],'#aea9982e',.7);
}

// 현관 유리 출입구 한 벌: 알루미늄 프레임 + 상부 인방 + 실내로 번지는 채광.
function entrance(d,{x,y0,y1,side,pier=true,height=13.6,wx=0}){
 const inward=side==='west'?1:-1,base=side==='west'?wx-.1:x;
 wallX(d,base,y0,y1,0,height,'#d8ecec6b',FRAME,2);
 for(let i=1;i<4;i++)d.line([{x:base,y:y0+(y1-y0)*i/4,z:0},{x:base,y:y0+(y1-y0)*i/4,z:height}],FRAME,1.4);
 d.line([{x:base,y:y0,z:height*.7},{x:base,y:y1,z:height*.7}],FRAME,1.1);
 wallX(d,base+inward*.2,y0-2,y1+2,height,height+1.8,'#ded8c7');
 if(pier)for(const y of [y0-3,y1])d.box(side==='west'?wx-4.5:x-4.5,y,4.5,3,height+1.8,'#b9ad93',STONE,'#a79c84');
 const far=base+inward*32;
 d.poly([{x:base+inward*1.5,y:y0+1,z:.07},{x:base+inward*1.5,y:y1-1,z:.07},{x:far,y:y1+12,z:.07},{x:far,y:y0-12,z:.07}],DAY+'52');
 d.rect(side==='west'?base+1.4:x-9,y0,7.5,y1-y0,TACTILE+'cc');
}

// 사진1: 정문으로 들어오면 왼쪽에 유리 칸막이와 택배보관함, 정면 계단은 운동장 쪽을 향해 오른다.
function frontHall(d,l,wx){
 slab(d,l,wx);
 d.box(48.6,l.y+16,2.2,2.4,5.2,'#8e3d34',EXTINGUISHER,'#8e3d34');   // 소화기
 d.rect(30,l.y+l.d-9,16,6,'#5d6b5a55');                              // 현관 매트
 d.rect(58,l.y+6,24,10,DAY+'1e');
}

// 사진2·3: 중앙현관은 좌측 입구 위 무지개 현판, 목재 게시벽과 高 교표, 운동장 쪽 우측 입구.
function centralHall(d,l,wx){
 const y0=l.y,y1=l.y+l.d,[wa,wb]=l.west;
 slab(d,l,wx,'#d9d2bd');
 for(let x=wx+8;x<106;x+=18)d.line([{x,y:y0+2},{x,y:y1-2}],'#aea99835',.8);
 entrance(d,{x:0,y0:wa,y1:wb,side:'west',pier:false,height:12.4,wx});        // 좌측 입구
 for(const [i,color] of RAINBOW.entries())                                     // 교훈 무지개 현판
  wallX(d,wx+.3,wa-2-i*.1,wb+2+i*.1,13+i*.42,13.42+i*.42,color);
 wallX(d,wx+.25,wa-2,wb+2,15.6,17.8,'#f6f4ea','#cfc9b6',1);
 wallX(d,wx+.05,wb+2,y1-4,0,10.6,PANEL);                                          // 목재 게시벽
 for(let y=wb+5;y<y1-6;y+=7)d.line([{x:wx+.15,y,z:0},{x:wx+.15,y,z:10.6}],PANEL_DARK,.9);
 wallX(d,wx+.1,wb+2,y1-4,0,1.2,PANEL_DARK);
 wallX(d,wx+.15,wb+6,y1-9,4.6,10.2,'#f3f1e4',PANEL_DARK,1.2);
 for(let y=wb+8;y<y1-11;y+=7)wallX(d,wx+.2,y+.8,y+5.4,5.4,9.6,['#cfe0e6','#e2dcc4','#d6e2cd','#e6d7cf'][(y>>1)%4],'#b7b3a0',.7);
 d.ellipse(wx+.25,wb+5,2.1,2.1,'#efe9d8',6.6,'#6d6a58');                           // 高 교표
 d.ellipse(wx+.3,wb+5,1.3,1.3,null,6.6,'#6d6a58');
 entrance(d,{x:108,y0:l.east[0],y1:l.east[1],side:'east'});                    // 우측(운동장) 입구
 d.ellipse(101,y1-8,2.4,2.4,'#efeade',0,'#c3bda9');
 d.ellipse(101,y1-8,2.6,2.6,'#4d7a52',3.1);
 for(let i=0;i<5;i++)d.line([{x:101,y:y1-8,z:3.1},{x:101+Math.cos(i*1.26)*3,y:y1-8+Math.sin(i*1.26)*3,z:6.4}],'#3f6b47',1.8);
 d.ellipse(62,y1-14,2.2,1.6,'#b5463c88');
 for(let i=0;i<4;i++){                                                         // 복도까지 번지는 현관 채광
  const a=['1e','16','10','0a'][i];
  d.rect(26,y0-4-i*4,20,4,DAY+a);d.rect(26,y1+i*4,20,4,DAY+a);
 }
 for(const y of [y0-17,y1+17]){                                                // 중앙현관 방향 유도등
  wallY(d,y,30,43,11.2,13.8,'#3f7d5c','#e8efe6',1);
  d.line([{x:34,y:y+.03,z:12.6},{x:39,y:y+.03,z:12.6}],'#eaf3e8',1.8);
 }
}

// 사진3·5: 동편현관은 좌우 입구가 마주 보고, 우측 입구 옆 계단이 좌측 입구를 향한다.
function eastHall(d,l,wx){
 const y0=l.y,y1=l.y+l.d,[wa,wb]=l.west;
 slab(d,l,wx);
 wallX(d,wx+.05,y0+2,y1-2,0,4.6,MINT_PALE);
 wallX(d,wx+.1,y0+2,y1-2,4.6,5.1,MINT);
 entrance(d,{x:0,y0:wa,y1:wb,side:'west',pier:false,height:12,wx});          // 좌측 입구
 entrance(d,{x:108,y0:l.east[0],y1:l.east[1],side:'east'});                    // 우측(운동장) 입구
 wallY(d,y0+.3,58,82,4.6,11.4,'#3c6f56','#e6ece4',1.4);                        // 녹색 게시판
 for(let i=0;i<3;i++)wallY(d,y0+.2,61+i*7,66+i*7,5.6,10.4,'#f4f2e6','#cfc9b6',.7);
 d.rect(30,y0+8,16,7,DAY+'16');
}

function upperHall(d,l,wx){
 slab(d,l,wx);
 d.rect(6,l.y+l.d*.45,14,2.4,TACTILE);
}

export function mainRoom(d,scene){
 const f=mainFloor(scene);if(!f)return false;
 const halls=f.lobbies,wx=f.wx,runs=westWallRuns(f);
 const walled=(a,b)=>runs.some(([p,q])=>a>=p+1&&b<=q-1);
 d.c.fillStyle=P.ink;d.c.fillRect(0,0,d.c.canvas.width,d.c.canvas.height);
 d.rect(-4,-4,f.w+8,f.d+8,'#454c43');
 terrazzo(d,f);
 d.rect(wx+3,2,16,f.d-4,'#ded6c022');
 for(const x of [wx+2.6,41.4])d.line([{x,y:2},{x,y:f.d-2}],'#b3ae9c55',1.2);
 if(wx){                                                    // 복도 밖 서쪽 구역: 방들이 한 덩어리로 이어져 보이게
  surface(d,0,0,wx,f.d,'stone');
  d.rect(0,0,wx,f.d,'#4a5248aa');
  d.box(-1.5,0,1.5,f.d,5,TRIM,WALL,WALL);                   // 건물 서쪽 외벽
  d.box(-1.5,0,1.5,f.d,.5,WALL,WALL,TRIM,5);
 }
 d.box(wx,-2,f.w-wx,2,15,TRIM,WALL,TRIM);
 for(const [a,b] of runs){                                  // 창문이 있는 복도 서쪽 벽
  d.box(wx-2,a,2,b-a,15,TRIM,WALL,WALL);
  wallX(d,wx+.14,a,b,0,5,DADO);
  for(let y=a+4;y<b-2;y+=9)d.line([{x:wx+.15,y,z:.9},{x:wx+.15,y,z:5}],DADO_EDGE+'88',.8);
  wallX(d,wx+.16,a,b,4.7,5.3,DADO_EDGE);
  wallX(d,wx+.18,a,b,0,.9,SKIRT);
 }
 for(let y=12;y<f.d-25;y+=26)if(walled(y-1,y+20))corridorWindow(d,wx,y,y+19);
 for(let y=16;y<f.d-14;y+=26)d.rect(wx+6,y,12,7,DAY+'1a');
 for(const r of f.rooms){
  const wood=['classroom','library'].includes(r.kind);
  if(!r.hidden)surface(d,r.x+2,r.y+2,r.w-3,r.d-3,wood?'wood':'stone');
  if(r.side==='north'){
   d.rect(r.doorX-7,r.y+r.d-4,14,5,'#cdc6b2');endDoor(d,r);
  }else{
   if(r.side==='west'&&!r.hidden)d.rect(r.x,r.y,r.w,r.d,'#e2dbc8');
   d.rect(r.side==='west'?r.x+r.w-2.5:r.x-2,r.doorY-7,5,14,'#cdc6b2');sideDoor(d,r);
  }
  if(r.kind==='classroom'){d.box(r.x+13,r.y+3,37,1.2,8,P.treeDark,P.tree,P.treeDark,4);d.line([{x:r.x+18,y:r.y+4.3,z:8},{x:r.x+41,y:r.y+4.3,z:8}],P.paper,1);}
  if(r.kind==='toilet'&&!r.hidden)d.label(r.x+r.w/2,r.y+3,r.name.includes('여자')?'여':'남',P.ink,7);
  namePlate(d,r);
 }
 for(const lobby of halls){
  if(f.level>1)upperHall(d,lobby,wx);
  else if(lobby.id==='front')frontHall(d,lobby,wx);
  else if(lobby.id==='central')centralHall(d,lobby,wx);
  else eastHall(d,lobby,wx);
  d.label(66,lobby.y+lobby.d*.6,lobby.name,P.ink,1);
 }
 if(f.level>1){d.box(47,4,61,2,6,TRIM,WALL,TRIM);d.label(79,8,'이후 구역 · 준비 중',P.ink,8);}
 d.label(f.wx+14,f.d-8,f.name,P.ink,8);return true;
}
// 실 이름은 떠 있는 UI 라벨이 아니라 문 옆 명패 위의 글자로만 표시한다.
export function drawMainLabels(d,scene){
 const f=mainFloor(scene);if(!f)return;
 for(const r of f.rooms)plateLabel(d,r);
}
export function drawMainObject(d,o){
 if(o.type==='wall'){
  if(o.id.startsWith('west-wall-')||o.hidden)return true;   // 복도 서쪽 외벽·감춘 칸막이는 그리지 않는다(충돌만)
  d.box(o.x,o.y,o.w,o.d,4.5,TRIM,WALL,WALL);
  d.box(o.x,o.y,o.w,o.d,1.1,DADO,DADO,DADO);
  d.box(o.x,o.y,o.w,o.d,.4,WALL,WALL,TRIM,4.5);return true;
 }
 if(o.type==='stairs'){
  if(o.pad)return true;                                     // 계단 앞 상호작용 판은 그리지 않는다
  const dir=o.dir||'-y',alongY=dir==='-y'||dir==='+y',run=alongY?o.d:o.w,slabs=8;
  // 사진2 · 계단은 복도로 튀어나오지 않고 벽 안쪽 계단실에 들어가 있다.
  // mouth 는 복도를 향해 열린 면. 반대편에 안쪽 벽, 먼 쪽에 옆벽, 입구에 문선과 상인방을 세워 깊이를 만든다.
  if(o.mouth){
   const H=12.6,x0=o.x,x1=o.x+o.w,y0=o.y,y1=o.y+o.d,mx=o.mouth;
   if(mx==='+x'||mx==='-x'){
    const back=mx==='+x'?x0:x1,mouthX=mx==='+x'?x1:x0;
    d.rect(x0,y0,o.w,o.d,'#28322c18',.015);                                     // 계단실 바닥 그늘
    wallX(d,back,y0,y1,0,H,'#ded9ca');
    wallX(d,back,y0,y1,0,4.4,MINT_PALE);
    wallY(d,y0,x0,x1,0,H,'#e6e2d4','#cfcabb',.8);
    d.poly([{x:mouthX,y:y0,z:H-2.3},{x:mouthX,y:y1,z:H-2.3},{x:mouthX,y:y1,z:H},{x:mouthX,y:y0,z:H}],WALL,TRIM,1);
    for(const yy of [y0,y1])d.line([{x:mouthX,y:yy,z:0},{x:mouthX,y:yy,z:H}],TRIM,1.6);
   }else{
    const back=mx==='+y'?y0:y1,mouthY=mx==='+y'?y1:y0;
    d.rect(x0,y0,o.w,o.d,'#28322c18',.015);
    wallY(d,back,x0,x1,0,H,'#ded9ca');
    wallY(d,back,x0,x1,0,4.4,MINT_PALE);
    wallX(d,x0,y0,y1,0,H,'#e6e2d4','#cfcabb',.8);
    d.poly([{x:x0,y:mouthY,z:H-2.3},{x:x1,y:mouthY,z:H-2.3},{x:x1,y:mouthY,z:H},{x:x0,y:mouthY,z:H}],WALL,TRIM,1);
    for(const xx of [x0,x1])d.line([{x:xx,y:mouthY,z:0},{x:xx,y:mouthY,z:H}],TRIM,1.6);
   }
  }
  // t=0 발판(아래), t=1 꼭대기.
  const at=t=>alongY?(dir==='-y'?o.y+o.d-run*t:o.y+run*t):(dir==='-x'?o.x+o.w-run*t:o.x+run*t);
  for(let j=0;j<slabs;j++){
   const h=1+j*.8,a=at(j/slabs),b=at((j+1)/slabs),lo=Math.min(a,b),size=run/slabs;
   if(alongY)d.box(o.x,lo,o.w,size,h,'#c3c6be','#aeb2ab','#9aa09a');
   else d.box(lo,o.y,size,o.d,h,'#c3c6be','#aeb2ab','#9aa09a');
   const edge=alongY?lo+(dir==='-y'?0:size):lo+(dir==='-x'?0:size);
   if(dir==='+x')wallX(d,edge,o.y,o.y+o.d,h-.8,h,'#9ba19a');   // 카메라 반대쪽 챌판을 직접 그린다
   if(dir==='+y')wallY(d,edge,o.x,o.x+o.w,h-.8,h,'#9ba19a');
   d.line(alongY?[{x:o.x,y:edge,z:h},{x:o.x+o.w,y:edge,z:h}]:[{x:edge,y:o.y,z:h},{x:edge,y:o.y+o.d,z:h}],'#5a635e',1.4);
  }
  const side=(t,z)=>alongY?{x:o.x+o.w,y:at(t),z}:{x:at(t),y:o.y+o.d,z};
  d.poly([side(0,0),side(1,0),side(1,7.6),side(0,1.2)],MINT);                  // 사진1·3의 청록 사선 도장
  d.line([side(0,1.2),side(1,7.6)],MINT_DARK,1.4);
  for(const edge of [0,1]){
   const rail=(t,z)=>{const p=side(t,z);return alongY?{x:o.x+edge*o.w,y:p.y,z}:{x:p.x,y:o.y+edge*o.d,z};};
   d.line([rail(0,3.4),rail(1,9.8)],'#8e9ca0',1.8);
   for(let i=0;i<=4;i++)d.line([rail(i/4,1+i*1.6),rail(i/4,3.4+i*1.6)],'#8e9ca0',1.1);
  }
  if(o.closet){                                                                 // 계단 아래 창고(사진2)
   const a=side(.58,0),b=side(.97,0),lo=Math.min(a.x,b.x),hi=Math.max(a.x,b.x),ly=Math.min(a.y,b.y),hy=Math.max(a.y,b.y);
   if(alongY){wallX(d,o.x+o.w+.02,ly,hy,0,5.4,WOOD,WOOD_DARK,1.2);d.label(o.x+o.w,(ly+hy)/2,'창고',P.ink,6);}
   else{wallY(d,o.y+o.d+.02,lo,hi,0,5.4,WOOD,WOOD_DARK,1.2);
    d.line([{x:(lo+hi)/2,y:o.y+o.d+.04,z:0},{x:(lo+hi)/2,y:o.y+o.d+.04,z:5.4}],WOOD_DARK,1.4);
    d.ellipse((lo+hi)/2+1.4,o.y+o.d+.06,.35,.35,'#7d6a4e',2.7);
    d.label((lo+hi)/2,o.y+o.d,'창고',P.ink,6);}
  }
  const foot=side(-.12,0);                                                      // 계단 앞 점자블록
  if(alongY)d.rect(o.x,foot.y-(dir==='-y'?0:2.6),o.w,2.6,TACTILE);
  else d.rect(foot.x-(dir==='-x'?0:2.6),o.y,2.6,o.d,TACTILE);
  d.label(alongY?o.x+o.w/2:foot.x,alongY?foot.y+3:o.y+o.d/2,o.name,P.ink,7);return true;
 }
 if(o.type==='parcel'||o.type==='shelf'){
  const h=o.type==='parcel'?7.6:10,metal=o.type==='parcel';
  if(metal){                                                                    // 사진2 · 바닥에 붙어 선 보관함
   d.rect(o.x-.6,o.y-.6,o.w+1.2,o.d+1.6,'#28322c22',.012);                      // 접지 그림자
   d.box(o.x+.4,o.y+.4,o.w-.8,o.d-.8,.6,'#8f9691','#9aa19c','#7d847f');         // 받침 굽
  }
  d.box(o.x,o.y,o.w,o.d,h,metal?'#b6bbb8':TRIM,metal?'#c9cdc8':WALL,metal?'#969d99':TRIM,metal?.6:0);
  for(let i=0;i<3;i++)for(let j=0;j<2;j++){
   const x=o.x+i*o.w/3,z=(metal?1.5:1)+j*(metal?3.2:4);
   d.poly([{x:x+.6,y:o.y+o.d+.1,z},{x:x+o.w/3-.6,y:o.y+o.d+.1,z},{x:x+o.w/3-.6,y:o.y+o.d+.1,z:z+(metal?2.6:3)},{x:x+.6,y:o.y+o.d+.1,z:z+(metal?2.6:3)}],metal?'#d3b98d':P.treeLight,metal?'#a98f66':TRIM);
   if(metal)d.line([{x:x+.6,y:o.y+o.d+.15,z:z+1.3},{x:x+o.w/3-.6,y:o.y+o.d+.15,z:z+1.3}],'#a98f66',.8);
  }
  if(metal)d.label(o.x+o.w/2,o.y+o.d,'택배 보관함',P.ink,11);return true;
 }
 if(o.type==='stall'){                                                          // 교직원 화장실 칸막이
  d.box(o.x,o.y,o.w,o.d,6.2,'#dfe3dc','#e8ebe2','#c6ccc2');
  d.poly([{x:o.x+o.w,y:o.y+.6,z:.4},{x:o.x+o.w,y:o.y+o.d-.6,z:.4},{x:o.x+o.w,y:o.y+o.d-.6,z:5.6},{x:o.x+o.w,y:o.y+.6,z:5.6}],'#c2cfc6','#9fada4',.8);
  return true;
 }
 if(o.type==='basin'){
  d.box(o.x,o.y,o.w,o.d,3.4,'#e9ece3','#dfe3da','#c2c8bf');
  for(let i=0;i<2;i++)d.ellipse(o.x+2.4+i*3,o.y+o.d/2,1.2,.9,'#cfd8d0',3.45,'#a9b3ab');
  return true;
 }
 if(o.type==='copier'){                                                         // 인쇄실 복사기
  d.box(o.x,o.y,o.w,o.d,5.4,'#c9cec6','#d6dad1','#a8b0a7');
  d.box(o.x+1,o.y+1,o.w-2,o.d-2,.7,'#8e9a92','#b4bcb2','#8e9a92',5.4);
  d.rect(o.x+1.6,o.y+1.6,o.w-3.2,3,'#f3f1e6',6.2);
  d.poly([{x:o.x+1,y:o.y+o.d+.05,z:1.4},{x:o.x+o.w-1,y:o.y+o.d+.05,z:1.4},{x:o.x+o.w-1,y:o.y+o.d+.05,z:2.6},{x:o.x+1,y:o.y+o.d+.05,z:2.6}],'#7f8a83');
  return true;
 }
 return false;
}
