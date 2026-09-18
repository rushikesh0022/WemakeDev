import { SplitGuestExperience } from "@/components/SplitGuestExperience";

export const dynamic = "force-dynamic";

export default async function PublicSplitPage({ params }: { params: Promise<{ token: string }> }) {
  return <SplitGuestExperience token={(await params).token} />;
}
