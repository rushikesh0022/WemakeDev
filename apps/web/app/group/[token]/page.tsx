import { GroupGuestExperience } from "@/components/GroupGuestExperience";

export default async function GroupGuestPage({ params }: { params: Promise<{ token: string }> }) {
  return <GroupGuestExperience token={(await params).token} />;
}
