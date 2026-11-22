const vertex = `#version 300 es
precision highp float;
out vec2 uv;
void main(){vec2 v=vec2((gl_VertexID<<1)&2,gl_VertexID&2); uv=v; gl_Position=vec4(2.*v-1.,0.,1.);}`;
export const header = `#version 300 es
precision highp float;
precision highp int;
in vec2 uv;
`;
export function program(gl, fragment, name, vertexSource=vertex) {
  function shader(type, src) {
    const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw Error(name+': '+gl.getShaderInfoLog(s));
    return s;
  }
  const p=gl.createProgram(), vs=shader(gl.VERTEX_SHADER,vertexSource), fs=shader(gl.FRAGMENT_SHADER,header+fragment);
  gl.attachShader(p,vs); gl.attachShader(p,fs); gl.linkProgram(p); gl.deleteShader(vs); gl.deleteShader(fs);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw Error(name+': '+gl.getProgramInfoLog(p));
  const loc={};
  for(let i=0;i<gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);i++){
    const n=gl.getActiveUniform(p,i).name; loc[n.replace(/\[0\]$/,'')]=gl.getUniformLocation(p,n);
  }
  return {p,loc,use(){gl.useProgram(p);return loc;}};
}
export function texture(gl,unit,tex){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);}
export function draw(gl){gl.drawArrays(gl.TRIANGLES,0,3);}
export function mapTexture(gl,w,h,format,data,filter=gl.NEAREST,wrap=gl.CLAMP_TO_EDGE){
  const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texStorage2D(gl.TEXTURE_2D,1,format,w,h);
  if(data)gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,data);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,wrap);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,wrap);return t;
}
