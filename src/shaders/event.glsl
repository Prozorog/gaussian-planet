in vec3 local,world;uniform vec4 effect;uniform int eventType,first,second;uniform float age;out vec4 frag;
void main(){vec2 p=local.xy;float r=length(p);if(r>1.35)discard;vec2 f=foldInk(p*3.6+effect.w,time*.27);float n=noise(f*2.),m=noise(f*5.7),a=atan(p.y,p.x);float v;int id=first;
 if(eventType==6){
   float aft=.31-dot(p,effect.xy),across=dot(p,vec2(-effect.y,effect.x));
   if(aft<.06||aft>1.14)discard;
   float wave=abs(across)-.41*aft+.019*sin(aft*13.-time*2.)+.013*n;
   float lines=max(lineAt(wave-.036,1.2),lineAt(wave+.035,1.)*.66);
   if(abs(wave)>.075||lines<.04)discard;
   float tail=smoothstep(.06,.24,aft)*(1.-smoothstep(.69,1.14,aft));
   vec3 wash=mix(ink(id,6.),vec3(.96,.90,.73),.60);
   frag=vec4(wash,lines*tail*effect.z*.84);return;
 }
 if(eventType==5){
   float crest=r+.035*n;
   float ring=max(lineAt(crest-.79,1.32),lineAt(crest-.68,1.3)*.57);
   if(ring<.04||r<.58||r>.90)discard;
   frag=vec4(mix(ink(id,7.),vec3(1.,.92,.70),.77),ring*(1.-age/2.6));return;
 }
 if(eventType==4){
   float filament=sin(p.x*41.+time*12.+.85*n+.49*m);
   float shape=1.-abs(p.y-.18*n);
   if(shape<.07+.18*p.x||p.x>1.)discard;
   v=.30+.43*shape+.145*filament+.085*m;
   vec3 col=engraved(v,filament>.5?id:second,.71*n+.24*m,1.);
   frag=vec4(col,1.);return;
 }
 if(eventType==3){float u=(r-effect.x)/(1.-effect.x);if(u<0.||u>1.)discard;
  float rim=max(1.-smoothstep(.0,fwidth(r)*1.4,abs(r-effect.x)),1.-smoothstep(.0,fwidth(r)*1.4,abs(r-1.)));
  float rib=lineAt(u*5.+.08*n,1.25);frag=vec4(ink(2,4.+floor(2.*sin(u*3.14159))+2.*rim),.16+.10*floor(2.9*sin(u*3.14159))+.43*max(rib,rim));return;}
 if(eventType==0){vec2 dir=effect.xy;float along=dot(p,dir),lat=dot(p,vec2(-dir.y,dir.x));float t=.5+.5*along;float w=effect.z*(.26+.85*t)+.018*n;lat+=w*.55*sin(t*12.-time*3.6)+w*n*.54;v=1.07-abs(lat)/max(.004,w)-max(0.,along-.53)*4.-max(0.,-along-.69)*3.+.15*m;if(v<.04)discard;}
 else if(eventType==2){float edge=.72+.062*n+.035*m;float delta=abs(r-edge);v=1.-delta/.19+.14*sin(a*13.+r*18.)+.10*m;if(v<.05)discard;if(sin(a*5.+n*3.+age*1.7)>.25)id=second;}
 else{float arms=.14*sin(a*9.+n*3.)+.10*sin(a*17.+m*2.);float shell=.54+arms+.13*n;v=.92-abs(r-shell)*4.+.20*m+.13*sin(r*41.+a*3.);if(v<.02)discard;if(sin(a*3.+r*12.+n*4.)>.10)id=second;}
 vec3 col=engraved(v,id,.51*m+.4*n,1.);if(eventType==0&&v>1.)col=vec3(1.,.96,.75);frag=vec4(col,1.-smoothstep(eventType==2?4.:1.35,eventType==2?5.1:2.35,age));}
