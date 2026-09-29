export function prepareArchitectureAtlas(image,parts){
 const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
 const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
 const pixels=context.getImageData(0,0,canvas.width,canvas.height),data=pixels.data,width=canvas.width;
 for(let i=3;i<data.length;i+=4){
  const alpha=data[i];data[i]=alpha<64?0:alpha<160?Math.round((alpha-64)/96*255):255;
 }
 for(const row of Object.values(parts))for(const rect of Object.values(row)){
  const [sx,sy,sw,sh]=rect;let left=sx+sw,top=sy+sh,right=sx,bottom=sy;
  for(let y=sy;y<sy+sh;y++)for(let x=sx;x<sx+sw;x++)if(data[(y*width+x)*4+3]>48){
   left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
  }
  if(right>=left)rect.splice(0,4,left,top,right-left+1,bottom-top+1);
 }
 context.clearRect(0,0,canvas.width,canvas.height);context.putImageData(pixels,0,0);
 return canvas;
}
