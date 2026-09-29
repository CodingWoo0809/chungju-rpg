const ART={
 firefly:{url:new URL('../assets/monsters/electric-pilot/firefly-directions.png',import.meta.url).href,
  edges:[0,661,1322,1983],height:793,cuts:[0,270,555,793],width:17,heightWorld:18},
 android:{url:new URL('../assets/monsters/electric-pilot/elevator-directions.png',import.meta.url).href,
  edges:[0,627,1254,1882],height:836,cuts:[0,240,690,836],width:17,heightWorld:25}
};
const TAU=Math.PI*2;
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
const smooth=v=>{const t=clamp(v);return t*t*(3-2*t);};
const images={};

export function loadElectricPilotArt(){
 if(typeof Image==='undefined')return;
 for(const [kind,art] of Object.entries(ART)){
  if(images[kind])continue;
  const image=new Image();image.decoding='async';image.src=art.url;images[kind]=image;
 }
}

function segment(c,kind,view,band,x=0,y=0,rotation=0){
 const art=ART[kind],image=images[kind];
 if(!image?.complete||!image.naturalWidth)return;
 const sx=art.edges[view],sw=art.edges[view+1]-sx;
 const sy=art.cuts[band],sh=art.cuts[band+1]-sy;
 const dw=art.width,dh=sh/art.height*art.heightWorld;
 const top=-art.heightWorld+sy/art.height*art.heightWorld;
 c.save();c.translate(x,y+top+dh/2);c.rotate(rotation);
 c.drawImage(image,sx,sy,sw,sh,-dw/2,-dh/2,dw,dh);c.restore();
}

function glow(c,x,y,r,alpha,color='#ffe782'){
 if(alpha<=0)return;
 c.save();c.globalAlpha*=clamp(alpha);
 const g=c.createRadialGradient(x,y,0,x,y,r);
 g.addColorStop(0,'#fffbe0');g.addColorStop(.23,color);g.addColorStop(1,'rgba(255,203,65,0)');
 c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();
}

function arc(c,x1,y1,x2,y2,index,alpha){
 c.save();c.globalAlpha*=clamp(alpha);c.strokeStyle=index%2?'#fff3a7':'#ffc94a';
 c.lineWidth=index%2?.3:.45;c.lineCap='round';
 const mx=(x1+x2)/2,my=(y1+y2)/2;
 c.beginPath();c.moveTo(x1,y1);c.lineTo(mx-1.1,my-.65);c.lineTo(mx+.7,my+.3);
 c.lineTo(x2,y2);c.stroke();c.restore();
}

function setup(c,pose,kind){
 const direction=pose.direction||'front',view=direction==='back'?1:direction==='front'?0:2;
 const mirror=direction==='right'?-1:1;
 const time=pose.time||0,move=clamp(pose.move||0),wind=clamp(pose.windup||0),hit=clamp(pose.hit||0);
 const age=Number.isFinite(pose.attackAge)?Math.max(0,pose.attackAge):Infinity;
 c.save();c.fillStyle='rgba(24,28,27,.23)';c.beginPath();
 c.ellipse(0,0,kind==='android'?7.3:5.8,kind==='android'?1.5:1.15,0,0,TAU);c.fill();
 c.scale(mirror,1);
 return{view,time,move,wind,hit,age};
}

