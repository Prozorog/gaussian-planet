uniform int typeOfInk;
uniform vec3 eye;
in vec3 surface,position;
flat in int pigment;
flat in float seed;
out vec4 frag;

void main(){
  if(typeOfInk==1){
    vec2 p=uv;
    float bend=.15*sin(p.y*3.2-time*6.4+seed);
    p.x-=bend*smoothstep(.34,.93,-p.y);
    float leaf=.62*(1.-length((p-vec2(0.,.17))/vec2(.51,.72)));
    float tail=min(p.y+.93,min(-.17-p.y,.56*pow(max(0.,-p.y),1.85)-abs(p.x)));
    float edge=max(leaf,tail);
    if(edge<0.)discard;
    float outline=1.-smoothstep(.40,1.18,edge/max(.001,fwidth(edge)));
    float wash=p.x*.78+p.y*.55+.23*sin(p.y*4.3+seed*.21)+.12*sin(p.y*8.-p.x*5.);
    vec3 col=ink(pigment,3.+floor(clamp(.55+wash,.01,.99)*3.));
    frag=vec4(mix(col,ink(pigment,1.),outline*.90),1.);
    return;
  }
  vec3 n=normalize(cross(dFdx(position),dFdy(position)));
  vec3 view=normalize(eye-position);
  float facing=max(0.,dot(n,view)),light=dot(n,normalize(-position));
  float rim=1.-smoothstep(.075,.25,facing);
  vec3 p=surface;
  vec2 coord=vec2(p.x*6.+p.y*5.,p.z*2.9);
  coord=turn(coord,vec2(-.80,-.53),1.0,3.4);
  coord=turn(coord,vec2(1.16,.37),1.15,-3.0);
  vec2 f=foldInk(roll(coord,3.3),seed*9.+time*.12);
  float broad=noise(f*.91),curl=noise(f*2.9),grain=noise(f*10.4);
  float flow=f.x*.80+f.y*.26+1.02*broad+.29*curl+.065*grain;
  float bands=.42+.23*sin(flow*3.3)+.12*curl+.085*grain;
  float sunStep=light>.55?.18:light>.07?.02:-.23;
  if(life.w>.64){
    float line=max(rim,lineAt(flow*2.71,1.05));
    if(line<.62)discard;
    frag=vec4(ink(pigment,5.)*.62,1.);
    return;
  }
  vec3 col=engraved(bands+sunStep,pigment,.83*curl+.44*grain,1.);
  col=pooled(col,pigment,flow*1.51,.10);
  col=mix(col,ink(pigment,light>-.24?8.:4.),rim*.80);
  frag=vec4(col,1.);
}
