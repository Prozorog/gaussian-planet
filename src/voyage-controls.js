import './voyage.css';
import { createVoyageFlight, subjectOf, voyages } from './voyage.js';

const storage='gaussian-planet.voyage.v1';
const $=id=>document.getElementById(id);
const defaultVoyage=voyages[0].id;
const duration=seconds=>seconds?Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'):'Continuous';

export function bindVoyage(s,c,{begin,helm,canIdle}) {
  let saved={};
  try { saved=JSON.parse(localStorage.getItem(storage))??{}; } catch {}
  const completed=new Set(Array.isArray(saved.completed)?saved.completed:[]);
  const stage=$('stage'),list=$('voyage-list'),button=$('voyage-toggle');
  const controls=$('voyage-controls'),caption=$('voyage-log'),mark=$('voyage-discovery');
  const idle=$('voyage-idle'),cinema=$('voyage-cinema'),pause=$('voyage-pause');
  const title=document.createElement('strong'),fact=document.createElement('span');caption.replaceChildren(title,fact);
  let flight=null,lastInput=s.t,markUntil=0,captionStart=-10;
  idle.checked=saved.idle!==false;cinema.checked=saved.cinema!==false;
  function save() {
    try { localStorage.setItem(storage,JSON.stringify({completed:[...completed],idle:idle.checked,cinema:cinema.checked})); } catch {}
  }
  function syncBars(){stage.classList.toggle('cinema',cinema.checked);}
  syncBars();
  cinema.onchange=()=>{syncBars();save();};
  idle.onchange=save;
  function activity(){
    lastInput=s.t;
    stage.classList.remove('voyage-quiet');
  }
  function close(){
    list.hidden=true;
    button.setAttribute('aria-expanded','false');
  }
  function refresh(){
    const choices=voyages.filter(v=>v.id!=='dark'||s.blackHole.hole);
    list.querySelector('div').replaceChildren(...choices.map(v=>{
      const item=document.createElement('button'),name=document.createElement('span'),time=document.createElement('small');
      item.type='button';item.dataset.voyage=v.id;name.textContent=v.name;
      time.textContent=(completed.has(v.id)?'✓ Completed · ':'')+duration(v.seconds);
      item.append(name,time);item.onclick=()=>start(v.id);
      return item;
    }));
  }
  function toggle(){
    activity();
    if(!list.hidden){close();return;}
    refresh();list.hidden=false;button.setAttribute('aria-expanded','true');
    $('settings').open=false;
  }
  function start(id) {
    const definition=voyages.find(v=>v.id===id);
    if(!definition||id==='dark'&&!s.blackHole.hole)return;
    const initial={position:c.eye,forward:c.back.map(x=>-x),inside:c.inside,shift:c.shift,bank:c.bank,
      velocity:flight?.velocity??(c.mode==='drift'?c.drift.velocity:undefined)};
    close();activity();markUntil=0;
    stage.classList.add('voyaging');controls.hidden=false;
    pause.textContent='Pause';
    const transition=createVoyageFlight(s,initial,definition,shot=>{
      title.textContent=shot.title;fact.textContent=shot.fact;captionStart=-1;caption.classList.remove('visible');
    });
    flight=transition;
    $('film-name').textContent=definition.name;
    $('film-progress').replaceChildren(...transition.seconds.map(seconds=>{const tick=document.createElement('i');tick.style.flexGrow=seconds;return tick;}));
    begin(transition.pose);
  }
  function take(complete=false){
    if(!flight)return;
    if(complete){

      completed.add(flight.definition.id);
      save();
    }
    const {pose,velocity}=flight;
    stop();
    helm(pose,velocity);
  }
  function stop(){
    if(flight?.definition.id==='life')s.life.seek(1);
    flight=null;
    caption.classList.remove('visible');mark.classList.remove('visible');
    controls.hidden=true;
    stage.classList.remove('voyaging');
    activity();
  }
  function togglePause(){
    if(!flight)return;
    flight.toggle();pause.textContent=flight.paused?'Resume':'Pause';activity();
  }
  function skip(offset){if(flight){flight.skip(offset);activity();}}
  function auto(){
    if(!idle.checked||!canIdle()||!list.hidden)return;
    if(c.mode==='overview'&&!c.flying&&s.t-lastInput>=90)start(defaultVoyage);
    if(c.mode==='drift'&&!c.flying&&!c.drift.ride&&!s.worlds.body&&
      s.t-Math.max(c.drift.lastInput,lastInput)>=8)start(defaultVoyage);
  }
  button.onclick=toggle;$('voyage-prev').onclick=()=>skip(-1);
  $('voyage-next').onclick=()=>skip(1);pause.onclick=togglePause;
  $('voyage-helm').onclick=()=>take();
  return {
    start,stop,take,close,toggle,skip,togglePause,auto,activity,
    updateAge(dt){flight?.updateAge(dt);},
    tick(dt){
      if(!flight)return;
      stage.classList.toggle('voyage-quiet',s.t-lastInput>3&&list.hidden&&canIdle());
      const subject=subjectOf(s,flight.shot.subject);
      if(captionStart<0&&subject&&flight.shotTime>1.1){
        const [x,y,z]=c.project(subject.x,subject.y,subject.z);
        if(z>0&&Math.abs(x)<.87&&(Math.abs(y)<.95||flight.shot.move==='F'))captionStart=s.t;
      }
      caption.classList.toggle('visible',captionStart>=0&&s.t-captionStart<6);
      const ticks=$('film-progress').children;
      for(let i=0;i<ticks.length;i++)ticks[i].style.setProperty('--played',(i<flight.index?100:i===flight.index?100*flight.shotTime/flight.shot.seconds:0)+'%');
      mark.classList.toggle('visible',s.t<markUntil);
      const oldHeight=flight.pose.position[1];
      c.voyagePose=flight.tick(dt);
      if(flight.shot.bands&&oldHeight<.68&&flight.pose.position[1]>=.68)s.onFilmCross?.(flight.pose.position);
      if(flight.finished)take(true);
    },
    look(dx,dy){flight?.look(dx,dy);activity();},
    endLook(){flight?.endLook();},
    discovered(){markUntil=s.t+2.8;},
    get active(){return !!flight;},get open(){return !list.hidden;},
    get shot(){return flight?.shot;},
    state(){return {name:flight?.definition.name??null,id:flight?.definition.id??null,shot:flight?.index??null,
      elapsed:flight?.elapsed??0,paused:flight?.paused??false,caption:caption.classList.contains('visible')?caption.textContent:'',
      quiet:stage.classList.contains('voyage-quiet'),cinema:cinema.checked,idle:idle.checked,bank:c.bank??0,completed:[...completed]};},
  };
}
