import {AU,elements,keplerPoint} from './astronomy.js';
import {clamp} from './system.js';

const gold='#f0c589',mint='#72dfc4',rose='#ff8eac',faint='#665568';
const pigments=['#fa935d','#f8734f','#65d29a','#69d6e1','#f686ac','#d394ed','#efc16c'];
const TAU=2*Math.PI;
function path(p,points,color,width=1,fill=false){
  if(!points.length)return;p.beginPath();p.moveTo(...points[0]);
  for(const pt of points.slice(1))p.lineTo(...pt);
  if(fill){p.closePath();p.fillStyle=fill;p.fill();}
  p.strokeStyle=color;p.lineWidth=width;p.stroke();
}
function dot(p,x,y,r,color,fill=true){
  p.beginPath();p.arc(x,y,r,0,TAU);p.lineWidth=1;p.strokeStyle=color;
  if(fill){p.fillStyle=color;p.fill();}else p.stroke();
}
function type(p,x,y,text,color='#dbc8bb',align='left'){
  p.font='9px ui-monospace, Consolas, monospace';p.textAlign=align;p.fillStyle=color;p.fillText(text,x,y);
}
function sun(p,x,y,r,t){
  dot(p,x,y,r,'#ef9a50');dot(p,x,y,r+2,gold,false);
  for(let i=0;i<12;i++){const a=(i+t*.08)*TAU/12;path(p,[[x+Math.cos(a)*(r+4),y+Math.sin(a)*(r+4)],[x+Math.cos(a)*(r+6+(i%3)),y+Math.sin(a)*(r+6+i%3)]],gold);}
}
function orbitDrawing(a,project,p,world=false) {
  const point=m=>project(...keplerPoint(a.orbit,m));
  for(const [start,col] of [[-.42,'#62d9bd'],[2.54,'#f798a8']]){
    const pts=[project(0,0)];for(let i=0;i<=24;i++)pts.push(point(start+.88*i/24));
    path(p,pts,col,1,col+(world?'42':'35'));
    for(let i=1;i<7;i++)path(p,[pts[0],point(start+.88*i/7)],col+'66');
  }
  path(p,Array.from({length:121},(_,i)=>point(i*TAU/120)),world?'#f6d698bd':faint,1);
  const here=point(a.mean);path(p,[project(0,0),here],gold);dot(p,...here,world?3.6:3.1,mint);
}
function terminator(p,b,c,ru) {
  const x=90,y=46,r=31,n=[b.x,b.y,b.z],d=Math.hypot(...n),light=n.map(v=>-v/d);
  const view=[c.eye[0]-b.x,c.eye[1]-b.y,c.eye[2]-b.z],len=Math.hypot(...view);
  const line=view.map(v=>v/len),proj=light.reduce((v,k,i)=>v+k*line[i],0);
  const angle=Math.atan2(-light.reduce((v,k,i)=>v+k*c.up[i],0),light.reduce((v,k,i)=>v+k*c.right[i],0));
  p.save();p.translate(x,y);p.rotate(angle);dot(p,0,0,r,'#35273f');
  const edge=[];for(let i=0;i<=40;i++){const t=-Math.PI/2+i*Math.PI/40;edge.push([-r*proj*Math.cos(t),r*Math.sin(t)]);}
  const day=[];for(let i=0;i<=40;i++){const t=Math.PI/2-i*Math.PI/40;day.push([r*Math.cos(t),r*Math.sin(t)]);}
  path(p,[...edge,...day],mint,.8,'#537969');path(p,edge,gold,1.5);dot(p,0,0,r,gold,false);p.restore();
  path(p,[[x,y],[152,16],[198,16]],faint);type(p,153,12,ru?'терминатор':'terminator',gold);
  type(p,154,64,b.name,mint);
}

