-- Cosmetic upgrade: run once in Supabase SQL Editor after the original schema.
-- Adds the premium corrupted-form skin and makes it visible in the shop.
insert into public.catalog(id,name,item_type,rarity,price,free,active)
values ('skin_glitch_omega','NULL//CORRUPTION','skin','Glitched',99999,false,true)
on conflict(id) do update set
  name=excluded.name, item_type=excluded.item_type, rarity=excluded.rarity,
  price=excluded.price, free=excluded.free, active=true;
