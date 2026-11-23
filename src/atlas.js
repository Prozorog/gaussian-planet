import './atlas.css';
import { notes } from './atlas-notes.js';
import { diagram, illustrated, chartOnSky } from './atlas-diagrams.js';
import { createAstronomy } from './astronomy.js';

const $ = id => document.getElementById(id);
const storage = 'gaussian-planet.atlas.v1';
const topics = {
  Orbits: [1, 2, 3, 4, 5, 6, 11, 12],
  'The star': [7, 8, 9, 10, 13],
  'Life of the star': [17, 18, 19],
  'Black hole': [20, 21, 22, 23],
  Worlds: [14, 24, 25, 26, 27, 28],
  Music: [15, 16],
};

export const helpGroups = {
  Marble: [
    ['1–7 · ink wells', 'Choose ink'], ['Click / drag', 'Drop ink / stir'],
    ['Shift + drag', 'Comb'], ['Hold still', 'Hold to birth'],
    ['Right drag / wheel', 'Orbit / zoom'], ['R', 'Reset the system'],
    ['P / Postcard', 'Freeze, reframe, save a PNG or record a clip'],
  ],
  Worlds: [
    ['Pull a planet', 'Fling a world'], ['Click a planet', 'Visit and ink its surface'],
    ['Hold the star', 'Aim a flare or hold for a supernova'], ['S', 'Solar print'],
    ['7 / Void well', 'Hold empty ink for a second to form a black hole'],
    ['Drag the black hole', 'Move it. Double-click with coloured ink to remove it.'],
    ['Rekindle', 'Restore the star after a meal'],
  ],
  Drift: [
    ['D / double-click disc', 'Step inside'], ['Drag', 'Look around'], ['WASD / arrows', 'Float'],
    ['Space / C', 'Rise / sink'], ['Shift', 'Glide faster'], ['F / Ride', 'Ride a nearby world'],
    ['Enter / Dive', 'Sink into the world you are riding'], ['Esc / Rise to orbit', 'Leave the interior or rise out of Drift'],
    ['Inside a world', 'Use the world’s toy or drag with the right button to look'],
    ['Creatures', 'Ride a leviathan or feed it three inks. The creatures are a fairy tale.'],
    ['V / Voyage', 'Choose a flight. Drag to look, Space to pause, arrows for shots.'],
    ['WASD during a voyage', 'Take the helm at the current position'],
  ],
  Time: [['T / Timeline', 'Scrub five chapters or play the life of the star'],
    ['Space', 'Pause or resume orbits in the overview'], ['[ / ]', 'Change orbit speed']],
  Sound: [['M', 'Mute sound'], ['G / Chime line', 'Show or hide the orbital chimes'],
    ['Fling preview', 'Release near a tick to tune an orbit'], ['Music / Effects', 'Set their levels in Settings']],
  Atlas: [['B', 'Open the Sky Atlas'], ['N / O', 'Planet labels / orbit guides'],
    ['K / Z', 'Kepler sectors / habitable zone'], ['H', 'Settings and controls']],
};

