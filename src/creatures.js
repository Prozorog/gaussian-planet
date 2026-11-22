import { sheetHeights } from './drift.js';
import { clamp } from './system.js';

const names=['Sable','Opal','Cinder'];
const pal=[3,5,4], sizes=[.85,.78,.74];
const initialSchools=[[-3.40,.39,3.75,3],[3.15,.43,1.66,5],[.64,.31,-2.92,4]];
const storage='gaussian-planet.creatures.v1';
const plates=[-.81,-.49,-.17];
const smooth=t=>{const k=clamp(t,0,1);return k*k*(3-2*k);};

export function createCreatures(s,c,audio,say) {
  let enabled=true, lastSong=-20, nextBreath=4.25, novaLift=0, migration=0;
  try { enabled=localStorage.getItem(storage)!=='off'; } catch {}
  const swimmers=[],schools=[],ripples=[];
  let dived=false,births=0,bites=0,scatters=0;
  function reset() {
    schools.splice(0,schools.length,...initialSchools.map(([x,y,z,ink],i)=>({x,y,z,ink,index:i,scatter:0,food:null})));
    swimmers.length=0;
    for(let i=0;i<names.length;i++)swimmers.push({key:-1-i,name:names[i],r:sizes[i],creature:true,
      x:0,y:0,z:0,vx:0,vz:1,bank:0,ink:pal[i],fed:new Set(),breachAt:-20});
    births=bites=scatters=0;lastSong=s.t;nextBreath=s.t+4.25;ripples.length=0;
    update(0);
  }
  function enable(on) {
    enabled=on;
    try { localStorage.setItem(storage,on?'on':'off'); } catch {}
  }
  function splash(mob,y) {
    mob.breachAt=s.t;
    ripples.push({x:mob.x,y,z:mob.z,at:s.t,ink:mob.ink});
    if(c.inside>.8&&Math.hypot(c.eye[0]-mob.x,c.eye[2]-mob.z)<4.1)audio.splash();
  }
  function update(dt) {
    if(!enabled&&dt)return;
    const t=s.t, red=s.life.red,white=s.life.white,hole=s.blackHole.hole;
    dived=s.nova>=0;
    novaLift+=(Number(dived)-novaLift)*Math.min(1,dt*2);
    migration+=(red+.54*white-migration)*Math.min(1,dt*.45);
    const visible=white>.65?2:swimmers.length;
    while(ripples.length&&t-ripples[0].at>2.6)ripples.shift();
    for(let i=0;i<swimmers.length;i++){
      const b=swimmers[i],older=b.parent;
      const turn=i%2?.044:-.047, angle=t*turn+[2.30,1.02,-1.70][i%3];
      const r=[6.10,6.9,8.4][i%3]*(1+.31*migration)+.44*Math.sin(t*.10+i*3);
      let x=Math.cos(angle)*r,z=Math.sin(angle)*r;
      let y=[-.17,.51,-.58][i%3]+.57*Math.sin(t*.254+i*2.31-.67)-3.5*novaLift;
      if(hole){
        const dx=x-hole.x,dz=z-hole.z,d=Math.hypot(dx,dz);
        const a=d>.2?Math.atan2(dz,dx):angle;
        const f=smooth((4.9-d)/1.9);
        const orbit=3.4+i*.38;
        x+=(hole.x+Math.cos(a+.25*f)*orbit-x)*f;
        z+=(hole.z+Math.sin(a+.25*f)*orbit-z)*f;
      }
      if(older){
        const lead=Math.hypot(older.vx,older.vz)||1;
        x=older.x-(older.vx*.95-older.vz*.48)/lead;
        z=older.z-(older.vz*.95+older.vx*.48)/lead;
        y=older.y-.19+Math.sin(t*.71+i)*.10;
      }else{
        for(const planet of s.sceneBodies??s.bodies){
          const gap=Math.hypot(x-planet.x,z-planet.z)-planet.r;
          y+=.85*smooth((1.8-gap)/1.5)*(y>=planet.y+.15?1:-1);
        }
      }
      const oldY=b.y;
      if(dt){
        const dx=clamp((x-b.x)/dt,-1.4,1.4),dz=clamp((z-b.z)/dt,-1.4,1.4);
        const lift=(dx*b.vz-dz*b.vx)*3.2-turn*3.3;
        b.bank+=(clamp(lift,-.36,.36)-b.bank)*Math.min(1,dt*1.4);
        b.vx+=(dx-b.vx)*Math.min(1,dt*3.2);b.vz+=(dz-b.vz)*Math.min(1,dt*3.2);
        y=oldY+(y-oldY)*Math.min(1,dt*3);
      }else {b.vx=-Math.sin(angle)*r*turn;b.vz=Math.cos(angle)*r*turn;}
      b.x=x;b.y=y;b.z=z;
      if(dt&&!dived&&s.life.chapter!==0&&i<visible&&!older&&t-b.breachAt>7&&oldY<y&&white<.55){
        const surface=(c.inside>.5?sheetHeights:plates).find(h=>oldY<=h&&y>h);
        if(surface!==undefined)splash(b,surface);
      }
    }
    if(t>=nextBreath&&t-lastSong>16&&!dived&&white<.8&&s.life.chapter!==0){
      const b=swimmers[Math.floor(t/19)%names.length];
      const gain=c.inside>.8?.8:.32;
      audio.song(b.ink,gain);lastSong=t;nextBreath=t+20+b.ink*.42;
    }
    for(const f of schools){
      f.scatter=Math.max(0,f.scatter-dt*.53);
      const start=initialSchools[f.index],a=t*.032+f.index*.91;
      let tx=start[0]+Math.sin(a)*1.15,tz=start[2]+Math.cos(a)*.96,ty=start[1];
      if(f.food && t-f.food.at>8.8)f.food=null;
      if(f.food){
        const m=f.food;
        tx=m.x;tz=m.z;ty=m.y+.21;
        if(t-m.at>.54&&t>=m.biteAt&&Math.hypot(f.x-tx,f.z-tz)<1.28&&m.bites<7){
          const a=m.bites*2.39996,p=[m.x+Math.cos(a)*.29,m.z+Math.sin(a)*.29];
          if(m.plate)s.strokes.push([4,p,p,.095+m.bites*.008,m.ink]);
          f.ink=m.ink;m.bites++;m.biteAt=t+.19;bites++;
        }
      }else if(f.index===1&&c.mode==='drift'&&!s.worlds.body&&t-c.drift.enteredAt>4.4){
        const sweep=Math.sin((t-c.drift.enteredAt)*.26)*2.10;
        tx=c.eye[0]-c.back[0]*2.55+c.right[0]*sweep;
        tz=c.eye[2]-c.back[2]*2.55+c.right[2]*sweep;
        ty=c.eye[1]-.14+Math.sin(a*4.)*.23;
      }
      if(hole){
        const dx=tx-hole.x,dz=tz-hole.z,d=Math.hypot(dx,dz)||1;
        if(d<2.7){tx=hole.x+2.7*dx/d;tz=hole.z+2.7*dz/d;}
      }
      const easing=Math.min(1,dt*(f.food?1.42:.56));
      f.x+=(tx*(1+.26*migration)-f.x)*easing;f.z+=(tz*(1+.26*migration)-f.z)*easing;
      f.y+=(ty-3.1*novaLift-f.y)*easing;
    }
  }
  function feed(x,y,z,ink,plate=false) {
    if(!enabled||dived||s.life.white>.85||s.life.chapter===0)return;
    const dist=b=>Math.hypot(b.x-x,b.z-z), byFood=(a,b)=>dist(a)-dist(b);
    const f=[...schools].sort(byFood)[0];
    f.food={x,y,z,ink,plate,at:s.t,biteAt:s.t+.54,bites:0};
    const candidate=swimmers.filter(b=>!b.parent&&!b.calf&&dist(b)<b.r*1.8).sort(byFood)[0];
    if(!candidate)return;
    candidate.fed.add(ink);
    if(candidate.fed.size<3)return;
    candidate.calf=true;
    swimmers.push({key:-21-++births,name:candidate.name+'’s calf',r:candidate.r*.45,creature:true,
      x:candidate.x,y:candidate.y,z:candidate.z,vx:candidate.vx,vz:candidate.vz,bank:candidate.bank,ink,parent:candidate,fed:new Set()});
    audio.song(ink,.8);say(candidate.name+' has a calf');
  }
  function scatter(x,z) {
    if(!enabled)return;
    let affected=false;
    for(const f of schools)if(Math.hypot(f.x-x,f.z-z)<4.6){f.scatter=1;affected=true;}
    if(affected)scatters++;
  }
  reset();
  function wakes(inside){
    const heights=inside>.5?sheetHeights:plates;
    if(!enabled||dived||s.life.chapter===0||s.life.white>.6)return [];
    return swimmers.filter(b=>!b.parent).flatMap(b=>{
      const h=heights.reduce((a,y)=>Math.abs(y-b.y)<Math.abs(a-b.y)?y:a);
      const force=1-smooth(Math.abs(h-b.y)/(.30*b.r));
      return force>.03?[{b,h,force}]:[];
    });
  }
  return {update,enable,reset,feed,scatter,swimmers,schools,ripples,wakes,
    get enabled(){return enabled;},
    get dived(){return dived;},
    get rideables(){return enabled&&!dived&&s.life.chapter!==0?(s.life.white>.65?swimmers.slice(0,2):swimmers):[];},
    fishCount(){return !enabled||dived||s.life.chapter===0?0:s.life.white>.65?21:s.low?150:300;},
    state(){return {enabled,dived,births,bites,scatters,ripples:ripples.length,
      schools:schools.map(({x,y,z,ink,food,scatter})=>({x,y,z,ink,feeding:!!food,scatter})),
      swimmers:swimmers.map(({name,x,y,z,r,breachAt,fed})=>({name,x,y,z,r,breachAt,fed:[...fed]}))};}
  };
}
