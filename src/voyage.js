import { clamp } from './system.js';

const deg = Math.PI / 180;
const mix = (a,b,t) => a+(b-a)*t;
const ease = x => {const t=clamp(x,0,1);return t*t*(3-2*t);};
const blend = (a,b,t) => a.map((v,i)=>mix(v,b[i],t));
const delta = (a,b) => a.map((v,i)=>v-b[i]);
const norm = a => Math.hypot(...a);
const angleTo = (a,b) => Math.atan2(Math.sin(b-a),Math.cos(b-a));
const at = b => [b.x,b.y,b.z];
const design = (move,subject,seconds,title,fact,options={}) => ({move,subject,seconds,title,fact,...options});
const wide = (seconds,title='First light',fact='The outer worlds take longer to orbit.',extra={}) => design('A','star',seconds,title,fact,extra);
const skim = (seconds,subject='star',extra={}) => design('B',subject,seconds,subject==='star'?'The sea of ink':subject,'Worlds gather in discs of gas and dust.',extra);
const rise = (seconds,extra={}) => design('G','star',seconds,'The whole system','One star lights all these worlds.',extra);
const facts = {Ember:'The closest world to this star.',Verdance:'Tilt changes how much sunlight reaches each hemisphere.',Tide:'The Moon’s gravity pulls on Earth’s oceans.',Aurelia:'Gas giants have no solid surface.',Vesper:'Some icy moons launch jets of water ice.'};
const hero = (name,seconds,extra={}) => design('C',name,seconds,name,facts[name],extra);
const reveal = (name,seconds) => design('D',name,seconds,'Sunrise at '+name,'A turning world carries its night side into daylight.');
const follow = (name,seconds,extra={}) => design('E',name,seconds,name,'A travelling wave runs down the swimmer’s fins.',extra);
const limb = (seconds,extra={}) => design('F','star',seconds,'The photosphere','Convection gives the Sun its grainy surface.',{nearSun:true,...extra});

export const directors = [
  {id:'endless',name:'Endless voyage',line:'Let the next world find you.',shots:[]},
  {id:'grand',name:'Grand Tour',line:'Five worlds along a single sea of ink.',shots:[
    wide(14),skim(14),hero('Ember',12),hero('Verdance',12),hero('Tide',14),hero('Aurelia',16),hero('Vesper',10),follow('Opal',12),rise(16)]},
  {id:'sun',name:'Sun Dive',line:'Follow the light to the edge of the star.',shots:[
    skim(14),reveal('Ember',10),limb(22),limb(10,{title:'Beyond the limb',fact:'Prominences arch above the solar surface.'}),rise(14)]},
  {id:'rings',name:'Ring Run',line:'A sunrise beyond Aurelia’s rings.',shots:[
    skim(12,'Aurelia'),hero('Aurelia',20),reveal('Aurelia',12),skim(14,'Aurelia',{title:'The cloud bands',fact:'Jupiter’s Great Red Spot is wider than Earth.',bands:true}),rise(12)]},
  {id:'life',name:'The Life of a Star',line:'From the young disc to the cooling remnant.',shots:[
    wide(24,'The young disc','Our solar system formed about 4.6 billion years ago.',{ages:[0,.44]}),
    skim(22,'star',{title:'Today',fact:'Our Sun is in its main-sequence life.',ages:[.48,1.35]}),
    limb(30,{title:'Red giant',fact:'The Sun will swell in about five billion years.',ages:[1.38,2.18]}),
    wide(25,'Planetary nebula','A hot bare core lights the gas shed by the star.',{ages:[2.23,3]}),
    hero('star',19,{title:'The bare core',fact:'The gas glows for a few tens of thousands of years.',ages:[3,3.19]}),
    rise(30,{title:'White dwarf',fact:'The remnant cools over billions of years.',ages:[3.22,4]})]},
  {id:'song',name:'Leviathan Song',line:'Travel alongside the swimmers of the ink sea.',shots:[
    follow('Opal',22),follow('Sable',20),follow('Cinder',16),rise(12)]},
  {id:'dark',name:'Into the Dark',line:'Circle the ink bending around the event horizon.',shots:[
    hero('hole',24,{title:'The event horizon',fact:'Light cannot escape from inside.'}),
    hero('hole',22,{title:'The accretion disc',fact:'The innermost gas is the hottest.'}),rise(14)]}
];
for (const route of directors) route.seconds=route.shots.reduce((n,shot)=>n+shot.seconds,0);
// Only cuts accepted by the rendered-frame audit enter the public programme.
export const voyages=directors.filter(route=>route.id==='sun');

export function subjectOf(s,name) {
  if(name==='star')return {x:0,y:0,z:0,r:s.life.starRadius};
  if(name==='hole')return s.blackHole.hole;
  return s.sceneBodies.find(b=>b.name===name) ?? s.creatures.rideables.find(b=>b.name===name);
}

