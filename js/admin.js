import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => new Intl.NumberFormat('id-ID').format(Number(n || 0));
const RARITY = ['Free', 'Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Corrupted'];

// Definisi tabel (sesuai supabase/schema.sql + admin.sql).  pk = kolom primary key, ro = read-only, null = boleh NULL.
const TABLES = {
  profiles: { label: '👤 Profiles', pk: ['id'], order: 'created_at', touch: 'updated_at', cols: [
    { n: 'id', t: 'uuid', ro: true }, { n: 'username', t: 'text' }, { n: 'avatar_url', t: 'text', null: true },
    { n: 'rcoin', t: 'int' }, { n: 'best_score', t: 'int' }, { n: 'total_runs', t: 'int' },
    { n: 'equipped_skin', t: 'text' }, { n: 'equipped_theme', t: 'text' }, { n: 'equipped_tap', t: 'text' }, { n: 'equipped_tail', t: 'text' }, { n: 'equipped_sound', t: 'text' },
    { n: 'created_at', t: 'ts', ro: true }, { n: 'updated_at', t: 'ts', ro: true }] },
  catalog: { label: '🛒 Catalog', pk: ['id'], order: 'id', cols: [
    { n: 'id', t: 'text', pk: true }, { n: 'name', t: 'text' }, { n: 'item_type', t: 'enum', opts: ['skin', 'theme', 'tap', 'tail', 'sound'] },
    { n: 'rarity', t: 'enum', opts: RARITY }, { n: 'price', t: 'int' }, { n: 'free', t: 'bool' }, { n: 'active', t: 'bool' }] },
  inventory: { label: '🎒 Inventory', pk: ['user_id', 'item_id'], order: 'purchased_at', cols: [
    { n: 'user_id', t: 'uuid', pk: true }, { n: 'item_id', t: 'text', pk: true }, { n: 'purchased_at', t: 'ts' }] },
  game_runs: { label: '🎮 Game runs', pk: ['id'], order: 'created_at', cols: [
    { n: 'id', t: 'uuid', ro: true }, { n: 'user_id', t: 'uuid' }, { n: 'score', t: 'int' }, { n: 'mode', t: 'enum', opts: ['campaign', 'endless'] },
    { n: 'coins_earned', t: 'int' }, { n: 'created_at', t: 'ts' }] },
  admins: { label: '🛡 Admins', pk: ['email'], order: 'created_at', cols: [
    { n: 'email', t: 'text', pk: true }, { n: 'note', t: 'text', null: true }, { n: 'created_at', t: 'ts', ro: true }] },
};
const st = { tab: 'dashboard', page: 0, size: 25, sort: null, q: '', rows: [], total: 0 };
let supabase, session, toastTimer;

function toast(m, error = false) { const el = $('toast'); el.textContent = m; el.className = 'toast show' + (error ? ' error' : ''); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3000); }
function gate(html) { $('app').classList.add('hidden'); const g = $('gate'); g.classList.remove('hidden'); g.innerHTML = `<div class="gate-card">${html}</div>`; }

// ---------- Boot & akses ----------
async function boot() {
  try {
    const cfg = await (await fetch('./supabase-config.json')).json();
    if (!cfg.url?.startsWith('https://') || cfg.anonKey?.startsWith('YOUR_')) throw new Error('supabase-config.json belum diisi.');
    supabase = createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  } catch (e) { gate(`<h2>SETUP</h2><p>${esc(e.message)}</p><a class="btn" href="./index.html">← Kembali ke game</a>`); return; }
  supabase.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') location.reload(); });
  const { data } = await supabase.auth.getSession(); session = data.session;
  if (!session) {
    gate(`<h2>ADMIN LOGIN</h2><p>Masuk dengan akun Google yang terdaftar sebagai admin.</p><button id="g" class="btn primary" style="width:100%;justify-content:center">🌐 Lanjutkan dengan Google</button><p><a class="btn ghost" href="./index.html">← Kembali ke game</a></p>`);
    $('g').onclick = async () => { const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: 'select_account' } } }); if (error) toast(error.message, true); };
    return;
  }
  const { data: ok, error } = await supabase.rpc('is_admin');
  if (error || ok !== true) {
    gate(`<h2>AKSES DITOLAK</h2><p>${esc(session.user.email)} bukan admin.${error ? '<br><small>(' + esc(error.message) + ' — sudah menjalankan supabase/admin.sql?)</small>' : ''}</p><a class="btn" href="./index.html">← Kembali ke game</a> <button id="lo" class="btn danger">Ganti akun</button>`);
    $('lo').onclick = () => supabase.auth.signOut(); return;
  }
  $('gate').classList.add('hidden'); $('app').classList.remove('hidden');
  $('who').textContent = session.user.email; $('logout').onclick = () => supabase.auth.signOut();
  renderTabs(); show('dashboard');
}

