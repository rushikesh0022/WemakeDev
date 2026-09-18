import { Suspense } from "react";
import { SearchExperience } from "@/components/SearchExperience";

export default function SearchPage() {
  return <Suspense fallback={<div className="page-loading">Preparing the local store…</div>}><SearchExperience /></Suspense>;
}
