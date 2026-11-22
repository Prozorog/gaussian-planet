uniform int worldKind,markCount;
uniform vec4 toy, marks[5];
uniform vec2 offset,look,shift;
uniform float entered,toyAge;
out vec4 frag;

vec3 mica(vec2 p){
  vec2 site=p*vec2(362.,318.),cell=floor(site);
  float dotSeed=hash(cell+float(worldKind)*3.);
  vec2 centre=vec2(dotSeed,hash(cell+72.));
  float star=float(length(fract(site)-centre)<.083+.12*step(.985,dotSeed))*step(.86,dotSeed);
  vec3 tint=dotSeed>.95?vec3(.98,.69,.36):vec3(.89,.83,.75);
  return vec3(.015,.010,.033)+star*tint;
}
vec2 sea(vec2 p,float h,float height){
  float d=height/(abs(h)+.071);
  return offset+rot(look.x)*vec2(p.x*d,d*.52);
}
vec3 printInk(float value,int color,float thread,float pool){
  vec3 col=engraved(value,color,thread,1.);
  return pooled(col,color,pool,.096);
}
vec3 giant(vec2 p,float h,vec3 sky){
  float slope=.075+.043*sin(p.x*2.55+look.x)+.036*p.x;
  float ridge=abs(h-.015)-slope;
  vec2 q=sea(p,h-.015,h>0.?1.7:1.44);
  float direction=h>0.?1.:-1.;
  q.x+=direction*time*.31;
  q*=vec2(.83,1.17);
  vec2 f=foldInk(roll(q*.82+direction*9.37,4.4),time*.18);
  float a=noise(f*.83),b=noise(f*2.84),c=noise(f*8.9);
  float belt=q.y*1.9+q.x*.32+3.2*a+.84*b+.25*c;
  float darkSlot=.056*noise(foldInk(vec2(p.x*3.8+look.x,h*11.),time*.12))+.018*sin(p.x*10.+h*11.);
  float rings=h+.32-0.62*sqrt(max(0.,1.-pow((p.x+.08)*.86,2.)))+.026*p.x;
  float ring=lineAt(rings*125.,1.20)*float(rings>0.&&rings<.074);
  if(ridge+darkSlot<0.)return mix(sky,ink(6,8.),ring*.84);
  float stream=sin(belt),tone=.47+.23*stream+.135*a+.16*b+.041*c;
  int id=sin(belt*.77+direction*.2+a*2.3)>.01?4:5;
  if(h<0.&&sin(belt*.44+a*3.)>.65)id=6;
  if(toy.x>0.){
    vec2 l=p-toy.yz-vec2(.056*sin(time*.22+toyAge*.18),0.);
    l=(rot(.19)*l)/vec2(.35+.076*toy.x,.18+.03*toy.x);
    float circle=length(l),phi=atan(l.y,l.x);
    vec2 spin=turn(l,vec2(0.),1.2,3.5+toy.x*2.);
    float churn=noise(foldInk(spin*3.6,time*.40));
    float edge=circle+.055*b+.051*churn;
    if(edge<1.){
      float eddy=sin(15.*circle+phi*2.+3.6*churn+time*.47);
      tone=.45+.19*eddy+.21*churn+.075*b;
      id=edge>.83?6:eddy>.13?4:0;
      belt=15.*circle+phi+1.8*churn;
    }
  }
  vec3 col=printInk(tone,id,.62*b+.31*c,belt*1.21+.84*b);
  return mix(col,ink(6,8.),ring*.72);
}
vec3 ocean(vec2 p,float h,vec3 sky){
  float moonAngle=toy.w*1.55+.43;
  vec2 moon=vec2(.58*sin(moonAngle),.235+.048*cos(moonAngle));
  vec2 m=p-moon;
  float size=length(m);
  float rimH=.078+.015*cos(p.x*4.2-time*.22)+.024*cos(p.x*7.-moonAngle*2.);
  if(h>rimH){
    if(size<.079){
      vec2 f=foldInk(m*29.+4.,time*.10);
      float n=noise(f*2.2),w=noise(f*6.);
      float v=.66+.16*n+.12*w;
      return size>.074?ink(8,8.):engraved(v,8,n+w*.24,1.);
    }
    float current=noise(foldInk(p*6.+time*.035,time*.13));
    float marine=sin(h*39.+3.1*current+p.x*.46);
    if(h<.18+.045*current&&marine>-.39)return engraved(.39+.22*marine+.09*current,marine>.7?5:3,current,1.);
    return sky;
  }
  vec2 q=sea(p,h-rimH,.94);
  float az=atan(q.x,max(.0001,q.y)),tidal=cos(2.*(az-moonAngle));
  q.y+=.79*tidal+.34*sin(q.y*1.9+tidal*1.7-time*.61);
  vec2 f=foldInk(roll(q*.83,4.8),time*.21);
  float a=noise(f*.94),b=noise(f*3.1),c=noise(f*8.3);
  float wave=q.y*1.67+3.9*a+1.07*b+.19*c-time*.39;
  float lap=sin(wave),swash=sin(wave*2.06+1.2*b);
  float value=.54+.205*lap+.09*swash+.14*b+.062*c;
  int id=swash>.30&&lap>-.40?3:sin(wave*.56)>.61?5:2;
  return printInk(value,id,b*.68+c*.33,wave*1.16+.83*b);
}
vec3 ember(vec2 p,float h,vec3 sky){
  float rim=.198+.068*sin(p.x*4.4+look.x)+.052*noise(p*7.);
  vec3 col=sky;
  vec2 root=p-toy.yz;
  if(h<rim){
    vec2 q=sea(p,h-rim,1.23);
    vec2 f=foldInk(roll(q*.82,3.65),time*.23);
    float a=noise(f*.82),b=noise(f*2.83),c=noise(f*9.24);
    float tectonic=q.x*.83+q.y*.90+2.95*a+.88*b+.20*c;
    float rift=abs(sin(tectonic)+.20*sin(tectonic*2.1+1.6*b));
    float river=.50+.13*sin(q.y*1.74+a*3.-time*.31);
    vec2 runoff=root*vec2(.92,1.78);
    float distanceFromVent=length(runoff);
    float reach=.09+.52*(1.-exp(-max(0.,toyAge-.22)*.85));
    vec2 branch=foldInk(9.6*runoff+vec2(.42,2.4),time*.08);
    float channel=abs(sin(branch.x*1.9+branch.y*1.36+.60*noise(branch*2.2)));
    float width=.27*(1.-smoothstep(.12,reach+.12,distanceFromVent))+.035;
    bool split=toy.x>0.&&distanceFromVent<reach+.035*b&&root.y<.045&&channel<width;
    bool lava=rift<river||split;
    float light=.58+.24*(1.-rift)+.10*b+.07*c;
    col=lava?printInk(split?.65+.22*(1.-channel/max(.0001,width))+.055*b:light,
      split?(channel>width*.60?1:7):sin(tectonic*1.24)>.25?1:0,b+c*.27,tectonic*1.71):
      printInk(.355+.17*a+.19*b+.062*c,0,.44*b+.12*c,tectonic*.68);
  }
  if(toy.x>0.&&toyAge<3.4&&root.y>-.022&&root.y<.61&&abs(root.x)<.72){
    const float gravity=1.59;
    float closest=1.,braid=0.;
    for(int j=0;j<3;j++){
      float n=float(j),random=hash(vec2(n,9.81));
      float vx=j==0?-.43:j==1?.065:.40;
      float vy=j==0?1.14:j==1?1.26:.98;
      float disc=vy*vy-2.*gravity*root.y;
      if(disc<0.)continue;
      float arc=sqrt(disc);
      for(int k=0;k<2;k++){
        float since=(vy+(k==0?-arc:arc))/gravity;
        float start=toyAge-since-.078*n;
        float duration=.70+.35*random;
        if(since<0.||since>2.*vy/gravity||start<0.||start>duration)continue;
        float center=vx*since+.073*sin(since*5.6+n*1.6)*since;
        float thickness=(j==1?.043:.026)*(1.-.61*smoothstep(.26,1.48,since));
        thickness*=.83+.17*sin(7.*since+start*9.);
        thickness*=smoothstep(0.,.13,start)*(1.-smoothstep(duration-.10,duration,start));
        float d=abs(root.x-center)/max(.001,thickness);
        if(d>=closest)continue;
        closest=d;braid=since*12.+n*.4+2.5*d+.34*sin(start*9.+since*10.);
      }
    }
    if(closest<1.){
      float lane=sin(braid),body=1.-closest;
      float v=.43+.27*body+.17*lane+.076*sin(braid*2.48+root.y*20.);
      col=printInk(v,closest<.6&&lane>.13?7:1,braid*.52,braid*.85);
    }
    for(int j=0;j<14;j++){
      float n=float(j),dice=hash(vec2(n,11.5)),t=toyAge-(.13+.057*n);
      if(t<0.)continue;
      float vx=(dice-.47)*.82,vy=1.02+.29*hash(vec2(n,60.8));
      vec2 delta=root-vec2(vx*t,vy*t-gravity*.5*t*t);
      if(t>2.*vy/gravity||dot(delta,delta)>.0036)continue;
      vec2 axis=normalize(vec2(vx,vy-gravity*t)+vec2(.0001));
      float width=.0045+.007*dice;
      vec2 shape=vec2(dot(delta,axis)*.58,dot(delta,vec2(-axis.y,axis.x)));
      float radius=length(shape)/width;
      if(radius<1.)col=engraved(.69+.16*cos(10.*radius+shape.x*87.),radius>.75?1:7,dice+.3*radius,1.);
    }
  }
  return col;
}
vec3 seasons(vec2 p,float h,vec3 sky){
  float tilt=toy.w*.36;
  vec2 qP=rot(tilt)*vec2(p.x,h);
  float rim=.21+.055*sin(qP.x*5.+look.x)+.035*noise(qP*6.);
  float daylight=.34+.50*sin(time*.053+qP.x*1.4+look.x*.48+tilt);
  if(qP.y>rim){
    float zenith=qP.y-rim,phase=zenith*82.+sin(qP.x*4.+time*.11);
    if(zenith<.093)return engraved(.26+.38*daylight+.11*sin(phase),daylight>.35?3:5,.36*sin(phase),1.);
    return sky;
  }
  vec2 q=sea(qP,qP.y-rim,1.41);
  vec2 f=foldInk(roll(q*.71,4.5),time*.14);
  float a=noise(f*.66),b=noise(f*2.25),c=noise(f*7.49);
  float mainland=a+.36*b+.145*c+.35*sin(q.x*.70-q.y*.91);
  float cap=abs(sin(q.x*.20+q.y*.36+tilt*2.+sin(time*.063)*tilt*1.7));
  bool polar=cap>.982-.023*abs(toy.w)+.016*b;
  float band=.47+.16*mainland+.21*b+.078*c+.16*daylight;
  int id=polar?8:mainland>-.05?2:3;
  if(mainland>-.03&&mainland<.10)id=6;
  if(polar)band=.46+.19*b+.12*c;
  return printInk(band,id,.73*b+.31*c,q.y*.77+2.8*mainland);
}
vec3 cryosphere(vec2 p,float h,vec3 sky){
  float rim=.234+.052*sin(p.x*3.4+look.x)+.039*noise(p*5.);
  vec3 col=sky;
  if(h<rim){
    vec2 q=sea(p,h-rim,1.05);
    vec2 f=foldInk(roll(q*.80,3.7),time*.09);
    float a=noise(f*.85),b=noise(f*2.8),c=noise(f*9.46);
    float shelf=q.x*.78+q.y*1.73+3.*a+.44*b+.16*c;
    float erode=sin(shelf);
    int id=erode>.56?3:b<-.43?8:5;
    float value=.52+.22*erode+.15*b+.054*c;
    col=erode<-.57?ink(5,max(0.,floor(value*7.)-1.)):printInk(value,id,.74*b+.24*c,shelf*1.28+1.36*b);
  }
  if(toy.x>0.){
    vec2 q=p-toy.yz;
    float lift=clamp(toyAge*1.65,.04,1.), y=q.y/lift;
    float twist=.12*y+.058*sin(y*7.+toyAge);
    float stem=abs(q.x+twist);
    float ray=sin((q.x+twist)/(max(.014,y*.21))*11.+toyAge*4.);
    if(y>0.&&y<.65&&stem<.026+y*.182&&ray>.09+y*.44&&toyAge<5.5)
      col=engraved(.58+.21*ray-.13*y,ray>.64?8:3,y*3.,1.);
    vec2 grid=q*126.+vec2(0.,toyAge*9.);
    float grain=hash(floor(grid));
    if(y>.04&&y<.60&&stem<y*.48&&grain>.86&&length(fract(grid)-.5)<.10+.187*grain&&toyAge<7.)
      col=grain>.96?ink(8,8.):ink(3,6.);
  }
  return col;
}
void main(){
  vec2 p=screen()-.5*shift*vec2(viewport.x/viewport.y,1.);
  float h=p.y+look.y;
  if(entered<.999){
    vec2 cloud=foldInk(p*3.6+vec2(entered*1.1,0.),time*.42);
    float cut=length(p*vec2(.79,1.15))+.28*noise(cloud);
    if(cut>entered*.89+.025)discard;
    if(entered<.56&&cut>entered*.72){
      frag=vec4(engraved(.47+.24*noise(cloud*2.)+.13*sin(28.*cut),worldKind,cut*3.1,1.),1.);return;
    }
  }
  vec3 sky=mica(p+vec2(look.x*.10,look.y*.11));
  vec3 color=worldKind==4?giant(p,h,sky):worldKind==3?ocean(p,h,sky):
    worldKind==1?ember(p,h,sky):worldKind==2?seasons(p,h,sky):cryosphere(p,h,sky);
  for(int i=0;i<5;i++){
    if(i>=markCount)break;
    vec4 drop=marks[i];float age=max(0.,time-drop.w),radius=.18*(1.-exp(-3.5*age));
    vec2 d=p-drop.xy;float r=length(d)+noise(p*19.)*.014;
    if(r<radius)color=engraved(.50+.19*cos(r*93.)+.11*noise(p*12.),int(drop.z),r*14.,1.);
  }
  frag=vec4(color,1.0);
}
