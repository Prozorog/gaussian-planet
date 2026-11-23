import {program,mapTexture,texture,draw} from './gl.js';
const advect=`
uniform sampler2D velocity,dye;
uniform vec4 remap,sun; // old UV = (uv-.5)*remap.z+remap.xy+.5
uniform float aspect,dt,time;
uniform int count;
uniform vec4 points[12],forces[12]; // center.xy, radius, palette; velocity.xy, pigment, twist
layout(location=0) out vec2 velocityOut;
layout(location=1) out vec4 dyeOut;
void main(){
 vec2 S=vec2(aspect,1), p=(uv-.5)*S, prev=(uv-.5)*remap.z+remap.xy+.5;
 vec2 u=texture(velocity,prev).xy/remap.z;
 vec2 src=prev-u*dt/S*remap.z;
 float valid=float(all(greaterThanEqual(src,vec2(0)))&&all(lessThanEqual(src,vec2(1))));
 u=texture(velocity,src).xy*exp(-.58*dt)*valid/remap.z;
 vec4 old=texture(dye,src);vec2 sz=vec2(textureSize(dye,0));
 float id=texelFetch(dye,clamp(ivec2(src*sz),ivec2(0),ivec2(sz)-1),0).g;
 float mass=old.r*exp(-.55*dt)*valid;vec2 drift=(old.ba/remap.z+u*dt)*exp(-.85*dt)*valid;
 vec2 d=p-sun.xy;float r=length(d);vec2 n=d/max(.00001,r);float a=atan(n.y,n.x);
 float lobes=.5+.5*sin(19.*a+1.7*sin(6.*a-time*.25)+.4*time);
 float edge=(r/sun.z-1.)/(.078+.1*sun.w);float w=exp(-edge*edge)*(.22+.78*lobes);
 u+=w*dt*sun.z*(n*(2.6+3.*sun.w)+vec2(-n.y,n.x)*sin(a*11.-.5*time)*3.3);
 float paint=w*min(1.,dt*24.);if(paint>mass*.35 && paint>.008)id=0.;mass=max(mass,paint);
 for(int i=0;i<12;i++){if(i>=count)break;vec4 pt=points[i],f=forces[i];
  vec2 delta=(p-pt.xy)/pt.z;float h=exp(-dot(delta,delta)*2.);
  u+=dt*h*(f.xy+vec2(-delta.y,delta.x)*f.w);
  float deposit=h*f.z*min(1.,dt*30.);
  if(deposit>mass*.22 && deposit>.006 && pt.w>=0.)id=pt.w;
  mass=max(mass,deposit);
 }
 velocityOut=clamp(u,vec2(-1.8),vec2(1.8)); dyeOut=vec4(min(1.,mass),id,clamp(drift,vec2(-.15),vec2(.15)));
}`;
const neighbours=`uniform sampler2D field;uniform vec2 dx;
#define L texture(field,uv-vec2(dx.x,0))
#define R texture(field,uv+vec2(dx.x,0))
#define B texture(field,uv-vec2(0,dx.y))
#define T texture(field,uv+vec2(0,dx.y))
`;
const differential=neighbours+`out vec2 result;void main(){vec2 l=L.xy,r=R.xy,b=B.xy,t=T.xy;result=.5*vec2(r.x-l.x+t.y-b.y,r.y-l.y-t.x+b.x);}`;
const pressure=neighbours+`uniform sampler2D deriv;out float result;void main(){result=.25*(L.r+R.r+B.r+T.r-texture(deriv,uv).r);}`;
const project=neighbours+`uniform sampler2D deriv,vel;uniform float dt;out vec2 result;
void main(){vec2 v=texture(vel,uv).xy;float c=texture(deriv,uv).g;vec2 g=vec2(abs(texture(deriv,uv+vec2(0,dx.y)).g)-abs(texture(deriv,uv-vec2(0,dx.y)).g),abs(texture(deriv,uv-vec2(dx.x,0)).g)-abs(texture(deriv,uv+vec2(dx.x,0)).g));
 result=v-.5*vec2(R.r-L.r,T.r-B.r)+g/max(length(g),.00001)*c*dt*32.;}`;
