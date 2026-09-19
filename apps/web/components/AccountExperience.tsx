"use client";

import { ArrowLeft, ChevronRight, CircleHelp, CreditCard, LogOut, MapPin, Package, Pencil, Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { PublicUser } from "@/lib/auth";

type View = "home" | "profile" | "addresses" | "orders" | "payments" | "preferences" | "help";

export function AccountExperience({ initialUser, initialView = "home" }: { initialUser: PublicUser; initialView?: "home" | "orders" }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [view, setView] = useState<View>(initialView);
  const [message, setMessage] = useState("");
  const initials = user.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const addressSummary = user.address ? `${user.address.label} · ${user.address.city}` : "Add a delivery address";

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const body = view === "addresses"
      ? { address: { label: values.label, line1: values.line1, city: values.city, pincode: values.pincode } }
      : { name: values.name, phone: values.phone };
    const response = await fetch("/api/account", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error ?? "Could not save changes.");
    setUser(data.user);
    setMessage("Saved successfully.");
    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/account");
    router.refresh();
  }

  function open(next: View) {
    setView(next);
    setMessage("");
  }

  return (
    <div className="account-page">
      {view === "home" ? <>
        <section className="account-profile-card">
          <div className="account-avatar">{initials}</div>
          <div className="account-profile-copy">
            <span>MY PICO ACCOUNT</span>
            <h1>{user.name}</h1>
            <p>{user.phone || user.email}</p>
            {user.phone && <small>{user.email}</small>}
          </div>
          <button className="account-edit" onClick={() => open("profile")}><Pencil /><span>Edit profile</span></button>
          <p className="account-profile-note">Good food, thoughtful choices, delivered your way.</p>
        </section>

        <section className="account-shortcuts" aria-label="Account options">
          <AccountShortcut icon={Package} title="Your orders" status={user.orders.length ? `${user.orders.length} recent ${user.orders.length === 1 ? "order" : "orders"}` : "Track and reorder"} onClick={() => open("orders")} />
          <AccountShortcut icon={CreditCard} title="Group baskets" status="Choose and pay together" onClick={() => router.push("/groups")} />
          <AccountShortcut icon={MapPin} title="Saved addresses" status={addressSummary} onClick={() => open("addresses")} />
          <AccountShortcut icon={CreditCard} title="Payments" status="Amazon Pay at checkout" onClick={() => open("payments")} />
          <AccountShortcut icon={Settings} title="Preferences" status="Personalisation and substitutions" onClick={() => open("preferences")} />
          <AccountShortcut icon={CircleHelp} title="Help & support" status="Get help with your orders" onClick={() => open("help")} wide />
          {user.role === "admin" && <AccountShortcut icon={ShieldCheck} title="Admin control room" status="Catalog and recommendation tools" onClick={() => router.push("/admin")} wide />}
        </section>

        <button className="account-signout" onClick={logout}><span><LogOut />Sign out</span><ChevronRight /></button>
      </> : <section className="account-detail-shell">
        <button className="account-back" onClick={() => open("home")}><ArrowLeft />Back to account</button>
        <div className="account-content">
          {view === "profile" && <><header><span>PERSONAL DETAILS</span><h2>Edit your profile</h2><p>Keep your contact information accurate for delivery updates.</p></header><form onSubmit={save} className="account-form"><label>Full name<input name="name" defaultValue={user.name} minLength={2} required /></label><label>Email address<input value={user.email} disabled /></label><label>Phone number<input name="phone" defaultValue={user.phone} placeholder="Add a phone number" /></label><label>Member since<input value={new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} disabled /></label><button>Save profile</button></form></>}
          {view === "addresses" && <><header><span>DELIVERY</span><h2>Saved address</h2><p>Pico uses this address during checkout and location selection.</p></header><form onSubmit={save} className="account-form"><label>Label<input name="label" defaultValue={user.address?.label ?? "Home"} required /></label><label className="wide">Address<input name="line1" defaultValue={user.address?.line1 ?? ""} placeholder="Flat, building and street" required /></label><label>City<input name="city" defaultValue={user.address?.city ?? ""} required /></label><label>PIN code<input name="pincode" defaultValue={user.address?.pincode ?? ""} inputMode="numeric" required /></label><button>Save address</button></form></>}
          {view === "orders" && (user.orders.length ? <><header><span>ORDER HISTORY</span><h2>Your orders</h2><p>Track personal and group basket deliveries.</p></header><div className="account-orders">{user.orders.map((order) => <div className="account-order-block" key={order.id}><article><div><strong>{order.id}</strong><small>{new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small></div><span>{order.itemCount} {order.itemCount === 1 ? "item" : "items"}</span><b>₹{order.total}</b><em>{order.status.replaceAll("_", " ")}</em><Link className="account-order-track" href={`/orders/${order.id}`}>Track order <ChevronRight /></Link></article></div>)}</div></> : <EmptyPanel icon={Package} title="No orders yet" copy="Your completed Pico orders will appear here, ready to review or reorder." />)}
          {view === "payments" && <EmptyPanel icon={CreditCard} title="No payment methods saved" copy="For your security, payment details will be handled by the payment provider during checkout." />}
          {view === "preferences" && <><header><span>PERSONALISATION</span><h2>Shopping preferences</h2><p>Choose how Pico personalises recommendations and substitutions.</p></header><div className="preference-list"><label><span><strong>Use order history</strong><small>Personalise results using products you purchase.</small></span><input type="checkbox" defaultChecked /></label><label><span><strong>Offers and price alerts</strong><small>Receive updates about relevant deals.</small></span><input type="checkbox" /></label><label><span><strong>Substitution approval</strong><small>Ask before replacing unavailable products.</small></span><input type="checkbox" defaultChecked /></label></div></>}
          {view === "help" && <EmptyPanel icon={CircleHelp} title="How can we help?" copy="Order support, common questions, and live assistance will be available here when the support service is connected." />}
          {message && <p className={message.startsWith("Saved") ? "form-success" : "form-error"} role="status">{message}</p>}
        </div>
      </section>}
    </div>
  );
}

function AccountShortcut({ icon: Icon, title, status, onClick, wide = false }: { icon: typeof Package; title: string; status: string; onClick: () => void; wide?: boolean }) {
  return <button className={`account-shortcut${wide ? " account-shortcut--wide" : ""}`} onClick={onClick}><span className="account-shortcut__icon"><Icon /></span><span className="account-shortcut__copy"><strong>{title}</strong><small>{status}</small></span><ChevronRight /></button>;
}

function EmptyPanel({ icon: Icon, title, copy }: { icon: typeof Package; title: string; copy: string }) {
  return <div className="account-empty"><div><Icon /></div><h2>{title}</h2><p>{copy}</p></div>;
}
