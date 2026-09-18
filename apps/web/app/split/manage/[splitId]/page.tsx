import { notFound, redirect } from "next/navigation";
import { OwnerSplitExperience } from "@/components/OwnerSplitExperience";
import { currentUser } from "@/lib/auth";
import { getSplitForOwner } from "@/lib/splits";

export const dynamic = "force-dynamic";

export default async function ManageSplitPage({ params }: { params: Promise<{ splitId: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/account");
  const split = await getSplitForOwner(user.id, (await params).splitId);
  if (!split) notFound();
  return <OwnerSplitExperience initialSplit={split} />;
}
