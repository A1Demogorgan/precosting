import "server-only";

import { getCostTableDataForDesign } from "@/lib/cost-catalog";
import { DEFAULT_DESIGN_ID } from "@/lib/design-catalog";

type CostTableData = {
  headers: string[];
  rows: string[][];
};

export type { CostTableData };

export function getCostTableData(designId = DEFAULT_DESIGN_ID): CostTableData {
  return getCostTableDataForDesign(designId);
}
