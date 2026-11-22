import './atlas.css';
import {notes} from './atlas-notes.js';
import {diagram,illustrated,chartOnSky} from './atlas-diagrams.js';
import {createAstronomy} from './astronomy.js';

const $=id=>document.getElementById(id);
const storage='gaussian-planet.atlas.v1';
const ui={
  ru:{book:'Небесный атлас',notes:'Заметки об открытиях',language:'Язык',more:'Подробнее',less:'Свернуть',
    close:'Закрыть',enter:'Шаг внутрь',exit:'К общему виду',found:'Открыто',settings:'Настройки оттиска',
    hint:'Тяните, чтобы осмотреться · WASD — плыть · Space / C — вверх и вниз · Щелчок — капля краски · У планеты удерживайте F · Esc — выйти',
    inks:['Огонь','Роза','Аметист','Лазурь','Изумруд','Золото'],verbs:['Капнуть краску','Закрутить поток','Провести гребнем','Бросить планету','Удержать для рождения','Удержать звезду']},
  en:{book:'Sky Atlas',notes:'Discovery notes',language:'Language',more:'More',less:'Less',close:'Close',enter:'Step inside',exit:'Rise out',found:'Discovered',settings:'Print settings',
    hint:'Drag to look · WASD to float · Space/C up/down · Click to drop ink · Hold F near a planet to ride · Esc to rise out',
    inks:['Fire','Rose','Violet','Teal','Emerald','Gold'],verbs:['Drop ink','Stir','Comb','Fling a planet','Hold to birth a planet','Hold the sun']}
};
const helpRows=[
  ['1–6','Выбрать краску','Choose ink'],['Щелчок / drag','Капнуть / закрутить поток','Drop / stir'],['Shift + drag','Провести гребнем','Seven-tine comb'],
  ['Hold','Создать мир · 0,6–3 с','Birth a world · 0.6–3 s'],['Drag ↗','Оттянуть и бросить планету','Pull and fling a planet'],
  ['Click ◉','Посетить и расписать планету','Visit and ink a planet'],['Hold ☉','Вспышка · 4 с для сверхновой','Aim a flare · 4 s for nova'],
  ['RMB / wheel','Повернуть / приблизить','Orbit / zoom'],['Space · [ ]','Пауза · скорость орбит','Pause · orbit speed'],['O · M · S','Орбиты · звук · портрет Солнца','Guides · mute · solar print'],['Esc · R','Назад · исходная система','Return · reset system'],
  ['D / 2×','Войти в дрейф','Step inside'],['B · N · L','Атлас · подписи · язык','Atlas · labels · language'],['K · Z','Секторы Кеплера · обитаемая зона','Kepler sectors · habitable zone']
];
export function createAtlas(s,c) {
  let saved={};try{saved=JSON.parse(localStorage.getItem(storage))||{};}catch{}
  let lang=saved.lang==='en'?'en':'ru',enabled=saved.enabled!==false;
  const found=new Set((Array.isArray(saved.found)?saved.found:[]).filter(i=>Number.isInteger(i)&&i>=1&&i<=14));
  const queue=[],shown=[];
  let current=0,expanded=false,manual=false,openedAt=0,displayAt=0,lastDraw=-1;
  const book=$('atlas'),card=$('discovery'),grid=$('atlas-grid');
  const science=createAstronomy(s,c,discover);
  const records=saved.records??{};
  function rememberBody(b){return {name:b.name,id:b.id,r:b.r,x:b.x,y:b.y,z:b.z};}
  function previousBody(key){const b=records[key];return b&&(s.bodies.find(o=>o.name===b.name)??b);}
  s.zoneRadii=science.zoneRadii;
  const settings=$('settings').querySelector('section');
  const check=document.createElement('label'),language=document.createElement('label');
  const toggle=document.createElement('input'),select=document.createElement('select');
  toggle.type='checkbox';toggle.checked=enabled;select.innerHTML='<option value="ru">Русский</option><option value="en">English</option>';
  check.append(document.createTextNode(''),toggle);language.append(document.createTextNode(''),select);
  settings.insertBefore(check,settings.querySelector('h3'));check.after(language);
  const copy=()=>ui[lang];
  function save(){
    if(science.gauge){const {body,circular,escape,speed}=science.gauge;records.gauge={body:rememberBody(body),circular,escape,speed};}
    if(science.assist)records.assist=science.assist;
    if(science.roche)records.roche=rememberBody(science.roche);
    if(science.rider)records.rider=rememberBody(science.rider);
    try{localStorage.setItem(storage,JSON.stringify({found:[...found],lang,enabled,records}));}catch{}
  }
  function drawBook(){
    const words=copy();$('atlas-title').textContent=words.book;
    $('atlas-count').textContent=words.found+'   '+found.size+' / 14';
    const children=notes.map((n,i)=>{
      const data=n[lang],b=document.createElement('button');
      b.className='atlas-slot';b.type='button';b.disabled=!found.has(i+1);
      const no=document.createElement('i'),title=document.createElement('strong');
      no.textContent=String(i+1).padStart(2,'0');title.textContent=data[0];b.append(no,title);
      if(b.disabled){const hint=document.createElement('small');hint.textContent=data[4];b.append(hint);}
      else b.onclick=()=>show(i+1,true);
      return b;
    });
    grid.replaceChildren(...children);
  }
  function bookOpen(open) {
    book.hidden=!open;$('book-toggle').setAttribute('aria-expanded',String(open));
    if(open){$('settings').open=false;drawBook();}
    else if(manual)close();
  }
  function paintCard(){
    if(!current)return;
    const n=notes[current-1][lang],words=copy();
    $('note-meta').textContent=words.book.toLocaleUpperCase(lang)+'   /   '+String(current).padStart(2,'0');
    $('note-title').textContent=n[0];$('note-body').textContent=n[1];$('note-extra').textContent=n[2];
    $('note-extra').hidden=!expanded;$('note-scale').textContent=n[3];
    $('note-more').textContent=(expanded?'−  ':'+  ')+(expanded?words.less:words.more);
    $('note-more').setAttribute('aria-expanded',String(expanded));
    $('note-diagram').hidden=!illustrated.has(current);
    if(illustrated.has(current))diagram($('note-diagram'),current,s,c,science,lang==='ru');
  }
  function show(id,fromBook=false){
    if(id===3&&!science.gauge)science.gauge=records.gauge;
    if(id===4&&!science.assist)science.assist=records.assist;
    if(id===6&&!science.roche)science.roche=previousBody('roche');
    if(id===14&&!science.rider)science.rider=previousBody('rider')??s.bodies[0];
    current=id;manual=fromBook;expanded=fromBook;openedAt=s.t;card.hidden=false;
    if(!fromBook)shown.push(id);
    paintCard();
  }
  function close(){current=0;manual=false;expanded=false;card.hidden=true;displayAt=s.t+.23;}
  function discover(id){
    if(found.has(id))return;
    found.add(id);save();if(!book.hidden)drawBook();if(enabled)queue.push(id);
  }
  function action(){
    if(!manual&&!expanded&&current&&s.t-openedAt>1.2)close();
  }
  function mode(){
    const words=copy(),drift=c.mode==='drift';
    $('stage').classList.toggle('drifting',drift);$('step-inside').querySelector('span').textContent=drift?words.exit:words.enter;
    $('step-inside').querySelector('kbd').textContent=drift?'Esc':'D';
    $('step-inside').title=drift?words.exit+' (Esc)':words.enter+' (D)';
    $('drift-hint').textContent=words.hint;
    const rows=drift?[
      ['Drag',lang==='ru'?'Осмотреться':'Look around'],['W A S D / ↑ ← ↓ →',lang==='ru'?'Плыть':'Float'],['Space / C',lang==='ru'?'Вверх / вниз':'Rise / sink'],
      ['Shift',lang==='ru'?'Быстрее':'Glide faster'],['Click · 1–6',lang==='ru'?'Капнуть · выбрать краску':'Drop · select ink'],['F',lang==='ru'?'Лететь вместе с планетой':'Ride a nearby planet'],
      ['Esc',words.exit],['B · N · L',lang==='ru'?'Атлас · подписи · язык':'Atlas · labels · language'],['M · H',lang==='ru'?'Звук · справка':'Mute · help']
    ]:helpRows.map(([key,ru,en])=>[key==='Щелчок / drag'&&lang==='en'?'Click / drag':key,lang==='ru'?ru:en]);
    const dl=settings.querySelector('dl');dl.replaceChildren();
    const keysRu={'Щелчок / drag':'Щелчок / тянуть','Hold':'Удерживать','Drag ↗':'Тянуть планету','Click ◉':'Щелчок по планете','Hold ☉':'Удерживать звезду','RMB / wheel':'ПКМ / колесо','D / 2×':'D / двойной щелчок','Drag':'Тянуть мышью','Click · 1–6':'Щелчок · 1–6','Shift + drag':'Shift + тянуть'};
    for(const [key,desc] of rows){const k=document.createElement('dt'),v=document.createElement('dd');k.textContent=lang==='ru'?(keysRu[key]??key):key;v.textContent=desc;dl.append(k,v);}
    settings.querySelector('h3').textContent=drift?(lang==='ru'?'В дрейфе':'In Drift'):(lang==='ru'?'За работой':'At the bench');
  }
  function localize(){
    const words=copy(),ru=lang==='ru';document.documentElement.lang=lang;
    document.title='Gaussian Planet · '+(ru?'Дрейф и Небесный атлас':'Drift and Sky Atlas');
    $('sky').setAttribute('aria-label',ru?'Мраморная звёздная система. Нажмите H для справки.':'Marbled star system. Press H for controls.');
    select.value=lang;check.firstChild.nodeValue=words.notes;language.firstChild.nodeValue=words.language;
    settings.querySelector('h2').textContent=words.settings;
    ['quality','density','resolution'].forEach((id,i)=>{$(id).parentElement.firstChild.nodeValue=(ru?['Качество','Густота линий','Сетка потока']:['Quality','Line density','Fluid grid'])[i];});
    [...$('quality').options].forEach((opt,i)=>{opt.textContent=(ru?['Высокое','Низкое']:['High','Low'])[i];});
    $('book-toggle').title=words.book+' (B)';$('book-toggle').setAttribute('aria-label',words.book);
    $('settings').querySelector('summary').setAttribute('aria-label',words.settings+' (H)');
    $('settings').querySelector('summary').title=words.settings+' (H)';
    for(const id of ['note-close','atlas-close'])$(id).setAttribute('aria-label',words.close);
    document.querySelector('.legend span').textContent=ru?'Краски':'Ink bench';
    document.querySelectorAll('.well').forEach((b,i)=>{b.querySelector('span').textContent=words.inks[i];b.title=words.inks[i]+' · '+(i+1);b.setAttribute('aria-label',b.title);});
    document.querySelectorAll('.chip').forEach((chip,i)=>{chip.textContent=words.verbs[i];});
    document.querySelector('#plate span').textContent=ru?'Щелчок — краска · Тяните для вихря · Esc — назад':'Click to ink · drag to stir · Esc to return';
    mode();drawBook();paintCard();save();
  }
  toggle.onchange=()=>{enabled=toggle.checked;if(!enabled){queue.length=0;if(!manual)close();}save();};
  select.onchange=()=>{lang=select.value;localize();};
  $('book-toggle').onclick=()=>bookOpen(book.hidden);$('atlas-close').onclick=()=>bookOpen(false);
  $('note-close').onclick=close;$('note-more').onclick=()=>{expanded=!expanded;openedAt=s.t;paintCard();};
  function tick(dt,preview){
    science.tick(dt);
    if(current&&!manual&&!expanded&&s.t-openedAt>=10)close();
    if(enabled&&!current&&queue.length&&s.t>=displayAt&&book.hidden)show(queue.shift());
    s.zoneNote=current===12;
    if(current&&illustrated.has(current)&&s.t-lastDraw>.048){
      diagram($('note-diagram'),current,s,c,science,lang==='ru');lastDraw=s.t;
    }
    chartOnSky($('sky-chart'),s,c,science,current,lang==='ru',preview);
    $('drift-hint').hidden=!(c.mode==='drift'&&!c.flying&&c.drift.hintUntil>s.t);
  }
  localize();
  return {science,discover,tick,action,mode,bookOpen,get ru(){return lang==='ru';},get open(){return !book.hidden;},
    language(){lang=lang==='ru'?'en':'ru';localize();},toggleBook(){bookOpen(book.hidden);},
    state(){return {lang,enabled,found:[...found],shown:shown.slice(),current,queued:queue.slice(),labels:science.labels,zone:!!s.zone,
      zoneRadii:science.zoneRadii(),light:science.light,transiting:science.transiting?.name??null,wedges:science.wedges};}};
}
