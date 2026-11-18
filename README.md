# Cyber Flappy PRO — Online Edition

Game HTML5 canvas + Supabase Auth (Google), PostgreSQL, RCoin shop, cosmetics, and leaderboard.

## Struktur
- `index.html`: game entry point + online overlay
- `js/game.js`: original game engine plus 24 bird skins and bridge
- `js/cosmetics.js`: bentuk skin (UFO, jet, kapal, mobil terbang, dll), efek ekor & klik bertema, tema latar, suara, preview toko, dan efek glitch skin FATAL ERROR
- `js/online.js`: Supabase auth, shop (dengan preview animasi), leaderboard, RCoin transactions
- `css/online.css`: online UI
- `config.json`: gameplay/runtime settings
- `catalog.json`: cosmetic catalog (25 skins, 7 themes, tap/tail/sound FX)
- `supabase-config.json`: public Supabase URL + publishable/anon key (template)
- `supabase/schema.sql`: database schema, RLS, profile trigger, secure RPC
- `supabase/catalog_seed.sql`: catalog seed
- `supabase/admin.sql`: tabel `admins`, fungsi `is_admin()`, dan policy RLS untuk admin
- `admin.html`, `js/admin.js`, `css/admin.css`: halaman Admin Panel

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


## Admin Panel
Menu **🛡 Admin** di bar atas hanya muncul jika email akun yang login terdaftar di tabel `public.admins`. Halaman `admin.html` bisa melihat, mengedit (klik sel langsung atau tombol ✎ untuk JSON), menambah, menghapus, mencari, mengurutkan, dan mengekspor CSV untuk tabel `profiles`, `catalog`, `inventory`, `game_runs`, dan `admins`.

### Setup admin
1. Buka `supabase/admin.sql`, ganti `GANTI_DENGAN_EMAIL_ADMIN@gmail.com` dengan email Google admin (huruf kecil).
2. Jalankan seluruh isinya di **SQL Editor** (setelah `schema.sql` dan `catalog_seed.sql`). Aman diulang.
3. Login ke game dengan akun tersebut; tombol Admin muncul. Untuk menambah admin lain, tambahkan email di tab **Admins** atau lewat SQL.

### Keamanan
- Yang melindungi data adalah RLS di database (`is_admin()`), bukan tombol di frontend. Orang yang membuka `admin.html` tanpa akses admin hanya melihat "Akses ditolak" dan tidak bisa membaca/mengubah apa pun.
- Biarkan provider Email/Password di Supabase nonaktif (atau wajib konfirmasi email) agar email admin tidak bisa didaftarkan orang lain.
- Harga, nama, dan status aktif item di tab **Catalog** langsung dipakai Shop (game membaca katalog dari database; `catalog.json` hanya untuk warna skin).


## Kosmetik v3
- **Bentuk beragam:** tiap skin kini punya bentuk sendiri (burung, UFO, katak, jet, hantu, roket, drone, bintang, pesawat luar angkasa, kristal, mecha, mobil terbang, kapal selam, jet tempur, kapal layar, balon udara, stealth, paus kosmik, naga, malaikat, kubus pixel, orb). Pemetaan skin → bentuk ada di `CF.SKIN_SHAPE` (`js/cosmetics.js`).
- **Ekor & klik bertema:** jika item Tail/Tap yang dipakai adalah *Default*, efeknya otomatis mengikuti skin (roket → api, kapal → riak air, mobil → asap, malaikat → bulu, dst). Item Tail/Tap yang dibeli menimpa efek bawaan.
- **Tema latar nyata:** Synthwave, Matrix, Solar, Deep Ocean, Cosmic Drift, Thunder Grid punya elemen latar sendiri (bukan hanya ganti warna).
- **Preview toko:** semua kartu menampilkan animasi langsung; ketuk kartu untuk mencoba (efek klik, suara, semburan ekor).
- **FATAL ERROR (skin_25, rarity Corrupted, 9.999 RCoin):** burung "bug" yang berkedip warna/transparan/hitam dengan teks kode error. Saat kalah: retakan layar, RGB split, noise, kedip negatif, dan layar "FATAL EXCEPTION" (ketuk untuk melewati). Saat pindah stage: kedip negatif, latar berkedip, kode error muncrat, retakan, getaran ringan.

### Update database yang sudah berjalan
Jalankan ulang `supabase/catalog_seed.sql` di SQL Editor (aman diulang) agar skin_25 dan item baru masuk ke tabel `catalog`.


## Pengaturan performa & audio (V4)
- Tombol **Setting** membuka menu grafik dan audio.
- Preset Low/Medium/High/Ultra mengatur kualitas render, pixel ratio, latar, partikel, shader, dan efek glitch.
- Custom menyediakan resolusi render, batas pixel ratio, toggle efek, SFX, musik sintetis, dan ambience prosedural (rain/storm/wind).
- Pengaturan disimpan di localStorage perangkat masing-masing.
- Untuk ponsel yang patah-patah, mulai dari **Low** atau **Medium**. Ultra membutuhkan perangkat/GPU yang lebih kuat.