// Camera and focus travel on the same rail in the subject's translating frame.
// The azimuth is fixed in inertial space at entry, so an orbit never adds
// its own angular velocity to a close pan.
function framing(s,shot,u,angle) {
  const b=subjectOf(s,shot.subject);
  if(!b)return null;
  const f=at(b), r=b.r, p=.34*u+.66*ease(u);
  let a=angle, distance, height=shot.lane??.18, lift=0, shift=-.31,inside=1;
  switch(shot.move){
    case 'A':
      a+=deg*27*p;distance=mix(18.7,18.0,p);height=mix(10.3,10.0,p);inside=0;
      break;
    case 'B':
      distance=shot.bands?mix(4.8,3.65,p)*r:mix(10.2,6.6,p);
      lift=-.084*distance;
      if(shot.bands){
        const crossing=ease((u*shot.seconds-3.7)/.88);
        height=mix(.18,1.35,crossing);
        lift=mix(-.02,.35,crossing)*r;
        distance=r*mix(4.9,2.36,p);
      }
      break;
    case 'C':
      a+=deg*74*p;distance=r*(6.25-1.05*Math.sin(Math.PI*p)-.20*p);
      if(shot.subject==='hole')height=1.35;
      if(shot.subject==='star'&&shot.ages){height=1.35;distance=Math.max(distance,1.0);}
      break;
    case 'D':
      a+=deg*35*p;distance=r*(6.1-.35*p);
      break;
    case 'E':
      a+=deg*51*p;distance=r*mix(7.5,6.9,p);height=shot.lane??1.35;lift=.035*distance;
      break;
    case 'F':
      a+=deg*43*p;distance=r*2.15;lift=r*(1.02-.14*s.life.red);shift=-.12;
      break;
    case 'G':
      a+=deg*9*p;distance=mix(7.5,18.0,ease(p/.67));
      height=mix(shot.lane??.18,10.4,ease((p-.53)/.47));shift=mix(-.31,0,ease(p));
      inside=1-ease((height-2.6)/4);
      break;
  }
  return {eye:[f[0]+distance*Math.cos(a),height,f[2]+distance*Math.sin(a)],
    aim:[f[0],f[1]+lift,f[2]],shift,inside,angle:a};
}

