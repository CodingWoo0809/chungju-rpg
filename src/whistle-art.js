const SOURCE=new URL('../assets/monsters/whistle-pilot/whistle-painted-parts-v1.png',import.meta.url).href;
const TAU=Math.PI*2;
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));

const PARTS={
 front:{shell:[246,0,300,340],core:[756,22,224,306],far:[16,42,228,274],near:[532,42,224,274],
  cordA:[982,0,192,336],cordB:[1164,0,198,336],loop:[1368,68,164,222]},
 back:{shell:[246,338,306,344],core:[760,350,220,316],far:[14,358,234,286],near:[532,354,232,292],
  cordA:[984,342,188,338],cordB:[1162,342,202,338],loop:[1368,68,164,222]},
 right:{shell:[244,670,354,350],core:[754,700,228,318],far:[16,716,236,276],near:[548,716,224,278],
  cordA:[980,682,194,338],cordB:[1158,680,208,340],loop:[1372,760,160,210]}
};

let atlas=null;
let cleanedAtlas=null;
let loading=null;
const inertiaStates=new WeakMap();
function getAtlas(){
 if(atlas||typeof Image==='undefined')return atlas;
 atlas=new Image();atlas.decoding='async';atlas.src=SOURCE;
 return atlas;
}

export function loadWhistleArt(){
 const image=getAtlas();
 if(!image)return Promise.resolve(false);
 if(image.complete&&image.naturalWidth){prepareAtlas(image);return Promise.resolve(true);}
 if(!loading)loading=new Promise(resolve=>{
  image.addEventListener('load',()=>{prepareAtlas(image);resolve(true);},{once:true});
  image.addEventListener('error',()=>resolve(false),{once:true});
 });
 return loading;
}

function prepareAtlas(image){
 if(cleanedAtlas||typeof document==='undefined')return cleanedAtlas||image;
 const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
 const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
 const pixels=context.getImageData(0,0,canvas.width,canvas.height),data=pixels.data;
 for(let i=3;i<data.length;i+=4){const alpha=data[i];data[i]=alpha<72?0:alpha<144?Math.round((alpha-72)/72*255):255;}
 context.clearRect(0,0,canvas.width,canvas.height);context.putImageData(pixels,0,0);cleanedAtlas=canvas;return canvas;
}

function paint(c,image,crop,x,y,width,angle=0,pivotX=.5,pivotY=.5,alpha=1){
 const [sx,sy,sw,sh]=crop,height=width*sh/sw;
 c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;
 c.drawImage(image,sx,sy,sw,sh,-width*pivotX,-height*pivotY,width,height);c.restore();
}

function glow(c,x,y,r,alpha){
 const gradient=c.createRadialGradient(x,y,0,x,y,r);
 gradient.addColorStop(0,`rgba(231,255,248,${alpha})`);
 gradient.addColorStop(.28,`rgba(90,239,224,${alpha*.8})`);
 gradient.addColorStop(1,'rgba(27,177,166,0)');
 c.fillStyle=gradient;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
}

function inertiaFor(m,pose){
 const time=pose.time||0,targetX=clamp((pose.velocity?.x||0)/20,-1,1),targetY=clamp((pose.velocity?.y||0)/16,-1,1);
 let state=inertiaStates.get(m);
 if(!state){state={time,x:targetX,y:targetY};inertiaStates.set(m,state);return state;}
 const dt=clamp(time-state.time,0,.12),blend=1-Math.exp(-dt*8);
 state.x+=(targetX-state.x)*blend;state.y+=(targetY-state.y)*blend;state.time=time;
 return state;
}

