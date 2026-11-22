in vec3 local,world;uniform float charge,scaleR,tintMix;uniform int tint,starHue;out vec4 frag;
void main(){vec2 q=local.xy*4.2;float rr=length(q);if(rr<.93||rr>4.2)discard;vec4 dyeV=texture(dye,uv);vec2 vel=texture(velocity,uv).xy;vec2 k=q-dyeV.ba*4.-vel*.041;float t=time*.19;
 float rim=1.-smoothstep(.008,.025,abs(rr-1.));k+=smoothstep(1.,1.35,rr)*(.105*noise2(q*3.5+t*.09)+.041*noise2(q*11.-t*.17));float a=atan(k.y,k.x),r=length(k);float plume=pow(max(0.,dot(normalize(k),normalize(vec2(.82,-.57)))),5.);float h=(r-1.)/(.76+1.78*plume+charge*.22);float x=a*28./TAU;vec2 p=vec2(x+.53*sin(3.*a+t*.21)+h*.85+.23*sin(7.*a-.3*t),h*3.1+.27*sin(6.*a+t*.21)+.13*sin(11.*a-.2*t));float base=floor(p.x);
 for(int j=-1;j<=1;j++){float b=base+float(j),ph=b*TAU/28.;p=turn(p,vec2(b+.48+.18*sin(ph*3.+.2*t),.97+.48*sin(ph*7.-.3*t)),.57,5.6*sin(ph*7.+.9+.23*t));}vec2 u=vec2(cos(p.x*TAU/28.),sin(p.x*TAU/28.));vec2 f=foldInk(u*(6.+p.y*.56)+vec2(p.y*.71,-p.y*.43),t);vec2 g=roll(f*2.8+.38*noise2(f*4.),5.9);vec2 micro=roll(q*31.+.9*noise2(q*11.+t*.04),5.1);
 float scallop=.21*sin(p.x*TAU+sin(a*3.)+p.y*.68-.23*t)+.09*sin(p.x*TAU*2.+p.y);
 vec2 knot=roll(q*7.4+noise2(q*3.3)*.84+t*.019,5.8);float fray=noise(knot*1.7);
 float raw=.88-.30*p.y+scallop+.16*noise(f)+.105*noise(g)+.064*noise(micro)+.12*fray;float v=raw>0.?pow(raw,1.49):raw;
 v=mix(.96+.04*fray,v,smoothstep(.0,.085,rr-1.));float comb=.41*noise(f*3.)+.20*noise(g*2.8)+.16*noise(micro*1.5);
 if(v<-.065)discard;float lace=lineAt(v*33.+comb,1.15);if(v<0.&&lace<.22)discard;int id=starHue==8?8:0;if(tintMix>0.&&noise(f*.55)+tintMix>.35)id=tint;
 vec3 col=engraved(v,id,comb,1.);if(v<0.)col=mix(vec3(.095,.036,.084),vec3(.44,.21,.28),lace);if(starHue==8)col=ink(8,floor(clamp(v,0.,.99)*8.));col=mix(col,vec3(1.,.97,.78),rim);frag=vec4(col,1.);
}