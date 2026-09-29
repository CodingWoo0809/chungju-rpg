import {ROOF_COLORS,shade} from './roof-colors.js';
import {gradient,facePoint,panel,facade,drawGymRoof,WALL_MATERIALS,MACHINE_ANNEX} from './facade-art.js';
import {surface} from './materials.js';
const MATERIAL = {
  plaster: '#d3cbb7', brick: '#927669', glass: '#47616c', roof: '#627b73',
  frame: '#c8c9bd', shadow: '#283b36', stone: '#a7a497', light: '#eee7d4'
};

function raisedBox(d, x, y, w, depth, z, h, top, front, side) {
  d.poly([{x: x+w,y,z},{x:x+w,y:y+depth,z},{x:x+w,y:y+depth,z:z+h},{x:x+w,y,z:z+h}], side);
  d.poly([{x,y:y+depth,z},{x:x+w,y:y+depth,z},{x:x+w,y:y+depth,z:z+h},{x,y:y+depth,z:z+h}], front);
  d.rect(x,y,w,depth,top,z+h);
}

function roof(d, b) {
  const {x,y,w,d:depth,h} = b;const color=ROOF_COLORS[b.id];
  if (b.id === 'gym') { drawGymRoof(d,b,color); return; }
  d.rect(x,y,w,depth, '#b9bba8', h);
  d.rect(x+1.8,y+1.8,w-3.6,depth-3.6,
    gradient(d,{x,y,z:h},{x:x+w,y:y+depth,z:h},[[0,shade(color,.17)],[.5,color],[1,shade(color,-.20)]]),h+.05);
  // Revision 60 · 지붕 색은 그대로 두고 방수 도장의 얼룩·보수 자국·흐름 자국만 같은 범위에 덧칠한다.
  if(d.c.createPattern)surface(d,x+1.8,y+1.8,w-3.6,depth-3.6,'roof',h+.06);   // 캔버스 없는 테스트 컨텍스트에서는 건너뜀
  d.line([{x:x+1.8,y:y+depth-1.8,z:h+.07},{x:x+w-1.8,y:y+depth-1.8,z:h+.07},{x:x+w-1.8,y:y+1.8,z:h+.07}],'rgba(28,36,32,.28)',1.4);  // 파라펫 안쪽 그늘
  // 사진1 · 급식소 쪽 끝 38 칸은 회색 패널 증축부다(facade-art.js MACHINE_ANNEX). 지붕도 밝은 회색으로
  // 끊고 경계에 파라펫 선을 그어, 위에서 내려다봐도 붉은 벽돌 본동과 다른 동으로 읽히게 한다.
  if(b.id==='machine') {
    d.rect(x+2,y+2,w-4,MACHINE_ANNEX-2,'#c9c8bf',h+.08);
    d.rect(x+2.8,y+2.8,w-5.6,MACHINE_ANNEX-3.6,'#d5d4cb',h+.12);
    d.line([{x:x+2,y:y+MACHINE_ANNEX,z:h+.2},{x:x+w-2,y:y+MACHINE_ANNEX,z:h+.2}],'#8f9089',1.6);
  }
  for (let v = 7; v < depth-3; v += 10) {
    d.line([{x:x+2,y:y+v,z:h+.1},{x:x+w-2,y:y+v,z:h+.1}], '#bcc6aa25', .65);
  }
  for (let u = 8; u < w-2; u += 10) {
    d.line([{x:x+u,y:y+2,z:h+.1},{x:x+u,y:y+depth-2,z:h+.1}], '#273f362b', .65);
  }
  d.line([{x:x+2,y:y+depth-2,z:h+.2},{x:x+2,y:y+2,z:h+.2},{x:x+w-2,y:y+2,z:h+.2}], '#233e395c', 2);
  for (let i=0;i<Math.min(6,Math.floor(depth/44));i++) {
    const ay=y+12+i*44, ax=x+w*.24;
    d.rect(ax+2,ay+2,9,10,'#263c3645',h+.3);
    raisedBox(d,ax,ay,7,8,h+.3,2.5,'#c3c7b6','#a7afa0','#7d8a80');
    d.ellipse(ax+3.5,ay+4,2.2,2.2,'#60726b',h+2.85);
    for(let r=0;r<3;r++)d.line([{x:ax+1,y:ay+2+r*1.8,z:h+2.9},{x:ax+6,y:ay+2+r*1.8,z:h+2.9}], '#a9b7a4', .6);
  }
}

