import {program,texture,mapTexture,draw} from './gl.js';
export const SPAN=32;
// RG is displacement of the original print, B is a categorical ink (+1), A its tonal value.
const stamp=`uniform sampler2D previous;uniform vec4 stroke;uniform vec4 brush;out vec4 result;
void main(){vec2 p=(uv-.5)*32.,a=stroke.xy,b=stroke.zw,delta=p-b,src=p;float r=length(delta),size=brush.y;int kind=int(brush.x);
 if(kind==4){vec4 prior=texture(previous,uv);float bitten=size*(.88+.12*sin(atan(delta.y,delta.x)*7.));if(r<bitten)prior.ba=vec2(0.);result=prior;return;}
 if(kind==0){float added=size*size-brush.w*brush.w;if(r<size&&brush.w==0.){float u=r/size;result=vec4(0,0,brush.z+1.,.53+.20*cos(u*14.)+.075*sin(atan(delta.y,delta.x)*3.+u*15.)*u+.11*u);return;}float rr=r<size?r*brush.w/size:sqrt(max(0.,r*r-added));src=b+delta*(rr/max(.00001,r));}
 else if(kind==3){float ang=brush.w*exp(-r*r/(size*size));src=b+mat2(cos(ang),sin(ang),-sin(ang),cos(ang))*delta;}
 else{vec2 d=b-a;float len=max(length(d),.00001);vec2 dir=d/len;vec2 n=vec2(-dir.y,dir.x);float along=dot(p-a,dir),crossing=dot(p-a,n);float l=clamp(along,0.,len),end=along-l;float influence=0.;if(kind==2){for(int i=-3;i<=3;i++){float t=crossing-float(i)*size*.30;influence+=exp(-(t*t+end*end*.24)/(size*size*.012));}}else{influence=exp(-(crossing*crossing+end*end)/(size*size));}src-=dir*min(1.5,len)*influence*.93;}
 vec2 q=clamp(src/32.+.5,0.,1.);vec4 old=texture(previous,q);old.b=texelFetch(previous,clamp(ivec2(q*vec2(textureSize(previous,0))),ivec2(0),textureSize(previous,0)-1),0).b;result=vec4(old.rg+src-p,old.ba);}`;
export function createPrint(gl){const size=896,P=program(gl,stamp,'Ebru plate'),ts=[],fs=[];let i=0;
 for(let j=0;j<2;j++){ts.push(mapTexture(gl,size,size,gl.RGBA16F,null,gl.LINEAR));fs.push(gl.createFramebuffer());gl.bindFramebuffer(gl.FRAMEBUFFER,fs[j]);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,ts[j],0);}gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 return {get image(){return ts[i]},clear(){for(const f of fs){gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);}gl.bindFramebuffer(gl.FRAMEBUFFER,null);},
 stamp(kind,a,b,radius,id,previous=0){
  gl.disable(gl.DEPTH_TEST);gl.bindFramebuffer(gl.FRAMEBUFFER,fs[1-i]);gl.viewport(0,0,size,size);const l=P.use();texture(gl,0,ts[i]);gl.uniform1i(l.previous,0);gl.uniform4f(l.stroke,...a,...b);gl.uniform4f(l.brush,kind,radius,id,previous);draw(gl);i=1-i;gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 }};
}
