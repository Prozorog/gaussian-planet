const {browser,pageFor,write}=require('./lab.cjs'),assert=require('node:assert/strict');
(async()=>{for(const low of [false,true]){
 const b=await browser(low);try{const {page,read,errors}=await pageFor(b);
 await page.locator('#settings > summary').click();
 if(low)await page.locator('#quality').selectOption('low');
 await page.locator('#settings > summary').click();
 async function fps(){
   return page.evaluate(()=>new Promise(resolve=>{
     const start=performance.now(),from=readScene().frames;
     function poll(now){if(now-start<2100){requestAnimationFrame(poll);return;}
       const o=readScene(),frames=o.frames-from;
       resolve({fps:Math.round(100000*frames/(now-start))/100,seconds:(now-start)/1000,frames,eye:o.drift.eye,
         mode:o.uiMode,move:o.voyage.shot,gpu:o.gpu,low:o.low,size:[document.querySelector('#sky').width,document.querySelector('#sky').height]});}
     requestAnimationFrame(poll);
   }));
 }
 assert(await page.locator('#voyage-list').isVisible());await page.waitForTimeout(450);const picker=await fps();
 // Benchmark the authored C move in this browser only. The released picker
 // is measured before adding the withheld director to this page's programme.
 await page.evaluate(async()=>{
   const entry=performance.getEntriesByType('resource').find(x=>/\/src\/voyage\.js(?:\?|$)/.test(x.name));
   const {voyages,directors}=await import(entry.name);voyages.push(directors.find(v=>v.id==='grand'));
 });
 await page.keyboard.press('v');await page.locator('[data-voyage="grand"]').click();
 await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
 await page.waitForFunction(()=>readScene().voyage.shot===2);await page.waitForTimeout(4100);
 const obs=await read(),ember=obs.bodies.find(b=>b.name==='Ember');assert(ember);
 const distance=Math.hypot(...obs.drift.eye.map((q,i)=>q-[ember.x,ember.y,ember.z][i]));
 const hero={...await fps(),subject:'Ember',radii:distance/ember.r};assert(hero.radii<7);
 await page.keyboard.press('Escape');await page.keyboard.press('t');
 await page.getByRole('button',{name:'Planetary nebula',exact:true}).click();await page.keyboard.press('d');
 await page.waitForFunction(()=>readScene().uiMode==='drift'&&!readScene().flying);
 const nebula=await fps();assert(Math.hypot(...nebula.eye)<7.5);
 write('s3-perf-'+(low?'low':'high'),{picker,hero,nebula,errors});console.log(low?'Low':'High',picker.gpu,picker.fps,hero.fps,nebula.fps);
 assert.deepEqual(errors,[]);assert.equal(picker.low,low);assert.deepEqual(picker.size,[1920,1080]);
 }finally{await b.close();}
}})().catch(e=>{console.error(e);process.exitCode=1});
