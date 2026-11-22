uniform sampler2D scene,depth,plate;
uniform vec4 centre,well;
uniform float fall,jet,dim;
uniform bool alignedStar;
uniform int localInk;
out vec4 frag;

float bufferDepth(float distance){
  return (130.-4.55/max(.035,distance))/129.965;
}

vec3 behind(vec2 p) {
  if(any(lessThan(p,vec2(0.)))||any(greaterThan(p,vec2(1.))))return firmament(p);
  float d=texture(depth,p).r;
  if(d<centre.w-.000006||d>=1.)return firmament(p);
  return texture(scene,p).rgb;
}

vec4 accretion(vec2 p,vec3 horizontal,vec3 inward) {
  float r=length(p);
  if(r<1.03||r>4.34)return vec4(0.);
  float slip=2.45*log(r)-time*(.29+.9/(1.+r*r));
  vec2 spiralling=rot(slip)*(p/r);
  vec2 source=well.xy+well.z*r*(horizontal.xz*spiralling.x+inward.xz*spiralling.y);
  vec2 chart=source/32.+.5;
  vec4 wet=texture(dye,chart),paint=texture(plate,chart);
  vec2 stream=texture(velocity,chart).xy;
  vec2 ribbon=vec2(spiralling.x*3.6,spiralling.y*3.6)+vec2(r*.63,-.38*r);
  ribbon+=paint.xy*1.82-wet.ba*30.+stream*5.1;
  ribbon=turn(ribbon,vec2(1.20,-1.1),1.53,4.8);
  ribbon=foldInk(ribbon,time*.21);
  float broad=noise(ribbon*.62),curl=noise(ribbon*2.42),fine=noise(ribbon*9.7);
  float weave=dot(spiralling,vec2(2.43,-1.15))+r*.56+2.02*broad+.35*curl+.072*fine;
  float strand=sin(weave*2.64+.64*sin(r*2.1+2.9*curl));
  float outline=r+.31*broad+.18*curl;
  float boundary=outline-3.58-.28*sin(spiralling.x*4.+broad);
  float density=.46+.27*strand+.22*broad+.036*fine-.39*smoothstep(3.0,4.33,r);
  if(boundary>.02||density<.21||outline<.95)return vec4(0.);
  float heat=r+.36*strand+.28*curl;
  int id=localInk;
  if(wet.r>.073)id=int(round(texelFetch(dye,ivec2(chart*vec2(textureSize(dye,0))),0).g));
  int tag=int(round(texelFetch(plate,ivec2(chart*vec2(textureSize(plate,0))),0).b));
  if(tag>0)id=tag-1;
  if(heat<2.02)id=heat<1.47?7:0;
  else if(heat<2.45&&strand>.34)id=6;
  float value=.49+.22*strand+.11*curl+.062*fine+.16*(1.-smoothstep(1.12,2.48,r))+.13*wet.r;
  vec3 color=engraved(value,id,.68*curl+.49*fine,1.);
  color=pooled(color,id,weave*2.07,.110);
  return vec4(color,1.);
}

