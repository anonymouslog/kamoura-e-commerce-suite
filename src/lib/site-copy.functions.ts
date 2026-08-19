import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "./admin.functions";
import { publicServerClient } from "@/lib/supabase-public.server";

export type CmsSiteCopy = {
  heroTitle: string;
  heroSubtitle: string;
  featuredTitle: string;
  newsletterTitle: string;
  newsletterText: string;
  aboutBlurb: string;
  supportEmail: string;
  supportPhone: string;
  instagramUrl: string;
  tiktokUrl: string;
};

export const defaultSiteCopy: CmsSiteCopy = {
  heroTitle: "Clothes that keep quiet company.",
  heroSubtitle:
    "Twelve pieces, cut in wool, silk and cashmere. Made in small runs so nothing arrives twice.",
  featuredTitle: "The considered four",
  newsletterTitle: "Hear first when a run is cut",
  newsletterText: "One letter a season. No offers, no countdowns — just what has been made.",
  aboutBlurb:
    "A small clothing label working in wool, silk and cashmere. Made in limited runs, shipped from Lagos.",
  supportEmail: "kamoura595@gmail.com",
  supportPhone: "08143359771",
  instagramUrl: "https://www.instagram.com/kam_oura99",
  tiktokUrl: "https://www.tiktok.com/@_kam_oura",
};

const siteCopyInput = z.object({
  heroTitle: z.string().trim().min(3).max(160),
  heroSubtitle: z.string().trim().min(10).max(240),
  featuredTitle: z.string().trim().min(2).max(120),
  newsletterTitle: z.string().trim().min(2).max(120),
  newsletterText: z.string().trim().min(10).max(240),
  aboutBlurb: z.string().trim().min(10).max(240),
  supportEmail: z.string().trim().email().max(160),
  supportPhone: z.string().trim().min(7).max(40),
  instagramUrl: z.string().trim().url().max(300).optional().or(z.literal("")),
  tiktokUrl: z.string().trim().url().max(300).optional().or(z.literal("")),
});

export const getSiteCopy = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicServerClient() as any;
  const { data, error } = await supabase.from("site_copy").select("*").eq("id", 1).maybeSingle();
  if (error || !data) return defaultSiteCopy;
  return mapCopy(data);
});

export const updateSiteCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => siteCopyInput.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const supabase = context.supabase as any;
    const { error } = await supabase.from("site_copy").upsert(
      {
        id: 1,
        hero_title: data.heroTitle,
        hero_subtitle: data.heroSubtitle,
        featured_title: data.featuredTitle,
        newsletter_title: data.newsletterTitle,
        newsletter_text: data.newsletterText,
        about_blurb: data.aboutBlurb,
        support_email: data.supportEmail,
        support_phone: data.supportPhone,
        instagram_url: data.instagramUrl || null,
        tiktok_url: data.tiktokUrl || null,
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

function mapCopy(row: any): CmsSiteCopy {
  return {
    heroTitle: row.hero_title ?? defaultSiteCopy.heroTitle,
    heroSubtitle: row.hero_subtitle ?? defaultSiteCopy.heroSubtitle,
    featuredTitle: row.featured_title ?? defaultSiteCopy.featuredTitle,
    newsletterTitle: row.newsletter_title ?? defaultSiteCopy.newsletterTitle,
    newsletterText: row.newsletter_text ?? defaultSiteCopy.newsletterText,
    aboutBlurb: row.about_blurb ?? "A small clothing label working in wool, silk and cashmere.",
    supportEmail: row.support_email ?? "kamoura595@gmail.com",
    supportPhone: row.support_phone ?? "08143359771",
    instagramUrl: row.instagram_url ?? "",
    tiktokUrl: row.tiktok_url ?? "",
  };
}
