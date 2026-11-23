import './style.css';import {createRenderer} from './render.js';import {createSystem,INKS,clamp,MU} from './system.js';import {createCamera} from './camera.js';import {soundscape,creditLines} from './audio.js';
import {createDrift,clouds,activeClouds} from './drift.js';
import {createAtlas,drawHelp} from './atlas.js';
import {createSpheres,resonanceTicks} from './spheres.js';
import {bindTimeline,chapters,createLife} from './life.js';
import {createBlackHole,voidIndex} from './black-hole.js';
import {createInteriors} from './interiors.js';
import {createCreatures} from './creatures.js';
import {createPostcard,postcardCamera} from './postcard.js';
import {printChimes} from './atlas-diagrams.js';
import {bindVoyage} from './voyage-controls.js';
import {bindTouch} from './touch.js';
import './mobile.css';
const $=s=>document.querySelector(s),canvas=$('#sky'),overlay=$('#gesture'),pen=overlay.getContext('2d'),cursor=$('#cursor'),plate=$('#plate'),news=$('#news'),help=$('#settings'),audio=soundscape(),camera=createCamera();
const boot=window.firstLight;
boot.progress('scripts');
const firstTrack=audio.preloadFirstTrack().then(()=>boot.progress('music'));
const names=['Fire','Rose','Amethyst','Azure','Emerald','Gold','Void'],colors=['#ff602d','#ff4286','#b650ec','#19d5dd','#28c784','#ffba37','#070607'],verbs=['Drop ink','Stir','Comb','Fling a world','Hold to birth','Hold the star'];let selected=0,inkIndex=0,gesture=null,renderer,last=0,frames=0,newsUntil=0,hadOverlay=false,lastHover=null,shiftDown=false;
const counts={},s=createSystem(event);Object.assign(s,{low:false,grid:256,density:1,guides:true,charge:0,hold:0,vortex:null,force:null,strokes:[],blooms:[]});
function say(text){news.textContent=text;newsUntil=s.t+2.25;}
function toggleMute(){say(audio.mute()?'Sound off':'Sound on');}
function event(e){counts[e.type]=(counts[e.type]||0)+1;audio.play(e.type==='engulf'?'feed':e.type,e.id);atlas.science.event(e);const captions={collision:'Two worlds collide',feed:'A world returns to the sun',birth:'A new world condenses',escape:'Outbound · comet orbit',return:'The wanderer returns',orbit:'A new orbit holds',shock:'Supernova',reignite:'First light',dissolve:'The oldest world returns to ink'};if(captions[e.type])say(captions[e.type]);if(e.type==="engulf")say(e.name+" is swallowed by the red giant");if(['collision','dissolve','birth','feed'].includes(e.type)){const p=[e.x,e.z];s.blooms.push({p,id:e.id,r:e.size*.85,last:0,at:s.t});s.strokes.push([3,p,p,e.size*1.65,e.id,1.68]);}}
const wells=names.map((name,i)=>{const b=document.createElement('button');b.className=i===voidIndex?'well void':'well';b.style.setProperty('--pigment',colors[i]);b.setAttribute('aria-label',`${name} ink (${i+1})`);b.title=`${name} · ${i+1}`;b.innerHTML=`<i></i><span>${name}</span><kbd>${i+1}</kbd>`;b.onclick=()=>choose(i,true);$('#inks').append(b);return b;});const chips=verbs.map(v=>{const c=document.createElement('span');c.className='chip';c.textContent=v;$('#verbs').append(c);return c;});function used(i){chips[i].classList.add('used');}function choose(i,play){selected=i;if(i!==voidIndex)inkIndex=i;wells.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));$('#stage').style.setProperty('--ink',colors[i]);if(play){audio.wake();audio.play('choose',INKS[inkIndex]);if(i===voidIndex)say('Hold empty ink to form a black hole.');}}choose(0,false);
const drift=createDrift(s,moment);camera.drift=drift;
const atlas=createAtlas(s,camera);
const stage=$('#stage'),modeHelp=$('#mode-help'),hint=$('#mode-hint');
const touchScreen=matchMedia('(pointer: coarse)');
if(touchScreen.matches){
  s.low=true;s.grid=128;
  $('#quality').value='low';$('#resolution').value='128';
}
const combButton=document.createElement('button');
combButton.id='touch-comb';combButton.type='button';combButton.className='chip control-chip';
combButton.textContent='Comb';combButton.setAttribute('aria-pressed','false');
$('#timeline-toggle').before(combButton);
combButton.onclick=()=>combButton.setAttribute('aria-pressed',String(combButton.getAttribute('aria-pressed')!=='true'));
const hints={voyage:'Choose a film, or let it begin in ten seconds.',drift:'Drag to look. Use WASD to float through the ink.',bench:'Choose an ink. Click to drop it or drag to stir.'};
const touchHints={...hints,drift:'Slide the pad to fly. Drag the sky to look.',bench:'Tap to ink. Drag to stir. Pinch to zoom.'};
const seenModes=new Set();let hintTimer;
try{for(const mode of JSON.parse(localStorage.getItem('gaussian-planet.mode-hints')||'[]'))seenModes.add(mode);}catch{}
function setMode(mode){
  if(stage.dataset.mode!==mode)resetTouch();
  stage.dataset.mode=mode;camera.picker=mode==='voyage';
  modeHelp.hidden=true;help.open=false;
  for(const b of stage.querySelectorAll('[data-select]'))b.setAttribute('aria-pressed',String(b.dataset.select===mode));
  if(mode!=='bench'&&!$('#timeline').hidden)timeline.toggle();
  clearTimeout(hintTimer);hint.textContent='';
  if(!seenModes.has(mode)){
    seenModes.add(mode);hint.textContent=(touchScreen.matches?touchHints:hints)[mode];
    try{localStorage.setItem('gaussian-planet.mode-hints',JSON.stringify([...seenModes]));}catch{}
    hintTimer=setTimeout(()=>{hint.textContent='';},6500);
  }
}
function toggleHelp(){
  help.open=false;
  if(!modeHelp.hidden){modeHelp.hidden=true;canvas.focus({preventScroll:true});return;}
  const mode=stage.dataset.mode;$('#help-title').textContent=mode[0].toUpperCase()+mode.slice(1)+' controls';
  drawHelp(mode,voyage.active,touchScreen.matches);modeHelp.hidden=false;
  atlas.bookOpen(false);$('#help-close').focus({preventScroll:true});
}
$('#help-toggle').onclick=toggleHelp;$('#help-close').onclick=toggleHelp;
s.spheres=createSpheres(s,audio,atlas.discover);
s.sceneBodies=s.bodies;
const reasons={3:'Flinging is available in Today.',4:'Hold to birth a world in Today.',5:'Flares and the supernova are available in Today.'};
s.life=createLife(s,atlas.discover,next=>{
  cancel();
  news.textContent='';
  atlas.chapterChanged(next);
  for(const [index,reason] of Object.entries(reasons)){
    const chip=chips[index],disabled=s.life.chapter!==1;
    chip.classList.toggle('chapter-disabled',disabled);chip.setAttribute('aria-disabled',String(disabled));
    chip.title=disabled?reason:'';
  }
});
const timeline=bindTimeline(s.life,()=>fly('poster'));
$('#timeline-close').onclick=()=>timeline.toggle();
const today=()=>s.life.chapter===1;
const blackHole=createBlackHole(s,camera,atlas.discover,say,()=>fly('overview'));
s.blackHole=blackHole;
const worlds=createInteriors(s,drift,audio,atlas.discover);
s.worlds=worlds;
const resetTouch=bindTouch({canvas,camera,cancel,canOrbit:()=>stage.dataset.mode==='bench',
  move(key,down){
    if(!down){drift.key(key,false);worlds.key(key,false);return;}
    if(camera.mode==='drift')(worlds.body?worlds:drift).key(key,true);
  },
});
const creatures=createCreatures(s,camera,audio,say);
s.creatures=creatures;
const voyage=bindVoyage(s,camera,{
  begin(pose){
    cancel();clearDrops();blackHole.leaveFall();worlds.reset();drift.leave();atlas.dismiss();
    atlas.bookOpen(false);help.open=false;plate.hidden=true;
    setMode('voyage');camera.picker=false;
    camera.followVoyage(pose);audio.setEffectsPresence(.5);atlas.mode();canvas.focus({preventScroll:true});
  },
  helm(pose,velocity){
    setMode('drift');cancel();drift.handoff(pose,velocity);camera.takeHelm(pose);atlas.mode();
    canvas.focus({preventScroll:true});
  },
  picker(){fly('overview',null,'voyage');atlas.dismiss();},
  canIdle:()=>!stage.inert&&modeHelp.hidden&&!postcard.visible&&!help.open&&!atlas.open&&!gesture&&!document.hidden,
});
s.voyage=voyage;
s.onFilmCross=position=>{drift.ripple(4,[position[0],.68,position[2]],4,true);audio.splash();};
$('#creatures-toggle').checked=creatures.enabled;
$('#creatures-toggle').onchange=e=>creatures.enable(e.target.checked);
const postcard=createPostcard({
  draw(p,x,y,width,height,pan,live,dt){
    const view=postcardCamera(camera,width,height,pan);
    renderer.render(s,view,dt,{width,height,still:!live});
    p.drawImage(canvas,x,y);printChimes(p,s,view,x,y,width,height);
  },
  restore:()=>renderer.render(s,camera,0,{still:true}),
  chapter:()=>chapters[s.life.chapter].name,
  captureAudio:()=>audio.capture(),
  opened(){audio.wake();cancel();clearDrops();help.open=false;},
  closed(){canvas.focus({preventScroll:true});drift.activity();voyage.activity();},
});
$('#postcard-toggle').onclick=()=>postcard.open();
$('#rekindle').onclick=()=>blackHole.rekindle();
const chimeButton=$('#chime-toggle');
function toggleChime(){
  s.spheres.toggle();chimeButton.setAttribute('aria-pressed',String(s.spheres.on));atlas.discover(16);
}
chimeButton.onclick=toggleChime;
for(const line of creditLines){
  const credit=document.createElement('li'),link=document.createElement('a');
  const url='https://creativecommons.org/licenses/by/4.0/';
  link.href=url;link.textContent=url;link.target='_blank';link.rel='noopener';
  credit.append(line.slice(0,-url.length),link);$('#credits ul').append(credit);
}
$('#music-level').oninput=e=>audio.setMusic(e.target.valueAsNumber/100);
$('#effects-level').oninput=e=>audio.setEffects(e.target.valueAsNumber/100);
const pendingDrops=new Set();let previousNear=0;
function clearDrops(point){for(const drop of pendingDrops){if(point&&Math.hypot(drop.p[0]-point[0],drop.p[1]-point[1])>.18)continue;clearTimeout(drop.timer);pendingDrops.delete(drop);}}
function queueDrop(p){const drop={p,id:selected};pendingDrops.add(drop);drop.timer=setTimeout(()=>{pendingDrops.delete(drop);ordinaryDrop(p,drop.id);},265);}
function moment(kind,body){
  counts[kind]=(counts[kind]||0)+1;
  if(kind==='cross')audio.splash();
  if(kind==='ride'&&!body.creature){atlas.science.rider=body;atlas.discover(14);}
  if(kind==='nearSun')atlas.discover(13);
}
function fly(mode,b=null,ui=mode==='drift'?'drift':'bench'){
  setMode(ui);
  if(voyage.active)voyage.stop();
  voyage.close();voyage.activity();
  if(camera.mode==='drift'&&mode!=='drift'){blackHole.leaveFall();worlds.reset();drift.leave();audio.environment(0);}
  camera.visit(mode,b);plate.hidden=!b;atlas.mode();
  if(b){plate.querySelector('small').textContent=b.type;plate.querySelector('h1').textContent=b.name;audio.play('visit',b.id);}
  if(mode==='poster'&&today())atlas.discover(13);
  cursor.style.display='none';canvas.style.cursor=mode==='drift'?'crosshair':'';
}
function enter(point){cancel();if(point)clearDrops(point);audio.wake();drift.enter(point);fly('drift');canvas.focus({preventScroll:true});}
$('#step-inside').onclick=()=>{atlas.action();if(camera.mode!=='drift')enter();};
$('#bench-mode').onclick=()=>{if(stage.dataset.mode!=='bench'||camera.mode!=='overview')fly('overview');};
window.addEventListener('first-light-revealed',()=>voyage.toggle(),{once:true});
function ordinaryDrop(p,selectedInk){audio.play('drop',INKS[selectedInk]);s.blooms.push({p,id:INKS[selectedInk],r:.54,last:0,at:s.t});creatures.feed(p[0],-.49,p[1],INKS[selectedInk],true);counts.drop=(counts.drop||0)+1;used(0);}
function driftDrop(q){
  if(camera.flying||blackHole.hole&&pick(q)===blackHole.hole)return;
  const hit=renderer.pickDrift(s,camera,q);if(!hit){if(voyage.active){const p=camera.plane(...q,-.49);if(within(p))ordinaryDrop(p,inkIndex);}return;}
  drift.ripple(hit.id,hit.point,INKS[inkIndex]);audio.play('drop',INKS[inkIndex]);used(0);
  creatures.feed(...hit.point,INKS[inkIndex],hit.id===3);
  if(hit.id===3)s.blooms.push({p:[hit.point[0],hit.point[2]],id:INKS[inkIndex],r:1.12,last:0,at:s.t});
  counts.driftDrop=(counts.driftDrop||0)+1;
}
function ndc(e){const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2];}
function interiorPoint(e){const [x,y]=ndc(e);return [x*camera.aspect*.5,y*.5];}
function pixel(x,y,z){const [nx,ny]=camera.project(x,y,z),r=canvas.getBoundingClientRect();return [r.left+(nx+1)*r.width*.5,r.top+(1-ny)*r.height*.5];}
function pick(q){
  let nearest=camera.sphere(...q,0,0,0,s.life.starRadius*(1-.50*blackHole.dim)),item=nearest?'sun':null;
  if(camera.mode!=='poster')for(const b of s.sceneBodies){const hit=camera.sphere(...q,b.x,b.y,b.z,b.r*1.017);if(hit&&(!nearest||hit.t<nearest.t)){nearest=hit;item=b;}}
  const hole=blackHole.hole;
  if(hole){
    const hit=camera.sphere(...q,hole.x,hole.y,hole.z,hole.r*1.10);
    if(hit&&(!nearest||hit.t<nearest.t||item==='sun'&&Math.hypot(hole.x,hole.z)<s.life.starRadius+.27))return hole;
  }
  return item;
}
function within(p){return p&&Math.hypot(...p)<15.3;}
function hover(e){if(camera.mode==='drift'||voyage.active){cursor.style.display='none';canvas.style.cursor=gesture?.moved?'grabbing':'crosshair';return;}if(e.pointerType==='touch')return;lastHover={clientX:e.clientX,clientY:e.clientY};const q=ndc(e),item=gesture?.item??pick(q),r=canvas.getBoundingClientRect();cursor.style.left=`${e.clientX-r.left}px`;cursor.style.top=`${e.clientY-r.top}px`;cursor.className='';if(gesture?.right||item&&item!=='sun'&&item!==camera.focus){cursor.style.display='none';canvas.style.cursor=gesture?'grabbing':'grab';}else if(item==='sun'||within(camera.plane(...q,-.49))||item===camera.focus&&item){canvas.style.cursor='none';cursor.style.display='block';cursor.className=item==='sun'?'sun':shiftDown||e.shiftKey?'rake':'';}else{cursor.style.display='none';canvas.style.cursor='crosshair';}}
function surface(b,q,drag,dx=0,dz=0){const h=camera.sphere(...q,b.x,b.y,b.z,b.r);if(!h)return;const [x,y,z]=h.n,a=b.spin+b.kind*.68,c=Math.cos(a),sn=Math.sin(a);if(b.marks.length>=12)b.marks.shift();b.marks.push({mark:[c*x-sn*z,y,sn*x+c*z,drag?.50:.245],info:[INKS[inkIndex],drag?1:0,clamp(dx*.10,-1,1),clamp(dz*.10,-1,1)]});}
function sling(g,q){const b=g.item,p=camera.plane(...q,b.y);if(!p)return [0,0];let dx=(g.anchor[0]-p[0])*2.1,dz=(g.anchor[1]-p[1])*2.1;const f=Math.min(1,8.9/(Math.hypot(dx,dz)||1));return [dx*f,dz*f];}
function tuningTicks(b){
  const radius=Math.hypot(b.x,b.z);
  return resonanceTicks(s,b).filter(t=>Math.abs(t.radius-radius)>.15)
    .sort((a,b)=>Math.abs(a.radius-radius)-Math.abs(b.radius-radius)).slice(0,6);
}
function fling(g,q){
  const b=g.item,p=camera.plane(...q,b.y),r=Math.hypot(b.x,b.z);
  const vx=b.x/r,vz=b.z/r;
  const tick=s.spheres.on&&p&&Math.abs(vx*p[1]-vz*p[0])<.17
    ? tuningTicks(b).find(t=>Math.abs(t.radius-(p[0]*vx+p[1]*vz))<.11) : null;
  s.fling(b,...sling(g,q),tick?.radius);
  creatures.scatter(b.x,b.z);
  if(tick)say(`${tick.ratio} with ${tick.neighbour.name} · tuning orbit`);
}
canvas.oncontextmenu=e=>e.preventDefault();canvas.onpointerdown=e=>{if(blackHole.fall||gesture||e.button!==0&&e.button!==2)return;e.preventDefault();atlas.action();audio.wake();canvas.focus({preventScroll:true});help.open=false;if(voyage.active){
  const q=ndc(e);
  gesture={voyage:true,right:e.button===2,item:pick(q),anchor:camera.plane(...q,-.49),id:e.pointerId,
    x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY,moved:false,start:e.timeStamp};
  canvas.setPointerCapture(e.pointerId);return;
}if(worlds.body){gesture={inWorld:true,right:e.button===2,id:e.pointerId,x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY};canvas.setPointerCapture(e.pointerId);return;}if(camera.mode==='drift'){drift.activity();if(e.button===0){const q=ndc(e),item=pick(q);gesture={drift:true,item,anchor:camera.plane(...q,-.49),id:e.pointerId,x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY,moved:false,start:e.timeStamp};canvas.setPointerCapture(e.pointerId);}return;}const q=ndc(e),right=e.button===2,item=right?null:pick(q),p=camera.plane(...q,item&&item!=='sun'?item.y:-.49);gesture={item,right,id:e.pointerId,q,anchor:p,prev:p,start:e.timeStamp,at:s.t,x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY,moved:false,swish:0};if(item&&item!=='sun'&&item!==camera.focus)item.held=true;canvas.setPointerCapture(e.pointerId);hover(e);};
canvas.onpointermove=e=>{hover(e);const g=gesture;
 if(g?.voyage&&g.id===e.pointerId){
   g.moved||=Math.hypot(e.clientX-g.x,e.clientY-g.y)>4;
   if(g.moved)voyage.look(e.clientX-g.lx,e.clientY-g.ly);
   g.lx=e.clientX;g.ly=e.clientY;return;
 }
 if(g?.inWorld&&g.id===e.pointerId){g.moved||=Math.hypot(e.clientX-g.x,e.clientY-g.y)>4;if(g.moved)worlds.gesture(interiorPoint(e),e.clientX-g.lx,e.clientY-g.ly,g.right||e.shiftKey);g.lx=e.clientX;g.ly=e.clientY;return;}if(camera.mode==='drift'){if(e.movementX||e.movementY)drift.activity(!!g);if(g?.drift&&g.id===e.pointerId){g.moved||=Math.hypot(e.clientX-g.x,e.clientY-g.y)>4;if(g.moved){if(blackHole.hole&&g.item===blackHole.hole){const p=camera.plane(...ndc(e),blackHole.hole.y);if(p)blackHole.move(...p);}else drift.look(e.clientX-g.lx,e.clientY-g.ly);}g.lx=e.clientX;g.ly=e.clientY;}return;}if(!g||e.pointerId!==g.id)return;const dx=e.clientX-g.lx,dy=e.clientY-g.ly,q=ndc(e);g.q=q;g.lx=e.clientX;g.ly=e.clientY;g.moved||=Math.hypot(e.clientX-g.x,e.clientY-g.y)>5;if(g.right){camera.orbit(dx,dy);return;}if(!g.moved||g.item==='sun')return;if(blackHole.hole&&g.item===blackHole.hole){const p=camera.plane(...q,blackHole.hole.y);if(p)blackHole.move(...p);return;}if(selected===voidIndex)return;if(g.item===camera.focus&&g.item){surface(g.item,q,true,dx,dy);used(1);if(s.t>g.swish){audio.play('stir');g.swish=s.t+.23;}return;}if(today()&&g.item&&g.item!==camera.focus&&g.anchor)atlas.science.preview(g.item,...sling(g,q));if(g.item||camera.mode!=='overview')return;
 const b=camera.plane(...q,-.49),a=g.prev;if(!within(b)||!a){g.prev=b;return;}const comb=e.shiftKey||shiftDown||(e.pointerType==='touch'&&combButton.getAttribute('aria-pressed')==='true'),speed=Math.hypot(dx,dy),size=comb?.98:.38+Math.min(.7,speed*.016);s.strokes.push([comb?2:1,a,b,size,INKS[inkIndex]]);g.prev=b;s.vortex=null;s.force={x:b[0],z:b[1],r:size,id:INKS[inkIndex],dx:clamp((b[0]-a[0])*110,-44,44),dz:clamp((b[1]-a[1])*110,-44,44),twist:(dx*dy<0?-1:1)*(.4+speed*.034),life:.22};if(s.t>g.swish){audio.play(comb?'comb':'stir');g.swish=s.t+.18;}if(comb)creatures.scatter(b[0],b[1]);used(comb?2:1);counts[comb?'comb':'stir']=(counts[comb?'comb':'stir']||0)+1;};
