import { clamp } from './system.js';

const radians = Math.PI / 180;
const add = (a,b) => a.map((x,i)=>x+b[i]);
const sub = (a,b) => a.map((x,i)=>x-b[i]);
const mul = (a,k) => a.map(x=>x*k);
const blend = (a,b,k) => a.map((x,i)=>x+(b[i]-x)*k);
const dot = (a,b) => a.reduce((sum,x,i)=>sum+x*b[i],0);
const length = a => Math.hypot(...a);
const unit = (a,fallback=[0,0,-1]) => length(a)>.00001?mul(a,1/length(a)):fallback;
const smooth = k => { k=clamp(k,0,1);return k*k*(3-2*k); };
const poseOf = b => [b.x,b.y,b.z];
const sight = (a,b) => unit(sub(b,a));
const kinds = {Ember:1,Verdance:2,Tide:3,Aurelia:4,Vesper:5};

function turnToward(a,b,limit) {
  const d=clamp(dot(a,b),-1,1), angle=Math.acos(d);
  if(angle<limit||angle<.000001)return b;
  const across=unit(sub(b,mul(a,d)),unit([a[2],0,-a[0]],[1,0,0]));
  return add(mul(a,Math.cos(limit)),mul(across,Math.sin(limit)));
}

const shot = (seconds,caption,points,options={}) => ({seconds,caption,points,...options});
const world = (seconds,name,fact,points) =>
  shot(seconds,'Approaching '+name+' · '+fact,points,{subject:name,lead:.7});