function renderTabs() {
  $('tabs').innerHTML = `<button class="tab" data-t="dashboard">📊 Dashboard</button>` + Object.entries(TABLES).map(([k, v]) => `<button class="tab" data-t="${k}">${v.label}</button>`).join('');
  $('tabs').onclick = (e) => { const b = e.target.closest('.tab'); if (b) show(b.dataset.t); };
}
function show(tab) {
  st.tab = tab; st.page = 0; st.q = ''; st.sort = null;
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.t === tab));
  const m = $('main'); m.style.animation = 'none'; void m.offsetWidth; m.style.animation = '';
  tab === 'dashboard' ? renderDashboard() : renderTable();
}

// ---------- Dashboard ----------
function countUp(root) {
  root.querySelectorAll('[data-n]').forEach(el => { const to = Number(el.dataset.n), t0 = performance.now();
    (function tick(now) { const k = Math.min(1, (now - t0) / 800); el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(tick); })(t0); });
}
async function renderDashboard() {
  $('main').innerHTML = '<div class="empty"><div class="spinner"></div>Memuat…</div>';
  const names = Object.keys(TABLES);
  const [counts, coins, top, runs] = await Promise.all([
    Promise.all(names.map(n => supabase.from(n).select('*', { count: 'exact', head: true }))),
    supabase.from('profiles').select('rcoin').limit(1000),
    supabase.from('profiles').select('username,best_score,rcoin').order('best_score', { ascending: false }).limit(5),
    supabase.from('game_runs').select('score,mode,coins_earned,created_at,user_id').order('created_at', { ascending: false }).limit(8)]);
  const circulating = (coins.data || []).reduce((a, r) => a + Number(r.rcoin || 0), 0);
  const cards = names.map((n, i) => `<div class="card" style="animation-delay:${i * 60}ms"><b data-n="${counts[i].count ?? 0}">0</b><small>${TABLES[n].label.toUpperCase()}</small></div>`).join('')
    + `<div class="card" style="animation-delay:300ms"><b data-n="${circulating}">0</b><small>◈ RCOIN BEREDAR${(coins.data?.length || 0) >= 1000 ? ' (1000 PEMAIN PERTAMA)' : ''}</small></div>`;
  $('main').innerHTML = `<div class="cards">${cards}</div><div class="two">
    <div class="box"><h3>🏆 TOP 5 PEMAIN</h3>${(top.data || []).map((p, i) => `<div class="row"><span>${i + 1}. ${esc(p.username)}</span><b>${fmt(p.best_score)}</b></div>`).join('') || '<div class="empty">Belum ada data</div>'}</div>
    <div class="box"><h3>🕒 RUN TERBARU</h3>${(runs.data || []).map(r => `<div class="row"><span>${esc(r.mode)} · skor ${fmt(r.score)} <small>+${fmt(r.coins_earned)}◈</small></span><small>${new Date(r.created_at).toLocaleString('id-ID')}</small></div>`).join('') || '<div class="empty">Belum ada data</div>'}</div></div>`;
  countUp($('main'));
}

