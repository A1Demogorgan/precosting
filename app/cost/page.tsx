import { CostEstimator } from "@/components/cost-estimator";

export default async function CostPage({
  searchParams,
}: {
  searchParams: Promise<{ design?: string }>;
}) {
  await searchParams;

  return <CostEstimator />;
}