export function createVoyageFlight(s,initial,definition,onShot=()=>{},random=Math.random) {
  const endless=definition.id==='endless', shots=definition.shots.filter(x=>x.ages||subjectOf(s,x.subject)).map(x=>({...x}));
  for(const shot of shots){
    if(definition.id==='song'||definition.id==='dark')shot.lane=1.35;
    if(definition.id==='grand'&&shot.move==='E')shot.lane=.18;
    if(definition.id==='rings'&&shot.move==='G')shot.lane=1.35;
  }
  const missing=definition.seconds-shots.reduce((n,x)=>n+x.seconds,0);
  if(missing&&shots.length)for(const shot of shots)shot.seconds*=definition.seconds/(definition.seconds-missing);
  let index=0,time=0,elapsed=0,paused=false,finished=false,velocity=[0,0,0],yaw=0,pitch=0,lookAge=5,drag=false;
  const pose={...initial,position:[...initial.position],forward:[...initial.forward],bank:0};
  const angles=[];
  function extend(){
    const candidates=[skim(18),...s.sceneBodies.filter(b=>facts[b.name]).map(b=>hero(b.name,24))].filter(sh=>subjectOf(s,sh.subject)&&sh.subject!==shots.at(-1)?.subject);
    const pool=candidates.length?candidates:[wide(24,'The disc')];
    shots.push({...pool[Math.floor(random()*pool.length)]});
  }
  if(endless)extend();
  if(!shots.length)shots.push(rise(16));
  function reference(i){
    if(angles[i]!==undefined)return angles[i];
    const shot=shots[i],b=subjectOf(s,shot.subject);
    let previous=i?reference(i-1):Math.atan2(initial.position[2],initial.position[0]);
    if(i&&subjectOf(s,shots[i-1].subject))previous=framing(s,shots[i-1],1,previous).angle;
    let preferred=previous;
    if(b&&'CDB'.includes(shot.move)&&shot.subject!=='star')preferred=Math.atan2(b.z,b.x);
    if(b?.creature)preferred=Math.atan2(-b.vz,-b.vx);
    // Scout the line of sight at seven points before committing to the rail.
    // Test the incoming overlap as well as the move itself.
    const blockers=[subjectOf(s,'star'),...s.sceneBodies,...s.creatures.rideables].filter(o=>o&&
      !(shot.subject==='star'&&o.x===0&&o.z===0)&&o!==b);
    const last=i?framing(s,shots[i-1],1,reference(i-1)):null;
    let best=Infinity;
    for(let step=-12;step<=12;step++){
      const a=previous+step*10*deg;
      let cost=.65*Math.abs(angleTo(a,preferred))+(i?.9:0)*Math.abs(step*10*deg);
      for(let j=-3;j<=6;j++){
        if(j<0&&!last)continue;
        const u=Math.max(0,j/6),sample=framing(s,shot,u,a);
        if(!sample)continue;
        const seconds=u*shot.seconds, speed=b?.creature?1:.14*s.rate;
        const offset=[b?.vx||0,0,b?.vz||0].map(n=>n*seconds*speed);
        let eye=sample.eye.map((v,k)=>v+offset[k]),aim=sample.aim.map((v,k)=>v+offset[k]);
        if(j<0){const k=(j+4)/4;eye=blend(last.eye,eye,k);aim=blend(last.aim,aim,k);}
        const ray=delta(aim,eye),length2=ray.reduce((n,x)=>n+x*x,0);
        for(const ob of blockers){
          const scale=ob.creature?1:.14*s.rate;
          const pos=[ob.x+(ob.vx||0)*seconds*scale,ob.y,ob.z+(ob.vz||0)*seconds*scale];
          const v=delta(pos,eye),t=clamp(v.reduce((n,x,k)=>n+x*ray[k],0)/length2,0,1);
          const gap=norm(v.map((x,k)=>x-ray[k]*t))-ob.r*(ob.creature?1.6:1.16)-t*(b?.r??.3)*.85;
          cost+=Math.max(0,.35-gap)**2*42;
        }
      }
      if(cost<best){best=cost;angles[i]=a;}
    }
    return angles[i];
  }
  function open(i){
    index=i;time=0;if(endless&&i+1>=shots.length)extend();
    if(shots[i].ages)s.life.seek(shots[i].ages[0]);
    reference(i);onShot(shots[i],i);
  }
  function skip(n){const next=clamp(index+n,0,shots.length-1);if(next!==index)open(next);}
  function tick(dt){
    if(!paused&&!finished){
      elapsed+=dt;time+=dt;
      if(time>=shots[index].seconds-1e-8){
        const over=Math.max(0,time-shots[index].seconds);
        if(index+1<shots.length){open(index+1);time=over;}else {time=shots[index].seconds;finished=true;}
      }
    }
    let shot=shots[index];
    if(!subjectOf(s,shot.subject)&&index+1<shots.length){
      const remaining=shot.seconds-time;shots[index+1].seconds+=remaining;
      open(index+1);shot=shots[index];
    }
    let frame=framing(s,shot,clamp(time/shot.seconds,0,1),reference(index))??framing(s,rise(16),.5,reference(index));
    // Overlap the end and beginning of adjacent moves. Pull back during
    // transfers so both subjects can occupy the same establishing frame.
    const join=Math.min(3.6,shot.seconds*.25);
    const next=time>shot.seconds-join?index+1:time<join?index-1:-1;
    if(next>=0&&next<shots.length){
      const after=next>index, other=shots[next];
      const width=Math.min(join,other.seconds*.25);
      const u=after?clamp((time-shot.seconds+width)/(2*width),0,.5):clamp((time+width)/(2*width),.5,1);
      const adjacent=framing(s,other,after?0:1,reference(next));
      if(adjacent){
        const first=after?frame:adjacent,last=after?adjacent:frame,k=ease(u);
        const aim=blend(first.aim,last.aim,k),eye=blend(first.eye,last.eye,k);
        const separation=norm(delta(first.aim,last.aim)),retreat=separation*1.10*(Math.sin(Math.PI*u)**2);
        const azimuth=first.angle+angleTo(first.angle,last.angle)*k;
        eye[0]+=Math.cos(azimuth)*retreat;eye[2]+=Math.sin(azimuth)*retreat;
        if((shot.move==='A'||other.move==='A')&&Math.min(first.eye[1],last.eye[1])<2.6){
          const far=Math.hypot(eye[0],eye[2]);
          eye[1]=mix(Math.min(first.eye[1],last.eye[1]),Math.max(first.eye[1],last.eye[1]),ease((far-15.88)/1.9));
        }
        frame={eye,aim,inside:mix(first.inside,last.inside,k),shift:mix(first.shift,last.shift,k)};
      }
    }
    if(dt>0)velocity=delta(frame.eye,pose.position).map(v=>v/dt);
    const view=delta(frame.aim,frame.eye),h=Math.hypot(view[0],view[2]);
    if(!drag&&(lookAge+=dt)>3){const decay=Math.exp(-1.3*dt);yaw*=decay;pitch*=decay;}
    const azimuth=Math.atan2(view[0],view[2])+yaw,tilt=clamp(Math.atan2(view[1],h)+pitch,-1.54,1.54);
    pose.position=frame.eye;pose.forward=[Math.sin(azimuth)*Math.cos(tilt),Math.sin(tilt),Math.cos(azimuth)*Math.cos(tilt)];
    pose.inside=frame.inside;pose.shift=frame.shift;
    return pose;
  }
  open(0);tick(0);
  return {pose,definition,tick,skip,
    updateAge(dt){const sh=shots[index];if(sh.ages&&!paused)s.life.seek(mix(...sh.ages,ease((time+dt)/sh.seconds)));},
    look(dx,dy){yaw-=dx*.0027;pitch=clamp(pitch-dy*.0027,-1,1);drag=true;},
    endLook(){drag=false;lookAge=0;},toggle(){paused=!paused;},
    get shot(){return shots[index];},get index(){return index;},get elapsed(){return elapsed;},
    get shotTime(){return time;},get seconds(){return shots.map(x=>x.seconds);},
    get paused(){return paused;},get finished(){return finished;},get velocity(){return velocity;}
  };
}
