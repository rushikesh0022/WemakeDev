import { AccountExperience } from "@/components/AccountExperience";
import { AuthExperience } from "@/components/AuthExperience";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ view?: string; next?: string }> }) {
  const user = await currentUser();
  const params = await searchParams;
  const view = params.view === "orders" ? "orders" : params.view === "addresses" ? "addresses" : "home";
  const returnTo = params.next === "/checkout" ? "/checkout" : undefined;
  return user ? <AccountExperience initialUser={user} initialView={view} returnTo={returnTo} /> : <AuthExperience />;
}
