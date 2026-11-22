flat in float serial;
flat in int pigment;
out vec4 frag;
void main(){
  float u=uv.x,v=2.*uv.y-1.;
  float tail=(1.-u)*.49+.06;
  float crown=sqrt(max(0.,1.-pow((u-.21)/.24,2.)));
  float wav=.09*sin(u*7.2+serial+time*.21);
  float side=abs(v+wav);
  if(side>max(tail,crown)||u<.019||life.w>.45||life.z<.25)discard;
  float strand=(1.-u)*.36+.28*crown;
  vec3 col=engraved(.43+strand+.13*sin(u*19.+v*4.),pigment,v*.83,1.);
  frag=vec4(col,1.);
}
