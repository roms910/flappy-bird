/* ============================================================================
 * CYBER FLAPPY — COSMETICS (window.CF)
 * Bentuk skin (burung, UFO, jet, kapal, mobil terbang, dll), efek ekor & klik bertema,
 * tema latar, suara, preview toko, dan efek GLITCH skin FATAL ERROR.
 * Dipakai bersama oleh game.js (canvas game) dan online.js (preview toko).
 * ========================================================================== */
(function () {
'use strict';
const CF = window.CF = {};
const TAU = Math.PI * 2, OUT = '#080812';
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hash = (i) => { const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };
function hex2rgb(h) { h = String(h).replace('#', ''); if (h.length === 3 || h.length === 4) h = h.split('').map(x => x + x).join(''); return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0]; }
CF.mix = (a, b, k) => { const A = hex2rgb(a), B = hex2rgb(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',') + ')'; };

// ---------------------------------------------------------------- skin -> bentuk
CF.SKIN_SHAPE = { skin_1: 'bird', skin_2: 'bird', skin_3: 'bird', skin_4: 'ufo', skin_5: 'frog', skin_6: 'jet', skin_7: 'ghost', skin_8: 'rocket', skin_9: 'drone', skin_10: 'star', skin_11: 'shuttle', skin_12: 'gem', skin_13: 'mecha', skin_14: 'car', skin_15: 'sub', skin_16: 'fighter', skin_17: 'ship', skin_18: 'airship', skin_19: 'stealth', skin_20: 'whale', skin_21: 'dragon', skin_22: 'angel', skin_23: 'cube', skin_24: 'omega', skin_25: 'bird' };
CF.GLITCH_SKIN = 'skin_25';
CF.SHAPE_NAMES = { bird: 'Burung', ufo: 'UFO', frog: 'Katak', jet: 'Jet', ghost: 'Hantu', rocket: 'Roket', drone: 'Drone', star: 'Bintang', shuttle: 'Pesawat Luar Angkasa', gem: 'Kristal', mecha: 'Mecha', car: 'Mobil Terbang', sub: 'Kapal Selam', fighter: 'Jet Tempur', ship: 'Kapal Layar', airship: 'Balon Udara', stealth: 'Stealth', whale: 'Paus Kosmik', dragon: 'Naga', angel: 'Malaikat', cube: 'Kubus Pixel', omega: 'Orb Omega' };
// jenis efek ekor bawaan tiap bentuk ('dot' = jejak klasik burung)
CF.SHAPE_FX = { bird: 'dot', ufo: 'stars', frog: 'bubbles', jet: 'streak', ghost: 'wisp', rocket: 'flame', drone: 'wind', star: 'stars', shuttle: 'flame', gem: 'shards', mecha: 'sparks', car: 'smoke', sub: 'bubbles', fighter: 'flame', ship: 'wake', airship: 'smoke', stealth: 'streak', whale: 'bubbles', dragon: 'embers', angel: 'feathers', cube: 'pixels', omega: 'stars' };
const TAILMAP = { tail_spark: 'sparks', tail_rainbow: 'rainbow', tail_comet: 'comet', tail_aurora: 'aurora', tail_fire: 'flame', tail_bubble: 'bubbles', tail_pixel: 'pixels' };
CF.shapeOf = (id) => CF.SKIN_SHAPE[id] || 'bird';
CF.tailKind = (skinId, tailId) => TAILMAP[tailId] || (skinId === CF.GLITCH_SKIN ? 'glitch' : CF.SHAPE_FX[CF.shapeOf(skinId)] || 'dot');

// ---------------------------------------------------------------- helper gambar
function shape(c, fill, lw) { c.fillStyle = fill; c.fill(); c.lineWidth = lw || 2; c.strokeStyle = OUT; c.lineJoin = 'round'; c.stroke(); }
function poly(c, p) { c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); }
function ell(c, x, y, rx, ry, r) { c.beginPath(); c.ellipse(x, y, rx, ry, r || 0, 0, TAU); }
function rrect(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function eye(c, x, y, r, dead) {
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = OUT; c.stroke();
  if (dead) { c.strokeStyle = '#FF003C'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x - r * .5, y - r * .5); c.lineTo(x + r * .5, y + r * .5); c.moveTo(x + r * .5, y - r * .5); c.lineTo(x - r * .5, y + r * .5); c.stroke(); }
  else { c.fillStyle = OUT; c.beginPath(); c.arc(x + r * .3, y, r * .45, 0, TAU); c.fill(); }
}
function flame(c, x, y, len, t, sk) {
  const f = len * (0.8 + 0.25 * Math.sin(t * 0.9) + Math.random() * 0.12);
  c.beginPath(); c.moveTo(x, y - 5); c.quadraticCurveTo(x - f * .6, y - 4, x - f, y); c.quadraticCurveTo(x - f * .6, y + 4, x, y + 5); c.closePath(); c.fillStyle = sk.beakBottom; c.fill();
  c.beginPath(); c.moveTo(x, y - 3); c.quadraticCurveTo(x - f * .4, y - 2, x - f * .65, y); c.quadraticCurveTo(x - f * .4, y + 2, x, y + 3); c.closePath(); c.fillStyle = sk.beakTop; c.fill();
}
function star4(c, x, y, r, rot) {
  c.beginPath(); for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4, rad = i % 2 ? r * .28 : r; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); } c.closePath();
}