// Subject coordinates are angle from the outward radial (or the swimmer's
// heading), distance in radii, and elevation in radii. Other waypoints are
// positions in the current system's disc coordinates.
export const voyages = [
  {id:'grand',name:'Grand Tour',shots:[
    shot(13,'The whole system · outer worlds take longer to orbit',[[4,9.3,16.5],[7.7,7.4,13.1]],{outside:true}),
    shot(15,'Over the sea of ink · new worlds gather in discs like this',[[6.4,1.55,8.7],[1.85,.33,4.55]],{travel:.3}),
    world(12,'Ember','the closest world to the star',[[1.9,6.4,3.5],[2.25,4.3,1.4],[3.57,4.9,2.5]]),
    world(12,'Verdance','tilt changes how much sunlight reaches each hemisphere',[[2.88,6.4,1.45],[2.25,4.4,1.06],[1.68,4.9,1.65]]),
    world(12,'Tide','the Moon’s gravity pulls on Earth’s oceans',[[2.4,6.8,1.62],[2.05,4.0,.83],[1.52,4.8,1.25]]),
    world(12,'Aurelia','gas giants have no solid surface',[[2.7,5.8,2.2],[2.02,3.65,1.12],[1.42,4.6,1.4]]),
    world(12,'Vesper','some icy moons launch jets of water ice',[[2.73,6.7,1.8],[2.18,4.2,1.2],[1.45,5.4,1.6]]),
    shot(14,'Into a marble cloud · the ink folds into smaller and smaller curls',[[6.3,.64,3.1],[4.95,1.36,3.3],[4.6,3.4,4.8]],{travel:.65}),
    shot(18,'Sunrise over the disc · the star lights the worlds from one side',[[2.6,2.2,10.8],[-1.4,4.0,14.3],[-5.5,7.5,16.3]],{outside:true,aim:[.8,.25,0]}),
  ]},
  {id:'sun',name:'Sun Dive',shots:[
    shot(22,'Spiral toward the star · its surface is called the photosphere',[[4.5,4.1,8.5],[4.1,1.3,4.6],[2.7,.35,2.75]]),
    shot(16,'Under the prominence · a flare can send material toward a world',[[1.00,2.8,.37],[1.42,1.52,.26],[1.91,1.49,.18]],{subject:'star',nearSun:true,travel:.25}),
    shot(16,'Skimming the photosphere · its grain comes from convection',[[2.28,1.44,.15],[2.76,1.40,.38],[3.33,1.55,.48]],{subject:'star',nearSun:true,travel:.35}),
    shot(16,'Outward from the limb · the star supplies the light in this system',[[-2.65,1.4,-1.75],[-3.65,1.84,-3.6],[-6.4,2.9,-5.2]],{travel:.13}),
  ]},
  {id:'rings',name:'Ring Run',shots:[
    world(20,'Aurelia','the ringed giant',[[1.60,8.4,3.3],[1.53,5.6,1.8],[1.42,3.8,1.15]]),
    shot(15,'Through the rings · tides can pull a small body into a ring',[[1.08,2.92,.99],[.59,2.3,-.14],[.04,2.52,-.72]],{subject:'Aurelia',travel:.24}),
    shot(18,'Around the night side · sunrise returns as a world turns',[[.42,2.13,-.92],[1.60,1.94,-.34],[2.60,1.78,.27]],{subject:'Aurelia',travel:.18}),
    shot(17,'Aurelia’s cloud bands · Jupiter’s Great Red Spot is wider than Earth',[[2.92,1.43,.32],[3.81,1.46,.54],[4.38,3.25,1.46]],{subject:'Aurelia',bands:true,travel:.28}),
  ]},
  {id:'song',name:'Leviathan Song',shots:[
    shot(22,'Looking for a leviathan · the ink swimmers live in a fairy tale',[[1.48,5.7,2.20],[1.42,4.2,.85],[1.36,3.05,.49]],{subject:'swimmer'}),
    shot(15,'Alongside a leviathan · a slow wave travels down its fins',[[1.28,2.65,.36],[1.55,2.31,.16],[1.88,2.47,-.62]],{subject:'swimmer'}),
    shot(15,'Beneath the swimmer · its fins stir the ink behind it',[[2.15,2.31,-.95],[2.92,1.58,-1.54],[3.64,2.16,-1.05]],{subject:'swimmer'}),
    shot(18,'At the sheet’s edge · a breach leaves a circle in the ink',[[3.92,2.47,-.46],[4.57,2.56,.38],[4.84,5.12,1.73]],{subject:'swimmer',travel:.26}),
  ]},
  {id:'life',name:'The Life of a Star',shots:[
    shot(23,'The young disc · 4.6 billion years ago',[[5.9,6.9,12.8],[8.3,4.8,9.1]],{ages:[0,.21],outside:true}),
    shot(27,'Today · our Sun is in its main-sequence life',[[8.5,1.42,5.6],[6.2,.35,3.6],[5.1,.47,2.52]],{ages:[.21,1],aim:[0,.12,0]}),
    shot(33,'Red giant · the Sun will swell in about 5 billion years',[[4.9,1.0,2.55],[5.0,1.7,.1],[5.2,1.2,-2.9]],{ages:[1,2.01],travel:.1}),
    shot(22,'The star sheds its outer layers · a hot bare core lights the gas',[[6.8,2.42,-4.65],[7.0,3.21,-6.3],[5.7,2.4,-6.4]],{ages:[2.01,3],aim:[0,.5,0]}),
    shot(28,'Through the nebula · the gas glows for a few tens of thousands of years',[[4.2,1.78,-4.65],[2.1,.64,-2.85],[.3,-.18,-1.65],[-1.35,.35,-.90]],{ages:[3,3.12],travel:.27}),
    shot(17,'White dwarf · the remnant cools over billions of years',[[-1.5,.48,-.56],[-2.65,1.03,.35],[-4.8,1.87,2.4]],{ages:[3.12,4]}),
  ]},
  {id:'dark',name:'Into the Dark',shots:[
    shot(22,'A wide orbit · the gravity of the black hole bends light',[[1.16,12.9,5.1],[1.74,9.8,2.7],[2.12,7.4,.98]],{subject:'hole'}),
    shot(20,'Over the accretion disc · the inner gas is the hottest',[[2.62,5.8,.68],[3.18,4.15,.87],[3.96,5.0,1.32]],{subject:'hole'}),
    shot(18,'Away from the horizon · light cannot escape from inside',[[4.59,7.18,1.63],[5.31,11.9,2.48],[5.92,19,5.4]],{subject:'hole',travel:.35}),
  ]},
  {id:'endless',name:'Endless voyage',shots:[]},
];
for(const voyage of voyages)voyage.seconds=voyage.shots.reduce((sum,x)=>sum+x.seconds,0);

