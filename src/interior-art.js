import {mainRoom} from './main-interior-art.js';
import {surface} from './materials.js';
export function room(d,scene){
 if(mainRoom(d,scene))return;
 const c=d.c;c.fillStyle='#454c43';c.fillRect(0,0,c.canvas.width,c.canvas.height);
 d.rect(-4,-4,119,99,'#30372f');surface(d,0,0,110,90,scene==='dreamhall'?'wood':'stone');
 d.box(0,-2,110,2,16,'#ada897','#c6bfad','#7d8070');d.box(-2,0,2,90,16,'#ada897','#c6bfad','#888b78');
 d.box(0,0,110,.4,1,'#8a7d61','#8a7d61','#8a7d61');d.box(0,0,.4,90,1,'#8a7d61','#8a7d61','#8a7d61');
 for(let x=9;x<100;x+=22){d.poly([{x,y:.2,z:6},{x:x+14,y:.2,z:6},{x:x+14,y:.2,z:14},{x,y:.2,z:14}],'#66827b','#ded8c6');d.line([{x:x+7,y:.3,z:6},{x:x+7,y:.3,z:14}],'#c9cbb8',1);d.poly([{x,y:1,z:0},{x:x+14,y:1,z:0},{x:x+25,y:22,z:0},{x:x+11,y:22,z:0}],'#e9dfb51c');}
 for(let y=10;y<80;y+=22){d.poly([{x:.2,y,z:7},{x:.2,y:y+13,z:7},{x:.2,y:y+13,z:14},{x:.2,y,z:14}],'#647d74','#d6d2bd');d.line([{x:.3,y:y+6.5,z:7},{x:.3,y:y+6.5,z:14}],'#c9cbb8',1);}
 if(scene==='dreamhall'){d.poly([{x:30,y:.4,z:3},{x:80,y:.4,z:3},{x:80,y:.4,z:13},{x:30,y:.4,z:13}],'#dbd5bf','#6d715e');d.label(55,1,'꿈이 자라는 공간','#5d6351',7,false);}
}
