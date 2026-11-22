import {MU,clamp} from './system.js';

export const AU=3.65;
export function habitableZone(hue) {
  const scale=hue===8?1.42:hue===0?.57:1;
  return [.95*AU*scale,1.7*AU*scale];
}
export function elements(b) {
  const r=Math.hypot(b.x,b.z),speed2=b.vx*b.vx+b.vz*b.vz;
  const h=b.x*b.vz-b.z*b.vx;
  const ex=b.vz*h/MU-b.x/r,ez=-b.vx*h/MU-b.z/r;
  const e=Math.hypot(ex,ez),a=b.comet?b.comet.a:1/(2/r-speed2/MU);
  return {a,e:b.comet ? .54 : e,angle:b.comet?Math.atan2(b.comet.sa,b.comet.ca):Math.atan2(ez,ex),
    sign:b.comet?b.comet.sign:Math.sign(h)||1,days:a>0?365*(a/AU)**1.5:null,distance:r/AU};
}
export function keplerPoint(orbit,mean) {
  const {a,e,angle,sign}=orbit;
  let E=mean;for(let i=0;i<6;i++)E-=(E-e*Math.sin(E)-mean)/(1-e*Math.cos(E));
  const x=a*(Math.cos(E)-e),z=a*Math.sqrt(1-e*e)*Math.sin(E)*sign;
  return [x*Math.cos(angle)-z*Math.sin(angle),x*Math.sin(angle)+z*Math.cos(angle)];
}
function overlap(r,R,d){
  if(d>=r+R)return 0;if(d<=Math.abs(r-R))return Math.PI*Math.min(r,R)**2;
  const cap=(v,t)=>v*v*Math.acos(clamp(t,-1,1));
  const triangle=Math.sqrt(Math.max(0,(-d+r+R)*(d+r-R)*(d-r+R)*(d+r+R)));
  return cap(r,(d*d+r*r-R*R)/(2*d*r))+cap(R,(d*d+R*R-r*r)/(2*d*R))-.5*triangle;
}
export function transit(s,c) {
  const [u,v,depth]=c.project(0,0,0),dist=Math.hypot(...c.eye);
  const radius=Math.asin(Math.min(.999,(s.life?.starRadius??1)/Math.max(1.001,dist)));
  if(s.nova>=0||depth<=0||Math.abs(u)>1+1.74/depth||Math.abs(v)>1+3.08/depth)
    return {light:1,body:null,visible:false};
  let blocked=0,body=null;const silhouettes=[];
  const star=c.eye.map(x=>-x/dist);
  const azimuth=Math.atan2(star[0],star[2]),right=[Math.cos(azimuth),0,-Math.sin(azimuth)];
  const up=[-star[1]*Math.sin(azimuth),Math.hypot(star[0],star[2]),-star[1]*Math.cos(azimuth)];
  for(const b of (s.sceneBodies??s.bodies)){
    const d=[b.x-c.eye[0],b.y-c.eye[1],b.z-c.eye[2]],len=Math.hypot(...d);
    if(len>=dist||len<=b.r)continue;
    const separation=Math.acos(clamp(d.reduce((a,k,i)=>a+k*star[i],0)/len,-1,1));
    const size=Math.asin(b.r/len),fraction=overlap(radius,size,separation)/(Math.PI*radius*radius);
    if(fraction<=0)continue;
    const angle=Math.atan2(d.reduce((a,k,i)=>a+k*up[i],0),d.reduce((a,k,i)=>a+k*right[i],0));
    silhouettes.push([Math.cos(angle)*separation,Math.sin(angle)*separation,size]);
    if(fraction>blocked){blocked=fraction;body=b;}
  }
  if(silhouettes.length>1&&blocked<1){
    // Integrate the union of foreground chords. Two overlapping planets can
    // cover the same patch of photosphere only once.
    let area=0;const dx=2*radius/96;
    for(let i=0;i<96;i++){
      const x=-radius+(i+.5)*dx,limb=Math.sqrt(radius*radius-x*x),spans=[];
      for(const [cx,cy,r] of silhouettes){
        const chord=r*r-(x-cx)**2;if(chord<=0)continue;
        const dy=Math.sqrt(chord),lo=Math.max(-limb,cy-dy),hi=Math.min(limb,cy+dy);
        if(hi>lo)spans.push([lo,hi]);
      }
      spans.sort((a,b)=>a[0]-b[0]);let end=-limb;
      for(const [lo,hi] of spans){area+=Math.max(0,hi-Math.max(end,lo))*dx;end=Math.max(end,hi);}
    }
    blocked=clamp(area/(Math.PI*radius*radius),0,1);
  }
  return {light:1-blocked,body,visible:true};
}

