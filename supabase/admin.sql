-- Cyber Flappy PRO — Admin Panel (jalankan SETELAH schema.sql & catalog_seed.sql)
-- Aman dijalankan berulang kali (idempotent).
--
-- Cara kerja keamanan:
--   * Siapa admin ditentukan di DATABASE (tabel public.admins, berdasarkan email akun login).
--   * Tombol/halaman admin di frontend hanya tampilan. Yang benar-benar melindungi data
--     adalah RLS di bawah: hanya user yang lolos is_admin() boleh baca/ubah/hapus semua baris.
--   * Pemain biasa tetap memakai aturan lama (hanya baca data miliknya, ubah lewat RPC).

create table if not exists public.admins (
  email text primary key check (email = lower(email)),
  note text,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

-- ⚠️ GANTI dengan email Google admin kamu (huruf kecil), lalu jalankan.
insert into public.admins(email, note)
values (lower('GANTI_DENGAN_EMAIL_ADMIN@gmail.com'), 'owner')
on conflict (email) do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Hak akses tabel (tetap dibatasi RLS: non-admin tidak punya policy tulis sama sekali)
grant select, insert, update, delete
  on public.profiles, public.catalog, public.inventory, public.game_runs, public.admins
  to authenticated;

-- Policy admin: boleh semua operasi pada semua baris
drop policy if exists "admin all profiles" on public.profiles;
create policy "admin all profiles" on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin all catalog" on public.catalog;
create policy "admin all catalog" on public.catalog for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin all inventory" on public.inventory;
create policy "admin all inventory" on public.inventory for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin all game_runs" on public.game_runs;
create policy "admin all game_runs" on public.game_runs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin all admins" on public.admins;
create policy "admin all admins" on public.admins for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Catatan penting:
--  * Email pada JWT berasal dari Google (sudah terverifikasi). Biarkan provider "Email/Password"
--    di Supabase NONAKTIF (atau wajib konfirmasi email), supaya orang lain tidak bisa
--    mendaftar memakai email admin.
--  * Untuk mencabut akses admin: delete from public.admins where email = '...';
