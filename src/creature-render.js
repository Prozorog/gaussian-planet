import { program } from './gl.js';
import common from './shaders/ink.glsl?raw';
import engraving from './shaders/creatures.glsl?raw';
import vertex from './shaders/creatures.vert.glsl?raw';
import { swimmerMesh } from './creature-shape.js';

export function creatureRenderer(gl,frame) {
  const ink=program(gl,common+engraving,'Swimming ink',vertex);
  const bodies=new Float32Array(32),motion=new Float32Array(32),schools=new Float32Array(12),scatter=new Float32Array(3);
  const shape=swimmerMesh(), vao=gl.createVertexArray(), buffer=gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,shape,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
  gl.bindVertexArray(null);
  return (s,c)=>{
    const group=s.creatures;
    if(!group?.enabled||group.dived||c.mode==='poster')return;
    const leavingClear=c.mode==='drift'&&s.t-c.drift.enteredAt<5&&!c.drift.ride;
    const swimmers=group.rideables.filter(b=>{
      if(!leavingClear)return true;
      const [x,y,z]=c.project(b.x,b.y,b.z);
      return z<=0||Math.abs(x)*z>.39*z+2.0||Math.abs(y)*z>.44*z+2.0;
    });
    const fish=group.fishCount(),l=frame(ink,s,c);
    gl.uniform1f(l.driftView,c.inside);
    gl.bindVertexArray(vao);
    for(const [i,b] of swimmers.entries()){
      bodies.set([b.x,b.y,b.z,b.r],i*4);
      motion.set([b.vx,b.vz,b.ink,b.bank],i*4);
    }
    gl.uniform4fv(l.swimmers,bodies);gl.uniform4fv(l.motion,motion);
    gl.uniform1i(l.typeOfInk,0);
    gl.drawArraysInstanced(gl.TRIANGLES,0,shape.length/3,swimmers.length);
    gl.bindVertexArray(null);
    if(!fish||leavingClear)return;
    for(const [i,b] of group.schools.entries()){
      schools.set([b.x,b.y,b.z,b.ink],i*4);scatter[i]=b.scatter;
    }
    gl.uniform4fv(l.schools,schools);gl.uniform1fv(l.scatter,scatter);
    gl.uniform1i(l.schoolSize,fish/3);gl.uniform1i(l.typeOfInk,1);
    gl.drawArraysInstanced(gl.TRIANGLES,0,6,fish);
  };
}
