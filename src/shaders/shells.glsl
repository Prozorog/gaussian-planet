in vec3 local,world;
uniform vec3 eye,cloudSize;
uniform int pigment;
uniform float param,radius;
out vec4 frag;

void main(){
  vec3 n=normalize(local),normal=normalize(n/cloudSize);
  float facing=dot(normalize(eye-world),normal);
  bool within=length(eye/cloudSize)<radius;
  // Print only the first surface met by the ray. A hole in a membrane
  // stays open instead of filling with an unrelated patch on its back.
  if((within&&facing>0.)||(!within&&facing<0.))discard;
  float incidence=abs(facing);
  vec2 q=vec2(dot(n,vec3(.87,.16,.56)),dot(n,vec3(-.28,.95,.31)))*3.6+param*6.17;
  vec2 fold=foldInk(roll(q+.24*noise2(q*.7),3.1),time*.084);
  float wash=noise(fold*.72),curl=noise(fold*2.35),fine=noise(fold*7.8);
  float rim=1.-smoothstep(.39,.61,incidence+.045*wash);
  float phase=5.2*incidence+1.08*wash+.34*curl+.085*fine;
  vec2 lattice=vec2(dot(n,vec3(1.0,.44,-.37)),dot(n,vec3(-.32,1.0,.58)))*17.;
  lattice+=vec2(1.7*sin(4.6*n.z+n.y+param),1.4*sin(5.2*n.x-n.z+param));
  lattice+=.48*noise2(q*1.4);
  float vein=min(abs(sin(lattice.x)),abs(sin(lattice.y)));
  float lace=within?.39:mix(.46,.26,smoothstep(.47,.94,incidence));
  float material=max(rim,1.-smoothstep(lace-.026,lace+.026,vein));
  if(!within&&incidence>.992)discard;
  if(material<.12+.78*(1.-life.z)+.12*life.w)discard;
  float contour=cos(phase*6.28318),raking=dot(normal,normalize(vec3(-.64,.65,.40)));
  float tone=.49+.18*contour+.13*wash+.065*curl+.034*fine+
    .13*rim+.044*floor(2.*raking)-.17*(1.-rim);
  float edge=lineAt(phase*2.5+.28*curl,1.2);
  vec3 col=engraved(tone,pigment,.46*curl+.21*fine,.88);
  col=mix(col,ink(pigment,floor(9.*tone)+2.),edge*.64);
  if(life.w>.15)col*=1.-.66*life.w;
  float opacity=rim>.25?1.:(within?.50:.22)+.095*step(.10,curl);
  if(life.w>.3){
    float cooling=smoothstep(.3,.98,life.w);
    float remnant=noise(q*1.13)+.29*curl;
    if(remnant<mix(-1.3,.56,cooling)||abs(sin(phase*13.+curl))>1.-.72*cooling)discard;
    opacity*=1.-.84*cooling;
  }
  frag=vec4(col,opacity);
}
