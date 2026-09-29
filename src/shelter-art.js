import {occludesPlayer} from './campus-props.js';
export const RAINBOW=['#c74c47','#df8944','#dfbb46','#609558','#4e93ae','#546da2','#90649c'];
const WOOD='#c39a63',WOOD_DARK='#8e6c43',STEEL='#dcdad0',STEEL_DARK='#a9a79b';
// 사진1 참고: 보도블럭 위 흰 막구조(용마루가 있는 모임지붕) + 원목 피크닉 테이블 2열 + 색색 벤치 + 화분.
function picnicTable(d,x,y,color){
 const w=9,depth=7.5;
 d.rect(x+.6,y+.6,w,depth,'#26342b22');
 for(const u of [x+1.2,x+w-1.9])for(const v of [y+2.4,y+depth-3.4]) // 다리
  d.box(u,v,.7,.7,3,STEEL_DARK,STEEL,'#8b8a80');
 for(const v of [y+.5,y+depth-2]){                                  // 양옆 벤치
  d.box(x,v,w,1.7,.45,color,color,'#00000022',1.75);
  for(const u of [x+1,x+w-1.7])d.box(u,v+.5,.6,.6,1.75,STEEL_DARK,STEEL,'#8b8a80');
 }
 d.box(x+.5,y+2.3,w-1,depth-4.6,.5,WOOD,WOOD_DARK,'#6b5334',3);     // 상판
 for(let u=1.2;u<w-1.2;u+=1.6)d.line([{x:x+u,y:y+2.5,z:3.54},{x:x+u,y:y+depth-2.5,z:3.54}],'#a9814f66',.6);
}
// 사진1 · 포장 위에 따로 놓인 색 벤치.
function bench(d,x,y,color,along='x'){
 const w=along==='x'?8:1.9,depth=along==='x'?1.9:8;
 d.rect(x+.5,y+.5,w,depth,'#26342b1e');
 for(const [u,v] of along==='x'?[[x+.7,y+.4],[x+w-1.4,y+.4]]:[[x+.4,y+.7],[x+.4,y+depth-1.4]])
  d.box(u,v,.7,.7,1.6,STEEL_DARK,STEEL,'#8b8a80');
 d.box(x,y,w,depth,.42,color,color,'#00000026',1.6);
 const n=along==='x'?w:depth;
 for(let t=.6;t<n-.5;t+=1.3)
  d.line(along==='x'?[{x:x+t,y,z:2.04},{x:x+t,y:y+depth,z:2.04}]:[{x,y:y+t,z:2.04},{x:x+w,y:y+t,z:2.04}],'#00000018',.5);
}
function planter(d,x,y,tone='#c9b8a4',bloom='#d8b048'){
 d.ellipse(x,y,1.9,1.4,'#26342b1e');
 d.box(x-1.5,y-1.1,3,2.2,2.1,tone,'#d6c7b3','#a89880');
 d.ellipse(x,y,1.5,1.1,'#4d7a52',2.15);
 for(let i=0;i<5;i++)d.line([{x,y,z:2.15},{x:x+Math.cos(i*1.26)*1.9,y:y+Math.sin(i*1.26)*1.4,z:4.2}],'#3f6b47',1.4);
 for(let i=0;i<4;i++)d.ellipse(x+Math.cos(i*1.6)*1.3,y+Math.sin(i*1.6)*.95,.55,.42,bloom,4.3);
}
export function drawShelter(d,o,state){
 const {x,y,w,d:depth}=o;
 // 바닥은 캠퍼스 광장과 같은 보도블럭. 쉼터 자리만 살짝 색을 달리해 구획을 보여 준다.
 d.rect(x-2,y-2,w+4,depth+4,'#b3a491');
 for(let v=0;v<depth+4;v+=2.6)d.line([{x:x-2,y:y-2+v},{x:x+w+2,y:y-2+v}],'#9c8d7a55',.7);
 for(let u=0;u<w+4;u+=5.2)d.line([{x:x-2+u,y:y-2},{x:x-2+u,y:y+depth+2}],'#9c8d7a3a',.6);
 d.rect(x+1.5,y+1.5,w-3,depth-3,'#c0b19c');
 // 사진1 · 원목 피크닉 테이블 4열 2행, 벤치 색은 무지개 순서로 돌아간다.
 const cols=Math.max(2,Math.floor((w-8+2)/9.6)),gap=cols>1?(w-8-cols*9)/(cols-1):0,tables=[];
 for(const ty of [y+6.5,y+depth-14])for(let i=0;i<cols;i++)tables.push([x+4+i*(9+gap),ty]);
 tables.forEach(([tx,ty],i)=>picnicTable(d,tx,ty,RAINBOW[i%RAINBOW.length]));
 // 사진1 · 테이블 바깥 가장자리를 두르는 색 벤치와 화분.
 for(const [i,[bx,by,axis]] of [[x+5,y+1.4,'x'],[x+w-13,y+1.4,'x'],[x+5,y+depth-3.3,'x'],[x+w-13,y+depth-3.3,'x'],
  [x+.8,y+depth*.5-4,'y'],[x+w-2.7,y+depth*.5-4,'y']].entries())
  bench(d,bx,by,RAINBOW[(i*2+1)%RAINBOW.length],axis);
 for(const [px,py,bloom] of [[x+3,y+4.5,'#e0a13c'],[x+3,y+depth-4.5,'#d8628f'],[x+w-3,y+5,'#dfc247'],
  [x+w-3,y+depth-5,'#e0a13c'],[x+w*.5,y+1.6,'#d8628f'],[x+w*.5,y+depth-1.6,'#dfc247']])planter(d,px,py,'#c9b8a4',bloom);
 const px0=x+4,px1=x+w-4,py0=y+4,py1=y+depth-4,peak=15.6,eave=11.2,over=2.6;
 // 2026-09 · 예전에는 "쉼터 중심에서 44칸 안" 이면 무조건 지붕을 흐리게 했다. 반경이 워낙 넓어
 // 근처만 지나가도 지붕이 늘 반투명해 보여, 지붕이 제대로 보이질 않았다. 창고·밴드부와 같은
 // 실루엣 판정으로 바꿔서 — 평소에는 지붕이 온전히 보이고, 실제로 지붕에 가려지는 자리로
 // 들어갔을 때만 흐려져 안쪽 알록달록한 테이블·벤치가 드러난다.
 // (바닥·테이블·벤치·화분은 이 블록 밖에서 이미 그려졌으므로 흐려지는 건 지붕과 기둥뿐이다.)
 const close=state&&occludesPlayer(d,{x,y,w,d:depth,h:peak},state);
 d.c.save();if(close)d.c.globalAlpha=.34;
 for(const cx of [px0,(px0+px1)/2,px1])for(const cy of [py0,py1]){   // 가느다란 강관 기둥 6본
  d.box(cx-.55,cy-.55,1.1,1.1,eave,STEEL_DARK,STEEL,'#8b8a80');
  d.ellipse(cx,cy,1.5,1.1,'#c8c4b5',.06);
 }
 const a={x:px0-over,y:py0-over,z:eave},b={x:px1+over,y:py0-over,z:eave},c={x:px1+over,y:py1+over,z:eave},e={x:px0-over,y:py1+over,z:eave};
 const my=(py0+py1)/2,r0={x:x+w*.33,y:my,z:peak},r1={x:x+w*.67,y:my,z:peak};   // 사진1 · 짧은 용마루가 있는 모임지붕
 d.poly([a,b,r1,r0],'#f7f6eee6','#d5d2c4',1);
 d.poly([b,c,r1],'#e7e5dae6','#d5d2c4',1);
 d.poly([c,e,r0,r1],'#eceadfdd','#d5d2c4',1);
 d.poly([e,a,r0],'#fbfaf3e6','#d5d2c4',1);
 for(let i=1;i<7;i++){const t=i/7;                                  // 막을 잡아 주는 케이블
  d.line([{x:a.x+(b.x-a.x)*t,y:a.y,z:eave+.1},{x:r0.x+(r1.x-r0.x)*t,y:my,z:peak}],'#cdcabc55',.6);
  d.line([{x:e.x+(c.x-e.x)*t,y:e.y,z:eave+.1},{x:r0.x+(r1.x-r0.x)*t,y:my,z:peak}],'#cdcabc55',.6);
 }
 d.line([r0,r1],'#c6c3b5',1.6);
 for(const [p,q] of [[a,b],[b,c],[c,e],[e,a]]){                     // 사진1 · 물결 모양으로 처진 처마
  const n=Math.max(6,Math.round(Math.hypot(q.x-p.x,q.y-p.y)/5)),hem=[];
  for(let i=0;i<=n*4;i++){const t=i/(n*4);
   hem.push({x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t,z:eave-.35-Math.abs(Math.sin(t*n*Math.PI))*.85});}
  d.poly([p,q,...hem.slice().reverse()],'#efede2ee','#cdcabc',.8);
  d.line(hem,'#b9b6a8',1);
 }
 d.c.restore();
 d.label(x+w/2,y+depth/2,'장이쉼터','#314337',17.2,true);                                   // Revision 61 · 이름을 지붕 위에
}