// ---------------------------------------------------------------- bentuk (menghadap kanan, ± 48x34 px)
const SH = {
  ufo(c, sk, t, o) {
    c.beginPath(); c.ellipse(1, -4, 11, 10, 0, Math.PI, TAU); c.closePath(); shape(c, 'rgba(190,240,255,.88)');
    eye(c, 3, -6, 4, o.dead);
    ell(c, 0, 2, 23, 7); shape(c, sk.bodyMain);
    c.beginPath(); c.ellipse(0, 4.5, 19, 4, 0, 0, Math.PI); c.fillStyle = sk.bodyShade; c.fill();
    for (let i = -2; i <= 2; i++) { const on = ((t * .2 | 0) + i + 10) % 3 === 0; c.fillStyle = on ? '#fff' : sk.visorColor; c.globalAlpha = on ? 1 : .65; c.beginPath(); c.arc(i * 8, 2.5, 1.8, 0, TAU); c.fill(); }
    c.globalAlpha = .16 + o.wing * .07; c.fillStyle = sk.visorColor; poly(c, [-8, 9, 8, 9, 17, 22, -17, 22]); c.fill(); c.globalAlpha = 1;
  },
  frog(c, sk, t, o) {
    const k = [0, .5, 1][o.wing];
    ell(c, -13, 8, 8, 4, -.5 + k * .6); shape(c, sk.bodyShade);
    ell(c, 0, 1, 19, 13); shape(c, sk.bodyMain);
    ell(c, 2, 6, 12, 6); c.fillStyle = sk.bodyHighlight; c.fill();
    ell(c, 2, -11, 6, 6); shape(c, sk.bodyMain); ell(c, 12, -9, 6, 6); shape(c, sk.bodyMain);
    eye(c, 2, -12, 4.2, o.dead); eye(c, 12, -10, 4.2, o.dead);
    c.strokeStyle = OUT; c.lineWidth = 2; c.beginPath(); c.arc(9, 2, 9, .2, 1.9); c.stroke();
    c.fillStyle = sk.visorColor; c.globalAlpha = .55; [[-6, -2], [-10, 4], [-3, 6]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], 2, 0, TAU); c.fill(); }); c.globalAlpha = 1;
    ell(c, 8, 10, 7, 3.5, .15); shape(c, sk.bodyShade);
  },
  jet(c, sk, t, o) {
    flame(c, -21, 0, 24, t, sk);
    poly(c, [-4, -2, -16, -14, -8, -14, 6, -2]); shape(c, sk.bodyShade);
    poly(c, [-18, -1, -24, -13, -15, -13, -8, -1]); shape(c, sk.wingColor);
    c.beginPath(); c.moveTo(26, 1); c.quadraticCurveTo(12, -8, -14, -6); c.lineTo(-21, 0); c.lineTo(-14, 6); c.quadraticCurveTo(10, 8, 26, 1); c.closePath(); shape(c, sk.bodyMain);
    c.fillStyle = sk.beakTop; poly(c, [-6, -1, -14, -1, -14, 2, -6, 2]); c.fill();
    ell(c, 9, -3, 7, 3.4, -.15); shape(c, sk.visorColor, 1.5);
    const w = [0, 2, 4][o.wing]; poly(c, [3, 3, -14, 15 + w, -7, 15 + w, 11, 3]); shape(c, sk.wingColor);
  },
  ghost(c, sk, t, o) {
    const w = Math.sin(t * .2) * 2; c.globalAlpha = .92;
    c.beginPath(); c.moveTo(-18, 12); c.lineTo(-18, -2); c.bezierCurveTo(-18, -22, 18, -22, 18, -2); c.lineTo(18, 12);
    for (let i = 0; i < 4; i++) { const x = 18 - i * 9, s = i % 2 ? -w : w; c.quadraticCurveTo(x - 2.25, 19 + s, x - 4.5, 12); c.quadraticCurveTo(x - 6.75, 5 - s, x - 9, 12); }
    c.closePath(); shape(c, sk.bodyHighlight); c.globalAlpha = 1;
    c.fillStyle = sk.bodyMain; c.globalAlpha = .35; ell(c, 0, 6, 14, 8); c.fill(); c.globalAlpha = 1;
    const ay = [-4, 0, 4][o.wing]; ell(c, -17, 3 + ay, 6, 3, .4); shape(c, sk.bodyHighlight);
    eye(c, 10, -5, 4.6, o.dead); eye(c, -1, -5, 4.6, o.dead);
    c.fillStyle = OUT; ell(c, 11, 6, 3, 2.6); c.fill();
    c.fillStyle = sk.visorColor; c.globalAlpha = .35; c.beginPath(); c.arc(16, 1, 2.6, 0, TAU); c.arc(-7, 1, 2.6, 0, TAU); c.fill(); c.globalAlpha = 1;
  },
  rocket(c, sk, t, o) {
    flame(c, -21, 0, 26, t, sk);
    poly(c, [-10, -6, -21, -17, -7, -10]); shape(c, sk.beakBottom); poly(c, [-10, 6, -21, 17, -7, 10]); shape(c, sk.beakBottom);
    c.beginPath(); c.moveTo(26, 0); c.bezierCurveTo(15, -14, -4, -11, -21, -9); c.lineTo(-21, 9); c.bezierCurveTo(-4, 11, 15, 14, 26, 0); c.closePath(); shape(c, sk.bodyMain);
    c.beginPath(); c.moveTo(26, 0); c.bezierCurveTo(21, -8, 16, -11, 11, -11.2); c.lineTo(11, 11.2); c.bezierCurveTo(16, 11, 21, 8, 26, 0); c.closePath(); c.fillStyle = sk.beakTop; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
    c.fillStyle = sk.bodyShade; c.fillRect(-16, -9.5, 4, 19);
    c.beginPath(); c.arc(0, 0, 6.2, 0, TAU); shape(c, sk.visorColor); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(-1.5, -2, 2, 0, TAU); c.fill();
  },
  drone(c, sk, t, o) {
    const b = Math.abs(Math.sin(t * 1.7));
    c.strokeStyle = OUT; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-12, -6); c.lineTo(-12, -13); c.moveTo(12, -6); c.lineTo(12, -13); c.moveTo(-9, 9); c.lineTo(-12, 15); c.moveTo(9, 9); c.lineTo(12, 15); c.stroke();
    [-12, 12].forEach(x => { ell(c, x, -14, 5 + 13 * b, 1.8); c.fillStyle = 'rgba(225,245,255,.72)'; c.fill(); });
    rrect(c, -16, -7, 32, 17, 7); shape(c, sk.bodyMain);
    c.fillStyle = sk.bodyShade; c.fillRect(-14, 4, 28, 4);
    c.beginPath(); c.arc(8, 1, 7, 0, TAU); shape(c, '#0b0f1a'); c.beginPath(); c.arc(8, 1, 4.2, 0, TAU); c.fillStyle = sk.visorColor; c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(6.5, -.5, 1.4, 0, TAU); c.fill();
    c.fillStyle = (t * .1 | 0) % 2 ? sk.beakTop : sk.beakBottom; c.beginPath(); c.arc(-9, -1, 2, 0, TAU); c.fill();
  },
  star(c, sk, t, o) {
    c.save(); c.rotate(Math.sin(t * .08) * .22);
    c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 10.5 : 22; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); shape(c, sk.bodyMain, 2.4);
    c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 13; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fillStyle = sk.bodyHighlight; c.globalAlpha = .5; c.fill(); c.globalAlpha = 1;
    c.restore();
    eye(c, 4, -2, 4.6, o.dead); c.strokeStyle = OUT; c.lineWidth = 2; c.beginPath(); c.arc(5, 5, 4, .2, 2.9); c.stroke();
  },
  shuttle(c, sk, t, o) {
    flame(c, -21, 1, 20, t, sk);
    poly(c, [-6, -3, -18, -17, -10, -17, 6, -3]); shape(c, sk.bodyShade);
    c.beginPath(); c.moveTo(27, 2); c.quadraticCurveTo(18, -9, 0, -8); c.lineTo(-21, -7); c.lineTo(-21, 8); c.lineTo(0, 8); c.quadraticCurveTo(18, 8, 27, 2); c.closePath(); shape(c, sk.bodyMain);
    c.beginPath(); c.moveTo(27, 2); c.quadraticCurveTo(22, -6, 15, -7.6); c.lineTo(15, 7); c.quadraticCurveTo(22, 7, 27, 2); c.closePath(); c.fillStyle = OUT; c.fill();
    c.fillStyle = sk.visorColor; [-2, 4, 10].forEach(x => c.fillRect(x - 1, -5, 4, 3.5));
    const w = [0, 2, 4][o.wing]; poly(c, [5, 5, -14, 17 + w, -5, 17 + w, 13, 5]); shape(c, sk.bodyHighlight);
    poly(c, [-14, -7, -21, -19, -15, -19, -6, -7]); shape(c, sk.beakBottom);
  },
  gem(c, sk, t, o) {
    c.save(); c.rotate(Math.sin(t * .05) * .12);
    poly(c, [-19, -4, -10, -16, 10, -16, 19, -4, 0, 18]); shape(c, sk.bodyMain, 2.2);
    poly(c, [-19, -4, 19, -4, 0, 18]); c.fillStyle = sk.bodyShade; c.fill();
    poly(c, [-10, -16, -5, -4, -19, -4]); c.fillStyle = sk.bodyHighlight; c.globalAlpha = .75; c.fill(); c.globalAlpha = 1;
    poly(c, [10, -16, 5, -4, 19, -4]); c.fillStyle = sk.bodyHighlight; c.globalAlpha = .35; c.fill(); c.globalAlpha = 1;
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-5, -4); c.lineTo(0, 18); c.moveTo(5, -4); c.lineTo(0, 18); c.moveTo(-5, -4); c.lineTo(5, -4); c.moveTo(-5, -4); c.lineTo(0, -16); c.moveTo(5, -4); c.lineTo(0, -16); c.stroke();
    c.restore();
    const s = .5 + .5 * Math.sin(t * .15); c.fillStyle = '#fff'; star4(c, 11, -10, 3 + s * 4, t * .05); c.fill();
  },
  mecha(c, sk, t, o) {
    const f = [0, 5, 9][o.wing]; c.fillStyle = sk.beakTop; poly(c, [-10, 13, -6, 13, -8, 14 + f]); c.fill(); poly(c, [6, 13, 10, 13, 8, 14 + f]); c.fill();
    c.strokeStyle = OUT; c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, -13); c.lineTo(0, -21); c.stroke();
    c.fillStyle = (t * .08 | 0) % 2 ? '#FF003C' : sk.beakTop; c.beginPath(); c.arc(0, -22, 2.8, 0, TAU); c.fill();
    rrect(c, -22, -6, 6, 12, 2); shape(c, sk.bodyShade);
    rrect(c, -17, -13, 36, 27, 7); shape(c, sk.bodyMain);
    rrect(c, -5, -8, 22, 13, 3); c.fillStyle = '#10151f'; c.fill();
    c.shadowColor = sk.visorColor; c.shadowBlur = 8; c.fillStyle = sk.visorColor; c.fillRect(-1, -4, 15, 4.5); c.shadowBlur = 0;
    c.strokeStyle = OUT; c.lineWidth = 1.5; c.beginPath(); for (let x = -2; x < 16; x += 4) { c.moveTo(x, 9); c.lineTo(x, 12); } c.stroke();
    c.fillStyle = sk.bodyHighlight; [[-13, -9], [15, -9], [-13, 10], [15, 10]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], 1.5, 0, TAU); c.fill(); });
    if (o.dead) { c.strokeStyle = '#FF003C'; c.lineWidth = 2; c.beginPath(); c.moveTo(3, -7); c.lineTo(11, 1); c.moveTo(11, -7); c.lineTo(3, 1); c.stroke(); }
  },
  car(c, sk, t, o) {
    const g = .35 + .2 * Math.sin(t * .3); c.fillStyle = sk.visorColor; c.globalAlpha = g; ell(c, 0, 17, 21, 3.5); c.fill(); c.globalAlpha = 1;
    const th = [3, 7, 11][o.wing]; c.fillStyle = sk.beakTop; [-13, 13].forEach(x => { poly(c, [x - 3, 11, x + 3, 11, x, 11 + th]); c.fill(); });
    c.beginPath(); c.moveTo(-23, 5); c.lineTo(-23, -3); c.quadraticCurveTo(-21, -7, -13, -7); c.lineTo(-7, -13); c.quadraticCurveTo(0, -15, 10, -13); c.lineTo(15, -7); c.quadraticCurveTo(25, -6, 26, 2); c.lineTo(26, 6); c.lineTo(-23, 6); c.closePath(); shape(c, sk.bodyMain);
    c.beginPath(); c.moveTo(-6, -7); c.lineTo(-2, -11.2); c.lineTo(9, -11.2); c.lineTo(12.5, -7); c.closePath(); c.globalAlpha = .88; shape(c, sk.visorColor, 1.6); c.globalAlpha = 1;
    c.fillStyle = sk.bodyShade; c.fillRect(-23, 2, 49, 3);
    c.fillStyle = sk.beakTop; ell(c, 24, 0, 2.6, 2); c.fill(); c.fillStyle = sk.beakBottom; ell(c, -22, 0, 1.6, 2.4); c.fill();
    rrect(c, -26, -10, 9, 3, 1); shape(c, sk.bodyShade, 1.5);
    [-13, 13].forEach(x => { c.beginPath(); c.ellipse(x, 8, 6.5, 5, 0, 0, TAU); shape(c, '#10151f', 1.6); c.save(); c.translate(x, 8); c.rotate(t * .4); c.strokeStyle = sk.visorColor; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-4, 0); c.lineTo(4, 0); c.moveTo(0, -3); c.lineTo(0, 3); c.stroke(); c.restore(); });
    if (o.dead) { c.strokeStyle = '#FF003C'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -10); c.lineTo(7, -6); c.moveTo(7, -10); c.lineTo(0, -6); c.stroke(); }
  },
  sub(c, sk, t, o) {
    ell(c, -25, 0, 2.6, [4, 9, 4][o.wing]); c.fillStyle = '#cbd5e1'; c.fill();
    poly(c, [-18, -3, -25, -13, -16, -13, -10, -3]); shape(c, sk.bodyShade); poly(c, [-18, 5, -25, 14, -16, 14, -10, 5]); shape(c, sk.bodyShade);
    c.strokeStyle = OUT; c.lineWidth = 2.4; c.beginPath(); c.moveTo(5, -10); c.lineTo(5, -22); c.lineTo(11, -22); c.stroke();
    rrect(c, -4, -17, 14, 9, 3); shape(c, sk.bodyShade);
    ell(c, 0, 1, 24, 11.5); shape(c, sk.bodyMain);
    c.fillStyle = sk.bodyHighlight; c.globalAlpha = .45; ell(c, 0, -5, 18, 3.5); c.fill(); c.globalAlpha = 1;
    [-12, -3].forEach(x => { c.beginPath(); c.arc(x, 1, 3.4, 0, TAU); shape(c, sk.visorColor, 1.6); });
    c.beginPath(); c.arc(14, 0, 5, 0, TAU); shape(c, sk.visorColor, 1.8); eye(c, 14.5, 0, 3.2, o.dead);
  },
  fighter(c, sk, t, o) {
    flame(c, -19, 0, 18, t, sk);
    poly(c, [-10, -3, -18, -17, -10, -17, 0, -3]); shape(c, sk.bodyShade);
    c.beginPath(); c.moveTo(27, 1); c.lineTo(8, -5); c.lineTo(-18, -5); c.lineTo(-20, 0); c.lineTo(-18, 5); c.lineTo(8, 6); c.closePath(); shape(c, sk.bodyMain);
    poly(c, [8, -5, 18, -1, 8, 0]); c.fillStyle = sk.visorColor; c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
    const w = [0, 2, 4][o.wing]; poly(c, [10, 4, -16, 17 + w, -19, 14 + w, -8, 4]); shape(c, sk.wingColor);
    c.fillStyle = sk.beakTop; poly(c, [4, 11 + w * .3, 14, 12 + w * .3, 14, 14 + w * .3, 4, 14 + w * .3]); c.fill();
    poly(c, [-14, -5, -21, -15, -16, -15, -8, -5]); shape(c, sk.beakBottom);
  },
  ship(c, sk, t, o) {
    const b = [0, 1.6, 3.2][o.wing];
    c.fillStyle = 'rgba(255,255,255,.55)'; [[-14, 15], [0, 17], [14, 15]].forEach(p => { ell(c, p[0], p[1], 8, 2.6); c.fill(); });
    c.strokeStyle = OUT; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-5, 3); c.lineTo(-5, -21); c.moveTo(10, 3); c.lineTo(10, -15); c.moveTo(24, 3); c.lineTo(31, -2); c.stroke();
    c.beginPath(); c.moveTo(-5, -20); c.quadraticCurveTo(11 + b, -11, -5, -3); c.closePath(); shape(c, sk.wingColor, 1.8);
    c.beginPath(); c.moveTo(10, -14); c.quadraticCurveTo(21 + b, -8, 10, -3); c.closePath(); shape(c, sk.wingColor, 1.8);
    poly(c, [-5, -21, -5, -27, 3, -24]); shape(c, sk.beakTop, 1.4);
    c.beginPath(); c.moveTo(-23, 2); c.lineTo(25, 2); c.quadraticCurveTo(18, 15, 6, 15); c.lineTo(-12, 15); c.quadraticCurveTo(-21, 13, -23, 2); c.closePath(); shape(c, sk.bodyShade);
    c.fillStyle = sk.bodyMain; c.fillRect(-21, 3, 45, 3);
    c.fillStyle = sk.visorColor; [-12, -4, 4, 12].forEach(x => { c.beginPath(); c.arc(x, 9.5, 1.8, 0, TAU); c.fill(); });
  },
  airship(c, sk, t, o) {
    poly(c, [-20, -4, -28, -15, -17, -9]); shape(c, sk.bodyShade); poly(c, [-20, 2, -28, 12, -17, 6]); shape(c, sk.bodyShade);
    c.strokeStyle = OUT; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-8, 8); c.lineTo(-6, 11); c.moveTo(6, 8); c.lineTo(4, 11); c.stroke();
    ell(c, 0, -2, 25, 14); shape(c, sk.bodyMain);
    c.save(); ell(c, 0, -2, 25, 14); c.clip(); c.fillStyle = sk.bodyHighlight; c.globalAlpha = .55; [-14, -2, 10].forEach(x => c.fillRect(x, -18, 5, 36)); c.globalAlpha = 1; c.fillStyle = sk.bodyShade; c.globalAlpha = .5; ell(c, 0, 8, 25, 8); c.fill(); c.restore();
    ell(c, 0, -2, 25, 14); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
    rrect(c, -9, 10, 20, 8, 3); shape(c, sk.bodyShade); c.fillStyle = sk.visorColor; [-4, 1, 6].forEach(x => c.fillRect(x, 12, 3, 3));
    ell(c, -13, 14, 2, [3, 7, 3][o.wing]); c.fillStyle = '#cbd5e1'; c.fill();
    eye(c, 14, -5, 4.6, o.dead);
  },
  stealth(c, sk, t, o) {
    poly(c, [27, 0, -4, -17, -19, -10, -11, 0, -19, 10, -4, 17]); shape(c, sk.bodyMain, 2.2);
    poly(c, [27, 0, -4, -17, -4, 17]); c.fillStyle = sk.bodyShade; c.globalAlpha = .55; c.fill(); c.globalAlpha = 1;
    c.strokeStyle = sk.visorColor; c.lineWidth = 1.5; c.shadowColor = sk.visorColor; c.shadowBlur = 6; c.beginPath(); c.moveTo(-4, -17); c.lineTo(27, 0); c.lineTo(-4, 17); c.stroke(); c.shadowBlur = 0;
    ell(c, 10, 0, 6, 2.6); c.fillStyle = sk.visorColor; c.globalAlpha = .85; c.fill(); c.globalAlpha = 1;
    c.fillStyle = sk.beakTop; c.globalAlpha = .6 + .4 * Math.sin(t * .4); [-6, 0, 6].forEach(y => c.fillRect(-15, y - 1, 3, 2.4)); c.globalAlpha = 1;
  },
  whale(c, sk, t, o) {
    const tw = [-7, 0, 7][o.wing];
    c.beginPath(); c.moveTo(-12, 1); c.quadraticCurveTo(-22, 2 + tw * .5, -24, -6 + tw); c.lineTo(-30, -11 + tw); c.quadraticCurveTo(-27, -3 + tw, -31, 3 + tw); c.lineTo(-24, 1 + tw * .4); c.quadraticCurveTo(-20, 8, -10, 7); c.closePath(); shape(c, sk.bodyShade);
    c.beginPath(); c.moveTo(25, 3); c.bezierCurveTo(22, -17, -10, -17, -19, 0); c.bezierCurveTo(-8, 15, 18, 15, 25, 3); c.closePath(); shape(c, sk.bodyMain);
    c.save(); c.beginPath(); c.moveTo(25, 3); c.bezierCurveTo(18, 4, -8, 5, -19, 0); c.bezierCurveTo(-8, 15, 18, 15, 25, 3); c.closePath(); c.fillStyle = sk.bodyHighlight; c.globalAlpha = .6; c.fill(); c.restore();
    c.fillStyle = sk.visorColor; [[-6, -8, 1.4], [2, -11, 1.8], [-12, -3, 1.2], [8, -8, 1.2]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], p[2], 0, TAU); c.fill(); });
    ell(c, 1, 9, 8, 3, .5); shape(c, sk.bodyShade, 1.6);
    eye(c, 15, -1, 4.2, o.dead);
    c.fillStyle = 'rgba(200,240,255,.8)'; [[9, -19], [11, -23], [7, -23]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], 1.6, 0, TAU); c.fill(); });
  },
  dragon(c, sk, t, o) {
    const wy = [-14, -3, 7][o.wing];
    c.beginPath(); c.moveTo(-12, 3); c.quadraticCurveTo(-22, 10, -27, 1); c.lineTo(-31, 3); c.lineTo(-29, -3); c.lineTo(-33, -4); c.quadraticCurveTo(-24, -10, -12, -2); c.closePath(); shape(c, sk.bodyShade, 1.8);
    c.beginPath(); c.moveTo(-3, -5); c.lineTo(-18, -21 + wy); c.lineTo(-8, -14 + wy * .7); c.lineTo(-1, -26 + wy); c.lineTo(4, -13 + wy * .5); c.lineTo(13, -23 + wy); c.lineTo(11, -5); c.closePath(); shape(c, sk.beakBottom, 1.8);
    ell(c, -2, 3, 16, 11); shape(c, sk.bodyMain);
    c.fillStyle = sk.bodyHighlight; c.globalAlpha = .7; [-8, -2, 4].forEach(x => { c.fillRect(x, 8, 4, 2.4); }); c.globalAlpha = 1;
    ell(c, 15, -4, 9, 7.5); shape(c, sk.bodyMain); ell(c, 22, -2, 6, 4.6); shape(c, sk.bodyMain);
    poly(c, [11, -10, 7, -20, 16, -11]); shape(c, sk.beakTop, 1.6);
    eye(c, 15, -6, 3.8, o.dead);
    if (o.wing === 2) { c.fillStyle = sk.beakTop; poly(c, [27, -3, 36, -6, 33, -2, 38, 1, 27, 0]); c.fill(); }
  },
  angel(c, sk, t, o) {
    c.save(); c.shadowColor = '#FFE66D'; c.shadowBlur = 10; c.strokeStyle = '#FFE66D'; c.lineWidth = 2.6; ell(c, 2, -19 + Math.sin(t * .1) * 1.6, 9, 3); c.stroke(); c.restore();
    c.save(); c.translate(-7, 0);
    for (let i = 0; i < 3; i++) { c.save(); c.rotate(-.95 + i * .34 + o.wing * .28); ell(c, -13, 0, 15, 4.8); shape(c, i === 1 ? sk.bodyHighlight : sk.wingColor, 1.6); c.restore(); }
    c.restore();
    ell(c, 0, 2, 16, 13); shape(c, sk.bodyMain);
    ell(c, 1, 7, 11, 5); c.fillStyle = sk.bodyHighlight; c.fill();
    eye(c, 7, -3, 5, o.dead);
    poly(c, [15, 1, 24, 4, 15, 7]); shape(c, sk.beakTop, 1.8);
    c.fillStyle = 'rgba(255,120,160,.4)'; c.beginPath(); c.arc(11, 5, 2.6, 0, TAU); c.fill();
  },
  cube(c, sk, t, o) {
    const g = [sk.bodyMain, sk.bodyShade, sk.bodyHighlight], s = 10;
    for (let iy = 0; iy < 3; iy++) for (let ix = 0; ix < 3; ix++) {
      const seed = ix * 7 + iy * 13, jx = Math.sin(t * .31 + seed) > .86 ? Math.sin(t * 1.3 + seed) * 5 : 0;
      c.fillStyle = (ix + iy) % 4 === 3 ? sk.visorColor : g[(ix + iy * 2) % 3]; c.fillRect(-15 + ix * s + jx, -15 + iy * s, s, s); c.lineWidth = 1.5; c.strokeStyle = OUT; c.strokeRect(-15 + ix * s + jx, -15 + iy * s, s, s);
    }
    eye(c, 6, -7, 5, o.dead); rrect(c, 12, 0, 11, 6, 1.5); shape(c, sk.beakTop, 1.8);
    c.fillStyle = sk.visorColor; [[-19, -12], [19, -14], [-17, 17], [10, 18]].forEach((p, i) => { if ((t * .1 + i | 0) % 3) c.fillRect(p[0], p[1], 3, 3); });
  },
  omega(c, sk, t, o) {
    c.save(); c.rotate(-.35); c.strokeStyle = sk.beakTop; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, 26, 6.5, 0, Math.PI, TAU); c.stroke(); c.restore();
    const gr = c.createRadialGradient(-5, -6, 2, 0, 0, 17); gr.addColorStop(0, sk.bodyHighlight); gr.addColorStop(.6, sk.bodyMain); gr.addColorStop(1, sk.bodyShade);
    c.beginPath(); c.arc(0, 0, 16, 0, TAU); shape(c, gr, 2.2);
    c.save(); c.rotate(-.35); c.strokeStyle = sk.beakTop; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, 26, 6.5, 0, 0, Math.PI); c.stroke();
    const a = t * .12, sx = Math.cos(a) * 26, sy = Math.sin(a) * 6.5; if (Math.sin(a) > 0) { c.fillStyle = '#fff'; c.beginPath(); c.arc(sx, sy, 2.6, 0, TAU); c.fill(); } c.restore();
    eye(c, 6, -3, 5, o.dead);
    c.fillStyle = '#fff'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillText('Ω', -7, 8);
  }
};
const FACE = { ufo: 1, frog: 1, ghost: 1, star: 1, mecha: 1, car: 1, sub: 1, airship: 1, whale: 1, dragon: 1, angel: 1, cube: 1, omega: 1 };
CF.drawShape = function (c, shapeName, sk, t, o) {
  o = o || {}; o.wing = o.wing | 0;
  const f = SH[shapeName]; if (!f) return false;
  c.save(); c.lineJoin = 'round'; f(c, sk, t, o); c.restore();
  if (o.dead && !FACE[shapeName]) { c.save(); c.strokeStyle = '#FF003C'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(4, -7); c.lineTo(12, 1); c.moveTo(12, -7); c.lineTo(4, 1); c.stroke(); c.restore(); }
  return true;
};
CF._u = { TAU, OUT, rnd, pick, clamp, hash, hex2rgb, star4, poly, ell, shape };

