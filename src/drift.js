import {clamp} from './system.js';

// Sheet and cloud IDs are also the IDs in the one-pixel picking buffer.
export const sheetHeights = [-2.15, -.83, -.32, .68, 2.05];
const TAU = 2 * Math.PI;
const mix = (a,b,t) => a+(b-a)*t;
const unit = a => {const d=Math.hypot(...a)||1; return a.map(x=>x/d);};
const toward = (a,b) => unit(b.map((n,i)=>n-a[i]));
const angleDifference = (a,b) => Math.atan2(Math.sin(a-b),Math.cos(a-b));
const ease = (dt,rate) => 1-Math.exp(-dt*rate);

function islands() {
  let seed=19343;
  const rand=()=> (seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
  const result=[];
  for(let i=0;i<44;i++){
    const angle=TAU*(i*.618034+rand()*.11), distance=3.8+rand()*10.9;
    const width=.12+1.17*rand()**1.5;
    result.push({id:i+6, pos:[Math.cos(angle)*distance,(rand()-.5)*3.3,Math.sin(angle)*distance],
      size:[width,width*(.18+.25*rand()),width*(.65+.83*rand())],
      ink:[5,3,4,2,0,6][i%6],seed:rand()*13});
  }
  // Low, navigable landmarks on the inner edge of the ice giant's orbit.
  Object.assign(result[0],{pos:[1.95,.30,-3.12],size:[.84,.36,.57],ink:3});
  Object.assign(result[1],{pos:[-2.48,.64,2.53],size:[.98,.42,.72],ink:4});
  // Rounded gold islands sit in the open space between the paper-thin sheets.
  for(const cloud of result.filter(b=>b.ink===6)){
    const y=cloud.pos[1];
    cloud.pos[1]=y<-.52?-1.48:y>.47?1.36:.18;
    const radius=Math.min(cloud.size[0],1.04);
    cloud.size=[radius,.45*radius,Math.min(cloud.size[2],radius*1.22)];
  }
  Object.assign(result[41],{pos:[-2.81,.095,4.13],size:[.57,.34,.58]});
  return result;
}
export const clouds=islands();
export const activeClouds=low=>low?30:clouds.length;

function dawnAngle(s,planet){
  if(!planet)return -.85;
  const phase=Math.atan2(planet.z,planet.x),sign=Math.sign(planet.x*planet.vz-planet.z*planet.vx)||1;
  const objects=clouds.slice(0,activeClouds(s.low)).map(b=>[b.pos,b.size]);
  for(const b of (s.sceneBodies??s.bodies))objects.push([[b.x+2*b.vx,b.y,b.z+2*b.vz],[b.r,b.r,b.r]]);
  let best=phase,minimum=Infinity;
  // Reserve an open sightline to the photosphere, even after the orbits evolve.
  for(const offset of [-.13,-.33,.52,-.60,.78,-.97,1.22,-1.58,2.22]){
    const angle=phase+offset*sign,eye=[5.55*Math.cos(angle),.16,5.55*Math.sin(angle)];
    let cost=Math.abs(offset)*.24;
    for(const [pos,size] of objects){
      const t=clamp(1-pos.reduce((v,k,i)=>v+k*eye[i],0)/30.83,0,1);
      const clearance=Math.hypot(...eye.map((n,i)=>(n*(1-t)-pos[i])/(size[i]*1.15+.72*t)));
      cost+=Math.max(0,1.52-clearance)**2*12;
    }
    if(cost<minimum){minimum=cost;best=angle;}
  }
  return best;
}

// Same radial surface as the cloud mesh. The outer wall and the inner folds
// share this coordinate so a crossing can be observed on either GPU preset.
export function cloudRadius(n,seed) {
  return 1+.105*Math.sin(n[0]*4+n[2]*3+seed)*Math.cos(n[1]*3-seed)
    +.065*Math.sin(n[2]*6-n[0]*2+seed*.7);
}
function cloudDistance(p,c) {
  const q=p.map((v,i)=>(v-c.pos[i])/c.size[i]);
  return Math.hypot(...q)/cloudRadius(unit(q),c.seed);
}
function spline(p0,p1,p2,p3,t) {
  const t2=t*t,t3=t2*t;
  return p1.map((v,i)=>.5*(2*v+(-p0[i]+p2[i])*t+
    (2*p0[i]-5*v+4*p2[i]-p3[i])*t2+(-p0[i]+3*v-3*p2[i]+p3[i])*t3));
}

export function createDrift(s,onMoment) {
  const keys=new Set();
  const d={position:[0,0,5.55],forward:[0,0,-1],velocity:[0,0,0],current:[0,0],
    yaw:0,pitch:0,ride:null,auto:false,cloud:null,heat:0,ripples:[],lastInput:0,
    hintUntil:0,near:null,nearestDistance:Infinity,crossedAt:-10,crossedInk:3};
  let lookYaw=0,lookPitch=0,rideAngle=0,ridePan=[0,0],autoTime=0,route,oldY=0;
  let currentPass=null,lastSplash=-10,nearSun=false,rideEntry=0,rideStart;
  const eye=d.position;
  const setLook=v=>{lookYaw=Math.atan2(-v[0],-v[2]);lookPitch=Math.asin(clamp(v[1],-1,1));};
  function activity(hide=true) {
    d.lastInput=s.t;d.auto=false;
    if(hide)d.hintUntil=0;
  }
  function enter(point) {
    const bodies=s.sceneBodies??s.bodies,b=bodies.find(b=>b.kind===3)??bodies[0];
    // Arrive on the trailing side. The planet continues along its orbit during the dive.
    const angle=dawnAngle(s,b);
    eye.splice(0,3,...(point?[point[0],.16,point[1]]:[5.55*Math.cos(angle),.16,5.55*Math.sin(angle)]));
    const r=Math.hypot(eye[0],eye[2]);
    if(r<1.7){eye[0]=1.7*Math.cos(angle);eye[2]=1.7*Math.sin(angle);}
    setLook(toward(eye,[0,.10,0]));lookYaw+=.087;
    d.yaw=lookYaw;d.pitch=lookPitch;d.velocity.fill(0);d.current.fill(0);
    keys.clear();d.ride=null;d.cloud=null;d.heat=0;nearSun=false;currentPass=null;
    oldY=eye[1];activity(false);d.hintUntil=s.t+8;d.lastInput=s.t+2;
    updateDirection();
  }
  function leave(){keys.clear();d.ride=null;d.auto=false;d.heat=0;d.hintUntil=0;}
  function look(dx,dy) {
    activity();
    if(d.ride){ridePan[0]-=dx*.0028;ridePan[1]=clamp(ridePan[1]-dy*.0028,-1.25,1.25);}
    else {lookYaw-=dx*.0028;lookPitch=clamp(lookPitch-dy*.0028,-Math.PI*4/9,Math.PI*4/9);}
  }
  function key(code,down) {
    if(down){activity();keys.add(code);}else keys.delete(code);
    if(code==='KeyF'&&!down&&d.ride){d.velocity=[d.ride.vx*.55,0,d.ride.vz*.55];d.ride=null;activity();}
  }
  function updateDirection() {
    const cp=Math.cos(d.pitch);
    d.forward=[-Math.sin(d.yaw)*cp,Math.sin(d.pitch),-Math.cos(d.yaw)*cp];
  }
  function ripple(id,point,ink,crossing=false) {
    if(d.ripples.length===12)d.ripples.shift();
    d.ripples.push({id,point,ink,at:s.t,crossing});
    if(crossing){d.crossedAt=s.t;d.crossedInk=ink;}
  }
  function nearest() {
    let candidate=null,dist=Infinity;
    for(const b of (s.sceneBodies??s.bodies)){
      const delta=Math.hypot(eye[0]-b.x,eye[1]-b.y,eye[2]-b.z)-b.r;
      if(delta<dist){candidate=b;dist=delta;}
    }
    d.near=candidate;d.nearestDistance=dist;
  }
  function scenic(dt) {
    if(!d.auto){
      d.auto=true;autoTime=0;
      const planet=d.near, start=[...eye];
      const island=clouds.slice(0,activeClouds(s.low)).reduce((a,b)=>
        Math.hypot(...b.pos.map((v,i)=>v-start[i]))<Math.hypot(...a.pos.map((v,i)=>v-start[i]))?b:a);
      const rad=unit([island.pos[0],0,island.pos[2]]),side=[-rad[2],0,rad[0]];
      route={start,planet,island,gate:[rad[0]*2.35+side[0]*.65,.33,rad[2]*2.35+side[2]*.65],
        sky:[rad[0]*4+side[0]*2.8,1.14,rad[2]*4+side[2]*2.8]};
    }
    autoTime+=dt;
    const b=route.planet,rad=b?unit([b.x,0,b.z]):[0,0,1];
    const pass=b&&(s.sceneBodies??s.bodies).includes(b)?[b.x+rad[0]*b.r*2.7,b.y+b.r*.9,b.z+rad[2]*b.r*2.7]:route.start;
    const pts=[route.start,pass,route.island.pos,route.gate,route.sky],stage=autoTime/7;
    const i=Math.floor(stage)%pts.length,u=stage%1;
    const p=spline(pts[(i+4)%5],pts[i],pts[(i+1)%5],pts[(i+2)%5],u);
    for(let j=0;j<3;j++)eye[j]=mix(eye[j],p[j],ease(dt,3));
    const sights=[b?[b.x,b.y,b.z]:route.gate,route.island.pos,[0,.12,0],[0,.58,0],pass];
    const v=toward(eye,sights[i]),next=toward(eye,sights[(i+1)%5]);
    const blend=clamp((u-.62)/.38,0,1);
    setLook(unit(v.map((n,j)=>mix(n,next[j],blend*blend*(3-2*blend)))));
  }
  function ride(dt) {
    const b=d.ride,rad=unit([b.x,0,b.z]),side=[-rad[2],0,rad[0]];
    rideAngle+=dt*.21;
    const a=rideAngle,offset=rad.map((x,i)=>x*Math.cos(a)+
      (side[i]*.34+(i===1?.94:0))*Math.sin(a));
    const center=[b.x,b.y,b.z],dest=center.map((v,i)=>v+offset[i]*b.r*1.66);
    const f=clamp((s.t-rideEntry)/.88,0,1),k=f*f*(3-2*f);
    for(let i=0;i<3;i++)eye[i]=mix(rideStart[i],dest[i],k);
    const star=toward(eye,[0,0,0]),ground=toward(eye,center);
    // At conjunction the eye follows a point just above the day/night limb.
    const horizon=rad.map((x,i)=>-x*.83+side[i]*.50+(i===1?-.19:0));
    const weight=clamp((Math.cos(a)+.10)*1.3,0,1);
    setLook(unit(star.map((n,i)=>weight*(n*.80+ground[i]*.20)+(1-weight)*(ground[i]*.72+horizon[i]*.28))));
    lookYaw+=ridePan[0];lookPitch=clamp(lookPitch+ridePan[1],-Math.PI*4/9,Math.PI*4/9);
  }
  function free(dt) {
    const down=(...codes)=>Number(codes.some(c=>keys.has(c)));
    const f=down('KeyW','ArrowUp')-down('KeyS','ArrowDown'),
      h=down('KeyD','ArrowRight')-down('KeyA','ArrowLeft'),v=down('Space')-down('KeyC');
    const speed=down('ShiftLeft','ShiftRight')?2.85:1.02;
    const right=[Math.cos(d.yaw),0,-Math.sin(d.yaw)];
    const move=d.forward.map((n,i)=>f*n+h*right[i]+(i===1?v:0));
    const norm=Math.max(1,Math.hypot(...move)),r=Math.hypot(eye[0],eye[2])||1;
    const current=[clamp(d.current[0]*8,-.23,.23)-eye[2]/r*.037,.012*Math.sin(s.t*.62+eye[0]),clamp(d.current[1]*8,-.23,.23)+eye[0]/r*.037];
    const b=d.near;
    if(b&&d.nearestDistance<1.8){
      const dx=eye[0]-b.x,dz=eye[2]-b.z,weight=.18*Math.exp(-Math.max(0,d.nearestDistance)*1.9);
      current[0]+=weight*(b.vx-dz);current[2]+=weight*(b.vz+dx);
      current[1]+=weight*.35*Math.sin(s.t+b.key);
    }
    for(let i=0;i<3;i++){d.velocity[i]=mix(d.velocity[i],move[i]*speed/norm+current[i],ease(dt,3.6));eye[i]+=d.velocity[i]*dt;}
  }
  function soften(center,radius,dt,sun) {
    const diff=eye.map((v,i)=>v-center[i]),dist=Math.hypot(...diff)||.001;
    if(dist>=radius)return;
    const n=unit(diff),push=(radius-dist)*(sun?5:9)*dt;
    for(let i=0;i<3;i++)eye[i]=center[i]+n[i]*Math.max(radius*(sun?.83:.89),dist+push);
    const inward=Math.min(0,d.velocity.reduce((a,v,i)=>a+v*n[i],0));
    for(let i=0;i<3;i++)d.velocity[i]-=n[i]*inward;
    if(sun&&!d.ride&&!d.auto&&dist<1.54&&d.forward.reduce((a,v,i)=>a+v*n[i],0)<-.2)
      lookYaw+=dt*1.35*(Math.sin(lookYaw-Math.atan2(-n[0],-n[2]))<0?-1:1);
  }
  function tick(dt,flying) {
    nearest();
    if(flying){oldY=eye[1];return;}
    if(keys.size)d.lastInput=s.t;
    if(d.ride&&!(s.sceneBodies??s.bodies).includes(d.ride))d.ride=(s.sceneBodies??s.bodies).find(b=>b.key===d.ride.key)??null;
    if(keys.has('KeyF')&&!d.ride&&d.near&&d.nearestDistance<Math.max(1.55,d.near.r*3.2)){
      d.ride=d.near;rideAngle=.80;ridePan=[0,0];rideStart=[...eye];rideEntry=s.t;
      onMoment('ride',d.ride);
    }
    if(d.ride)ride(dt);else if(s.t-d.lastInput>=8)scenic(dt);else free(dt);
    const star=s.life?.starRadius??1;soften([0,0,0],star+.70,dt,true);
    if(d.near&&!d.ride)soften([d.near.x,d.near.y,d.near.z],d.near.r*1.23,dt,false);
    const r=Math.hypot(eye[0],eye[2]);
    if(r>14.8){eye[0]*=14.8/r;eye[2]*=14.8/r;}
    eye[1]=clamp(eye[1],-3.3,3.4);
    d.yaw+=angleDifference(lookYaw,d.yaw)*ease(dt,d.auto?2.2:9);
    d.pitch=mix(d.pitch,lookPitch,ease(dt,d.auto?2.2:9));updateDirection();
    for(let i=0;i<sheetHeights.length;i++){
      const y=sheetHeights[i];
      if((oldY-y)*(eye[1]-y)<0&&s.t-lastSplash>.21){
        const ink=[5,3,4,3,5][i];ripple(i+1,[eye[0],y,eye[2]],ink,true);
        lastSplash=s.t;onMoment('cross',i+1);
      }
    }
    oldY=eye[1];const dist=Math.hypot(...eye);
    d.heat=clamp((star+2.25-dist)/1.78,0,1);
    if(dist<2.75&&!nearSun&&(!s.life||s.life.chapter===1)){nearSun=true;onMoment('nearSun');}else if(dist>3.2)nearSun=false;
    if(d.near&&d.nearestDistance<d.near.r*2.35&&currentPass!==d.near){
      currentPass=d.near;onMoment('pass',currentPass);
    }else if(d.nearestDistance>1.75)currentPass=null;
    d.cloud=null;
    for(let i=0;i<activeClouds(s.low);i++)if(cloudDistance(eye,clouds[i])<1){d.cloud=clouds[i];break;}
  }
  return Object.assign(d,{enter,leave,look,key,tick,activity,ripple,clearKeys(){keys.clear();d.ride=null;}});
}
