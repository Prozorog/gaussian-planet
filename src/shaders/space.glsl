uniform float filmSky;
uniform vec3 right,up,back;uniform vec2 shift;
vec3 firmament(vec2 position){
  vec2 p=position*2.-1.-shift;
  vec3 d=normalize(-back+.32492*(right*p.x*viewport.x/viewport.y+up*p.y));
  vec2 q=d.xz*3.6+d.y*vec2(6.,-3.);
  vec2 f=q+.48*noise2(q*1.42);
  float v=noise(f*.92)+.31*noise(f*3.7)+.10*noise(f*10.),l=lineAt(v*8.,1.);
  vec3 c=v<-.29?vec3(.020,.014,.039):v<.22?vec3(.033,.019,.047):vec3(.050,.021,.045);
  if(filmSky>.5){
    // Faint interstellar dust cut into the same engraved paper as the sea.
    vec2 gal=foldInk(d.xz*7.4+d.y*vec2(4.1,-5.6),.25);
    float dust=noise(gal*2.2)+.36*noise(gal*5.7);
    float thread=lineAt(dust*4.2,1.);
    c+=step(.14,dust)*vec3(.091,.068,.098)+thread*vec3(.022,.015,.031);
  }
  return c+l*vec3(.034,.015,.031);
}
#ifndef HORIZON_PASS
out vec4 frag;
void main(){frag=vec4(firmament(uv),1.);}
#endif
