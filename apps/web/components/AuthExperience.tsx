"use client";

import { ArrowRight, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function AuthExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries()))
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) return setError(data.error ?? "Authentication failed.");
    const next = searchParams.get("next");
    router.replace(next?.startsWith("/") ? next : "/account");
    router.refresh();
  }

  return (
    <div className="auth-page">
      <section className="auth-intro">
        <span>YOUR PICO ACCOUNT</span>
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
        <header><div><UserRound /></div><h2>{mode === "login" ? "Welcome back" : "Join Pico"}</h2><p>{mode === "login" ? "Sign in to continue shopping." : "Create your customer account in a few seconds."}</p></header>
        <form onSubmit={submit}>
          {mode === "register" && <label>Full name<input name="name" autoComplete="name" minLength={2} required placeholder="Your name" /></label>}
          <label>Email address<div className="input-with-icon"><Mail /><input type="email" name="email" autoComplete="email" required placeholder="you@example.com" /></div></label>
          {mode === "register" && <label>Phone number <small>Optional</small><input name="phone" autoComplete="tel" placeholder="+91 98765 43210" /></label>}
          <label>Password<input type="password" name="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required placeholder="At least 8 characters" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}<ArrowRight /></button>
        </form>
      </section>
    </div>
  );
}
