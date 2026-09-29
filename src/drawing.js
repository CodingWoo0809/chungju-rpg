import {person,tree} from './actors.js';
export const PALETTE={grass:'#91ad72',grassLight:'#a5bc83',road:'#b4b6a7',path:'#d2cbb5',roof:'#7eaaa2',wall:'#e4e0ca',side:'#a9b9a9',window:'#53777c',track:'#bb8066',field:'#709575',tree:'#456e50',treeLight:'#72905a',treeDark:'#345441',paper:'#fffdf5',ink:'#263c36'};
export class Draw {
 constructor(ctx,project){this.c=ctx;this.p=project;}
 poly(points,fill,stroke=null,width=1){const c=this.c;c.beginPath();points.forEach((v,i)=>{const p=this.p(v.x,v.y,v.z||0);i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y);});c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
 rect(x,y,w,d,fill,z=0,stroke=null){this.poly([{x,y,z},{x:x+w,y,z},{x:x+w,y:y+d,z},{x,y:y+d,z}],fill,stroke);}
 line(points,color,width=1){const c=this.c;c.beginPath();points.forEach((v,i)=>{const p=this.p(v.x,v.y,v.z||0);i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y);});c.strokeStyle=color;c.lineWidth=width;c.stroke();}
 ellipse(x,y,rx,ry,fill,z=0,stroke=null){const pts=[];for(let i=0;i<40;i++){const a=i/40*Math.PI*2;pts.push({x:x+Math.cos(a)*rx,y:y+Math.sin(a)*ry,z});}this.poly(pts,fill,stroke);}
 box(x,y,w,d,h,roof=PALETTE.roof,wall=PALETTE.wall,side=PALETTE.side,z=0){this.poly([{x:x+w,y,z},{x:x+w,y:y+d,z},{x:x+w,y:y+d,z:z+h},{x:x+w,y,z:z+h}],side);this.poly([{x,y:y+d,z},{x:x+w,y:y+d,z},{x:x+w,y:y+d,z:z+h},{x,y:y+d,z:z+h}],wall);this.rect(x,y,w,d,roof,z+h);}
 label(x,y,text,color=PALETTE.ink,z=0,back=true){const c=this.c,p=this.p(x,y,z);c.font='600 12px "Malgun Gothic", sans-serif';c.textAlign='center';const w=c.measureText(text).width,view=c.canvas.getBoundingClientRect();if(p.x< -w/2||p.x>view.width+w/2||p.y<0||p.y>view.height+20)return;p.x=Math.max(w/2+12,Math.min(view.width-w/2-12,p.x));if(back){c.fillStyle='#fffdf5ed';c.beginPath();c.roundRect(p.x-w/2-9,p.y-17,w+18,24,5);c.fill();}c.fillStyle=color;c.fillText(text,p.x,p.y);}
 person(n,t,player=false,equipment=null,armor=null,aura=null,helmet=null){person(this,n,t,player,equipment,armor,aura,helmet);}
 tree(x,y,h=20,lift=0){tree(this,x,y,h,lift);}
}
