// World units: a solar radius is one. Orbits lie in XZ; Y is elevation.
export const MU=1.65, STEP=1/120, INKS=[0,4,5,3,2,6];
export const palettes=[
 '150918 2a0d21 53263b 861335 b91837 e53628 f36c1c f89936 ffc959',
 '180710 360910 590d13 8f1916 c42617 ec4214 ff7611 ffaa2d ffd05c',
 '041c1c 07372e 005643 00794d 009d64 18bc79 48de91 e6ab30 f6d96e',
 '061329 092a47 034765 00678a 008ead 00b8c6 18e2df 91f6ed e5ffff',
 '12031a 340c38 650a52 991065 c41877 e82b88 ff527b ff8641 ffc575',
 '110a24 27133c 3e165d 611688 8424bf aa3adc c94ce8 ea73dc f5b8ed',
 '281020 4b1e20 80321a a54b16 c96b12 e78c12 ffae29 ffcf45 ffe48b',
 'b93519 de4e15 f17118 f88b1e f9a737 fac054 ffd57c f9de96 fff0b9',
 '202747 384878 4968bf 528eea 5db6f4 7dddf8 acf4ff d2f7ff f3fdff'
];
export function inks(){return Uint8Array.from(palettes.flatMap(row=>row.split(' ').flatMap(h=>[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4),16),255])));}
const originals=[['Ember','Lava world',2.30,.24,-2.62,1],['Verdance','Living world',3.65,.38,1.89,2],['Tide','Ocean world',4.85,.49,-1.05,3],['Aurelia','Gas giant',6.25,.63,.36,4],['Vesper','Ice world',7.65,.35,3.38,5]];
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function circular(x,z){const r=Math.hypot(x,z)||1,v=Math.sqrt(MU/r)/r;return [-z*v,x*v];}
export function createSystem(onEvent){
 const bodies=[],events=[],flares=[];let serial=0,accumulator=0,epoch=0;
 const s={bodies,events,flares,t:0,epoch:0,nova:-1,hue:7,tint:0,tintUntil:0,shake:0,paused:false,rate:1};
 function emit(type,x,z,id,second=id,size=1,details){const e={type,x,z,id,second,size,at:s.t,seed:++serial,...details};events.push(e);if(events.length>24)events.shift();onEvent(e);}
 function make(name,type,x,z,r,id,kind=id){const [vx,vz]=circular(x,z);return {key:++serial,name,type,x,y:.13,z,r,id,id2:id,id3:id,kind,vx,vz,hit:0,moons:kind===4?2:kind===2?1:0,ring:kind===3||kind===4,extra:0,launched:-1,comet:null,marks:[],guide:Math.hypot(x,z),spin:0};}
 function reset(){bodies.length=events.length=flares.length=0;serial=0;accumulator=0;epoch=1;Object.assign(s,{nova:-1,hue:7,tintUntil:0,shake:0,paused:false,rate:1,epoch});for(const [name,type,a,r,p,id] of originals)bodies.push(make(name,type,a*Math.cos(p),a*Math.sin(p),r,id));}
 function addFlare(x,z,dx,dz,power,id=0){if(flares.length>=3)flares.shift();const len=Math.hypot(dx,dz)||1;flares.push({x,z,dx:dx/len,dz:dz/len,power,id,age:0,travel:0,hit:null});}
 function birth(x,z,hold,ids){const extras=bodies.filter(b=>b.extra);if(extras.length>=4){const old=extras[0];emit('dissolve',old.x,old.z,old.id,old.id2,old.r*2);bodies.splice(bodies.indexOf(old),1);}const roots=['Cal','Thal','Ari','Iri','Ner','Oph','Eli','Vel'],ends=['ion','essa','ara','une','ora','is','anthe'];const n=serial,b=make(roots[n%8]+ends[(n*3)%7],'Ink-born world',x,z,.17+.34*clamp((hold-.6)/2.4,0,1),ids[0],6);b.id2=ids[1]??ids[0];b.id3=ids[2]??b.id2;b.extra=b.key;b.hit=1;bodies.push(b);emit('birth',x,z,b.id,b.id2,b.r*2);return b;}
 function fling(b,vx,vz,tuning=0){b.vx=vx;b.vz=vz;b.tuning=tuning;b.comet=null;b.launched=0;emit('fling',b.x,b.z,b.id,b.id,b.r);}
 function gravity(b){const rr=Math.max(.5,b.x*b.x+b.z*b.z),u=-MU/(rr*Math.sqrt(rr));let ax=b.x*u,az=b.z*u;for(const o of bodies){if(o===b)continue;const x=o.x-b.x,z=o.z-b.z,d=x*x+z*z+.15,g=.055*o.r**3/(d*Math.sqrt(d));ax+=g*x;az+=g*z;}
  const hole=s.blackHole?.hole;if(hole){const x=hole.x-b.x,z=hole.z-b.z,d=x*x+z*z+.17,g=.79/(d*Math.sqrt(d));ax+=g*x;az+=g*z;}
  b.ax=ax;b.az=az;
 }
 function substep(dt){for(const b of bodies){if(b.held||b.comet)continue;gravity(b);b.vx+=b.ax*dt*.5;b.vz+=b.az*dt*.5;const v=Math.hypot(b.vx,b.vz);if(v>9){b.vx*=9/v;b.vz*=9/v;}b.x+=dt*b.vx;b.z+=dt*b.vz;}
  for(const b of bodies){if(b.held)continue;let r=Math.hypot(b.x,b.z);if(b.comet){const c=b.comet;c.E+=dt*.48/(1-.54*Math.cos(c.E));const u=c.a*(Math.cos(c.E)-.54),v=c.a*Math.sqrt(1-.54**2)*Math.sin(c.E)*c.sign;const x=c.ca*u-c.sa*v,z=c.sa*u+c.ca*v;b.vx=(x-b.x)/dt;b.vz=(z-b.z)/dt;b.x=x;b.z=z;if(c.E>Math.PI*1.52){b.comet=null;b.launched=3;emit('return',x,z,b.id);}continue;}gravity(b);b.vx+=b.ax*dt*.5;b.vz+=b.az*dt*.5;
   if(b.tuning){
     b.launched+=dt;
     const x=b.x/r,z=b.z/r,sign=Math.sign(b.x*b.vz-b.z*b.vx)||1,swirl=Math.sqrt(MU/b.tuning)*sign;
     const slide=clamp((b.tuning-r)*1.1,-1.4,1.4),k=1-Math.exp(-dt*5);
     b.vx+=(x*slide-z*swirl-b.vx)*k;b.vz+=(z*slide+x*swirl-b.vz)*k;
     if(Math.abs(r-b.tuning)<.028&&Math.abs(x*b.vx+z*b.vz)<.07){
       b.x=x*b.tuning;b.z=z*b.tuning;b.vx=-z*swirl;b.vz=x*swirl;
       b.guide=b.tuning;b.tuning=0;b.launched=-1;emit('orbit',b.x,b.z,b.id);
     }
   }else if(b.launched>=0){b.launched+=dt;if(r>8.7&&b.x*b.vx+b.z*b.vz>0){const sign=b.x*b.vz-b.z*b.vx<0?-1:1,a=Math.atan2(b.z,b.x)-sign*Math.acos(-.54);b.comet={E:Math.PI/2,a:r,ca:Math.cos(a),sa:Math.sin(a),sign};emit('escape',b.x,b.z,b.id);}
    else if(b.launched>2.2){const v=Math.sqrt(MU/r)/r,k=1-Math.exp(-dt*1.3);b.vx+=(-b.z*v-b.vx)*k;b.vz+=(b.x*v-b.vz)*k;if(b.launched>7){b.launched=-1;b.guide=r;emit('orbit',b.x,b.z,b.id);}}}}
  for(let i=bodies.length-1;i>=0;i--){const b=bodies[i];if(b.held)continue;if(Math.hypot(b.x,b.z)<1+b.r*.65){s.tint=b.id;s.tintUntil=s.t+10;addFlare(0,0,-b.vx,-b.vz,1,b.id);emit('feed',b.x,b.z,b.id,b.id,1.4);bodies.splice(i,1);continue;}
   for(let j=0;j<i;j++){const o=bodies[j];if(o.held||Math.hypot(b.x-o.x,b.z-o.z)>b.r+o.r)continue;const big=b.r>=o.r?b:o,small=big===b?o:b,ratio=small.r/big.r;emit('collision',big.x,big.z,big.id,small.id,(big.r+small.r)*1.7,{outcome:ratio<.64?'ring':'merge',body:big});s.shake=2.8;big.hit=1;if(ratio<.64){big.ring=true;big.moons=Math.min(4,big.moons+1);}else{const m=big.r**3,n=small.r**3;big.vx=(big.vx*m+small.vx*n)/(m+n);big.vz=(big.vz*m+small.vz*n)/(m+n);big.r=Math.cbrt(m+n);big.id2=small.id;big.id3=small.id2;big.name=big.name.slice(0,Math.ceil(big.name.length/2))+small.name.slice(-3).toLowerCase();big.type='Confluence world';}big.launched=1;bodies.splice(bodies.indexOf(small),1);break;}}}
 function advance(dt){s.t+=dt;s.shake=Math.max(0,s.shake-dt*2.8);for(const b of bodies){b.hit=Math.max(0,b.hit-dt*.78);b.spin+=dt*.044;}
  if(!s.paused&&(!s.life||s.life.chapter===1)){accumulator+=dt*s.rate*(s.voyage?.active?.14:1);while(accumulator>=STEP){substep(STEP);accumulator-=STEP;}}
  if(s.nova>=0){const a=s.t-s.nova;if(a>=1&&!s.exploded){s.exploded=true;s.shake=3;s.epoch=++epoch;for(const b of bodies){const r=Math.hypot(b.x,b.z);b.vx+=b.x/r*1.25;b.vz+=b.z/r*1.25;b.launched=0;}emit('shock',0,0,s.hue,4,8);}if(a>=7){s.nova=-1;s.hue=s.hue===7?8:s.hue===8?0:7;emit('reignite',0,0,s.hue,6,1.4);}}
  for(let i=flares.length-1;i>=0;i--){const f=flares[i];f.age+=dt;if(f.age>4.6||f.hit&&s.t-f.when>1.1){flares.splice(i,1);continue;}if(f.hit){const b=f.hit,a=f.entry+(s.t-f.when)*3;f.x=b.x+Math.cos(a)*b.r*1.1;f.z=b.z+Math.sin(a)*b.r*1.1;f.dx=-Math.sin(a);f.dz=Math.cos(a);continue;}const d=dt*(3.5+f.power*1.9);f.travel+=d;f.x+=f.dx*d;f.z+=f.dz*d;for(const b of bodies)if(Math.hypot(f.x-b.x,f.z-b.z)<b.r+.12){f.hit=b;f.when=s.t;f.entry=Math.atan2(f.z-b.z,f.x-b.x);b.hit=1;emit('impact',b.x,b.z,b.id,f.id,b.r);break;}}
  while(events.length&&s.t-events[0].at>9)events.shift();}
 reset();return Object.assign(s,{advance,reset,fling,birth,addFlare,emit,supernova(){if(s.nova<0){s.nova=s.t;s.exploded=false;emit('collapse',0,0,s.hue);}}});
}