export function diagram(canvas,id,s,c,a,ru) {
  const w=280,h=90,dpr=Math.min(devicePixelRatio,2);
  if(canvas.width!==w*dpr||canvas.height!==h*dpr){canvas.width=w*dpr;canvas.height=h*dpr;}
  const p=canvas.getContext('2d');p.setTransform(dpr,0,0,dpr,0,0);p.clearRect(0,0,w,h);
  const t=s.t,tx=(r,e)=>ru?r:e;
  if(id===1&&a.orbit){
    const orbit={...a.orbit,angle:0,sign:1},a0=orbit.a,f=64/a0;
    const xy=(x,z)=>[97+x*f,45-z*f*.56];orbitDrawing({...a,orbit},xy,p);
    sun(p,...xy(0,0),3,t);const [x,z]=keplerPoint(orbit,a.mean);
    const speed=Math.sqrt(Math.max(0,2*a0/Math.hypot(x,z)-1));
    type(p,171,31,tx('скорость','speed'));type(p,171,49,speed.toFixed(2)+' × v₀',mint);
    type(p,171,70,a.illustrative?tx('учебная орбита','model orbit'):(a.orbitBody?.name??''),gold);
  }else if(id===2){
    const dots=s.bodies.map(b=>[elements(b),b]).filter(([o])=>o.days);
    const max=Math.max(1,...dots.map(([o])=>(o.a/AU)**3));
    path(p,[[29,11],[29,70],[249,70]],faint);path(p,[[29,70],[232,17]],'#a08778');
    for(const [o,b] of dots)dot(p,29+203*(o.a/AU)**3/max,70-53*(o.days/365)**2/max,3.2,pigments[b.id]??mint);
    type(p,8,15,'P²');type(p,239,83,'a³');
  }else if(id===3){
    const g=a.gauge;if(!g)return;const scale=Math.max(g.escape*1.45,g.speed*1.07);
    const axis=v=>18+241*v/scale;
    path(p,[[18,49],[259,49]],faint,3);path(p,[[18,49],[axis(g.speed),49]],rose,3);
    for(const [v,title,y,col] of [[g.circular,tx('круговая','circular'),76,mint],[g.escape,tx('убегание','escape'),24,gold]]){
      const x=axis(v);path(p,[[x,42],[x,58]],col,1.5);type(p,clamp(x,35,243),y,title,col,'center');
    }dot(p,axis(g.speed),49,3.5,'#fff1cf');type(p,255,78,(g.speed/g.circular).toFixed(2)+' × v₀',rose,'right');
  }else if(id===4&&a.assist){
    const h=a.assist;[h.before,h.after].forEach((v,i)=>{
      const y=32+i*29;type(p,12,y+3,i?tx('после','after'):tx('до','before'));
      path(p,[[65,y],[65+135*v/h.after,y]],i?mint:rose,3);type(p,213,y+3,v.toFixed(3));
    });
  }else if(id===6&&a.roche){
    const b=a.roche;dot(p,93,45,15,pigments[b.id]??mint);
    p.setLineDash([3,3]);dot(p,93,45,31,gold,false);p.setLineDash([]);
    for(let i=0;i<18;i++){const th=i*.93+t*.14;dot(p,93+24*Math.cos(th),45+7*Math.sin(th),1.1,mint);}
    type(p,149,40,b.name,gold);type(p,149,59,tx('предел Роша','Roche limit'));
  }else if(id===8){
    const list=['#b83b43','#e76242','#f18d4c','#f4c979','#f6e3ad','#d6edee','#9bd9ff','#81b5ff'];
    list.forEach((col,i)=>{p.fillStyle=col;p.fillRect(15+31*i,38,31,13);});
    const x=s.hue===8?240:s.hue===0?35:126;path(p,[[x-4,27],[x,34],[x+4,27]],gold,1.3,gold);
    type(p,15,73,'2 500 K');type(p,127,73,'5 800 K',gold,'center');type(p,265,73,'>10 000 K',mint,'right');
  }else if(id===11){
    const values=a.curve,low=Math.min(.99,...values.filter(q=>q.v!==null).map(q=>q.v));
    path(p,[[31,12],[31,70],[264,70]],faint);p.setLineDash([2,3]);path(p,[[32,21],[264,21]],faint);p.setLineDash([]);
    let line=[];for(const q of values){if(q.v===null){path(p,line,mint,1.7);line=[];}else line.push([262-(s.t-q.t)*20.3,21+(1-q.v)/(1-low)*43]);}path(p,line,mint,1.7);
    type(p,25,25,'100%',gold,'right');type(p,262,84,tx('время →','time →'),gold,'right');
    type(p,42,82,(100*a.light).toFixed(2)+'%',mint);
  }else if(id===12){
    const [lo,hi]=a.zoneRadii(),x=73,y=44,scale=5.2;
    for(let i=0;i<8;i++)dot(p,x,y,(lo+(hi-lo)*i/7)*scale,i%2?'#498d7e':'#386357',false);
    sun(p,x,y,3,t);for(const b of s.bodies)dot(p,x+b.x*scale,y+b.z*scale,2.3,pigments[b.id]??mint);
    type(p,139,38,tx('пояс жидкой воды','liquid-water zone'),mint);
    type(p,139,58,(lo/AU).toFixed(2)+'–'+(hi/AU).toFixed(2)+tx(' усл. а. е.',' toy AU'),gold);
  }else if(id===14&&a.rider){terminator(p,a.rider,c,ru);}
}
export const illustrated=new Set([1,2,3,4,6,8,11,12,14]);