function target(s,name) {
  if(name==='star')return {x:0,y:0,z:0,r:s.life.starRadius};
  if(name==='hole')return s.blackHole.hole;
  if(name==='swimmer')return s.creatures.rideables[0];
  return s.sceneBodies.find(b=>b.name===name||b.kind===kinds[name]);
}

function predict(s,b,seconds) {
  const {x,y,z,vx=0,vz=0}=b;
  if(b===s.blackHole.hole||b.creature||b.held||b.launched>=0){
    const t=b.held?0:clamp(seconds,-.5,2.4);
    return [x+t*vx,y,z+t*vz];
  }
  const d=x*x+z*z;
  if(d<.04||s.paused)return [x,y,z];
  const turn=(x*vz-z*vx)*s.rate*seconds/d, c=Math.cos(turn),n=Math.sin(turn);
  return [x*c-z*n,y,z*c+x*n];
}

function waypoint(s,spec,p,t,frame,fallback) {
  if(!spec.subject)return p;
  const b=target(s,spec.subject);
  if(!b)return fallback;
  const center=predict(s,b,t);
  const angle=(Number.isFinite(frame)?frame:spec.subject==='star'?0:
    b.creature?Math.atan2(b.vz,b.vx):Math.atan2(center[2],center[0]))+p[0];
  const r=b.r;
  return [center[0]+Math.cos(angle)*p[1]*r,center[1]+p[2]*r,center[2]+Math.sin(angle)*p[1]*r];
}

function spline(points,startVelocity,time,seconds) {
  const section=seconds/(points.length-1);
  const u=clamp(time/section,0,points.length-1),i=Math.min(points.length-2,Math.floor(u)),f=u-i;
  const a=points[i],b=points[i+1],last=points.length-1;
  const tangent=j=>{
    if(j===0)return mul(startVelocity,section*.77);
    const v=sub(points[Math.min(last,j+1)],points[j-1]);
    return mul(v,j===last?.88:.46);
  };
  if(time>seconds)return add(points[last],mul(tangent(last),(time-seconds)/section));
  const f2=f*f,f3=f2*f;
  return add(blend(a,b,f2*(3-2*f)),add(mul(tangent(i),f3-2*f2+f),mul(tangent(i+1),f3-f2)));
}

export function voyageObstacles(s) {
  const hole=s.blackHole.hole;
  const sun={x:0,y:0,z:0,r:s.life.starRadius*(1-.5*(s.blackHole.dim??0))};
  return [sun,...s.sceneBodies,...s.creatures.rideables,...(hole?[hole]:[])];
}

// The swimmers are drawn with long streamers. Give the probe clearance
// around their whole deforming mesh without tightening their physical ride.
export const voyageRadius = b => b.creature?1.63*b.r:b.r;

function avoid(s,position,direction,speed,bodies) {
  let desired=direction;
  for(const b of bodies){
    const vel=mul(sub(predict(s,b,.32),poseOf(b)),1/.32);
    const approach=sub(mul(direction,speed),vel), delta=sub(position,poseOf(b));
    const closest=clamp(-dot(delta,approach)/Math.max(.03,dot(approach,approach)),0,3.65);
    const gap=add(delta,mul(approach,closest)), radius=voyageRadius(b);
    const limit=radius*(b.creature?1.27:1.30)+.05;
    const margin=limit+Math.max(.26,speed*.67);
    if(length(gap)>margin)continue;
    const steer=sub(gap,mul(direction,dot(gap,direction)));
    const vertical=[0,position[1]<b.y-.24?-1:1,0];
    const away=unit(add(steer,mul(vertical,Math.max(.18,limit*.38))));
    const amount=smooth((margin-length(gap))/Math.max(.15,margin-limit*.81));
    desired=unit(add(desired,mul(away,amount*2.15)));
    if(length(delta)<limit+.07&&dot(desired,delta)<0)
      desired=unit(add(desired,mul(unit(delta),1.50)));
  }
  return desired;
}

