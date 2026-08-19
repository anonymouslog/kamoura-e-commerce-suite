# Kamoura Supabase Setup

This folder contains the database schema and incremental migrations for Kamoura.

## Recommendation

Connect Supabase now if you are ready to test the store with real auth, role checks, and database writes.

Wait only if you still plan to redesign the table structure before launch.

## Now path

1. Create a new Supabase project.
2. Copy the project URL and keys into your local `.env`.
3. Add the same values to Vercel later for production.
4. Run `supabase/schema.sql` in the Supabase SQL editor.
5. Confirm the seed categories and starter products exist.
6. Log in once and create or assign an admin role in `public.user_roles`.
7. Apply each migration in `supabase/migrations/` in timestamp order if the baseline schema was already run before these files were added.
8. Verify `/admin`, `/account`, catalog pages, image upload, and order placement.

## Later path

1. Keep development running against local fallback data.
2. Finish schema changes and review the migration files.
3. Create the Supabase project when you are ready to freeze the database shape.
4. Apply `supabase/schema.sql`.
5. Switch the environment variables in one pass.

## Migration rule

- `supabase/schema.sql` is the clean baseline for a fresh project.
- `supabase/migrations/` is for future changes, backfills, and compatibility updates.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## Existing project migration order

Because this project has already had `schema.sql` applied, run these additive
migrations once in the Supabase SQL editor, in this order:

1. `20260813000200_security_hardening.sql`
2. `20260813000300_private_role_helper.sql`
3. `20260813000400_single_admin_guard.sql`
4. `20260813000500_site_copy_cms.sql`
5. `20260813000600_product_image_storage.sql`

The final migration creates the `product-images` Storage bucket. It allows the
public store to display product images but permits upload and deletion only for
the admin role. The app removes an uploaded storage object before removing its
product record, and removes an old object after an image replacement.

## Operational notes

- The public catalog is readable without auth.
- Admin writes are protected by the `user_roles` table and RLS.
- Orders, order items, and addresses are scoped to the signed-in user or admin role.
- If you need to reset a broken database, create a new Supabase project instead of turning the schema file into a destructive reset.