function resonancePath(c,pose,baseY,charge,release,after){
 if(charge<=0&&release<=0&&after<=0)return;
 const {x:fx=0,y:fy=1}=pose.facing||{};
 const muzzle={x:(fx-fy)*2.56,y:(fx+fy)*1.344-5.2};
 const core={x:pose.direction==='right'?-1:pose.direction==='left'?1:0,y:-10.6+baseY};
 const apertures={front:{x:0,y:-8.1},back:{x:0,y:-14.2},right:{x:3.7,y:-9.2},left:{x:-3.7,y:-9.2}};
 const aperture=apertures[pose.direction]||apertures.front;
 const energy=clamp(charge*.72+release+after*.3);
 c.save();c.lineCap='round';c.lineJoin='round';
 c.shadowColor='#6ffff0';c.shadowBlur=2.4+energy*4;
 c.strokeStyle=`rgba(151,255,241,${.24+energy*.7})`;c.lineWidth=.18+energy*.36;
 c.beginPath();c.moveTo(core.x,core.y);c.quadraticCurveTo((core.x+aperture.x)*.48,aperture.y+.7,aperture.x,aperture.y);c.stroke();
 if(release>0||after>0){
  c.strokeStyle=`rgba(205,255,248,${release*.92+after*.32})`;c.lineWidth=.2+release*.48;
  c.beginPath();c.moveTo(aperture.x,aperture.y);c.quadraticCurveTo((aperture.x+muzzle.x)*.5,muzzle.y-.8,muzzle.x,muzzle.y);c.stroke();
  const ring=1+(1-release)*1.6;
  c.strokeStyle=`rgba(198,255,247,${release*.9+after*.22})`;c.lineWidth=.2+release*.25;
  c.beginPath();c.ellipse(muzzle.x,muzzle.y,ring*.48,ring,Math.atan2(muzzle.y-aperture.y,muzzle.x-aperture.x),0,TAU);c.stroke();
 }
 c.restore();
}

function rig(c,image,pose,baseY,lean,charge,release,after){
 const side=pose.direction==='left'||pose.direction==='right',mirror=pose.direction==='left'?-1:1;
 const parts=PARTS[side?'right':pose.direction]||PARTS.front;
 const gait=Math.sin(pose.gait||0),breath=Math.sin((pose.time||0)*1.9);
 const hit=clamp(pose.hit||0),move=clamp(pose.move||0);
 const flap=breath*.08+gait*move*.22-charge*.48+release*.72+hit*.82;
 const cordSwing=clamp(lean*2.8,-.5,.5)+Math.sin((pose.time||0)*2.1+.8)*.06+after*.28;
 const shellWidth=side?9.2:8.2;
 c.save();c.scale(mirror,1);
 const localLean=lean*mirror;
 paint(c,image,parts.loop,side?-2.7:0,-15.2+baseY,3.6,-localLean*.25,.5,.7,.9);
 paint(c,image,parts.cordA,-1.3,-7.2+baseY,3.65,-cordSwing-.08,.5,.05,.94);
 paint(c,image,parts.cordB,1.25,-7.3+baseY,3.65,-cordSwing+.12,.5,.05,.94);
 paint(c,image,parts.far,side?-3.1:-3.5,-11.5+baseY,5.5,-.46-flap-localLean,.82,.3,.82);
 glow(c,side?-.7:0,-10.7+baseY,3.8+charge*1.8+release*1.2,.18+charge*.3+release*.28);
 paint(c,image,parts.core,side?-.65:0,-10.5+baseY,4.8*(1+charge*.28+release*.12),localLean*.16,.5,.5,.92);
 c.save();c.translate(0,-10.2+baseY);c.rotate(localLean+hit*(mirror*.2));c.scale(1+release*.06,1-charge*.07+hit*.05);
 paint(c,image,parts.shell,0,0,shellWidth,0,.5,.54,1);c.restore();
 paint(c,image,parts.core,side?-.35:0,-10.45+baseY,2.15*(1+charge*.48+release*.18),localLean*.1,.5,.5,.94);
 paint(c,image,parts.near,side?3.05:3.5,-11.5+baseY,5.5,.46+flap-localLean,.18,.3,1);
 c.restore();
}

export function drawWhistle(c,m,pose){
 const image=getAtlas();
 if(!image?.complete||!image.naturalWidth)return;
 const source=prepareAtlas(image);
 const windup=clamp(pose.windup||0),age=Number.isFinite(pose.attackAge)?Math.max(0,pose.attackAge):Infinity;
 const release=Number.isFinite(age)?clamp(1-age/.18):0;
 const after=Number.isFinite(age)?clamp(1-age/.7):0;
 const inertia=inertiaFor(m,pose);
 const hit=clamp(pose.hit||0),settle=Math.sin((pose.time||0)*3.1)*clamp(pose.move||0)*.12;
 const baseY=-.45-inertia.y*.22+windup*.36+settle;
 const lean=inertia.x*.15+(pose.recoil?.x||0)*.025-release*.16*Math.sign(inertia.x||pose.facing?.x||1)+hit*.16*Math.sin((pose.time||0)*31);
 c.save();
 c.fillStyle='rgba(20,40,42,.2)';c.beginPath();c.ellipse(0,-.05,4.1-hit*.4,1.05+hit*.18,0,0,TAU);c.fill();
 rig(c,source,pose,baseY,lean,windup,release,after);
 resonancePath(c,pose,baseY,windup,release,after);
 c.restore();
}
