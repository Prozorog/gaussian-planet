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
    ['Space / C', 'Rise / sink'], ['Shift', 'Glide faster'], ['F', 'Ride a nearby world'], ['Esc', 'Rise out'],
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
  let current = 0, expanded = false, manual = false, openedAt = 0, displayAt = 0, lastDraw = -1;
  let topic = 'Orbits';
  const book = $('atlas'), card = $('discovery'), grid = $('atlas-grid');
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
    if (id === 3 && !science.gauge) science.gauge = records.gauge;
    if (id === 4 && !science.assist) science.assist = records.assist;
    if (id === 6 && !science.roche) science.roche = previousBody('roche');
    if (id === 14 && !science.rider) science.rider = previousBody('rider') ?? s.bodies[0];
    current = id; manual = fromBook; expanded = fromBook; openedAt = s.t; card.hidden = false;
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
    if (enabled) queue.push(id);
  }
  function action() {
    if (!manual && !expanded && current && s.t - openedAt > 1.2) close();
  }
  function mode() {
    const drift = c.mode === 'drift';
    $('stage').classList.toggle('drifting', drift);
    const button = $('step-inside');
    button.querySelector('span').textContent = drift ? 'Rise out' : 'Step inside';
    button.querySelector('kbd').textContent = drift ? 'Esc' : 'D';
    button.title = drift ? 'Rise out (Esc)' : 'Step inside (D)';
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
    if (enabled && !current && queue.length && s.t >= displayAt && book.hidden) show(queue.shift());
    s.zoneNote = current === 12;
    if (current && illustrated.has(current) && s.t - lastDraw > .048) {
      diagram($('note-diagram'), current, s, c, science);
      lastDraw = s.t;
    }
    chartOnSky($('sky-chart'), s, c, science, current, preview);
    $('drift-hint').hidden = !(c.mode === 'drift' && !c.flying && c.drift.hintUntil > s.t);
  }
  mode();
  drawBook();
  save();
  return { science, discover, tick, action, mode, bookOpen,
    get open() { return !book.hidden; }, toggleBook() { bookOpen(book.hidden); },
    state() { return { enabled, found: [...found], shown: shown.slice(), current, queued: queue.slice(),
      labels: science.labels, zone: !!s.zone, zoneRadii: science.zoneRadii(), light: science.light,
      transiting: science.transiting?.name ?? null, wedges: science.wedges }; } };
}

export function drawHelp() {
  const contents = $('help-groups');
  for (const [name, rows] of Object.entries(helpGroups)) {
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
