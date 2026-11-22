import { clamp } from './system.js';

export const chapters = [
  { name:'The young disc', time:'4.6 billion years ago', track:4 },
  { name:'Today', time:'Main sequence', track:0 },
  { name:'Red giant', time:'In about 5 billion years', track:2, note:17 },
  { name:'Planetary nebula', time:'After the red giant phase', track:3, note:18 },
  { name:'White dwarf', time:'Cooling over billions of years', track:4, note:19 },
];
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
const engulfAt = new Map([[1,1.56],[2,1.87]]);

export function createLife(s, discover, change) {
  const life={value:1,chapter:1,playing:false,starRadius:1,young:0,red:0,shells:0,white:0,expansion:1};
  let from=1, launched=0, viewTime=0;
  const views=new Map(), bodies=[], pending=[];
  function values(value) {
    life.value=value;life.chapter=Math.round(value);
    life.young=1-smooth(0,1,value);
    life.red=smooth(1.13,1.98,value)*(1-smooth(2.08,2.85,value));
    life.white=smooth(3.15,4,value);
    life.shells=smooth(2.15,2.99,value)*(1-.87*life.white);
    life.expansion=1+.43*smooth(1,2.97,value)+.10*life.white;
    life.starRadius=value<1?mix(.42,1,smooth(.1,1,value))
      : value<2?mix(1,3.64,smooth(1,2,value))
      : value<3?mix(3.64,.19,smooth(2.04,2.9,value)):.19+.035*life.white;
  }
  function set(value, announce=true) {
    const old=life.value, previous=life.chapter;
    value=clamp(value,0,4);
    if(value<old)pending.length=0;
    if(announce && value>=old)for(const b of s.bodies){
      const threshold=engulfAt.get(b.kind);
      if(old<threshold&&value>=threshold){
        const view=views.get(b.key)??b, angle=Math.atan2(view.z,view.x);
        const r=b.kind===1?1.83:3.48;
        pending.push({b,at:s.t+pending.length*.30,x:r*Math.cos(angle),z:r*Math.sin(angle)});
      }
    }
    values(value);
    if(previous!==life.chapter){
      const next=chapters[life.chapter];
      change(next);
      if(announce&&next.note)discover(next.note);
    }
  }
  function update(dt) {
    if(life.playing){
      set(from+(s.t-launched)*4/90);
      if(life.value===4)life.playing=false;
    }
    if(life.value===1){s.sceneBodies=s.bodies;viewTime=0;return;}
    if(!s.paused)viewTime+=dt*s.rate;
    bodies.length=0;
    for(const b of s.bodies){
      const condense=smooth(.18+b.kind*.041,1,life.value);
      const threshold=engulfAt.get(b.kind);
      const swallowed=threshold?smooth(threshold-.20,threshold+.02,life.value):0;
      const scale=condense*(1-swallowed);
      if(scale<.025)continue;
      const a=Math.atan2(b.z,b.x)+viewTime*.45/Math.max(1,b.guide)**1.5;
      const r=(Math.hypot(b.x,b.z)*life.expansion)*mix(1,.50,swallowed);
      let v=views.get(b.key);
      if(!v){v={};views.set(b.key,v);}
      Object.assign(v,b,{original:b,x:r*Math.cos(a),z:r*Math.sin(a),r:b.r*scale,
        guide:b.guide*life.expansion,hit:b.hit,chimeUntil:Math.max(v.chimeUntil??0,b.chimeUntil??0)});
      bodies.push(v);
    }
    s.sceneBodies=bodies;
    while(pending.length&&pending[0].at<=s.t){
      const {b,x,z}=pending.shift();
      if(life.value>=1.56 && life.value<=2.25)s.emit('engulf',x,z,b.id,0,b.r*4,{name:b.name});
    }
  }
  return Object.assign(life,{set,update,togglePlay(){
    if(life.playing){life.playing=false;return;}
    if(life.value>=3.999) set(0,false);
    from=life.value;launched=s.t;life.playing=true;
  },reset(){life.playing=false;pending.length=0;views.clear();viewTime=0;set(1,false);s.sceneBodies=s.bodies;}});
}

export function bindTimeline(life, openPrint) {
  const $=id=>document.getElementById(id);
  const button=$('timeline-toggle'), bar=$('timeline'), range=$('life-age'), play=$('life-play');
  const stamps=chapters.map(({name},i)=>{
    const tab=document.createElement('button');
    tab.type='button';tab.textContent=name;
    tab.onclick=()=>{life.playing=false;life.set(i);update();};
    $('life-chapters').append(tab);
    return tab;
  });
  let lastChapter=-1, lastPlaying;
  function toggle(){bar.hidden=!bar.hidden;button.setAttribute('aria-expanded',String(!bar.hidden));}
  function update(){
    if(range.valueAsNumber!==life.value)range.value=life.value;
    if(lastPlaying!==life.playing){
      play.textContent=life.playing?'Pause':'Play life';lastPlaying=life.playing;
    }
    if(lastChapter!==life.chapter){
      const info=chapters[life.chapter];
      $('life-title').textContent=info.name;
      $('life-time').textContent=info.time;
      range.setAttribute('aria-valuetext',info.name+' · '+info.time);
      stamps.forEach((tab,i)=>tab.setAttribute('aria-pressed',String(i===life.chapter)));
      $('nebula-print').hidden=life.chapter!==3;
      lastChapter=life.chapter;
    }
  }
  button.onclick=toggle;
  range.oninput=()=>{life.playing=false;life.set(range.valueAsNumber);update();};
  play.onclick=()=>{life.togglePlay();update();};
  $('nebula-print').onclick=openPrint;
  update();
  return {toggle,update};
}
