import { CostEstimator } from "@/components/cost-estimator";
import { DEFAULT_DESIGN_ID } from "@/lib/design-catalog";

export default async function CostPage({
  searchParams,
}: {
  searchParams: Promise<{ design?: string }>;
}) {
  const params = await searchParams;
  const designId = params.design ?? DEFAULT_DESIGN_ID;

  return <CostEstimator designId={designId} />;
}