void main(){
  vec2 aspect=vec2(viewport.x/viewport.y,1.), q=(uv-centre.xy)*aspect/centre.z;
  float r=length(q);
  vec3 original=texture(scene,uv).rgb;
  if(fall>.001){
    vec2 j=(uv-.5)*aspect;
    float phase=atan(j.y,j.x), rr=length(j);
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
    frag=vec4(0.,0.,0.,1.);return;
  }
  if(r>5.15||well.w<.025){frag=vec4(original*(1.-.51*dim),1.);return;}
  float here=texture(depth,uv).r;
  bool foreground=here<centre.w-.000008;
  if(r<.995){
    vec2 px2=vec2(2.,2.)/viewport;
    bool solid=foreground&&texture(depth,uv-px2).r<centre.w&&texture(depth,uv+px2).r<centre.w;
    frag=vec4(solid?original*(1.-.51*dim):vec3(0.),1.);return;
  }

  // The source ray crosses the lens plane before returning to the sky print.
  // The negative branch produces the inverted image inside the Einstein ring.
  float turn=1.-smoothstep(3.25,4.48,r);
  vec2 sourceQ=q*(1.-turn*3.13/(r*r));
  vec2 samplePoint=centre.xy+sourceQ*centre.z/aspect;
  vec3 bent=foreground?original:r<4.48?behind(samplePoint):original;
  float pixels=1.27*viewport.y/1080.;
  float px=max(.00006,length(vec2(dFdx(r),dFdy(r))))*pixels;
  if(!foreground&&r<1.05+px){
    float rim=1.-smoothstep(px*.25,px*1.26,abs(r-1.007));
    frag=vec4(mix(bent*(1.-.38*dim),vec3(1.,.934,.756),rim*.97),1.);return;
  }

  vec3 normal=normalize(vec3(-.104,1.,.083));
  vec3 planeX=normalize(cross(normal,back)+vec3(.000001,0.,0.));
  vec3 planeY=normalize(cross(normal,planeX));
  vec2 across=normalize(vec2(dot(planeX,right),dot(planeX,up)));
  vec2 vertical=vec2(-across.y,across.x);
  float inclination=max(.076,abs(dot(normal,back)));
  vertical*=dot(planeY,right*vertical.x+up*vertical.y)<0.?-1.:1.;
  mat2 toDisc=transpose(mat2(across,vertical));
  vec2 planeUV=toDisc*q;
  // The back half rises on the very same sheet. Its projected height and
  // first derivative meet the near half at the two nodes of the disc.
  float wrap=smoothstep(-.055,.45,planeUV.y);
  float shoulders=sqrt(1.-clamp(pow(planeUV.x/4.4,2.),0.,1.));
  float lift=.51*pow(1.-inclination,1.48)*shoulders;
  vec2 direct=vec2(planeUV.x,planeUV.y/(inclination+wrap*lift));
  vec2 echo=toDisc*sourceQ;echo.y/=inclination+.20*lift;
  float discDepth=well.w+well.z*dot(direct.x*planeX+direct.y*planeY,-back);
  vec4 plateInk=vec4(0.),lowerInk=vec4(0.);
  bool starArc=alignedStar&&dot(bent,vec3(.2126,.7152,.0722))>.44;
  if(discDepth>.035&&here>=bufferDepth(discDepth)-.000009&&(!starArc||direct.y<-.44))
    plateInk=accretion(direct,planeX,planeY);
  if(!foreground&&!starArc&&planeUV.y<-.19&&echo.y<-.04&&turn>.45){
    lowerInk=accretion(-echo*vec2(.91,1.12),planeX,planeY);
    lowerInk.a*=smoothstep(.19,.50,-planeUV.y)*(1.-smoothstep(.29,.68,inclination));
  }
  vec3 color=bent*(1.-.51*dim);
  color=mix(color,lowerInk.rgb*.67,lowerInk.a*.87);
  color=mix(color,plateInk.rgb*(1.-.14*wrap),plateInk.a);

  if(!foreground&&jet>.001&&abs(q.y)>1.19){
    float y=abs(q.y), thrust=clamp(jet*2.8,0.,1.),tip=1.32+thrust*(4.4-jet*.22);
    float centerline=.17*sin(y*.64+time*2.2)*max(0.,y-1.45);
    float breadth=(.13+.038*y)*(1.-.44*jet/4.);
    float crossJet=abs(q.x-centerline);
    if(y<tip&&crossJet<breadth){
      float v=.24+.49*(1.-crossJet/breadth)+.17*sin(y*15.+time*15.+q.x*5.);
      if(v>.27)color=engraved(v,y>2.6?8:6,y*1.1,1.);
    }
  }
  frag=vec4(color,1.);
}