// ---------- Tabel ----------
const cur = () => TABLES[st.tab];
function buildSearch(q) {
  const cols = cur().cols, parts = [], s = q.replace(/[,()*%\\]/g, ' ').trim();
  if (!s) return null;
  cols.filter(c => c.t === 'text' || c.t === 'enum').forEach(c => parts.push(`${c.n}.ilike.*${s}*`));
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) cols.filter(c => c.t === 'uuid').forEach(c => parts.push(`${c.n}.eq.${s}`));
  if (/^\d+$/.test(s)) cols.filter(c => c.t === 'int').forEach(c => parts.push(`${c.n}.eq.${s}`));
  return parts.length ? parts.join(',') : null;
}
async function loadRows() {
  const def = cur(), from = st.page * st.size;
  let q = supabase.from(st.tab).select('*', { count: 'exact' });
  const f = buildSearch(st.q); if (f) q = q.or(f);
  const sort = st.sort || { col: def.order, asc: false };
  q = q.order(sort.col, { ascending: sort.asc }).range(from, from + st.size - 1);
  const { data, count, error } = await q;
  if (error) { toast(error.message, true); st.rows = []; st.total = 0; } else { st.rows = data; st.total = count ?? data.length; }
  drawBody();
}
function renderTable() {
  const def = cur();
  $('main').innerHTML = `<div class="toolbar"><input id="q" class="grow" placeholder="Cari di ${esc(st.tab)}…" autocomplete="off">
    <select id="size">${[25, 50, 100].map(n => `<option ${n === st.size ? 'selected' : ''}>${n}</option>`).join('')}</select>
    <button class="btn" id="refresh">⟳ Refresh</button><button class="btn" id="csv">⬇ CSV</button><button class="btn primary" id="add">＋ Tambah</button></div>
    <div class="tw"><table><thead><tr>${def.cols.map(c => `<th data-c="${c.n}">${c.n}<span class="arrow"></span></th>`).join('')}<th style="cursor:default">aksi</th></tr></thead><tbody id="tb"></tbody></table></div>
    <div class="pager"><span id="info"></span><span><button class="btn" id="prev">‹</button> <button class="btn" id="next">›</button></span></div>`;
  let t; $('q').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { st.q = e.target.value; st.page = 0; loadRows(); }, 300); };
  $('size').onchange = (e) => { st.size = +e.target.value; st.page = 0; loadRows(); };
  $('refresh').onclick = loadRows; $('add').onclick = openAdd; $('csv').onclick = exportCsv;
  $('prev').onclick = () => { if (st.page > 0) { st.page--; loadRows(); } };
  $('next').onclick = () => { if ((st.page + 1) * st.size < st.total) { st.page++; loadRows(); } };
  $('main').querySelector('thead').onclick = (e) => { const th = e.target.closest('th[data-c]'); if (!th) return; const c = th.dataset.c; st.sort = { col: c, asc: st.sort?.col === c ? !st.sort.asc : true }; loadRows(); };
  $('tb').onclick = onCellClick;
  loadRows();
}
function cellHtml(c, v) {
  if (v === null || v === undefined) return '<span class="null">null</span>';
  if (c.t === 'bool') return `<input type="checkbox" class="chk" ${v ? 'checked' : ''}>`;
  if (c.t === 'ts') return esc(new Date(v).toLocaleString('id-ID'));
  return esc(v);
}
const editable = (c) => !c.ro && !c.pk;
function drawBody() {
  const def = cur();
  document.querySelectorAll('th[data-c]').forEach(th => { const s = st.sort?.col === th.dataset.c; th.classList.toggle('sorted', s); th.querySelector('.arrow').textContent = s ? (st.sort.asc ? ' ▲' : ' ▼') : ''; });
  $('tb').innerHTML = st.rows.map((r, i) => `<tr data-i="${i}" style="animation-delay:${Math.min(i, 20) * 12}ms">${def.cols.map(c => `<td data-c="${c.n}" class="${editable(c) ? 'edit' : 'ro'}" title="${esc(r[c.n] ?? '')}">${cellHtml(c, r[c.n])}</td>`).join('')}<td><div class="acts"><button class="ib" data-a="json" title="Edit baris (JSON)">✎</button><button class="ib del" data-a="del" title="Hapus">🗑</button></div></td></tr>`).join('')
    || `<tr><td colspan="${def.cols.length + 1}" class="empty">Tidak ada data</td></tr>`;
  const a = st.total ? st.page * st.size + 1 : 0, b = Math.min(st.total, (st.page + 1) * st.size);
  $('info').textContent = `${a}–${b} dari ${fmt(st.total)} baris`;
  $('prev').disabled = st.page === 0; $('next').disabled = b >= st.total;
}

