import { program } from './gl.js';
import common from './shaders/ink.glsl?raw';
import engraving from './shaders/creatures.glsl?raw';
import vertex from './shaders/creatures.vert.glsl?raw';

export function creatureRenderer(gl,frame) {
  const ink=program(gl,common+engraving,'Swimming ink',vertex);
  const bodies=new Float32Array(32),motion=new Float32Array(32),schools=new Float32Array(12),scatter=new Float32Array(3);
  return (s,c)=>{
    const group=s.creatures;
    if(!group?.enabled||group.dived||c.mode==='poster')return;
    const swimmers=group.rideables.slice(0,8),fish=group.fishCount(),l=frame(ink,s,c);
    gl.bindVertexArray(null);
    for(const [i,b] of swimmers.entries()){
      bodies.set([b.x,b.y,b.z,b.r],i*4);
      motion.set([b.vx,b.vz,b.ink,s.t-b.breachAt],i*4);
    }
    gl.uniform4fv(l.swimmers,bodies);gl.uniform4fv(l.motion,motion);
    gl.uniform1i(l.typeOfInk,0);
    gl.drawArraysInstanced(gl.TRIANGLES,0,20*20*6,swimmers.length);
    if(!fish)return;
    for(const [i,b] of group.schools.entries()){
      schools.set([b.x,b.y,b.z,b.ink],i*4);scatter[i]=b.scatter;
    }
    gl.uniform4fv(l.schools,schools);gl.uniform1fv(l.scatter,scatter);
    gl.uniform1i(l.schoolSize,fish/3);gl.uniform1i(l.typeOfInk,1);
    gl.drawArraysInstanced(gl.TRIANGLES,0,6,fish);
  };
}
