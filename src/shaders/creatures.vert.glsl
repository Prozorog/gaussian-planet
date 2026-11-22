#version 300 es
precision highp float;
uniform mat4 vp;
uniform vec3 right,up;
uniform vec4 swimmers[8],motion[8],schools[3];
uniform float scatter[3],time;
uniform int typeOfInk,schoolSize;
out vec2 uv;
out float lift;
flat out int pigment;

const vec2 corners[6]=vec2[6](vec2(0,0),vec2(1,0),vec2(0,1),vec2(0,1),vec2(1,0),vec2(1,1));
float rand(float s){return fract(sin(s*12.7891+11.642)*43758.547);}
void main(){
  vec2 v=corners[gl_VertexID%6];
  int j=gl_InstanceID;
  vec3 world;
  if(typeOfInk==0){
    int cell=gl_VertexID/6;
    uv=(v+vec2(cell%20,cell/20))/20.;
    vec2 p=uv*2.-1.;
    vec4 b=swimmers[j],m=motion[j];
    vec2 forward=normalize(m.xy+vec2(.0001,0.)),side=vec2(-forward.y,forward.x);
    float wave=time*(.71+float(j)*.043)+float(j)*2.6-abs(p.x)*1.9+p.y*.81;
    float bend=sin(wave)*.28*pow(abs(p.x),1.55);
    float spine=.11*sin(p.y*4.0+time*.91+float(j))*(1.-abs(p.x)*.80);
    vec2 path=b.xz+b.w*(side*(p.x*1.77+spine)+forward*p.y*1.52);
    world=vec3(path.x,b.y+b.w*(bend+.26*p.y+.10*sin(p.y*2.8+time*.72)),path.y);
    lift=bend+.26;
    pigment=int(m.z);
  }else{
    int group=j/schoolSize;
    vec4 fish=schools[group];
    float seed=float(j)+3.,a=rand(seed)*6.28318;
    float th=a+time*(.87+rand(seed*.53)*.81);
    float row=.20+pow(rand(seed*2.21),.63)*.96+scatter[group]*1.3;
    vec3 course=vec3(cos(th),.31*sin(time*1.22+a*5.),sin(th));
    vec3 bend=vec3(.24*sin(th*3.+seed),.12*cos(th*2.1+seed),.15*sin(th*2.2));
    world=fish.xyz+course*row+bend;
    uv=v;
    vec2 p=uv*2.-1.;
    float facing=th+1.57+.22*sin(time*9.+seed);
    vec2 forward=vec2(cos(facing),sin(facing)),side=vec2(-forward.y,forward.x);
    float b=.064+.046*rand(seed*7.026);
    vec2 q=b*(forward*p.y+side*p.x*.68);
    world+=right*q.x+up*q.y;
    pigment=int(fish.w);lift=rand(seed*11.1);
  }
  gl_Position=vp*vec4(world,1.);
}
