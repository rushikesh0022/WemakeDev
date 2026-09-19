"use client";

import { BadgeCheck, Check, Copy, LockKeyhole, PackageCheck, RefreshCw, Share2, Users, WalletCards } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { copyText } from "@/lib/copy-text";
import { authorizeWithAmazonPay, type AmazonPayWebAuthorization } from "@/lib/amazon-pay-client";
import type { OwnerGroupView } from "@/lib/group-orders";

const money = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

export function GroupOwnerExperience({ initialGroup }: { initialGroup: OwnerGroupView }) {
  const { clear } = useCart();
  const [group, setGroup] = useState(initialGroup);
  const [token, setToken] = useState("");
  const [tokenHydrated, setTokenHydrated] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    setToken(sessionStorage.getItem(`nesto-group-${initialGroup.id}`) ?? "");
    setTokenHydrated(true);
    const url = new URL(window.location.href);
    const amazonResult = url.searchParams.get("amazon");
    if (amazonResult === "linked") setMessage("Amazon Pay account connected securely.");
    if (amazonResult === "error") setMessage("Amazon Pay authorization was cancelled or could not be completed.");
    if (amazonResult) { url.searchParams.delete("amazon"); window.history.replaceState({}, "", url); }
  }, [initialGroup.id]);
  const shareUrl = useMemo(() => token && typeof window !== "undefined" ? `${window.location.origin}/group/${token}` : "", [token]);

  async function refresh() {
    setBusy("refresh"); const response = await fetch(`/api/group-orders/${group.id}`); const data = await response.json(); setBusy("");
    if (response.ok) setGroup(data.group); else setMessage(data.error);
  }
  async function createLink(copyOnly = false) {
    setBusy("share"); setMessage("");
    if (copyOnly && shareUrl) { await copyText(shareUrl); setBusy(""); return setMessage("Private basket link copied."); }
    const response = await fetch(`/api/group-orders/${group.id}/link`, { method: "POST" }); const data = await response.json(); setBusy("");
    if (!response.ok) return setMessage(data.error ?? "Could not create a link.");
    setGroup(data.group); setToken(data.publicToken); sessionStorage.setItem(`nesto-group-${group.id}`, data.publicToken);
    const url = `${window.location.origin}/group/${data.publicToken}`;
    const nativeShare = typeof navigator.share === "function" ? navigator.share : undefined;
    if (nativeShare) await nativeShare.call(navigator, { title: "Join my Nesto basket", text: "Claim your products and pay your share with Amazon Pay.", url }).catch(() => undefined);
    else await copyText(url);
    setMessage(nativeShare ? "Your invite is ready." : "Private basket link copied.");
  }
  async function action(name: "lock" | "amazon/link" | "place") {
    setBusy(name); setMessage(""); const response = await fetch(`/api/group-orders/${group.id}/${name}`, { method: "POST" }); const data = await response.json();
    if (!response.ok) { setBusy(""); return setMessage(data.error ?? "Could not update this order."); }
    if (data.authorization) {
      try { await authorizeWithAmazonPay(data.authorization as AmazonPayWebAuthorization); }
      catch (error) { setBusy(""); setMessage(error instanceof Error ? error.message : "Could not open Amazon Pay."); }
      return;
    }
    setBusy("");
    setGroup(data.group);
    if (name === "lock") setMessage("Choices are locked. Friends can now pay their shares.");
    if (name === "amazon/link") setMessage("Amazon Pay linked for this local sandbox session.");
    if (name === "place" && sessionStorage.getItem("nesto-active-group-id") === group.id) {
      clear();
      sessionStorage.removeItem("nesto-active-group-id");
    }
  }

  const claimed = group.claims.reduce((sum, item) => sum + item.quantity, 0);
  const paid = group.contributions.filter((item) => item.status === "paid").length;
  return <main className="group-page">
    <header className="group-hero page-enter"><div><span>NESTO CIRCLE</span><h1>One basket.<br />Everyone’s choice.</h1><p>Share the products first. Friends claim what they want and complete their own Amazon Pay merchant charge before you place one delivery.</p></div><div className={`group-status group-status--${group.status}`}>{group.status === "placed" ? <PackageCheck /> : <Users />}{group.status}</div></header>

    <section className="group-progress page-enter"><article><small>BASKET</small><strong>{money(group.finalTotalPaise)}</strong></article><article><small>YOUR SHARE</small><strong>{money(group.ownerPayablePaise)}</strong></article><article><small>CLAIMED</small><strong>{claimed} items</strong></article><article><small>PAID</small><strong>{paid}/{group.contributions.length}</strong></article></section>

    <div className="group-owner-grid">
      <section className="group-card page-enter"><header><div><span>LIVE BASKET</span><h2>Who chose what</h2></div><button onClick={refresh} aria-label="Refresh group order" disabled={busy === "refresh"}><RefreshCw /></button></header>
        <div className="group-item-list">{group.items.map((item) => { const claims = group.claims.filter((claim) => claim.lineId === item.lineId); const taken = claims.reduce((sum, claim) => sum + claim.quantity, 0); return <article key={item.lineId}><img src={item.image} alt="" /><div><strong>{item.name}</strong><small>{item.quantity} × {money(item.unitPricePaise)}</small></div><div className="group-tags">{claims.map((claim) => <span key={claim.participantId}>{group.participants.find((person) => person.id === claim.participantId)?.displayName} × {claim.quantity}</span>)}{taken < item.quantity && <span className="group-owner-tag">You × {item.quantity - taken}</span>}</div></article>; })}</div>
      </section>

      <aside className="group-control page-enter"><div className="group-control__icon">{group.status === "placed" ? <PackageCheck /> : <Share2 />}</div><span>{group.status === "placed" ? "DELIVERY CREATED" : "PRIVATE BASKET LINK"}</span><h2>{group.status === "placed" ? "Everyone is paid" : "Invite your group"}</h2><p>{group.status === "placed" ? "This basket is closed and the store has received one delivery order." : "Friends open one private link, claim product quantities, then connect Amazon Pay for their own share."}</p>{group.status !== "placed" && <><button className="group-primary" onClick={() => createLink(Boolean(token))} disabled={!tokenHydrated || busy === "share"}>{!tokenHydrated ? <RefreshCw /> : token ? <Copy /> : <Share2 />}{!tokenHydrated ? "Loading invite…" : token ? "Copy private link" : "Create private link"}</button>{tokenHydrated && token && <button className="group-secondary" onClick={() => createLink(false)}>Replace link</button>}</>}
        {group.status === "draft" && <button className="group-lock" onClick={() => action("lock")} disabled={busy === "lock"}><LockKeyhole />{busy === "lock" ? "Locking…" : "Lock choices"}</button>}
        {group.status === "ready" && group.ownerPayablePaise > 0 && !group.ownerAmazonLinked && <button className="amazon-button" onClick={() => action("amazon/link")} disabled={busy === "amazon/link"}><WalletCards />Link Amazon Pay</button>}
        {group.status === "ready" && (group.ownerAmazonLinked || group.ownerPayablePaise === 0) && <button className="amazon-button amazon-button--pay" onClick={() => action("place")} disabled={busy === "place"}><Check />{busy === "place" ? "Placing order…" : group.ownerPayablePaise > 0 ? `Pay ${money(group.ownerPayablePaise)} & place order` : "Place group order"}</button>}
        {group.status === "placed" && <><div className="group-placed"><BadgeCheck /><span><strong>Order placed</strong><small>{group.orderId} is being prepared</small></span></div>{group.orderId && <Link className="group-track-link" href={`/orders/${group.orderId}`}>Track delivery →</Link>}</>}
        {message && <p className="group-message">{message}</p>}
      </aside>
    </div>

    {group.participants.length > 0 && <section className="group-card group-people page-enter"><header><div><span>PEOPLE</span><h2>Contribution status</h2></div></header>{group.participants.map((person) => <article key={person.id}><div className="group-person-avatar">{person.displayName.slice(0, 1).toUpperCase()}</div><div><strong>{person.displayName}</strong><small>{person.amazonLinked ? "Amazon Pay linked" : "Waiting to link Amazon Pay"}</small></div><b>{money(person.payablePaise)}</b><em data-status={person.paymentStatus ?? "choosing"}>{person.paymentStatus ?? "choosing"}</em></article>)}</section>}
    <Link className="group-back" href="/">← Continue shopping</Link>
  </main>;
}
