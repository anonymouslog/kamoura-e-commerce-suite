import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Kamoura" },
      {
        name: "description",
        content: "Request a password reset link for your Kamoura client account.",
      },
      { property: "og:title", content: "Reset your password — Kamoura" },
      { property: "og:description", content: "Password recovery for Kamoura accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [recovery, setRecovery] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    if (window.location.hash.includes("type=recovery")) setRecovery(true);
    return () => sub.subscription.unsubscribe();
  }, []);

  const request = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("If that address has an account, a reset link is on its way.");
  };

  const update = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated.");
      void navigate({ to: "/account" });
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-20 sm:px-8">
      <p className="eyebrow">Account</p>
      <h1 className="mt-4 font-display text-4xl text-ivory">
        {recovery ? "Choose a new password" : "Reset your password"}
      </h1>
      <form onSubmit={recovery ? update : request} className="mt-8 space-y-5">
        <div>
          <label
            htmlFor="reset-field"
            className="block text-[0.7rem] uppercase tracking-[0.18em] text-grey"
          >
            {recovery ? "New password" : "Email"}
          </label>
          <input
            id="reset-field"
            type={recovery ? "password" : "email"}
            required
            value={recovery ? password : email}
            onChange={(e) => (recovery ? setPassword(e.target.value) : setEmail(e.target.value))}
            className="mt-2 w-full border border-input bg-transparent px-4 py-3 text-sm text-ivory focus:border-gold focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full border border-gold bg-gold px-6 py-4 text-xs uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-gold-soft hover:text-ivory disabled:opacity-50"
        >
          {busy ? "One moment…" : recovery ? "Save password" : "Send reset link"}
        </button>
      </form>
    </div>
  );
}
