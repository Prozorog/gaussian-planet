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
  float ring=lineAt(rings*125.,1.20*viewport.y/1080.)*float(rings>0.&&rings<.074);
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
  if(h<rim){
    vec2 q=sea(p,h-rim,1.23);
    vec2 f=foldInk(roll(q*.82,3.65),time*.23);
    float a=noise(f*.82),b=noise(f*2.83),c=noise(f*9.24);
    float tectonic=q.x*.83+q.y*.90+2.95*a+.88*b+.20*c;
    float rift=abs(sin(tectonic)+.20*sin(tectonic*2.1+1.6*b));
    float river=.50+.13*sin(q.y*1.74+a*3.-time*.31);
    vec2 root=p-toy.yz;
    float crack=abs(sin(atan(root.y,root.x)*6.+length(root)*16.+b*1.7));
    bool split=toy.x>0.&&length(root)<.59&&crack<.16+.17*toy.x;
    bool lava=rift<river||split;
    float light=.58+.24*(1.-rift)+.10*b+.07*c;
    col=lava?printInk(light,split?7:sin(tectonic*1.24)>.25?1:0,b+c*.27,tectonic*1.71):
      printInk(.355+.17*a+.19*b+.062*c,0,.44*b+.12*c,tectonic*.68);
  }
  if(toy.x>0.){
    vec2 q=p-toy.yz;
    float up=q.y,streak=up/max(.06,min(.57,.25+toyAge*.27));
    float fan=.11*max(0.,streak)+.03;
    float x=q.x+.058*sin(up*10.+toyAge*1.9)*streak;
    float veins=sin((x/max(.02,fan))*14.+toyAge*2.6+2.5*sin(up*19.));
    float crest=.89+.115*cos(x*36.+toyAge*2.4);
    if(streak>0.&&streak<crest&&abs(x)<fan&&veins>.23+.37*streak&&toyAge<3.6)
      col=engraved(.62+.21*veins-.11*streak,veins>.77?7:1,streak*1.77,1.);
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
