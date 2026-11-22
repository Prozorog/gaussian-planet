const {browser,pageFor,write}=require('./lab.cjs'),assert=require('node:assert/strict');
const steps=[];
(async()=>{const b=await browser(false);try{
 const {page,errors,read}=await pageFor(b,false,undefined,async page=>{
   await page.addInitScript(()=>document.addEventListener('click',e=>{if(e.target.closest('#light-begin'))window.playBegan=performance.now();},true));
 });
 const time=()=>page.evaluate(()=>(performance.now()-playBegan)/1000);
 const log=async name=>{const o=await read();steps.push({at:+(await time()).toFixed(2),name,mode:o.uiMode,film:o.voyage.id,chapter:o.life.chapter});console.log(name)};
 const until=async sec=>{let left=sec-await time();while(left>0){await page.waitForTimeout(Math.min(20000,Math.ceil(left*1000)));left=sec-await time();}};
 const key=k=>page.keyboard.press(k);
 await log('Begin and reveal');await page.locator('[data-voyage="sun"]').click();await log('Sun Dive started');
 await page.waitForFunction(()=>readScene().voyage.completed.includes('sun')&&readScene().uiMode==='voyage'&&!readScene().voyage.id,{},{timeout:115000});
 await log('Whole Sun Dive, back at the picker');await page.locator('[data-voyage="sun"]').click();await page.waitForTimeout(4200);
 await page.mouse.move(990,700);await page.locator('#voyage-helm').click();assert.equal((await read()).uiMode,'drift');await log('Took the helm');
 await page.keyboard.down('w');await page.waitForTimeout(1200);await page.keyboard.up('w');
 await page.mouse.move(870,530);await page.mouse.down();await page.mouse.move(964,560,{steps:12});await page.mouse.up();await key('Digit4');await page.mouse.click(960,810);
 await until(105);await page.locator('#bench-mode').click();await page.waitForTimeout(2200);await log('Bench');await page.locator('#inks button').nth(1).click();await page.mouse.click(750,670);
 await until(124);await key('h');assert(await page.locator('#mode-help').isVisible());await key('Escape');await key('b');await page.locator('#atlas-tabs button').nth(2).click();await page.locator('#atlas-close').click();
 await until(148);await key('t');await page.getByRole('button',{name:'Planetary nebula',exact:true}).click();await log('Nebula chapter');await page.locator('#nebula-print').click();
 await until(168);await key('d');await page.waitForTimeout(2200);await log('Drift inside the nebula');await key('p');assert(await page.locator('#postcard').isVisible());await key('Escape');
 await until(195);await key('Escape');await key('t');await page.getByRole('button',{name:'White dwarf',exact:true}).click();await key('t');await log('White dwarf');
 await until(217);await key('t');await page.getByRole('button',{name:'Today',exact:true}).click();await key('t');await key('v');await log('Voyage picker revisited');
 await page.waitForFunction(()=>readScene().voyage.id==='sun',{},{timeout:18000});await log('Idle picker started a film');
 await until(251);await key('Space');assert((await read()).voyage.paused);await key('ArrowRight');await key('Space');await until(267);
 await key('a');assert.equal((await read()).uiMode,'drift');await log('Keyboard helm');await key('Escape');await page.waitForTimeout(2200);await page.locator('#chime-toggle').click();
 await until(285);await key('d');await page.waitForTimeout(2200);await key('h');await key('Escape');await page.mouse.click(960,815);
 await until(300);await log('Five minutes complete');assert.deepEqual(errors,[]);
 write('s3-play',{seconds:await time(),route:'Begin, whole Sun Dive, helm, all three modes',gpu:(await read()).gpu,steps,errors});
}finally{await b.close()}})().catch(e=>{write('s3-play-failure',{error:e.message,steps});console.error(e);process.exitCode=1});
