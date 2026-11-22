const {browser,pageFor,png,write}=require('./lab.cjs');
(async()=>{const b=await browser();try{
 const {page,errors}=await pageFor(b,true);await page.keyboard.press('Escape');
 const result=await page.evaluate(async()=>{
 const {s,c,renderer}=lab;
 const {createCamera}=await import('/src/camera.js');
 const frames={},poses={},cv=document.querySelector('#sky'),r=renderer();
 const make=(w,h)=>{const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;return canvas;};
 function capture(name,eye,aim,inside,mode='overview'){
   const dir=aim.map((v,i)=>v-eye[i]),len=Math.hypot(...dir),view=createCamera();view.drift=c.drift;
   view.followVoyage({position:eye,forward:dir.map(x=>x/len),shift:0,bank:0,inside});
   view.tick(s.t,1/60,16/9,0);view.mode=mode;view.nebulaPrint=mode==='poster';
   r.render(s,view,0,{still:true});const a=make(1920,1080);a.getContext('2d').drawImage(cv,0,0);
   poses[name]={eye,aim,inside,mode};return a;
 }
 s.life.seek(3);lab.drive(2);
 const d=18,el=58*Math.PI/180,az=.25;
 const poster=capture('nebula-above',[d*Math.cos(el)*Math.sin(az),d*Math.sin(el),d*Math.cos(el)*Math.cos(az)],[0,0,0],0,'poster');
 frames['nebula-above']=poster.toDataURL();frames['nebula-side']=capture('nebula-side',[0,.13,21.2],[0,0,0],0).toDataURL();
 frames['nebula-inside']=capture('nebula-inside',[1.16,1.38,4.12],[.1,.48,-.9],1,'drift').toDataURL();
 s.life.seek(4);lab.drive(2);
 frames['dwarf']=capture('dwarf',[5.8,6.6,14.2],[0,0,0],0).toDataURL();
 s.life.seek(1);lab.drive(16);
 frames['near-sheet']=capture('near-sheet',[4.46,-.02,3.62],[3.82,-.46,3.25],1,'drift').toDataURL();
 frames['eye-level']=capture('eye-level',[3.28,.18,5.62],[0,-.28,0],1,'drift').toDataURL();
 const trip=make(1920,580),p=trip.getContext('2d');
 for(const [i,b] of s.creatures.rideables.slice(0,3).entries()){
   const speed=Math.hypot(b.vx,b.vz),x=b.vx/speed,z=b.vz/speed;
   const a=capture(b.name,[b.x-x*.48,b.y+5.8,b.z-z*.48],[b.x,b.y,b.z],0);
   p.drawImage(a,384,18,1152,1044,640*i,0,640,580);
 }
 frames.swimmers=trip.toDataURL();
 const ctx=poster.getContext('2d'),rgb=ctx.getImageData(0,0,1920,1080).data;
 let lit=0,vivid=0,cream=0;const families={teal:0,rose:0,gold:0,violet:0};
 for(let i=0;i<rgb.length;i+=4){const R=rgb[i],G=rgb[i+1],B=rgb[i+2],L=.2126*R+.7152*G+.0722*B;
   const max=Math.max(R,G,B),sat=(max-Math.min(R,G,B))/Math.max(1,max);
   if(L>=25){lit++;if(sat>.65){vivid++;if(R>G*1.07&&R<=G*1.75&&G>B*1.45)families.gold++;if(R>B*1.1&&B>G*1.13)families.rose++;if(B>R*1.05&&R>G*1.15)families.violet++;if(G>R*1.4&&B>R*1.4)families.teal++;}}
   if(L>200&&sat<.35)cream++;
 }
 for(const k of Object.keys(families))families[k]=100*families[k]/lit;
 return {frames,poses,color:{vivid:100*vivid/lit,dark:100*(1-lit/(1920*1080)),cream:100*cream/(1920*1080),families}};
 });
 for(const [name,data] of Object.entries(result.frames))png('s3-'+name,data);
 write('s3-looks',{poses:result.poses,color:result.color,errors});console.log(result.color,errors);
 if(errors.length)throw Error(errors.join('\n'));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
