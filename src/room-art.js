import {PALETTE as P} from './drawing.js';
import {surface} from './materials.js';
const GOLD='#dca85c';
function base(d,o){
 d.rect(o.x+1,o.y+1,o.w,o.d,P.ink+'24');
 for(const x of [o.x+1,o.x+o.w-2])for(const y of [o.y+1,o.y+o.d-2])d.box(x,y,1,1,4,P.road,P.wall,P.window);
 d.box(o.x,o.y,o.w,o.d,.7,P.path,P.wall,P.window,4);surface(d,o.x,o.y,o.w,o.d,'wood',4.75);
}
function wire(d,points,color=GOLD){d.line(points.map(([x,y])=>({x,y,z:5.4})),color,2);}
function circuit(d,o){
 const x=o.x+3,y=o.y+3;
 d.rect(x,y,17,7,P.treeDark,5);wire(d,[[x+2,y+1],[x+14,y+1],[x+14,y+6],[x+2,y+6],[x+2,y+1]]);
 d.box(x+1,y+2,3,3,1,P.road,P.wall,P.window,5.2);
 d.box(x+7,y+.2,3,1.6,1,GOLD,P.path,P.track,5.3);
 d.ellipse(x+14,y+4,1.3,1.3,P.paper,5.6,GOLD);
 d.rect(o.x+1,o.y+1,21,11,P.window+'10',7,P.wall);
}
function gears(d,o){
 const x=o.x+5,y=o.y+6;
 for(const [dx,r] of [[0,2],[5,2.6],[12,3.3]]){
  d.ellipse(x+dx,y,r,r,P.road,5.1,P.window);
  for(let i=0;i<12;i++){
   const a=i/12*Math.PI*2;
   d.line([{x:x+dx+Math.cos(a)*(r-.4),y:y+Math.sin(a)*(r-.4),z:5.3},{x:x+dx+Math.cos(a)*(r+.5),y:y+Math.sin(a)*(r+.5),z:5.3}],P.window,2);
  }
  d.ellipse(x+dx,y,.65,.65,GOLD,5.5,P.ink);
 }
}
function model(d,o){
 const x=o.x+3,y=o.y+2;
 d.rect(x,y,17,9,P.paper,5);d.box(x,y,17,.5,4,P.wall,P.wall,P.window,5);d.box(x,y,.5,9,4,P.wall,P.wall,P.window,5);
 for(let i=0;i<3;i++)d.poly([{x:x+2+i*5,y:y+.6,z:6},{x:x+5+i*5,y:y+.6,z:6},{x:x+5+i*5,y:y+.6,z:8},{x:x+2+i*5,y:y+.6,z:8}],P.window);
 for(const dx of [3,10])d.box(x+dx,y+3,3,2,1,P.path,P.wall,P.window,5);
 d.ellipse(x+14,y+6,1.2,1,P.tree,6);d.box(x+13.3,y+5.4,1.4,1.4,.8,P.track,P.track,P.path,5);
}
function bridge(d,o){
 const x=o.x+2,y=o.y+2;
 d.rect(x,y,19,9,P.window,5);for(const [i,ground] of [[0,1],[1,2],[2,.5]]){
  d.box(x+2+i*6,y+2,3,5,ground,P.grass,P.treeLight,P.treeDark,5);
  d.box(x+2.7+i*6,y+3,1.6,3,4-ground,P.road,P.wall,P.window,5+ground);
 }
 d.box(x+1,y+2.5,18,4,.5,P.path,P.wall,P.window,9);
 for(const side of [2.5,6.5])d.line([{x:x+1,y:y+side,z:10},{x:x+19,y:y+side,z:10}],P.window,1);
}
function panels(d,o,archive=false){
 const colors=[P.track,P.window,P.treeLight];
 for(let i=0;i<3;i++){
  const x=o.x+2+i*7,y=o.y+2;
  d.box(x,y,5,.6,6,colors[i],P.path,P.window,5);
  d.poly([{x:x+.5,y:y+.7,z:6},{x:x+4.5,y:y+.7,z:6},{x:x+4.5,y:y+.7,z:10},{x:x+.5,y:y+.7,z:10}],P.paper);
  for(let j=0;j<3;j++)d.line([{x:x+1,y:y+.75,z:9-j},{x:x+4,y:y+.75,z:9-j}],colors[i],1);
 }
 d.rect(o.x+3,o.y+7,8,4,P.paper,5);wire(d,[[o.x+4,o.y+8],[o.x+9,o.y+8]],P.window);
 if(archive){d.ellipse(o.x+17,o.y+9,2,2,GOLD,5.5);d.box(o.x+16,o.y+8,2,2,2,P.window,P.wall,P.treeDark,5.5);}
}
function stage(d,o){
 d.box(o.x+2,o.y+2,19,4,1,P.ink,P.window,P.treeDark,5);
 for(let i=0;i<3;i++){
  const x=o.x+5+i*6;
  d.line([{x,y:o.y+3,z:6},{x,y:o.y+3,z:11}],P.window,2);
  d.box(x-1,o.y+2,2,2,1,P.window,P.road,P.ink,10);
  d.poly([{x,y:o.y+4,z:10},{x:x-2,y:o.y+11,z:5},{x:x+2,y:o.y+11,z:5}],GOLD+'38');
 }
 for(let i=0;i<5;i++)d.box(o.x+4+i*3,o.y+8,1,2,.5,P.road,P.wall,P.window,5);
}
// exhibit = 이름이 있고 F 로 살펴보는 전시(본관 · 진로 · 꿈키움홀), decor = 과실의 이름 없는 전시 모형(Revision 79, 상호작용 없음).
export function drawRoomObject(d,o){
 if(!['exhibit','decor'].includes(o.type))return false;
 base(d,o);
 ({circuit,gears,model,bridge,archive:(d,o)=>panels(d,o,true),portfolio:panels,stage})[o.art]?.(d,o);
 if(o.type==='exhibit')d.label(o.x+o.w/2,o.y,o.name,P.ink,15);
 return true;
}