export function createFluid(gl,rgbaOnly=false){
 const A=program(gl,advect,'Advection and sources'),D=program(gl,differential,'Divergence / curl'),P=program(gl,pressure,'Jacobi pressure'),V=program(gl,project,'Pressure projection');
 let w=0,h=0,idx=0,targets=[],tex=[],flow,adv,gradient,prs,dyes,mixed;
 function target(...textures){const f=gl.createFramebuffer();targets.push(f);gl.bindFramebuffer(gl.FRAMEBUFFER,f);const bufs=textures.map((t,i)=>{const att=gl.COLOR_ATTACHMENT0+i;gl.framebufferTexture2D(gl.FRAMEBUFFER,att,gl.TEXTURE_2D,t,0);return att;});gl.drawBuffers(bufs);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Floating-point framebuffer unavailable');return f;}
 function make(format,linear=false){const t=mapTexture(gl,w,h,rgbaOnly?gl.RGBA16F:format,null,linear?gl.LINEAR:gl.NEAREST);tex.push(t);return t;}
 function resize(n,aspect){const width=Math.round(n*aspect);if(h===n&&w===width)return;for(const f of targets)gl.deleteFramebuffer(f);for(const t of tex)gl.deleteTexture(t);targets=[];tex=[];w=width;h=n;idx=0;
  flow=make(gl.RG16F,true);adv=make(gl.RG16F,true);gradient=make(gl.RG16F);prs=[make(gl.R16F),make(gl.R16F)];dyes=[make(gl.RGBA16F,true),make(gl.RGBA16F,true)];mixed=dyes.map(d=>target(adv,d));target(gradient);target(prs[0]);target(prs[1]);target(flow);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 }
 return {resize,clear(){for(const f of targets){gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.clearBufferfv(gl.COLOR,0,new Float32Array(4));if(f===mixed[0]||f===mixed[1])gl.clearBufferfv(gl.COLOR,1,new Float32Array(4));}gl.bindFramebuffer(gl.FRAMEBUFFER,null);},get dye(){return dyes[idx]},get velocity(){return flow},step(dt,t,aspect,remap,sun,points,forces,count,iters){
  gl.viewport(0,0,w,h);let l=A.use();texture(gl,0,flow);texture(gl,1,dyes[idx]);gl.uniform1i(l.velocity,0);gl.uniform1i(l.dye,1);gl.uniform4fv(l.remap,remap);gl.uniform4fv(l.sun,sun);gl.uniform1f(l.time,t);gl.uniform1f(l.dt,dt);gl.uniform1f(l.aspect,aspect);gl.uniform1i(l.count,count);gl.uniform4fv(l.points,points);gl.uniform4fv(l.forces,forces);idx=1-idx;gl.bindFramebuffer(gl.FRAMEBUFFER,mixed[idx]);draw(gl);
  l=D.use();texture(gl,0,adv);gl.uniform1i(l.field,0);gl.uniform2f(l.dx,1/w,1/h);gl.bindFramebuffer(gl.FRAMEBUFFER,targets[2]);draw(gl);
  l=P.use();texture(gl,1,gradient);gl.uniform1i(l.field,0);gl.uniform1i(l.deriv,1);gl.uniform2f(l.dx,1/w,1/h);let k=0;for(let i=0;i<iters;i++){texture(gl,0,prs[k]);k=1-k;gl.bindFramebuffer(gl.FRAMEBUFFER,targets[3+k]);draw(gl);}
  l=V.use();texture(gl,0,prs[k]);texture(gl,2,adv);gl.uniform1i(l.field,0);gl.uniform1i(l.deriv,1);gl.uniform1i(l.vel,2);gl.uniform2f(l.dx,1/w,1/h);gl.uniform1f(l.dt,dt);gl.bindFramebuffer(gl.FRAMEBUFFER,targets[5]);draw(gl);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 }};
}
