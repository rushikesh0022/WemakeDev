"use client";

import { ChevronRight, CircleHelp, CreditCard, LogOut, MapPin, Package, Settings, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { PublicUser } from "@/lib/auth";

type View = "profile" | "addresses" | "orders" | "payments" | "preferences" | "help";

export function AccountExperience({ initialUser }: { initialUser: PublicUser }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [view, setView] = useState<View>("profile");
  const [message, setMessage] = useState("");
  const initials = user.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

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

  const navigation: Array<{ id: View; label: string; icon: typeof UserRound }> = [
    { id: "profile", label: "Profile", icon: UserRound },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "orders", label: "Your orders", icon: Package },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "preferences", label: "Preferences", icon: Settings },
    { id: "help", label: "Help & support", icon: CircleHelp }
  ];

  return (
    <div className="account-page">
      <header className="account-heading"><div className="account-avatar">{initials}</div><div><span>MY ACCOUNT</span><h1>{user.name}</h1><p>{user.email}</p></div></header>
      <div className="account-layout">
        <aside className="account-menu">
          {navigation.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} onClick={() => { setView(id); setMessage(""); }}><Icon /><span>{label}</span><ChevronRight /></button>)}
          {user.role === "admin" && <button onClick={() => router.push("/admin")}><ShieldCheck /><span>Admin control room</span><ChevronRight /></button>}
          <button className="account-logout" onClick={logout}><LogOut /><span>Sign out</span></button>
        </aside>
        <section className="account-content">
          {view === "profile" && <><header><span>PERSONAL DETAILS</span><h2>Your profile</h2><p>Keep your contact information accurate for delivery updates.</p></header><form onSubmit={save} className="account-form"><label>Customer ID<input value={user.id} disabled /></label><label>Full name<input name="name" defaultValue={user.name} minLength={2} required /></label><label>Email address<input value={user.email} disabled /></label><label>Phone number<input name="phone" defaultValue={user.phone} placeholder="Add a phone number" /></label><label>Member since<input value={new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} disabled /></label><button>Save profile</button></form></>}
          {view === "addresses" && <><header><span>DELIVERY</span><h2>Saved address</h2><p>This address can be used during checkout.</p></header><form onSubmit={save} className="account-form"><label>Label<input name="label" defaultValue={user.address?.label ?? "Home"} required /></label><label className="wide">Address<input name="line1" defaultValue={user.address?.line1 ?? ""} placeholder="Flat, building and street" required /></label><label>City<input name="city" defaultValue={user.address?.city ?? ""} required /></label><label>PIN code<input name="pincode" defaultValue={user.address?.pincode ?? ""} inputMode="numeric" required /></label><button>Save address</button></form></>}
          {view === "orders" && (user.orders.length ? <><header><span>ORDER HISTORY</span><h2>Your orders</h2><p>Orders placed with this local account appear here.</p></header><div className="account-orders">{user.orders.map((order) => <article key={order.id}><div><strong>{order.id}</strong><small>{new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small></div><span>{order.itemCount} {order.itemCount === 1 ? "item" : "items"}</span><b>₹{order.total}</b><em>{order.status}</em></article>)}</div></> : <EmptyPanel icon={Package} title="No orders yet" copy="Completed Zaply orders will appear here with delivery and invoice details." />)}
          {view === "payments" && <EmptyPanel icon={CreditCard} title="No payment methods saved" copy="Payment details will be managed by the payment provider when checkout is connected." />}
          {view === "preferences" && <><header><span>PERSONALISATION</span><h2>Shopping preferences</h2><p>These controls will influence future recommendations.</p></header><div className="preference-list"><label><span><strong>Use order history</strong><small>Personalise results using products you purchase.</small></span><input type="checkbox" defaultChecked /></label><label><span><strong>Offers and price alerts</strong><small>Receive updates about relevant deals.</small></span><input type="checkbox" /></label><label><span><strong>Substitution approval</strong><small>Ask before replacing unavailable products.</small></span><input type="checkbox" defaultChecked /></label></div></>}
          {view === "help" && <EmptyPanel icon={CircleHelp} title="How can we help?" copy="For this MVP, support is available through the project repository. Live chat and ticket history can be connected later." />}
          {message && <p className={message.startsWith("Saved") ? "form-success" : "form-error"} role="status">{message}</p>}
        </section>
      </div>
    </div>
  );
}

function EmptyPanel({ icon: Icon, title, copy }: { icon: typeof Package; title: string; copy: string }) {
  return <div className="account-empty"><div><Icon /></div><h2>{title}</h2><p>{copy}</p></div>;
}
