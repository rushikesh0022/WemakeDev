"use client";

import { Check, CheckCircle2, Copy, LockKeyhole, RefreshCw, Share2, Users, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { copyText } from "@/lib/copy-text";
import type { OwnerSplitView } from "@/lib/splits";

const money = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

export function OwnerSplitExperience({ initialSplit }: { initialSplit: OwnerSplitView }) {
  const [split, setSplit] = useState(initialSplit);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    setToken(window.sessionStorage.getItem(`zaply-share-${initialSplit.id}`) ?? "");
  }, [initialSplit.id]);

  const shareUrl = useMemo(() => token && typeof window !== "undefined" ? `${window.location.origin}/split/${token}` : "", [token]);
  const claimedItems = split.claims.reduce((sum, claim) => sum + claim.quantity, 0);

  async function refresh() {
    setBusy("refresh");
    const response = await fetch(`/api/splits/${split.id}`);
    const data = await response.json();
    if (response.ok) setSplit(data.split); else setMessage(data.error);
    setBusy("");
  }

  async function createLink() {
    setBusy("share"); setMessage("");
    const response = await fetch(`/api/splits/${split.id}/link`, { method: "POST" });
    const data = await response.json();
    setBusy("");
    if (!response.ok) return setMessage(data.error ?? "Could not create a link.");
    setToken(data.publicToken);
    setSplit(data.split);
    window.sessionStorage.setItem(`zaply-share-${split.id}`, data.publicToken);
    const url = `${window.location.origin}/split/${data.publicToken}`;
    const nativeShare = (navigator as unknown as { share?: (data: ShareData) => Promise<void> }).share;
    if (nativeShare) await nativeShare.call(navigator, { title: `Split Zaply order ${split.orderId}`, text: "Claim your items and pay your share.", url }).catch(() => undefined);
    else await copyText(url);
    setMessage(nativeShare ? "Private link is ready." : "Private link copied.");
  }

  async function copyLink() {
    if (!shareUrl) return createLink();
    await copyText(shareUrl);
    setMessage("Private link copied.");
  }

  async function lock() {
    setBusy("lock"); setMessage("");
    const response = await fetch(`/api/splits/${split.id}/lock`, { method: "POST" });
    const data = await response.json();
    setBusy("");
    if (!response.ok) return setMessage(data.error ?? "Could not lock the split.");
    setSplit(data.split);
    setMessage("Claims are locked. Friends can now pay their shares.");
  }

  async function review(settlementId: string, decision: "confirm" | "reject") {
    setBusy(settlementId); setMessage("");
    const response = await fetch(`/api/splits/${split.id}/settlements/${settlementId}/${decision}`, { method: "POST" });
    const data = await response.json();
    setBusy("");
    if (!response.ok) return setMessage(data.error ?? "Could not review payment.");
    setSplit(data.split);
  }

  return <main className="split-page">
    <header className="split-hero">
      <div><span>ORDER {split.orderId}</span><h1>Split with friends</h1><p>Friends claim their items, then reimburse you directly using UPI.</p></div>
      <div className={`split-status split-status--${split.status}`}><Users />{split.status.replaceAll("_", " ")}</div>
    </header>

    <section className="split-summary-row">
      <article><small>ORDER TOTAL</small><strong>{money(split.finalTotalPaise)}</strong></article>
      <article><small>YOUR SHARE</small><strong>{money(split.ownerPayablePaise)}</strong></article>
      <article><small>CLAIMED</small><strong>{claimedItems} items</strong></article>
      <article><small>FRIENDS</small><strong>{split.participants.length}</strong></article>
    </section>

    <div className="split-owner-layout">
      <section className="split-panel">
        <div className="split-panel__heading"><div><span>LIVE CLAIMS</span><h2>Who is keeping what</h2></div><button onClick={refresh} disabled={busy === "refresh"} aria-label="Refresh split"><RefreshCw /></button></div>
        <div className="split-items">
          {split.items.map((item) => {
            const itemClaims = split.claims.filter((claim) => claim.lineId === item.lineId);
            const claimed = itemClaims.reduce((sum, claim) => sum + claim.quantity, 0);
            return <article key={item.lineId}><div><strong>{item.name}</strong><small>{item.quantity} × {money(item.unitPricePaise)}</small></div><div className="claim-tags">{itemClaims.map((claim) => <span key={claim.participantId}>{split.participants.find((person) => person.id === claim.participantId)?.displayName ?? "Friend"} × {claim.quantity}</span>)}{claimed < item.quantity && <span className="owner-claim">You × {item.quantity - claimed}</span>}</div></article>;
          })}
        </div>
      </section>

      <aside className="split-actions-card">
        <span>PRIVATE INVITE</span><h2>Bring friends in</h2><p>Anyone with this link can join. Creating a new link replaces the previous one.</p>
        <button className="primary-button" onClick={token ? copyLink : createLink} disabled={busy === "share"}>{token ? <Copy /> : <Share2 />}{token ? "Copy private link" : busy === "share" ? "Creating…" : "Create private link"}</button>
        {token && <button className="secondary-button" onClick={createLink}>Replace link</button>}
        {split.status === "draft" && <button className="split-lock" onClick={lock} disabled={busy === "lock"}><LockKeyhole />{busy === "lock" ? "Locking…" : "Lock claims & calculate"}</button>}
        <small>Links expire {new Date(split.expiresAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}.</small>
        {message && <p className="split-message" role="status">{message}</p>}
      </aside>
    </div>

    {split.settlements.length > 0 && <section className="split-panel split-settlements"><div className="split-panel__heading"><div><span>REIMBURSEMENTS</span><h2>Payment status</h2></div></div>{split.settlements.map((settlement) => {
      const person = split.participants.find((participant) => participant.id === settlement.participantId);
      return <article key={settlement.id}><div><strong>{person?.displayName ?? "Friend"}</strong><small>{money(settlement.amountPaise)} · {settlement.status.replaceAll("_", " ")}</small></div>{settlement.status === "awaiting_owner_confirmation" && <div><button className="confirm-payment" onClick={() => review(settlement.id, "confirm")} disabled={busy === settlement.id}><Check />Confirm received</button><button className="reject-payment" onClick={() => review(settlement.id, "reject")} disabled={busy === settlement.id}><X />Not received</button></div>}{settlement.status === "paid" && <CheckCircle2 className="paid-mark" />}</article>;
    })}</section>}
    <Link className="split-back-link" href="/account">← Back to your account</Link>
  </main>;
}
