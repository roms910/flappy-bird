import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const $ = (id) => document.getElementById(id);
const modal = $('online-modal'), content = $('modal-content');
let supabase = null, user = null, catalog = [], profile = null, isAdmin = false, shownCoins = null;
const fmt = n => new Intl.NumberFormat('id-ID').format(Number(n || 0));
const ICONS = { skin: '🐤', theme: '🌌', tap: '✦', tail: '〰', sound: '♫' };
const EQUIP_COL = { skin: 'equipped_skin', theme: 'equipped_theme', tap: 'equipped_tap', tail: 'equipped_tail', sound: 'equipped_sound' };
let toastTimer = null;
function toast(message, error = false) {
  const el = $('toast'); el.textContent = message; el.classList.add('show'); el.classList.toggle('error', error);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
function openModal(title, html) { $('modal-title').textContent = title; content.innerHTML = html; modal.classList.remove('hidden'); }
function closeModal() { modal.classList.add('hidden'); stopPreviews(); }
$('modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
function safeText(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// ---------- FX helpers ----------
function confetti(originEl) {
  const r = originEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const colors = ['#00f5d4', '#ffe66d', '#ff2a6d', '#a78bfa', '#38bdf8'];
  for (let i = 0; i < 22; i++) {
    const s = document.createElement('span'), a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90;
    s.className = 'confetti'; s.style.left = cx + 'px'; s.style.top = cy + 'px'; s.style.background = colors[i % colors.length];
    s.style.setProperty('--x', Math.cos(a) * d + 'px'); s.style.setProperty('--y', Math.sin(a) * d + 40 + 'px');
    s.style.setProperty('--r', Math.random() * 720 - 360 + 'deg'); s.style.setProperty('--d', .7 + Math.random() * .5 + 's');
    document.body.appendChild(s); setTimeout(() => s.remove(), 1300);
  }
}
function setCoins(target) {
  const pill = $('coin-balance');
  if (shownCoins === null || shownCoins === target) { shownCoins = target; pill.textContent = `◈ ${fmt(target)} RCoin`; return; }
  const from = shownCoins, t0 = performance.now(); shownCoins = target;
  pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
  (function tick(now) {
    const k = Math.min(1, (now - t0) / 700), v = Math.round(from + (target - from) * (1 - Math.pow(1 - k, 3)));
    pill.textContent = `◈ ${fmt(v)} RCoin`; if (k < 1) requestAnimationFrame(tick);
  })(t0);
}

// ---------- Init ----------
const COLORS = {};
async function loadCatalog() {
  const base = await (await fetch('./catalog.json')).json();
  base.forEach(x => { if (x.colors && x.type === 'skin') COLORS[x.id] = x.colors; });
  if (!supabase) return base;
  // Harga/nama/aktif diambil dari database, jadi perubahan dari Admin Panel langsung terlihat di Shop.
  const { data, error } = await supabase.from('catalog').select('id,name,item_type,rarity,price,free,active');
  if (error || !data?.length) return base;
  const byId = new Map(base.map(x => [x.id, x]));
  return data.filter(r => r.active !== false).map(r => ({ ...(byId.get(r.id) || {}), id: r.id, name: r.name, type: r.item_type, rarity: r.rarity, price: r.price, free: r.free }));
}
async function init() {
  try {
    const cfg = await (await fetch('./supabase-config.json')).json();
    catalog = await loadCatalog();
    if (!cfg.url?.startsWith('https://') || cfg.anonKey?.startsWith('YOUR_')) throw new Error('Konfigurasi Supabase belum diisi. Ikuti README.');
    supabase = createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    const { data: { session } } = await supabase.auth.getSession(); user = session?.user || null;
    supabase.auth.onAuthStateChange((_e, s) => { user = s?.user || null; refreshAccount(); });
    await refreshAccount();
    window.addEventListener('cyberflappy:run-ended', e => submitRun(e.detail).catch(err => toast(err.message, true)));
  } catch (e) { console.warn(e); $('coin-balance').textContent = '◈ Offline'; $('account-open').textContent = 'Setup needed'; toast(e.message, true); }
}
async function checkAdmin() {
  isAdmin = false;
  if (supabase && user) { const { data, error } = await supabase.rpc('is_admin'); isAdmin = !error && data === true; }
  $('admin-open').classList.toggle('hidden', !isAdmin);
}
async function refreshAccount() {
  if (!supabase) return;
  if (!user) { profile = null; shownCoins = null; $('coin-balance').textContent = '◈ Guest'; $('account-open').textContent = 'Login Google'; checkAdmin(); return; }
  const { data, error } = await supabase.from('profiles').select('id,username,avatar_url,rcoin,total_runs,best_score,equipped_skin,equipped_theme,equipped_tap,equipped_tail,equipped_sound').eq('id', user.id).single();
  if (error) { console.error(error); toast('Gagal memuat profil', true); return; }
  profile = data; syncEquipped(); setCoins(profile.rcoin); $('account-open').textContent = (profile.username || 'Account').slice(0, 14);
  checkAdmin();
}

function syncEquipped() {
  if (!profile) return;
  window.CF_EFFECTS = window.CF_EFFECTS || {};
  for (const t of Object.keys(EQUIP_COL)) {
    const v = profile[EQUIP_COL[t]]; if (!v) continue;
    window.CF_EFFECTS[t] = v; try { localStorage.setItem('cf_equipped_' + t, v); } catch { }
    if (t === 'skin') window.CyberFlappyBridge?.equipSkin(v);
  }
}

// ---------- Account ----------
$('account-open').addEventListener('click', async () => {
  if (!supabase) { toast('Isi supabase-config.json dahulu', true); return; }
  if (user) {
    openModal('ACCOUNT', `<div class="profile-row"><img class="avatar" src="${safeText(profile?.avatar_url || user.user_metadata?.avatar_url || '')}" onerror="this.style.display='none'"><div><b>${safeText(profile?.username || user.email)}</b><small>${safeText(user.email)}${isAdmin ? ' · 🛡 Admin' : ''}</small></div></div>
      <div class="stat-grid"><div class="stat"><b>${fmt(profile?.best_score)}</b><small>BEST</small></div><div class="stat"><b>${fmt(profile?.total_runs)}</b><small>RUNS</small></div><div class="stat"><b>${fmt(profile?.rcoin)}</b><small>RCOIN</small></div></div>
      ${isAdmin ? '<a class="action-btn" style="display:block;text-align:center;text-decoration:none" href="./admin.html">🛡 Buka Admin Panel</a>' : ''}
      <button class="action-btn danger" id="logout-btn">Logout</button>`);
    $('logout-btn').onclick = async () => { await supabase.auth.signOut(); closeModal(); toast('Berhasil logout'); };
    return;
  }
  openModal('LOGIN', `<p class="muted">Masuk dengan akun Google untuk menyimpan RCoin, kosmetik, dan ranking lintas perangkat.</p><button class="action-btn" id="google-login">🌐 Lanjutkan dengan Google</button><small class="muted">Kami tidak pernah meminta atau menyimpan password Google.</small>`);
  $('google-login').onclick = async () => { const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname, queryParams: { access_type: 'offline', prompt: 'select_account' } } }); if (error) toast(error.message, true); };
});

