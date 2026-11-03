// Música y efectos, sintetizados con Web Audio (sin archivos de sonido), como en El Pino Calcinado.
// La música cambia con el sitio (setMood): la tienda, un bossa tranquilo de perfumería; la calle, algo
// más alegre; el taller, pensativo; el cierre, lento; el día de la baja, desafinado; el epílogo, a
// media luz. Los efectos son cortos y suaves. El audio arranca con el primer toque, como piden los
// navegadores, y se para con la pestaña oculta. Los interruptores se guardan en localStorage
// (mililitros-de-perfume-audio: { music, sfx }).

const CLAVE = 'mililitros-de-perfume-audio';
let ctx = null, master, musicBus, sfxBus;
let prefs = { music: true, sfx: true };
let mood = 'tienda', timer = null, nextBar = 0, bar = 0;

try { prefs = { ...prefs, ...JSON.parse(localStorage.getItem(CLAVE) || '{}') }; } catch { /* sin almacenamiento */ }
function savePrefs() {
  try { localStorage.setItem(CLAVE, JSON.stringify(prefs)); } catch { /* sin almacenamiento */ }
}

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.6; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = prefs.music ? 0.2 : 0; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = prefs.sfx ? 0.5 : 0; sfxBus.connect(master);
  }
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  return ctx;
}

// Cualquier toque despierta el audio; con la pestaña en segundo plano se para todo
const despertar = () => { if (ensure() && !timer && prefs.music) startMusic(); };
window.addEventListener('pointerdown', despertar);
window.addEventListener('keydown', despertar);
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) { pararMusica(); ctx.suspend().catch(() => {}); }
  else despertar();
});
window.addEventListener('pageshow', () => { if (ctx) despertar(); });

export function getPrefs() { return { ...prefs }; }
export function setMusic(on) {
  prefs.music = on; savePrefs();
  if (ensure()) musicBus.gain.setTargetAtTime(on ? 0.2 : 0, ctx.currentTime, 0.1);
  if (on) startMusic(); else pararMusica();
}
export function setSfx(on) {
  prefs.sfx = on; savePrefs();
  if (ensure()) sfxBus.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.05);
}

// ---------- música ----------
const MIDI = n => 440 * 2 ** ((n - 69) / 12);
// Por sitio: tempo, tónica (MIDI), acordes (grados sobre la tónica), cómo va el bajo, el arpegio y
// la melodía (null: sin melodía; si no, al azar sobre la escala, repetida cada cuatro compases)
const MOODS = {
  tienda: { bpm: 96, root: 50, chords: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]], bass: 'bossa', arp: [0, 2, 1, 3], arpType: 'triangle', lead: true, leadType: 'sine', leadVol: 0.07, scale: [0, 2, 4, 7, 9, 11, 14] },
  calle: { bpm: 112, root: 48, chords: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], arp: [0, 1, 2, 1], arpType: 'square', lead: true, leadType: 'triangle', leadVol: 0.08, drum: 'k.h.s.h.' },
  taller: { bpm: 80, root: 45, chords: [[0, 3, 7], [5, 8, 12], [-2, 2, 5], [3, 7, 10]], bass: 'pedal', arp: [0, 1, 2, 3, 2, 1], arpType: 'sine', lead: false },
  cierre: { bpm: 70, root: 43, chords: [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]], arp: [0, 1, 2], arpType: 'sine', lead: true, leadType: 'sine', leadVol: 0.06 },
  baja: { bpm: 64, root: 44, chords: [[0, 3, 6], [1, 4, 7], [0, 3, 6], [-1, 2, 5]], bass: 'pedal', arp: [0, 2, 1], arpType: 'sawtooth', lead: false, desafina: true },
  epilogo: { bpm: 60, root: 43, chords: [[0, 4, 7, 11], [-3, 0, 4, 7], [5, 9, 12, 16], [7, 11, 14, 17]], arp: [0, 1, 2, 3], arpType: 'sine', lead: true, leadType: 'sine', leadVol: 0.07 },
};
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];

function note(freq, start, dur, { type = 'triangle', vol = 0.3, bus = musicBus, attack = 0.01 } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g); g.connect(bus);
  o.start(start); o.stop(start + dur + 0.05);
}

let ruido = null;
function ruidoBuf() {
  if (!ruido) {
    ruido = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
    const d = ruido.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return ruido;
}
function drum(kind, t) {
  if (kind === 'k') {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.16);
    return;
  }
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  const [freq, d, v] = kind === 's' ? [1500, 0.12, 0.16] : [7000, 0.035, 0.07];
  src.buffer = ruidoBuf(); f.type = 'highpass'; f.frequency.value = freq;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  src.connect(f); f.connect(g); g.connect(musicBus); src.start(t); src.stop(t + d + 0.02);
}

