import {program,texture,mapTexture,draw} from './gl.js';
import {sheetHeights,clouds,activeClouds} from './drift.js';
import common from './shaders/ink.glsl?raw';
import vertex from './shaders/world.vert.glsl?raw';
import surface from './shaders/drift.glsl?raw';
import air from './shaders/drift-air.glsl?raw';

export function driftRenderer(gl,mesh,frame,at) {
  const skin=program(gl,common+surface,'Marbled skies and cloud walls',vertex);
  const atmosphere=program(gl,common+air,'Sheet crossings and solar heat');
  const flowProbe=program(gl,`uniform sampler2D flow;uniform vec2 site;out vec4 frag;
    void main(){vec2 v=texture(flow,site).xy;frag=vec4(.5+clamp(v*2.,-.5,.5),0.,1.);}`,'Local current');
  const pointFbo=gl.createFramebuffer(),pixel=mapTexture(gl,1,1,gl.RGBA8);
  gl.bindFramebuffer(gl.FRAMEBUFFER,pointFbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,pixel,0);
  const depth=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,depth);
  gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,1,1);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  const buffer=gl.createBuffer(),bytes=new Uint8Array(4);
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER,buffer);gl.bufferData(gl.PIXEL_PACK_BUFFER,4,gl.STREAM_READ);
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);
  let fence=null,readAt=-1;
  const positions=new Float32Array(48),states=new Float32Array(48);
  function surfaces(s,c,picking=false,pickX=0,pickY=0) {
    const l=frame(skin,s,c),d=c.drift;
    gl.uniform1f(l.inside,c.inside);gl.uniform1i(l.picking,picking?1:0);gl.uniform2f(l.pickOffset,pickX,pickY);
    const marks=d.ripples.filter(m=>!m.crossing||s.t-m.at<2.5);
    for(let i=0;i<marks.length;i++){
      const m=marks[i];positions.set(m.point,i*4);states.set([m.id,m.ink,m.at,Number(m.crossing)],i*4);
    }
    gl.uniform1i(l.markCount,marks.length);gl.uniform4fv(l.markPosition,positions);gl.uniform4fv(l.markState,states);
    const limit=activeClouds(s.low);
    for(let i=0;i<limit;i++){
      const b=clouds[i],r=Math.max(...b.size)*1.2;
      const [px,py,pz]=c.project(...b.pos);
      if(pz < -r || Math.abs(px*pz)>Math.max(0,pz)+r*2.2 || Math.abs(py*pz)>Math.max(0,pz)+r*3.4)continue;
      gl.uniform1i(l.surfaceID,b.id);gl.uniform1i(l.pigment,b.ink);
      gl.uniform1f(l.param,b.seed);gl.uniform3fv(l.cloudSize,b.size);
      const dist=Math.hypot(...b.pos.map((v,j)=>(v-c.eye[j])/b.size[j]));
      at(l,5,...b.pos,1);mesh.cloud();
      if(dist<1.23){for(const k of [.72,.39]){gl.uniform1f(l.radius,k);mesh.cloud();}}
    }
    // Draw nearest sheets first. Depth testing saves the more distant engravings.
    const order=[0,1,2,3,4].sort((a,b)=>Math.abs(sheetHeights[a]-c.eye[1])-Math.abs(sheetHeights[b]-c.eye[1]));
    for(const i of order){
      const h=sheetHeights[i],old=-.49+(i-2)*.32;
      gl.uniform1i(l.surfaceID,i+1);at(l,1,0,old+(h-old)*c.inside,0,15.5);mesh.quad();
    }
  }
  function pick(s,c,q) {
    const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
    gl.bindFramebuffer(gl.FRAMEBUFFER,pointFbo);
    const px=Math.floor((q[0]*.5+.5)*w),py=Math.floor((q[1]*.5+.5)*h);
    gl.viewport(-px,-py,w,h);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);surfaces(s,c,true,px,py);
    gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
    gl.disable(gl.DEPTH_TEST);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);
    if(!bytes[3])return null;
    const distance=(bytes[0]*65536+bytes[1]*256+bytes[2])/262144;
    const ray=c.ray(...q),length=Math.hypot(...ray);
    return {id:bytes[3],point:c.eye.map((v,i)=>v+ray[i]*distance/length)};
  }
  function sampleFlow(s,c,flow) {
    if(fence&&gl.clientWaitSync(fence,0,0)!==gl.TIMEOUT_EXPIRED){
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER,buffer);gl.getBufferSubData(gl.PIXEL_PACK_BUFFER,0,bytes);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);gl.deleteSync(fence);fence=null;
      c.drift.current=[(bytes[0]-128)/510,(bytes[1]-128)/510];
    }
    if(fence||s.t<readAt)return;
    readAt=s.t+.16;
    gl.disable(gl.DEPTH_TEST);gl.bindFramebuffer(gl.FRAMEBUFFER,pointFbo);gl.viewport(0,0,1,1);
    const l=flowProbe.use();texture(gl,1,flow);gl.uniform1i(l.flow,1);
    gl.uniform2f(l.site,c.eye[0]/32+.5,c.eye[2]/32+.5);draw(gl);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER,buffer);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,0);
    fence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  }
  function veil(s,c) {
    const d=c.drift,splash=Math.max(0,1-(s.t-d.crossedAt)/.43);
    if(!splash&&!d.heat)return;
    const l=frame(atmosphere,s,c);gl.uniform1f(l.splash,splash);gl.uniform1f(l.heat,d.heat);
    gl.uniform1i(l.splashInk,d.crossedInk);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    draw(gl);gl.disable(gl.BLEND);
  }
  return {surfaces,pick,sampleFlow,veil};
}
