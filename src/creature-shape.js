// Cross-sections run from the tail to the nose. The fins have upper and
// lower surfaces that meet at the trailing and leading edges.
const spine = [
  [-1.42,.004,.004],[-1.16,.020,.017],[-.84,.052,.039],[-.62,.083,.062],
  [-.37,.147,.110],[-.12,.222,.166],[.15,.239,.199],[.37,.207,.153],
  [.56,.137,.092],[.64,.048,.039],[.655,0,0]
];
const wing = [
  [.12,-.46,.43,.103],[.30,-.46,.39,.080],[.53,-.39,.30,.051],
  [.77,-.41,.14,.032],[.97,-.48,-.075,.020],[1.14,-.54,-.34,.010],
  [1.19,-.52,-.52,0]
];

function profile(rows, u) {
  const at = u * (rows.length - 1);
  const i = Math.min(rows.length - 2, Math.floor(at)), t = at - i;
  const before = rows[Math.max(0,i-1)], after = rows[Math.min(rows.length-1,i+2)];
  return rows[i].map((a,j)=>{
    const b=rows[i+1][j], m=(b-before[j])*.5, n=(after[j]-a)*.5;
    return a+t*(m+t*(3*(b-a)-2*m-n+t*(2*(a-b)+m+n)));
  });
}

export function swimmerMesh() {
  const data=[];
  function skin(rows,columns,section){
    const grid=Array.from({length:rows+1},(_,i)=>
      Array.from({length:columns+1},(_,j)=>section(i/rows,j/columns*2*Math.PI)));
    for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){
      const a=grid[i][j],b=grid[i+1][j],c=grid[i][j+1],d=grid[i+1][j+1];
      data.push(...a,...b,...c,...c,...b,...d);
    }
  }
  skin(56,28,(u,ring)=>{
    const [z,w,h]=profile(spine,u);
    return [Math.max(0,w)*Math.cos(ring),Math.max(0,h)*Math.sin(ring)-.050*(1-u)**2,z];
  });
  for(const sign of [-1,1]){
    skin(32,22,(u,ring)=>{
      const [x,back,front,h]=profile(wing,u);
      const chord=.5+.5*Math.cos(ring);
      const y=.015-.12*u**2+.044*Math.sin(Math.PI*chord)*u+.051*Math.sin(Math.PI*u);
      return [sign*x,y+Math.max(0,h)*Math.sin(ring),back+(front-back)*chord];
    });
    skin(22,10,(u,ring)=>{
      const r=.030*(1-u)**.9, x=.034+.175*Math.sin(Math.PI*u*.79);
      return [sign*x+r*Math.cos(ring),-.042-u*.043+r*.44*Math.sin(ring),-.91-u*.68];
    });
  }
  return new Float32Array(data);
}
