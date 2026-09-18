"use client";

import { CheckCircle2, Copy, Minus, Plus, RefreshCw, Send, Smartphone, Users } from "lucide-react";
import QRCode from "qrcode";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { copyText } from "@/lib/copy-text";
import type { PublicSplitView } from "@/lib/splits";

const money = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

export function SplitGuestExperience({ token }: { token: string }) {
  const [split, setSplit] = useState<PublicSplitView | null>(null);
  const [claims, setClaims] = useState<Record<string, number>>({});
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    const response = await fetch(`/api/splits/public/${encodeURIComponent(token)}`);
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setError(data.error ?? "This split is unavailable.");
    setSplit(data.split);
  };

  useEffect(() => { load(); }, [token]);
  useEffect(() => {
    if (!split?.me) return;
    setClaims(Object.fromEntries(split.me.claims.map((claim) => [claim.lineId, claim.quantity])));
  }, [split?.version, split?.me?.id]);
  useEffect(() => {
    const uri = split?.me?.settlement?.upiUri;
    if (!uri) return setQr("");
    QRCode.toDataURL(uri, { width: 280, margin: 1, color: { dark: "#143c24", light: "#ffffff" } }).then(setQr).catch(() => setQr(""));
  }, [split?.me?.settlement?.upiUri]);

  const provisional = useMemo(() => split?.items.reduce((sum, item) => sum + (claims[item.lineId] ?? 0) * item.unitPricePaise, 0) ?? 0, [claims, split]);

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const displayName = String(new FormData(event.currentTarget).get("displayName") ?? "");
    const response = await fetch(`/api/splits/public/${encodeURIComponent(token)}/participants`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ displayName }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setError(data.error ?? "Could not join.");
    setSplit(data.split);
  }

  function quantityLimit(item: PublicSplitView["items"][number]) {
    return item.remaining + (claims[item.lineId] ?? 0);
  }

  function change(lineId: string, value: number, max: number) {
    setClaims((current) => ({ ...current, [lineId]: Math.max(0, Math.min(max, value)) }));
  }

  async function saveClaims() {
    if (!split) return;
    setBusy(true); setError(""); setNotice("");
    const response = await fetch(`/api/splits/public/${encodeURIComponent(token)}/claims`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ version: split.version, claims: Object.entries(claims).map(([lineId, quantity]) => ({ lineId, quantity })) }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) {
      if (data.split) setSplit(data.split);
      return setError(data.error ?? "Could not save your items.");
    }
    setSplit(data.split); setNotice("Your items are saved.");
  }

  async function markSent() {
    const settlement = split?.me?.settlement;
    if (!settlement) return;
    setBusy(true); setError("");
    const response = await fetch(`/api/splits/public/${encodeURIComponent(token)}/settlements/${settlement.id}/sent`, { method: "POST" });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setError(data.error ?? "Could not report payment.");
    setSplit(data.split); setNotice("Payment reported. The order owner will confirm receipt.");
  }

  async function copyUpi() {
    const uri = split?.me?.settlement?.upiUri;
    if (!uri) return;
    const vpa = new URL(uri).searchParams.get("pa") ?? "";
    await copyText(vpa);
    setNotice("UPI ID copied.");
  }

  if (loading) return <main className="split-page split-loading"><RefreshCw /><h1>Opening private split…</h1></main>;
  if (!split) return <main className="split-page"><section className="split-closed"><h1>Split unavailable</h1><p>{error}</p></section></main>;
  if (["expired", "cancelled"].includes(split.status)) return <main className="split-page"><section className="split-closed"><h1>This split is {split.status}</h1><p>Ask the order owner for a new private link.</p></section></main>;

  if (!split.me) return <main className="split-page split-guest-welcome"><section><div className="split-welcome-icon"><Users /></div><span>PRIVATE ZAPLY SPLIT</span><h1>{split.ownerName} invited you</h1><p>Join order {split.orderId} to claim the items you are keeping. No Zaply account is needed.</p>{split.status === "draft" ? <form onSubmit={join}><label>Your name<input name="displayName" placeholder="Enter your name" maxLength={40} required /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? "Joining…" : "Join this split"}</button></form> : <p className="form-error">Claims are already locked for this split.</p>}</section></main>;

  const settlement = split.me.settlement;
  return <main className="split-page">
    <header className="split-hero split-hero--guest"><div><span>ORDER {split.orderId}</span><h1>Hi {split.me.displayName}</h1><p>{split.status === "draft" ? "Choose the item quantities you are keeping." : "Your share is ready to reimburse."}</p></div><button onClick={load} aria-label="Refresh"><RefreshCw /></button></header>

    {split.status === "draft" ? <div className="split-guest-layout"><section className="split-panel"><div className="split-panel__heading"><div><span>CLAIM YOUR ITEMS</span><h2>What are you keeping?</h2></div></div><div className="guest-claim-list">{split.items.map((item) => {
      const mine = claims[item.lineId] ?? 0;
      const max = quantityLimit(item);
      return <article key={item.lineId}><div><strong>{item.name}</strong><small>{money(item.unitPricePaise)} each · {item.remaining} currently available</small>{item.claimed.length > 0 && <em>{item.claimed.map((claim) => `${claim.displayName} × ${claim.quantity}`).join(" · ")}</em>}</div><div className="claim-stepper"><button onClick={() => change(item.lineId, mine - 1, max)} disabled={!mine}><Minus /></button><span>{mine}</span><button onClick={() => change(item.lineId, mine + 1, max)} disabled={mine >= max}><Plus /></button></div></article>;
    })}</div></section><aside className="split-actions-card"><span>ESTIMATED SHARE</span><h2>{money(provisional)}</h2><p>Shared fees and discounts are added proportionally when the owner locks the split.</p><button className="primary-button" onClick={saveClaims} disabled={busy}>{busy ? "Saving…" : "Save my items"}</button>{notice && <p className="split-message">{notice}</p>}{error && <p className="form-error">{error}</p>}</aside></div> : settlement ? <section className="payment-request"><div className="payment-request__copy"><span>YOUR FINAL SHARE</span><h1>{money(settlement.amountPaise)}</h1><p>Pay {split.ownerName} directly. Zaply does not hold this money or ask for your UPI PIN.</p><a className="primary-button" href={settlement.upiUri}><Smartphone />Pay using UPI</a><button className="secondary-button" onClick={copyUpi}><Copy />Copy UPI ID</button></div><div className="payment-request__qr">{qr ? <img src={qr} alt="UPI payment QR code" /> : <RefreshCw />}<small>Scan with Amazon Pay or any UPI app</small></div><footer>{settlement.status === "paid" ? <div className="payment-confirmed"><CheckCircle2 />Payment confirmed by {split.ownerName}</div> : settlement.status === "awaiting_owner_confirmation" ? <div className="payment-waiting"><Send />Waiting for {split.ownerName} to confirm receipt</div> : <button className="primary-button" onClick={markSent} disabled={busy}>{busy ? "Reporting…" : settlement.status === "rejected" ? "I sent it again" : "I sent the payment"}</button>}{notice && <p className="split-message">{notice}</p>}{error && <p className="form-error">{error}</p>}</footer></section> : <section className="split-closed"><h1>No payment is due</h1><p>You did not claim any items before the split was locked.</p></section>}
  </main>;
}
