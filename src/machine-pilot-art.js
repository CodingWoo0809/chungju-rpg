const ART={
 servo:{url:new URL('../assets/monsters/machine-pilot/raging-cart-directions.png',import.meta.url).href,
  edges:[0,590,1100,1881],sourceY:170,sourceHeight:460},
 cogger:{url:new URL('../assets/monsters/machine-pilot/cutting-turret-directions.png',import.meta.url).href,
  edges:[0,661,1285,1983],sourceY:75,sourceHeight:635}
};
const TAU=Math.PI*2;
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
const smooth=v=>{const t=clamp(v);return t*t*(3-2*t);};
const images={};

export function loadMachinePilotArt(){
 if(typeof Image==='undefined')return;
 for(const [kind,art] of Object.entries(ART)){
  if(images[kind])continue;
  const image=new Image();image.decoding='async';image.src=art.url;images[kind]=image;
 }
}

function sprite(c,kind,view,x,y,width,height,sourceTop=0,sourceBottom=1,angle=0){
 const image=images[kind],art=ART[kind];
 if(!image?.complete||!image.naturalWidth)return;
 const sx=art.edges[view],sw=art.edges[view+1]-sx;
 const sy=art.sourceY+art.sourceHeight*sourceTop;
 const sh=art.sourceHeight*(sourceBottom-sourceTop);
 const dy=-height+height*sourceTop,dh=height*(sourceBottom-sourceTop);
 c.save();c.translate(x,y+dy+dh/2);c.rotate(angle);
 c.drawImage(image,sx,sy,sw,sh,-width/2,-dh/2,width,dh);c.restore();
}

function spark(c,x,y,scale,alpha,time){
 if(alpha<=0)return;
 c.save();c.translate(x,y);c.globalAlpha*=clamp(alpha);
 c.strokeStyle='#ffbd69';c.lineWidth=.24;c.lineCap='round';
 for(let i=0;i<5;i++){
  const a=i*TAU/5+time*4,r=(.6+Math.sin(time*15+i)*.22)*scale;
  c.beginPath();c.moveTo(Math.cos(a)*r*.55,Math.sin(a)*r*.55);
  c.lineTo(Math.cos(a)*r*1.4,Math.sin(a)*r*1.4);c.stroke();
 }
 c.fillStyle='#fff3c0';c.beginPath();c.arc(0,0,.3*scale,0,TAU);c.fill();c.restore();
}

function groundDust(c,x,y,amount,time){
 if(amount<=0)return;
 c.save();c.globalAlpha=clamp(amount*.55);c.fillStyle='#c2b09a';
 for(let i=0;i<4;i++){
  const dx=Math.sin(time*8+i*2.2)*(.6+i*.45);
  c.beginPath();c.ellipse(x+dx,y-.2-i*.13,.45+i*.08,.23,0,0,TAU);c.fill();
 }c.restore();
}

