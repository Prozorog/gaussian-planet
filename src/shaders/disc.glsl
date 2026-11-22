in vec3 local,world;uniform sampler2D plate;uniform vec4 bodies[10],bodyInk[10];uniform int count,layer,starHue;uniform float epoch,guides,vortexAge;uniform vec2 vortex;uniform bool probe;out vec4 frag;
uniform float inside;
int family(float n){float u=fract(n);return u<.24?4:u<.49?5:u<.75?3:u<.968?2:6;}
void main(){vec2 p=world.xz;float rr=length(p);if(rr>15.5)discard;vec2 coord=p/32.+.5;vec4 paint=texture(plate,coord),d=texture(dye,coord);vec2 flow=texture(velocity,coord).rg;vec2 w=p+paint.rg-d.ba*24.-flow*.61;float L=float(layer),t=time*.10;w+=L*vec2(.22,-.26);w=rot(.17*epoch+.032*sin(t*.22))*w;
 if(vortexAge>0.){vec2 delta=p-vortex;float h=exp(-dot(delta,delta)/(.36+vortexAge*.32));w+=rot(h*(vortexAge*3.3+1.2))*delta-delta;}
 vec2 q=w*.65+.42*noise2(w*.47+vec2(t*.028,epoch));q=roll(q+vec2(1.22,-.47),3.8);vec2 f=foldInk(q*.92+vec2(epoch*.62,t*.036),t);float a=atan(w.y,w.x),r=length(w);float spiral=a*2.+r*.91+1.16*noise(f*.68)+.46*noise(f*1.8)+L*.69;float ridge=.52+.37*sin(spiral)+.16*sin(spiral*2.1+.63*noise(f*2.));float island=noise(roll(f*4.6+.45*noise2(f*8.),4.));float val=ridge+.27*noise(f*1.77)+.116*island+.045*noise(f*14.)-.23-max(0.,r-9.2)*.18;float hue=a/TAU+r*.097+.115*noise(f*1.2)+L*.064+epoch*.13;int id=r<2.45+.56*noise(f)?0:family(hue);float comb=.54*noise(f*3.)+.23*island+.33*noise(q*8.5-d.ba*18.);
 val-=.07+max(0.,r-8.3)*.085+.45*(1.-smoothstep(1.85,3.1,rr));
 if(life.x>.001){
   float rp=rr+.048*sin(a*6.+time*.22)+.060*noise(f*1.3);
   float lap=cos(6.95*rp+1.35);
   float knots=sin(3.8*r+a*7.+1.42*noise(f*2.1))*.078*life.x;
   float drum=.274+.40*lap+.17*noise(f*1.3)+.102*island+knots;
   drum-=max(0.,rr-9.3)*.19+.43*(1.-smoothstep(.45,1.3,rr));
   val=mix(val,drum,life.x);
   if(life.x>.49)id=rr<2.4?1:family(a/TAU+.023*r+.14*noise(f*.74)+L*.048);
   comb+=lap*1.54*life.x;
 }
 if(life.y>.001){
   float wind=sin(spiral*.72-time*.93+noise(f*1.64)*1.72);
   val+=life.y*(.085+.16*wind-.034*max(0.,rr-9.));
   if(life.y*(.83+.36*sin(spiral*.52)+.19*noise(f))>.60)
     id=wind>.63?6:(wind<-.22?1:0);
   comb+=life.y*wind*.77;
 }
 val-=.39*life.z+.30*life.w;
 if(layer!=0){if(paint.b>.45)discard;val-=layer>0?.54:.30;val*=.80;}float coverage=val;val+=layer==0?.15:.24;
 if(layer==0){float guide=0.;for(int i=0;i<10;i++){if(i>=count)break;vec4 b=bodies[i];vec2 dir=normalize(b.xy);float along=dot(p-b.xy,dir),lat=abs(dot(p-b.xy,vec2(-dir.y,dir.x)));if(along>0.&&along<2.8*b.z&&lat<b.z*(1.+.18*along))val-=lat<b.z*.68?.28:.15;float orbit=abs(rr-b.w)/max(.0001,fwidth(rr));guide=max(guide,(1.-smoothstep(.20,1.25,orbit))*step(.33,fract(a*21.)));}
  if(d.r>.025){float dyeValue=sqrt(d.r)*1.32+.14*noise(f*3.);if(dyeValue>val){val=dyeValue;coverage=dyeValue;id=int(round(texelFetch(dye,ivec2(coord*vec2(textureSize(dye,0))),0).g));}}
  int tag=int(round(texelFetch(plate,ivec2(coord*vec2(textureSize(plate,0))),0).b));if(tag>0){id=tag-1;val=paint.a+.028*noise(f*4.);coverage=1.;}
  if(vortexAge>0.){vec2 v=p-vortex;float dst=length(v),width=.25+.33*vortexAge,phase=atan(v.y,v.x)*2.+dst*21.-time*4.;if(dst<width&&sin(phase)>.04+dst/width*.52){id=family(hue+.22*floor(dst*8.));val=.62+.22*sin(phase);coverage=1.;}}
  if(probe){frag=vec4(float(id),floor(clamp(val,0.,.999)*9.),0.,255.)/255.;return;}if(guide*guides>.1){frag=vec4(mix(engraved(val,id,comb,1.),vec3(.61,.47,.48),guide*.56),1.);return;}}
 if(coverage<.032||val<.10||floor(clamp(val,0.,.999)*9.)<floor(inside*9.))discard;float seam=step(.5,fwidth(float(id)));vec3 col=engraved(val,id,comb,1.);col=mix(col,ink(id,7.),seam*.62);if(starHue==8)col*=vec3(.84,.95,1.);if(starHue==0)col*=vec3(1.,.81,.93);
 if(life.w>.6&&layer==0&&paint.b<.5&&d.r<.08){
   float faded=clamp(2.+floor(val*4.),2.,4.);
   col=mix(ink(id,faded)*.49,ink(id,5.)*.61,lineAt(spiral*.77+comb*.16,1.1)*.81);
 }
 col*=1.-.46*life.z;
 frag=vec4(col,1.);
}
