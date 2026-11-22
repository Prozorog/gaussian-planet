import {program,mapTexture,texture,draw} from './gl.js';
const transport=`uniform sampler2D pos,flow;uniform float dt,time;out vec4 result;void main(){vec4 p=texture(pos,uv);vec2 v=texture(flow,p.xz/32.+.5).rg;float r=max(.3,length(p.xz));p.xz+=dt*(v*26.+vec2(-p.z,p.x)*(.019+.035/r));p.y+=.026*sin(time*.4+p.w*90.)*dt;if(r>15.8)p.xz*=.94;result=p;}`;
const vert=`#version 300 es
precision highp float;uniform mat4 vp;uniform sampler2D pos,paper,inks,bands;uniform int mode;uniform float time,age,size,pixel,hue,second,seed,inside;uniform vec3 center,eye;out vec2 uv;out vec3 pigment;out vec4 droplet;flat out int inkID;
float hash(float x){return fract(sin(x*7.133)*4131.135);}
void main(){int i=gl_VertexID;float f=float(i);vec3 p;float sz;vec3 col;uv=vec2(0);if(mode==0){vec4 pt=texelFetch(pos,ivec2(i%192,i/192),0);p=pt.xyz;ivec2 stamp=ivec2(round(textureLod(bands,p.xz/32.+.5,0.).rg*255.));col=texelFetch(inks,ivec2(min(8,stamp.y+1),stamp.x),0).rgb;sz=1.+2.*pt.w*pt.w;}
 else if(mode==1){vec4 g=texelFetch(paper,ivec2(i%256,(i/256+134)%256),0);float a=(f*.618034+g.x*.015)*6.283185,b=g.y*2.-1.,h=sqrt(1.-b*b);p=vec3(cos(a)*h,b,sin(a)*h)*(22.+19.*mod(f,3.));col=mix(vec3(.94,.88,.83),vec3(1.,.58,.19),step(.85,g.z))*(.45+.55*g.x)*(.89+.11*sin(time*.5+f));sz=.9+1.8*pow(g.w,3.);}
 else{float a=hash(f+seed)*6.28318,u=hash(f*1.37+seed),v=hash(f*2.7+seed);vec3 dir=vec3(cos(a),v*.99-.12,sin(a));p=center+dir*(.12+size*(1.-exp(-age*2.7))*(.49+1.7*u));p.y-=age*age*.32;col=texelFetch(inks,ivec2(int(4.+4.*v),int(u>.5?hue:second)),0).rgb;sz=(3.+3.6*u)*(1.-smoothstep(.55,2.4,age));}
 droplet=vec4(0.);inkID=0;
 if(mode==0&&inside>0.){
   float dist=length(p-eye),k=clamp(1.8/max(.04,dist),0.,24.);
   vec4 pt=texelFetch(pos,ivec2(i%192,i/192),0);sz=mix(sz,min(24.,sz*(1.+k*2.4)),inside);
   ivec2 tag=ivec2(round(textureLod(bands,p.xz/32.+.5,0.).rg*255.));
   inkID=tag.x;droplet=vec4(sz,pt.w,clamp((dist-.04)/.105,0.,1.),max(2.,float(tag.y)));
 }
 gl_Position=vp*vec4(p,1.);gl_PointSize=max(.5,sz*pixel);pigment=col;}`;
const frag=`in vec3 pigment;in vec4 droplet;flat in int inkID;uniform sampler2D inks;out vec4 frag;
void main(){vec2 p=gl_PointCoord-.5;float r=length(p);if(r>.5)discard;
 if(droplet.x>3.){
  ivec2 b=ivec2(gl_FragCoord.xy)&3;const int pattern[16]=int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5);
  if(floor(droplet.z*8.)*2.<=float(pattern[b.x+b.y*4]))discard;
  float wave=p.y*2.8+.40*sin(p.x*8.+droplet.y*12.)+.24*sin(p.x*16.+p.y*3.);
  float stepInk=clamp(droplet.w+floor(2.*sin(wave*4.))+1.,1.,7.);
  if((.5-r)*droplet.x<1.15)stepInk=min(8.,stepInk+2.);
  frag=vec4(texelFetch(inks,ivec2(int(stepInk),inkID),0).rgb,1.);
 }else frag=vec4(pigment*(r>.38?.74:1.),1.);}`;
export function particles(gl,rand){const P=program(gl,transport,'Dust transport'),D=program(gl,frag,'Mica and stars',vert),w=192,h=160,ts=[],fs=[],initial=new Float32Array(w*h*4);for(let i=0;i<w*h;i++){const a=rand()*Math.PI*2,r=Math.sqrt(rand())*14.8;initial.set([r*Math.cos(a),(rand()+rand()-1)*2.8,r*Math.sin(a),rand()],i*4);}for(let i=0;i<2;i++){const t=mapTexture(gl,w,h,gl.RGBA32F);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,w,h,gl.RGBA,gl.FLOAT,initial);ts.push(t);const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);fs.push(f);}gl.bindFramebuffer(gl.FRAMEBUFFER,null);let index=0;
 const l=D.use();gl.uniform1i(l.pos,0);gl.uniform1i(l.paper,4);gl.uniform1i(l.inks,5);gl.uniform1i(l.bands,9);
 return {step(dt,time,flow){const l=P.use();texture(gl,0,ts[index]);texture(gl,1,flow);gl.uniform1i(l.pos,0);gl.uniform1i(l.flow,1);gl.uniform1f(l.time,time);gl.uniform1f(l.dt,dt);gl.bindFramebuffer(gl.FRAMEBUFFER,fs[1-index]);gl.viewport(0,0,w,h);draw(gl);index=1-index;gl.bindFramebuffer(gl.FRAMEBUFFER,null);},
 draw(s,c,mode,evt){D.use();texture(gl,0,ts[index]);gl.uniformMatrix4fv(l.vp,false,c.matrix);gl.uniform3fv(l.eye,c.eye);gl.uniform1f(l.inside,c.inside);gl.uniform1f(l.time,s.t);gl.uniform1f(l.seed,evt?evt.seed:s.epoch);gl.uniform1f(l.pixel,Math.min(1.65,gl.drawingBufferHeight/1080));gl.uniform1i(l.mode,mode);if(evt){gl.uniform3f(l.center,evt.x,.24,evt.z);gl.uniform1f(l.age,s.t-evt.at);gl.uniform1f(l.size,evt.size);gl.uniform1f(l.hue,evt.id);gl.uniform1f(l.second,evt.second);}gl.drawArrays(gl.POINTS,0,mode===0?(s.low?20000:w*h):mode===1?40000:180);}};
}