// ================================================================ PARTIKEL (ekor & klik bertema)
const PALETTE = ['#00F5D4', '#FF2A6D', '#FFE600', '#A78BFA'];
const RATE = { smoke: .7, wake: .8, feathers: .5, shards: .5, stars: .55, bubbles: .5, wisp: .6, wind: .7, streak: .9, rainbow: 1, comet: 1, aurora: 1, glitch: .9 };
const ERR_BITS = ['01', '10', '0x', 'ERR', 'NULL', '404', '??', 'FF', 'E:7', '00'];
CF.spawn = function (P, kind, sk, x, y, burst) {
  if (!burst && Math.random() > (RATE[kind] || 1)) return;
  const n = burst ? (kind === 'glitch' ? 18 : 14) : (kind === 'flame' || kind === 'sparks' || kind === 'embers' || kind === 'pixels' ? 2 : 1);
  for (let i = 0; i < n; i++) {
    const a = burst ? rnd(0, TAU) : Math.PI + rnd(-.45, .45), sp = burst ? rnd(1.6, 5.2) : rnd(.3, 1.3);
    const p = { k: kind, x: x + (burst ? 0 : rnd(-2, 2)), y: y + (burst ? 0 : rnd(-3, 3)), vx: Math.cos(a) * sp - (burst ? 0 : 1.7), vy: Math.sin(a) * sp, life: 1, dec: rnd(.022, .045), s: rnd(3, 6), rot: rnd(0, TAU), vr: rnd(-.25, .25), sk, sd: Math.random() };
    switch (kind) {
      case 'smoke': p.s = rnd(4, 7); p.dec = .02; p.vy = burst ? p.vy : rnd(-.5, .15); break;
      case 'bubbles': p.vy = burst ? p.vy * .6 - .4 : -rnd(.2, .9); p.vx *= .5; p.s = rnd(2, 5.5); p.dec = .016; break;
      case 'wake': p.vy = burst ? -Math.abs(p.vy) - 1 : rnd(-.2, .6); p.s = rnd(2, 4); break;
      case 'wisp': p.vy = -rnd(.1, .7); p.s = rnd(4, 7); p.dec = .02; break;
      case 'embers': p.vy = rnd(-1.2, .2); p.s = rnd(1.6, 3.4); p.dec = .03; break;
      case 'feathers': p.vy = rnd(.1, .8); p.s = rnd(3, 5); p.dec = .015; break;
      case 'stars': p.s = rnd(3, 6.5); p.dec = .026; break;
      case 'shards': p.s = rnd(2.5, 5); p.dec = .03; break;
      case 'wind': p.vx = burst ? p.vx : -rnd(2.4, 4); p.vy *= .3; p.s = rnd(4, 8); p.dec = .06; break;
      case 'streak': p.vx = burst ? p.vx : -rnd(3, 4.5); p.vy *= .2; p.s = rnd(3, 6); p.dec = .04; break;
      case 'glitch': p.s = rnd(3, 7); p.dec = rnd(.04, .08); p.vx *= 1.2; p.sd = Math.random(); break;
      case 'aurora': p.vy = 0; p.s = rnd(4, 7); p.dec = .026; break;
      case 'comet': p.s = rnd(5, 8); p.dec = .04; p.vy *= .3; break;
    }
    P.push(p);
  }
  if (P.length > 280) P.splice(0, P.length - 280);
};
CF.updateParts = function (P) {
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i]; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= p.dec;
    switch (p.k) {
      case 'embers': p.vy -= .02; break; case 'feathers': p.vx *= .98; p.vy = Math.min(p.vy + .02, 1.2); break;
      case 'wisp': p.vy -= .012; break; case 'bubbles': p.x += Math.sin(p.life * 18 + p.sd * 9) * .35; break;
      case 'smoke': p.s += .14; break; case 'flame': p.s *= .965; break; case 'aurora': p.y += Math.sin(p.life * 22 + p.sd * 6) * 1.1; break;
      case 'wake': p.vy += .06; break;
    }
    if (p.life <= 0) P.splice(i, 1);
  }
};
CF.drawParts = function (c, P) {
  for (const p of P) {
    const a = clamp(p.life, 0, 1), sk = p.sk; c.globalAlpha = a;
    switch (p.k) {
      case 'dot': c.fillStyle = sk.trailColor; c.beginPath(); c.arc(p.x, p.y, p.s * a, 0, TAU); c.fill(); break;
      case 'flame': c.globalCompositeOperation = 'lighter'; c.fillStyle = a > .6 ? '#FFF1A8' : a > .3 ? sk.beakTop : sk.beakBottom; c.beginPath(); c.arc(p.x, p.y, p.s * (.45 + a * .7), 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over'; break;
      case 'smoke': c.fillStyle = 'rgba(185,195,212,.55)'; c.beginPath(); c.arc(p.x, p.y, p.s, 0, TAU); c.fill(); c.fillStyle = sk.beakTop; c.globalAlpha = a * (p.sd < .3 ? .9 : 0); c.fillRect(p.x, p.y, 2, 2); break;
      case 'bubbles': c.strokeStyle = 'rgba(210,245,255,.95)'; c.lineWidth = 1.3; c.beginPath(); c.arc(p.x, p.y, p.s, 0, TAU); c.stroke(); c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(p.x - p.s * .35, p.y - p.s * .35, p.s * .25, 0, TAU); c.fill(); break;
      case 'wake': c.fillStyle = 'rgba(236,250,255,.92)'; c.beginPath(); c.ellipse(p.x, p.y, p.s * 1.5, p.s * .7, 0, 0, TAU); c.fill(); break;
      case 'wisp': c.fillStyle = sk.bodyHighlight; c.globalAlpha = a * .5; c.beginPath(); c.arc(p.x, p.y, p.s * 1.5, 0, TAU); c.fill(); c.globalAlpha = a * .5; c.fillStyle = sk.visorColor; c.beginPath(); c.arc(p.x, p.y, p.s * .6, 0, TAU); c.fill(); break;
      case 'stars': c.fillStyle = p.sd > .5 ? '#fff' : sk.visorColor; star4(c, p.x, p.y, p.s * (.55 + .6 * Math.abs(Math.sin(p.sd * 9 + p.life * 14))), p.rot); c.fill(); break;
      case 'shards': c.save(); c.translate(p.x, p.y); c.rotate(p.rot); poly(c, [0, -p.s * 1.4, p.s, 0, 0, p.s * 1.4, -p.s, 0]); c.fillStyle = sk.bodyHighlight; c.fill(); c.strokeStyle = sk.bodyMain; c.lineWidth = 1; c.stroke(); c.restore(); break;
      case 'wind': c.strokeStyle = 'rgba(225,245,255,.8)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + p.s * 3.2, p.y); c.stroke(); break;
      case 'streak': c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = p.s * .45; c.lineCap = 'round'; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + p.s * 4.5, p.y); c.stroke(); break;
      case 'embers': c.globalCompositeOperation = 'lighter'; c.fillStyle = a > .5 ? sk.beakTop : sk.beakBottom; c.beginPath(); c.arc(p.x, p.y, p.s, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over'; break;
      case 'feathers': c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = sk.wingColor; c.beginPath(); c.ellipse(0, 0, p.s * 1.6, p.s * .6, 0, 0, TAU); c.fill(); c.strokeStyle = sk.bodyHighlight; c.lineWidth = .8; c.beginPath(); c.moveTo(-p.s * 1.6, 0); c.lineTo(p.s * 1.6, 0); c.stroke(); c.restore(); break;
      case 'pixels': c.fillStyle = p.sd < .4 ? sk.bodyMain : p.sd < .75 ? sk.visorColor : sk.bodyHighlight; c.fillRect(p.x, p.y, p.s, p.s); break;
      case 'sparks': c.strokeStyle = p.sd > .5 ? '#FFE66D' : sk.visorColor; c.lineWidth = 1.8; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 2.4, p.y - p.vy * 2.4); c.stroke(); break;
      case 'rainbow': c.fillStyle = PALETTE[(p.sd * 4) | 0]; c.beginPath(); c.arc(p.x, p.y, p.s * .8 * a + 1, 0, TAU); c.fill(); break;
      case 'comet': c.fillStyle = '#fff'; c.globalAlpha = a * .7; c.beginPath(); c.arc(p.x, p.y, p.s * a, 0, TAU); c.fill(); break;
      case 'aurora': c.globalCompositeOperation = 'lighter'; c.fillStyle = p.sd > .5 ? '#A78BFA' : '#00F5D4'; c.beginPath(); c.arc(p.x, p.y, p.s * a, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over'; break;
      case 'glitch': {
        const col = p.sd < .33 ? '#FF003C' : p.sd < .66 ? '#00E5FF' : '#E8FFE9';
        if (p.sd * 7 % 1 < .5) { c.fillStyle = col; c.font = 'bold ' + (7 + p.s) + 'px monospace'; c.textAlign = 'left'; c.fillText(ERR_BITS[(p.sd * 977 | 0) % ERR_BITS.length], p.x, p.y); }
        else { c.fillStyle = col; c.fillRect(p.x, p.y, p.s * 3, 1.6 + (p.sd > .5 ? 1.5 : 0)); }
        break;
      }
    }
  }
  c.globalAlpha = 1;
};

// ================================================================ EFEK KLIK (tap)
const TAP_DUR = { ring: 34, tap_ring: 36, tap_burst: 34, tap_lightning: 26, tap_portal: 52, tap_shock: 34, tap_firework: 56, skin: 40 };
CF.tapSpawn = function (list, id, sk, kind, x, y) {
  const e = { id: (TAP_DUR[id] ? id : 'skin'), x, y, age: 0, sk, kind, parts: [] };
  e.dur = TAP_DUR[e.id];
  if (e.id === 'skin') CF.spawn(e.parts, kind === 'dot' ? 'sparks' : kind, sk, x, y, true);
  list.push(e); if (list.length > 14) list.shift();
};
CF.tapDraw = function (c, list) {
  for (let i = list.length - 1; i >= 0; i--) {
    const e = list[i], t = e.age / e.dur; e.age++;
    if (t >= 1) { list.splice(i, 1); continue; }
    const sk = e.sk, x = e.x, y = e.y, inv = 1 - t;
    c.save(); c.lineCap = 'round';
    switch (e.id) {
      case 'tap_ring': c.strokeStyle = sk.visorColor; c.shadowColor = sk.visorColor; c.shadowBlur = 10; for (let k = 0; k < 3; k++) { const tk = clamp(t * 1.4 - k * .16, 0, 1); if (tk > 0 && tk < 1) { c.globalAlpha = 1 - tk; c.lineWidth = 3 * (1 - tk) + 1; c.beginPath(); c.arc(x, y, 6 + tk * 62, 0, TAU); c.stroke(); } } break;
      case 'tap_burst': for (let k = 0; k < 14; k++) { const a = k / 14 * TAU + .3, d = 6 + t * 62 * (.6 + hash(k) * .6), s = 7 * inv + 1; c.fillStyle = k % 2 ? '#FFE66D' : sk.visorColor; c.globalAlpha = inv; c.fillRect(x + Math.cos(a) * d - s / 2, y + Math.sin(a) * d - s / 2, s, s); } break;
      case 'tap_lightning': { c.strokeStyle = '#FF2A6D'; c.shadowColor = '#FF2A6D'; c.shadowBlur = 14; c.globalAlpha = inv; c.lineWidth = 2.4; const fr = e.age >> 1; for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + hash(fr + k) * .5; c.beginPath(); c.moveTo(x, y); let d = 0; for (let s = 1; s <= 5; s++) { d = s * (9 + t * 7); c.lineTo(x + Math.cos(a) * d + (hash(fr * 3 + k * 7 + s) - .5) * 12, y + Math.sin(a) * d + (hash(fr * 5 + k * 3 + s) - .5) * 12); } c.stroke(); } c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 7 * inv, 0, TAU); c.fill(); break; }
      case 'tap_portal': { const r = 38 * Math.sin(t * Math.PI) + 4; c.strokeStyle = '#A78BFA'; c.shadowColor = '#A78BFA'; c.shadowBlur = 16; c.lineWidth = 3; for (let k = 0; k < 3; k++) { c.globalAlpha = (1 - k * .25) * Math.sin(t * Math.PI); c.setLineDash([10, 7]); c.lineDashOffset = -e.age * (k % 2 ? -2 : 2.4); c.beginPath(); c.arc(x, y, r * (1 - k * .26), 0, TAU); c.stroke(); } c.setLineDash([]); c.fillStyle = 'rgba(167,139,250,.35)'; c.beginPath(); c.arc(x, y, r * .5, 0, TAU); c.fill(); break; }
      case 'tap_shock': c.strokeStyle = '#fff'; c.shadowColor = '#00F5D4'; c.shadowBlur = 14; c.globalAlpha = inv; c.lineWidth = 9 * inv + 1; c.beginPath(); c.arc(x, y, 4 + t * 82, 0, TAU); c.stroke(); c.lineWidth = 2; c.strokeStyle = sk.visorColor; for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; c.beginPath(); c.moveTo(x + Math.cos(a) * (t * 82 - 8), y + Math.sin(a) * (t * 82 - 8)); c.lineTo(x + Math.cos(a) * (t * 82 + 10), y + Math.sin(a) * (t * 82 + 10)); c.stroke(); } break;
      case 'tap_firework': for (let k = 0; k < 18; k++) { const a = k / 18 * TAU, d = (10 + 58 * Math.sqrt(t)) * (.7 + hash(k) * .5), gy = t * t * 34; c.fillStyle = PALETTE[k % 4]; c.globalAlpha = inv; c.shadowColor = c.fillStyle; c.shadowBlur = 8; c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d + gy, 2.6 * inv + .6, 0, TAU); c.fill(); } break;
      default: { // tema skin: cincin + semburan partikel sesuai bentuk
        c.strokeStyle = sk.visorColor; c.shadowColor = sk.visorColor; c.shadowBlur = 10; c.globalAlpha = inv * .9; c.lineWidth = 3 * inv + .8; c.beginPath(); c.arc(x, y, 5 + t * 44, 0, TAU); c.stroke();
        c.shadowBlur = 0; c.globalAlpha = 1; CF.updateParts(e.parts); CF.drawParts(c, e.parts);
      }
    }
    c.restore();
  }
};