function scheduleBar(t0) {
  const m = MOODS[mood] || MOODS.tienda;
  const beat = 60 / m.bpm, beats = 4, sub = 2;
  const chord = m.chords[bar % m.chords.length];
  const root = m.root;
  const desaf = () => (m.desafina ? 1 + (Math.random() - 0.5) * 0.03 : 1);
  const bajo = n => MIDI(root + n - 12) * desaf();
  if (m.bass === 'bossa') {
    // el bajo de bossa: tónica, quinta, tónica sincopada
    note(bajo(chord[0]), t0, beat * 1.4, { vol: 0.32 });
    note(bajo(chord[2]), t0 + beat * 1.5, beat * 0.9, { vol: 0.25 });
    note(bajo(chord[0]), t0 + beat * 2.5, beat * 1.2, { vol: 0.28 });
    // y la guitarra a contratiempo
    for (const k of [0.5, 1.5, 2.5, 3.5]) for (const n of chord.slice(1)) note(MIDI(root + 12 + n), t0 + k * beat, beat * 0.35, { type: 'triangle', vol: 0.03 });
  } else if (m.bass === 'pedal') {
    note(bajo(0) * desaf(), t0, beat * beats, { type: 'sawtooth', vol: 0.04, attack: 0.08 });
  } else {
    note(bajo(chord[0]), t0, beat * 1.8, { vol: 0.32 });
    note(bajo(chord[0]), t0 + beat * 2, beat * 1.8, { vol: 0.26 });
  }
  if (m.arp) {
    for (let i = 0; i < beats * sub; i++) {
      note(MIDI(root + 12 + chord[m.arp[i % m.arp.length] % chord.length]) * desaf(), t0 + i * beat / sub, beat / sub * 0.9, { type: m.arpType, vol: 0.045 });
    }
  }
  if (m.lead) {
    const escala = m.scale || PENTA;
    let seed = (bar % 4) * 97 + 13 + mood.length * 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let i = 0; i < beats; i++) {
      if (rnd() < 0.35) continue;
      note(MIDI(root + 24 + escala[Math.floor(rnd() * escala.length)]), t0 + i * beat, beat * 0.9, { type: m.leadType, vol: m.leadVol });
    }
  }
  if (m.drum) [...m.drum].forEach((k, i) => { if (k !== '.') drum(k, t0 + i * beat * beats / m.drum.length); });
  bar += 1;
  return beat * beats;
}

function pararMusica() { clearInterval(timer); timer = null; }
function startMusic() {
  if (timer || !ctx || !prefs.music) return;
  nextBar = ctx.currentTime + 0.1;
  timer = setInterval(() => {
    if (nextBar < ctx.currentTime - 1) nextBar = ctx.currentTime + 0.05;
    while (nextBar < ctx.currentTime + 0.6) nextBar += scheduleBar(nextBar);
  }, 150);
}

// La música de cada sitio (tienda, calle, taller, cierre, baja, epilogo)
export function setMood(m) {
  if (m === mood || !MOODS[m]) return;
  mood = m;
  bar = 0;
}

// ---------- efectos ----------
export function sfx(nombre) {
  if (!ensure() || !prefs.sfx) return;
  const t = ctx.currentTime + 0.01;
  const S = { bus: sfxBus };
  const n = (f, dt, d, o = {}) => note(f, t + dt, d, { ...S, ...o });
  switch (nombre) {
    case 'toque': n(880, 0, 0.05, { type: 'square', vol: 0.05 }); break;
    case 'echar': {   // el ingrediente cae en el frasco: un «gloc» que baja
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(220, t + 0.16);
      g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.22);
      break;
    }
    case 'deshacer': n(330, 0, 0.12, { type: 'triangle', vol: 0.18 }); n(220, 0.08, 0.16, { type: 'triangle', vol: 0.15 }); break;
    case 'embotellar': n(523, 0, 0.08, { type: 'square', vol: 0.08 }); n(784, 0.06, 0.12, { type: 'square', vol: 0.08 }); break;
    case 'caja': [1568, 2093, 2637].forEach((f, i) => n(f, i * 0.05, 0.25, { type: 'square', vol: 0.06 })); break;
    case 'perfecto': [523, 659, 784, 1047].forEach((f, i) => n(f, i * 0.09, 0.3, { type: 'triangle', vol: 0.18 })); break;
    case 'bien': n(523, 0, 0.15, { type: 'triangle', vol: 0.15 }); n(659, 0.1, 0.2, { type: 'triangle', vol: 0.15 }); break;
    case 'mal': n(311, 0, 0.25, { type: 'sawtooth', vol: 0.08 }); n(233, 0.18, 0.4, { type: 'sawtooth', vol: 0.08 }); break;
    case 'puerta': [1318, 1046].forEach((f, i) => n(f, i * 0.12, 0.35, { type: 'sine', vol: 0.12 })); break;   // la campanita
    case 'telefono': for (let k = 0; k < 2; k++) for (let i = 0; i < 8; i++) n(i % 2 ? 1300 : 1600, k * 0.5 + i * 0.04, 0.04, { type: 'square', vol: 0.05 }); break;
    case 'espray': {
      const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = ruidoBuf(); f.type = 'highpass'; f.frequency.value = 4000;
      g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      src.connect(f); f.connect(g); g.connect(sfxBus); src.start(t); src.stop(t + 0.14);
      break;
    }
    case 'risa': [0, 0.12, 0.24, 0.36].forEach((dt, i) => n(500 - i * 30, dt, 0.09, { type: 'square', vol: 0.06 })); break;
    case 'corte': n(1800, 0, 0.03, { type: 'square', vol: 0.06 }); n(1200, 0.03, 0.03, { type: 'square', vol: 0.06 }); break;
    case 'fallo': n(150, 0, 0.18, { type: 'square', vol: 0.08 }); break;
    case 'logro': [784, 988, 1175].forEach((f, i) => n(f, i * 0.07, 0.2, { type: 'triangle', vol: 0.16 })); break;
    default: break;
  }
}

