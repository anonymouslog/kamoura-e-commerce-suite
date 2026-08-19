-- =============================================================================
-- Kamoura CMS site copy migration
--
-- Adds a real database-backed content store for the public homepage and the
-- admin content studio. Public reads are allowed; only the admin role can edit.
-- =============================================================================

create table if not exists public.site_copy (
  id smallint primary key default 1,
  hero_title text not null default 'Clothes that keep quiet company.',
  hero_subtitle text not null default 'Twelve pieces, cut in wool, silk and cashmere. Made in small runs so nothing arrives twice.',
  featured_title text not null default 'The considered four',
  newsletter_title text not null default 'Hear first when a run is cut',
  newsletter_text text not null default 'One letter a season. No offers, no countdowns - just what has been made.',
  about_blurb text not null default 'A small clothing label working in wool, silk and cashmere. Made in limited runs, shipped from Lagos.',
  support_email text not null default 'kamoura595@gmail.com',
  support_phone text not null default '08143359771',
  instagram_url text,
  tiktok_url text,
  updated_at timestamptz not null default now()
);

alter table public.site_copy enable row level security;

do $$ begin
  drop policy if exists "site_copy: public read" on public.site_copy;
  create policy "site_copy: public read" on public.site_copy
    for select to anon, authenticated
    using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  drop policy if exists "site_copy: admins write" on public.site_copy;
  create policy "site_copy: admins write" on public.site_copy
    for all to authenticated
    using (app_private.has_role(auth.uid(), 'admin'))
    with check (app_private.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

insert into public.site_copy (id)
values (1)
on conflict (id) do nothing;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_copy_touch_updated_at on public.site_copy;

create trigger site_copy_touch_updated_at
before update on public.site_copy
for each row execute function public.touch_updated_at();
