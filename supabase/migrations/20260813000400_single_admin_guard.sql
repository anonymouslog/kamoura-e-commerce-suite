-- =============================================================================
-- Kamoura single-admin guard migration
--
-- Safe additive constraint for an existing database. This enforces the design
-- assumption that only one user should hold the admin role at a time.
-- =============================================================================

do $$
begin
  if exists (
    select 1
    from public.user_roles
    where role = 'admin'
    group by role
    having count(*) > 1
  ) then
    raise exception
      'Multiple admin roles already exist. Resolve the duplicates before applying the single-admin guard.';
  end if;
end
$$;

create unique index if not exists user_roles_single_admin_idx
  on public.user_roles ((role))
  where role = 'admin';