// ---------- Operasi database ----------
function match(q, def, row) { def.pk.forEach(k => { q = q.eq(k, row[k]); }); return q; }
async function dbUpdate(row, patch) {
  const def = cur(); if (def.touch) patch = { ...patch, [def.touch]: new Date().toISOString() };
  const { data, error } = await match(supabase.from(st.tab).update(patch), def, row).select();
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error('Tidak ada baris yang berubah (akses ditolak atau baris sudah hilang).');
  return data[0];
}
function coerce(c, raw) {
  if (c.t === 'bool') return !!raw;
  if (raw === '' || raw === null) { if (c.null) return null; if (c.t === 'text') return ''; throw new Error(`Kolom ${c.n} tidak boleh kosong`); }
  if (c.t === 'int') { const n = Number(raw); if (!Number.isInteger(n)) throw new Error(`Kolom ${c.n} harus bilangan bulat`); return n; }
  return raw;
}
async function onCellClick(e) {
  const btn = e.target.closest('[data-a]'), tr = e.target.closest('tr[data-i]'); if (!tr) return;
  const row = st.rows[+tr.dataset.i];
  if (btn) { btn.dataset.a === 'json' ? openJson(row) : openDelete(row); return; }
  const td = e.target.closest('td.edit'); if (!td) return;
  const c = cur().cols.find(x => x.n === td.dataset.c);
  if (c.t === 'bool') { const chk = td.querySelector('input'); if (e.target !== chk) chk.checked = !chk.checked; await commit(td, row, c, chk.checked); return; }
  if (td.querySelector('input,select')) return;
  const old = row[c.n];
  const input = c.t === 'enum' ? Object.assign(document.createElement('select'), { innerHTML: c.opts.map(o => `<option ${o === old ? 'selected' : ''}>${esc(o)}</option>`).join('') })
    : Object.assign(document.createElement('input'), { type: c.t === 'int' ? 'number' : 'text', value: old ?? '' });
  td.textContent = ''; td.appendChild(input); input.focus(); input.select?.();
  let done = false;
  const finish = async (save) => { if (done) return; done = true; if (!save || String(input.value) === String(old ?? '')) { td.innerHTML = cellHtml(c, old); return; } await commit(td, row, c, input.value); };
  input.onkeydown = (k) => { if (k.key === 'Enter') finish(true); if (k.key === 'Escape') finish(false); };
  input.onblur = () => finish(true);
  if (c.t === 'enum') input.onchange = () => finish(true);
}
async function commit(td, row, c, raw) {
  td.classList.add('saving');
  try { const v = coerce(c, raw); const upd = await dbUpdate(row, { [c.n]: v }); Object.assign(row, upd); td.innerHTML = cellHtml(c, row[c.n]); td.classList.remove('saving'); td.classList.add('flash-ok'); setTimeout(() => td.classList.remove('flash-ok'), 800); toast('Tersimpan ✓'); }
  catch (err) { td.classList.remove('saving'); td.innerHTML = cellHtml(c, row[c.n]); td.classList.add('flash-err'); setTimeout(() => td.classList.remove('flash-err'), 800); toast(err.message, true); }
}

