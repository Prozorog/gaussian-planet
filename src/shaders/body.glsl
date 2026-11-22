in vec3 world,local;uniform vec3 eye,center;uniform int kind,pass,ids[3],starHue;uniform float spin,impact,radius,hasRing,charge,chime;uniform vec4 marks[12];uniform vec4 markInfo[12];uniform int markCount;out vec4 frag;
float volume(vec3 p){float z=floor(p.z),f=fract(p.z);return mix(noise(p.xy+z*vec2(19,37)),noise(p.xy+(z+1.)*vec2(19,37)),f*f*(3.-2.*f));}
vec3 marble(vec3 p){p+=.69*vec3(volume(p),volume(p+13.),volume(p+37.));p+=.29*vec3(volume(p*2.1+7.),volume(p*2.1-19.),volume(p*2.1+31.));return p+.096*vec3(volume(p*6.1),volume(p*6.1+16.),volume(p*6.1+26.));}
void main(){vec3 n=normalize(local),view=normalize(eye-world),light=normalize(-world);float facing=max(0.,dot(n,view)),lit=dot(n,light);int id=ids[0];vec3 col;
 if(pass==3){
  float r=length(local.xy)*2.15,a=atan(local.y,local.x);if(r<1.22||r>1.97)discard;
  float strands=clamp(radius*viewport.y/max(1.,length(eye-center))*.19,8.,47.);float phase=(r-1.22)*strands+.19*sin(a*4.+r*6.+time*.15);float line=lineAt(phase,1.38);if(line<.16)discard;
  vec3 to=world-center;float along=dot(to,light);bool shadow=along<0.&&length(to-along*light)<radius/2.15;float k=shadow?1.:4.+floor(3.8*grain(vec2(r*40.,7.)).r)+step(.67,abs(dot(light,normalize(vec3(-.241,.900,-.363)))));
  frag=vec4(ink(id,k)*(.65+.35*line),1.);return;
 }
 if(pass==4){float u=local.x,w=local.y;float v=.51+.25*sin(w*9.+u*11.+1.4*noise(vec2(u*14.,time*.14)))+.11*noise(vec2(u*47.,w*2.));frag=vec4(engraved(v,id,w*.5,1.),1.);return;}
 if(pass==2){float eclipse=smoothstep(.64,.965,dot(normalize(center-eye),normalize(-center)));float rim=1.-smoothstep(.04,.37,facing);if(rim<.01)discard;float a=atan(n.z,n.x),waves=sin(a*11.+n.y*14.+time*.4);float v=.36+.23*max(0.,lit)+.16*rim+.06*waves;float iso=lineAt(facing*12.+.24*waves,1.2);float strength=max(eclipse,clamp(.37+lit*.65,.16,1.));col=ink(id,3.+floor(v*4.)+iso*2.);if(eclipse>.55&&rim>.67)col=ink(id,8.);frag=vec4(col,(.18+.69*rim+.25*iso)*strength);return;}
 vec3 surf=n;surf.xz=rot(spin+float(kind)*.68)*surf.xz;float v,comb;vec3 f=marble(surf*(kind==0?4.8:2.7));float big=volume(f*1.4),mid=volume(f*4.3),tiny=volume(f*11.7);comb=.51*mid+.20*tiny;
 if(kind==0){
   vec2 cell=foldInk(f.xy*2.4+surf.z*vec2(4.,11.),time*.10);
   float walls=abs(noise(cell*1.48)+.36*noise(cell*3.7));
   v=.31+.32*big+.19*mid+.075*tiny+.24*(1.-smoothstep(.035,.24,walls))+.34*pow(1.-facing,2.);
   if(life.y>.001){
     vec3 convection=marble(surf*1.28+vec3(time*.007,0.,0.));
     float slow=volume(convection*1.27),tubes=volume(convection*3.2);
     float furnaces=.51+.31*slow+.105*tubes+.045*mid+.205*(1.-facing);
     v=mix(v,furnaces,life.y);
   }
   v-=.20*life.x;
   if(life.y>.35||life.x>.42)id=1;
   if(life.z>.66||life.w>.22){id=8;v=.73+.12*mid+.10*tiny;}
   col=engraved(v,id,comb+.24*noise(cell*4.),1.);
   float edge=facing+.048*mid+.026*tiny;
   float rim=1.-smoothstep(.205,.285+.035*charge,edge);
   vec3 limb=life.z>.66||life.w>.22?vec3(.92,.98,1.):life.y>.43||life.x>.62?ink(1,7.):vec3(1.,.968,.76);
   col=mix(col,limb,rim*(1.-life.x*.42));
 }
 else{for(int i=0;i<12;i++){if(i>=markCount)break;vec4 m=marks[i],info=markInfo[i];if(info.y>0.){float d=distance(surf,m.xyz);float push=exp(-d*d/(m.w*m.w));f+=vec3(info.z,0.,info.w)*push*2.4;big=volume(f*1.4);mid=volume(f*4.3);}}if(kind==1)v=.28+.67*exp(-abs(big+.25*mid)*5.)+.14*mid;else if(kind==4){vec2 st=turn(surf.xy,vec2(.24,-.12),.37,6.2);float lat=st.y*11.+2.25*big+.54*mid+.14*tiny;v=.54+.19*sin(lat)+.12*sin(lat*2.4)+.15*big;}else if(kind==2)v=.56+.30*big+.18*mid+.16*exp(-abs(big+.25*mid)*9.);else v=.56+.20*sin(surf.y*(kind==3?12.:8.)+4.1*big+.9*mid)+.21*big+.11*mid+.046*tiny;
  if(ids[1]!=id&&sin(v*14.+big*3.)>.10)id=ids[1];else if(ids[2]!=id&&big<-.24)id=ids[2];for(int i=0;i<12;i++){if(i>=markCount)break;vec4 m=marks[i];float d=distance(surf,m.xyz)/m.w;if(markInfo[i].y==0.&&d<1.){id=int(markInfo[i].x);v=.58+.20*cos(d*16.)+.09*mid;}}
  vec3 rn=normalize(cross(vec3(.966,.259,0.),vec3(-.094,.351,.932)));vec3 off=world-center;float t=-dot(off,rn)/dot(light,rn);float rr=length(off+t*light)/radius;float shadow=hasRing>.5&&t>0.&&rr>1.24&&rr<1.94?2.:0.;float stepLight=lit<-.53?-3.:lit<-.08?-2.:lit<.14?0.:lit<.54?1.:2.;v=clamp(v+(stepLight-shadow+chime)/9.,.014,.985);col=engraved(v,id,comb,1.);float term=1.-smoothstep(.003,.009+fwidth(lit),abs(lit+.08));col=mix(col,ink(id,floor(v*9.)+2.),term*.9);if(starHue==8&&lit>.4&&v>.69)col=mix(col,vec3(.58,1.,1.),.21);if(starHue==0&&lit>.4)col*=vec3(1.,.79,.87);float limb=1.-smoothstep(.06,.17+impact*.13,facing);col=mix(col,mix(ink(id,8.),vec3(1.,.96,.8),.74),limb*max(step(.05,lit),impact));}
 if(finePaper&&kind!=0)col=mix(col,pooled(col,id,v*5.8+comb*.73,.095),smoothstep(.08,.20,facing));
 if(kind!=0&&life.w>.12)col*=1.-.79*ceil(life.w*5.)/5.;
 frag=vec4(col,1.);
}
