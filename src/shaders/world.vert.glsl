#version 300 es
precision highp float;
layout(location=0) in vec3 position;
uniform mat4 vp;uniform vec3 right,up,center,cloudSize;uniform float radius,time,param;uniform int shape;
uniform vec4 streamShape;
out vec2 uv;out vec3 world,local;
vec3 ringX=vec3(.966,.259,0.);vec3 ringZ=vec3(-.094,.351,.932);
void main(){local=position;uv=position.xy*.5+.5;vec3 p=position;
 if(shape==1)p=vec3(position.x,0.,position.y);
 if(shape==2)p=right*position.x+up*position.y;
 if(shape==3)p=ringX*position.x+ringZ*position.y;
 if(shape==5){
   float wall=1.+.105*sin(p.x*4.+p.z*3.+param)*cos(p.y*3.-param)+.065*sin(p.z*6.-p.x*2.+param*.7);
   p*=cloudSize*wall;
 }
 if(shape==7)p*=cloudSize;
 if(shape==6){
   float u=position.x,a=streamShape.y+streamShape.z*(1.-u);
   float r=mix(.47,streamShape.x,pow(u,1.18))+streamShape.w*position.y*(.35+.65*u);
   p=vec3(r*cos(a),.025*sin(a*2.+time)*u,r*sin(a));
 }
 if(shape==4){float t=position.x,a=param*2.39996+time*.026;float lat=.70*sin(param*3.62+.7);vec3 n=vec3(cos(a)*cos(lat),sin(lat),sin(a)*cos(lat));vec3 side=vec3(-sin(a),0.,cos(a)),crossDir=cross(n,side);float arch=sin(t*3.14159),angle=(t-.5)*(.58+.20*sin(param));vec3 foot=n*cos(angle)+side*sin(angle);p=foot*(.97+arch*(.29+.19*cos(param*1.8+time*.15)))+crossDir*(arch*.15*sin(t*5.+param+time*.13));p+=crossDir*(position.y*(.014+.024*arch));}
 world=center+radius*p;gl_Position=vp*vec4(world,1.);
}
