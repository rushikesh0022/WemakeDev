import { AccountExperience } from "@/components/AccountExperience";
import { AuthExperience } from "@/components/AuthExperience";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await currentUser();
  const view = (await searchParams).view === "orders" ? "orders" : "home";
  return user ? <AccountExperience initialUser={user} initialView={view} /> : <AuthExperience />;
}