export function createAtlas(s, c) {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storage)) || {}; } catch {}
  let enabled = saved.enabled !== false;
  const found = new Set((Array.isArray(saved.found) ? saved.found : [])
    .filter(i => Number.isInteger(i) && i >= 1 && i <= notes.length));
  const queue = [], shown = [];
  let current = 0, currentChapter = 1, expanded = false, manual = false, openedAt = 0, displayAt = 0, lastDraw = -1;
  let topic = 'Orbits';
  const book = $('atlas'), card = $('discovery'), grid = $('atlas-grid');
  const peek=document.createElement('button');
  peek.id='note-peek';peek.type='button';peek.setAttribute('aria-controls','note-body');
  $('note-close').before(peek);
  peek.onclick=()=>{card.classList.remove('compact-note');expanded=true;paintCard();$('note-close').focus({preventScroll:true});};
  const science = createAstronomy(s, c, discover);
  const records = saved.records ?? {};
  const toggle = $('notes-toggle');
  toggle.checked = enabled;
  s.zoneRadii = science.zoneRadii;

  function rememberBody({ name, id, r, x, y, z }) { return { name, id, r, x, y, z }; }
  function previousBody(key) {
    const b = records[key];
    return b && (s.bodies.find(o => o.name === b.name) ?? b);
  }
  function save() {
    if (science.gauge) {
      const { body, circular, escape, speed } = science.gauge;
      records.gauge = { body: rememberBody(body), circular, escape, speed };
    }
    if (science.assist) records.assist = science.assist;
    if (science.roche) records.roche = rememberBody(science.roche);
    if (science.rider) records.rider = rememberBody(science.rider);
    try { localStorage.setItem(storage, JSON.stringify({ found: [...found], enabled, records })); } catch {}
  }
  const tabs = new Map();
  for (const [name, ids] of Object.entries(topics)) {
    if (!ids.some(id => notes[id - 1])) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = name;
    button.onclick = () => { topic = name; drawBook(); };
    tabs.set(name, button);
  }
  $('atlas-tabs').replaceChildren(...tabs.values());
  function drawBook() {
    $('atlas-count').textContent = `Discovered ${found.size} / ${notes.length}`;
    for (const [name, button] of tabs) button.setAttribute('aria-pressed', String(name === topic));
    const children = topics[topic].filter(id => notes[id - 1]).map(id => {
      const [titleText, , , , hintText] = notes[id - 1];
      const b = document.createElement('button');
      b.className = 'atlas-slot';
      b.type = 'button';
      b.disabled = !found.has(id);
      const no = document.createElement('i'), title = document.createElement('strong');
      no.textContent = String(id).padStart(2, '0');
      title.textContent = titleText;
      b.append(no, title);
      if (b.disabled) {
        const hint = document.createElement('small');
        hint.textContent = hintText;
        b.append(hint);
      } else b.onclick = () => show(id, true);
      return b;
    });
    grid.replaceChildren(...children);
  }
  function bookOpen(open) {
    book.hidden = !open;
    $('book-toggle').setAttribute('aria-expanded', String(open));
    if (open) { $('settings').open = false; drawBook(); }
    else if (manual) close();
  }
  function paintCard() {
    if (!current) return;
    const [title, body, extra, scale] = notes[current - 1];
    $('note-meta').textContent = 'Sky Atlas / ' + String(current).padStart(2, '0');
    $('note-title').textContent = title;
    peek.textContent=title;peek.setAttribute('aria-label','Read Atlas note: '+title);
    $('note-body').textContent = body;
    $('note-extra').textContent = extra;
    $('note-extra').hidden = !expanded;
    $('note-scale').textContent = scale;
    $('note-more').textContent = expanded ? '−  Less' : '+  More';
    $('note-more').hidden = !extra;
    $('note-more').setAttribute('aria-expanded', String(expanded));
    $('note-diagram').hidden = !illustrated.has(current);
    if (illustrated.has(current)) diagram($('note-diagram'), current, s, c, science);
  }
  function show(id, fromBook = false) {
    if(s.voyage?.active)return;
    if (id === 3 && !science.gauge) science.gauge = records.gauge;
    if (id === 4 && !science.assist) science.assist = records.assist;
    if (id === 6 && !science.roche) science.roche = previousBody('roche');
    if (id === 14 && !science.rider) science.rider = previousBody('rider') ?? s.bodies[0];
    current = id; manual = fromBook; expanded = fromBook; openedAt = s.t; card.hidden = false;
    card.classList.toggle('compact-note',!fromBook);
    currentChapter=s.life?.chapter??1;
    if (!fromBook) shown.push(id);
    paintCard();
  }
  function close() {
    current = 0; manual = false; expanded = false; card.hidden = true; displayAt = s.t + .23;
  }
  function discover(id) {
    if (found.has(id)) return;
    found.add(id);
    save();
    if (!book.hidden) drawBook();
    if(s.voyage?.active)s.voyage.discovered();
    else if(enabled)queue.push({id,chapter:s.life?.chapter??1});
  }
  function chapterChanged(next){
    const chapter=s.life.chapter;
    for(let i=queue.length-1;i>=0;i--)if(queue[i].chapter!==chapter)queue.splice(i,1);
    if(current&&currentChapter!==chapter)close();
    displayAt=s.t;
    if(enabled&&next.note&&found.has(next.note)&&!s.voyage?.active){
      if(book.hidden)show(next.note);
      else queue.unshift({id:next.note,chapter});
    }
  }
  function action() {
    if (!manual && !expanded && current && s.t - openedAt > 1.2) close();
  }
  function mode() {
    const drift = c.mode === 'drift'||c.mode==='voyage';
    $('stage').classList.toggle('drifting', drift);

  }
  toggle.onchange = () => {
    enabled = toggle.checked;
    if (!enabled) { queue.length = 0; if (!manual) close(); }
    save();
  };
  $('book-toggle').onclick = () => bookOpen(book.hidden);
  $('atlas-close').onclick = () => bookOpen(false);
  $('note-close').setAttribute('aria-label', 'Close note');
  $('note-close').onclick = close;
  $('note-more').onclick = () => { expanded = !expanded; openedAt = s.t; paintCard(); };
  $('drift-hint').textContent = 'Drag to look · WASD to float · Space / C to rise or sink · Click to drop ink · Hold F to ride · Esc to rise out';
  function tick(dt, preview) {
    science.tick(dt);
    if (current && !manual && !expanded && s.t - openedAt >= 10) close();
    if (enabled && !s.voyage?.active && !current && queue.length && s.t >= displayAt && book.hidden) show(queue.shift().id);
    s.zoneNote = current === 12;
    if (current && illustrated.has(current) && s.t - lastDraw > .048) {
      diagram($('note-diagram'), current, s, c, science);
      lastDraw = s.t;
    }
    chartOnSky($('sky-chart'), s, c, science, current, preview);
    $('drift-hint').hidden = !(c.mode === 'drift' && !s.worlds?.body && !c.flying && c.drift.hintUntil > s.t);
  }
  mode();
  drawBook();
  save();
  return { science, discover, chapterChanged, tick, action, mode, bookOpen,
    dismiss(){queue.length=0;close();},
    get open() { return !book.hidden; }, toggleBook() { bookOpen(book.hidden); },
    state() { return { enabled, found: [...found], shown: shown.slice(), current, queued: queue.map(item=>item.id),
      labels: science.labels, zone: !!s.zone, zoneRadii: science.zoneRadii(), light: science.light,
      transiting: science.transiting?.name ?? null, wedges: science.wedges }; } };
}

