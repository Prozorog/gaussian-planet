const {browser,pageFor,write}=require('./lab.cjs');
(async()=>{const b=await browser();try{
 const {page,errors}=await pageFor(b,true,undefined,async p=>{
 await p.route(/\/src\/shaders\/drift\.glsl\?.*/,async r=>{const res=await r.fetch(),source=await res.text();
 const find='frag=vec4(col,1.);';if(!source.includes(find))throw Error('Cannot tag grazing ink');
 await r.fulfill({response:res,body:source.replace(find,'frag=(!cloud&&abs(world.y-eye.y)/dist<.052336)?vec4(1.,0.,1.,1.):vec4(col,1.);')});});});
 const data=await page.evaluate(async()=>{
 const {createCamera}=await import('/src/camera.js'),view=createCamera();view.drift=lab.drift;
 const eye=[3.28,.18,5.62],v=[-3.28,-.46,-5.62],d=Math.hypot(...v);
 view.followVoyage({position:eye,forward:v.map(x=>x/d),shift:0,bank:0,inside:1});view.tick(lab.s.t,1/60,16/9,0);view.mode='drift';
 lab.renderer().render(lab.s,view,0,{still:true});
 const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;const ctx=canvas.getContext('2d');
 ctx.drawImage(document.querySelector('#sky'),0,0);const p=ctx.getImageData(0,0,1920,1080).data;let largest=0,count=0;
 for(let y=0;y<1080;y++){let run=0;for(let x=0;x<1920;x++){let i=(y*1920+x)*4;
 if(p[i]>250&&p[i+1]<5&&p[i+2]>250){count++;largest=Math.max(largest,++run);}else run=0;}}
 return {horizontalRunPixels:largest,taggedPixels:count,thresholdDegrees:3,viewport:[1920,1080]};});
 write('s3-grazing',{...data,errors});console.log(data,errors);
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
