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
function closeModal() { modal.classList.add('hidden'); }
$('modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
function safeText(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function drawCatalogPreview(canvas, item, phase = 0) {
  const c = canvas.getContext('2d'), w = canvas.width = 320, h = canvas.height = 150;
  c.clearRect(0,0,w,h);
  const colors=item.colors||{}, main=colors.bodyMain||'#00F5D4', shade=colors.bodyShade||'#153047', hi=colors.bodyHighlight||'#EAFBFF';
  const bg=c.createLinearGradient(0,0,w,h);
  if(item.type==='theme'){
    const palettes={theme_neon:['#080B25','#263A72','#00F5D4'],theme_synth:['#260B35','#8A246D','#FF8AD8'],theme_matrix:['#031C16','#075B42','#55FF91'],theme_solar:['#35130A','#A94C20','#FFC857']};
    const p=palettes[item.id]||['#10172b','#31415f','#00F5D4'];bg.addColorStop(0,p[0]);bg.addColorStop(1,p[1]);c.fillStyle=bg;c.fillRect(0,0,w,h);
    c.fillStyle=p[2];c.globalAlpha=.8;c.beginPath();c.arc(238,48,27,0,Math.PI*2);c.fill();c.globalAlpha=1;
    for(let i=0;i<8;i++){c.fillStyle=p[2];c.globalAlpha=.25;c.fillRect(i*43,90+(i%3)*8,24,60);}c.globalAlpha=1;
    c.strokeStyle=p[2];c.globalAlpha=.7;c.beginPath();c.moveTo(0,125);c.lineTo(w,125);c.stroke();
  }else{
    bg.addColorStop(0,'#101b32');bg.addColorStop(1,'#050914');c.fillStyle=bg;c.fillRect(0,0,w,h);
  }
  c.save();c.translate(w/2,h/2+2);
  if(item.type==='skin'){
    c.shadowColor=colors.visorColor||main;c.shadowBlur=18;
    const shape=item.vehicle||'bird';
    c.fillStyle=shade;
    if(shape==='jet'){c.beginPath();c.moveTo(-95,0);c.lineTo(-25,-15);c.lineTo(8,-55);c.lineTo(25,-48);c.lineTo(18,-10);c.lineTo(100,0);c.lineTo(18,10);c.lineTo(25,48);c.lineTo(8,55);c.lineTo(-25,15);c.closePath();c.fill();c.fillStyle=main;c.fillRect(-48,-7,125,14);}
    else if(shape==='hovercar'){c.beginPath();c.moveTo(-95,25);c.lineTo(-70,-12);c.lineTo(-20,-28);c.lineTo(40,-25);c.lineTo(90,12);c.lineTo(100,28);c.closePath();c.fill();c.fillStyle=main;c.beginPath();c.moveTo(-42,-20);c.lineTo(-15,-55);c.lineTo(38,-55);c.lineTo(65,-18);c.closePath();c.fill();c.fillStyle=colors.visorColor||hi;c.fillRect(-65,25,35,7);c.fillRect(38,25,35,7);}
    else if(shape==='starship'||shape==='wingcraft'){c.beginPath();c.moveTo(-105,0);c.lineTo(-25,-24);c.lineTo(5,-60);c.lineTo(36,-22);c.lineTo(105,0);c.lineTo(36,22);c.lineTo(5,60);c.lineTo(-25,24);c.closePath();c.fill();c.fillStyle=main;c.fillRect(-52,-10,125,20);}
    else if(shape==='dragon'||shape==='angel'){c.beginPath();c.ellipse(0,12,55,35,0,0,Math.PI*2);c.fill();c.fillStyle=main;c.beginPath();c.moveTo(-8,4);c.quadraticCurveTo(-100,-90,-100,-30);c.quadraticCurveTo(-45,-35,-25,22);c.closePath();c.fill();c.beginPath();c.moveTo(8,4);c.quadraticCurveTo(100,-90,100,-30);c.quadraticCurveTo(45,-35,25,22);c.closePath();c.fill();}
    else if(shape==='ufo'){c.beginPath();c.ellipse(0,25,105,28,0,0,Math.PI*2);c.fill();c.fillStyle=main;c.beginPath();c.ellipse(0,-5,65,40,0,Math.PI,Math.PI*2);c.fill();}
    else if(shape==='mech'){c.fillRect(-55,-48,110,95);c.fillStyle=main;c.fillRect(-42,-35,84,68);c.fillStyle=colors.visorColor||hi;c.fillRect(8,-12,38,16);c.fillStyle=shade;c.fillRect(-85,-20,25,55);c.fillRect(60,-20,25,55);}
    else if(shape==='glitch'){const palette=['#fff','#00F5D4','#FF2A6D','#111'];c.globalAlpha=.8;c.fillStyle=palette[phase%4];c.beginPath();c.moveTo(-70,-25);c.lineTo(-25,-55);c.lineTo(42,-36);c.lineTo(76,-8);c.lineTo(60,40);c.lineTo(-5,55);c.lineTo(-75,25);c.closePath();c.fill();c.globalAlpha=1;c.fillStyle='#050505';c.fillRect(-18,-30,92,60);c.fillStyle='#FF2A6D';c.fillRect(-95,-37,60,8);c.fillStyle='#00F5D4';c.fillRect(35,45,90,7);c.font='bold 12px monospace';c.fillText('ERR 0xNULL',-48,78);}
    else{c.beginPath();c.ellipse(0,0,64,49,0,0,Math.PI*2);c.fill();c.fillStyle=main;c.beginPath();c.ellipse(0,0,58,43,0,0,Math.PI*2);c.fill();c.fillStyle=hi;c.beginPath();c.ellipse(-8,-24,32,10,0,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(25,-10,19,0,Math.PI*2);c.fill();c.fillStyle='#111';c.beginPath();c.arc(31,-10,8,0,Math.PI*2);c.fill();c.fillStyle=colors.beakTop||'#FF9B42';c.fillRect(46,0,37,15);c.fillStyle=colors.wingColor||hi;c.beginPath();c.ellipse(-20,15,30,19,-.3,0,Math.PI*2);c.fill();}
    c.shadowBlur=0;
  }else if(item.type==='tap'){
    const col=item.id.includes('portal')?'#A78BFA':item.id.includes('lightning')?'#FF2A6D':item.id.includes('burst')?'#FFE66D':'#00F5D4';
    for(let i=0;i<4;i++){c.strokeStyle=col;c.globalAlpha=.8-i*.15;c.lineWidth=3;c.beginPath();c.arc(0,0,14+i*17+Math.sin(phase*.3+i)*4,0,Math.PI*2);c.stroke();}
    c.globalAlpha=1;c.fillStyle='#fff';c.font='bold 30px monospace';c.textAlign='center';c.fillText('✦',0,10);
  }else if(item.type==='tail'){
    const cols=item.id.includes('rainbow')?['#ff3b81','#ffc857','#54ff9f','#38bdf8','#b78cff']:[item.id.includes('aurora')?'#9b8cff':item.id.includes('comet')?'#fff':item.id.includes('spark')?'#ffe66d':'#00F5D4'];
    for(let i=0;i<7;i++){c.strokeStyle=cols[i%cols.length];c.globalAlpha=1-i*.1;c.lineWidth=3+i*.4;c.beginPath();c.moveTo(-130+i*7,Math.sin(phase*.15+i*.7)*17);c.quadraticCurveTo(-30+i*9,Math.cos(phase*.13+i)*27,25+i*8,Math.sin(phase*.2+i)*12);c.stroke();}c.globalAlpha=1;
    c.fillStyle='#fff';c.beginPath();c.arc(80,0,13,0,Math.PI*2);c.fill();
  }else if(item.type==='sound'){
    const col=item.id.includes('plasma')?'#A78BFA':item.id.includes('8bit')?'#FFE66D':item.id.includes('crystal')?'#7DD3FC':'#00F5D4';
    c.strokeStyle=col;c.lineWidth=5;c.beginPath();for(let x=-130;x<=130;x+=4){const y=Math.sin(x*.045+phase*.15)*Math.cos(x*.013)*34;c.lineTo(x,y);}c.stroke();
    c.fillStyle=col;c.globalAlpha=.5;c.beginPath();c.arc(0,0,52,0,Math.PI*2);c.fill();c.globalAlpha=1;
  }
  c.restore();
}


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
async function loadCatalog() {
  const base = await (await fetch('./catalog.json')).json();
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
  profile = data; setCoins(profile.rcoin); $('account-open').textContent = (profile.username || 'Account').slice(0, 14);
  // Keep equipped cosmetics synchronized across devices after Google login.
  if (window.CyberFlappyBridge) window.CyberFlappyBridge.equipSkin(profile.equipped_skin || 'skin_1');
  window.CF_EFFECTS = { ...(window.CF_EFFECTS || {}), theme: profile.equipped_theme || 'theme_neon', tap: profile.equipped_tap || 'tap_default', tail: profile.equipped_tail || 'tail_default', sound: profile.equipped_sound || 'sound_arcade' };
  try {
    ['skin','theme','tap','tail','sound'].forEach(type => localStorage.setItem('cf_equipped_' + type, profile['equipped_' + type] || ({skin:'skin_1',theme:'theme_neon',tap:'tap_default',tail:'tail_default',sound:'sound_arcade'}[type])));
  } catch {}
  const themeFilters = { theme_neon:'none', theme_synth:'hue-rotate(45deg) saturate(1.15)', theme_matrix:'hue-rotate(105deg) saturate(1.25)', theme_solar:'hue-rotate(-25deg) saturate(1.2)' };
  $('gameCanvas').style.filter = themeFilters[profile.equipped_theme] || 'none';
  checkAdmin();
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
function renderShop(type, owned) {
  const grid = $('catalog-grid'); if (!grid) return;
  const list = catalog.filter(x => x.type === type);
  grid.innerHTML = list.map((item, i) => {
    const isOwned = item.free || owned.has(item.id), on = profile?.[EQUIP_COL[type]] === item.id || localStorage.getItem('cf_equipped_' + type) === item.id && profile?.[EQUIP_COL[type]] == null;
    const swatch = item.colors?.bodyMain || '#00F5D4';
    const btn = !isOwned ? `<button class="mini-btn buy" data-item="${safeText(item.id)}" data-buy="1">Beli</button>` : on ? `<button class="mini-btn on" disabled>Dipakai ✓</button>` : `<button class="mini-btn" data-item="${safeText(item.id)}">Pakai</button>`;
    const shapeLabel = item.vehicle && item.vehicle !== 'bird' ? item.vehicle.toUpperCase() : (type === 'skin' ? 'BIRD FORM' : type.toUpperCase() + ' PREVIEW');
    return `<article class="item-card r-${safeText(String(item.rarity).toLowerCase())} ${item.vehicle==='glitch'?'r-glitched':''} ${on ? 'equipped' : ''}" style="--i:${i}"><div class="item-preview-wrap"><canvas class="item-preview type-${safeText(type)}" data-preview="${safeText(item.id)}" width="320" height="150" aria-label="Preview ${safeText(item.name)}"></canvas><span class="preview-tag">${safeText(shapeLabel)}</span></div><b>${safeText(item.name)}</b><small>${safeText(item.rarity)}</small><div class="item-bottom"><span>${item.free ? 'GRATIS' : '◈ ' + fmt(item.price)}</span>${btn}</div></article>`;
  }).join('') || '<p class="muted">Belum ada item di kategori ini.</p>';
  grid.querySelectorAll('canvas[data-preview]').forEach((canvas, i) => {
    const item = list.find(x => x.id === canvas.dataset.preview);
    if (item) drawCatalogPreview(canvas, item, i);
  });
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
  if (type === 'theme') { const themes = { theme_neon: 'hue-rotate(0deg) saturate(1)', theme_synth: 'hue-rotate(45deg) saturate(1.15)', theme_matrix: 'hue-rotate(105deg) saturate(1.25)', theme_solar: 'hue-rotate(-25deg) saturate(1.2)' }; $('gameCanvas').style.filter = themes[id] || ''; }
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

// ---------- Visual tap feedback ----------
$('gameCanvas').addEventListener('pointerdown', e => {
  const glitchSkin = localStorage.getItem('cf_equipped_skin') === 'skin_glitch_omega';
  const fx = localStorage.getItem('cf_equipped_tap') || 'tap_default';
  if (fx === 'tap_default' && !glitchSkin) return;
  const count = glitchSkin ? 3 : 1;
  for (let i=0;i<count;i++) {
    const el = document.createElement('span');
    el.className = 'tap-fx ' + (glitchSkin ? 'tap-glitch' : fx);
    el.style.left = (e.clientX + (Math.random()-.5)*(glitchSkin?24:0)) + 'px';
    el.style.top = (e.clientY + (Math.random()-.5)*(glitchSkin?24:0)) + 'px';
    document.body.appendChild(el); setTimeout(() => el.remove(), 700);
  }
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
function uiClickSound() {
  const sound = window.CF_EFFECTS?.sound || 'sound_arcade';
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; uiAudioContext = uiAudioContext || new AC(); if (uiAudioContext.state === 'suspended') uiAudioContext.resume();
    const osc = uiAudioContext.createOscillator(), gain = uiAudioContext.createGain(), t = uiAudioContext.currentTime;
    const glitchSkin = localStorage.getItem('cf_equipped_skin') === 'skin_glitch_omega';
    const freq = glitchSkin ? (180 + Math.random()*1150) : sound === 'sound_crystal' ? 1100 : sound === 'sound_plasma' ? 240 : sound === 'sound_8bit' ? 720 : 520;
    osc.type = glitchSkin || sound === 'sound_plasma' ? 'sawtooth' : sound === 'sound_8bit' ? 'square' : 'sine';
    osc.frequency.setValueAtTime(freq, t); osc.frequency.exponentialRampToValueAtTime(freq * .65, t + .07);
    gain.gain.setValueAtTime(.045, t); gain.gain.exponentialRampToValueAtTime(.001, t + .08);
    osc.connect(gain); gain.connect(uiAudioContext.destination); osc.start(); osc.stop(t + .09);
  } catch { }
}
document.addEventListener('click', e => { if (e.target.closest('button,.nav-btn')) uiClickSound(); });
init();
