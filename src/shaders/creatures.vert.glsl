#version 300 es
precision highp float;
layout(location=0) in vec3 rest;
uniform mat4 vp;
uniform vec3 eye,right,up;
uniform vec2 viewport;
uniform vec4 swimmers[8],motion[8],schools[3];
uniform float scatter[3],time,driftView;
uniform int typeOfInk,schoolSize;
out vec2 uv;
out vec3 surface,position;
flat out int pigment;
flat out float seed;

const vec2 corners[6]=vec2[6](vec2(-1,-1),vec2(1,-1),vec2(-1,1),vec2(-1,1),vec2(1,-1),vec2(1,1));
float rand(float s){return fract(sin(s*12.7891+11.642)*43758.547);}

void main(){
  int j=gl_InstanceID;
  vec3 world;
  if(typeOfInk==0){
    vec4 b=swimmers[j],m=motion[j];
    vec2 forward=normalize(m.xy+vec2(.000001,0.)),side=vec2(forward.y,-forward.x);
    float span=abs(rest.x),aft=smoothstep(.05,1.59,-rest.z);
    float pulse=time*.83+float(j)*2.3+rest.z*2.2;
    vec3 p=rest;
    p.y+=sin(pulse-span*2.5)*(.22*pow(span,1.7)+.085*aft);
    p.x+=sin(pulse+span*1.8)*(.039+.155*aft*aft);
    p.x*=1.12+.12*step(.38,span);
    p.z-=.17*aft;
    p.y+=rest.z*m.w*.24;
    float bank=m.w+.104*sin(time*.42+float(j)*1.9);
    p.xy=mat2(cos(bank),sin(bank),-sin(bank),cos(bank))*p.xy;
    vec2 path=b.xz+b.w*(side*p.x+forward*p.z);
    world=vec3(path.x,b.y+b.w*p.y,path.y);
    surface=rest;
    uv=rest.xz;
    pigment=int(m.z);
    seed=float(j);
  }else{
    int group=j/schoolSize;
    vec4 fish=schools[group];
    seed=float(j)+3.;
    float strand=rand(seed*4.93)*2.-1.,spread=rand(seed*7.57)*2.-1.;
    float heading=time*.18+float(group)*2.094;
    vec3 across=vec3(-sin(heading),0.,cos(heading)),along=vec3(cos(heading),0.,sin(heading));
    float pulse=strand*2.5-time*.85+float(group)*1.4;
    float stretch=1.38+.32*sin(time*.42+float(group));
    world=fish.xyz+along*(strand*stretch)+across*(.44*sin(pulse)+spread*(.08+.43*(1.-strand*strand)+scatter[group]));
    world.y+=.24*sin(pulse*.78)+.22*(rand(seed*8.15)-.5)+scatter[group]*.48*spread;
    vec3 offset=world-eye;
    float gap=length(offset),bubble=1.43;
    // Split to both sides of the eye, following the same bend as the school.
    float split=dot(across,offset)+spread*.14;
    world+=driftView*across*sign(split)*.83*(1.-smoothstep(.35,2.65,gap));
    offset=world-eye;
    world+=driftView*normalize(offset+vec3(.00001))*max(0.,bubble-length(offset));

    vec3 course=along+across*(.83*cos(pulse)) + vec3(0.,.34*cos(pulse*.78),0.);
    vec2 headingOnScreen=vec2(dot(course,right),dot(course,up));
    vec2 axis=normalize(headingOnScreen+vec2(.002,0.));
    vec2 crossAxis=vec2(-axis.y,axis.x);
    float z=max(.05,(vp*vec4(world,1.)).w);
    float perPixel=.3249197*z/viewport.y;
    float orbitLength=mix(6.7,13.5,rand(seed*3.7));
    float halfSize=mix(orbitLength*perPixel,min(38.*perPixel,.050+.014*rand(seed)),driftView);
    uv=corners[gl_VertexID%6];
    vec2 bill=axis*uv.y+crossAxis*uv.x*.62;
    world+=halfSize*(right*bill.x+up*bill.y);
    position=world;
    surface=vec3(0.);
    pigment=int(fish.w);
  }
  position=world;
  gl_Position=vp*vec4(world,1.);
}
