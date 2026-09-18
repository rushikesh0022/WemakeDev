import { CheckoutExperience } from "@/components/CheckoutExperience";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await currentUser();
  if (!user) redirect("/account?next=/checkout");
  return <CheckoutExperience user={user} />;
}
