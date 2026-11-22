uniform float heat,splash;
uniform int splashInk;
out vec4 frag;
void main(){
  vec2 p=2.*uv-1.;
  float edge=max(abs(p.x)*.94,abs(p.y));
  vec2 f=foldInk(p*2.9,time*.24);float n=noise(f);
  if(splash>0.){
    float band=sin(p.y*3.+n*3.+noise(f*4.)*.5+splash*7.);
    float wash=splash*(.46+.36*band);
    if(wash>.34){
      float v=.42+.24*band+.14*n;
      frag=vec4(pooled(engraved(v,splashInk,n*.4,1.),splashInk,v*7.+n,.13),1.);return;
    }
  }
  if(heat<=0.||edge<1.016-heat*.15+n*.02)discard;
  frag=vec4(ink(0,edge>.97?6.:4.),.22*ceil(heat*2.));
}
