uniform highp sampler2D paper,inks,dye,velocity,redLattice,greenLattice;
uniform bool finePaper;
uniform vec2 viewport;
uniform float time,density;
uniform vec4 sun;
const float TAU=6.28318530718;
vec2 screen(){return (uv-.5)*vec2(viewport.x/viewport.y,1);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}
// Cubic interpolation of a seeded, periodic lattice. Derivatives remain continuous across lattice cells.
vec4 grain(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return textureLod(paper,(i+f+.5)/256.,0.);}
// A close view needs sub-texel derivatives beyond the hardware's fractional
// interpolation precision. Each texel holds the four bilinear coefficients.
vec4 weights(vec2 p){vec2 f=fract(p);f=f*f*(3.-2.*f);return vec4(1.,f,f.x*f.y);}
vec2 noise2(vec2 p){
 if(!finePaper)return grain(p).rg*2.-1.;
 ivec2 cell=ivec2(floor(p))&255;vec4 w=weights(p);
 return vec2(dot(texelFetch(redLattice,cell,0),w),dot(texelFetch(greenLattice,cell,0),w));
}
float noise(vec2 p){if(!finePaper)return grain(p).r*2.-1.;return dot(texelFetch(redLattice,ivec2(floor(p))&255,0),weights(p));}
vec2 foldInk(vec2 p,float t){
 p+=.78*noise2(p*.89+vec2(.14*t,-.08*t));
 p+=.37*noise2(p*1.72-vec2(.07*t,.03*t)+24.);
 p+=.132*noise2(p*4.8+41.);
 return p+.045*noise2(p*13.1-18.);
}
vec2 turn(vec2 p,vec2 c,float radius,float twist){vec2 d=p-c;return c+rot(twist*exp(-dot(d,d)/(radius*radius)))*d;}
// Smoothly compact vortex kernels; zero velocity at cell borders, no grid seams.
vec2 roll(vec2 p,float strength){vec2 cell=floor(p),d=fract(p)-.5;float k=max(0.,1.-4.*dot(d,d));float s=grain(cell*1.71+17.).r;return cell+.5+rot(strength*(s>.5?1.:-1.)*k*k)*d;}
vec3 ink(int id,float i){return texelFetch(inks,ivec2(int(clamp(i,0.,8.)),id),0).rgb;}
float lineAt(float phase,float pixels){float g=max(.0001,length(vec2(dFdx(phase),dFdy(phase))));float d=abs(fract(phase+.5)-.5)/g;return (1.-smoothstep(pixels*.5-.4,pixels*.5+.4,d))*(1.-smoothstep(.29,.54,g));}
vec3 engraved(float v,int id,float comb,float richness){
 float s=clamp(v,.0001,.9998)*9.,k=floor(s),aa=clamp(fwidth(s)*.46,.0001,.48);vec3 base=ink(id,k);
 float edge=fract(s);base=mix(ink(id,k-1.),base,smoothstep(-aa,aa,edge));base=mix(base,ink(id,k+1.),smoothstep(1.-aa,1.+aa,edge));
 vec3 light=ink(id,k+2.);if(id==0&&k<2.)light=k<1.?vec3(.314,.161,.208):vec3(.69,.275,.30);
 if(k>=7.&&id!=0)light=mix(light,vec3(1.,.99,.86),.32);
 float pen=clamp(viewport.y/1080.,.75,1.5);float contour=lineAt(v*9.,1.4*pen);
 float etch=lineAt(v*9.*(k<3.?4.:3.)*density+comb,1.18*pen);float hair=lineAt((v*32.+comb*.65)*density+.41,.98*pen);
 return mix(base,light,max(contour,max(etch*.84,hair*.48*richness)));
}
float hash(vec2 p){vec3 a=fract(p.xyx*vec3(.1031,.1030,.0973));a+=dot(a,a.yzx+33.33);return fract((a.x+a.y)*a.z);}
// Dark ink collects alongside a folded contour. Drop this family when the
// projected trough is too narrow to resolve, just as for the engraved lines.
vec3 pooled(vec3 col,int id,float phase,float width){
 float g=max(.0001,length(vec2(dFdx(phase),dFdy(phase))));
 float d=abs(fract(phase+.5)-.5),aa=min(.12,.5*g);
 float pool=(1.-smoothstep(width-aa,width+aa,d))*(1.-smoothstep(.12,.36,g));
 vec3 deep=ink(id,0.);
 float lip=1.-smoothstep(.2,.95,abs(d-width)/g);
 return mix(mix(col,deep,pool),ink(id,3.),lip*(1.-smoothstep(.12,.36,g))*.76);
}
