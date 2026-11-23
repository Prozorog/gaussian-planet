// Touch flight uses the same movement commands as the keyboard, including inside worlds.
export function bindTouch({canvas, camera, canOrbit, cancel, move}) {
  const pad=document.getElementById('flight-pad'), knob=pad.firstElementChild;
  const lifts=document.querySelectorAll('[data-flight-key]');
  let pilot=null;
  const held=new Set(), touches=new Map();
  let pair=null, navigating=false;

  function steer(event) {
    const r=pad.getBoundingClientRect(), limit=r.width*.33;
    const x=(event.clientX-r.left-r.width/2)/limit, y=(event.clientY-r.top-r.height/2)/limit;
    const scale=limit/Math.max(1,Math.hypot(x,y));
    knob.style.transform='translate('+x*scale+'px,'+y*scale+'px)';
    const directions={KeyW:y<-.31, KeyS:y>.31, KeyA:x<-.31, KeyD:x>.31};
    for(const [key,down] of Object.entries(directions)){
      if(down===held.has(key))continue;
      if(down)held.add(key);else held.delete(key);
      move(key,down);
    }
  }
  function releasePad(){
    for(const key of held)move(key,false);
    held.clear();pilot=null;knob.style.transform='';
  }
  pad.onpointerdown=e=>{
    if(pilot!==null)return;
    e.preventDefault();pilot=e.pointerId;pad.setPointerCapture(pilot);steer(e);
  };
  pad.onpointermove=e=>{if(e.pointerId===pilot)steer(e);};
  pad.onpointerup=pad.onpointercancel=pad.onlostpointercapture=e=>{if(e.pointerId===pilot)releasePad();};
  for(const button of lifts){
    const key=button.dataset.flightKey;
    let pointer=null;
    button.onpointerdown=e=>{
      if(pointer!==null)return;
      e.preventDefault();pointer=e.pointerId;button.setPointerCapture(pointer);move(key,true);
    };
    button.onpointerup=button.onpointercancel=button.onlostpointercapture=e=>{
      if(pointer===e.pointerId){pointer=null;move(key,false);}
    };
  }

  function geometry(){
    const [a,b]=touches.values();
    return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,span:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};
  }
  function consume(e){e.preventDefault();e.stopImmediatePropagation();}
  canvas.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='touch'||!canOrbit())return;
    touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(touches.size===1&&!navigating)return;
    if(!navigating){cancel();navigating=true;}
    pair=touches.size===2?geometry():null;
    canvas.setPointerCapture(e.pointerId);consume(e);
  },true);
  canvas.addEventListener('pointermove',e=>{
    if(!touches.has(e.pointerId))return;
    touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(!navigating)return;
    if(touches.size===2){
      const next=geometry();
      if(pair){
        camera.orbit(next.x-pair.x,next.y-pair.y);
        camera.zoom=Math.max(.63,Math.min(1.9,camera.zoom*next.span/pair.span));
      }
      pair=next;
    }
    consume(e);
  },true);
  function endTouch(e){
    if(!touches.delete(e.pointerId)||!navigating)return;
    consume(e);pair=touches.size===2?geometry():null;
    if(!touches.size)navigating=false;
  }
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,endTouch,true);
  function reset(){
    releasePad();for(const button of lifts)move(button.dataset.flightKey,false);
    touches.clear();pair=null;navigating=false;
  }
  window.addEventListener('blur',reset);
  window.addEventListener('orientationchange',reset);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  return reset;
}