export function createAstronomy(s,c,discover) {
  let sampleAt=-1,flybys=new Map(),ellipseTime=new Map(),mean=0;
  const a={zone:false,labels:false,wedges:false,orbit:null,orbitBody:null,
    illustrative:true,mean:0,gauge:null,assist:null,roche:null,rider:null,vortex:null,
    curve:[],lastDip:[],light:1,transiting:null,zoneRadii:()=>habitableZone(s.hue).map(r=>r*(1+1.25*(s.life?.red??0)))};
  function selectOrbit(b,model=false) {
    a.orbitBody=b;
    const o=b&&elements(b);
    if(!model&&o&&o.a>0&&o.e>.13&&o.e<.94){
      a.orbit=o;a.illustrative=false;
      const p=Math.atan2(b.z,b.x)-o.angle;
      const E=Math.atan2(Math.sqrt(1-o.e*o.e)*Math.sin(p)*o.sign,o.e+Math.cos(p));
      mean=E-o.e*Math.sin(E);
    }else{
      a.orbit={a:Math.min(5.6,Math.max(2.7,b?.guide??4)),e:.46,angle:.36,sign:1};
      a.illustrative=true;mean=0;
    }
  }
  function preview(b,vx,vz) {
    const r=Math.hypot(b.x,b.z);
    a.gauge={circular:Math.sqrt(MU/r),escape:Math.sqrt(2*MU/r),speed:Math.hypot(vx,vz),body:b};
    discover(3);
  }
  function event(e) {
    if(e.type==='birth')discover(7);
    if(e.type==='reignite')discover(8);
    if(e.type==='shock')discover(9);
    if(e.type==='impact')discover(10);
    if(e.type==='escape'){const b=s.bodies.find(b=>b.comet&&b.x===e.x&&b.z===e.z);if(b){selectOrbit(b);discover(1);}discover(3);}
    if(e.type==='orbit'||e.type==='birth'){
      const r=Math.hypot(e.x,e.z),[lo,hi]=a.zoneRadii();if(r>=lo&&r<=hi)discover(12);
    }
    if(e.type==='collision'){
      if(e.outcome==='ring'){a.roche=e.body;discover(6);}else if(e.outcome==='merge')discover(5);
    }
  }
  function updateFlybys(dt) {
    for(const b of (s.sceneBodies??s.bodies)){
      if(b.launched<0||b.held||b.comet||b.launched>2.2){flybys.delete(b);ellipseTime.delete(b);continue;}
      const orbit=elements(b);
      if(orbit.e>.18&&orbit.e<.84&&orbit.a*(1-orbit.e)>1+b.r&&orbit.a*(1+orbit.e)<9.3){
        const time=(ellipseTime.get(b)||0)+dt;ellipseTime.set(b,time);
        if(time>.8&&time-dt<=.8){selectOrbit(b);discover(1);}
      }else ellipseTime.delete(b);
      let encounter=flybys.get(b);
      const speed=Math.hypot(b.vx,b.vz),r=Math.hypot(b.x,b.z),energy=.5*speed*speed-MU/r;
      if(encounter){
        const o=encounter.other,dist=Math.hypot(b.x-o.x,b.z-o.z);
        if(!s.bodies.includes(o)){flybys.delete(b);continue;}
        if(dist>encounter.bound){
          if(speed>encounter.speed*1.012&&energy-encounter.energy>.0015){
            a.assist={before:encounter.speed,after:speed,name:o.name};discover(4);
          }flybys.delete(b);
        }
      }else for(const o of s.bodies){
        if(b===o)continue;
        const bound=(b.r+o.r)*2.25,dx=b.x-o.x,dz=b.z-o.z;
        if(Math.hypot(dx,dz)<bound&&dx*(b.vx-o.vx)+dz*(b.vz-o.vz)<0){
          flybys.set(b,{other:o,bound,speed,energy});break;
        }
      }
    }
  }
  function tick(dt){
    if(!a.orbit)selectOrbit(s.bodies[1]??s.bodies[0],true);
    if(!s.paused){mean+=dt*s.rate*(a.illustrative?.51:Math.sqrt(MU/a.orbit.a**3));updateFlybys(dt);}
    a.mean=mean;
    if(s.t<sampleAt)return;sampleAt=s.t+.075;
    const transitView=c.mode==='overview'||c.mode==='drift';
    const sample=transitView?transit(s,c):{light:1,visible:false,body:null};
    a.light=sample.light;a.transiting=sample.body;
    a.curve.push({t:s.t,v:sample.visible?sample.light:null});
    while(a.curve.length&&a.curve[0].t<s.t-11)a.curve.shift();
    if(sample.light<.998&&sample.body){a.lastDip=a.curve.slice();discover(11);}
  }
  return Object.assign(a,{tick,event,preview,kepler(){a.wedges=!a.wedges;if(a.wedges){if(!a.orbit)selectOrbit(s.bodies[1],true);discover(1);}},
    toggleZone(){s.zone=!s.zone;if(s.zone)discover(12);},
    reset(){flybys.clear();ellipseTime.clear();a.orbit=null;a.wedges=false;a.roche=null;a.gauge=null;a.rider=null;a.assist=null;a.curve=[];a.lastDip=[];s.zone=false;}});
}
