export const formats = {
  '16:9':[3840,2160],
  '9:16':[2160,3840],
  '1:1':[2880,2880],
};
const credit='Music: Kevin MacLeod (incompetech.com), CC BY 4.0. Credit him if you post this.';
const monthDate=new Intl.DateTimeFormat('en-GB',{year:'numeric',month:'long',day:'numeric'});

function paperLayout(width,height,plain) {
  const short=Math.min(width,height);
  const margin=plain?0:Math.round(short*.0275);
  const footer=plain?0:Math.round(short*.082);
  return {width,height,margin,footer,w:width-2*margin,h:height-2*margin-footer};
}

export function postcardCamera(camera,width,height,pan) {
  const matrix=new Float32Array(camera.matrix),aspect=width/height;
  const scale=camera.aspect/aspect;
  for(let i=0;i<16;i+=4){
    matrix[i]=scale*matrix[i]+pan[0]*matrix[i+3];
    matrix[i+1]+=pan[1]*matrix[i+3];
  }
  return {...camera,matrix,aspect,shift:camera.shift*scale+pan[0],shiftY:camera.shiftY+pan[1],
    project(x,y,z){
      const w=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15];
      return [(matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12])/w,
        (matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13])/w,w];
    }};
}

function download(blob,name) {
  if(!blob)throw Error('The browser could not save this image.');
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
}

