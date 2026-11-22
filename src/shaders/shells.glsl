uniform vec3 eye,right,up,back;
uniform vec2 shift;
uniform mat4 vp;
uniform float evolution;
out vec4 frag;

vec3 axes(vec3 p){
  p.xy=rot(.34)*p.xy;
  p.yz=rot(-.19)*p.yz;
  return p/vec3(1.34,.86,1.0);
}
void main(){
  vec2 ndc=uv*2.-1.-shift;
  vec3 ray=-back+.3249197*(right*ndc.x*viewport.x/viewport.y+up*ndc.y);
  vec3 o=axes(eye),d=axes(ray);
  float A=dot(d,d), B=dot(o,d), C=dot(o,o);
  const float radii[4]=float[4](3.02,4.12,5.33,6.56);
  const int pigments[4]=int[4](3,4,6,5);
  float expansion=.78+.23*smoothstep(2.13,3.15,evolution)+.025*sin(time*.23)+.20*life.w;
  vec3 position=vec3(0.);
  float nearest=1.e5,value=0.,comb=0.,filament=0.;
  int pigment=0;
  for(int i=3;i>=0;i--){
    float k=float(i),r=radii[i]*expansion;
    float discriminant=B*B-A*(C-r*r);
    if(discriminant<=0.)continue;
    float chord=sqrt(discriminant),t=(-B-chord)/A;
    bool inner=t<.045;
    if(inner)t=(-B+chord)/A;
    if(t<.045||t>=nearest)continue;
    vec3 n=(o+t*d)/r;
    float edge=chord/(r*sqrt(A));
    float theta=atan(n.y,n.x);
    vec2 q=n.xy*4.5+n.z*vec2(2.9,-2.7)+k*8.51;
    vec2 f=foldInk(roll(q*.86,4.1),time*.21);
    float broad=noise(f*.83),middle=noise(f*2.65),tiny=noise(f*8.2);
    float bend=edge+.095*broad+.063*middle+.021*tiny;
    float wrap=theta*14.+5.6*edge+2.7*broad+1.02*middle+.28*tiny;
    float polar=smoothstep(.12,.55,length(n.xy));
    float rib=.52+.48*sin(wrap)*polar;
    float exposure=inner?.69+.08*sin(time*.49+k):1.;
    float reach=(.28+.46*life.z+float(i==0)*.11*life.z)*exposure;
    if(bend>reach+.067*middle||bend<-.061)continue;
    float lamina=sin(26.0*bend+2.9*broad+1.05*middle+time*.37-k*.51);
    float fret=.12*middle+.070*tiny;
    float strand=.48+.25*lamina+.135*broad+fret+.18*rib;
    if(strand<.24+.34*(1.-life.z)-.12*life.w)continue;
    if(life.w>.12&&sin(wrap*.5+bend*21.)<-.6+1.37*life.w)continue;
    nearest=t;position=eye+ray*t;value=strand;
    comb=.68*middle+.32*tiny+rib*.43;filament=(wrap*polar+8.*bend*(1.-polar))/6.283185;
    pigment=pigments[i];
  }
  if(nearest<99999.){
    float washed=clamp(value-.23*life.w,.025,.86);
    vec3 col=engraved(washed,pigment,comb,1.);
    col=mix(col,ink(pigment,floor(washed*9.)+2.),lineAt(filament,1.15)*.68);
    if(life.w>.48)col=ink(pigment,clamp(2.+floor(value*3.),2.,4.))*.70;
    vec4 clip=vp*vec4(position,1.);
    gl_FragDepth=.5+.5*clip.z/clip.w;
    frag=vec4(col,1.);return;
  }
  if(life.w>.15){
    float t=-dot(eye,ray)/dot(ray,ray);
    if(t>0.){
      vec3 p=eye+ray*t;
      vec2 q=vec2(dot(p,right),dot(p,up));
      float r=length(q),a=atan(q.y,q.x);
      float warp=r+.14*noise(q*3.3)+.05*noise(q*9.);
      float broken=sin(5.*a+3.7*warp+noise(q*1.4)*1.5);
      if(r<1.48&&broken>.25&&warp>.29){
        float lane=lineAt(8.7*warp+.54*broken,1.30);
        if(lane>.45){
          gl_FragDepth=.9996;frag=vec4(lane>.73?vec3(.86,.96,1.):ink(8,4.),1.);return;
        }
      }
    }
  }
  discard;
}
