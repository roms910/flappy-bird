# Cyber Flappy PRO — Online Edition

Game HTML5 canvas + Supabase Auth (Google), PostgreSQL, RCoin shop, cosmetics, and leaderboard.

## Struktur
- `index.html`: game entry point + online overlay
- `js/game.js`: original game engine plus 24 bird skins and bridge
- `js/online.js`: Supabase auth, shop, leaderboard, RCoin transactions
- `css/online.css`: online UI
- `config.json`: gameplay/runtime settings
- `catalog.json`: cosmetic catalog (24 skins, themes, tap/tail/sound FX)
- `supabase-config.json`: public Supabase URL + publishable/anon key (template)
- `supabase/schema.sql`: database schema, RLS, profile trigger, secure RPC
- `supabase/catalog_seed.sql`: catalog seed

## Setup satu per satu

### 1. Buat proyek Supabase
1. Buka https://supabase.com/dashboard dan buat project baru.
2. Simpan database password dengan aman.
3. Setelah project siap, buka **Project Settings → API**.
4. Salin Project URL dan **publishable key** (atau legacy anon key). Jangan pernah menaruh `service_role` key di frontend.
5. Isi `supabase-config.json`:
   - `url`: Project URL.
   - `anonKey`: publishable/anon key.
   - `redirectUrl`: URL lokal/produksi tempat game dihosting.

### 2. Buat database
1. Buka **SQL Editor → New query**.
2. Salin seluruh isi `supabase/schema.sql`, lalu klik Run.
3. Buat query baru, salin `supabase/catalog_seed.sql`, lalu klik Run.
4. Pastikan tabel `profiles`, `catalog`, `inventory`, `game_runs` dan view `leaderboard` muncul di Table Editor.

### 3. Aktifkan Google Login
1. Buka Google Cloud Console: https://console.cloud.google.com/.
2. Buat project atau pilih project yang sudah ada.
3. Buka **Google Auth Platform** dan lengkapi Branding / Audience / Data Access bila diminta.
4. Buat OAuth Client ID bertipe **Web application**.
5. Tambahkan Authorized JavaScript origins untuk domain game, misalnya `http://localhost:8080` dan `https://domain-kamu.vercel.app`.
6. Pada Authorized redirect URIs, masukkan callback URL yang ditampilkan Supabase di **Authentication → Providers → Google**. Bentuknya `https://PROJECT_REF.supabase.co/auth/v1/callback`.
7. Salin Client ID dan Client Secret ke halaman provider Google di Supabase. Simpan.
8. Di Supabase **Authentication → URL Configuration**, set Site URL ke domain produksi dan tambahkan Redirect URLs untuk `http://localhost:8080/**` serta domain produksi yang dipakai.

### 4. Jalankan lokal
```bash
python -m http.server 8080
```
Buka `http://localhost:8080`. Jangan memakai `file://`, karena config dan modul memakai fetch/import.

### 5. Deploy ke Vercel
1. Upload project ke GitHub tanpa `.env` rahasia atau service-role key.
2. Import repository ke Vercel sebagai static site.
3. Tidak perlu build command; output directory `.`.
4. Tambahkan URL Vercel ke Google OAuth origins dan Supabase Redirect URLs.
5. Pastikan `supabase-config.json` berisi URL + publishable/anon key.

## Keamanan dan batasan penting
- Publishable/anon key memang boleh berada di frontend; keamanan database bergantung pada RLS dan grants.
- Jangan pernah memasukkan Supabase `service_role` key ke HTML, JS, GitHub, atau Vercel client bundle.
- Pembelian memanggil `purchase_item()` di database. Browser tidak mengirim harga atau mengurangi saldo sendiri.
- RCoin diberikan melalui `submit_run()` di database, bukan dari localStorage.
- Leaderboard saat ini menggunakan skor yang dikirim client. Validasi batas dan rate limit sudah ada, tetapi browser game dapat dimodifikasi. Jadi leaderboard ini cocok untuk permainan kasual, belum anti-cheat kompetitif. Untuk kompetisi berhadiah, perlu server-side game session/verifikasi replay atau engine authoritative.
- Harga katalog disimpan di database. Jika ingin mengubah harga, ubah `catalog_seed.sql` lalu jalankan ulang query seed.
- Avatar/nama berasal dari metadata Google. Jangan meminta password Google di aplikasi.

## Catatan implementasi kosmetik
24 skin burung terintegrasi ke renderer. Tema, tap, tail, dan sound sudah memiliki katalog, inventory, dan equip state. Tap FX memiliki efek visual. Tema lanjutan dan efek tail/sound khusus masih berupa pilihan kosmetik tersimpan; pengaitan penuh ke seluruh renderer/audio gameplay dapat dikembangkan pada iterasi berikutnya.