export function drawElectricFirefly(c,m,pose={}){
 if(!images.firefly)loadElectricPilotArt();
 const{view,time,move,wind,hit,age}=setup(c,pose,'firefly');
 const gait=pose.gait||0,release=age<.22?1-smooth(age/.22):0;
 const bob=Math.sin(time*5.4)*.15-move*.35;
 const lunge=release*1.15+wind*.15;
 segment(c,'firefly',view,2,move*Math.sin(gait)*.27,bob+move*Math.abs(Math.sin(gait))*.22+hit*.45,
  move*Math.sin(gait)*.025+hit*.08);
 segment(c,'firefly',view,1,lunge,bob+hit*.25,wind*.075-release*.1+hit*.1);
 segment(c,'firefly',view,0,lunge*.72+move*Math.sin(time*5-1)*.12,
  bob+Math.sin(time*3.8)*.13-wind*.12,wind*.09-release*.08+hit*.15);
 const side=view===2;
 const bulbs=side?[[-3.5,-14.7],[1,-17.2],[5.3,-16],[7,-12.7],[4.8,-9.9]]
  :[[-6.2,-13],[-4.6,-17.1],[-1.6,-16.4],[2.2,-17.1],[5.2,-15.4],[7,-12.6]];
 for(let i=0;i<bulbs.length;i++){
  const[x,y]=bulbs[i],flicker=.46+.28*Math.sin(time*(8.1+i*.73)+i*2.3);
  glow(c,x+lunge*.8,y+Math.sin(time*4+i)*.15,1.15+wind*.9+release*1.2,
   flicker+wind*.3+release*.35);
 }
 const charge=smooth((wind-.18)/.7),power=Math.max(charge*.65,release);
 if(power>.04){
  for(let i=0;i<5;i++){
   const a=i*TAU/5+time*2.4,r=4.3+power*2.2;
   arc(c,Math.cos(a)*3,-9.4+Math.sin(a)*2.8,Math.cos(a)*r,-9.4+Math.sin(a)*r,i,power);
  }
 }
 if(release>.05){
  glow(c,view===2?-4.2:0,-9,5.4*release,release*.85,'#fff8b5');
  c.save();c.globalAlpha=release*.85;c.strokeStyle='#fff6b8';c.lineWidth=.4;
  c.beginPath();c.arc(0,-9,4.8+release*2,0,TAU);c.stroke();c.restore();
 }
 if(hit>.04){glow(c,0,-9,3.2,hit*.7,'#e6faff');}
 c.restore();
}

export function drawBrokenElevator(c,m,pose={}){
 if(!images.android)loadElectricPilotArt();
 const{view,time,move,wind,hit,age}=setup(c,pose,'android');
 const gait=pose.gait||0,release=age<.25?1-smooth(age/.25):0;
 const clunk=move*Math.max(0,Math.sin(gait))*.36;
 const fault=Math.sin(time*11.7)> .88?.32:0;
 const charge=smooth((wind-.1)/.85);
 segment(c,'android',view,2,move*Math.sin(gait)*.16,clunk+hit*.32,move*Math.sin(gait)*.012);
 const bodyX=fault*.1+move*Math.sin(gait-1)*.15+hit*.52;
 const bodyY=-clunk*.35+fault*.1+hit*.22;
 segment(c,'android',view,1,bodyX,bodyY,move*Math.sin(gait-.6)*.012+hit*.08);
 segment(c,'android',view,0,bodyX+Math.sin(time*2.9)*.07,
  bodyY+Math.sin(time*3.9)*.08-wind*.13,
  Math.sin(time*2.9)*.008+wind*.035+hit*.11);
 c.save();c.translate(view===2?-1.5:1.55,-21.5);c.rotate(time*(move*.95+wind*2.7)+Math.sin(time*4)*.055);
 c.strokeStyle='#d7a940';c.lineWidth=.22;c.globalAlpha=.58+wind*.28;
 c.beginPath();c.arc(0,0,2.18,0,TAU);c.stroke();
 for(let i=0;i<4;i++){const a=i*TAU/4;c.beginPath();c.moveTo(Math.cos(a)*1.45,Math.sin(a)*1.45);
  c.lineTo(Math.cos(a)*2.15,Math.sin(a)*2.15);c.stroke();}c.restore();
 if(view===0){
  const warning=(Math.sin(time*14.3)>-.22?1:.18)+charge*.65;
  glow(c,-.3,-16.85,.85,warning*.55,'#baff88');
  glow(c,-1.9,-14.3,2,.12+charge*.22+release*.45,'#ff5839');
  glow(c,1.6,-14.3,2,.12+charge*.22+release*.45,'#ff5839');
 }
 if(charge>.05||release>.05){
  const energy=Math.max(charge,release);
  for(let i=0;i<4;i++)arc(c,-5+i*3,-19.5+i*.6,-3+i*2,-13.5,i,energy*.7);
  glow(c,view===2?-3.1:0,-13.3,2.2+energy*1.8,energy*.55,'#ff7154');
 }
 if(release>.03){
  c.save();c.globalAlpha=release*.8;c.strokeStyle='#ff5847';c.lineWidth=1.2*release;
  c.beginPath();c.moveTo(view===2?-2.2:0,-13.5);c.lineTo(view===2?-9:0,-13.5);c.stroke();
  glow(c,view===2?-7:0,-13.5,2.1,release,'#ff4239');c.restore();
 }
 if(hit>.04){glow(c,0,-13,3.5,hit*.6,'#fff2dc');}
 c.restore();
}