function cancel(){if(gesture?.voyage)voyage.endLook();if(gesture?.item&&gesture.item!=='sun')gesture.item.held=false;gesture=null;s.vortex=null;s.charge=s.hold=0;audio.charge(0);}
canvas.onpointerup=e=>{const g=gesture;if(!g||g.id!==e.pointerId)return;
 if(g.voyage){
   if(!g.moved&&!g.right&&selected!==voidIndex)driftDrop(ndc(e));
   cancel();return;
 }
 if(g.inWorld){if(!g.moved&&!g.right&&worlds.inside>.8){const p=interiorPoint(e);if([1,5].includes(worlds.body.kind)&&!e.shiftKey)worlds.act(p);else if(selected!==voidIndex)worlds.paint(p,INKS[inkIndex]);}cancel();return;}if(selected===voidIndex||blackHole.hole&&g.item===blackHole.hole){cancel();hover(e);return;}if(g.drift){if(!g.moved)driftDrop(ndc(e));cancel();hover(e);return;}const q=ndc(e),hold=(e.timeStamp-g.start)/1000,b=g.item,p=g.anchor;if(!g.right){if(b==='sun'){if(!today()){if(hold>=.19)say(reasons[5]);}else if(hold>=4){s.supernova();used(5);}else if(hold>=.19){const aim=camera.plane(...q,0)??[camera.right[0]*5,camera.right[2]*5],len=Math.hypot(...aim)||1,dx=aim[0]/len,dz=aim[1]/len;s.addFlare(dx*.99,dz*.99,dx,dz,clamp((hold-.2)/1.3,0,1));s.emit('flare',dx,dz,0);used(5);}}
 else if(b){if(b===camera.focus){if(!g.moved){surface(b,q,false);audio.play('drop',INKS[inkIndex]);counts.surface=(counts.surface||0)+1;used(0);}}else if(g.moved&&p){if(today()){fling(g,q);used(3);}else say(reasons[3]);}else fly('planet',b);}
 else if(!g.moved&&camera.mode!=='overview')fly('overview');else if(!g.moved&&within(p)){if(!today()&&hold>=.6){say(reasons[4]);}else if(hold>=.6&&Math.hypot(...p)>1.35){const ids=renderer.sample(...p,s,camera);if(!ids.includes(INKS[inkIndex]))ids.splice(1,0,INKS[inkIndex]);const born=s.birth(...p,hold,ids);say(`${born.name} · born of ${ids.slice(0,3).map(id=>names[INKS.indexOf(id)]??'Fire').join(' + ')}`);used(4);}else{queueDrop(p);}}}cancel();hover(e);};
