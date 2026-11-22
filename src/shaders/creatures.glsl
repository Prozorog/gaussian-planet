uniform int typeOfInk;
in float lift;
flat in int pigment;
out vec4 frag;

void main(){
  vec2 p=uv*2.-1.;
  float width=abs(p.x),sinus=sin(p.y*4.+time*1.30),edge;
  if(typeOfInk==0){
    float leading=.81-.87*pow(width,1.86)+.038*sin(p.x*4.+time*.64);
    float trailing=-.29+.39*width-.078*sin(width*6.3);
    float membrane=min(leading-p.y,p.y-trailing);
    float body=1.-length((p-vec2(0.,.10))/vec2(.23,.70));
    float tailX=.083*sin(p.y*8.4+time*1.2);
    float filament=min(.072*(p.y+1.07)/.76+.016-abs(p.x-tailX),min(-.22-p.y,p.y+.99));
    edge=min(.98-width,max(max(membrane,body*.61),filament*1.6));
  }else{
    float body=(1.-length((p-vec2(.0,.19))/vec2(.54,.66)))*.64;
    float tail=min(p.y+.96,-.16-p.y);
    tail=min(tail,.68*pow(max(0.,-p.y),1.36)-abs(p.x-.19*sin(time*11.+lift*45.)));
    edge=max(body,tail);
  }
  float outline=1.-smoothstep(.45,1.38,edge/max(.001,length(vec2(dFdx(edge),dFdy(edge)))));
  if(edge<0.)discard;
  if(typeOfInk==1){
    float value=fract(lift*8.)*.17+.44+.19*sin(p.y*7.+p.x*2.);
    vec3 col=ink(pigment,4.+floor(value*3.)+2.*outline);
    frag=vec4(col,1.);return;
  }
  vec2 f=foldInk(roll(p*vec2(2.6,3.9)+vec2(lift*.16,0.),4.6),time*.32);
  float a=noise(f*.90),b=noise(f*2.71),c=noise(f*9.98);
  float phase=6.7*p.y+2.1*abs(p.x)+3.3*a+.81*b+.19*c;
  float v=.33+.195*sin(phase)+.114*a+.16*b+.048*c+.19*lift;
  if(life.w>.64){
    float ribbon=max(outline,lineAt(phase*1.74+.35*b,1.2));
    if(ribbon<.53)discard;
    frag=vec4(ink(pigment,floor(3.+ribbon*2.))*.72,1.);return;
  }
  vec3 col=engraved(v,pigment,.73*b+.34*c+.20*sinus,1.);
  col=mix(col,ink(pigment,8.),outline*.84);
  frag=vec4(col,1.);
}
