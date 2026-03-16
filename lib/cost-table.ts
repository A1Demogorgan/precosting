import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

type CostTableData = {
  headers: string[];
  rows: string[][];
};

export type { CostTableData };

export function getCostTableData(): CostTableData {
  const csvPath = join(process.cwd(), "whole_shoe_component_cost_table.csv");
  const csv = readFileSync(csvPath, "utf8").trim();
  const lines = csv.split(/\r?\n/).filter(Boolean);

  const [headerLine, ...rowLines] = lines;
  const headers = headerLine.split(",").map((value) => value.trim());
  const rows = rowLines.map((line) => line.split(",").map((value) => value.trim()));

  return { headers, rows };
}