export function drawHelp(mode='bench', playing=false, touch=false) {
  const contents = $('help-groups');
  const groups=mode==='voyage'?{Film:playing?[
    ['Drag','Look around'],['Click / 1–7','Drop ink / choose ink'],['Space','Pause or resume'],
    ['← / →','Previous or next shot'],['WASD','Take the helm'],['P','Postcard'],['Esc','Return to Bench']
  ]:[['Select a film','Start watching'],['D','Fly in Drift'],['Esc','Return to Bench']]}:
    mode==='drift'?{Drift:helpGroups.Drift.slice(0,-2)}:Object.fromEntries(Object.entries(helpGroups).filter(([name])=>name!=='Drift'));
  contents.replaceChildren();
  const gestures=mode==='voyage'?{Voyage:playing?[
    ['Tap the sky','Show the film controls'],['Drag','Look around'],['Take the helm','Fly from here'],['Films','Return to the picker']
  ]:[['Tap a film','Start watching'],['Drift / Bench','Fly or marble the system']]}:
    mode==='drift'?{Drift:[['Slide the pad','Fly forward, back or sideways'],['↑ / ↓','Rise or sink'],['Drag the sky','Look around'],['Tap the ink','Leave a ripple'],['Ride / Dive','Ride a nearby world, then enter it'],['Bench','Return to the table']]}:
    {Bench:[['Tap / drag','Drop ink or stir'],['Comb, then drag','Rake lines through the ink'],['Two fingers','Slide to orbit. Pinch to zoom.'],['Pull a world','Fling it into a new orbit'],['Hold the ink / star','Birth a world or wake a flare'],['Timeline','Visit the five ages of the star'],['Chime line','Toggle orbital chimes']]};
  for (const [name, rows] of Object.entries(touch?gestures:groups)) {
    const heading = document.createElement('h3'), list = document.createElement('dl');
    heading.textContent = name;
    for (const [key, description] of rows) {
      const input = document.createElement('dt'), effect = document.createElement('dd');
      input.textContent = key;
      effect.textContent = description;
      list.append(input, effect);
    }
    contents.append(heading, list);
  }
}