function doorway(d,b,door) {
  const side=door.side, horizontal=side==='front'||side==='back', u=horizontal?door.x-b.x:door.y-b.y;
  const width=door.width || 6, prominent=b.id==='main'&&(door.id==='main:right'||door.id==='main:front'), gym=b.id==='gym', height=prominent?12:gym?10:8;
  panel(d,b,side,u-width/2-1,0,width+2,height+1,prominent?'#756b64':MATERIAL.stone);
  panel(d,b,side,u-width/2,.4,width,height,'#304b50','#c7cbbb');
  for(let offset=-width/2+width/4;offset<width/2;offset+=width/4) {
    d.line([facePoint(b,side,u+offset,.4),facePoint(b,side,u+offset,height)],'#becac2',.9);
  }
  panel(d,b,side,u-width/2,2.4,width,.35,'#a6b9b0');
  panel(d,b,side,u-width/2,height-2,width,.35,'#a6b9b0');
  const canopyWidth=width+(gym?6:3), overhang=gym?8:prominent?4:2.5;
  const cx=horizontal?b.x+u-canopyWidth/2:side==='right'?b.x+b.w:b.x-overhang;
  const cy=horizontal?(side==='front'?b.y+b.d:b.y-overhang):b.y+u-canopyWidth/2;
  raisedBox(d,cx,cy,horizontal?canopyWidth:overhang,horizontal?overhang:canopyWidth,height+.9,gym?2:.7,gym?'#cfab94':prominent?'#8e8378':'#b9c9ba',gym?'#bd8c79':prominent?'#756b64':'#688074','#647c70');
  for(let step=2;step>=0;step--) {
    const reach=1+step*.65;
    d.rect(side==='front'?cx:cx,side==='front'?cy:cy,
      horizontal?canopyWidth:reach,horizontal?reach:canopyWidth,
      step%2?'#a8aa99':'#c4c4b0',.3+(2-step)*.3);
  }
  if(prominent)for(const offset of [-width/2,width/2]) {
    const p=facePoint(b,side,u+offset,0,overhang-.4);
    d.line([p,{...p,z:height+.8}],'#c7ccba',2);
  }
}

// 운동장 쪽 사진의 중앙현관: 화강석 기둥 두 짝, 얕은 계단, 캔틸레버 캐노피, 어두운 유리 출입구.
function mainPorch(d,b,door) {
  const side=door.side,u=door.y-b.y,width=door.width||14,height=13,M=WALL_MATERIALS;
  const x0=b.x+b.w,y0=b.y+u-width/2;
  panel(d,b,side,u-width/2-1.6,0,width+3.2,height+1.6,M.mainStone);
  panel(d,b,side,u-width/2-1.6,height+1.6,width+3.2,.8,M.mainStoneDark);
  panel(d,b,side,u-width/2,.6,width,height-1,'#2d3f46','#b9b3a1');
  for(let offset=-width/2+width/4;offset<width/2;offset+=width/4)
    d.line([facePoint(b,side,u+offset,.6),facePoint(b,side,u+offset,height-.4)],'#93a7a8',.9);
  d.line([facePoint(b,side,u-width/2,height-3.4),facePoint(b,side,u+width/2,height-3.4)],'#a7b6b2',1);
  for(let step=2;step>=0;step--)                                   // 현관 계단
    d.rect(x0,y0-1.6-step*.8,2.4+step*2.2,width+3.2+step*1.6,step%2?'#b6b0a0':'#cdc7b6',1.4-step*.45);
  for(const y of [y0-2.6,y0+width-.6])                               // 짙은 대리석 기둥(사진4)
    raisedBox(d,x0+.4,y,3,2.8,0,height+1.2,'#3b332e','#4a403a','#2e2724');
  for(const y of [y0-2.6,y0+width-.6])for(let i=0;i<3;i++)
    d.line([{x:x0+3.4,y:y+.5+i*.8,z:1.5},{x:x0+3.4,y:y+.9+i*.8,z:height}],'#7a6a5e88',.9);
  raisedBox(d,x0-.4,y0-4.4,5.2,width+8,height+1.2,1.4,                // 캐노피 슬래브
    shade(M.mainStone,.08),M.mainStoneDark,shade(M.mainStone,-.1));
  d.line([{x:x0+4.8,y:y0-4.4,z:height+1.2},{x:x0+4.8,y:y0+width+3.6,z:height+1.2}],'#8f7a5f',1.2);
  const pole=y0-7.5,px=x0+5.5;                                      // 국기 게양대
  d.ellipse(px,pole,1.4,1,'#26382d26');
  d.line([{x:px,y:pole,z:0},{x:px,y:pole,z:20}],'#e6e2d4',2.4);
  d.line([{x:px,y:pole,z:0},{x:px,y:pole,z:20}],'#9ea396',.9);
  d.poly([{x:px,y:pole,z:20},{x:px,y:pole+5,z:19.2},{x:px,y:pole+5,z:15.6},{x:px,y:pole,z:16.4}],'#f4f1e6','#b9b3a1');
  d.line([{x:px,y:pole+2.5,z:17.8},{x:px,y:pole+2.5,z:17.8}],'#b0483f',3);
}

