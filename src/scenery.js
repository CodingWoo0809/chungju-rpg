import {drawRoomObject} from './room-art.js';
import {drawShelter} from './shelter-art.js';
import {surface} from './materials.js';
function leg(d,x,y,h){d.box(x,y,.7,.7,h,'#7f8277','#a9aa9b','#585f58');}
function table(d,o,h=5){d.rect(o.x+1,o.y+1,o.w,o.d,'#26342b24');for(const x of [o.x+1,o.x+o.w-2])for(const y of [o.y+.7,o.y+o.d-1.5])leg(d,x,y,h);d.box(o.x,o.y,o.w,o.d,.5,'#826748','#bba077','#665b4a',h);surface(d,o.x,o.y,o.w,o.d,'wood',h+.55);}
function chair(d,x,y){for(const a of [0,2.7])for(const b of [0,2.7])leg(d,x+a,y+b,2.4);d.box(x-.3,y-.3,4,4,.4,'#9b8260','#bbaa83','#736a52',2.5);d.box(x-.3,y+2.8,4,.6,2.4,'#9b8260','#bbaa83','#736a52',3);}
export function drawObject(d,o,state){if(drawRoomObject(d,o))return;
 if(o.type==='shelter'){drawShelter(d,o,state);return;}
 const c=d.c;
 if(o.type==='exit'){d.rect(o.x-4,o.y,16,3,'#53664e');for(let i=0;i<3;i++)d.line([{x:o.x+i*3,y:o.y+.5},{x:o.x+i*3+1,y:o.y+1.5},{x:o.x+i*3,y:o.y+2.5}],'#d9d7bb',1);return;}
 if(o.type==='hoop'){d.line([{x:o.x+4,y:o.y,z:0},{x:o.x+4,y:o.y,z:13}],'#7d8c87',3);d.poly([{x:51,y:10,z:12},{x:61,y:10,z:12},{x:61,y:10,z:19},{x:51,y:10,z:19}],'#e4e2d6','#808c83');d.ellipse(56,14,3,3,null,12,'#bb8066');for(let i=-2;i<=2;i++)d.line([{x:56+i,y:14,z:12},{x:56+i*.6,y:14,z:9}],'#deddd1',1);return;}
 if(o.type==='bench'){for(const x of [o.x+1,o.x+o.w-2]){leg(d,x,o.y+1,2.5);leg(d,x,o.y+o.d-1,2.5);}for(let j=0;j<3;j++){d.box(o.x,o.y+j*o.d/3,o.w,o.d/3-.3,.4,'#886d4d','#ac9168','#665945',2.5);d.box(o.x,o.y+o.d-.5,o.w,.5,.8,'#886d4d','#ac9168','#665945',3.4+j*.9);}return;}
 if(o.type==='boxing'){const p=d.p(o.x+o.w/2,o.y+o.d/2,10),q=d.p(o.x+o.w/2,o.y+o.d/2,1);c.strokeStyle='#535953';c.lineWidth=1;c.beginPath();c.moveTo(p.x,p.y-25);c.lineTo(p.x,p.y);c.stroke();const g=c.createLinearGradient(p.x-10,0,p.x+10,0);g.addColorStop(0,'#583c32');g.addColorStop(.4,'#a06b4f');g.addColorStop(1,'#644739');c.fillStyle=g;c.beginPath();c.roundRect(p.x-10,p.y,20,q.y-p.y,6);c.fill();return;}
 if(o.type==='hall'){for(const x of [o.x+1,o.x+o.w-2])for(const y of [o.y+1,o.y+o.d-2])leg(d,x,y,2);d.box(o.x,o.y,o.w,o.d,.7,'#897658','#b5a07a','#6d6652',2);surface(d,o.x,o.y,o.w,o.d,'wood',2.7);leg(d,o.x+o.w/2,o.y+3,10);d.line([{x:o.x+o.w/2,y:o.y+3,z:10},{x:o.x+o.w/2+2,y:o.y+3,z:10}],'#343e38',2);return;}
 if(o.type==='nurse'){table(d,o,3);d.box(o.x+1,o.y+1,o.w-2,o.d-2,1,'#a1b7b1','#d7ddd1','#91a7a1',3.5);d.box(o.x+2,o.y+2,5,o.d-4,1,'#d4d2c3','#ece7d7','#b7bfb2',4.5);return;}
 if(['desk','counsel','meal'].includes(o.type)){table(d,o);if(o.type!=='meal'){chair(d,o.x+o.w/2-2,o.y+o.d+1);d.rect(o.x+2,o.y+2,4,3,'#e2dec8',5.65);d.line([{x:o.x+3,y:o.y+3,z:5.7},{x:o.x+5,y:o.y+3,z:5.7}],'#758982',.6);}if(o.device){/* 앞 책상의 실습 장치 모형(장식, Revision 79 부터 상호작용 없음) */d.box(o.x+9,o.y+1,6,5,3,'#67776e','#a1aaa0','#485e55',5.6);d.ellipse(o.x+12,o.y+3,1.5,1.5,'#b0b2a0',9,'#4d5c53');}if(o.type==='meal')for(let x=3;x<o.w-3;x+=9){d.rect(o.x+x,o.y+2,6,5,'#bac2b6',5.7,'#6c7f74');d.ellipse(o.x+x+3,o.y+4,2,1.5,'#ae8c52',5.8);}return;}
 if(o.type==='notice'){for(const x of [o.x,o.x+o.w])leg(d,x,o.y,8);d.box(o.x,o.y,o.w,.7,5,'#a89775','#bdad86','#6e735f',5);d.poly([{x:o.x+1,y:o.y+.8,z:6},{x:o.x+o.w-1,y:o.y+.8,z:6},{x:o.x+o.w-1,y:o.y+.8,z:9},{x:o.x+1,y:o.y+.8,z:9}],'#d6d5bf');return;}
 table(d,o,3);
}
