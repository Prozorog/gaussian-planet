#version 300 es
precision highp float;
uniform mat4 vp;
uniform vec3 eye;
uniform vec4 life;
uniform float time,scale;
out vec2 uv;
flat out float serial;
flat out int pigment;

float rand(float x){return fract(sin(x*71.57+1.2)*43758.545);}
void main(){
  uv=vec2((gl_VertexID==1||gl_VertexID==4||gl_VertexID==5)?1.:0.,
          (gl_VertexID==2||gl_VertexID==3||gl_VertexID==5)?1.:0.);
  serial=float(gl_InstanceID)+1.;
  float a=serial*2.399963;
  float y=rand(serial+9.)*1.91-.95, field=sqrt(1.-y*y);
  vec3 direction=normalize(vec3(1.18*cos(a)*field,1.22*y,sin(a)*field));
  float layer=mod(serial,4.);
  vec3 root=direction*(2.5+layer*1.22+rand(serial*1.35)*.76)*scale;
  vec3 across=normalize(cross(direction,eye-root)+vec3(.00001));
  float lift=.24+.94*pow(rand(serial*.81),2.0);
  vec3 p=root+direction*(uv.x-.25)*lift;
  p+=across*(uv.y-.5)*(.031+.084*rand(serial*4.2))*(1.-.19*uv.x);
  p+=across*.012*sin(time*.7+serial+uv.x*3.2);
  pigment=layer<.5?3:layer<1.5?6:layer<2.5?4:5;
  gl_Position=vp*vec4(p,1.);
}
