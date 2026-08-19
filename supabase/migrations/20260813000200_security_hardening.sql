-- =============================================================================
-- Kamoura security hardening migration
--
-- Safe to run on an existing database that already has the baseline schema.
-- This does not drop tables or remove data.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

revoke all on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

drop policy if exists "newsletter: anyone signs up" on public.newsletter_signups;
drop policy if exists "newsletter: admins read" on public.newsletter_signups;

create policy "newsletter: anyone signs up" on public.newsletter_signups
  for insert to anon, authenticated
  with check (
    email = lower(trim(email))
    and email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    and char_length(email) between 5 and 160
  );

create policy "newsletter: admins read" on public.newsletter_signups
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
