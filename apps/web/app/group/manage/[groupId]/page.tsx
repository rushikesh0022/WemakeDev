import { notFound, redirect } from "next/navigation";
import { GroupOwnerExperience } from "@/components/GroupOwnerExperience";
import { currentUser } from "@/lib/auth";
import { getOwnerGroup } from "@/lib/group-orders";

export default async function GroupManagePage({ params }: { params: Promise<{ groupId: string }> }) {
  const user = await currentUser(); if (!user) redirect("/account");
  const group = await getOwnerGroup(user.id, (await params).groupId); if (!group) notFound();
  return <GroupOwnerExperience initialGroup={group} />;
}
