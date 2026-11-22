export const soundtrack = [
  { name:'Frozen Star', file:'frozen-star', gain:4.5, scale:[0,3,5,7,10], intro:0, tail:2.4 },
  { name:'Dreams Become Real', file:'dreams-become-real', gain:1.25, scale:[0,3,5,7,10], intro:1.1, tail:8.2 },
  { name:'Lightless Dawn', file:'lightless-dawn', gain:1, scale:[2,5,7,9,0], intro:2.2, tail:12.3 },
  { name:'Echoes of Time v2', file:'echoes-of-time-v2', gain:.4, scale:[3,5,7,10,0], intro:0, tail:10.4 },
  { name:'Ossuary 6 - Air', file:'ossuary-6-air', gain:1, scale:[11,1,3,6,8], intro:1.9, tail:5.6 },
];
export const creditLines = soundtrack.map(({name}) =>
  `"${name}" Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By Attribution 4.0. https://creativecommons.org/licenses/by/4.0/`);

const FADE = 4, freq = midi => 440 * 2 ** ((midi - 69) / 12);
const rising = Float32Array.from({length:64}, (_,i) => Math.sin(i*Math.PI/126));
const falling = Float32Array.from(rising).reverse();
const inScale = (midi, scale) => scale.includes((midi%12+12)%12);