// ---------- Shop ----------
$('shop-open').addEventListener('click', () => showShop('skin'));
async function showShop(type) {
  if (!supabase || !user) { openModal('RCoin SHOP', '<p class="muted">Login Google terlebih dahulu untuk membeli dan menyinkronkan item.</p><button class="action-btn" id="shop-login">Login Google</button>'); $('shop-login').onclick = () => $('account-open').click(); return; }
  const tabs = Object.keys(ICONS).map(t => `<button data-type="${t}" class="${t === type ? 'active' : ''}">${{ skin: 'Bird skins', theme: 'Themes', tap: 'Tap FX', tail: 'Tail FX', sound: 'Sounds' }[t]}</button>`).join('');
  openModal('RCoin SHOP', `<div class="shop-tabs">${tabs}</div><div class="catalog-grid" id="catalog-grid">${'<div class="skeleton"></div>'.repeat(4)}</div>`);
  content.querySelectorAll('[data-type]').forEach(b => b.onclick = () => showShop(b.dataset.type));
  const [inv, cat] = await Promise.all([supabase.from('inventory').select('item_id').eq('user_id', user.id), loadCatalog()]);
  if (inv.error) { toast(inv.error.message, true); return; }
  catalog = cat; renderShop(type, new Set(inv.data.map(x => x.item_id)));
}
const RARITY_ID = r => String(r).toLowerCase();
const DEFAULT_HINT = { tap: 'Mengikuti tema skin yang dipakai', tail: 'Mengikuti tema skin yang dipakai', sound: 'Klik untuk mendengar', theme: 'Langit asli stage' };
function equippedSkinId() { return profile?.equipped_skin || localStorage.getItem('cf_equipped_skin') || 'skin_1'; }
let pvRaf = 0, pvList = [], pvObs = null, pvFrame = 0;
function stopPreviews() { cancelAnimationFrame(pvRaf); pvRaf = 0; pvList = []; pvObs?.disconnect(); pvObs = null; }
function startPreviews() {
  cancelAnimationFrame(pvRaf);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  pvObs?.disconnect();
  pvObs = new IntersectionObserver(es => es.forEach(e => { e.target._vis = e.isIntersecting; }), { root: content.closest('.modal-card'), threshold: 0 });
  pvList.forEach(pv => pvObs.observe(pv.canvas));
  const loop = () => {
    if (modal.classList.contains('hidden') || !pvList.length) { stopPreviews(); return; }
    pvFrame++;
    if (window.CFSettings && window.CFSettings.eff.fps === 30 && pvFrame % 2) { pvRaf = requestAnimationFrame(loop); return; }
    for (const pv of pvList) {
      const cv = pv.canvas; if (!cv.isConnected || cv._vis === false) continue;
      const w = cv.clientWidth, h = cv.clientHeight; if (!w) continue;
      if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      try { window.CF.previewFrame(c, w, h, pv.kind, pv.data, pv.st); } catch (e) { console.warn(e); }
    }
    pvRaf = requestAnimationFrame(loop);
  };
  pvRaf = requestAnimationFrame(loop);
}
function previewData(type, item) {
  const carrierId = type === 'skin' ? item.id : equippedSkinId();
  const sk = window.CF.skinColors(COLORS[carrierId] || (type === 'skin' ? item.colors : null));
  return { id: item.id, skinId: carrierId, sk, glitch: type === 'skin' && item.id === window.CF.GLITCH_SKIN, theme: type === 'theme' ? item.id : null };
}
function renderShop(type, owned) {
  const grid = $('catalog-grid'); if (!grid) return;
  stopPreviews();
  const list = catalog.filter(x => x.type === type).sort((a, b) => (a.price || 0) - (b.price || 0));
  grid.innerHTML = list.map((item, i) => {
    const isOwned = item.free || owned.has(item.id), on = profile?.[EQUIP_COL[type]] === item.id || localStorage.getItem('cf_equipped_' + type) === item.id && profile?.[EQUIP_COL[type]] == null;
    const btn = !isOwned ? `<button class="mini-btn buy" data-item="${safeText(item.id)}" data-buy="1">Beli</button>` : on ? `<button class="mini-btn on" disabled>Dipakai ✓</button>` : `<button class="mini-btn" data-item="${safeText(item.id)}">Pakai</button>`;
    const shape = type === 'skin' ? (window.CF.SHAPE_NAMES[window.CF.shapeOf(item.id)] || '') : '';
    const sub = type === 'skin' ? `${safeText(item.rarity)} · ${safeText(item.id === window.CF.GLITCH_SKIN ? 'Kendaraan Bug' : shape)}` : (item.price === 0 && DEFAULT_HINT[type] ? safeText(DEFAULT_HINT[type]) : safeText(item.rarity));
    return `<article class="item-card r-${safeText(RARITY_ID(item.rarity))} ${on ? 'equipped' : ''}" style="--i:${i}"><canvas class="pv" data-pv="${i}" title="Ketuk untuk mencoba"></canvas><b>${safeText(item.name)}</b><small>${sub}</small><div class="item-bottom"><span>${item.free ? 'GRATIS' : '◈ ' + fmt(item.price)}</span>${btn}</div></article>`;
  }).join('') || '<p class="muted">Belum ada item di kategori ini.</p>';
  pvList = [...grid.querySelectorAll('canvas.pv')].map(cv => { const item = list[+cv.dataset.pv]; return { canvas: cv, kind: type, data: previewData(type, item), st: { t: Math.random() * 60 | 0, P: [], taps: [] } }; });
  pvList.forEach(pv => pv.canvas.addEventListener('click', () => {
    const { st, data } = pv;
    if (pv.kind === 'tap') st.fire = true;
    else if (pv.kind === 'sound') { st.play = 40; window.CF.playSound(getUiAudio(), data.id, .07); }
    else if (pv.kind === 'skin') window.CF.spawn(st.P, window.CF.tailKind(data.skinId, 'tail_default') === 'dot' ? 'sparks' : window.CF.tailKind(data.skinId, 'tail_default'), data.sk, pv.canvas.clientWidth / 2, pv.canvas.clientHeight / 2, true);
  }));
  startPreviews();
  grid.querySelectorAll('[data-item]').forEach(btn => btn.onclick = async () => {
    const id = btn.dataset.item;
    if (btn.dataset.buy) {
      btn.disabled = true;
      const { data, error } = await supabase.rpc('purchase_item', { p_item_id: id });
      if (error) { btn.disabled = false; toast(error.message, true); return; }
      confetti(btn); toast(`Berhasil membeli · saldo ${fmt(data?.balance)} RCoin`); await refreshAccount(); setTimeout(() => showShop(type), 650); return;
    }
    await equipItem(id, type); await refreshAccount(); showShop(type);
  });
}
async function equipItem(id, type) {
  const { error } = await supabase.rpc('equip_item', { p_item_id: id }); if (error) { toast(error.message, true); return; }
  if (type === 'skin' && window.CyberFlappyBridge) window.CyberFlappyBridge.equipSkin(id);
  window.CF_EFFECTS = window.CF_EFFECTS || {}; window.CF_EFFECTS[type] = id;
  try { localStorage.setItem('cf_equipped_' + type, id); } catch { }
  toast('Item berhasil dipakai');
}

