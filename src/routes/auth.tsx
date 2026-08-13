import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Kamoura" },
      {
        name: "description",
        content:
          "Sign in to your Kamoura account to follow orders, save addresses and keep a wishlist.",
      },
      { property: "og:title", content: "Sign in — Kamoura" },
      { property: "og:description", content: "Account access for Kamoura clients." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/account", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/account`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Check your inbox to confirm your email, then sign in.");
        setMode("sign-in");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        void navigate({ to: "/account" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (res.error) toast.error(res.error.message);
  };

  return (
    <div className="mx-auto max-w-md px-5 py-20 sm:px-8">
      <p className="eyebrow">Client access</p>
      <h1 className="mt-4 font-display text-4xl text-ivory">
        {mode === "sign-in" ? "Welcome back" : "Open an account"}
      </h1>
      <p className="mt-3 text-sm text-grey">
        Orders, addresses and saved pieces, kept in one quiet place.
      </p>

      <button
        type="button"
        onClick={google}
        className="mt-8 w-full border border-border px-6 py-3.5 text-xs uppercase tracking-[0.2em] text-ivory transition-colors hover:border-gold-soft"
      >
        Continue with Google
      </button>

      <div className="my-7 flex items-center gap-4 text-[0.65rem] uppercase tracking-[0.2em] text-grey-dim">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="space-y-5">
        {mode === "sign-up" && (
          <Field label="Full name" value={name} onChange={setName} />
        )}
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={password} onChange={setPassword} />
        <button
          type="submit"
          disabled={busy}
          className="w-full border border-gold bg-gold px-6 py-4 text-xs uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-gold-soft hover:text-ivory disabled:opacity-50"
        >
          {busy ? "One moment…" : mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="mt-7 flex flex-wrap justify-between gap-3 text-xs uppercase tracking-[0.16em] text-grey">
        <button
          type="button"
          onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
          className="text-gold hover:text-ivory"
        >
          {mode === "sign-in" ? "Create an account" : "I already have an account"}
        </button>
        <Link to="/reset-password" className="hover:text-ivory">
          Forgot password
        </Link>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="block text-[0.7rem] uppercase tracking-[0.18em] text-grey">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={type === "password" ? "current-password" : "on"}
        className="mt-2 w-full border border-input bg-transparent px-4 py-3 text-sm text-ivory focus:border-gold focus:outline-none"
      />
    </div>
  );
}
