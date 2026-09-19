import { PackageCheck, ShoppingBag, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { listOwnerGroups } from "@/lib/group-orders";

const money = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

export default async function GroupsPage() {
  const user = await currentUser(); if (!user) redirect("/account");
  const groups = await listOwnerGroups(user.id);
  return <main className="groups-index"><header className="page-enter"><span>SHOP TOGETHER</span><h1>Your group baskets</h1><p>Invite friends before checkout, collect each Amazon Pay contribution, then place one delivery order.</p></header>{groups.length ? <section className="groups-list">{groups.map((group) => <Link className="page-enter" key={group.id} href={`/group/manage/${group.id}`}><div className="groups-list__icon">{group.status === "placed" ? <PackageCheck /> : <Users />}</div><div><strong>{group.status === "placed" ? `Order ${group.orderId}` : `${group.items.length} product basket`}</strong><small>{new Date(group.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {group.participants.length} friends</small></div><b>{money(group.finalTotalPaise)}</b><em data-status={group.status}>{group.status}</em></Link>)}</section> : <section className="groups-empty page-enter"><ShoppingBag /><h2>No group baskets yet</h2><p>Add products to your cart, then choose <strong>Shop & pay with friends</strong>.</p><Link href="/">Start shopping</Link></section>}</main>;
}
