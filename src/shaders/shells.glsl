in vec3 local,world;
uniform vec3 eye;
uniform int pigment;
uniform float param,radius;
out vec4 frag;

void main(){
  vec3 view=normalize(eye-world);
  vec3 n=normalize(local);
  vec3 normal=normalize(cross(dFdx(world),dFdy(world)));
  float sight=abs(dot(view,normal));
  float limb=1.-smoothstep(.075,.64,sight);
  float k=param;
  vec2 sheet=vec2(n.x*.85+n.z*.63,n.y+n.z*.32);
  vec2 broad=sheet*3.25+vec2(k*5.2,1.33*k);
  float opening=noise(broad*.79)+.30*noise(broad*2.15);
  float drape=.55*sin(5.8*n.y+4.2*n.x+1.6*n.z+k*1.6);
  float dose=opening+.33*drape+.46*limb;
  float dist=distance(world,eye);
  float within=1.-smoothstep(1.4,5.3,dist);
  float hollow=-.018+.20*(1.-limb)+.042*k-.19*within-(pigment==6?.068:0.);
  if(dose<hollow+.57*(1.-life.z)+.62*life.w)discard;
  if(dist<.032)discard;
  
  vec2 f=foldInk(roll(broad+vec2(.38*opening,.23*drape),4.35),time*.11);
  float wash=noise(f*.84),curl=noise(f*2.55),grit=noise(f*8.3);
  float shellline=n.y*6.9+n.z*3.25+2.55*wash+.83*curl+.21*grit-k*1.7;
  float ribbon=sin(shellline);
  float folds=sin(shellline*1.84+1.30*wash+.45*curl);
  float fan=(n.x*7.6+n.z*5.3+2.4*wash)/(1.1+.52*abs(n.y));
  float filament=lineAt(fan*2.25+.41*grit,1.18);
  float edge=lineAt((sight+.046*wash)*8.3+.38*curl,1.16)*limb;
  float lightStep=sight<.19?.21:sight<.39?.13:sight<.63?.02:-.088;
  float v=.52+.182*ribbon+.084*folds+.11*curl+.065*grit+lightStep-.26*life.w;
  int id=pigment;
  vec3 col=engraved(v,id,.86*curl+.23*grit,1.);
  col=pooled(col,id,shellline*.84+curl*.93,.10);
  col=mix(col,ink(id,floor(v*9.)+2.),max(filament*.58,edge*.74));
  if(life.w>.19)col*=1.-.72*life.w;
  frag=vec4(col,1.);
}
