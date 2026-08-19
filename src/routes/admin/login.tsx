import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin sign in — Kamoura" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  return <main className="grid min-h-screen place-items-center bg-background px-5 py-10">
    <section className="w-full max-w-sm rounded-lg border border-border bg-card p-6 sm:p-8">
      <div className="flex size-10 items-center justify-center rounded-md border border-border bg-bg-soft text-gold"><ShieldCheck className="size-5" /></div>
      <p className="mt-6 text-xs uppercase tracking-[0.16em] text-grey">Kamoura administration</p>
      <h1 className="mt-2 text-2xl font-semibold text-ivory">Sign in to admin</h1>
      <p className="mt-2 text-sm leading-relaxed text-grey">This entry point is reserved for the store owner. Customer accounts use the storefront sign-in page.</p>
      <form className="mt-7 grid gap-4" onSubmit={async (event) => {
        event.preventDefault(); setBusy(true);
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          const account = await getMyAccount();
          if (!account.roles.includes("admin")) {
            await supabase.auth.signOut();
            throw new Error("This account does not have administrator access.");
          }
          void navigate({ to: "/admin", replace: true });
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Sign in could not be completed.");
        } finally { setBusy(false); }
      }}>
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Password" value={password} onChange={setPassword} type="password" />
        <button disabled={busy} className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-3 text-sm font-medium text-background disabled:opacity-50"><LockKeyhole className="size-4" />{busy ? "Signing in..." : "Sign in"}</button>
      </form>
      <div className="mt-6 border-t border-border pt-5 text-sm text-grey">Customer account? <Link to="/auth" className="font-medium text-ivory hover:text-gold">Use customer sign in</Link></div>
    </section>
  </main>;
}

function Field({ label, value, onChange, type }: { label: string; value: string; onChange: (value: string) => void; type: "email" | "password" }) { const id = `admin-${type}`; return <label className="grid gap-1.5"><span className="text-sm text-grey">{label}</span><input id={id} type={type} required autoComplete={type === "password" ? "current-password" : "username"} value={value} onChange={(event) => onChange(event.target.value)} className="rounded border border-input bg-card px-3 py-2.5 text-sm text-ivory outline-none focus:border-gold" /></label>; }
