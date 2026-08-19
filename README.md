# Kamoura E-Commerce Suite

Kamoura is a quiet-luxury clothing storefront built with TanStack Start, Supabase, and Vite.

## Current status

- Public catalog, product pages, account area, and admin shell are in place.
- The app uses Supabase for authentication, account data, catalog management, orders, CMS settings, and product image storage when the documented environment values are configured.
- The order flow currently uses WhatsApp/email handoff instead of card payments.
- The repo now includes privacy, terms, shipping/returns, sitemap, robots, and manifest files.

## Should you connect Supabase now?

Yes, if you want to validate the store against real auth, admin roles, and the production schema.

Use a new Supabase project if possible. That gives you the cleanest migration path and avoids legacy table or policy drift.

Wait only if you are still changing the SQL structure manually. In that case, finish the database review first, then connect once.

## What’s in the repo

- Public storefront pages for the catalog, product detail pages, checkout, and contact
- Customer account pages for orders, addresses, wishlist, and settings
- Admin routes for products and orders
- Supabase schema and migrations
- SEO and crawl files: `robots.txt`, `sitemap.xml`, `site.webmanifest`
- Legal pages: privacy policy, terms of service, and shipping/returns
- Guest cart state kept locally until server-side cart sync is added

## Local setup

1. Copy `.env.example` to `.env`.
2. Fill in your Supabase values and order destination values.
3. Run `npm install`.
4. Run `npm run dev`.

## Environment variables

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_ORDER_WHATSAPP_NUMBER`
- `VITE_ORDER_EMAIL`

## Supabase setup

See [`supabase/README.md`](./supabase/README.md) for the exact now/later runbook.

## Verification

- `npm run build`
- `npm run lint`

## Deployment

Recommended launch order:

1. Connect Supabase and apply the baseline schema.
2. Set production env vars in Vercel.
3. Confirm robots, sitemap, and legal pages are accessible.
4. Verify admin access with a real admin account.
5. Push a test order through the WhatsApp/email flow.

This app is ready for Vercel once the environment variables and Supabase project are configured.