export function soundscape() {
  let ctx, master, music, effects, noise, chargeVoice, wind;
  let muted = false, musicLevel = .52, effectsLevel = .70, sceneGain = 1;
  let decks, current, transition, opening = false, wanted = 0, duckUntil = 0, lastMix = -1;
  let lastWind = -1;
  const track = () => soundtrack[(transition && ctx.currentTime >= transition.end-FADE/2
    ? transition.next : current)?.index ?? wanted];
  function snap(midi, scale=track().scale) {
    for(let offset=0;offset<12;offset++){
      const low=Math.round(midi)-offset, high=Math.round(midi)+offset;
      if(inScale(low,scale))return low;
      if(inScale(high,scale))return high;
    }
  }
  function prepare(deck, index) {
    if(deck.index===index)return;
    deck.index=index;
    deck.media.src=`${import.meta.env.BASE_URL}music/${soundtrack[index].file}.mp3`;
    deck.media.load();
  }
  function openTrack(index, loop=false) {
    const next = decks.find(deck => deck !== current);
    const row = soundtrack[index];
    opening = true;
    prepare(next,index);
    next.gain.gain.value=0;
    next.media.currentTime=loop?row.intro:0;
    next.media.play().then(() => {
      opening=false;
      const now=ctx.currentTime;
      if(!current){
        next.gain.gain.setTargetAtTime(row.gain,now,.18);
        current=next;
        return;
      }
      transition={next,end:now+FADE};
      const level=current.gain.gain.value;
      current.gain.gain.cancelScheduledValues(now);
      next.gain.gain.cancelScheduledValues(now);
      current.gain.gain.setValueCurveAtTime(falling.map(x=>x*level),now,FADE);
      next.gain.gain.setValueCurveAtTime(rising.map(x=>x*row.gain),now,FADE);
    }).catch(() => {opening=false; next.media.removeAttribute('src'); next.media.load(); next.index=-1;});
  }
  function ensureTrack() {
    if(!ctx || ctx.state!=='running' || opening)return;
    if(transition && ctx.currentTime>=transition.end){
      const old=current;
      current=transition.next;transition=null;
      old.media.pause();old.media.removeAttribute('src');old.media.load();old.index=-1;
    }
    if(transition)return;
    if(!current || current.index!==wanted){openTrack(wanted);return;}
    const row=soundtrack[current.index], {duration,currentTime}=current.media;
    if(!Number.isFinite(duration))return;
    const left=duration-currentTime;
    if(left<=row.tail+FADE){openTrack(current.index,true);return;}
    if(left<=row.tail+FADE+9)prepare(decks.find(deck=>deck!==current),current.index);
  }
  function mix() {
    if(!ctx)return;
    const now=ctx.currentTime, duck=now<duckUntil?.57:1;
    master.gain.setTargetAtTime(muted?0:sceneGain,now,.09);
    music.gain.setTargetAtTime(musicLevel*duck,now,duck<1?.20:.65);
    effects.gain.setTargetAtTime(.24*effectsLevel,now,.08);
  }
  function wake() {
    if(!ctx){
      ctx=new AudioContext();
      master=ctx.createGain();music=ctx.createGain();effects=ctx.createGain();
      master.gain.value=muted?0:sceneGain;
      music.gain.value=musicLevel;effects.gain.value=.24*effectsLevel;
      master.connect(ctx.destination);music.connect(master);effects.connect(master);
      decks=Array.from({length:2},()=>{
        const media=new Audio(),gain=ctx.createGain();
        media.preload='auto';gain.gain.value=0;
        ctx.createMediaElementSource(media).connect(gain).connect(music);
        return {media,gain,index:-1};
      });
      noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
      const samples=noise.getChannelData(0);
      for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
      // The first media play and the context resume are both issued in the gesture.
      openTrack(wanted);
    }
    if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  }
  function tone(midi, d, gain, type='sine', delay=0, start=midi) {
    if(!ctx)return;
    const envelope=ctx.createGain(), osc=ctx.createOscillator(), at=ctx.currentTime+delay;
    osc.type=type;
    osc.frequency.setValueAtTime(freq(start),at);
    osc.frequency.exponentialRampToValueAtTime(freq(midi),at+d*.30);
    envelope.gain.setValueAtTime(.0001,at);
    envelope.gain.exponentialRampToValueAtTime(gain,at+Math.min(.024,d*.15));
    envelope.gain.exponentialRampToValueAtTime(.0001,at+d);
    osc.connect(envelope).connect(effects);osc.start(at);osc.stop(at+d+.01);
  }
  function hiss(d,f,end,gain) {
    if(!ctx)return;
    const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain(),t=ctx.currentTime;
    src.buffer=noise;src.loop=true;filter.type='bandpass';filter.Q.value=.75;
    filter.frequency.setValueAtTime(f,t);filter.frequency.exponentialRampToValueAtTime(end,t+d);
    g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(gain,t+.035);
    g.gain.exponentialRampToValueAtTime(.001,t+d);
    src.connect(filter).connect(g).connect(effects);src.start(t);src.stop(t+d);
  }
  function charge(v) {
    if(!ctx)return;
    const at=ctx.currentTime;
    if(v<=0){
      if(chargeVoice){
        chargeVoice.gain.gain.setTargetAtTime(.0001,at,.035);
        chargeVoice.osc.stop(at+.20);chargeVoice=null;
      }
      return;
    }
    if(!chargeVoice){
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type='triangle';gain.gain.value=.002;
      osc.connect(gain).connect(effects);osc.start();
      chargeVoice={osc,gain};
    }
    chargeVoice.osc.frequency.setTargetAtTime(freq(snap(41+v*21)),at,.05);
    chargeVoice.gain.gain.setTargetAtTime(.070+.060*v,at,.06);
  }
  function play(action, id=0) {
    if(!ctx)return;
    const scale=track().scale, pitch=60+(scale[id%5]??scale[0]);
    switch(action){
      case 'drop':tone(pitch+12,.29,.32,'sine',0,pitch+24);tone(pitch+24,.26,.085,'sine',.035);break;
      case 'choose':tone(pitch,.18,.13);break;
      case 'stir':hiss(.25,340,800,.40);break;
      case 'comb':hiss(.38,2700,660,.58);break;
      case 'fling':tone(snap(73),.23,.19,'triangle',0,snap(48));break;
      case 'flare':hiss(1,2500,140,.74);break;
      case 'collision':tone(snap(33),.9,.63,'sine',0,snap(43));hiss(.72,870,73,.73);
      // Both the impact and the birth resolve to a small chord in the current key.
      case 'birth':case 'impact':case 'reignite':
        [pitch,snap(pitch+7),pitch+12].forEach((m,i)=>tone(m,.83-i*.12,.18,'sine',i*.057));break;
      case 'feed':tone(snap(36),.49,.43,'triangle',0,pitch);break;
      case 'shock':duckUntil=ctx.currentTime+3.25;mix();hiss(2.9,1800,52,1.1);tone(snap(30),2.8,.69,'sine',0,snap(40));break;
      case 'escape':case 'return':case 'visit':tone(snap(action==='return'?52:64),.55,.16,'sine',0,snap(57));break;
      case 'dissolve':hiss(.65,1200,290,.34);break;
      case 'collapse':tone(snap(32),1,.42,'sine',0,snap(50));break;
    }
  }
  function environment(heat, near=0, approach=0) {
    if(!ctx || (!wind&&!heat&&!near) || ctx.currentTime-lastWind<.055)return;
    const now=ctx.currentTime;lastWind=now;
    if(!wind){
      const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
      source.buffer=noise;source.loop=true;filter.type='lowpass';gain.gain.value=0;
      source.connect(filter).connect(gain).connect(effects);source.start();wind={gain,filter};
    }
    wind.filter.frequency.setTargetAtTime(90+heat*185+near*(270+approach*90),now,.15);
    wind.gain.gain.setTargetAtTime(.56*heat+.30*near,now,.2);
  }
  function bell(midi) {
    tone(snap(midi),1.16,.095,'sine');
    tone(snap(midi)+12,.53,.023,'sine',.019);
  }
  function chord(interval) {
    const scale=track().scale;
    const root=scale.map(p=>48+p).find(n=>inScale(n+interval,scale))??snap(48);
    tone(root,1.37,.095);
    tone(snap(root+interval),1.46,.085,'sine',.05);
  }
  return {
    wake, charge, play, environment, bell, chord, snap,
    splash(){hiss(.46,1420,240,.37);tone(snap(53),.36,.16,'sine',.035,snap(64));},
    tick(index){
      wanted=index;
      if(!ctx||ctx.currentTime-lastMix<.095)return;
      lastMix=ctx.currentTime;ensureTrack();mix();
    },
    setMusic(level){musicLevel=level;mix();},setEffects(level){effectsLevel=level;mix();},
    setPresence(level){sceneGain=level;},
    get muted(){return muted;},mute(){muted=!muted;mix();return muted;},
    state(){return {track:track().name,requested:soundtrack[wanted].name,running:ctx?.state==='running',
      fading:!!transition,musicLevel,effectsLevel,
      decks:decks?.filter(d=>d.index>=0).map(d=>({track:soundtrack[d.index].name,position:d.media.currentTime,
        ready:d.media.readyState,error:d.media.error?.message,gain:d.gain.gain.value}))??[]};}
  };
}
