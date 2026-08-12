create extension if not exists "pgcrypto";

do $$ begin create type public.app_role as enum ('admin','staff','customer'); exception when duplicate_object then null; end $$;
do $$ begin create type public.product_status as enum ('draft','active','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type public.order_status as enum ('placed','confirmed','paid','fulfilled','shipped','delivered','cancelled'); exception when duplicate_object then null; end $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create table if not exists public.profiles (
  id uuid primary key,
  full_name text,
  phone text,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles read own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "roles read own" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "roles admins manage" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  blurb text,
  sort_order int not null default 0
);
grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories public read" on public.categories for select to anon, authenticated using (true);
create policy "categories admins write" on public.categories for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  details text[] not null default '{}',
  price numeric(12,2) not null check (price >= 0),
  category_slug text not null references public.categories(slug) on update cascade,
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  stock int not null default 0 check (stock >= 0),
  image_key text,
  image_url text,
  status public.product_status not null default 'active',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products public read active" on public.products for select to anon, authenticated using (status = 'active');
create policy "products admins all" on public.products for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create index if not exists products_category_idx on public.products(category_slug);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  label text,
  recipient_name text not null,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text,
  country text not null default 'Nigeria',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.addresses to authenticated;
grant all on public.addresses to service_role;
alter table public.addresses enable row level security;
create policy "addresses own" on public.addresses for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_slug text not null references public.products(slug) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_slug)
);
grant select, insert, delete on public.wishlist_items to authenticated;
grant all on public.wishlist_items to service_role;
alter table public.wishlist_items enable row level security;
create policy "wishlist own" on public.wishlist_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid,
  status public.order_status not null default 'placed',
  contact_name text not null,
  contact_phone text not null,
  contact_email text not null,
  shipping_address jsonb not null,
  shipping_method text not null,
  subtotal numeric(12,2) not null,
  shipping_cost numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  customer_note text,
  notified_channel text check (notified_channel in ('whatsapp','email')),
  notified_at timestamptz,
  tracking_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert on public.orders to authenticated;
grant insert on public.orders to anon;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders read own" on public.orders for select to authenticated using (user_id = auth.uid());
create policy "orders create own" on public.orders for insert to authenticated with check (user_id = auth.uid() or user_id is null);
create policy "orders create guest" on public.orders for insert to anon with check (user_id is null);
create policy "orders admins all" on public.orders for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();
create index if not exists orders_user_idx on public.orders(user_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_slug text,
  product_name text not null,
  variant_label text not null,
  quantity int not null check (quantity > 0),
  unit_price_at_purchase numeric(12,2) not null,
  image_url text
);
grant select, insert on public.order_items to authenticated;
grant insert on public.order_items to anon;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "order items read own" on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "order items create own" on public.order_items for insert to authenticated with check (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or o.user_id is null))
);
create policy "order items create guest" on public.order_items for insert to anon with check (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id is null)
);
create policy "order items admins all" on public.order_items for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create index if not exists order_items_order_idx on public.order_items(order_id);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text,
  created_at timestamptz not null default now()
);
grant select on public.order_events to authenticated;
grant all on public.order_events to service_role;
alter table public.order_events enable row level security;
create policy "order events read own" on public.order_events for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "order events admins all" on public.order_events for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table if not exists public.newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
grant insert on public.newsletter_signups to anon, authenticated;
grant all on public.newsletter_signups to service_role;
alter table public.newsletter_signups enable row level security;
create policy "newsletter anyone signs up" on public.newsletter_signups for insert to anon, authenticated with check (true);
create policy "newsletter admins read" on public.newsletter_signups for select to authenticated using (public.has_role(auth.uid(),'admin'));

insert into public.categories (slug, name, blurb, sort_order) values
  ('outerwear','Outerwear','Coats cut long and unhurried.',1),
  ('knitwear','Knitwear','Cashmere and merino, nothing louder.',2),
  ('shirting','Shirting','Silk and poplin, softly structured.',3),
  ('trousers','Trousers','Wool tailoring with a clean break.',4)
on conflict (slug) do nothing;

insert into public.products (slug,name,description,details,price,category_slug,sizes,colors,stock,image_key,is_featured) values
  ('atlas-wool-overcoat','Atlas Wool Overcoat','A single-breasted overcoat in double-faced Italian wool, cut a little longer than the body asks for. Unlined shoulders keep the drape quiet.',array['92% virgin wool, 8% cashmere','Horn buttons','Made in Portugal'],389000,'outerwear',array['XS','S','M','L','XL'],array['Black','Charcoal'],6,'p4',true),
  ('lune-silk-shirt','Lune Silk Shirt','Sand-washed silk with a relaxed collar and a slightly dropped shoulder. It creases; that is the point.',array['100% mulberry silk','Mother-of-pearl buttons','Cold hand wash'],148000,'shirting',array['XS','S','M','L'],array['Ivory','Bone'],11,'p1',true),
  ('meridian-cashmere-knit','Meridian Cashmere Knit','Grade-A Mongolian cashmere knitted at a mid gauge, with a rib collar that holds its shape through the season.',array['100% cashmere','Mid-gauge knit','Made in Scotland'],212000,'knitwear',array['S','M','L','XL'],array['Camel','Fog'],9,'p3',true),
  ('solstice-wool-trouser','Solstice Wool Trouser','A high-rise trouser in tropical wool with a single forward pleat and a full break at the ankle.',array['Tropical wool','Hook-and-bar closure','Unfinished hem on request'],164000,'trousers',array['28','30','32','34','36'],array['Charcoal','Black'],14,'p2',true),
  ('harbour-poplin-shirt','Harbour Poplin Shirt','Compact cotton poplin, cut boxy through the body. The everyday shirt in the house rotation.',array['Egyptian cotton poplin','Single-needle side seams'],96000,'shirting',array['XS','S','M','L','XL'],array['Ivory'],22,'p1',false),
  ('nocturne-tailored-trouser','Nocturne Tailored Trouser','A narrower cousin to the Solstice, in a matte wool that reads almost black under most light.',array['Super 110s wool','Flat front','Made in Italy'],178000,'trousers',array['30','32','34','36'],array['Black'],7,'p2',false),
  ('vesper-merino-crew','Vesper Merino Crew','Fine merino with a close crew neck — the layer that disappears under a coat.',array['Extra-fine merino','Fully fashioned sleeves'],118000,'knitwear',array['S','M','L'],array['Camel','Black'],0,'p3',false),
  ('eclipse-belted-coat','Eclipse Belted Coat','A wrap coat with a self belt and no visible closure, in a brushed wool that softens with wear.',array['Brushed wool blend','Self belt','Made in Portugal'],425000,'outerwear',array['XS','S','M','L'],array['Ivory','Black'],4,'p4',false)
on conflict (slug) do nothing;