// ---------- Leaderboard ----------
$('leaderboard-open').addEventListener('click', async () => {
  if (!supabase) { toast('Setup Supabase dahulu', true); return; }
  openModal('GLOBAL LEADERBOARD', '<div class="leader-list">' + '<div class="skeleton" style="height:44px"></div>'.repeat(6) + '</div>');
  const { data, error } = await supabase.from('leaderboard').select('user_id,username,avatar_url,best_score,total_runs').order('best_score', { ascending: false }).limit(50);
  if (error) { content.innerHTML = `<p class="muted">${safeText(error.message)}</p>`; return; }
  const medals = ['🥇', '🥈', '🥉'];
  content.innerHTML = `<div class="leader-list">${data.map((p, i) => `<div class="leader-row ${i < 3 ? 'top' + (i + 1) : ''} ${p.user_id === user?.id ? 'me' : ''}" style="--i:${i}"><strong class="rank">${medals[i] || i + 1}</strong><div class="leader-name">${safeText(p.username || 'Player')}</div><b>${fmt(p.best_score)}</b></div>`).join('') || '<p>Belum ada pemain.</p>'}</div>`;
});

async function submitRun(run) {
  if (!supabase || !user) return;
  // Server validates bounds and owns all RCoin updates; browser never writes wallet balance.
  const { data, error } = await supabase.rpc('submit_run', { p_score: Math.max(0, Math.floor(run.score || 0)), p_mode: run.mode || 'campaign', p_duration_seconds: 0 });
  if (error) { console.warn(error); return; }
  await refreshAccount(); toast(`Run tersimpan · +${fmt(data?.coins_earned)} RCoin`);
}

