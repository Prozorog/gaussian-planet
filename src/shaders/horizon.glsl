uniform sampler2D scene,depth;
uniform vec4 centre;
uniform float tilt,fall,jet,dim;
uniform int localInk;
out vec4 frag;

vec3 behind(vec2 p,vec3 fallback) {
  if(p.x<0.||p.y<0.||p.x>1.||p.y>1.)return firmament(p);
  float d=texture(depth,p).r;
  if(d<centre.w-.000008)return fallback;
  if(d>=1.)return firmament(p);
  return texture(scene,p).rgb;
}
void main(){
  vec2 aspect=vec2(viewport.x/viewport.y,1.), q=(uv-centre.xy)*aspect/centre.z;
  float r=length(q),a=atan(q.y,q.x);
  vec3 original=texture(scene,uv).rgb;
  if(fall>.001){
    vec2 j=(uv-.5)*aspect;
    float phase=atan(j.y,j.x);
    float rr=length(j);
    float ring=.71*(1.-fall)+.09;
    float veil=.34*(1.-fall), l=(rr-ring)/max(.05,veil);
    float n=noise(vec2(cos(phase),sin(phase))*8.+time*.35);
    if(abs(l)<1.&&rr>.008){
      float radial=pow(clamp((l+1.)*.5,0.,1.),2.4)*1.16;
      vec2 p=.5+vec2(cos(phase),sin(phase))*radial/aspect;
      vec3 bend=texture(scene,clamp(p,vec2(0.),vec2(1.))).rgb;
      float inkBand=floor((1.-abs(l))*(.3+.7*fall)*7.);
      float etched=lineAt(l*4.+.25*n,1.26);
      vec3 color=mix(ink(8,1.+inkBand),bend,.76*(1.-fall));
      frag=vec4(mix(color,vec3(1.,.95,.77),max(etched*.40,float(abs(l)<.073)*fall)),1.);return;
    }
    frag=vec4(vec3(0.),1.);return;
  }
  float here=texture(depth,uv).r;
  if(r<.992){frag=vec4(0.,0.,0.,1.);return;}
  if(r>6.1||r>2.38&&here<centre.w-.000008){frag=vec4(original*(1.-.51*dim),1.);return;}
  float displacement=1.44/max(1.,r*r)*(1.-smoothstep(3.9,6.,r));
  vec2 samplePoint=centre.xy+q*(1.-displacement)*centre.z/aspect;
  vec3 bent=behind(samplePoint,original);
  float pen=1.25*viewport.y/1080., px=max(.001,length(vec2(dFdx(r),dFdy(r))))*pen;
  if(r<1.067+px){
    vec2 mirror=centre.xy-q*(.44+.71*(r-1.))*centre.z/aspect;
    vec3 echo=behind(mirror,bent);
    float rim=(1.-smoothstep(px*.50,px*1.65,abs(r-1.018)));
    float accent=(1.-smoothstep(px*.3,px*1.3,abs(r-1.063)));
    vec3 cream=vec3(1.,.91,.70);
    frag=vec4(mix(max(bent,echo*1.18),cream,max(rim*.96,accent*.45)),1.);return;
  }
  if(jet>.001&&abs(q.y)>1.19){
    float y=abs(q.y), thrust=clamp(jet*2.8,0.,1.),tip=1.32+thrust*(4.4-jet*.22);
    float centerline=.17*sin(y*.64+time*2.2)*max(0.,y-1.45);
    float breadth=(.13+.038*y)*(1.-.44*jet/4.);
    float crossJet=abs(q.x-centerline);
    if(y<tip&&crossJet<breadth){
      float v=.24+.49*(1.-crossJet/breadth)+.17*sin(y*15.+time*15.+q.x*5.);
      if(v>.27){frag=vec4(engraved(v,y>2.6?8:6,y*1.1,1.),1.);return;}
    }
  }
  if(r<4.35){
    float stretch=.11+clamp(tilt,0.,1.)*.69;
    float rise=.88*sqrt(max(0.,1.-q.x*q.x/13.));
    float nearR=length(vec2(q.x,q.y/stretch)),rad=nearR;
    float elevated=length(vec2(q.x,(q.y-rise)/max(.16,stretch*.63)));
    float below=length(vec2(q.x,(q.y+rise*.78)/max(.14,stretch*.43)));
    float rear=smoothstep(.10,.85,q.y)*smoothstep(1.08,1.49,elevated);
    float echo=smoothstep(.35,.77,-q.y)*smoothstep(2.45,3.64,nearR)*.73;
    rad=mix(rad,elevated,rear);rad=mix(rad,below,echo);
    if(rad>1.11&&rad<3.66){
      vec2 f=foldInk(q*2.1+vec2(time*.21,-time*.016),time*.21);
      float n=noise(f*1.12),m=noise(f*4.4);
      float band=rad*19.+2.4*a+2.4*n+.44*m-time*.61;
      float twist=.56+.23*sin(band)+.12*n+.069*m-.16*echo;
      twist-=max(0.,rad-2.95)*.51;
      if(twist>.23){
        int palette=rad<1.56+.19*n?7:rad<2.37+.24*n?0:localInk;
        vec3 painted=engraved(twist,palette,.63*n+.38*m,1.);
        painted*=1.-.14*step(.49,rear)-.22*step(.46,echo);
        frag=vec4(painted,1.);return;
      }
    }
  }
  frag=vec4(bent*(1.-.51*dim),1.);
}
