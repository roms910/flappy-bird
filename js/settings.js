/* ============================================================================
 * CYBER FLAPPY — SETTINGS (window.CFSettings)
 * Preset grafik (Potato/Low/Medium/High/Ultra/Custom/Auto), pengaturan audio,
 * penyimpanan di localStorage, auto-turunkan kualitas saat FPS jelek, dan menu UI.
 * ========================================================================== */
(function () {
'use strict';
const KEY = 'cf_settings_v1';
const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------- preset grafik
// res = batas rasio piksel kanvas | fps 0 = ikut refresh layar | bg/bird/glitch: 2 penuh, 1 ringan, 0 mati
const PRESETS = {
  potato: { res: .6, fps: 30, bg: 0, bird: 0, density: .2, glow: 0, ui: false, weather: false, extras: false, shaders: false, bloom: false, crt: false, glitch: 0, shake: false, glass: false, domCrt: false },
  low:    { res: 1, fps: 60, bg: 0, bird: 1, density: .35, glow: 0, ui: false, weather: false, extras: false, shaders: false, bloom: false, crt: false, glitch: 1, shake: true, glass: false, domCrt: false },
  medium: { res: 1.5, fps: 60, bg: 1, bird: 1, density: .6, glow: .5, ui: true, weather: true, extras: false, shaders: false, bloom: false, crt: false, glitch: 1, shake: true, glass: false, domCrt: true },
  high:   { res: 2, fps: 0, bg: 2, bird: 2, density: 1, glow: 1, ui: true, weather: true, extras: false, shaders: false, bloom: false, crt: false, glitch: 2, shake: true, glass: true, domCrt: true },
  ultra:  { res: 2.5, fps: 0, bg: 2, bird: 2, density: 1, glow: 1.3, ui: true, weather: true, extras: true, shaders: true, bloom: true, crt: true, glitch: 2, shake: true, glass: true, domCrt: true }
};
const LEVELS = ['potato', 'low', 'medium', 'high', 'ultra'];
const PRESET_LABEL = { auto: 'Auto', potato: 'Potato', low: 'Low', medium: 'Medium', high: 'High', ultra: 'Ultra', custom: 'Custom' };
const PRESET_DESC = {
  auto: 'Dipilih otomatis sesuai perangkat, dan diturunkan sendiri jika FPS terlalu rendah.',
  potato: 'Mode hemat: resolusi 60%, 30 FPS, tanpa glow/animasi latar/efek burung. Untuk HP lawas & hemat baterai.',
  low: 'Resolusi 100%, animasi latar mati, efek burung dibatasi, tanpa glow.',
  medium: 'Resolusi 150%, animasi latar dipangkas, glow ringan, partikel 60%.',
  high: 'Seperti tampilan bawaan: semua animasi & efek normal.',
  ultra: 'Semua efek aktif + shader (bloom, scanline, vignette) + animasi tambahan.',
  custom: 'Pengaturan kamu sendiri. Ubah satu per satu di bawah.'
};
const AUDIO_DEFAULT = { mute: false, master: .8, sfxOn: true, sfxVol: .8, sfxPack: 'arcade', musicOn: true, musicVol: .5, musicStyle: 'synthwave', musicMenu: true, ambOn: true, ambVol: .45, ambType: 'auto', quality: 44100 };

function detectLevel() {
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || ('ontouchstart' in window && Math.min(innerWidth, innerHeight) < 700);
  const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4;
  if (!mobile) return 'high';
  if (cores >= 8 && mem >= 6) return 'high';
  if (cores <= 4 || mem <= 3) return 'low';
  return 'medium';
}

let store = { gfx: 'auto', autoLevel: null, g: null, a: Object.assign({}, AUDIO_DEFAULT), v: 1 };
try { const raw = JSON.parse(localStorage.getItem(KEY) || 'null'); if (raw && raw.v === 1) { store = raw; store.a = Object.assign({}, AUDIO_DEFAULT, raw.a || {}); } } catch (e) { }
if (!store.autoLevel) store.autoLevel = detectLevel();
if (!store.g) store.g = Object.assign({}, PRESETS[store.gfx === 'auto' ? store.autoLevel : (PRESETS[store.gfx] ? store.gfx : 'high')]);

const S = window.CFSettings = { store, eff: store.g, a: store.a, PRESETS, LEVELS, hooks: {}, fpsNow: 0 };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { } };
function fillEff(obj) { Object.keys(store.g).forEach(k => delete store.g[k]); Object.assign(store.g, obj); }

function applyDom() {
  const e = store.g, b = document.body; if (!b) return;
  b.classList.toggle('q-noglass', !e.glass);
  b.classList.toggle('q-noanim', !e.ui);
  b.classList.toggle('q-nocrt', !e.domCrt);
  b.classList.toggle('q-potato', store.g.res <= .6 && store.g.fps === 30);
  const f = fpsEl(); f.style.display = e.showFps ? 'block' : 'none';
}
S.apply = function (silent) {
  applyDom(); save();
  if (!silent) window.dispatchEvent(new CustomEvent('cf:settings'));
};
S.setPreset = function (name) {
  if (name === 'auto') { store.gfx = 'auto'; store.autoLevel = detectLevel(); fillEff(Object.assign({}, PRESETS[store.autoLevel], { showFps: store.g.showFps })); }
  else if (name === 'custom') { store.gfx = 'custom'; }
  else if (PRESETS[name]) { store.gfx = name; fillEff(Object.assign({}, PRESETS[name], { showFps: store.g.showFps })); }
  badCount = 0; settle = performance.now() + 2500;
  S.apply();
};
S.setG = function (k, v) { store.g[k] = v; if (store.gfx !== 'custom') store.gfx = 'custom'; if (k === 'shaders' && v && !store.g.bloom && !store.g.crt) { store.g.bloom = true; store.g.crt = true; } if (k === 'showFps' && store.gfx === 'custom' && false) { } badCount = 0; S.apply(); };
S.setA = function (k, v) { store.a[k] = v; S.apply(); };
S.label = () => store.gfx === 'auto' ? `Auto (${PRESET_LABEL[store.autoLevel]})` : PRESET_LABEL[store.gfx];

// ---------------------------------------------------------------- FPS + auto turunkan kualitas
let fpsBox = null; const fpsEl = () => { if (!fpsBox) { fpsBox = document.createElement('div'); fpsBox.id = 'fps-counter'; (document.body || document.documentElement).appendChild(fpsBox); } return fpsBox; };
let winSum = 0, winN = 0, winStart = 0, badCount = 0, settle = performance.now() + 3000, fpsFrames = 0, fpsT0 = performance.now();
S.frame = function (dt, drew) {
  const now = performance.now();
  if (drew) fpsFrames++;
  if (now - fpsT0 >= 500) { S.fpsNow = Math.round(fpsFrames * 1000 / (now - fpsT0)); fpsFrames = 0; fpsT0 = now; if (store.g.showFps) fpsEl().textContent = S.fpsNow + ' FPS · ' + S.label(); }
  if (store.gfx !== 'auto' || dt > 250 || now < settle) { winSum = winN = 0; winStart = now; return; }
  winSum += dt; winN++;
  if (now - winStart >= 3000) {
    const avg = winSum / Math.max(1, winN);
    badCount = avg > 25 ? badCount + 1 : 0; winSum = winN = 0; winStart = now;
    if (badCount >= 2) { // turunkan satu tingkat
      const i = LEVELS.indexOf(store.autoLevel);
      if (i > 0) { store.autoLevel = LEVELS[i - 1]; fillEff(Object.assign({}, PRESETS[store.autoLevel], { showFps: store.g.showFps })); S.apply(); toast('Grafik otomatis diturunkan ke ' + PRESET_LABEL[store.autoLevel] + ' agar lebih lancar'); }
      badCount = 0; settle = now + 3000;
    }
  }
};
let tT = 0; function toast(m) { const el = $('toast'); if (!el) return; el.textContent = m; el.className = 'toast show'; clearTimeout(tT); tT = setTimeout(() => el.classList.remove('show'), 3400); }

// ---------------------------------------------------------------- UI
const SEG = (opts) => opts;
const GFX_UI = [
  ['Tampilan & performa'],
  { k: 'res', t: 'seg', label: 'Resolusi render', hint: 'Makin kecil makin ringan. 100% = 1 piksel kanvas per piksel layar CSS.', opts: [[.5, '50%'], [.6, '60%'], [.75, '75%'], [1, '100%'], [1.5, '150%'], [2, '200%'], [3, 'Native']] },
  { k: 'fps', t: 'seg', label: 'Batas FPS', hint: '30 FPS menghemat baterai. Logika game tetap 60 langkah/detik.', opts: [[30, '30'], [60, '60'], [0, 'Maks']] },
  { k: 'glow', t: 'seg', label: 'Glow neon', hint: 'Efek cahaya neon (paling berat di HP lawas).', opts: [[0, 'Mati'], [.5, 'Ringan'], [1, 'Normal'], [1.3, 'Terang']] },
  ['Animasi'],
  { k: 'bg', t: 'seg', label: 'Animasi latar', hint: 'Bintang, jendela gedung berkedip, hologram, lapisan tema.', opts: [[2, 'Penuh'], [1, 'Ringan'], [0, 'Mati']] },
  { k: 'bird', t: 'seg', label: 'Efek burung (ekor, klik, partikel)', opts: [[2, 'Penuh'], [1, 'Ringan'], [0, 'Mati']] },
  { k: 'density', t: 'range', label: 'Kepadatan partikel', min: .1, max: 1, step: .1 },
  { k: 'ui', t: 'tg', label: 'Animasi menu & klik' },
  { k: 'weather', t: 'tg', label: 'Cuaca visual (hujan, petir)', hint: 'Mengikuti pilihan suara suasana.' },
  { k: 'glitch', t: 'seg', label: 'Glitch layar penuh (skin Fatal Error)', opts: [[2, 'Penuh'], [1, 'Ringan'], [0, 'Mati']] },
  { k: 'shake', t: 'tg', label: 'Getaran layar' },
  ['Shader & Ultra'],
  { k: 'shaders', t: 'tg', label: 'Shader', hint: 'Pasca-proses layar. Berat di HP lawas.' },
  { k: 'bloom', t: 'tg', label: '↳ Bloom (cahaya lembut)', sub: 'shaders' },
  { k: 'crt', t: 'tg', label: '↳ Scanline & vignette', sub: 'shaders' },
  { k: 'extras', t: 'tg', label: 'Animasi tambahan Ultra', hint: 'Debu cahaya, garis kecepatan, bintang jatuh, aura burung.' },
  ['Antarmuka'],
  { k: 'glass', t: 'tg', label: 'Efek kaca & blur UI' },
  { k: 'domCrt', t: 'tg', label: 'Garis CRT di atas layar' },
  { k: 'showFps', t: 'tg', label: 'Tampilkan FPS' }
];
const AUD_UI = [
  ['Volume utama'],
  { k: 'mute', t: 'tg', label: 'Bisukan semua suara', inv: false },
  { k: 'master', t: 'range', label: 'Volume utama', min: 0, max: 1, step: .05 },
  ['Efek suara (SFX)'],
  { k: 'sfxOn', t: 'tg', label: 'SFX aktif', test: 'sfx' },
  { k: 'sfxVol', t: 'range', label: 'Volume SFX', min: 0, max: 1, step: .05 },
  { k: 'sfxPack', t: 'seg', label: 'Paket SFX', opts: [['arcade', 'Arcade'], ['soft', 'Lembut'], ['8bit', '8-Bit'], ['scifi', 'Sci-Fi']] },
  ['Lagu latar'],
  { k: 'musicOn', t: 'tg', label: 'Musik aktif', test: 'music' },
  { k: 'musicVol', t: 'range', label: 'Volume musik', min: 0, max: 1, step: .05 },
  { k: 'musicStyle', t: 'seg', label: 'Gaya lagu', opts: [['synthwave', 'Synthwave'], ['arcade', 'Arcade'], ['chill', 'Chill'], ['dark', 'Dark']] },
  { k: 'musicMenu', t: 'tg', label: 'Putar musik juga di menu' },
  ['Suara suasana'],
  { k: 'ambOn', t: 'tg', label: 'Suasana aktif', test: 'amb' },
  { k: 'ambVol', t: 'range', label: 'Volume suasana', min: 0, max: 1, step: .05 },
  { k: 'ambType', t: 'seg', label: 'Jenis suasana', hint: 'Otomatis = mengikuti tema latar yang dipakai.', opts: [['auto', 'Otomatis'], ['rain', 'Hujan'], ['storm', 'Badai'], ['wind', 'Angin'], ['ocean', 'Laut'], ['space', 'Antariksa'], ['city', 'Kota cyber'], ['off', 'Mati']] },
  ['Kualitas audio'],
  { k: 'quality', t: 'seg', label: 'Bitrate / sample rate', hint: 'Game memakai audio sintesis, jadi kualitas diatur lewat sample rate. Lebih rendah = lebih ringan (22 kHz untuk HP lawas).', opts: [[22050, '22 kHz'], [32000, '32 kHz'], [44100, '44,1 kHz'], [48000, '48 kHz']] }
];
const esc = (v) => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function control(c, obj, scope) {
  const v = obj[c.k], id = `${scope}-${c.k}`, dis = c.sub && !obj[c.sub] ? ' dis' : '';
  const hint = c.hint ? `<small class="st-hint">${esc(c.hint)}</small>` : '';
  if (c.t === 'tg') return `<div class="st-row${dis}"><div class="st-lab">${esc(c.label)}${hint}</div><button class="tg${v ? ' on' : ''}" data-s="${scope}" data-k="${c.k}" data-t="tg" role="switch" aria-checked="${!!v}"></button>${c.test ? `<button class="tst" data-test="${c.test}" title="Tes">▶</button>` : ''}</div>`;
  if (c.t === 'range') return `<div class="st-row col${dis}"><div class="st-lab">${esc(c.label)} <b id="${id}-v">${Math.round(v * 100)}%</b></div><input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${v}" data-s="${scope}" data-k="${c.k}" data-t="range"></div>`;
  return `<div class="st-row col${dis}"><div class="st-lab">${esc(c.label)}${hint}</div><div class="seg">${c.opts.map(o => `<button class="${o[0] === v ? 'on' : ''}" data-s="${scope}" data-k="${c.k}" data-t="seg" data-v="${o[0]}">${esc(o[1])}</button>`).join('')}</div></div>`;
}
function section(list, obj, scope) { return list.map(c => Array.isArray(c) ? `<h4 class="st-h">${esc(c[0])}</h4>` : control(c, obj, scope)).join(''); }
let tab = 'gfx';
function render() {
  const card = $('st-body'); if (!card) return; const keep = card.scrollTop;
  const presets = ['auto', 'potato', 'low', 'medium', 'high', 'ultra', 'custom'].map(p => `<button class="${store.gfx === p ? 'on' : ''}" data-preset="${p}">${PRESET_LABEL[p]}</button>`).join('');
  const cv = document.getElementById('gameCanvas');
  const gfx = `<div class="seg presets">${presets}</div><p class="st-desc">${esc(PRESET_DESC[store.gfx])}${store.gfx === 'auto' ? ' <b>Level saat ini: ' + PRESET_LABEL[store.autoLevel] + '.</b>' : ''}</p>
    <p class="st-info">Kanvas: ${cv ? cv.width + '×' + cv.height + ' px' : '-'} · FPS: ${S.fpsNow || '-'}</p>
    <button class="st-potato" data-preset="potato">🥔 Mode Hemat (Potato)</button>${section(GFX_UI, store.g, 'g')}`;
  card.innerHTML = tab === 'gfx' ? gfx : section(AUD_UI, store.a, 'a') + '<p class="st-info">Musik & suasana dimainkan setelah kamu menyentuh layar (aturan browser).</p>';
  document.querySelectorAll('.st-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  card.scrollTop = keep;
}
function build() {
  if ($('settings-modal')) return;
  const m = document.createElement('div'); m.id = 'settings-modal'; m.className = 'modal hidden'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
  m.innerHTML = `<section class="modal-card st-card"><button class="close-btn" id="st-close" aria-label="Tutup">×</button><h2>⚙ SETTING</h2><div class="st-tabs"><button data-tab="gfx" class="on">🖥 Grafik</button><button data-tab="aud">🔊 Audio</button></div><div id="st-body"></div><button class="action-btn" id="st-reset">Kembalikan default</button></section>`;
  document.body.appendChild(m);
  m.addEventListener('click', (e) => {
    const t = e.target;
    if (t === m || t.id === 'st-close') { S.close(); return; }
    if (t.id === 'st-reset') { store.a = Object.assign({}, AUDIO_DEFAULT); S.a = store.a; S.setPreset('auto'); render(); return; }
    const tb = t.closest('.st-tabs button'); if (tb) { tab = tb.dataset.tab; render(); return; }
    const pb = t.closest('[data-preset]'); if (pb) { S.setPreset(pb.dataset.preset); render(); return; }
    const ts = t.closest('[data-test]'); if (ts) { S.hooks.test && S.hooks.test(ts.dataset.test); return; }
    const el = t.closest('[data-k]'); if (!el) return;
    const scope = el.dataset.s, k = el.dataset.k, set = scope === 'g' ? S.setG : S.setA, cur = (scope === 'g' ? store.g : store.a)[k];
    if (el.dataset.t === 'tg') set(k, !cur);
    else if (el.dataset.t === 'seg') { const raw = el.dataset.v, num = Number(raw); set(k, raw !== '' && !isNaN(num) && /^[\d.]+$/.test(raw) ? num : raw); }
    else return;
    render();
  });
  m.addEventListener('input', (e) => {
    const el = e.target; if (el.dataset.t !== 'range') return;
    const scope = el.dataset.s, k = el.dataset.k, v = parseFloat(el.value); (scope === 'g' ? S.setG : S.setA)(k, v);
    const lab = $(`${scope}-${k}-v`); if (lab) lab.textContent = Math.round(v * 100) + '%';
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') S.close(); });
}
S.open = function (which) { build(); if (which) tab = which; render(); $('settings-modal').classList.remove('hidden'); document.body.classList.add('st-open'); };
S.close = function () { const m = $('settings-modal'); if (m) m.classList.add('hidden'); document.body.classList.remove('st-open'); S.hooks.test && S.hooks.test('stop'); };
S.isOpen = () => { const m = $('settings-modal'); return !!m && !m.classList.contains('hidden'); };

function init() {
  applyDom();
  const b = $('settings-open'); if (b) b.addEventListener('click', () => S.open());
  window.addEventListener('resize', () => { if (S.isOpen()) render(); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
