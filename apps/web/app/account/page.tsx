import { AccountExperience } from "@/components/AccountExperience";
import { AuthExperience } from "@/components/AuthExperience";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await currentUser();
  return user ? <AccountExperience initialUser={user} /> : <AuthExperience />;
}
