in vec3 local,world;
uniform vec3 eye,center,cloudSize;
uniform int surfaceID,pigment,markCount,starHue;
uniform bool picking;
uniform vec2 pickOffset;
uniform float inside,param,radius;
uniform sampler2D plate;
uniform vec4 markPosition[12],markState[12];
out vec4 frag;

float bayer(vec2 p){
  ivec2 n=ivec2(p)&3;
  const float a[16]=float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
  return (a[n.y*4+n.x]+.5)/16.;
}
int seaPigment(float f){
  float v=fract(f);
  return v<.24?3:v<.43?2:v<.66?5:v<.92?4:0;
}
void main(){
  bool cloud=surfaceID>5;
  float L=float(surfaceID-3),dist=length(world-eye),t=time*.10;
  float threshold=bayer(gl_FragCoord.xy+pickOffset);
  if(inside<threshold||dist<.034)discard;
  float v,comb,coverage,poolPhase;
  int id=pigment;
  vec2 p=world.xz;
  float footprint=max(length(dFdx(p)),length(dFdy(p)));
  // Omit unresolvable spatial frequencies before quantising the pigment.
  float middle=1.-smoothstep(.021,.095,footprint),fine=1.-smoothstep(.007,.039,footprint);
  if(cloud){
    if(floor(clamp((dist-.037)/.075,0.,1.)*8.)/8.<threshold)discard;
    vec3 n=normalize(local);vec2 q=vec2(n.x+.52*n.z,n.y+.61*n.z);
    q=q*2.37+param+radius*.79+vec2(.035*t,-.021*t);
    vec2 f=foldInk(q,t*.41);
    float a=noise(f*1.21),b=noise(f*3.7),c=noise(f*11.2);
    float veins=n.y*6.2+n.x*.96+2.9*a+.58*b+.14*c;
    v=.56+.22*sin(veins)+.14*a+.085*b+.041*c;
    v+=(dot(n,normalize(-world))>.18?.085:-.065);
    comb=.43*b+.19*c+.36*sin(veins*2.);coverage=1.;
    poolPhase=veins*.91+.66*b+.22*c;
    if(radius<.99&&a+.30*b<-.12)discard;
    if(sin(veins*1.3+a*2.)>.92)id=pigment==3?2:pigment==4?5:pigment;
  }else{
    float rr=length(p);if(rr>15.5)discard;
    vec2 uvw=p/32.+.5;
    vec4 dyeValue=texture(dye,uvw),paint=texture(plate,uvw);
    vec2 flow=texture(velocity,uvw).rg;
    vec2 q=rot(.39*L)*(p+paint.rg*.46-dyeValue.ba*17.-flow*.56);
    q=vec2(q.x*.71,q.y*.98)+vec2(L*3.13+t*.053,L*1.61-t*.032);
    vec2 broad=q+.67*noise2(q*.64)+.31*noise2(q*1.79)*middle;
    vec2 folded=roll(broad*.84+vec2(.34,.77),4.4);
    vec2 curls=foldInk(folded+L,t*.53);
    float a=noise(curls*.84),b=noise(curls*2.76)*middle,c=noise(curls*8.7)*fine;
    float phase=q.y*1.31+.68*q.x+3.4*a+.72*b+.18*c;
    float ribbon=sin(phase),small=sin(phase*2.04+1.2*a);
    coverage=.38+.39*ribbon+.18*a+.12*b+.055*c-.105*abs(L);
    // The low-density opening around the photosphere lets its own inks print through.
    coverage-=.56*(1.-smoothstep(1.45,3.1,rr));
    v=.51+.205*ribbon+.14*small+.15*b+.066*c+.075*a;
    float hue=q.x*.083+q.y*.047+.17*a+.07*b+L*.27;
    id=seaPigment(hue);
    if(rr<2.7+.46*a)id=fract(hue+.3)<.70?0:4;
    if(dyeValue.r>.23&&abs(L)<1.5){id=int(round(texelFetch(dye,ivec2(uvw*vec2(textureSize(dye,0))),0).g));v+=.06;coverage+=dyeValue.r*.4;}
    if(abs(L)<.5&&paint.b>.55){id=int(round(paint.b))-1;coverage=1.;v=paint.a+.055*b+.028*c;}
    comb=.53*b+.24*c+.25*sin(phase+.42*a);
    poolPhase=phase*1.29+1.53*b+.42*c;
  }
  for(int i=0;i<12;i++){
    if(i>=markCount)break;
    vec4 state=markState[i];if(int(state.x)!=surfaceID)continue;
    float age=max(0.,time-state.z),r=distance(world,markPosition[i].xyz);
    float edge=state.w>.5?age*1.19:1.33*(1.-exp(-age*3.3));
    if(r>edge+.08)continue;
    float coord=r/max(.015,edge),curl=noise(world.xz*4.2+world.y*2.6)*.16;
    if(state.w>.5){
      if(age>2.45||coord<.42)continue;
      float wave=sin((coord+curl*.08)*39.);
      if(wave>.13+age*.21){id=int(state.y);v=.67+.20*wave;coverage=1.;}
    }else{
      float ring=cos((coord+curl*coord*.14)*23.);
      if(coord<1.){if(ring>-.46)id=int(state.y);v=.57+.255*ring+.085*curl;coverage=1.;comb+=curl;poolPhase=coord*4.1+curl*.19;}
    }
  }
  if(coverage<.084)discard;
  if(picking){
    float n=floor(min(dist,63.999)*262144.);
    frag=vec4(floor(n/65536.),mod(floor(n/256.),256.),mod(n,256.),float(surfaceID))/255.;return;
  }
  float steps=step(3.3,dist)+step(6.8,dist)+step(10.4,dist);
  v=clamp(v-steps/9.-(!cloud&&abs(L)>1.5?.10:0.),.019,.969);
  vec3 col=pooled(engraved(v,id,comb,1.),id,poolPhase,cloud?.128:.124);
  if(starHue==8)col*=vec3(.87,.96,1.);if(starHue==0)col*=vec3(1.,.87,.91);
  frag=vec4(col,1.);
}
