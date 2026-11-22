import { elements } from './astronomy.js';
import { clamp, MU } from './system.js';

const TAU = 2 * Math.PI;
const ratios = [[1,2,12],[2,3,7],[3,4,5],[3,5,9]];
const turn = angle => Math.atan2(Math.sin(angle),Math.cos(angle));
const period = axis => TAU * Math.sqrt(axis**3/MU);
// Use a settled orbit's guide for its mean period. Instantaneous osculating
// elements swing during nearby conjunctions even in a nearly circular orbit.
const meanAxis = body => body.launched<0 ? body.guide : elements(body).a;

export function resonanceTicks(s, dragged) {
  const ticks = [];
  for(const neighbour of s.bodies) {
    if(neighbour===dragged)continue;
    const axis=meanAxis(neighbour);
    if(!(axis>0))continue;
    for(const [a,b] of ratios)for(const factor of [a/b,b/a]) {
      const radius=axis*factor**(2/3);
      if(radius>1.55&&radius<8.5)ticks.push({radius,ratio:`${a}:${b}`, neighbour});
    }
  }
  ticks.sort((a,b)=>a.radius-b.radius);
  return ticks.filter((tick,i)=>!i||tick.radius-ticks[i-1].radius>.115);
}

export function createSpheres(s, audio, discover) {
  const pairs = new Map(), phases = new Map(), ripples = [];
  let angle = -.48, on = true, total = 0, lastSound = -10, lastPair = null, voices = [];
  function toggle() { on = !on; if(on) phases.clear(); }
  function update(dt) {
    const oldAngle=angle;
    angle=turn(angle+dt*.021);
    const bodies=s.sceneBodies??s.bodies;
    voices=bodies.filter(b=>!b.held).map(body=>{
      const axis=meanAxis(body);
      const cycle=axis>0?period(axis):period(Math.hypot(body.x,body.z));
      const pitch=84-clamp(Math.log(cycle/12)/Math.log(10),0,1)*36;
      return {body,cycle,pitch:audio.snap(pitch)};
    });
    while(ripples.length&&s.t-ripples[0].at>1.65)ripples.shift();
    if(!on)return;
    for(const {body, pitch} of voices){
      const relative=turn(Math.atan2(body.z,body.x)-angle);
      const previous=phases.get(body.key);
      phases.set(body.key,relative);
      if(previous===undefined||Math.abs(relative-previous)>Math.PI||relative*previous>=0)continue;
      const angularStep=Math.abs(turn(angle-oldAngle));
      if(s.paused&&Math.abs(relative-previous)<angularStep*.99)continue;
      body.chimeUntil=s.t+.42;++total;
      ripples.push({x:body.x,z:body.z,at:s.t});
      if(s.t-lastSound>.18){audio.bell(pitch);lastSound=s.t;}
      if(total===5)discover(16);
    }
    const still=new Set();
    const orbitalDt=s.paused?0:dt*s.rate;
    for(let i=0;i<voices.length;i++)for(let j=i+1;j<voices.length;j++){
      const a=voices[i],b=voices[j],long=Math.max(a.cycle,b.cycle),short=Math.min(a.cycle,b.cycle);
      const match=ratios.find(([p,q])=>Math.abs(short/long/(p/q)-1)<=.015);
      if(!match||a.body.launched>=0||b.body.launched>=0||a.body.comet||b.body.comet)continue;
      const key=`${a.body.key}/${b.body.key}`;
      still.add(key);
      let pair=pairs.get(key);
      if(!pair||pair.match!==match){
        pair={match,ratio:`${match[0]}:${match[1]}`,time:0,drawAt:0,lines:[],locked:false};
        pairs.set(key,pair);
      }
      pair.a=a.body;pair.b=b.body;pair.period=long;pair.time+=orbitalDt;
      if(pair.time>=2*long&&!pair.locked){
        pair.locked=true;lastPair=pair;audio.chord(match[2]);discover(15);
      }
      if(pair.locked&&pair.time>=pair.drawAt){
        pair.drawAt=pair.time+long/100;
        pair.lines.push({x:a.body.x,z:a.body.z,u:b.body.x,v:b.body.z,at:pair.time});
        while(pair.lines.length&&pair.lines[0].at<pair.time-2.8*long)pair.lines.shift();
      }
    }
    for(const key of pairs.keys())if(!still.has(key))pairs.delete(key);
    for(const key of phases.keys())if(!voices.some(v=>v.body.key===key))phases.delete(key);
  }
  return {
    update,toggle,ripples,
    reset(){pairs.clear();phases.clear();ripples.length=0;lastPair=null;total=0;},
    get angle(){return angle;},get on(){return on;},get total(){return total;},
    get voices(){return voices;}, get lastPair(){return lastPair;},
    get locks(){return [...pairs.values()].filter(pair=>pair.locked);},
  };
}
