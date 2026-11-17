-- Cyber Flappy PRO Online Edition — Supabase SQL Editor
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null default 'Player', avatar_url text,
 rcoin bigint not null default 100 check (rcoin >= 0),
 best_score integer not null default 0 check (best_score >= 0), total_runs bigint not null default 0,
 equipped_skin text not null default 'skin_1', equipped_theme text not null default 'theme_neon',
 equipped_tap text not null default 'tap_default', equipped_tail text not null default 'tail_default', equipped_sound text not null default 'sound_arcade',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.catalog (
 id text primary key, name text not null, item_type text not null check(item_type in ('skin','theme','tap','tail','sound')),
 rarity text not null, price integer not null check(price >= 0), free boolean not null default false, active boolean not null default true
);
create table if not exists public.inventory (
 user_id uuid not null references public.profiles(id) on delete cascade,
 item_id text not null references public.catalog(id), purchased_at timestamptz not null default now(),
 primary key(user_id,item_id)
);
create table if not exists public.game_runs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 score integer not null check(score between 0 and 10000), mode text not null check(mode in ('campaign','endless')),
 coins_earned integer not null default 0, created_at timestamptz not null default now()
);
create index if not exists game_runs_user_created_idx on public.game_runs(user_id,created_at desc);
create or replace view public.leaderboard as
 select id as user_id, username, avatar_url, best_score, total_runs from public.profiles;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,username,avatar_url) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name','Player'),new.raw_user_meta_data->>'avatar_url') on conflict(id) do nothing;
 insert into public.inventory(user_id,item_id) values(new.id,'skin_1'),(new.id,'skin_2'),(new.id,'theme_neon'),(new.id,'tap_default'),(new.id,'tail_default'),(new.id,'sound_arcade') on conflict do nothing;
 return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- All catalog prices are seeded by catalog_seed.sql. Never accept price or balance from browser.
create or replace function public.purchase_item(p_item_id text) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); item public.catalog%rowtype; balance bigint;
begin
 if uid is null then raise exception 'Login required'; end if;
 select * into item from public.catalog where id=p_item_id and active=true for update;
 if not found then raise exception 'Item tidak tersedia'; end if;
 if exists(select 1 from public.inventory where user_id=uid and item_id=p_item_id) then raise exception 'Item sudah dimiliki'; end if;
 update public.profiles set rcoin=rcoin-item.price,updated_at=now() where id=uid and rcoin>=item.price returning rcoin into balance;
 if not found then raise exception 'RCoin tidak cukup'; end if;
 insert into public.inventory(user_id,item_id) values(uid,p_item_id);
 return jsonb_build_object('success',true,'balance',balance,'item_id',p_item_id);
end; $$;

-- Basic anti-spam guardrails. This is a casual client-submitted score, not a cheat-proof esports verifier.
create or replace function public.equip_item(p_item_id text) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); item public.catalog%rowtype; column_name text;
begin
 if uid is null then raise exception 'Login required'; end if;
 select * into item from public.catalog where id=p_item_id and active=true;
 if not found then raise exception 'Item tidak tersedia'; end if;
 if not exists(select 1 from public.inventory where user_id=uid and item_id=p_item_id) then raise exception 'Item belum dimiliki'; end if;
 column_name:=case item.item_type when 'skin' then 'equipped_skin' when 'theme' then 'equipped_theme' when 'tap' then 'equipped_tap' when 'tail' then 'equipped_tail' when 'sound' then 'equipped_sound' else null end;
 if column_name is null then raise exception 'Jenis item tidak valid'; end if;
 execute format('update public.profiles set %I=$1,updated_at=now() where id=$2',column_name) using p_item_id,uid;
 return jsonb_build_object('success',true,'item_id',p_item_id);
end; $$;

create or replace function public.submit_run(p_score integer,p_mode text,p_duration_seconds integer default 0) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); earned integer; balance bigint; recent_count integer;
begin
 if uid is null then raise exception 'Login required'; end if;
 if p_score is null or p_score<0 or p_score>10000 then raise exception 'Invalid score'; end if;
 if p_mode not in ('campaign','endless') then raise exception 'Invalid mode'; end if;
 select count(*) into recent_count from public.game_runs where user_id=uid and created_at>now()-interval '1 minute';
 if recent_count>=8 then raise exception 'Terlalu banyak run, coba lagi sebentar'; end if;
 earned:=least(200,greatest(0,p_score*2));
 insert into public.game_runs(user_id,score,mode,coins_earned) values(uid,p_score,p_mode,earned);
 update public.profiles set best_score=greatest(best_score,p_score),total_runs=total_runs+1,rcoin=rcoin+earned,updated_at=now() where id=uid returning rcoin into balance;
 return jsonb_build_object('success',true,'coins_earned',earned,'balance',balance);
end; $$;

alter table public.profiles enable row level security;
alter table public.catalog enable row level security;
alter table public.inventory enable row level security;
alter table public.game_runs enable row level security;
drop policy if exists "profiles readable" on public.profiles;
drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles for select using(auth.uid()=id);
-- No direct profile updates from browser: cosmetic equip is checked by equip_item().
revoke update on public.profiles from anon,authenticated;
drop policy if exists "catalog public read" on public.catalog;
create policy "catalog public read" on public.catalog for select using(active=true);
drop policy if exists "inventory own read" on public.inventory;
create policy "inventory own read" on public.inventory for select using(auth.uid()=user_id);
drop policy if exists "runs own read" on public.game_runs;
create policy "runs own read" on public.game_runs for select using(auth.uid()=user_id);
grant select on public.leaderboard to anon,authenticated;
grant select on public.catalog to anon,authenticated;
grant select on public.profiles to authenticated;
grant select on public.inventory,public.game_runs to authenticated;
revoke all on function public.purchase_item(text) from public;
grant execute on function public.purchase_item(text) to authenticated;
revoke all on function public.equip_item(text) from public;
grant execute on function public.equip_item(text) to authenticated;
revoke all on function public.submit_run(integer,text,integer) from public;
grant execute on function public.submit_run(integer,text,integer) to authenticated;
