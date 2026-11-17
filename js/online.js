import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const $ = (id) => document.getElementById(id);
const modal = $('online-modal'), content = $('modal-content');
let supabase = null, user = null, catalog = [], profile = null;
const fmt = n => new Intl.NumberFormat('id-ID').format(Number(n || 0));
function toast(message, error=false){ const el=$('toast'); el.textContent=message; el.classList.add('show'); el.classList.toggle('error',error); setTimeout(()=>el.classList.remove('show'),2600); }
function openModal(title, html){ $('modal-title').textContent=title; content.innerHTML=html; modal.classList.remove('hidden'); }
function closeModal(){ modal.classList.add('hidden'); }
$('modal-close').addEventListener('click',closeModal); modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
function safeText(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function init(){
  try{
    const [cfgRes,catRes]=await Promise.all([fetch('./supabase-config.json'),fetch('./catalog.json')]);
    const cfg=await cfgRes.json(); catalog=await catRes.json();
    if(!cfg.url?.startsWith('https://')||cfg.anonKey?.startsWith('YOUR_')) throw new Error('Konfigurasi Supabase belum diisi. Ikuti README.');
    supabase=createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data:{session}}=await supabase.auth.getSession(); user=session?.user||null;
    supabase.auth.onAuthStateChange((_event,session)=>{ user=session?.user||null; refreshAccount(); });
    await refreshAccount();
    window.addEventListener('cyberflappy:run-ended',e=>submitRun(e.detail).catch(err=>toast(err.message,true)));
  }catch(e){ console.warn(e); $('coin-balance').textContent='◈ Offline'; $('account-open').textContent='Setup needed'; toast(e.message,true); }
}
async function refreshAccount(){
  if(!supabase)return;
  if(!user){profile=null;$('coin-balance').textContent='◈ Guest';$('account-open').textContent='Login Google';return;}
  const {data,error}=await supabase.from('profiles').select('id,username,avatar_url,rcoin,total_runs,best_score').eq('id',user.id).single();
  if(error){console.error(error);toast('Gagal memuat profil',true);return;}
  profile=data;$('coin-balance').textContent=`◈ ${fmt(profile.rcoin)} RCoin`;$('account-open').textContent=(profile.username||'Account').slice(0,14);
}
$('account-open').addEventListener('click',async()=>{
  if(!supabase){toast('Isi supabase-config.json dahulu',true);return;}
  if(user){openModal('ACCOUNT',`<div class="profile-row"><img class="avatar" src="${safeText(profile?.avatar_url||user.user_metadata?.avatar_url||'')}" onerror="this.style.display='none'"><div><b>${safeText(profile?.username||user.email)}</b><small>${safeText(user.email)}</small></div></div><p class="muted">Best score: ${fmt(profile?.best_score)} · Total run: ${fmt(profile?.total_runs)}</p><button class="action-btn danger" id="logout-btn">Logout</button>`);$('logout-btn').onclick=async()=>{await supabase.auth.signOut();closeModal();toast('Berhasil logout');};return;}
  openModal('LOGIN',`<p class="muted">Masuk dengan akun Google untuk menyimpan RCoin, kosmetik, dan ranking lintas perangkat.</p><button class="action-btn" id="google-login">🌐 Lanjutkan dengan Google</button><small class="muted">Kami tidak pernah meminta atau menyimpan password Google.</small>`);
  $('google-login').onclick=async()=>{const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname, queryParams:{access_type:'offline',prompt:'select_account'}}});if(error)toast(error.message,true);};
});
$('shop-open').addEventListener('click',()=>showShop('skin'));
function showShop(type){
  if(!supabase||!user){openModal('RCoin SHOP','<p class="muted">Login Google terlebih dahulu untuk membeli dan menyinkronkan item.</p><button class="action-btn" id="shop-login">Login Google</button>');$('shop-login').onclick=()=>$('account-open').click();return;}
  const owned=new Set();
  supabase.from('inventory').select('item_id').eq('user_id',user.id).then(({data,error})=>{if(error){toast(error.message,true);return;}data.forEach(x=>owned.add(x.item_id));renderShop(type,owned);});
  openModal('RCoin SHOP','<div class="shop-tabs"><button data-type="skin">Bird skins</button><button data-type="theme">Themes</button><button data-type="tap">Tap FX</button><button data-type="tail">Tail FX</button><button data-type="sound">Sounds</button></div><div class="catalog-grid" id="catalog-grid">Loading catalog...</div>');
  content.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>showShop(b.dataset.type));
}
function renderShop(type,owned){
  const list=catalog.filter(x=>x.type===type),grid=$('catalog-grid');if(!grid)return;
  grid.innerHTML=list.map(item=>{const isOwned=item.free||owned.has(item.id);const colors=item.colors||{};const swatch=colors.bodyMain||item.colors?.[2]||'#00F5D4';return `<article class="item-card"><div class="swatch" style="--swatch:${safeText(swatch)}">${type==='skin'?'🐤':type==='theme'?'🌌':type==='tap'?'✦':type==='tail'?'〰':'♫'}</div><b>${safeText(item.name)}</b><small>${safeText(item.rarity)}</small><div class="item-bottom"><span>◈ ${fmt(item.price)}</span><button class="mini-btn" data-item="${safeText(item.id)}" ${isOwned?'':'data-buy="1"'}>${isOwned?'Owned':'Buy'}</button></div></article>`;}).join('');
  grid.querySelectorAll('[data-item]').forEach(btn=>btn.onclick=async()=>{const id=btn.dataset.item;if(btn.dataset.buy){btn.disabled=true;const {data,error}=await supabase.rpc('purchase_item',{p_item_id:id});btn.disabled=false;if(error){toast(error.message,true);return;}toast(`Berhasil membeli · saldo ${fmt(data?.balance)} RCoin`);await refreshAccount();showShop(type);return;}await equipItem(id,type);});
}
async function equipItem(id,type){
  const {error}=await supabase.rpc('equip_item',{p_item_id:id});if(error){toast(error.message,true);return;}
  if(type==='skin'&&window.CyberFlappyBridge){window.CyberFlappyBridge.equipSkin(id);}
  window.CF_EFFECTS=window.CF_EFFECTS||{}; window.CF_EFFECTS[type]=id;
  if(type==='theme'){const themes={theme_neon:'hue-rotate(0deg) saturate(1)',theme_synth:'hue-rotate(45deg) saturate(1.15)',theme_matrix:'hue-rotate(105deg) saturate(1.25)',theme_solar:'hue-rotate(-25deg) saturate(1.2)'};document.getElementById('gameCanvas').style.filter=themes[id]||'';}
  try{localStorage.setItem('cf_equipped_'+type,id);}catch{}
  toast('Item berhasil dipakai');
}
$('leaderboard-open').addEventListener('click',async()=>{
  if(!supabase){toast('Setup Supabase dahulu',true);return;}
  openModal('GLOBAL LEADERBOARD','<p class="muted">Memuat ranking...</p>');
  const {data,error}=await supabase.from('leaderboard').select('user_id,username,avatar_url,best_score,total_runs').order('best_score',{ascending:false}).limit(50);
  if(error){content.innerHTML=`<p class="muted">${safeText(error.message)}</p>`;return;}
  content.innerHTML=`<div class="leader-list">${data.map((p,i)=>`<div class="leader-row"><strong class="rank">${i+1}</strong><div class="leader-name">${safeText(p.username||'Player')}</div><b>${fmt(p.best_score)}</b></div>`).join('')||'<p>Belum ada pemain.</p>'}</div>`;
});
async function submitRun(run){
  if(!supabase||!user)return;
  // Server validates bounds and owns all RCoin updates; browser never writes wallet balance.
  const {data,error}=await supabase.rpc('submit_run',{p_score:Math.max(0,Math.floor(run.score||0)),p_mode:run.mode||'campaign',p_duration_seconds:0});
  if(error){console.warn(error);return;}
  await refreshAccount();toast(`Run tersimpan · +${fmt(data?.coins_earned)} RCoin`);
}
// Visual tap feedback, independent of game simulation.
document.getElementById('gameCanvas').addEventListener('pointerdown',e=>{
  const fx=localStorage.getItem('cf_equipped_tap')||'tap_default';if(fx==='tap_default')return;
  const el=document.createElement('span');el.className='tap-fx '+fx;el.style.left=e.clientX+'px';el.style.top=e.clientY+'px';document.body.appendChild(el);setTimeout(()=>el.remove(),650);
});
// Restore equipped starter skin after the classic engine has initialized.
window.addEventListener('load',()=>{const id=localStorage.getItem('cf_equipped_skin');if(id)window.CyberFlappyBridge?.equipSkin(id);window.CF_EFFECTS={tail:localStorage.getItem('cf_equipped_tail')||'tail_default',tap:localStorage.getItem('cf_equipped_tap')||'tap_default',sound:localStorage.getItem('cf_equipped_sound')||'sound_arcade',theme:localStorage.getItem('cf_equipped_theme')||'theme_neon'};});
let uiAudioContext=null;
function uiClickSound(){
  const sound=window.CF_EFFECTS?.sound||'sound_arcade';
  try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;uiAudioContext=uiAudioContext||new AC();if(uiAudioContext.state==='suspended')uiAudioContext.resume();
    const osc=uiAudioContext.createOscillator(),gain=uiAudioContext.createGain();
    const freq=sound==='sound_crystal'?1100:sound==='sound_plasma'?240:sound==='sound_8bit'?720:520;
    osc.type=sound==='sound_plasma'?'sawtooth':sound==='sound_8bit'?'square':'sine';osc.frequency.setValueAtTime(freq,uiAudioContext.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*.65,uiAudioContext.currentTime+.07);gain.gain.setValueAtTime(.045,uiAudioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,uiAudioContext.currentTime+.08);osc.connect(gain);gain.connect(uiAudioContext.destination);osc.start();osc.stop(uiAudioContext.currentTime+.09);
  }catch{}
}
document.addEventListener('click',e=>{if(e.target.closest('button'))uiClickSound();});
init();