// ---------- Dialog ----------
function dialog(html) { $('dlg-card').innerHTML = html; $('dlg').classList.remove('hidden'); }
function closeDlg() { $('dlg').classList.add('hidden'); }
$('dlg').addEventListener('click', (e) => { if (e.target === $('dlg')) closeDlg(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDlg(); });

function openJson(row) {
  const def = cur(), body = {}; def.cols.filter(editable).forEach(c => { body[c.n] = row[c.n]; });
  dialog(`<h3>✎ EDIT BARIS · ${esc(st.tab)}</h3><p style="color:var(--muted);margin-bottom:8px;font-size:12px">Kunci: ${def.pk.map(k => `<code>${esc(k)}=${esc(row[k])}</code>`).join(' ')}</p>
    <textarea id="js" class="edit-json" spellcheck="false">${esc(JSON.stringify(body, null, 2))}</textarea><div id="e"></div>
    <div class="dlg-actions"><button class="btn" id="x">Batal</button><button class="btn primary" id="ok">Simpan</button></div>`);
  $('x').onclick = closeDlg;
  $('ok').onclick = async () => { try { const patch = JSON.parse($('js').value); const allowed = {}; def.cols.filter(editable).forEach(c => { if (c.n in patch) allowed[c.n] = patch[c.n]; });
    const upd = await dbUpdate(row, allowed); Object.assign(row, upd); closeDlg(); drawBody(); toast('Baris tersimpan ✓'); } catch (err) { $('e').innerHTML = `<div class="err">${esc(err.message)}</div>`; } };
}
function openDelete(row) {
  const def = cur();
  dialog(`<h3>🗑 HAPUS BARIS</h3><p>Hapus baris di <b>${esc(st.tab)}</b> dengan ${def.pk.map(k => `<code>${esc(k)}=${esc(row[k])}</code>`).join(' ')}?</p>
    <p style="color:#ffc1d0;margin-top:8px;font-size:12px">Tindakan ini permanen${st.tab === 'profiles' ? ' dan ikut menghapus inventory & riwayat run pemain ini (cascade)' : ''}${st.tab === 'admins' ? '. Hati-hati: jangan hapus email admin kamu sendiri' : ''}.</p><div id="e"></div>
    <div class="dlg-actions"><button class="btn" id="x">Batal</button><button class="btn danger" id="ok">Ya, hapus</button></div>`);
  $('x').onclick = closeDlg;
  $('ok').onclick = async () => { const { data, error } = await match(supabase.from(st.tab).delete(), def, row).select();
    if (error || !data?.length) { $('e').innerHTML = `<div class="err">${esc(error?.message || 'Tidak ada baris yang terhapus.')}</div>`; return; } closeDlg(); toast('Baris dihapus'); loadRows(); };
}
function openAdd() {
  const def = cur(), cols = def.cols.filter(c => !c.ro);
  const input = (c) => c.t === 'bool' ? `<select name="${c.n}"><option value="">(default)</option><option value="true">true</option><option value="false">false</option></select>`
    : c.t === 'enum' ? `<select name="${c.n}"><option value="">(default)</option>${c.opts.map(o => `<option>${esc(o)}</option>`).join('')}</select>`
    : `<input name="${c.n}" type="${c.t === 'int' ? 'number' : 'text'}" autocomplete="off">`;
  dialog(`<h3>＋ TAMBAH BARIS · ${esc(st.tab)}</h3><form id="f">${cols.map(c => `<div class="field"><label>${c.n} <i>${c.t}${c.pk ? ' · kunci' : ''}</i></label>${input(c)}</div>`).join('')}</form>
    <p style="color:var(--muted);font-size:12px">Kolom yang dikosongkan memakai nilai default database.${st.tab === 'profiles' ? ' Untuk profiles, <code>id</code> harus sama dengan user di Authentication.' : ''}</p><div id="e"></div>
    <div class="dlg-actions"><button class="btn" id="x">Batal</button><button class="btn primary" id="ok">Tambah</button></div>`);
  $('x').onclick = closeDlg;
  $('ok').onclick = async () => { try { const fd = new FormData($('f')), obj = {};
      cols.forEach(c => { const raw = fd.get(c.n); if (raw === '' || raw === null) return; obj[c.n] = c.t === 'bool' ? raw === 'true' : c.t === 'int' ? coerce(c, raw) : raw; });
      if (st.tab === 'admins' && obj.email) obj.email = obj.email.toLowerCase();
      const { error } = await supabase.from(st.tab).insert(obj); if (error) throw new Error(error.message);
      closeDlg(); toast('Baris ditambahkan ✓'); loadRows(); } catch (err) { $('e').innerHTML = `<div class="err">${esc(err.message)}</div>`; } };
  $('f').querySelector('input,select')?.focus();
}

// ---------- Export CSV ----------
async function exportCsv() {
  const def = cur(), all = []; $('csv').disabled = true;
  try {
    for (let from = 0; from < 20000; from += 1000) {
      const { data, error } = await supabase.from(st.tab).select('*').order(def.order, { ascending: false }).range(from, from + 999);
      if (error) throw new Error(error.message); all.push(...data); if (data.length < 1000) break;
    }
    const q = (v) => v === null || v === undefined ? '' : `"${String(v).replace(/"/g, '""')}"`;
    const csv = [def.cols.map(c => c.n).join(','), ...all.map(r => def.cols.map(c => q(r[c.n])).join(','))].join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `${st.tab}.csv` });
    a.click(); URL.revokeObjectURL(a.href); toast(`${all.length} baris diekspor`);
  } catch (err) { toast(err.message, true); } finally { $('csv').disabled = false; }
}

boot();