export function chartOnSky(canvas,s,c,a,id,ru,preview) {
  const wedges=(a.wedges||id===1)&&c.mode==='overview';
  const active=a.labels||wedges||id===6&&a.roche||preview;
  if(!active&&canvas.hidden)return;
  canvas.hidden=!active;if(!active)return;
  const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio,2);
  if(canvas.width!==w*dpr||canvas.height!==h*dpr){canvas.width=w*dpr;canvas.height=h*dpr;}
  const p=canvas.getContext('2d');p.setTransform(dpr,0,0,dpr,0,0);p.clearRect(0,0,w,h);
  const xy=(x,y,z)=>{const q=c.project(x,y,z);return [(q[0]+1)*w/2,(1-q[1])*h/2,q[2]];};
  if(wedges&&a.orbit&&!c.flying)orbitDrawing(a,(x,z)=>xy(x,-.10,z).slice(0,2),p,true);
  if(id===6&&a.roche&&s.bodies.includes(a.roche)&&c.mode==='overview'){
    const b=a.roche,o=[];for(let j=0;j<=100;j++){const ang=j/100*TAU;o.push(xy(b.x+Math.cos(ang)*b.r*2.2,b.y,b.z+Math.sin(ang)*b.r*2.2).slice(0,2));}
    p.setLineDash([4,5]);path(p,o,gold);p.setLineDash([]);
  }
  if(a.labels&&c.mode!=='poster')for(const b of s.bodies){
    const [x,y,depth]=xy(b.x,b.y,b.z),r=b.r*h/(.65*depth);
    if(depth<.05||x<-r||x>w+r||y<-r||y>h+r)continue;
    const side=x>w*.75?-1:1,xx=clamp(x+side*(r+16),80,w-80),yy=clamp(y-r*.65-10,32,h-36);
    path(p,[[x+side*r*.74,y-r*.62],[xx,yy],[xx+side*22,yy]],gold+'b0');
    const o=elements(b),align=side>0?'left':'right';p.shadowColor='#0c0714';p.shadowBlur=3;
    type(p,xx,yy-5,b.name,'#fff1da',align);
    type(p,xx,yy+12,(o.days?Math.round(o.days):'—')+(ru?' усл. д. · ':' toy d · ')+o.distance.toFixed(2)+(ru?' усл. а. е.':' toy AU'),gold,align);p.shadowBlur=0;
  }
  if(preview&&a.gauge){
    const g=a.gauge,b=g.body,[x,y]=xy(b.x,b.y,b.z),sx=clamp(x+32,104,w-188),sy=clamp(y+44,69,h-101);
    p.fillStyle='#120e19eb';p.fillRect(sx-8,sy-26,160,56);
    const scale=Math.max(g.speed*1.04,g.escape*1.35),axis=v=>sx+142*v/scale;
    path(p,[[sx,sy],[sx+142,sy]],faint,2);path(p,[[sx,sy],[axis(g.speed),sy]],rose,2);
    path(p,[[axis(g.circular),sy-5],[axis(g.circular),sy+5]],mint);
    path(p,[[axis(g.escape),sy-5],[axis(g.escape),sy+5]],gold);
    type(p,sx,sy-11,ru?'БРОСОК':'LAUNCH',gold);type(p,sx,sy+20,ru?'│ круговая   │ убегание':'│ circular   │ escape',mint);
  }
}