export function drawRagingCart(c,m,pose={}){
 if(!images.servo)loadMachinePilotArt();
 const direction=pose.direction||'front',view=direction==='back'?1:direction==='front'?0:2;
 const side=view===2,mirror=direction==='left'?-1:1;
 const time=pose.time||0,move=clamp(pose.move||0),wind=clamp(pose.windup||0),hit=clamp(pose.hit||0);
 const age=Number.isFinite(pose.attackAge)?Math.max(0,pose.attackAge):Infinity;
 const impact=age<.22?1-smooth(age/.22):0;
 const wheelAngle=(pose.travel||0)/2.35;
 const width=side?20:17,height=side?10.4:11;
 const forwardX=side?2.15:0,forwardY=side?0:direction==='front'?1.3:-1.3;
 const compression=wind*.43,thrust=impact*1.1;
 c.save();c.fillStyle='rgba(24,25,24,.28)';c.beginPath();
 c.ellipse(0,0,side?9.2:7,1.25,0,0,TAU);c.fill();
 c.scale(mirror,1);
 c.translate(forwardX*(thrust-compression*.35),forwardY*(thrust-compression*.4));
 const engineVibration=Math.sin(time*(move> .1?18:12))*(.025+wind*.08);
 const pitch=move*Math.sin(time*4.2)*.018+hit*Math.sin(time*21)*.11-impact*.04;
 c.rotate(pitch);
 sprite(c,'servo',view,0,engineVibration+compression*.32-hit*.18,width,height);
 const hubs=side?[[-5.4,-2.65],[5.1,-2.65]]:[[-4.8,-2.6],[4.8,-2.6]];
 for(const [x,y] of hubs){
  c.save();c.translate(x,y);c.rotate(wheelAngle);
  c.strokeStyle='rgba(214,204,186,.78)';c.lineWidth=.27;
  c.beginPath();c.arc(0,0,side?1.18:.75,0,TAU);c.stroke();
  for(let i=0;i<4;i++){
   const a=i*TAU/4;c.beginPath();c.moveTo(Math.cos(a)*.24,Math.sin(a)*.24);
   c.lineTo(Math.cos(a)*(side?1:.62),Math.sin(a)*(side?1:.62));c.stroke();
  }
  c.restore();
  groundDust(c,x,y+2,move*Math.abs(Math.sin(wheelAngle*2))*.22+wind*.35+impact*.4,time);
 }
 if(wind>.4){
  c.save();c.globalAlpha=(wind-.4)*.65;c.strokeStyle='#f4bb75';c.lineWidth=.4;
  c.beginPath();c.moveTo(side?-6.8:-4,-2);c.lineTo(side?-9.5:-7,-2.6);c.stroke();c.restore();
 }
 if(impact>.03){
  const bx=side?9:0,by=side?-3.1:direction==='front'?-1.35:-3.25;
  spark(c,bx,by,2.3,impact,time);
 }
 if(hit>.04)spark(c,0,-4.2,1.7,hit*.72,time);
 c.restore();
}

export function drawCuttingTurret(c,m,pose={}){
 if(!images.cogger)loadMachinePilotArt();
 const direction=pose.direction||'front',view=direction==='back'?1:direction==='front'?0:2;
 const side=view===2,mirror=direction==='left'?-1:1;
 const time=pose.time||0,move=clamp(pose.move||0),wind=clamp(pose.windup||0),hit=clamp(pose.hit||0);
 const age=Number.isFinite(pose.attackAge)?Math.max(0,pose.attackAge):Infinity;
 const release=age<.25?1-smooth(age/.25):0;
 const spinSpeed=2+wind*24+release*13;
 const width=side?21:19.4,height=19.7;
 const gait=pose.gait||0;
 c.save();c.fillStyle='rgba(28,27,24,.27)';c.beginPath();c.ellipse(0,0,8.7,1.55,0,0,TAU);c.fill();
 c.scale(mirror,1);
 const baseJolt=move*Math.max(0,Math.sin(gait))*.2;
 sprite(c,'cogger',view,0,baseJolt+hit*.25,width,height,.55,1);
 const aimLean=wind*(side?.065:.04)+hit*Math.sin(time*25)*.1;
 sprite(c,'cogger',view,move*Math.sin(gait)*.12-hit*.35,-baseJolt*.3-wind*.1,width,height,0,.55,aimLean);
 const cutterX=side?8.1:view===0?0:7.4,cutterY=-13.7;
 c.save();c.translate(cutterX,cutterY);c.rotate(time*spinSpeed);
 c.strokeStyle=`rgba(241,220,179,${.47+wind*.32})`;c.lineWidth=.31+wind*.13;
 c.beginPath();c.arc(0,0,side?1.55:2.0,0,TAU);c.stroke();
 for(let i=0;i<5;i++){
  const a=i*TAU/5;c.beginPath();c.moveTo(Math.cos(a)*.75,Math.sin(a)*.75);
  c.lineTo(Math.cos(a)*(side?1.6:2.05),Math.sin(a)*(side?1.6:2.05));c.stroke();
 }
 c.restore();
 const cut=smooth((wind-.27)/.7);
 if(cut>.02||release>.02){
  const intensity=Math.max(cut*.7,release);
  spark(c,cutterX,cutterY,1.4+intensity*1.6,intensity,time);
  for(let i=0;i<3;i++){
   const a=time*12+i*2.1;
   spark(c,cutterX+Math.cos(a)*(1+i*.55),cutterY+Math.sin(a)*(1+i*.35),.25,intensity*.56,time+i);
  }
 }
 if(release>.04){
  const dx=side?3.7:0,dy=side?0:direction==='front'?2:-2;
  spark(c,cutterX+dx*release,cutterY+dy*release,1.4,release,time);
 }
 if(hit>.04)spark(c,0,-11,2,hit*.5,time);
 c.restore();
}
