const {browser,pageFor,png,write}=require('./lab.cjs');
const prefix=process.env.GP42_EVIDENCE_PREFIX||'s1';
const durations={grand:120,sun:70,rings:70,life:150,song:70,dark:60,endless:150};
(async()=>{const b=await browser(false);try{
 for(const id of process.argv.slice(2).length?process.argv.slice(2):Object.keys(durations)){
 const {page,errors}=await pageFor(b,true,{width:960,height:540});
 const result=await page.evaluate(async([id,duration])=>{
 const imported=performance.getEntriesByType('resource').find(x=>/\/src\/voyage\.js(?:\?|$)/.test(x.name));
 const programme=await import(imported.name);
 if(!programme.voyages.some(v=>v.id===id))programme.voyages.push(programme.directors.find(v=>v.id===id));
 const {s,c,voyage}=lab, canvas=document.querySelector('#sky');
 const {subjectOf}=await import('/src/voyage.js');
 const {clouds,sheetHeights,activeClouds}=await import('/src/drift.js');
 if(id==='dark')lab.blackHole.form(3,-.49,3.24,4);
 let seed=19410;const old=Math.random;Math.random=()=>(seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296;
 voyage.start(id);
 const frame=(w,h)=>{const a=document.createElement('canvas');a.width=w;a.height=h;return a;};
 const small=frame(160,90), mask=frame(320,180), strip=frame(1920,540);
 const ctx=small.getContext('2d',{willReadFrequently:true}),m=mask.getContext('2d',{willReadFrequently:true}),film=strip.getContext('2d');
 function pixels(){m.drawImage(canvas,0,0,320,180);return m.getImageData(0,0,320,180).data;}
 function magenta(){const p=pixels();let n=0;for(let j=0;j<p.length;j+=4)if(p[j]>190&&p[j+1]<72&&p[j+2]>190)n++;return n;}
 const samples=[],turn=[],captures=[],hero={},previous={};let zero=0,crossings=0,oldY=c.eye[1],minSheet=Infinity,first=true;
 const op=[...c.eye],of=c.back.map(n=>-n);
 const snaps=Array.from({length:8},(_,i)=>Math.round(60*(.6+(duration-1.2)*i/7)));
 let still=null;
 for(let t=1;t<=duration*60-1;t++){
   lab.drive(1);if(!voyage.active)break;
   const sh=voyage.shot,eye=c.eye,fw=c.back.map(n=>-n);
   if(!first){
     const d=Math.hypot(...eye.map((v,i)=>v-op[i]));if(d<1e-8)zero++;
     turn.push(Math.acos(Math.max(-1,Math.min(1,fw.reduce((a,x,i)=>a+x*of[i],0))))*60*180/Math.PI);
     if(Math.hypot(eye[0],eye[2])<15.5)for(const y of sheetHeights)if((oldY-y)*(eye[1]-y)<0)crossings++;
   }
   first=false;oldY=eye[1];op.splice(0,3,...eye);of.splice(0,3,...fw);
   const ix=snaps.indexOf(t),sample=t===1||t%180===0||t===duration*60-1;
   if(ix<0&&!sample)continue;
   marker=null;lab.paint();
   if(ix>=0){film.drawImage(canvas,(ix%4)*480,Math.floor(ix/4)*270,480,270);captures.push([ix,sh.title]);const card={endless:3,grand:0,sun:4,rings:2,song:1,life:5,dark:2}[id];if(ix===card){const tile=frame(520,293);tile.getContext('2d').drawImage(canvas,0,0,520,293);still=tile.toDataURL('image/webp',.88);}}
   if(!sample)continue;
   ctx.drawImage(canvas,0,0,160,90);const p=ctx.getImageData(0,0,160,90).data;let dark=0;
   for(let j=0;j<p.length;j+=4)if(.2126*p[j]+.7152*p[j+1]+.0722*p[j+2]<25)dark++;
   const body=subjectOf(s,sh.subject);if(!body)throw Error('missing '+sh.subject);
   const [x,y,z]=c.project(body.x,body.y,body.z);let vis=0;
   if(sh.subject==='hole'){
     const raw=pixels(),r=body.r/z*90/.32492,cx=(x+1)*160,cy=(1-y)*90;let n=0,hit=0;
     for(let j=0;j<180;j++)for(let k=0;k<320;k++)if(Math.hypot(k+.5-cx,j+.5-cy)<r*.94){n++;const at=4*(j*320+k);if(Math.max(...raw.slice(at,at+3))<18)hit++;}vis=n?hit/n:0;
   }else{
     marker=body;lab.paint();const seen=magenta();lab.renderer().isolate(s,c,body);const whole=magenta();vis=whole?Math.min(1,seen/whole):0;marker=null;
   }
   const dist=Math.hypot(body.x-eye[0],body.y-eye[1],body.z-eye[2]),h=body.r/(.32492*Math.sqrt(Math.max(.0001,dist*dist-body.r*body.r)));
   if(sh.move==='C')hero[sh.subject]=Math.max(hero[sh.subject]||0,h);
   const edge=Math.max(0,Math.hypot(eye[0],eye[2])-15.5);
   const sheet=Math.min(...sheetHeights.map(v=>Math.hypot(edge,eye[1]-v)));minSheet=Math.min(minSheet,sheet);
   const cloud=Math.min(...clouds.slice(0,activeClouds(s.low)).map(b=>Math.hypot(...eye.map((v,i)=>v-b.pos[i]))-1.17*Math.max(...b.size)));
   const on=z>0&&(sh.move==='F'?vis>0:Math.abs(x)<1&&Math.abs(y)<1);
   samples.push({t:+(t/60).toFixed(2),shot:sh.title,subject:sh.subject,dark:dark/14400,vis,on,sheet,cloud,center:[x,y],height:h});
 }
 Math.random=old;turn.sort((a,b)=>a-b);
 return {samples,zero,crossings,minSheet,hero,median:turn[Math.floor(turn.length*.5)],p95:turn[Math.floor(turn.length*.95)],strip:strip.toDataURL(),still,captures};
 },[id,durations[id]]);
 const {strip,still,...data}=result;png(prefix+'-'+id+'-strip',strip);
 require('fs').writeFileSync(require('path').join(__dirname,id+'.webp'),Buffer.from(still.split(',')[1],'base64'));
 write(prefix+'-'+id,{...data,errors});console.log(id,'dark',Math.min(...data.samples.map(x=>x.dark)).toFixed(2),Math.max(...data.samples.map(x=>x.dark)).toFixed(2),'vis',Math.min(...data.samples.map(x=>x.vis)).toFixed(2),'sheet',data.minSheet.toFixed(2),'turn',data.median.toFixed(2),data.p95.toFixed(2),'zero',data.zero,'crossings',data.crossings,JSON.stringify(data.hero),errors);
 await page.close();
 }
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