canvas.onlostpointercapture=cancel;canvas.onpointercancel=cancel;canvas.onpointerleave=()=>{if(!gesture){lastHover=null;cursor.style.display='none';}};canvas.ondblclick=e=>{const q=ndc(e),item=pick(q);if(blackHole.hole&&item===blackHole.hole){if(selected!==voidIndex)blackHole.remove();return;}if(camera.mode==='drift'||voyage.active||selected===voidIndex)return;if(item==='sun'){fly('poster');return;}const p=camera.plane(...q,-.49);if(camera.mode==='overview'&&!item&&within(p))enter(p);};
canvas.addEventListener('wheel',e=>{e.preventDefault();if(camera.mode==='drift'){drift.activity();return;}if(camera.mode!=='poster')camera.zoom=clamp(camera.zoom*Math.exp(-e.deltaY*.00075),.63,1.9);},{passive:false});
function reset(){cancel();clearDrops();drift.ripples.length=0;atlas.science.reset();s.reset();s.life.reset();blackHole.reset();worlds.reset();creatures.reset();s.spheres.reset();s.blooms.length=s.strokes.length=0;s.force=null;renderer.reset();camera.targetYaw=0;camera.targetPitch=30;camera.zoom=1;fly('overview');say('Original system restored');}
const movement=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','Space','KeyC','KeyF','ShiftLeft','ShiftRight']);
window.addEventListener('keydown',e=>{
  if($('#stage').inert)return;
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const k=e.code;
  if(postcard.visible){
    if(k==='Escape'){e.preventDefault();postcard.close();}
    if(k==='KeyM'&&!e.repeat&&!e.target.matches('input')){e.preventDefault();toggleMute();}
    return;
  }
  if(!modeHelp.hidden&&(k==='Escape'||k==='KeyH')){e.preventDefault();toggleHelp();return;}
  if(e.target.matches('select,input')&&k!=='Escape')return;
  if(voyage.active){
    if(k==='Escape'&&voyage.open){e.preventDefault();voyage.close();return;}
    const choosing=voyage.open&&k==='Space'&&e.target.closest('#voyage-list');
    if(['Space','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(k)&&!choosing){
      e.preventDefault();
      if(e.repeat)return;
      if(k==='Space')voyage.togglePause();
      else if(k.startsWith('Arrow'))voyage.skip(k==='ArrowLeft'?-1:1);
      else {voyage.take();drift.key(k,true);}
      return;
    }
  }
  if(camera.mode==='drift')drift.activity();
  if(k==='ShiftLeft'||k==='ShiftRight'){shiftDown=true;if(lastHover)hover(lastHover);}
  if(camera.mode==='drift'&&movement.has(k)){e.preventDefault();if(!e.repeat){atlas.action();if(worlds.body)worlds.key(k,true);else drift.key(k,true);}return;}
  if(!['Escape','Space','KeyD','KeyS','KeyO','KeyM','KeyH','KeyR','KeyB','KeyN','KeyK','KeyZ','KeyG','KeyT','KeyP','KeyV','Enter','BracketLeft','BracketRight'].includes(k)&&!/^Digit[1-7]$/.test(k))return;
  if((k==='Space'||k==='Enter')&&e.target.matches('button,summary'))return;
  e.preventDefault();if(e.repeat&&!k.startsWith('Bracket'))return;
  audio.wake();if(k!=='KeyB')atlas.action();
  if(k.startsWith('Digit')){choose(Number(k.slice(-1))-1,true);return;}
  switch(k){
    case 'Escape':
      if(voyage.open&&!atlas.open){fly('overview');break;}
      if(atlas.open){atlas.bookOpen(false);break;}
      if(worlds.body){help.open=false;cancel();worlds.leave();break;}
      help.open=false;cancel();fly('overview');break;
    case 'Enter':worlds.enter(drift.ride);break;
    case 'KeyD':enter();break;
    case 'KeyB':atlas.toggleBook();break;
    case 'KeyN':atlas.science.labels=!atlas.science.labels;break;
    case 'KeyG':toggleChime();break;
    case 'KeyT':if(stage.dataset.mode!=='bench')fly('overview');timeline.toggle();break;
    case 'KeyV':voyage.toggle();break;
    case 'KeyP':postcard.open();break;
    case 'KeyK':atlas.science.kepler();break;
    case 'KeyZ':atlas.science.toggleZone();break;
    case 'Space':s.paused=!s.paused;say((s.paused?'Orbits paused':'Orbits in motion'));break;
    case 'KeyS':fly('poster');break;
    case 'KeyH':toggleHelp();break;
    case 'KeyR':reset();break;
    case 'KeyO':s.guides=!s.guides;say((s.guides?'Orbit guides on':'Orbit guides off'));break;
    case 'KeyM':toggleMute();break;
    case 'BracketLeft':case 'BracketRight':{
      const old=s.rate;s.rate=clamp(s.rate*(k==='BracketRight'?1.5:1/1.5),.17,6);
      if(s.rate>old)atlas.discover(2);say(('Orbit time ×')+s.rate.toFixed(2));break;
    }
  }
});
window.addEventListener('keyup',e=>{if(movement.has(e.code)){drift.key(e.code,false);worlds.key(e.code,false);}if(e.key==='Shift'){shiftDown=false;if(lastHover)hover(lastHover);}});
window.addEventListener('blur',()=>{shiftDown=false;drift.clearKeys();worlds.clearKeys();cancel();});
document.addEventListener('pointerdown',e=>{if(camera.mode==='drift'&&e.target!==canvas)drift.activity();},true);
for(const type of ['pointermove','pointerdown','keydown','wheel'])document.addEventListener(type,voyage.activity,{capture:true,passive:true});
$('#quality').onchange=e=>{s.low=e.target.value==='low';s.grid=s.low?128:256;$('#resolution').value=s.grid;};$('#density').oninput=e=>s.density=Number(e.target.value);$('#resolution').onchange=e=>s.grid=Number(e.target.value);
function overlayFrame(){const g=gesture;if(!g&&!hadOverlay)return;const w=canvas.clientWidth,h=canvas.clientHeight;if(overlay.width!==w||overlay.height!==h){overlay.width=w;overlay.height=h;}pen.clearRect(0,0,w,h);hadOverlay=!!g;if(!g||g.right||g.inWorld||(g.drift||g.voyage)&&!g.voidHold)return;const rect=canvas.getBoundingClientRect();const pos=(x,y,z)=>{const p=camera.project(x,y,z);return [(p[0]+1)*w*.5,(1-p[1])*h*.5];};pen.lineWidth=1.5;pen.strokeStyle='#ffe0ae';pen.fillStyle='#ffe6c2';if(g.voidHold){const r=17+Math.min(s.hold,1)*11,x=g.lx-rect.left,y=g.ly-rect.top;pen.beginPath();pen.arc(x,y,r,0,Math.PI*2);pen.stroke();pen.fillStyle='#080609';pen.fill();pen.strokeStyle='#f9deaa';pen.beginPath();pen.arc(x,y,r-4,-Math.PI/2,-Math.PI/2+Math.min(1,s.hold)*Math.PI*2);pen.stroke();return;}if(blackHole.hole&&g.item===blackHole.hole||selected===voidIndex)return;if(today()&&g.item&&g.item!=='sun'&&g.item!==camera.focus&&g.moved){const b=g.item,from=pos(b.x,b.y,b.z),to=[g.lx-rect.left,g.ly-rect.top];pen.beginPath();pen.moveTo(...from);pen.lineTo(...to);pen.stroke();let [vx,vz]=sling(g,g.q),x=b.x,z=b.z;for(let j=0;j<42;j++){const mag=Math.max(.6,Math.hypot(x,z)),dt=.066;vx-=MU*x/mag**3*dt;vz-=MU*z/mag**3*dt;x+=vx*dt;z+=vz*dt;const p=pos(x,b.y,z);pen.beginPath();pen.arc(...p,Math.max(.8,2.6-j*.04),0,2*Math.PI);pen.fill();if(Math.hypot(x,z)<1)break;}
  if(s.spheres.on){
    const radius=Math.hypot(b.x,b.z),dx=b.x/radius,dz=b.z/radius;
    pen.font='10px ui-monospace, monospace';pen.textAlign='center';pen.strokeStyle='#fae0a7';
    for(const tick of tuningTicks(b)){
      const x=dx*tick.radius,z=dz*tick.radius,at=pos(x,b.y,z);
      const left=pos(x+dz*.061,b.y,z-dx*.061),right=pos(x-dz*.061,b.y,z+dx*.061);
      pen.beginPath();pen.moveTo(...left);pen.lineTo(...right);pen.stroke();pen.fillText(tick.ratio,at[0],at[1]-9);
    }
  }}
 else if((today()&&g.item==='sun')||s.vortex){const isSun=g.item==='sun',p=isSun?pos(0,0,0):pos(...[g.anchor[0],-.49,g.anchor[1]]),r=isSun?Math.abs(pos(camera.right[0],0,camera.right[2])[0]-p[0])*1.1:21+s.hold*3;pen.strokeStyle='#ffe6bc77';pen.beginPath();pen.arc(...p,r,0,Math.PI*2);pen.stroke();pen.strokeStyle=colors[selected];pen.lineWidth=3;pen.beginPath();pen.arc(...p,r,-Math.PI/2,-Math.PI/2+Math.PI*2*clamp(s.hold/(isSun?4:3),0,1));pen.stroke();if(s.hold>.35){pen.font='11px ui-monospace, monospace';pen.textAlign='center';pen.fillText(isSun?(s.hold>=4?'Release · supernova':'Charging the star'):'Condensing',p[0],p[1]-r-10);}}}
function fail(e){console.error(e);$('#error').hidden=false;$('#error').textContent=e.message;if(boot.active)boot.fail(e.message);}canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(Error('Graphics context lost. Reload to restart the orrery.'));});
function tick(now){const dt=last?Math.min(.08,(now-last)/1000):1/60;last=now;if(postcard.visible&&!postcard.recording){audio.tick(blackHole.hole?2:today()?(camera.mode==='drift'||voyage.active&&camera.inside>.62?1:0):chapters[s.life.chapter].track);postcard.preview();requestAnimationFrame(tick);return;}
  if(voyage.paused){
    voyage.tick(0);camera.tick(s.t,0,canvas.clientWidth/canvas.clientHeight,0);
    if(!postcard.clipFrame(now,dt))renderer.render(s,camera,0,{still:true});
    frames++;requestAnimationFrame(tick);return;
  }
  s.advance(dt);voyage.auto();voyage.updateAge(dt);s.life.update(dt);if(!document.getElementById('timeline').hidden)timeline.update();audio.tick(blackHole.hole?2:today()?(camera.mode==='drift'||voyage.active&&camera.inside>.62?1:0):chapters[s.life.chapter].track);s.spheres.update(dt);creatures.update(dt);voyage.tick(dt);if(camera.focus&&!s.sceneBodies.includes(camera.focus)){const b=s.sceneBodies.find(b=>b.key===camera.focus.key);if(b)camera.focus=b;else fly('overview');}if(camera.mode==='drift'&&!blackHole.fall&&!worlds.body)drift.tick(dt,camera.flying);worlds.tick(dt);blackHole.tick(dt);audio.setPresence(1-.98*blackHole.fall);audio.setEffectsPresence(voyage.active?.5:1);camera.nebulaPrint=s.life.chapter===3;camera.tick(s.t,dt,canvas.clientWidth/canvas.clientHeight,s.shake);blackHole.alignment();if(voyage.shot?.nearSun&&Math.hypot(...camera.eye)<2.75)atlas.discover(13);worlds.controls(camera);document.getElementById('rekindle').hidden=!blackHole.ready;const g=gesture;s.hold=g?Math.max(0,(now-g.start)/1000):0;if(g){
    g.voidHold=selected===voidIndex&&!g.formed&&!g.item&&!g.right&&!g.moved&&within(g.anchor);
    if(g.voidHold&&s.hold>=1){g.formed=true;g.voidHold=false;
      const ink=renderer.sample(...g.anchor,s,camera).find(id=>id>0&&id<7)??INKS[inkIndex];
      blackHole.form(...g.anchor,ink);
    }
  }
  s.charge=selected!==voidIndex&&today()&&g?.item==='sun'?clamp(s.hold/1.5,0,1):0;s.vortex=selected!==voidIndex&&today()&&g&&!g.item&&!g.right&&!g.moved&&camera.mode==='overview'&&within(g.anchor)&&s.hold>=.6?g.anchor:null;if(s.vortex){atlas.science.vortex=s.vortex;atlas.discover(7);}if(s.vortex||s.charge){audio.charge(clamp(s.hold/(s.vortex?3:4),.01,1));if(s.vortex){s.force={x:g.anchor[0],z:g.anchor[1],r:.42+s.hold*.18,id:INKS[inkIndex],dx:0,dz:0,twist:2.8,life:.1};}}if(news.textContent&&s.t>newsUntil)news.textContent='';if(!postcard.clipFrame(now,dt))renderer.render(s,camera,dt);overlayFrame();
  if(camera.mode==='drift'&&drift.near){const n=drift.nearestDistance;audio.environment(drift.heat,Math.exp(-Math.max(0,n)*2)*.93,clamp((previousNear-n)/dt,-1,1));previousNear=n;}else if(voyage.active){
    const [x,y,z]=camera.eye;
    const n=Math.min(...s.sceneBodies.map(b=>Math.hypot(x-b.x,y-b.y,z-b.z)-b.r));
    const heat=clamp((s.life.starRadius+2.25-Math.hypot(x,y,z))/1.78,0,1);
    audio.environment(heat,Math.exp(-Math.max(0,n)*2)*.93,Number.isFinite(previousNear-n)?clamp((previousNear-n)/dt,-1,1):0);
    previousNear=n;
  }else audio.environment(0);
  atlas.tick(dt,today()&&g?.item!==blackHole.hole&&!!(g?.moved&&g.item&&g.item!=='sun'&&g.item!==camera.focus));frames++;requestAnimationFrame(tick);}