// El gemido de la cola de Girafarig, de gusto: empieza con la boca cerrada («mmmh», un zumbido grave y
// suave), se abre en un «aaah» que sube y cae despacio, con un temblor lento y aire de suspiro por
// encima. Cada vez un poco distinto; con largo, el suspiro dura más (el de «qué gustito»).
export function gemido(largo = false) {
  const c = ensure();
  if (!c || !prefs.sfx) return;
  const t = c.currentTime + 0.02;
  const dura = (largo ? 1.9 : 1.2) + Math.random() * 0.3;
  const abre = dura * 0.32;                                   // cuándo pasa del «mmm» al «aaah»
  const base = 185 + Math.random() * 35;
  const voz = c.createOscillator();
  voz.type = 'sawtooth';
  voz.frequency.setValueAtTime(base * 0.92, t);
  voz.frequency.linearRampToValueAtTime(base, t + abre);
  voz.frequency.exponentialRampToValueAtTime(base * 1.6, t + abre + dura * 0.18);   // el «aah» sube
  voz.frequency.exponentialRampToValueAtTime(base * 0.78, t + dura);                 // y cae, a gusto
  // el temblor de la voz, lento y cada vez más hondo
  const lfo = c.createOscillator(), prof = c.createGain();
  lfo.frequency.value = 4.2 + Math.random();
  prof.gain.setValueAtTime(base * 0.01, t);
  prof.gain.linearRampToValueAtTime(base * 0.05, t + dura);
  lfo.connect(prof).connect(voz.frequency);
  // la boca: de cerrada (todo grave) a abierta (las dos vocales de la «a»)
  const boca = c.createBiquadFilter();
  boca.type = 'lowpass'; boca.Q.value = 1;
  boca.frequency.setValueAtTime(420, t);
  boca.frequency.linearRampToValueAtTime(500, t + abre);
  boca.frequency.linearRampToValueAtTime(2400, t + abre + 0.12);
  boca.frequency.linearRampToValueAtTime(1300, t + dura);
  const f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter();
  f1.type = f2.type = 'peaking';
  f1.gain.value = 10; f2.gain.value = 7; f1.Q.value = 3; f2.Q.value = 4;
  f1.frequency.setValueAtTime(780, t); f1.frequency.linearRampToValueAtTime(650, t + dura);
  f2.frequency.setValueAtTime(1200, t); f2.frequency.linearRampToValueAtTime(1050, t + dura);
  const vol = c.createGain();
  vol.gain.setValueAtTime(0.0001, t);
  vol.gain.exponentialRampToValueAtTime(0.12, t + 0.15);              // el «mmm», bajito
  vol.gain.linearRampToValueAtTime(0.13, t + abre);
  vol.gain.linearRampToValueAtTime(0.3, t + abre + 0.1);               // se abre
  vol.gain.setValueAtTime(0.3, t + dura * 0.6);
  vol.gain.exponentialRampToValueAtTime(0.0001, t + dura);
  voz.connect(boca).connect(f1).connect(f2).connect(vol).connect(sfxBus);
  // el aire del suspiro: ruido suave filtrado, sobre todo al final
  const n = Math.floor(c.sampleRate * dura), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let k = 0; k < n; k++) d[k] = Math.random() * 2 - 1;
  const aire = c.createBufferSource(); aire.buffer = buf;
  const fa = c.createBiquadFilter(); fa.type = 'bandpass'; fa.frequency.value = 1500; fa.Q.value = 0.8;
  const va = c.createGain();
  va.gain.setValueAtTime(0.0001, t);
  va.gain.linearRampToValueAtTime(0.02, t + abre);
  va.gain.linearRampToValueAtTime(0.07, t + dura * 0.85);
  va.gain.exponentialRampToValueAtTime(0.0001, t + dura);
  aire.connect(fa).connect(va).connect(sfxBus);
  voz.start(t); lfo.start(t); aire.start(t);
  voz.stop(t + dura + 0.05); lfo.stop(t + dura + 0.05); aire.stop(t + dura + 0.05);
}

// Mientras suena un vídeo (los sucesos), la música se baja
export function bajaMusica(si) {
  if (!ctx) return;
  musicBus.gain.setTargetAtTime(si ? 0.0001 : (prefs.music ? 0.2 : 0), ctx.currentTime, 0.2);
}
