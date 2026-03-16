import { getCostTableData } from "@/lib/cost-table";
import { CostWorkbench } from "@/components/cost-workbench";

export function CostEstimator() {
  const data = getCostTableData();

  return <CostWorkbench data={data} />;
}