requestAnimationFrame(()=>setTimeout(async()=>{
  try{
    renderer=createRenderer(canvas);boot.progress('shaders');
    camera.tick(s.t,1/60,canvas.clientWidth/canvas.clientHeight,0);
    renderer.render(s,camera,1/60);
    boot.progress('textures');
    await firstTrack;
    boot.ready(()=>{audio.wake();requestAnimationFrame(tick);},pixel(0,0,0));
  }catch(e){fail(e);}
},0));
// Read-only capture instrumentation: all mutations still enter through the public controls.
export function observation(){const gl=renderer?.gl,ext=gl?.getExtension('WEBGL_debug_renderer_info');return {uiMode:stage.dataset.mode,postcard:postcard.state(),voyage:voyage.state(),creatures:{...creatures.state(),fish:creatures.fishCount()},world:worlds.body?{name:worlds.body.name,kind:worlds.body.kind,inside:worlds.inside,toy:worlds.toy.power,turn:worlds.toy.turn,leaving:worlds.leaving}:null,blackHole:{hole:blackHole.hole?{...blackHole.hole,xy:pixel(blackHole.hole.x,blackHole.hole.y,blackHole.hole.z)}:null,fall:blackHole.fall,dim:blackHole.dim,ready:blackHole.ready,streams:blackHole.streams.map(b=>b.name),starStream:!!blackHole.starStream},life:{value:s.life.value,chapter:s.life.chapter,playing:s.life.playing,radius:s.life.starRadius,shells:s.life.shells},audio:audio.state(),spheres:{on:s.spheres.on,total:s.spheres.total,ripples:s.spheres.ripples.length,locks:s.spheres.locks.map(p=>({ratio:p.ratio,a:p.a.name,b:p.b.name,lines:p.lines.length})),voices:s.spheres.voices.map(v=>({name:v.body.name,cycle:v.cycle,pitch:v.pitch}))},atlas:atlas.state(),drift:{eye:[...camera.eye],forward:camera.back.map(v=>-v),inside:camera.inside,yaw:drift.yaw,pitch:drift.pitch,near:drift.near?.name,distance:drift.nearestDistance,ride:drift.ride?.name,auto:drift.auto,cloud:drift.cloud?.id,heat:drift.heat,crossedAt:drift.crossedAt,ripples:drift.ripples.map(m=>({...m})),clouds:clouds.slice(0,activeClouds(s.low)).map(v=>({id:v.id,pos:v.pos,size:v.size}))},muted:audio.muted,frames,t:s.t,mode:camera.mode,focus:camera.focus?.name,flying:camera.flying,paused:s.paused,active:s.flares.length,hue:s.hue,nova:s.nova<0?-1:s.t-s.nova,yaw:camera.yaw,pitch:camera.pitch,low:s.low,vortex:!!s.vortex,counts:{...counts},sun:pixel(0,0,0),bodies:s.sceneBodies.map(b=>({key:b.key,name:b.name,xy:pixel(b.x,b.y,b.z),x:b.x,y:b.y,z:b.z,r:b.r,marks:b.marks.length,toy:(b.original?.toy??b.toy)?.power??0,tuning:b.tuning,ids:[b.id,b.id2,b.id3],comet:!!b.comet,launched:b.launched})),gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null};}
export function projectPoint(x,z,height=-.49){return pixel(x,height,z);}