// 사진2(2026-09 정정) · 자동화기계과 우측 큰 현관 — 넓은 통유리 양문에 흰 평지붕 차양, 낮은 계단 두 단.
// 실제 사진처럼 돌기둥 없이 단순하게, 하지만 generic doorway() 보다 훨씬 존재감 있게 만든다.
function machineEntrance(d,b,door) {
  const side=door.side,u=door.y-b.y,width=door.width||11,height=11;
  const x0=b.x+b.w,y0=b.y+u-width/2;
  panel(d,b,side,u-width/2-1,0,width+2,height+1,'#c9c7ba');                 // 밝은 테두리
  panel(d,b,side,u-width/2,.5,width,height-1,
    gradient(d,facePoint(b,side,u-width/2,height-1),facePoint(b,side,u+width/2,.5),
      [[0,'#c9dadd'],[.4,'#8fb3b8'],[1,'#405a60']]),'#eef1ea');             // 통유리 양문
  for(let offset=-width/2+width/5;offset<width/2;offset+=width/5)
    d.line([facePoint(b,side,u+offset,.5),facePoint(b,side,u+offset,height-.5)],'#eef1ea',1);
  d.line([facePoint(b,side,u-width/2,height*.62),facePoint(b,side,u+width/2,height*.62)],'#eef1ea',.8);
  for(let step=1;step>=0;step--)                                            // 낮은 계단 두 단
    d.rect(x0,y0-1-step*1.1,1.6+step*1.6,width+2+step*2.2,step%2?'#cfcabb':'#dcd8ca',1.2-step*.5);
  for(const y of [y0-1.4,y0+width+.4])                                      // 가는 지지 기둥
    raisedBox(d,x0+.3,y,1.6,1.6,0,height+.9,'#e7e4d7','#f0eee2','#c7c4b6');
  raisedBox(d,x0-.3,y0-3.2,4.4,width+6.4,height+.9,1.1,                     // 흰 평지붕 차양
    '#e8e6da','#d6d3c5','#c1beb0');
}
function machineRoadPorch(d,b,door) {
  const M=WALL_MATERIALS,u=door.y-b.y,width=door.width,height=12;
  const x=b.x+b.w,y=door.y-width/2,reach=6;
  panel(d,b,'right',u-width/2-1.4,0,width+2.8,height+1.2,M.machineWhite);
  panel(d,b,'right',u-width/2,.8,width,height-.8,
    gradient(d,facePoint(b,'right',u-width/2,height),facePoint(b,'right',u+width/2,1),
      [[0,'#718c91'],[.4,MATERIAL.glass],[1,'#253d42']]),M.frame);
  for(let i=0;i<=4;i++)d.line([facePoint(b,'right',u-width/2+width*i/4,.8),facePoint(b,'right',u-width/2+width*i/4,height)],M.machineWhite,1.6);
  panel(d,b,'right',u-width/2,4.5,width,.65,'#287fba');
  panel(d,b,'right',u-width/2,9.1,width,.25,M.frame);
  for(const offset of [-.5,.5])d.line([facePoint(b,'right',u+offset,4.9,.12),facePoint(b,'right',u+offset,6.4,.12)],MATERIAL.light,1.7);
  for(const offset of [-7,3])d.line([facePoint(b,'right',u+offset,7),facePoint(b,'right',u+offset+3,8.7)],'#c9dadd66',1);
  for(let step=2;step>=0;step--)raisedBox(d,x,y-1-step*.35,2+step*1.7,width+2+step*.7,0,1.5-step*.4,
    step%2?'#b6b3a7':'#cbc8ba',MATERIAL.stone,'#8d9189');
  for(const py of [y-1.5,y+width+.2])raisedBox(d,x+.25,py,1.4,1.3,1.1,height-.2,M.machineWhite,'#f0eee2','#c7c4b6');
  raisedBox(d,x-.15,y-2.5,reach,width+5,height+.7,1.7,M.machineWhite,'#d6d3c5','#c1beb0');
  d.line([{x:x+reach-.15,y:y-2.5,z:height+.7},{x:x+reach-.15,y:y+width+2.5,z:height+.7}],'#929489',1);
  const a=d.p(x+reach,y+width+1,height+1.45),z=d.p(x+reach,y-1,height+1.45);
  d.c.save();d.c.translate(a.x,a.y);d.c.rotate(Math.atan2(z.y-a.y,z.x-a.x));
  d.c.font='bold 12px "Malgun Gothic",sans-serif';d.c.fillStyle='#263c36';d.c.textAlign='center';d.c.textBaseline='middle';
  d.c.fillText('자동화기계과',Math.hypot(z.x-a.x,z.y-a.y)/2,0);d.c.restore();
  for(const py of [y-6,y+width+2]){
    raisedBox(d,x+.3,py,4.5,4,0,2.1,'#c0b9a6',M.machine,shade(M.machine,-.15));
    d.rect(x+.7,py+.4,3.7,3.2,'#514b35',2.13);
    d.line([{x:x+2.5,y:py+2,z:2},{x:x+2.5,y:py+2,z:5.6}],'#63523b',2.5);
    for(const [dx,dy,h,r] of [[0,0,5.8,3.2],[-1.2,1,5.4,2.5],[1.2,-.8,6.2,2.4]]){
      d.ellipse(x+2.5+dx,py+2+dy,r,r*.75,'#345441',h);
      d.ellipse(x+2.2+dx,py+1.7+dy,r*.85,r*.6,'#59734a',h+.55);
    }
  }
}
function electricRoadPorch(d,b,door) {
  const side='left',u=door.y-b.y,width=door.width,height=12.5,M=WALL_MATERIALS;
  const x=b.x,y=door.y-width/2,reach=6;
  panel(d,b,side,u-width/2-1.3,0,width+2.6,height+1,M.white);
  panel(d,b,side,u-width/2,.6,width,height-.6,
    gradient(d,facePoint(b,side,u-width/2,height),facePoint(b,side,u+width/2,.6),
      [[0,'#9eb9bd'],[.32,M.glass],[1,'#253d42']]),M.frame);
  for(let i=0;i<=4;i++)d.line([facePoint(b,side,u-width/2+width*i/4,.6),facePoint(b,side,u-width/2+width*i/4,height)],M.frame,1.5);
  panel(d,b,side,u-width/2,4.6,width,.5,'#84999b');
  panel(d,b,side,u-width/2,9.4,width,.35,M.frame);
  for(const offset of [-.55,.55])d.line([facePoint(b,side,u+offset,5,.12),facePoint(b,side,u+offset,6.6,.12)],'#f0eee2',1.7);
  for(const offset of [-7,3])d.line([facePoint(b,side,u+offset,7),facePoint(b,side,u+offset+2.7,9)],'#d6e6d155',1);
  for(let step=2;step>=0;step--)raisedBox(d,x-1.5-step*1.15,y-1-step*.4,1.5+step*1.15,width+2+step*.8,0,1.5-step*.4,
    step%2?'#c3c1b8':'#d9d7cc','#a7a79e','#92958f');
  for(const py of [y-1.4,y+width+.1])raisedBox(d,x-reach+.4,py,1.5,1.3,0,height+.8,M.frame,'#f0eee2','#c6c9c1');
  raisedBox(d,x-reach,y-2.6,reach+.4,width+5.2,height+.8,1.35,'#eeede6','#d4d6ce','#b9bdb4');
  d.line([{x:x-reach,y:y-2.6,z:height+.8},{x:x-reach,y:y+width+2.6,z:height+.8}],'#9da8a1',1.1);
}
// 사진5 · 동편현관 좌측 입구: 완만한 경사로와 스테인리스 난간.
function sideRamp(d,b,door) {
  const u=door.y-b.y,x0=b.x,y0=b.y+u-7,width=14,reach=11;
  d.rect(x0-reach,y0-1,reach+1,width+2,'#a7a89b');
  for(let i=0;i<6;i++)d.rect(x0-reach+i*reach/6,y0,reach/6+.1,width,i%2?'#cfcdc0':'#c6c4b7',.4+i*.32);
  for(const y of [y0,y0+width])for(let i=0;i<=5;i++) {
    const x=x0-reach+i*reach/5,z=.5+i*.42;
    d.line([{x,y,z},{x,y,z:z+3.4}],'#c9ccc4',1.4);
  }
  for(const y of [y0,y0+width])d.line([{x:x0-reach,y,z:3.9},{x:x0,y,z:6}],'#dde0d8',1.8);
  d.line([{x:x0-reach,y:y0,z:2.3},{x:x0,y:y0,z:4.4}],'#c2c6be',1.1);
}

