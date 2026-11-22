const path=require('node:path'),fs=require('node:fs');
const {chromium}=require(require.resolve('playwright',{paths:[path.join(process.env.USERPROFILE,'.bun','install','global','node_modules')]}));
const dir=__dirname;
const url='http://localhost:4106/';
const browser=low=>chromium.launch({channel:'chrome',headless:true,args:[low?'--force_low_power_gpu':'--force_high_performance_gpu','--use-angle=d3d11','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const write=(name,data)=>fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify(data,null,2));
const png=(name,data)=>fs.writeFileSync(path.join(dir,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
async function pageFor(instance,manual=false,size={width:1920,height:1080},prepare){
 const page=await instance.newPage({viewport:size,reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'||/GL_INVALID|shader error/i.test(m.text()))errors.push(m.text())});
 if(manual){
   await page.route(/\/src\/(main|render)\.js(?:\?.*)?$/,async route=>{
     const res=await route.fetch();let code=(await res.text()).split('//# sourceMappingURL')[0];
     if(route.request().url().includes('/main.js')){
       code=code.replaceAll('requestAnimationFrame(tick)','schedule()').replace('if(!postcard.clipFrame(now,dt))','if(!manual&& !postcard.clipFrame(now,dt))').replace('atlas.tick(dt,today()','if(!manual)atlas.tick(dt,today()');
       code+='\nlet manual=false;function schedule(){if(!manual)requestAnimationFrame(n=>{if(!manual)tick(n)});}';
       code+='\nwindow.lab={s,c:camera,renderer:()=>renderer,voyage,drift,blackHole,drive(n,step){manual=true;for(let i=0;i<n;i++){tick(last+1000/60);if(step)step();}},paint(){renderer.render(s,camera,0,{still:true});},live(){manual=false;last=0;schedule();}};';
     }else{
       code=code.replace('function at(l,shape,x,y,z,r){','function at(l,shape,x,y,z,r){gl.uniform1f(l.auditMark,globalThis.marker&&shape===0&&Math.hypot(x-marker.x,y-marker.y,z-marker.z)<.06?1:0);');
       code=code.replace('gl.uniform1f(l.time,s.t);','gl.uniform1f(l.auditCreature,globalThis.marker?.creature?s.creatures.rideables.indexOf(marker):-1);gl.uniform1f(l.time,s.t);');
       code=code.replace('return {gl,render,sample,','return {gl,render,sample,isolate(s,c,b){gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);if(b.creature){printCreatures(s,c);}else{let l=frame(body,s,c);gl.uniform1i(l.pass,0);at(l,0,b.x,b.y,b.z,b.r);mesh.sphere();}gl.disable(gl.DEPTH_TEST);},');
     }
     await route.fulfill({response:res,body:code});
   });
   await page.route(/\/src\/gl\.js(?:\?.*)?$/,async route=>{
     const res=await route.fetch();let code=(await res.text()).split('//# sourceMappingURL')[0];
     code=code.replace('function shader(type, src) {',`if(name==='Planet press'||name==='Swimming ink'){
       const body=name==='Planet press';
       fragment='uniform float auditMark,auditCreature;\\n'+fragment.replace('void main()', 'void normalInk()')+'\\nvoid main(){normalInk();if('+(body?'auditMark>.5&&pass==0':'typeOfInk==0&&abs(seed-auditCreature)<.1')+')frag=vec4(1.,0.,1.,1.);}';
     }
     function shader(type, src) {`);await route.fulfill({response:res,body:code});
   });
 }
 if(prepare)await prepare(page);
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!document.querySelector('#light-begin').hidden||document.querySelector('#error').textContent.trim(),{},{timeout:45000}).catch(async e=>{throw Error([await page.locator('#light-tip').textContent(),errors,e.message].join(' | '))});
 const startup=await page.locator('#error').textContent();if(startup)throw Error(startup);
 await page.locator('#light-begin').click();await page.locator('#first-light').waitFor({state:'hidden'});
 await page.evaluate(async()=>{const entry=document.querySelector('script[src*="main.js"]').src;const app=await import(entry);window.readScene=app.observation;});
 if(manual)await page.evaluate(()=>lab.drive(1));
 return {page,errors,read:()=>page.evaluate(()=>readScene()),snap:name=>page.screenshot({path:path.join(dir,name+'.png')})};
}
module.exports={browser,pageFor,dir,png,write,url};
