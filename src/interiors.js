import { clamp } from './system.js';

export const interiors = {
  4:{title:'Aurelia', action:'Stir a storm', hint:'Drag the cloud bands to stir', sound:'stir', note:24},
  3:{title:'Tide', action:'Move the moon', hint:'Drag the moon across the sky', sound:'splash', note:25, dial:'Moon position'},
  1:{title:'Ember', action:'Crack the crust', hint:'Click the crust to raise a fountain', sound:'feed', note:26},
  2:{title:'Verdance', action:'Tilt the axis', hint:'Drag the axis to change the seasons', sound:'choose', note:27, dial:'Axis tilt'},
  5:{title:'Vesper', action:'Wake a geyser', hint:'Click an ice stripe', sound:'splash', note:28},
};
const swift = new Set(['ShiftLeft','ShiftRight']);
const movement = {
  forward:['KeyW','ArrowUp'],back:['KeyS','ArrowDown'],left:['KeyA','ArrowLeft'],right:['KeyD','ArrowRight'],
};
const smooth = u => u*u*(3-2*u);

export function interiorData(body) {
  const original=body.original??body;
  return original.toy??={power:0,x:0,y:-.15,turn:0,at:-50,ink:body.id,drops:[]};
}

export function createInteriors(s, drift, audio, discover) {
  const w={body:null,inside:0,yaw:0,pitch:0,offset:[0,0],toy:null,leaving:false};
  const keys=new Set(),velocity=[0,0];
  let time=0,spin=0,wasActive=false,viewYaw=0,viewPitch=0,controlBody=null,controlInside=false;
  const panel=document.getElementById('world-controls'),title=panel.querySelector('strong'),hint=panel.querySelector('small');
  const ride=document.getElementById('ride-world'),dive=document.getElementById('dive-world'),
    exit=document.getElementById('leave-world'),action=document.getElementById('world-action'),
    dial=document.getElementById('world-dial');
  function enter(body) {
    if(w.body||!body||!interiors[body.kind]||body.creature)return;
    w.body=body;w.toy=interiorData(body);w.leaving=false;time=0;
    w.offset.fill(0);velocity.fill(0);w.yaw=w.pitch=viewYaw=viewPitch=spin=0;
    keys.clear();audio.splash();
  }
  function leave() {
    if(!w.body||w.leaving)return;
    w.leaving=true;time=(1-w.inside)*.8;keys.clear();audio.splash();
  }
  function reset(){
    w.body=w.toy=null;w.inside=0;w.leaving=false;keys.clear();
  }
  function look(dx,dy) {
    viewYaw-=dx*.0032;viewPitch=clamp(viewPitch-dy*.0018,-.28,.28);
  }
  function act(p, value) {
    if(!w.body||w.leaving)return;
    const data=w.toy,spec=interiors[w.body.kind];
    if(spec.dial){
      data.turn=clamp(value??p?.[0]??(data.turn>=.65?-.7:data.turn+.46),-1,1);
      dial.value=data.turn;
    }else if(p) {
      data.x=clamp(p[0],-.72,.72);data.y=clamp(p[1],-.39,.38);
    }else{
      const sites={4:[.12,-.23],1:[-.28,-.17],5:[.20,-.23]};
      [data.x,data.y]=sites[w.body.kind];
    }
    const first=data.power===0;
    data.power=clamp(first?.76:data.power+.13,0,1);
    data.at=s.t;
    if(first)discover(spec.note);
    if(s.t-spin>.16||first){
      if(spec.sound==='splash')audio.splash();else audio.play(spec.sound,w.body.id);
      spin=s.t;
    }
  }
  function paint(point,ink) {
    if(!w.toy||w.leaving)return;
    const drops=w.toy.drops;
    if(drops.length===5)drops.shift();
    drops.push([point[0],point[1],ink,s.t]);audio.play('drop',ink);
  }
  function tick(dt) {
    if(!w.body)return;
    const live=s.sceneBodies.find(b=>b.key===w.body.key);
    if(!live){reset();return;}
    w.body=live;
    time+=dt;
    const t=clamp(time/(w.leaving?.8:2),0,1);
    w.inside=w.leaving?1-smooth(t):smooth(t);
    if(w.leaving&&t===1){
      drift.attachRide(w.body,true,false);reset();return;
    }
    w.yaw+=(viewYaw-w.yaw)*(1-Math.exp(-dt*9));
    w.pitch+=(viewPitch-w.pitch)*(1-Math.exp(-dt*9));
    const down=fn=>Number(movement[fn].some(k=>keys.has(k)));
    const x=down('right')-down('left'),z=down('forward')-down('back');
    const speed=[...swift].some(k=>keys.has(k))?2.2:1.1;
    const dx=Math.cos(w.yaw)*x+Math.sin(w.yaw)*z,dz=-Math.sin(w.yaw)*x+Math.cos(w.yaw)*z;
    velocity[0]+=(dx*speed+drift.current[0]*2+.028-velocity[0])*Math.min(1,dt*4);
    velocity[1]+=(dz*speed+drift.current[1]*2-velocity[1])*Math.min(1,dt*4);
    w.offset[0]+=velocity[0]*dt;w.offset[1]+=velocity[1]*dt;
    const rise=Number(keys.has('Space'))-Number(keys.has('KeyC'));
    if(rise)viewPitch=clamp(viewPitch-dt*rise*.18,-.28,.28);
  }
  function controls(camera) {
    const inDrift=camera.mode==='drift'&&!camera.flying;
    const nearby=inDrift&&drift.near&&drift.nearestDistance<Math.max(1.55,drift.near.r*3.2);
    const riding=inDrift&&drift.ride;
    const candidate=w.body||riding||(nearby?drift.near:null);
    const active=!!w.body;
    const eligible=candidate&&interiors[candidate.kind]&&!candidate.creature;
    panel.hidden=!inDrift;
    ride.hidden=active;ride.disabled=!(riding||nearby);
    dive.hidden=active;dive.disabled=!riding||!eligible;
    exit.hidden=!active;action.hidden=!active;
    dial.hidden=!(active&&interiors[candidate.kind].dial);
    action.disabled=active&&(w.inside<.80||w.leaving);
    const command=riding?'Let go':'Ride';
    if(ride.textContent!==command)ride.textContent=command;
    if(active!==controlInside||candidate!==controlBody){
      const spec=eligible&&interiors[candidate.kind];
      title.textContent=candidate?.name??(nearby?drift.near.name:'');
      hint.textContent=active?spec.hint:'';
      action.textContent=active?spec.action:'';
      if(active&&spec.dial){dial.setAttribute('aria-label',spec.dial);dial.value=w.toy.turn;}
      if(riding?.creature)title.textContent=riding.name;
      controlInside=active;controlBody=candidate;
    }
    if(!active&&wasActive)hint.textContent='';
    wasActive=active;
  }
  ride.onclick=()=>{
    if(drift.ride)drift.releaseRide();else if(drift.near)drift.attachRide(drift.near,true);
  };
  dive.onclick=()=>enter(drift.ride);
  exit.onclick=leave;
  action.onclick=()=>act();
  dial.oninput=()=>act(null,dial.valueAsNumber);
  return Object.assign(w,{enter,leave,reset,look,act,paint,tick,controls,
    clearKeys(){keys.clear();},key(code,down){if(down)keys.add(code);else keys.delete(code);},
    gesture(p,dx,dy,lookOnly){
      if(!w.body)return;
      if(!lookOnly&&[2,3,4].includes(w.body.kind))act(p);
      else look(dx,dy);
    }});
}
