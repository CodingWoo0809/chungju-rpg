const cache=new WeakMap();
function cut(img,index,polygon){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=384;
 const c=canvas.getContext('2d');c.beginPath();polygon.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
 c.drawImage(img,index*384,0,384,384,0,0,384,384);return canvas;
}
function capsule(a,b,r){
 const angle=Math.atan2(b[1]-a[1],b[0]-a[0]),points=[];
 for(let i=0;i<=8;i++){const t=angle-Math.PI/2+i*Math.PI/8;points.push([b[0]+Math.cos(t)*r,b[1]+Math.sin(t)*r]);}
 for(let i=0;i<=8;i++){const t=angle+Math.PI/2+i*Math.PI/8;points.push([a[0]+Math.cos(t)*r,a[1]+Math.sin(t)*r]);}
 return points;
}
function parts(visual,pose){
 const img=visual.sheet.img;
 let byView=cache.get(img);if(!byView){byView={};cache.set(img,byView);}
 if(byView[pose.view])return byView[pose.view];
 const s=pose.source;
 const body={
  front:[[151,126],[225,126],[232,169],[224,202],[229,236],[148,236],[149,190]],
  back:[[149,126],[226,126],[234,167],[231,238],[144,238],[142,183]],
  right:[[168,134],[212,134],[233,179],[242,220],[226,241],[160,241],[163,187]],
 };
 const torsoImg=visual.sheet.torsoImg||img,armImg=visual.sheet.armImg||img;
 const torso=cut(torsoImg,s.index,body[pose.view]);
 const legEdges=pose.view==='right'?[156,225]:pose.view==='back'?[139,241]:[151,230];
 const result={torso,head:cut(img,s.index,[[0,0],[384,0],[384,s.neck+3],[0,s.neck+3]]),
  legs:cut(img,s.index,[[legEdges[0],s.waist[1]],[legEdges[1],s.waist[1]],[270,384],[110,384]]),
  arms:s.arms.map(a=>({upper:cut(armImg,s.index,capsule(a[0],a[1],15)),lower:cut(armImg,s.index,capsule(a[1],a[2],13)),
   hand:cut(armImg,s.index,capsule([a[2][0],a[2][1]-5],[a[2][0],a[2][1]+4],10))}))};
 byView[pose.view]=result;return result;
}
function drawPart(c,canvas,pose){
 const s=pose.source,k=24/(s.bottom-s.top);c.drawImage(canvas,-192*k*s.width,-s.bottom*k,384*k*s.width,384*k);
}
function limb(c,canvas,pose,from,to,a,b){
 const restAngle=Math.atan2(to.y-from.y,to.x-from.x),angle=Math.atan2(b.y-a.y,b.x-a.x);
 c.save();c.translate(a.x,a.y);c.rotate(angle-restAngle);c.translate(-from.x,-from.y);drawPart(c,canvas,pose);c.restore();
}
export function drawPlayerAttack(c,visual,handsOnly=false){
 const p=visual.rig,art=parts(visual,p);c.save();if(visual.mirror)c.scale(-1,1);
 const arm=i=>{const a=p.arms[i],r=a.rest;limb(c,art.arms[i].upper,p,r[0],r[1],a.shoulder,a.elbow);limb(c,art.arms[i].lower,p,r[1],r[2],a.elbow,a.hand);};
 if(handsOnly){
  if(Number.isFinite(p.split)||p.split===-Infinity)for(let i=1;i>=0;i--){const a=p.arms[i];c.save();c.translate(a.hand.x-a.rest[2].x,a.hand.y-a.rest[2].y);drawPart(c,art.arms[i].hand,p);c.restore();}
 }else{
  drawPart(c,art.legs,p);
  if(p.view!=='front')arm(1);
  c.save();c.translate(p.waist.x+p.shift,p.waist.y);c.rotate(p.rotation);c.translate(-p.waist.x,-p.waist.y);
  drawPart(c,art.torso,p);c.restore();
  c.save();c.translate(p.headShift,0);drawPart(c,art.head,p);c.restore();
  if(p.view==='front')arm(1);
  arm(0);
 }
 c.restore();
}
