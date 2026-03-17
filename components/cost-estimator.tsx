import { getCostTableData } from "@/lib/cost-table";
import { CostWorkbench } from "@/components/cost-workbench";

export function CostEstimator({ designId }: { designId: string }) {
  const data = getCostTableData(designId);

  return <CostWorkbench data={data} designId={designId} />;
}