// ---------- Efek klik: kanvas overlay layar penuh (bertema skin atau item Tap FX yang dibeli) ----------
const fxCv = document.createElement('canvas'); fxCv.id = 'fx-canvas'; fxCv.style.background = 'transparent'; document.body.appendChild(fxCv);
const fxList = []; let fxRaf = 0;
function fxResize() { const d = Math.min(window.devicePixelRatio || 1, 2); fxCv.width = innerWidth * d; fxCv.height = innerHeight * d; }
fxResize(); window.addEventListener('resize', fxResize);
function fxLoop() {
  const c = fxCv.getContext('2d'), d = fxCv.width / innerWidth; c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, innerWidth, innerHeight);
  window.CF.tapDraw(c, fxList);
  fxRaf = fxList.length ? requestAnimationFrame(fxLoop) : 0;
}
$('gameCanvas').addEventListener('pointerdown', e => {
  if (!window.CF || (window.CFSettings && window.CFSettings.eff.bird === 0)) return;
  const skinId = window.CyberFlappyBridge?.getSkinId?.() || equippedSkinId(), tapId = localStorage.getItem('cf_equipped_tap') || 'tap_default';
  const sk = window.CF.skinColors(COLORS[skinId] || null);
  window.CF.tapSpawn(fxList, tapId, sk, window.CF.tailKind(skinId, 'tail_default'), e.clientX, e.clientY);
  if (!fxRaf) fxRaf = requestAnimationFrame(fxLoop);
});
window.addEventListener('load', () => {
  const id = localStorage.getItem('cf_equipped_skin'); if (id) window.CyberFlappyBridge?.equipSkin(id);
  window.CF_EFFECTS = { tail: localStorage.getItem('cf_equipped_tail') || 'tail_default', tap: localStorage.getItem('cf_equipped_tap') || 'tap_default', sound: localStorage.getItem('cf_equipped_sound') || 'sound_arcade', theme: localStorage.getItem('cf_equipped_theme') || 'theme_neon' };
});

// ---------- Audio toggle di top bar (tombol audio di canvas tertutup bar) ----------
function syncAudioBtn() { const on = window.CyberFlappyBridge?.isAudioOn?.() ?? true; $('audio-toggle').firstChild.textContent = on ? '🔊 ' : '🔇 '; }
$('audio-toggle').addEventListener('click', () => { window.CyberFlappyBridge?.toggleAudio?.(); syncAudioBtn(); });

// ---------- Sembunyikan top bar saat bermain ----------
setInterval(() => {
  const st = window.CyberFlappyBridge?.getState?.();
  document.body.classList.toggle('playing', ['READY', 'PLAYING', 'DYING_NORMAL', 'DYING_QUIZ'].includes(st));
}, 120);

let uiAudioContext = null;
function getUiAudio() { try { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; uiAudioContext = uiAudioContext || new AC(); if (uiAudioContext.state === 'suspended') uiAudioContext.resume(); return uiAudioContext; } catch { return null; } }
function uiClickSound() { window.CF?.playSound(getUiAudio(), window.CF_EFFECTS?.sound || 'sound_arcade', .045); }
document.addEventListener('click', e => { if (e.target.closest('button,.nav-btn')) uiClickSound(); });
init();
