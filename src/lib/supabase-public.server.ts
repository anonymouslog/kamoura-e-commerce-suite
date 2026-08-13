import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Publishable-key Supabase client for server-side use. Optionally acts as a
 *  signed-in user when a bearer token is supplied. RLS always applies. */
export function publicServerClient(accessToken?: string | undefined) {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (accessToken) h.set("Authorization", `Bearer ${accessToken}`);
        else if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export function bearerFromRequest(headers: Headers | undefined): string | undefined {
  const auth = headers?.get("authorization");
  if (!auth?.startsWith("Bearer ")) return undefined;
  const token = auth.slice(7).trim();
  return token || undefined;
}