export function createVoyageFlight(s,initial,definition,onShot=()=>{},random=Math.random) {
  const pose={position:[...initial.position],forward:[...initial.forward],
    inside:initial.inside,shift:initial.shift??0,bank:initial.bank??0};
  let course=unit(initial.velocity??[0,0,0],pose.forward), speed=clamp(length(initial.velocity??[0,0,0]),.34,2.35);
  let index=0,shotTime=0,elapsed=0,paused=false,finished=false,from,entryVelocity,frame,fallback,spec;
  let yaw=0,pitch=0,dragAge=10,dragging=false,planned=[...pose.forward],bag=[];
  const infinite=definition.id==='endless';
  const history=[];

  function fillBag() {
    bag=voyages.flatMap(v=>{
      if(v.id==='dark'&&!s.blackHole.hole)return [];
      if(v.id==='song'&&!s.creatures.rideables.length)return [];
      if(v.id==='life')return [v.shots[[0,1,2,4,5][s.life.chapter]]];
      if(v.id==='endless')return [];
      return v.shots;
    }).map(value=>({value,key:random()})).sort((a,b)=>a.key-b.key).map(x=>x.value);
  }
  function endlessShot(at) {
    if(at<history.length)return history[at];
    if(!bag.length)fillBag();
    let next=bag.shift();
    if(next===history.at(-1)&&bag.length){bag.push(next);next=bag.shift();}
    if(next.ages)next={...next,ages:null};
    history.push(next);
    return next;
  }
  function open(at,first=false) {
    index=at;shotTime=0;
    spec=infinite?endlessShot(at):definition.shots[at];
    from=[...pose.position];entryVelocity=mul(course,speed);
    const b=target(s,spec.subject);
    frame=NaN;
    if(b&&spec.subject==='hole')frame=Math.atan2(-b.z,-b.x);
    if(b&&definition.id==='grand'){
      const approach=predict(s,b,spec.seconds*.45);
      frame=Math.atan2(from[2]-approach[2],from[0]-approach[0])-spec.points[0][0];
    }
    fallback=b?poseOf(b):[3.7,1.3,5.3];
    if(b)fallback=add(fallback,[2.5,1.25,2.0]);
    if(first&&definition.id==='life')s.life.seek(spec.ages[0]);
    onShot(spec,index);
  }
  open(0,true);
  function skip(offset) {
    const last=infinite?Infinity:definition.shots.length-1;
    const next=clamp(index+offset,0,last);
    if(index!==next)open(next);
  }
  function updateAge(dt) {
    if(spec.ages&&!paused&&dt){
      const [a,b]=spec.ages;
      const age=a+(b-a)*smooth((shotTime+dt)/spec.seconds);
      if(age!==s.life.value)s.life.seek(age);
    }
  }
  function tick(dt) {
    dragAge+=dt;
    if(!dragging&&dragAge>3){
      const settle=Math.exp(-dt*.9);
      yaw*=settle;pitch*=settle;
    }
    if(!paused&&!finished){
      const b=target(s,spec.subject);
      const knots=[from,...spec.points.map((p,i)=>waypoint(s,spec,p,(i+1)*spec.seconds/spec.points.length-shotTime,frame,fallback))];
      const lead=1.68;
      const guide=spline(knots,entryVelocity,shotTime+lead,spec.seconds);
      const local=spline(knots,entryVelocity,shotTime,spec.seconds);
      const later=spline(knots,entryVelocity,shotTime+lead+.60,spec.seconds);
      const planSpeed=length(sub(later,guide))/.60;
      const ahead=sub(guide,pose.position), gap=length(ahead);
      const bodies=voyageObstacles(s);
      const desired=avoid(s,pose.position,unit(ahead,course),speed,bodies);
      const nextCourse=turnToward(course,desired,dt*.415);
      const rate=Math.exp(dt*.237);
      const agreement=smooth((dot(course,desired)+.72)/1.72);
      const catchUp=Math.min(.52,.18*length(sub(local,pose.position)));
      const targetSpeed=clamp(Math.min(gap/lead,planSpeed+catchUp)*(.28+.72*agreement),.13,1.86);
      speed=clamp(targetSpeed,speed/rate,speed*rate);
      const next=add(pose.position,mul(nextCourse,speed*dt));
      for(const body of bodies){
        const delta=sub(next,poseOf(body)), safe=voyageRadius(body)*1.205;
        if(length(delta)<safe){
          const edge=add(poseOf(body),mul(unit(delta),safe));
          next.splice(0,3,...edge);
        }
      }
      const rolling=(course[0]*nextCourse[2]-course[2]*nextCourse[0])/Math.max(dt,.001);
      const bank=clamp(-rolling*.23,-7.5*radians,7.5*radians);
      pose.bank+=(bank-pose.bank)*(1-Math.exp(-dt*1.6));
      course=nextCourse;pose.position=next;

      const focus=b?predict(s,b,spec.lead??.34):(spec.aim??[0,.08,0]);
      const subjectDirection=sight(next,focus);
      const opening=smooth(shotTime/3.9),closing=smooth((shotTime-(spec.seconds-4))/4);
      const travel=spec.travel??.10;
      const closingLook=spec.outside?.04:.19;
      const watch=spec.subject?(.85+.15*opening)-.22*closing:.99-closingLook*closing;
      const backlit=dot(course,subjectDirection)<-.89&&travel>.22;
      const amount=clamp(watch*(1-travel*.58)+(backlit?.11:0),.05,.995);
      const intended=unit(blend(course,subjectDirection,amount));
      planned=turnToward(planned,intended,dt*21.6*radians);
      const inside=spec.outside?0:1-smooth((Math.abs(next[1])-2.25)/3.7);
      pose.inside+=(inside-pose.inside)*(1-Math.exp(-dt*.54));
      pose.shift*=Math.exp(-dt*.68);
      elapsed+=dt;shotTime+=dt;
      if(shotTime+1e-7>=spec.seconds){
        if(!infinite&&index===definition.shots.length-1)finished=true;
        else open(index+1);
      }
    }
    const cy=Math.cos(yaw),sy=Math.sin(yaw);
    const swivel=[planned[0]*cy+planned[2]*sy,planned[1],planned[2]*cy-planned[0]*sy];
    const up=clamp(Math.asin(swivel[1])+pitch,-1.49,1.49), h=unit([swivel[0],0,swivel[2]]);
    const view=[h[0]*Math.cos(up),Math.sin(up),h[2]*Math.cos(up)];
    pose.forward=dragging?view:turnToward(pose.forward,view,dt*23.5*radians);
    return pose;
  }
  return {
    pose,definition,updateAge,tick,skip,
    look(dx,dy){yaw=clamp(yaw-dx*.0027,-1.8,1.8);pitch=clamp(pitch-dy*.0027,-1.05,1.05);dragAge=0;dragging=true;},
    endLook(){dragAge=0;dragging=false;},toggle(){paused=!paused;},
    get paused(){return paused;},get finished(){return finished;},get index(){return index;},
    get elapsed(){return elapsed;},get shotTime(){return shotTime;},get shot(){return spec;},
    get velocity(){return mul(course,speed);},
  };
}
