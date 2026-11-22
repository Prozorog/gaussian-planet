import {program,texture,mapTexture,draw} from './gl.js';
import {driftRenderer} from './drift-render.js';
import {horizonRenderer} from './horizon-render.js';
import {creatureRenderer} from './creature-render.js';
import worldInterior from './shaders/interiors.glsl?raw';
import {createFluid} from './fluid.js';import {inks,clamp} from './system.js';import {createPrint,SPAN} from './print.js';import {particles} from './particles.js';import {meshes} from './meshes.js';
import common from './shaders/ink.glsl?raw';import vertex from './shaders/world.vert.glsl?raw';import sky from './shaders/space.glsl?raw';import bodies from './shaders/body.glsl?raw';import corona from './shaders/corona.glsl?raw';import nebula from './shaders/disc.glsl?raw';import events from './shaders/event.glsl?raw';
import shells from './shaders/shells.glsl?raw';
export function createRenderer(canvas){const gl=canvas.getContext('webgl2',{powerPreference:'high-performance',alpha:false,antialias:false,depth:true,stencil:false});if(!gl||!gl.getExtension('EXT_color_buffer_float'))throw Error('WebGL2 with floating-point render targets is required. Enable hardware acceleration and reload.');
 const make=(src,label)=>program(gl,common+src,label,vertex),skyP=program(gl,common+sky,'Marbled firmament'),shellP=program(gl,common+shells,'Expanding nebula shells'),body=make(bodies,'Planet press'),crown=make(corona,'Solar currents'),disc=make(nebula,'Three nebula plates'),fx=make(events,'Marbled reactions');const mesh=meshes(gl),fluid=createFluid(gl),solar=createFluid(gl),plate=createPrint(gl);let seed=294879;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);const paper=Uint8Array.from({length:256*256*4},()=>rand()*256),fiber=mapTexture(gl,256,256,gl.RGBA8,paper,gl.LINEAR,gl.REPEAT),ramp=mapTexture(gl,9,9,gl.RGBA8,inks()),dust=particles(gl,rand);
 function lattice(channel){
   const coefficients=new Float32Array(256*256*4);
   const value=(x,y)=>paper[4*((y&255)*256+(x&255))+channel]/127.5-1;
   for(let y=0;y<256;y++)for(let x=0;x<256;x++){
     const a=value(x,y),b=value(x+1,y),c=value(x,y+1),d=value(x+1,y+1);
     coefficients.set([a,b-a,c-a,d-b-c+a],4*(y*256+x));
   }
   const tex=mapTexture(gl,256,256,gl.RGBA16F);
   gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,256,256,gl.RGBA,gl.FLOAT,coefficients);return tex;
 }
 const red=lattice(0),green=lattice(1);
 const probe=gl.createFramebuffer(),tag=mapTexture(gl,256,256,gl.RGBA8),pixels=new Uint8Array(15*15*4);gl.bindFramebuffer(gl.FRAMEBUFFER,probe);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tag,0);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 const overhead=new Float32Array([1/16,0,0,0,0,0,0,0,0,1/16,0,0,0,0,0,1]);let colourSampleAt=-1;
 const remap=new Float32Array([0,0,1,0]),sun=new Float32Array([0,0,1/8.4,0]),core=new Float32Array([0,0,.03125,0]),positions=new Float32Array(48),forces=new Float32Array(48),orbits=new Float32Array(40),marks=new Float32Array(48),info=new Float32Array(48);let count=0,elapsed=0,w=1,h=1,pendingReset=false,lastEpoch=0;
 function source(x,z,r,id,vx,vz,d,twist){if(count>=12)return;const k=count++*4;positions[k]=x/SPAN;positions[k+1]=z/SPAN;positions[k+2]=r/SPAN;positions[k+3]=id;forces[k]=vx/SPAN;forces[k+1]=vz/SPAN;forces[k+2]=d;forces[k+3]=twist;}
 function bindWorld(){texture(gl,4,fiber);texture(gl,5,ramp);texture(gl,6,fluid.dye);texture(gl,7,fluid.velocity);texture(gl,8,plate.image);texture(gl,10,red);texture(gl,11,green);}
 function frame(prog,s,c){const l=prog.use();gl.uniform2f(l.viewport,w,h);gl.uniform1f(l.time,s.t);gl.uniform1f(l.density,s.density);gl.uniform1i(l.paper,4);gl.uniform1i(l.inks,5);gl.uniform1i(l.dye,6);gl.uniform1i(l.velocity,7);gl.uniform1i(l.plate,8);gl.uniform1i(l.redLattice,10);gl.uniform1i(l.greenLattice,11);gl.uniform1i(l.finePaper,c.inside>.01?1:0);gl.uniformMatrix4fv(l.vp,false,c.matrix);gl.uniform3fv(l.right,c.right);gl.uniform3fv(l.up,c.up);gl.uniform3fv(l.eye,c.eye);gl.uniform1i(l.starHue,s.hue);gl.uniform4f(l.life,s.life?.young??0,s.life?.red??0,s.life?.shells??0,s.life?.white??0);return l;}
 function at(l,shape,x,y,z,r){gl.uniform3f(l.center,x,y,z);gl.uniform1f(l.radius,r);gl.uniform1i(l.shape,shape);}
 const interior=driftRenderer(gl,mesh,frame,at);
 const horizon=horizonRenderer(gl,frame);
 const printCreatures=creatureRenderer(gl,frame);
 const worldPress=program(gl,common+worldInterior,'Planet interiors'),interiorMarks=new Float32Array(20);
 function printInterior(s,c){
   const view=s.worlds, mark=view.toy, l=frame(worldPress,s,c);
   gl.uniform1i(l.worldKind,view.body.kind);
   gl.uniform1f(l.entered,view.inside);gl.uniform1f(l.toyAge,s.t-mark.at);
   gl.uniform4f(l.toy,mark.power,mark.x,mark.y,mark.turn);
   gl.uniform2f(l.look,view.yaw,view.pitch);gl.uniform2fv(l.offset,view.offset);
   gl.uniform2f(l.shift,c.shift,c.shiftY);
   gl.uniform1i(l.markCount,mark.drops.length);
   for(let i=0;i<mark.drops.length;i++)interiorMarks.set(mark.drops[i],i*4);
   gl.uniform4fv(l.marks,interiorMarks);draw(gl);
 }
 function discFrame(s,c){const l=frame(disc,s,c);gl.uniform1f(l.inside,c.inside);gl.uniform4fv(l.bodies,orbits);gl.uniform1i(l.count,(s.sceneBodies??s.bodies).length);gl.uniform1f(l.guides,s.guides?1:0);gl.uniform1f(l.epoch,s.epoch-1);gl.uniform2fv(l.vortex,s.vortex??[0,0]);gl.uniform1f(l.vortexAge,s.vortex?s.hold:0);return l;}
 // The same categorical print feeds floating droplets and identifies pigments swallowed by a vortex.
 function printChart(s,c){gl.disable(gl.DEPTH_TEST);bindWorld();gl.bindFramebuffer(gl.FRAMEBUFFER,probe);gl.viewport(0,0,256,256);const l=discFrame(s,c);gl.uniformMatrix4fv(l.vp,false,overhead);gl.uniform1i(l.probe,1);gl.uniform1i(l.layer,0);at(l,1,0,-.49,0,16);mesh.quad();gl.uniform1i(l.probe,0);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);colourSampleAt=s.t+.16;}
 function sample(x,z,s,c){printChart(s,c);gl.bindFramebuffer(gl.FRAMEBUFFER,probe);gl.readPixels(clamp(Math.round(128+x*8)-7,0,241),clamp(Math.round(128+z*8)-7,0,241),15,15,gl.RGBA,gl.UNSIGNED_BYTE,pixels);gl.bindFramebuffer(gl.FRAMEBUFFER,null);const hist=new Uint16Array(9);for(let i=0;i<pixels.length;i+=4)if(pixels[i+3])hist[pixels[i]]++;return [...hist.keys()].filter(i=>hist[i]).sort((a,b)=>hist[b]-hist[a]);}
 function render(s,c,dt,output){const dpr=Math.min(devicePixelRatio,2);w=output?.width??Math.max(1,Math.round(canvas.clientWidth*dpr));h=output?.height??Math.max(1,Math.round(canvas.clientHeight*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.bindVertexArray(null);if(s.worlds?.inside>=.999){bindWorld();gl.viewport(0,0,w,h);printInterior(s,c);return;}
  const wakes=s.creatures?.wakes(c.inside)??[];
  if(!output?.still){fluid.resize(s.grid,1);solar.resize(Math.max(96,s.grid/2),1);if(pendingReset){fluid.clear();solar.clear();pendingReset=false;}if(lastEpoch!==s.epoch){plate.clear();lastEpoch=s.epoch;}
  for(let i=0;i<s.blooms.length;){const b=s.blooms[i],u=Math.min(1,(s.t-b.at)/.32),r=b.r*Math.sqrt(1-(1-u)**3);if(r>b.last+.008||u===1){plate.stamp(0,b.p,b.p,r,b.id,b.last);b.last=r;}if(u===1)s.blooms.splice(i,1);else i++;}for(const m of s.strokes)plate.stamp(...m);s.strokes.length=0;
  elapsed+=dt;if(elapsed>=1/(s.low?30:48)){const step=Math.min(.085,elapsed);elapsed=0;count=0;if(s.force){const f=s.force;source(f.x,f.z,f.r,f.id,f.dx,f.dz,.67,f.twist);f.life-=step;if(f.life<=0)s.force=null;}for(const f of s.flares)source(f.x,f.z,.31+f.power*.19,f.id,f.dx*9,f.dz*9,.94,.9);
   for(const {b,force} of wakes){
     const speed=Math.hypot(b.vx,b.vz)||1, trailing=b.r*.68/speed;
     source(b.x-b.vx*trailing,b.z-b.vz*trailing,b.r*.85,b.ink,b.vx*force*15,b.vz*force*15,.50*force,.85*force*Math.sin(s.t*1.1+b.key));
   }
   for(const b of (s.sceneBodies??s.bodies))source(b.x-b.vx*.34,b.z-b.vz*.34,b.r*1.3,b.id,b.vx*5,b.vz*5,b.held?.15:.74+b.hit*.26,.24+b.hit);const pit=s.blackHole?.hole;if(pit)source(pit.x,pit.z,1.75,pit.ink,0,0,.22,1.02);if(s.life?.red>.1){for(let i=0;i<3;i++){const a=s.t*.17+i*2.094,r=s.life.starRadius,dx=Math.cos(a),dz=Math.sin(a);source(r*dx,r*dz,.72,0,28*dx*s.life.red,28*dz*s.life.red,.70*s.life.red,.55);}}sun[3]=s.charge;fluid.step(step,s.t,1,remap,core,positions,forces,count,s.low?6:10);solar.step(step,s.t,1,remap,sun,positions,forces,0,s.low?6:10);dust.step(step,s.t,fluid.velocity);}
  if(s.t>=colourSampleAt&&c.mode!=='poster')printChart(s,c);if(c.inside>0)interior.sampleFlow(s,c,fluid.velocity);}texture(gl,9,tag);
  const bent=horizon.begin(s,c,w,h);bindWorld();gl.viewport(0,0,w,h);gl.clearDepth(1);gl.depthMask(true);gl.clear(gl.DEPTH_BUFFER_BIT);let l=frame(skyP,s,c);gl.uniform3fv(l.back,c.back);gl.uniform2f(l.shift,c.shift,c.shiftY);draw(gl);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);dust.draw(s,c,1);
  if(s.life?.shells>.001){l=frame(shellP,s,c);gl.uniform3fv(l.back,c.back);gl.uniform2f(l.shift,c.shift,c.shiftY);gl.uniform1f(l.evolution,s.life.value);draw(gl);}
  for(let i=0;i<(s.sceneBodies??s.bodies).length;i++){const b=(s.sceneBodies??s.bodies)[i];orbits.set([b.x,b.z,b.r,b.guide],i*4);}const poster=c.mode==='poster';if(!poster){if(c.inside<1){l=discFrame(s,c);for(const k of [1,0,-1]){gl.uniform1i(l.layer,k);at(l,1,0,-.49+k*.32,0,16);mesh.quad();}}if(c.inside>0)interior.surfaces(s,c);dust.draw(s,c,0);}
  function engulfPoint(e,a,rs){
   const [u,v]=c.project(e.x,.13,e.z),[sx,sy]=c.project(0,0,0);
   const x=(u-sx)*c.aspect,y=v-sy,k=Math.hypot(x,y)||1;
   return c.right.map((q,i)=>(q*x+c.up[i]*y)/k*rs*(.98-.40*a)+c.back[i]*rs*.67);
  }
  const age=s.nova<0?-1:s.t-s.nova,r0=(s.life?.starRadius??1)*(1-.50*(s.blackHole?.dim??0)),rs=r0*(age<0?1:age<1?1-.91*age:.09+.08*clamp((age-5)/2,0,1));if((s.life?.shells??0)<.67&&(s.life?.white??0)<.55){l=frame(crown,s,c);texture(gl,6,solar.dye);texture(gl,7,solar.velocity);gl.uniform1f(l.charge,s.charge);gl.uniform1f(l.tintMix,clamp((s.tintUntil-s.t)/3,0,1));gl.uniform1i(l.tint,s.tint);at(l,2,0,0,0,4.2*rs*(1-.58*(s.life?.red??0)));mesh.quad();bindWorld();}
  l=frame(body,s,c);gl.uniform1f(l.charge,s.charge);
  function globe(x,y,z,r,kind,id,id2,id3,spin,hit,ring,ms,chime=0,place){
   at(l,0,x,y,z,r);gl.uniform1i(l.pass,0);gl.uniform1i(l.kind,kind);gl.uniform1iv(l.ids,[id,id2,id3]);gl.uniform1f(l.spin,spin);gl.uniform1f(l.impact,hit);gl.uniform1f(l.chime,chime);gl.uniform1f(l.hasRing,ring?1:0);gl.uniform1i(l.markCount,ms?.length??0);
   gl.uniform4f(l.worldToy,place?.power??0,place?.x??0,place?.y??0,place?.turn??0);
   if(ms?.length){for(let i=0;i<ms.length;i++){marks.set(ms[i].mark,i*4);info.set(ms[i].info,i*4);}gl.uniform4fv(l.marks,marks);gl.uniform4fv(l.markInfo,info);}mesh.sphere();
  }
  globe(0,0,0,rs,0,s.hue,s.hue,s.hue,s.t*.018,0,false);gl.uniform1iv(l.ids,[s.hue===8?8:0,0,0]);gl.uniform1i(l.pass,4);at(l,4,0,0,0,rs);if(rs>.30)for(let j=0;j<7;j++){gl.uniform1f(l.param,j+.67);mesh.ribbon();}
  for(const e of s.events){const a=s.t-e.at;if(e.type==="engulf"&&a<.75)globe(...engulfPoint(e,a,rs),e.size*.25*(1-a/.76),6,e.id,e.id,e.id,s.t*.1,1,false);}
  if(!poster){for(const b of (s.sceneBodies??s.bodies)){
    const weather=b.kind===4&&c.inside>.96&&Math.hypot(c.eye[0]-b.x,c.eye[1]-b.y,c.eye[2]-b.z)<b.r*3.55;
    if(weather){
      gl.uniform1i(l.pass,5);gl.uniform1iv(l.ids,[b.id,b.id,b.id]);
      for(const [height,current] of [[1.77,-.53],[1.28,1.83]]){
        at(l,0,b.x,b.y,b.z,b.r*height);gl.uniform1f(l.spin,current);mesh.cloud();
      }
    }
    const y=b.y+b.hit*.037*Math.sin(s.t*35);globe(b.x,y,b.z,b.r,b.kind,b.id,b.id2,b.id3,b.spin,b.hit,b.ring,b.marks,+((b.chimeUntil??0)>s.t),(b.original?.toy??b.toy)??(weather&&s.voyage?.shot?.bands?{power:.52}:null));if(b.ring){gl.uniform1i(l.pass,3);at(l,3,b.x,y,b.z,b.r*2.15);mesh.quad();}const toy=b.original?.toy??b.toy;if(b.kind===3&&toy?.power){const a=toy.turn*1.55+s.t*.22,d=b.r*2.6;globe(b.x+d*Math.cos(a),y+d*.31*Math.cos(a),b.z+d*Math.sin(a),b.r*.19,6,8,8,8,s.t*.03,0,false);}for(let j=0;j<b.moons;j++){const a=s.t*(.39-j*.066)+b.key+j*2.21,d=b.r*(2.16+j*.54);globe(b.x+Math.cos(a)*d,y+Math.cos(a)*d*.22,b.z+Math.sin(a)*d,b.r*(.14-j*.014),6,b.id,b.id,b.id,0,0,false);}}
   gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.uniform1i(l.pass,2);for(const b of (s.sceneBodies??s.bodies)){at(l,0,b.x,b.y,b.z,b.r*(1.057+.018*b.hit));gl.uniform1iv(l.ids,[b.id,b.id,b.id]);mesh.sphere();}gl.disable(gl.CULL_FACE);gl.depthMask(true);gl.disable(gl.BLEND);}
  printCreatures(s,c);
  l=frame(fx,s,c);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);function effect(type,shape,x,y,z,r,id,second,age,dx=0,dz=0,width=.2,seed=0){at(l,shape,x,y,z,r);gl.uniform1i(l.eventType,type);gl.uniform1i(l.first,id);gl.uniform1i(l.second,second);gl.uniform1f(l.age,age);gl.uniform4f(l.effect,dx,dz,width,seed);mesh.quad();}
  if(!poster)for(const {b,h,force} of wakes){
    const speed=Math.hypot(b.vx,b.vz)||1, facing=c.eye[1]>=h?1:-1;
    effect(6,1,b.x,h+.006*facing,b.z,b.r*1.93,b.ink,b.ink,0,b.vx/speed,b.vz/speed,force,b.key);
  }
  if(s.creatures?.enabled&&!poster)for(const ring of s.creatures.ripples){
    const a=s.t-ring.at;
    if(a<2.6)effect(5,1,ring.x,ring.y+.022,ring.z,1.33+a*.85,ring.ink,ring.ink,a);
  }
  const hole=s.blackHole?.hole;
  if(hole){
    const streams=s.blackHole.starStream?[...s.blackHole.streams,s.blackHole.starStream]:s.blackHole.streams;
    for(const stream of streams){
      const t=clamp((s.t-stream.at)/(stream.star?2.45:1.65),0,1);
      const angle=stream.star?Math.atan2(-hole.z,-hole.x):stream.angle+t*1.87;
      const r=Math.max(.64,stream.distance*(1.54-.73*t)+.74*Math.sin(Math.PI*t));
      at(l,6,hole.x,hole.y+.09,hole.z,1);
      gl.uniform4f(l.streamShape,r,angle,1.35+t*(stream.star?3.4:5.6),(stream.star?.12:.061)*(1-.73*t));
      gl.uniform1i(l.eventType,4);gl.uniform1i(l.first,stream.ink);
      gl.uniform1i(l.second,stream.star?0:stream.ink);
      gl.uniform4f(l.effect,0,0,0,stream.at);
      mesh.ribbon();
    }
  }
  for(const f of s.flares){const len=Math.max(.38,Math.min(2.5,f.travel+.16));effect(0,1,f.x-f.dx*len*.54,.29,f.z-f.dz*len*.54,len*.82,f.id,f.id,0,f.dx,f.dz,(.13+f.power*.13)/len,f.age*.1);}
  if(!poster){for(const b of (s.sceneBodies??s.bodies)){const toy=b.original?.toy??b.toy;if(b.kind===5&&toy?.power){effect(0,2,b.x+b.r*.50,b.y+b.r*1.14,b.z,b.r*.66,8,3,0,0,1,.060,s.t*.16);}}for(const b of (s.sceneBodies??s.bodies))if(b.comet){const v=Math.hypot(b.vx,b.vz),dx=b.vx/v,dz=b.vz/v;effect(0,1,b.x-dx*.94,b.y,b.z-dz*.94,1.4,b.id,b.id,0,dx,dz,b.r*.29);}const comet=(s.t+4)%49;if(comet<5){effect(0,1,comet*3.3-9,.9,-4+comet*.5,1.1,6,6,0,.99,.15,.07);}}
  for(const e of s.events){const a=s.t-e.at;if(e.type==='engulf'&&a<1.22)effect(1,2,...engulfPoint(e,a*.6,rs),e.size*(.4+a*1.2),e.id,0,a,0,0,.17,e.seed);else if(e.type==='shock'&&a<5.1)effect(2,2,0,.15,0,(.6+a*5.3),s.hue===8?8:0,4,a,0,0,.2,e.seed);else if(['collision','feed','birth','dissolve','impact','reignite','engulf','evaporate'].includes(e.type)&&a<2.35){effect(1,2,e.x,.26,e.z,e.size*(.40+1.35*Math.sqrt(a)),e.id,e.second,a,0,0,.2,e.seed);}}
  if((s.zone||s.zoneNote)&&!poster){const zone=s.zoneRadii();gl.depthMask(false);effect(3,1,0,-.135,0,zone[1],3,2,0,zone[0]/zone[1],0);gl.depthMask(true);}
  gl.disable(gl.BLEND);for(const e of s.events)if(s.t-e.at<2.3&&['collision','feed','birth','shock','impact','reignite','flare','engulf','evaporate'].includes(e.type))dust.draw(s,c,2,e);gl.disable(gl.DEPTH_TEST);gl.bindVertexArray(null);if(c.mode==='drift')interior.veil(s,c);if(bent)horizon.end(s,c);if(s.worlds?.inside>0)printInterior(s,c);
 }
 return {gl,render,sample,pickDrift(s,c,q){bindWorld();return interior.pick(s,c,q);},reset(){pendingReset=true;lastEpoch=-1;}};
}