// ================================================================ SUARA
const SND = { sound_arcade: { f: 520, ty: 'sine', d: .08, to: .65 }, sound_crystal: { f: 1100, ty: 'sine', d: .16, to: 1.5, h: 2.01 }, sound_plasma: { f: 240, ty: 'sawtooth', d: .1, to: .6 }, sound_8bit: { f: 720, ty: 'square', d: .09, arp: [1, 1.5, 2] }, sound_laser: { f: 1500, ty: 'sawtooth', d: .16, to: .12 }, sound_bubble: { f: 320, ty: 'sine', d: .14, to: 2.6 } };
CF.SOUND_IDS = Object.keys(SND);
CF.playSound = function (ac, id, vol) {
  const s = SND[id] || SND.sound_arcade; if (!ac) return; vol = vol || .05;
  const go = (f0, f1, t0, d, ty) => { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + t0; o.type = ty; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + d); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + .02); };
  if (s.arp) s.arp.forEach((m, i) => go(s.f * m, null, i * .045, s.d * .7, s.ty));
  else { go(s.f, s.f * s.to, 0, s.d, s.ty); if (s.h) go(s.f * s.h, s.f * s.h * s.to, .01, s.d, 'sine'); }
};

// ================================================================ TEMA LATAR
CF.THEMES = {
  theme_neon: { skyTop: null, skyBottom: null, ov: 'neon' },
  theme_synth: { skyTop: '#1A0626', skyBottom: '#7A1457', ov: 'synth' },
  theme_matrix: { skyTop: '#02100A', skyBottom: '#0B3B24', ov: 'matrix' },
  theme_solar: { skyTop: '#1F0C04', skyBottom: '#8A3A08', ov: 'solar' },
  theme_ocean: { skyTop: '#021B3A', skyBottom: '#0B6E8E', ov: 'ocean' },
  theme_space: { skyTop: '#04020F', skyBottom: '#1A1040', ov: 'space' },
  theme_storm: { skyTop: '#090D1A', skyBottom: '#2B3550', ov: 'storm' }
};
const MCHARS = 'ｱｲｳｴｵｶｷｸｹｺ01ﾊﾋﾌﾍﾎ79';
const OV = {
  neon(c, w, h, t) { c.fillStyle = 'rgba(0,245,212,.07)'; for (let i = 0; i < 3; i++) { const y = h * (.2 + i * .12) + Math.sin(t * .02 + i) * 6; c.fillRect(0, y, w, 1.5); } },
  synth(c, w, h, t) {
    const cx = w * .62, cy = h * .42, r = Math.min(w, h) * .2;
    const g = c.createLinearGradient(0, cy - r, 0, cy + r); g.addColorStop(0, '#FFE66D'); g.addColorStop(1, '#FF2A6D');
    c.save(); c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.clip(); c.fillStyle = g; c.fillRect(cx - r, cy - r, r * 2, r * 2); c.fillStyle = '#1A0626'; for (let i = 0; i < 6; i++) c.fillRect(cx - r, cy + i * r * .28 - r * .05 + (t * .1 % 1) * 0, r * 2, 1.5 + i * 1.4); c.restore();
    const hy = h * .66; c.strokeStyle = 'rgba(255,42,109,.45)'; c.lineWidth = 1;
    for (let i = -8; i <= 8; i++) { c.beginPath(); c.moveTo(w / 2 + i * 6, hy); c.lineTo(w / 2 + i * w * .16, h); c.stroke(); }
    for (let i = 0; i < 8; i++) { const k = ((i + (t * .02 % 1)) / 8), y = hy + (h - hy) * k * k; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  },
  matrix(c, w, h, t) {
    const cols = Math.ceil(w / 16); c.font = '12px monospace'; c.textAlign = 'center';
    for (let i = 0; i < cols; i++) { const sp = .5 + hash(i) * 1.4, y0 = ((t * sp + hash(i + 9) * h * 2) % (h * 1.4)) - h * .2;
      for (let j = 0; j < 9; j++) { const a = 1 - j / 9; c.fillStyle = j === 0 ? 'rgba(210,255,220,.95)' : `rgba(57,255,20,${a * .5})`; c.fillText(MCHARS[((i * 7 + j * 3 + (t / 6 | 0)) % MCHARS.length)], i * 16 + 8, y0 - j * 14); } }
  },
  solar(c, w, h, t) {
    const cx = w * .25, cy = h * .28, r = Math.min(w, h) * .16;
    const g = c.createRadialGradient(cx, cy, r * .2, cx, cy, r * 2.6); g.addColorStop(0, 'rgba(255,230,120,.95)'); g.addColorStop(.35, 'rgba(255,140,30,.55)'); g.addColorStop(1, 'rgba(255,80,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.save(); c.translate(cx, cy); c.rotate(t * .004); c.fillStyle = 'rgba(255,180,50,.18)'; for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); poly(c, [r, -4, r * 3.2, 0, r, 4]); c.fill(); } c.restore();
    c.fillStyle = '#FFF1A8'; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill();
    c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 26; i++) { const sp = .3 + hash(i) * .8, x = (hash(i + 4) * w + Math.sin(t * .02 + i) * 12), y = h - ((t * sp + hash(i + 2) * h) % h); c.fillStyle = `rgba(255,${120 + hash(i) * 100 | 0},30,.7)`; c.fillRect(x, y, 2, 2); } c.globalCompositeOperation = 'source-over';
  },
  ocean(c, w, h, t) {
    c.fillStyle = 'rgba(150,230,255,.08)'; for (let i = 0; i < 4; i++) { const x = w * (.1 + i * .27) + Math.sin(t * .01 + i) * 20; poly(c, [x, 0, x + 40, 0, x + 140, h, x + 60, h]); c.fill(); }
    for (let i = 0; i < 16; i++) { const sp = .3 + hash(i) * .6, x = hash(i + 3) * w + Math.sin(t * .03 + i) * 8, y = h - ((t * sp + hash(i + 7) * h) % h), r = 2 + hash(i + 11) * 4; c.strokeStyle = 'rgba(210,245,255,.6)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); }
    for (let i = 0; i < 3; i++) { const x = ((t * (.5 + i * .25) + i * w * .4) % (w + 80)) - 40, y = h * (.3 + i * .18) + Math.sin(t * .04 + i) * 6; c.fillStyle = 'rgba(8,40,70,.55)'; c.beginPath(); c.ellipse(x, y, 14, 6, 0, 0, TAU); c.fill(); poly(c, [x - 12, y, x - 24, y - 7, x - 24, y + 7]); c.fill(); }
    c.strokeStyle = 'rgba(180,240,255,.35)'; c.lineWidth = 2; c.beginPath(); for (let x = 0; x <= w; x += 8) { const y = 10 + Math.sin(x * .05 + t * .06) * 3; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  },
  space(c, w, h, t) {
    const n1 = c.createRadialGradient(w * .7, h * .3, 5, w * .7, h * .3, w * .5); n1.addColorStop(0, 'rgba(160,80,255,.28)'); n1.addColorStop(1, 'rgba(160,80,255,0)'); c.fillStyle = n1; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { const l = i % 3, x = ((hash(i) * w - t * (.1 + l * .12)) % w + w) % w, y = hash(i + 5) * h * .9; c.fillStyle = `rgba(255,255,255,${.35 + .5 * Math.abs(Math.sin(t * .03 + i))})`; c.fillRect(x, y, 1 + l * .6, 1 + l * .6); }
    const px = w * .3, py = h * .36, pr = Math.min(w, h) * .11; const g = c.createRadialGradient(px - pr * .3, py - pr * .3, 2, px, py, pr); g.addColorStop(0, '#FFB86B'); g.addColorStop(1, '#7A2E8E'); c.fillStyle = g; c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,220,180,.6)'; c.lineWidth = 3; c.beginPath(); c.ellipse(px, py, pr * 1.8, pr * .4, -.4, 0, TAU); c.stroke();
    const k = (t % 260) / 260; if (k < .3) { const sx = w * (1.1 - k * 4), sy = h * (.05 + k * 1.2); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + 50, sy - 18); c.stroke(); }
  },
  storm(c, w, h, t) {
    c.fillStyle = 'rgba(20,26,44,.8)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(w * (i / 5), 18 + Math.sin(i * 2 + t * .01) * 6, 46 + hash(i) * 26, 0, TAU); c.fill(); }
    const ph = t % 240; if (ph < 8) { c.fillStyle = `rgba(210,225,255,${(1 - ph / 8) * .5})`; c.fillRect(0, 0, w, h); if (ph < 5) { const bx = w * (.2 + hash((t / 240 | 0)) * .6); c.strokeStyle = '#EAF2FF'; c.lineWidth = 3; c.shadowColor = '#9CC1FF'; c.shadowBlur = 14; c.beginPath(); c.moveTo(bx, 0); let y = 0, x = bx; while (y < h * .6) { y += 30 + hash(y + t) * 20; x += (hash(y * 3) - .5) * 40; c.lineTo(x, y); } c.stroke(); c.shadowBlur = 0; } }
    c.strokeStyle = 'rgba(170,200,255,.4)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 70; i++) { const x = ((hash(i) * w * 1.3 - t * 2.2) % (w * 1.3) + w * 1.3) % (w * 1.3), y = ((hash(i + 8) * h + t * 14) % h); c.moveTo(x, y); c.lineTo(x - 4, y + 12); } c.stroke();
  }
};
CF.drawThemeOverlay = function (c, id, w, h, t) { const th = CF.THEMES[id]; if (!th || !OV[th.ov]) return; c.save(); OV[th.ov](c, w, h, t); c.restore(); };
CF.themeSky = (id, stageTop, stageBottom) => { const th = CF.THEMES[id]; if (!th || !th.skyTop) return [stageTop, stageBottom]; return [CF.mix(stageTop, th.skyTop, .7), CF.mix(stageBottom, th.skyBottom, .7)]; };

// ================================================================ PREVIEW TOKO
const PV_SK = { bodyMain: '#FFD60A', bodyShade: '#E09F00', bodyHighlight: '#FFF3B0', wingColor: '#FFF8D6', beakTop: '#FF7B00', beakBottom: '#D00000', visorColor: '#00F5D4', trailColor: 'rgba(255,214,10,.65)' };
CF.skinColors = (colors) => Object.assign({}, PV_SK, colors || {});
function previewBird(c, sk, t, o) { // burung klasik versi ringkas untuk preview
  c.beginPath(); c.ellipse(0, 0, 19, 15, 0, 0, TAU); shape(c, sk.bodyMain); c.beginPath(); c.ellipse(0, 5, 17, 9, 0, 0, Math.PI); c.fillStyle = sk.bodyShade; c.fill();
  c.beginPath(); c.ellipse(-2, -7, 11, 4, 0, 0, TAU); c.fillStyle = sk.bodyHighlight; c.fill();
  c.strokeStyle = sk.visorColor; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-14, 2); c.lineTo(-6, 2); c.lineTo(-3, 6); c.stroke();
  eye(c, 7, -5, 6.8, o.dead); rrect(c, 11, -1, 13, 6, 3); shape(c, sk.beakTop); rrect(c, 11, 4.5, 11, 5, 3); shape(c, sk.beakBottom);
  ell(c, -6, [-3, 2, 6][o.wing], 9.5, 6, -.2); shape(c, sk.wingColor);
}
CF.drawVehicle = function (c, skinId, sk, t, o) { o = o || {}; const sh = CF.shapeOf(skinId); if (sh === 'bird') previewBird(c, sk, t, o); else CF.drawShape(c, sh, sk, t, o); };
// state per kanvas preview: { P:[], taps:[], t:0 }
CF.previewFrame = function (c, w, h, kind, data, st) {
  st.t = (st.t || 0) + 1; const t = st.t; st.P = st.P || []; st.taps = st.taps || [];
  c.clearRect(0, 0, w, h);
  const bg = c.createLinearGradient(0, 0, 0, h); const th = CF.THEMES[data.theme || 'theme_neon'];
  bg.addColorStop(0, (kind === 'theme' && th.skyTop) || '#0c1233'); bg.addColorStop(1, (kind === 'theme' && th.skyBottom) || '#1B1448'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
  const sk = data.sk, skinId = data.skinId || 'skin_1';
  if (kind === 'theme') {
    CF.drawThemeOverlay(c, data.id, w, h, t);
    c.fillStyle = 'rgba(10,14,40,.85)'; for (let i = 0; i < 9; i++) { const bh = 14 + hash(i + 3) * 26; c.fillRect(i * w / 8 - 6, h - 12 - bh, w / 8 - 2, bh); }
    c.fillStyle = '#10163a'; c.fillRect(0, h - 12, w, 12); c.fillStyle = 'rgba(0,245,212,.6)'; c.fillRect(0, h - 12, w, 1.5);
    const px = w - ((t * 1.4) % (w + 40)); c.fillStyle = '#1B263B'; c.fillRect(px, 0, 18, h * .32); c.fillRect(px, h * .6, 18, h * .4); c.fillStyle = '#00F5D4'; c.fillRect(px, h * .32 - 3, 18, 3); c.fillRect(px, h * .6, 18, 3);
    c.save(); c.translate(w * .28, h * .46 + Math.sin(t * .08) * 5); c.scale(.62, .62); CF.drawVehicle(c, skinId, sk, t, { wing: (t / 8 | 0) % 3 }); c.restore();
    return;
  }
  if (kind === 'skin') {
    const kindFx = CF.tailKind(skinId, 'tail_default'), by = h * .5 + Math.sin(t * .07) * 5;
    if (data.glitch) CF.glitchPreviewBg && CF.glitchPreviewBg(c, w, h, t);
    if (kindFx !== 'dot') CF.spawn(st.P, kindFx, sk, w * .5 - 14, by); else if (t % 2 === 0) st.P.push({ k: 'dot', x: w * .5 - 14, y: by, vx: -1.8, vy: 0, life: 1, dec: .04, s: 7, rot: 0, vr: 0, sk, sd: 0 });
    CF.updateParts(st.P); CF.drawParts(c, st.P);
    c.save(); c.translate(w * .5, by); c.scale(1.45, 1.45); c.rotate(Math.sin(t * .07) * .08);
    if (data.glitch && CF.glitchBirdPreview) CF.glitchBirdPreview(c, t, (cc, s2, ox, oy, a) => { cc.save(); cc.translate(ox, oy); cc.globalAlpha *= a; CF.drawVehicle(cc, skinId, s2, t, { wing: (t / 7 | 0) % 3 }); cc.restore(); }, sk, st);
    else CF.drawVehicle(c, skinId, sk, t, { wing: (t / 7 | 0) % 3 });
    c.restore(); return;
  }
  // tap / tail / sound memakai kendaraan skin yang sedang dipakai sebagai pembawa
  if (kind === 'tail') {
    const by = h * .5 + Math.sin(t * .09) * 9, bx = w * .6, kd = CF.tailKind(skinId, data.id);
    CF.spawn(st.P, kd === 'dot' ? 'sparks' : kd, sk, bx - 14, by); CF.spawn(st.P, kd === 'dot' ? 'sparks' : kd, sk, bx - 14, by); CF.updateParts(st.P); CF.drawParts(c, st.P);
    c.save(); c.translate(bx, by); c.scale(1.1, 1.1); CF.drawVehicle(c, skinId, sk, t, { wing: (t / 7 | 0) % 3 }); c.restore(); return;
  }
  if (kind === 'tap') {
    if (st.fire || t % 75 === 1) { st.fire = false; const x = w * .5 + (st.fx || 0), y = h * .5; st.fx = 0; CF.tapSpawn(st.taps, data.id, sk, CF.tailKind(skinId, 'tail_default'), x, y); }
    const k = t % 75; c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(w * .5, h * .5, k < 6 ? 5 + (6 - k) : 5, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.stroke();
    CF.tapDraw(c, st.taps); return;
  }
  if (kind === 'sound') {
    const on = st.play > 0; st.play = Math.max(0, (st.play || 0) - 1);
    for (let i = 0; i < 14; i++) { const v = on ? .25 + .75 * Math.abs(Math.sin(t * .35 + i * 1.3)) * (1 - i / 22) : .12 + .06 * Math.sin(t * .1 + i); const bh = v * (h - 26); c.fillStyle = on ? '#00F5D4' : 'rgba(0,245,212,.35)'; c.fillRect(8 + i * (w - 16) / 14, (h - bh) / 2, (w - 16) / 14 - 3, bh); }
    c.fillStyle = '#fff'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.fillText(on ? '♪' : '▶', w / 2, h / 2 + 8);
  }
};

// ================================================================ GLITCH — skin "FATAL ERROR"
const G = CF.glitch = { death: null, stage: null, texts: [] };
const ERR = ['ERR_0x7F', 'NULL', '404', 'SEGFAULT', '0xDEADBEEF', 'undefined', 'NaN', 'STACK OVERFLOW', 'KERNEL PANIC', '0xC0000005', 'FATAL', 'CORRUPT', 'MEM_LEAK', 'ILLEGAL_OP', 'HALT', 'BAD_SECTOR', 'ERR::FLAP', 'null ptr', 'SYS_FAIL', 'ACCESS_VIOLATION', 'E_FAIL', '0x00000000', 'TRAP #6', 'BSOD'];
const ERR_COL = ['#FF003C', '#00E5FF', '#E8FFE9', '#FF00E6', '#FFE600', '#39FF14'];
const inv = (h) => { const [r, g, b] = hex2rgb(h); return `rgb(${255 - r},${255 - g},${255 - b})`; };
const rc = (sk, a) => Object.assign({}, sk, { bodyMain: a[0], bodyShade: a[1], bodyHighlight: a[2], wingColor: a[3], beakTop: a[4], beakBottom: a[5], visorColor: a[6] });
const VC = new Map();
function variant(sk, name) {
  const key = name + sk.bodyMain; if (VC.has(key)) return VC.get(key); let v;
  switch (name) {
    case 'red': v = rc(sk, ['#FF003C', '#5A0014', '#FF8AA0', '#FFC9D3', '#00E5FF', '#004B5A', '#FFE600']); break;
    case 'cyan': v = rc(sk, ['#00E5FF', '#004B5A', '#9DF3FF', '#DDFBFF', '#FF003C', '#5A0014', '#FFE600']); break;
    case 'mag': v = rc(sk, ['#FF00E6', '#5A0052', '#FF9CF4', '#FFD6FB', '#39FF14', '#0B4A00', '#00E5FF']); break;
    case 'white': v = rc(sk, ['#F4FFF6', '#7B8A80', '#FFFFFF', '#FFFFFF', '#BBBBBB', '#555555', '#FF003C']); break;
    case 'black': v = rc(sk, ['#050505', '#000000', '#1c1c1c', '#101010', '#181818', '#000000', '#FF003C']); break;
    case 'inv': v = Object.assign({}, sk, { bodyMain: inv(sk.bodyMain), bodyShade: inv(sk.bodyShade), bodyHighlight: inv(sk.bodyHighlight), wingColor: inv(sk.wingColor), beakTop: inv(sk.beakTop), beakBottom: inv(sk.beakBottom), visorColor: inv(sk.visorColor) }); break;
    default: v = sk;
  }
  VC.set(key, v); return v;
}
const gb = { mode: 'base', until: 0, alpha: 1, split: false, slice: false, lastT: -1 };
let bc = null; const BS = 2;
// Gambar burung/kendaraan yang berkedip: warna berganti, transparan, siluet hitam, RGB split, irisan bergeser.
// drawFn(ctx2d, skinVariant) harus menggambar objek di titik (0,0) ctx2d.
G.drawBird = function (c, drawFn, sk, t, bx, by) {
  if (!bc) { bc = document.createElement('canvas'); bc.width = 128 * BS; bc.height = 112 * BS; }
  const b2 = bc.getContext('2d');
  if (t !== gb.lastT) {
    gb.lastT = t;
    if (t >= gb.until) { const r = Math.random(); gb.mode = r < .34 ? 'base' : r < .44 ? 'red' : r < .54 ? 'cyan' : r < .62 ? 'mag' : r < .7 ? 'white' : r < .8 ? 'black' : r < .89 ? 'inv' : 'ghost'; gb.until = t + 2 + (Math.random() * 7 | 0); gb.alpha = gb.mode === 'ghost' ? rnd(.12, .3) : (Math.random() < .16 ? rnd(.4, .8) : 1); }
    gb.split = Math.random() < .3; gb.slice = Math.random() < .15;
  }
  const render = (v) => { b2.setTransform(BS, 0, 0, BS, 0, 0); b2.clearRect(0, 0, 128, 112); b2.save(); b2.translate(64, 56); drawFn(b2, v); b2.restore(); };
  const put = (a, dx, dy, comp) => { c.save(); c.globalAlpha *= a; if (comp) c.globalCompositeOperation = comp; c.drawImage(bc, 0, 0, bc.width, bc.height, bx - 64 + dx, by - 56 + dy, 128, 112); c.restore(); };
  const vname = gb.mode === 'ghost' ? 'base' : gb.mode;
  if (gb.split) { render(variant(sk, 'red')); put(.6 * gb.alpha, -4, 0, 'lighter'); render(variant(sk, 'cyan')); put(.6 * gb.alpha, 4, 0, 'lighter'); }
  render(variant(sk, vname));
  if (vname === 'black') { c.save(); c.shadowColor = '#FF003C'; c.shadowBlur = 10; c.globalAlpha *= gb.alpha; c.drawImage(bc, 0, 0, bc.width, bc.height, bx - 64, by - 56, 128, 112); c.restore(); }
  else if (gb.slice) { for (let i = 0; i < 4; i++) { const sy = i * 28, dx = (Math.random() - .5) * (i % 2 ? 18 : 10); c.save(); c.globalAlpha *= gb.alpha; c.drawImage(bc, 0, sy * BS, bc.width, 28 * BS, bx - 64 + dx, by - 56 + sy, 128, 28); c.restore(); } }
  else put(gb.alpha, 0, 0);
  if (Math.random() < .5) { c.save(); for (let i = 0; i < 3; i++) { c.fillStyle = pick(ERR_COL); c.globalAlpha = rnd(.5, .9); c.fillRect(bx + rnd(-30, 30), by + rnd(-24, 24), rnd(2, 9), rnd(1.5, 3)); } c.restore(); }
};
CF.glitchBirdPreview = (c, t, fn, sk) => G.drawBird(c, (b, v) => CF.drawVehicle(b, CF.GLITCH_SKIN, v, t, { wing: (t / 7 | 0) % 3 }), sk, t, 0, 0);
CF.glitchPreviewBg = (c, w, h, t) => {
  c.save(); const k = t / 4 | 0;
  if (hash(k) > .62) { c.fillStyle = hash(k + 1) > .5 ? 'rgba(255,0,60,.22)' : 'rgba(0,229,255,.22)'; c.fillRect(0, hash(k + 2) * h, w, 3 + hash(k + 3) * 10); }
  c.font = 'bold 9px monospace'; for (let i = 0; i < 4; i++) { c.fillStyle = `rgba(255,0,60,${.25 + .35 * hash(k + i)})`; c.fillText(ERR[(k + i * 5) % ERR.length], hash(i * 9 + (k >> 3)) * (w - 60), 12 + hash(i + 4 + (k >> 3)) * (h - 20)); }
  if (t % 97 < 2) { c.globalCompositeOperation = 'difference'; c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); }
  c.restore();
};
// teks kode error yang keluar dari burung
G.spawnText = (x, y) => { G.texts.push({ x, y, vx: rnd(-1.6, -.2), vy: rnd(-1.4, 1.4), life: 1, dec: rnd(.018, .03), t: pick(ERR), col: pick(ERR_COL), sz: rnd(8, 13), box: Math.random() < .2 }); if (G.texts.length > 40) G.texts.shift(); };
G.drawTexts = (c) => {
  c.save(); c.textAlign = 'left';
  for (const s of G.texts) { c.globalAlpha = clamp(s.life, 0, 1); c.font = `bold ${s.sz}px monospace`; const jx = Math.random() < .2 ? rnd(-2, 2) : 0; c.fillStyle = '#FF003C'; c.fillText(s.t, s.x - 1 + jx, s.y); c.fillStyle = '#00E5FF'; c.fillText(s.t, s.x + 1 + jx, s.y); c.fillStyle = s.col; c.fillText(s.t, s.x + jx, s.y); if (s.box) { c.strokeStyle = s.col; c.lineWidth = 1; c.strokeRect(s.x - 3, s.y - s.sz, c.measureText(s.t).width + 6, s.sz + 5); } }
  c.restore();
};
// retakan layar
function genCracks(centers, n) {
  return centers.map(c0 => {
    const rays = [], base = rnd(0, TAU);
    for (let i = 0; i < n; i++) {
      let ang = base + i * TAU / n + rnd(-.25, .25), x = c0.x, y = c0.y; const L = rnd(130, 430), segs = 6 + (Math.random() * 4 | 0), pts = [{ x, y }];
      for (let s = 1; s <= segs; s++) { ang += rnd(-.35, .35); const st = L / segs * rnd(.7, 1.3); x += Math.cos(ang) * st; y += Math.sin(ang) * st; pts.push({ x, y }); }
      const br = [];
      if (Math.random() < .75) { const k = 2 + (Math.random() * 3 | 0); let bx = pts[k].x, by = pts[k].y, ba = ang + rnd(.5, 1) * (Math.random() < .5 ? -1 : 1); br.push({ x: bx, y: by }); for (let s = 0; s < 3; s++) { ba += rnd(-.4, .4); bx += Math.cos(ba) * rnd(22, 48); by += Math.sin(ba) * rnd(22, 48); br.push({ x: bx, y: by }); } }
      rays.push({ pts, br });
    }
    return { c: c0, rays };
  });
}
function drawCracks(x, K, sets, prog, alpha) {
  x.save(); x.setTransform(K, 0, 0, K, 0, 0); x.lineCap = 'round'; x.lineJoin = 'round';
  for (const set of sets) {
    for (const pass of [0, 1]) {
      x.strokeStyle = pass ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha * .75})`; x.lineWidth = pass ? 1.3 : 3; const o = pass ? 0 : 1.3;
      x.beginPath();
      for (const r of set.rays) {
        const n = Math.max(1, Math.floor((r.pts.length - 1) * prog)); x.moveTo(r.pts[0].x + o, r.pts[0].y + o); for (let i = 1; i <= n; i++) x.lineTo(r.pts[i].x + o, r.pts[i].y + o);
        if (prog > .5 && r.br.length) { x.moveTo(r.br[0].x + o, r.br[0].y + o); const m = Math.floor(r.br.length * Math.min(1, (prog - .5) * 2)); for (let i = 1; i < m; i++) x.lineTo(r.br[i].x + o, r.br[i].y + o); }
      }
      for (const k of [2, 4]) for (let i = 0; i < set.rays.length; i++) { const a = set.rays[i], b = set.rays[(i + 1) % set.rays.length]; if (prog * (a.pts.length - 1) >= k) { x.moveTo(a.pts[k].x + o, a.pts[k].y + o); x.lineTo(b.pts[k].x + o, b.pts[k].y + o); } }
      x.stroke();
    }
    x.strokeStyle = `rgba(0,229,255,${alpha * .35})`; x.lineWidth = .7; x.beginPath(); for (const r of set.rays) { const n = Math.max(1, Math.floor((r.pts.length - 1) * prog)); x.moveTo(r.pts[0].x + 1.4, r.pts[0].y - 1); for (let i = 1; i <= n; i++) x.lineTo(r.pts[i].x + 1.4, r.pts[i].y - 1); } x.stroke();
  }
  x.restore();
}
G.startDeath = (w, h, cx, cy) => { G.death = { age: 0, cr: genCracks([{ x: cx, y: cy }], 11), sp: [] }; G.stage = null; };
G.startStage = (w, h) => { if (G.death) return; G.stage = { age: 0, cr: genCracks([{ x: rnd(w * .2, w * .8), y: rnd(h * .12, h * .45) }, { x: rnd(w * .2, w * .8), y: rnd(h * .5, h * .8) }], 7), sp: [] }; };
G.reset = () => { G.death = null; G.stage = null; G.texts.length = 0; };
G.skip = () => { const D = G.death; if (D && D.age > 22 && D.age < 118) D.age = 118; };
G.active = () => !!(G.death || G.stage);
G.deathPanel = () => !!(G.death && G.death.age > 26 && G.death.age < 150);
G.update = () => {
  const D = G.death, S = G.stage, Z = D || S;
  if (D) D.age++; else if (S) { S.age++; if (S.age > 100) G.stage = null; }
  if (Z) {
    const lim = D ? 70 : 46, per = D ? 4 : 3;
    if (Z.age < lim) for (let i = 0; i < per; i++) { const o = pick(Z.cr).c, a = rnd(0, TAU), sp = rnd(1.2, 5.5); Z.sp.push({ x: o.x + rnd(-40, 40), y: o.y + rnd(-40, 40), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, dec: rnd(.014, .03), t: pick(ERR), col: pick(ERR_COL), sz: rnd(9, D ? 24 : 18), box: Math.random() < .25, rot: rnd(-.3, .3) }); }
    for (let i = Z.sp.length - 1; i >= 0; i--) { const s = Z.sp[i]; s.x += s.vx; s.y += s.vy; s.life -= s.dec; if (s.life <= 0) Z.sp.splice(i, 1); }
  }
  for (let i = G.texts.length - 1; i >= 0; i--) { const s = G.texts[i]; s.x += s.vx; s.y += s.vy; s.life -= s.dec; if (s.life <= 0) G.texts.splice(i, 1); }
};
// latar langit berkedip saat pindah stage (dipanggil setelah langit digambar, sebelum pipa)
G.bgFlicker = (c, w, h) => {
  const S = G.stage; if (!S || S.age > 56) return; const k = S.age;
  if (hash(k * 3.1) > .5) { c.save(); c.globalAlpha = rnd(.25, .65); c.fillStyle = pick(['#000', '#fff', '#FF003C', '#00E5FF', '#1AFF6B', '#FF00E6']); c.fillRect(0, 0, w, h); c.restore(); }
  c.save(); for (let i = 0; i < 4; i++) { if (hash(k + i * 7) > .55) { c.fillStyle = pick(ERR_COL); c.globalAlpha = rnd(.15, .4); c.fillRect(0, hash(k * 5 + i) * h, w, rnd(3, 22)); } } c.restore();
};
// ---- post-processing layar penuh
let sn, wk, tr, tc, nz;
const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function tint(dst, src, col) { const d = dst.getContext('2d'); d.globalCompositeOperation = 'copy'; d.drawImage(src, 0, 0); d.globalCompositeOperation = 'multiply'; d.fillStyle = col; d.fillRect(0, 0, dst.width, dst.height); d.globalCompositeOperation = 'source-over'; }
const STAGE_INV = new Set([2, 3, 6, 7, 11, 12, 18, 19, 30, 31, 44]);
const PANEL = ['*** FATAL EXCEPTION ***', 'bird.exe  has stopped responding', 'STATUS: 0xC000021A  SYSTEM_PROCESS_TERMINATED', '', '> reality.dll ......... CORRUPTED', '> gravity.sys ......... OVERFLOW', '> flap_handler ........ NULL POINTER', '> pipe[0x7F] .......... ACCESS VIOLATION', '> bird.soul ........... NOT FOUND', '', 'collecting crash dump ...'];
const CREEPY = ['I SEE YOU', 'JANGAN TERBANG', 'KAMU TIDAK SENDIRIAN', 'HELP ME', '0x0000DEAD', 'KENAPA KAMU KEMBALI'];
G.post = function (ctx, canvas, w, h, t) {
  const D = G.death, S = G.stage; if (!D && !S) return;
  const W = canvas.width, H = canvas.height, K = W / w;
  if (!sn || sn.width !== W || sn.height !== H) { sn = mkc(W, H); wk = mkc(W, H); tr = mkc(W, H); tc = mkc(W, H); }
  if (!nz) nz = mkc(72, 128);
  let I = 0, panel = 0, fInv = false, fBlack = false, cP = 0, cA = 0, sets = null;
  if (D) { const a = D.age; I = a < 10 ? a / 10 : a < 110 ? 1 : a < 160 ? 1 - (a - 110) / 50 * .8 : (hash((t / 6) | 0) > .86 ? .45 : .04); panel = a < 26 ? 0 : a < 40 ? (a - 26) / 14 : a < 118 ? 1 : a < 150 ? 1 - (a - 118) / 32 : 0; cP = clamp(a / 16, 0, 1); cA = a < 160 ? .95 : .55; sets = D.cr; if (a < 100) { fInv = (a * 7) % 13 < 2; fBlack = a > 20 && (a * 5) % 17 < 1; } }
  else { const b = S.age; I = b < 8 ? b / 8 * .6 : .6 * Math.max(0, 1 - (b - 8) / 70); cP = clamp((b - 3) / 12, 0, 1); cA = .8 * clamp(1 - (b - 50) / 40, 0, 1); sets = S.cr; fInv = STAGE_INV.has(b); fBlack = b === 5 || b === 15; }
  const x = ctx; x.save(); x.setTransform(1, 0, 0, 1, 0, 0);
  if (I > .06) {
    sn.getContext('2d').drawImage(canvas, 0, 0);
    const wx = wk.getContext('2d'); wx.globalCompositeOperation = 'source-over'; wx.drawImage(sn, 0, 0);
    if (D && I > .5 && Math.random() < .18) { const r = (Math.random() * H * .3) | 0; wx.drawImage(sn, 0, 0, W, H - r, 0, r, W, H - r); wx.drawImage(sn, 0, H - r, W, r, 0, 0, W, r); }
    const ns = Math.round(3 + I * (D ? 10 : 5));
    for (let i = 0; i < ns; i++) { if (Math.random() > I) continue; const sy = (Math.random() * H) | 0, sh = ((6 + Math.random() * (D ? 90 : 34)) * K) | 0, dx = (Math.random() - .5) * (D ? 150 : 34) * I * K; wx.drawImage(sn, 0, sy, W, sh, dx, sy, W, sh); }
    const d = (D ? 9 : 3.5) * I * K * (.4 + Math.random() * .8);
    tint(tr, wk, '#ff0000'); tint(tc, wk, '#00ffff');
    x.globalCompositeOperation = 'source-over'; x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.drawImage(tr, -d, 0); x.globalCompositeOperation = 'lighter'; x.drawImage(tc, d, 0); x.globalCompositeOperation = 'source-over';
    if (I > .12) { if (t % 2 === 0) { const nx = nz.getContext('2d'), im = nx.createImageData(72, 128); for (let i = 0; i < im.data.length; i += 4) { const v = (Math.random() * 255) | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } nx.putImageData(im, 0, 0); } x.globalAlpha = .06 + .2 * I * (D ? 1 : .45); x.globalCompositeOperation = 'overlay'; x.imageSmoothingEnabled = false; x.drawImage(nz, 0, 0, W, H); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
    for (let i = 0; i < (D ? 4 : 2); i++) if (Math.random() < I * .6) { x.fillStyle = pick(['rgba(255,0,60,.28)', 'rgba(0,229,255,.28)', 'rgba(255,255,255,.2)']); x.fillRect(0, Math.random() * H, W, (2 + Math.random() * 14) * K); }
  }
  if (fInv) { x.globalCompositeOperation = 'difference'; x.fillStyle = '#fff'; x.globalAlpha = D ? 1 : .9; x.fillRect(0, 0, W, H); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
  if (fBlack) { x.fillStyle = 'rgba(0,0,0,.88)'; x.fillRect(0, 0, W, H); }
  if (sets && cP > 0 && cA > .01) {
    if (D && D.age < 160 && I > .06) { x.save(); x.setTransform(K, 0, 0, K, 0, 0); const set = sets[0]; for (let i = 0; i < set.rays.length; i += 1) { const a = set.rays[i], b = set.rays[(i + 1) % set.rays.length]; if (cP < .6) break; x.save(); x.beginPath(); x.moveTo(set.c.x, set.c.y); x.lineTo(a.pts[4].x, a.pts[4].y); x.lineTo(b.pts[4].x, b.pts[4].y); x.closePath(); x.clip(); x.drawImage(sn, 0, 0, W, H, (hash(i * 3.7) - .5) * 9, (hash(i * 5.1) - .5) * 9, w, h); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, 0, w, h); x.restore(); } x.restore(); }
    drawCracks(x, K, sets, cP, cA);
  }
  const Z = D || S;
  if (Z.sp.length) {
    x.setTransform(K, 0, 0, K, 0, 0); x.textAlign = 'left';
    for (const s of Z.sp) { x.globalAlpha = clamp(s.life, 0, 1) * (D ? 1 : .8); x.font = `bold ${s.sz}px monospace`; x.save(); x.translate(s.x, s.y); x.rotate(s.rot); x.fillStyle = '#FF003C'; x.fillText(s.t, -1.2, 0); x.fillStyle = '#00E5FF'; x.fillText(s.t, 1.2, 0); x.fillStyle = s.col; x.fillText(s.t, 0, 0); if (s.box) { x.strokeStyle = s.col; x.lineWidth = 1.2; x.strokeRect(-4, -s.sz, x.measureText(s.t).width + 8, s.sz + 6); } x.restore(); }
    x.globalAlpha = 1; x.setTransform(1, 0, 0, 1, 0, 0);
  }
  if (D && panel > 0) {
    const a = D.age; x.setTransform(K, 0, 0, K, 0, 0); x.globalAlpha = panel * (.84 + .1 * Math.random()); x.fillStyle = '#030004'; x.fillRect(0, 0, w, h);
    const vg = x.createRadialGradient(w / 2, h / 2, h * .2, w / 2, h / 2, h * .75); vg.addColorStop(0, 'rgba(120,0,10,0)'); vg.addColorStop(1, 'rgba(140,0,20,.6)'); x.globalAlpha = panel; x.fillStyle = vg; x.fillRect(0, 0, w, h);
    x.globalAlpha = panel; x.textAlign = 'left'; let shown = Math.max(0, (a - 24) * 4);
    const jit = Math.random() < .25 ? rnd(-5, 5) : 0;
    x.font = 'bold 30px monospace'; const title = 'FATAL ERROR'; x.fillStyle = '#FF003C'; x.fillText(title, 28 - 2 + jit, 150); x.fillStyle = '#00E5FF'; x.fillText(title, 28 + 2 + jit, 150); x.fillStyle = '#fff'; x.fillText(title, 28 + jit, 150);
    x.font = '12px monospace'; let y = 190;
    PANEL.forEach((ln, i) => { const part = ln.slice(0, Math.max(0, Math.min(ln.length, shown))); shown -= ln.length; x.fillStyle = i < 3 ? '#FF4D6D' : (ln.includes('CORRUPTED') || ln.includes('NOT FOUND') ? '#FF003C' : '#C9D1D9'); x.fillText(part + (shown > 0 && shown < 3 && i < PANEL.length ? '' : ''), 28 + (Math.random() < .03 ? rnd(-8, 8) : 0), y); y += 19; });
    if (a > 34) { const pct = Math.min(100, Math.max(0, ((a - 34) / 70 * 100) | 0)); x.fillStyle = '#FF003C'; x.fillText('MEMORY DUMP  ' + (Math.random() < .08 ? '??' : pct) + '%', 28, 440); x.strokeStyle = '#FF4D6D'; x.lineWidth = 1; x.strokeRect(28, 450, 300, 12); x.fillStyle = '#FF003C'; x.fillRect(30, 452, 296 * pct / 100, 8); }
    x.fillStyle = 'rgba(255,60,80,.28)'; x.font = '10px monospace'; for (let i = 0; i < 12; i++) x.fillText((hash(i + (a >> 2)) * 0xFFFFFF | 0).toString(16).padStart(6, '0').toUpperCase() + ' ' + (hash(i * 9 + (a >> 1)) * 0xFFFFFF | 0).toString(16).padStart(6, '0').toUpperCase(), 28, 500 + i * 12);
    for (const m of [48, 63, 79, 92, 104]) if (a >= m && a < m + 3) { const msg = CREEPY[m % CREEPY.length]; x.globalAlpha = 1; x.font = 'bold 38px monospace'; x.textAlign = 'center'; const jx = rnd(-8, 8), jy = h * (.25 + hash(m) * .5); x.fillStyle = '#00E5FF'; x.fillText(msg, w / 2 + jx + 3, jy); x.fillStyle = '#FF003C'; x.fillText(msg, w / 2 + jx - 3, jy); x.fillStyle = '#fff'; x.fillText(msg, w / 2 + jx, jy); }
    x.globalAlpha = panel * .08; x.fillStyle = '#000'; for (let yy = 0; yy < h; yy += 3) x.fillRect(0, yy, w, 1.2);
    if (a > 46) { x.globalAlpha = panel * .55; x.fillStyle = '#fff'; x.font = '10px monospace'; x.textAlign = 'center'; x.fillText('[ TAP UNTUK MELEWATI ]', w / 2, h - 22); }
    x.globalAlpha = 1; x.setTransform(1, 0, 0, 1, 0, 0);
  }
  x.restore();
};
// ---- suara glitch (WebAudio, tanpa file)
G.sound = function (ac, kind) {
  if (!ac) return;
  try {
    const now = ac.currentTime, death = kind === 'death', dur = death ? 1.6 : .35, n = (ac.sampleRate * dur) | 0, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0); let gate = 1; const seg = (ac.sampleRate / (death ? 28 : 60)) | 0;
    for (let i = 0; i < n; i++) { if (i % seg === 0) gate = Math.random() < .55 ? 1 : 0; d[i] = (Math.random() * 2 - 1) * gate * (1 - i / n); }
    const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = buf; g.gain.value = death ? .26 : .13; src.connect(g); g.connect(ac.destination); src.start(now);
    const tone = (type, f0, f1, t0, len, vol) => { const o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, now + t0); o.frequency.exponentialRampToValueAtTime(f1, now + t0 + len); og.gain.setValueAtTime(vol, now + t0); og.gain.exponentialRampToValueAtTime(.001, now + t0 + len); o.connect(og); og.connect(ac.destination); o.start(now + t0); o.stop(now + t0 + len + .05); };
    if (death) { tone('sawtooth', 70, 24, 0, 1.6, .22); tone('square', 900, 90, .05, .7, .06); tone('square', 1500, 200, .5, .25, .04); } else tone('square', 1300, 260, 0, .22, .05);
  } catch (e) { }
};
})();