function inside(p, polygon) {
  let hit=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const a=polygon[i],b=polygon[j];
    if(((a.y>p.y)!==(b.y>p.y))&&(p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x))hit=!hit;
  }
  return hit;
}

export function drawBuilding(d,b,state) {
  const {x,y,w,d:depth,h}=b;
  const outline=[d.p(x,y,h),d.p(x+w,y,h),d.p(x+w,y,0),d.p(x+w,y+depth,0),d.p(x,y+depth,0),d.p(x,y+depth,h)];
  const canvas=d.c.canvas, ratio=globalThis.devicePixelRatio||1;
  if(outline.every(p=>p.x < -80)||outline.every(p=>p.x>canvas.width/ratio+80)||outline.every(p=>p.y < -80)||outline.every(p=>p.y>canvas.height/ratio+80))return;
  for(let spread=3;spread>=1;spread--) {
    const distance=h*.3+spread;
    d.poly([{x:x+3,y:y+depth},{x:x+w+distance,y:y+depth+distance*.5},{x:x+w+distance,y:y+distance*.5},{x:x+w,y}], '#1d302316');
  }
  d.c.save();
  const player=d.p(state.player.x,state.player.y,5);
  const obscured=state.scene==='campus'&&(inside(player,outline)||inside(d.p(state.player.x,state.player.y),outline));
  if(obscured)d.c.globalAlpha=.42;
  for(const door of b.doors||[b.door])if(door.side==='left'||door.side==='back'){
    if(door.id!=='electric:left-front')doorway(d,b,door);
    if(b.id==='main')sideRamp(d,b,door);
  }
  facade(d,b,'right');
  facade(d,b,'front');
  roof(d,b);
  if(b.id==='main')d.label(x+w/2,y+depth+.1,'충주공업고등학교','#293532',h-17,false);
  for(const door of b.doors||[b.door])if(door.side==='front'||door.side==='right')
    (door.id==='main:right'?mainPorch:door.id==='machine:right-front'?machineRoadPorch:door.id==='machine:right'?machineEntrance:doorway)(d,b,door);   // 사진5 · 동편현관은 평범한 문이라 포치를 두지 않는다
  if(obscured&&b.id==='electric'){
    d.c.globalAlpha=.9;
    electricRoadPorch(d,b,b.doors.find(door=>door.id==='electric:left-front'));
  }
  d.c.restore();
  for(const door of b.doors||[b.door]) {
    const near=Math.hypot(state.player.x-door.x,state.player.y-door.y)<23;
    d.ellipse(door.x,door.y,near?3.3:2,near?2.5:1.5,near?'#e8cb86d9':'#c8ba829e',.1,'#efe6c280');
    if(near&&door!==b.door)d.label(door.x,door.y+5,door.label,'#314337',0,true);
  }
  // Revision 61 · 건물 이름은 바닥(정문 앞) 대신 옥상에 띄운다. 정문 쪽 옥상 가장자리 안쪽으로 붙여,
  // 이름이 어느 건물의 어느 쪽 입구를 가리키는지는 예전과 같게 읽힌다. 장성관은 곡면 지붕 높이를 따른다.
  {
    const lx=Math.max(x+3,Math.min(x+w-3,b.door.x)),ly=Math.max(y+3,Math.min(y+depth-3,b.door.y));
    const lz=b.id==='gym'?h+Math.sin((ly-y)/depth*Math.PI)*12+2:h+3;
    d.label(lx,ly,b.name,'#314337',lz,true);
  }
}
