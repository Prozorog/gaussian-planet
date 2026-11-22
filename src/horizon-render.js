import { draw, mapTexture, program, texture } from './gl.js';
import common from './shaders/ink.glsl?raw';
import sky from './shaders/space.glsl?raw';
import horizon from './shaders/horizon.glsl?raw';

export function horizonRenderer(gl, frame) {
  const lens=program(gl,common+'\n#define HORIZON_PASS\n'+sky+horizon,'Event horizon and lensing');
  const buffer=gl.createFramebuffer();
  let width=0,height=0,color,depth,projection;
  function begin(s,c,w,h) {
    const bh=s.blackHole,hole=bh?.hole;
    if(!hole&&!bh?.dim)return false;
    const [x,y,d]=hole?c.project(hole.x,hole.y,hole.z):[10,10,-1];
    const radius=Math.min(1.7,(hole?.r??.5)/Math.max(.042,.6498394*d));
    if(!bh.fall&&!bh.dim&&(d<.025||Math.abs(x)>1+radius*12||Math.abs(y)>1+radius*12))return false;
    const near=.035,far=130,front=Math.max(.036,d-(hole?.r??.5)*.57);
    const overlap=hole&&Math.hypot(hole.x,hole.z)<s.life.starRadius+.27;
    const window=overlap?0:(far-(far*near)/front)/(far-near);
    projection=d>.025?[(x+1)*.5,(y+1)*.5,radius,window]:[200,200,.01,0];
    gl.bindFramebuffer(gl.FRAMEBUFFER,buffer);
    if(w!==width||h!==height){
      if(color){gl.deleteTexture(color);gl.deleteTexture(depth);}
      width=w;height=h;
      gl.activeTexture(gl.TEXTURE0+12);
      color=mapTexture(gl,w,h,gl.RGBA8);depth=mapTexture(gl,w,h,gl.DEPTH_COMPONENT24);
      gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,color,0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depth,0);
    }
    return true;
  }
  function end(s,c) {
    const bh=s.blackHole,hole=bh.hole;
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    const l=frame(lens,s,c);
    texture(gl,12,color);texture(gl,13,depth);
    gl.uniform1i(l.scene,12);gl.uniform1i(l.depth,13);
    gl.uniform4fv(l.centre,projection);gl.uniform3fv(l.back,c.back);gl.uniform2f(l.shift,c.shift,c.shiftY);
    gl.uniform1f(l.tilt,Math.abs(c.back[1]));gl.uniform1i(l.localInk,hole?.ink??0);
    const jetAge=s.t-(hole?.jetAt??-20);
    gl.uniform1f(l.jet,jetAge<4.4?jetAge+.001:0);gl.uniform1f(l.fall,bh.fall);gl.uniform1f(l.dim,bh.dim);
    draw(gl);
  }
  return {begin,end};
}
