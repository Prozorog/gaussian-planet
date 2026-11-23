import {clamp} from './system.js';
const DEG=Math.PI/180,TAN=Math.tan(18*DEG),near=.035,far=130;
export function createCamera(){
 const c={mode:'overview',focus:null,yaw:0,pitch:30,targetYaw:0,targetPitch:30,zoom:1,shift:-.075,shiftY:0,eye:[0,0,0],right:[1,0,0],up:[0,1,0],back:[0,0,1],matrix:new Float32Array(16),dist:16,aim:[0,-.08,0],portraitYaw:0,aspect:16/9,bank:0};let transition=null,now=0,carry=null;
 c.inside=0;c.tanHalfFov=TAN;
 function visit(mode,b=null){transition={start:now,eye:[...c.eye],aim:[...c.aim],shift:c.shift,inside:c.inside,bank:c.bank,duration:mode==='drift'||c.inside>0?2:1.2};carry=null;c.flying=true;c.mode=mode;c.focus=b;c.portraitYaw=0;if(b){c.baseYaw=Math.atan2(b.x,b.z)+.93;c.arrival=now;}}
 function followVoyage(pose){
  transition=null;carry=null;c.flying=false;c.mode='voyage';c.focus=null;c.voyagePose=pose;
 }
 function takeHelm(pose){
  transition=null;c.flying=false;c.mode='drift';c.focus=null;
  carry={inside:pose.inside,shift:pose.shift,bank:pose.bank,first:true};
 }
 function tick(t,dt,aspect,shake){now=t;c.aspect=aspect;const k=1-Math.exp(-dt*9);c.yaw+=(c.targetYaw-c.yaw)*k;c.pitch+=(c.targetPitch-c.pitch)*k;let pitch=c.pitch*DEG,yaw=c.yaw+.1745*Math.sin(t*Math.PI/20),dist=16/c.zoom,ax=0,ay=-.08,az=0,shift=-.07;
  if(c.mode==='overview'&&c.picker){dist=18.2/c.zoom;pitch=33*DEG;ay=-.60;shift=0;}
  if(c.mode==='planet'&&c.focus){const b=c.focus;yaw=c.baseYaw+c.portraitYaw+.023*(t-c.arrival);pitch=(c.pitch-22)*DEG;dist=b.r*5.14/c.zoom;ax=b.x;ay=b.y;az=b.z;shift=.085;}
  if(c.mode==='poster'){
    yaw=.05;pitch=20*DEG;ay=0;
    if(c.nebulaPrint){yaw=.25;pitch=58*DEG;dist=18.0;shift=0;}
    else{dist=3.24;shift=aspect<1?-.28:-.99;}
  }
  const cp=Math.cos(pitch),bx=Math.sin(yaw)*cp,by=Math.sin(pitch),bz=Math.cos(yaw)*cp;let ex=ax+bx*dist,ey=ay+by*dist,ez=az+bz*dist;
  if(c.mode==='overview'&&c.nebulaPrint){ex=ax+(ex-ax)*1.30;ey=ay+(ey-ay)*1.30;ez=az+(ez-az)*1.30;}
  c.inside=c.mode==='drift'?1:0;c.bank=0;
  if(c.mode==='drift'){[ex,ey,ez]=c.drift.position;const f=c.drift.forward;ax=ex+f[0]*3;ay=ey+f[1]*3;az=ez+f[2]*3;shift=0;}
  if(c.mode==='voyage'){
    const pose=c.voyagePose;
    [ex,ey,ez]=pose.position;const f=pose.forward;
    ax=ex+f[0]*3;ay=ey+f[1]*3;az=ez+f[2]*3;
    c.inside=pose.inside;c.bank=pose.bank;shift=pose.shift;
  }
  if(carry){
    const k=carry.first?0:1-Math.exp(-dt*.87);
    const inside=1-clamp((Math.abs(ey)-2.7)/3.8,0,1);
    carry.inside+=(inside-carry.inside)*k;carry.shift*=1-k;carry.bank*=1-k;carry.first=false;
    c.inside=carry.inside;c.bank=carry.bank;shift=carry.shift;
    if(carry.inside>.999&&Math.abs(carry.bank)+Math.abs(carry.shift)<.001)carry=null;
  }
  if(transition){const f=clamp((t-transition.start)/transition.duration,0,1),m=f*f*(3-2*f),lerp=(v,d)=>v+(d-v)*m;[ex,ey,ez]=[lerp(transition.eye[0],ex),lerp(transition.eye[1],ey),lerp(transition.eye[2],ez)];if(transition.duration===2)ey+=Math.sin(Math.PI*m)*1.4;ax=lerp(transition.aim[0],ax);ay=lerp(transition.aim[1],ay);az=lerp(transition.aim[2],az);shift=lerp(transition.shift,shift);c.inside=lerp(transition.inside,c.inside);c.bank=lerp(transition.bank,c.bank);if(f===1)transition=null;}
  const E=c.eye,B=c.back,R=c.right,U=c.up,M=c.matrix;E[0]=ex;E[1]=ey;E[2]=ez;c.aim[0]=ax;c.aim[1]=ay;c.aim[2]=az;B[0]=ex-ax;B[1]=ey-ay;B[2]=ez-az;c.dist=Math.hypot(...B);for(let i=0;i<3;i++)B[i]/=c.dist;const h=Math.hypot(B[0],B[2])||1;R[0]=B[2]/h;R[1]=0;R[2]=-B[0]/h;U[0]=-B[1]*B[0]/h;U[1]=h;U[2]=-B[1]*B[2]/h;
  if(c.bank){
    const cos=Math.cos(c.bank),sin=Math.sin(c.bank);
    for(let i=0;i<3;i++){const horizontal=R[i];R[i]=horizontal*cos+U[i]*sin;U[i]=U[i]*cos-horizontal*sin;}
  }
  if(c.mode==='voyage')shake=0;
  c.shift=shift+Math.sin(t*103)*shake/960;const sy=Math.sin(t*127)*shake/540+clamp(1-aspect,0,1)*.30*(1-c.inside)*(c.mode==='overview'?1:0);c.shiftY=sy;
  // Protect the width of the subject as the frame turns upright. Picking shares this lens.
  c.tanHalfFov=TAN*Math.max(1,(1+.42*(1-c.inside))/aspect);
  for(let i=0;i<3;i++){M[4*i]=R[i]/(c.tanHalfFov*aspect)-c.shift*B[i];M[4*i+1]=U[i]/c.tanHalfFov-sy*B[i];M[4*i+2]=-(far+near)/(far-near)*B[i];M[4*i+3]=-B[i];}for(let j=0;j<4;j++)M[12+j]=-M[j]*ex-M[j+4]*ey-M[j+8]*ez;M[14]-=2*far*near/(far-near);c.flying=!!transition;
 }
 function project(x,y,z){const m=c.matrix,w=m[3]*x+m[7]*y+m[11]*z+m[15];return [(m[0]*x+m[4]*y+m[8]*z+m[12])/w,(m[1]*x+m[5]*y+m[9]*z+m[13])/w,w];}
 function ray(x,y){const a=(x-c.shift)*c.tanHalfFov*c.aspect,b=(y-c.shiftY)*c.tanHalfFov;return c.back.map((n,i)=>-n+c.right[i]*a+c.up[i]*b);}
 function plane(x,y,height=0){const d=ray(x,y),u=(height-c.eye[1])/d[1];return u>0?[c.eye[0]+d[0]*u,c.eye[2]+d[2]*u]:null;}
 function sphere(x,y,cx,cy,cz,r){const d=ray(x,y),a=d[0]**2+d[1]**2+d[2]**2,ox=c.eye[0]-cx,oy=c.eye[1]-cy,oz=c.eye[2]-cz,b=ox*d[0]+oy*d[1]+oz*d[2],disc=b*b-a*(ox*ox+oy*oy+oz*oz-r*r);if(disc<0)return null;const t=(-b-Math.sqrt(disc))/a;return t>0?{t,n:[(ox+t*d[0])/r,(oy+t*d[1])/r,(oz+t*d[2])/r]}:null;}
 return Object.assign(c,{tick,visit,followVoyage,takeHelm,project,ray,plane,sphere,orbit(dx,dy){if(c.mode==='poster')visit('overview');if(c.mode==='planet')c.portraitYaw-=dx*.006;else c.targetYaw-=dx*.006;c.targetPitch=clamp(c.targetPitch+dy*.16,c.nebulaPrint&&c.mode==='overview'?-7:10,75);}});
}
