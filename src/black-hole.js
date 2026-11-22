import { clamp } from './system.js';

const horizon = .48;
export const voidIndex = 6;

export function createBlackHole(s, c, discover, say, ascend) {
  const state={hole:null,streams:[],starStream:null,starAt:null,fallAt:null,fall:0,
    get ready(){return this.starAt!==null&&s.t-this.starAt>=6;},
    get dim(){return this.starAt===null?0:clamp((s.t-this.starAt)/2.10,0,1);}};
  let starLatch=false, wasInFront=false;
  function form(x,z,ink) {
    if(state.hole){say('Drag the existing black hole to move it.');return;}
    if(Math.hypot(x,z)<s.life.starRadius+.48)return;
    state.hole={x,y:.105,z,r:horizon,tx:x,tz:z,ink,at:s.t,jetAt:-20};
    discover(20);s.emit('holeForm',x,z,ink);
    say('Black hole formed');
  }
  function move(x,z) {
    const scale=Math.min(1,14.5/(Math.hypot(x,z)||1));
    state.hole.tx=x*scale;state.hole.tz=z*scale;
  }
  function remove() {
    if(!state.hole)return;
    const {x,z,ink}=state.hole;
    s.emit('evaporate',x,z,ink,6,1.9);
    state.hole=null;state.streams.length=0;state.starStream=null;starLatch=false;
    say('The black hole evaporates');
  }
  function rekindle() {
    if(state.starAt===null||s.t-state.starAt<6)return;
    state.starAt=null;state.starStream=null;starLatch=true;
    s.emit('reignite',0,0,s.hue,6,1.4);say('The star is rekindled');
  }
  function leaveFall() {state.fallAt=null;state.fall=0;}
  function reset() {
    state.hole=null;state.streams.length=0;state.starStream=null;state.starAt=null;leaveFall();
    starLatch=false;wasInFront=false;
  }
  function eat(body,hole){
    const origin=body.original??body,index=s.bodies.indexOf(origin);
    if(index<0)return;
    const dx=body.x-hole.x,dz=body.z-hole.z;
    state.streams.push({name:body.name,x:body.x,z:body.z,y:body.y,ink:body.id,r:body.r,
      at:s.t,angle:Math.atan2(dz,dx),distance:Math.hypot(dx,dz)});
    s.bodies.splice(index,1);
    s.emit('stretch',body.x,body.z,body.id);
    discover(23);say(body.name+' is stretched by tides');
  }
  function jet(hole) {
    hole.jetAt=s.t;
    discover(22);s.emit('jets',hole.x,hole.z,hole.ink);
  }
  function tick(dt) {
    if(state.fallAt!==null){
      state.fall=clamp((s.t-state.fallAt)/4,0,1);
      if(state.fall>=1){leaveFall();ascend();say('In this toy you come back.');}
    }
    const hole=state.hole;
    if(!hole)return;
    const glide=1-Math.exp(-dt*2.5);
    hole.x+=(hole.tx-hole.x)*glide;hole.z+=(hole.tz-hole.z)*glide;
    for(const b of [...s.sceneBodies]){
      if(!b.held&&Math.hypot(b.x-hole.x,b.z-hole.z)<hole.r+.25+b.r*.70)eat(b,hole);
    }
    for(let i=state.streams.length-1;i>=0;i--){
      if(s.t-state.streams[i].at<1.65)continue;
      state.streams.splice(i,1);jet(hole);
    }
    const reach=s.life.starRadius*.74+horizon,r=Math.hypot(hole.x,hole.z);
    if(r>reach+.28)starLatch=false;
    if(!starLatch&&state.starAt===null&&r<reach){
      state.starAt=s.t;state.starStream={x:0,z:0,y:0,ink:7,r:s.life.starRadius,at:s.t,
        angle:Math.atan2(-hole.z,-hole.x),distance:r,star:true};
      starLatch=true;s.emit('stretch',0,0,7);say('The black hole reaches the star');
    }
    if(state.starStream&&s.t-state.starStream.at>2.45){state.starStream=null;jet(hole);}
    if(c.mode==='drift'&&!c.flying&&!s.worlds?.body&&state.fallAt===null){
      const eye=c.drift.position,d=[hole.x-eye[0],hole.y-eye[1],hole.z-eye[2]],length=Math.hypot(...d);
      if(length<.61){state.fallAt=s.t;state.fall=.001;s.emit('fall',hole.x,hole.z,hole.ink);}
      else if(length<3.2)for(let i=0;i<3;i++)eye[i]+=d[i]/length*(3.2-length)**2*dt*.080;
    }
  }
  function alignment() {
    const hole=state.hole;
    if(!hole||wasInFront||c.mode==='poster')return;
    const [x,y,d]=c.project(hole.x,hole.y,hole.z);
    if(d<=.05||Math.abs(x)>1.2||Math.abs(y)>1.2)return;
    for(const b of [{x:0,y:0,z:0,r:s.life.starRadius},...s.sceneBodies]){
      const [u,v,depth]=c.project(b.x,b.y,b.z);
      if(depth<=d||Math.hypot((x-u)*c.aspect,y-v)>(hole.r+b.r)*1.3/(Math.max(d,.2)*.64984))continue;
      wasInFront=true;discover(21);return;
    }
  }
  return Object.assign(state,{form,move,remove,rekindle,reset,tick,alignment,leaveFall});
}