export function createPostcard({draw,restore,chapter,captureAudio,opened,closed}) {
  const $=id=>document.getElementById(id), dialog=$('postcard'),preview=$('postcard-preview');
  const title=$('postcard-name'),plain=$('postcard-plain'),save=$('postcard-save'),status=$('postcard-status');
  const formatBox=$('postcard-formats'),clip=$('postcard-clip'),clipCredit=$('postcard-credit');
  const choices=new Map();
  const type=typeof MediaRecorder==='undefined'?null:['video/webm;codecs=vp8,opus','video/webm']
    .find(mime=>MediaRecorder.isTypeSupported(mime));
  const canClip=!!type&&typeof preview.captureStream==='function';
  let aspect='16:9',pan=[0,0],pointer=null,needsPaint=false,recording=null,saving=false;
  let date='',elapsed=0,recorded=0;
  const name=()=>title.value.trim()||'First Light';
  for(const [label,dimensions] of Object.entries(formats)){
    const button=document.createElement('button'),count=document.createElement('small');
    button.type='button';button.textContent=label;count.textContent=dimensions.join(' × ');
    button.append(count);
    button.onclick=()=>{aspect=label;updateChoice();invalidate();};
    choices.set(label,button);formatBox.append(button);
  }
  function updateChoice(){
    for(const [key,button] of choices)button.setAttribute('aria-pressed',String(key===aspect));
  }
  function invalidate(){needsPaint=true;}
  function paint(target,width,height,live=false,dt=0){
    const card=paperLayout(width,height,plain.checked||live);
    if(target.width!==width||target.height!==height){target.width=width;target.height=height;}
    const p=target.getContext('2d');
    const m=card.margin,base=card.h+m;
    if(m){
      p.fillStyle='#f2e2ba';p.fillRect(0,0,width,height);
      p.fillStyle='#2e1927';p.fillRect(m-1,m-1,card.w+2,card.h+2);
    }
    draw(p,m,m,card.w,card.h,pan,live,dt);
    if(!m)return;
    const unit=Math.min(width,height),markSize=unit*.0105,right=width-m;
    p.textBaseline='alphabetic';p.textAlign='left';p.fillStyle='#261821';
    p.font=`italic ${unit*.032}px Georgia, serif`;
    p.fillText(name(),m,base+card.footer*.45,card.w*.72);
    p.fillStyle='#51404a';p.font=`${unit*.0125}px system-ui, sans-serif`;
    p.fillText(chapter()+' · '+date,m,base+card.footer*.70,card.w*.78);
    p.textAlign='right';p.font=`italic ${markSize*1.2}px Georgia, serif`;p.fillStyle='#624439';
    p.fillText('Gaussian Planet',right,base+card.footer*.69);
  }
  function paintPreview(){
    const [w,h]=formats[aspect],ratio=Math.min(840/w,660/h);
    paint(preview,Math.round(w*ratio),Math.round(h*ratio));
    restore();needsPaint=false;
  }
  function open(){
    if(dialog.open)return;
    opened();
    date=monthDate.format(new Date());
    pan=[0,0];elapsed=0;recorded=0;status.textContent='';
    updateChoice();dialog.showModal();invalidate();
  }
  function close(){
    if(!dialog.open)return;
    if(recording)stopClip(true);
    pointer=null;dialog.close();restore();closed();
  }
  function lock(locked){
    save.disabled=locked;clip.disabled=locked;
    for(const button of choices.values())button.disabled=locked;
    plain.disabled=locked;title.disabled=locked;
  }
  function savePng(){
    if(saving||recording)return;
    saving=true;lock(true);status.textContent='Rendering PNG…';
    const target=document.createElement('canvas'),[w,h]=formats[aspect],filename=name()+' '+aspect.replace(':','x')+'.png';
    requestAnimationFrame(()=>{
      try{
        paint(target,w,h);
        restore();
        target.toBlob(blob=>{
          try {download(blob,filename);status.textContent='PNG saved';}
          catch(error){status.textContent=error.message;}
          finally{saving=false;lock(false);}
        },'image/png');
      } catch(error){restore();status.textContent=error.message;saving=false;lock(false);}
    });
  }
  function startClip(){
    if(!canClip||recording||saving)return;
    const target=document.createElement('canvas');
    const sound=captureAudio();
    try{
      paint(target,1080,1920,true);
      const stream=target.captureStream(30);
      for(const track of sound?.tracks??[])stream.addTrack(track);
      const recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:7200000});
      const session={recorder,stream,sound,target,chunks:[],start:performance.now(),last:-Infinity,lag:0,cancelled:false};
      recorder.ondataavailable=e=>{if(e.data.size)session.chunks.push(e.data);};
      recorder.onstop=()=>{
        for(const track of stream.getTracks())track.stop();
        sound?.close();
        if(!session.cancelled){
          try {download(new Blob(session.chunks,{type:'video/webm'}),name()+' clip.webm');status.textContent='Clip saved';}
          catch(error){status.textContent=error.message;}
        }
        lock(false);invalidate();
      };
      recorder.onerror=()=>{status.textContent='The browser could not record this clip.';stopClip(true);};
      recording=session;status.textContent='Recording · 0 / 10 s';lock(true);recorder.start(500);
    } catch(error){sound?.close();recording=null;restore();lock(false);status.textContent=error.message;}
  }
  function stopClip(cancelled=false) {
    const session=recording;
    if(!session)return;
    recording=null;session.cancelled=cancelled;
    recorded=(performance.now()-session.start)/1000;
    if(session.recorder.state!=='inactive')session.recorder.stop();
    restore();
  }
  function clipFrame(now,dt){
    const session=recording;
    if(!session)return false;
    elapsed=(now-session.start)/1000;
    if(elapsed>=10){stopClip();return true;}
    session.lag+=dt;
    if(now-session.last<1000/30-1)return true;
    session.last=now;
    paint(session.target,1080,1920,true,Math.min(.08,session.lag));session.lag=0;
    if(preview.width!==342||preview.height!==608){preview.width=342;preview.height=608;}
    preview.getContext('2d').drawImage(session.target,0,0,342,608);
    status.textContent='Recording · '+Math.floor(Math.max(0,elapsed))+' / 10 s';
    return true;
  }
  $('postcard-close').onclick=close;
  dialog.oncancel=e=>{e.preventDefault();close();};
  title.oninput=invalidate;plain.oninput=invalidate;save.onclick=savePng;
  clip.hidden=!canClip;clipCredit.hidden=!canClip;clipCredit.textContent=credit;
  clip.onclick=startClip;
  preview.onpointerdown=e=>{
    if(recording||saving)return;
    pointer={x:e.clientX,y:e.clientY,id:e.pointerId};preview.setPointerCapture(e.pointerId);
  };
  preview.onpointermove=e=>{
    if(!pointer||pointer.id!==e.pointerId)return;
    const r=preview.getBoundingClientRect();
    pan[0]=Math.max(-1.9,Math.min(1.9,pan[0]+2*(e.clientX-pointer.x)/r.width));
    pan[1]=Math.max(-1.35,Math.min(1.35,pan[1]-2*(e.clientY-pointer.y)/r.height));
    pointer.x=e.clientX;pointer.y=e.clientY;invalidate();
  };
  preview.onlostpointercapture=()=>{pointer=null;};
  preview.onpointerup=()=>{pointer=null;};
  return {open,close,clipFrame,
    get visible(){return dialog.open;},get recording(){return !!recording;},
    preview(){
      if(!needsPaint||saving||recording)return;
      try{paintPreview();}
      catch(error){needsPaint=false;restore();status.textContent=error.message;}
    },
    state(){return {visible:dialog.open,aspect,plain:plain.checked,pan:[...pan],recording:!!recording,recorded};}};
}
