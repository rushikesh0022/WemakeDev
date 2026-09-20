"use client";

import { ArrowRight, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function AuthExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register" | "confirm">("login");
  const [pendingEmail, setPendingEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const endpoint = mode === "confirm" ? "confirm" : mode === "login" ? "login" : "register";
    const payload = Object.fromEntries(form.entries());
    if (mode === "confirm") payload.email = pendingEmail;
    const response = await fetch(`/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) return setError(data.error ?? "Authentication failed.");
    if (mode === "register" && data.confirmationRequired) {
      setPendingEmail(String(form.get("email") ?? ""));
      setMode("confirm");
      return;
    }
    if (mode === "confirm") {
      setMode("login");
      setError("Account verified. Sign in to continue.");
      return;
    }
    const next = searchParams.get("next");
    router.replace(next?.startsWith("/") ? next : "/account");
    router.refresh();
  }

  return (
    <div className="auth-page">
      <section className="auth-intro">
        <span>YOUR NESTO ACCOUNT</span>
        <h1>Everything you need,<br />remembered for you.</h1>
        <p>Save delivery addresses, review orders, keep your preferences, and receive recommendations tied to your account.</p>
        <div><ShieldCheck /><p><strong>Private by design</strong><small>Your session is stored in a secure HTTP-only cookie.</small></p></div>
        <div><LockKeyhole /><p><strong>Protected access</strong><small>Customer and administrator pages use separate permissions.</small></p></div>
      </section>
      <section className="auth-card">
        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>Create account</button>
        </div>
        <header><div><UserRound /></div><h2>{mode === "login" ? "Welcome back" : mode === "register" ? "Join Zaply" : "Check your email"}</h2><p>{mode === "login" ? "Sign in to continue shopping." : mode === "register" ? "Create your customer account in a few seconds." : `Enter the verification code sent to ${pendingEmail}.`}</p></header>
        <form onSubmit={submit}>
          {mode === "register" && <label>Full name<input name="name" autoComplete="name" minLength={2} required placeholder="Your name" /></label>}
          {mode !== "confirm" && <label>Email address<div className="input-with-icon"><Mail /><input type="email" name="email" autoComplete="email" required placeholder="you@example.com" /></div></label>}
          {mode === "register" && <label>Phone number <small>Optional</small><input name="phone" autoComplete="tel" placeholder="+91 98765 43210" /></label>}
          {mode !== "confirm" && <label>Password<input type="password" name="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required placeholder="At least 8 characters" /></label>}
          {mode === "confirm" && <label>Verification code<input name="code" inputMode="numeric" autoComplete="one-time-code" minLength={6} required placeholder="6-digit code" /></label>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Verify account"}<ArrowRight /></button>
        </form>
      </section>
    </div>
  );
}
