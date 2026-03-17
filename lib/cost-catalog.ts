import "server-only";

import { DEFAULT_DESIGN_ID } from "@/lib/design-catalog";

type CostTableData = {
  headers: string[];
  rows: string[][];
};

type NumericColumn =
  | "Material"
  | "Waste"
  | "Processing"
  | "Labour"
  | "Machine"
  | "Consumables"
  | "Bought-out / Vendor"
  | "Inbound Freight"
  | "Duty / Tariff"
  | "Quality Rejection";

type CostOverrides = Record<string, Partial<Record<NumericColumn, number>>>;

const headers = [
  "Component Group",
  "Component",
  "Material",
  "Waste",
  "Processing",
  "Labour",
  "Machine",
  "Consumables",
  "Bought-out / Vendor",
  "Inbound Freight",
  "Duty / Tariff",
  "Quality Rejection",
  "Row Total",
];

const baseRows = [
  ["Upper", "Toe overlay / mudguard", "0.6", "0.06", "0.04", "0.1", "0.03", "0.01", "0.0", "0.01", "0.01", "0.01", "0.87"],
  ["Upper", "Vamp", "0.39", "0.04", "0.02", "0.08", "0.03", "0.01", "0.0", "0.01", "0.01", "0.01", "0.6"],
  ["Upper", "Quarter panel – lateral", "0.68", "0.07", "0.04", "0.12", "0.04", "0.01", "0.0", "0.01", "0.01", "0.01", "0.99"],
  ["Upper", "Quarter panel – medial", "0.65", "0.06", "0.04", "0.11", "0.04", "0.01", "0.0", "0.01", "0.01", "0.01", "0.94"],
  ["Upper", "Eyestay / lace stay", "0.34", "0.03", "0.02", "0.07", "0.02", "0.01", "0.0", "0.01", "0.01", "0.01", "0.52"],
  ["Upper", "Side overlay / logo form", "0.24", "0.03", "0.04", "0.05", "0.02", "0.01", "0.0", "0.01", "0.0", "0.01", "0.41"],
  ["Upper", "Collar panel", "0.28", "0.03", "0.02", "0.06", "0.02", "0.01", "0.0", "0.01", "0.0", "0.01", "0.44"],
  ["Upper", "Heel overlay", "0.27", "0.03", "0.02", "0.06", "0.02", "0.01", "0.0", "0.01", "0.0", "0.01", "0.43"],
  ["Upper", "Tongue top", "0.4", "0.04", "0.02", "0.08", "0.03", "0.01", "0.0", "0.01", "0.01", "0.01", "0.61"],
  ["Upper", "Tongue lining", "0.15", "0.02", "0.01", "0.04", "0.01", "0.01", "0.0", "0.0", "0.0", "0.0", "0.24"],
  ["Upper", "Collar lining", "0.2", "0.02", "0.01", "0.05", "0.02", "0.01", "0.0", "0.0", "0.0", "0.01", "0.32"],
  ["Upper", "Foam padding – tongue & collar", "0.18", "0.02", "0.01", "0.04", "0.01", "0.01", "0.0", "0.0", "0.0", "0.0", "0.27"],
  ["Upper", "Toe puff", "0.1", "0.01", "0.01", "0.02", "0.01", "0.0", "0.0", "0.0", "0.0", "0.0", "0.15"],
  ["Upper", "Heel counter", "0.14", "0.01", "0.01", "0.03", "0.01", "0.0", "0.0", "0.0", "0.0", "0.0", "0.2"],
  ["Closure", "Laces", "0.24", "0.01", "0.0", "0.03", "0.01", "0.0", "0.08", "0.0", "0.0", "0.0", "0.37"],
  ["Closure", "Eyelets / top eyelet", "0.08", "0.0", "0.01", "0.01", "0.01", "0.0", "0.02", "0.0", "0.0", "0.0", "0.13"],
  ["Closure", "Aglets", "0.02", "0.0", "0.0", "0.0", "0.0", "0.0", "0.01", "0.0", "0.0", "0.0", "0.03"],
  ["Branding / Trim", "Tongue label", "0.03", "0.0", "0.01", "0.01", "0.0", "0.0", "0.02", "0.0", "0.0", "0.0", "0.07"],
  ["Branding / Trim", "Heel logo / branding patch", "0.04", "0.0", "0.01", "0.01", "0.01", "0.0", "0.03", "0.0", "0.0", "0.0", "0.1"],
  ["Internal", "Sockliner / footbed", "0.52", "0.04", "0.02", "0.06", "0.02", "0.01", "0.05", "0.01", "0.01", "0.01", "0.75"],
  ["Internal", "Strobel board / cloth", "0.2", "0.02", "0.01", "0.04", "0.01", "0.01", "0.0", "0.0", "0.0", "0.0", "0.29"],
  ["Internal", "Insole board / lasting board", "0.16", "0.01", "0.01", "0.03", "0.01", "0.0", "0.0", "0.0", "0.0", "0.0", "0.22"],
  ["Bottom", "Midsole wedge – top layer", "1.28", "0.1", "0.11", "0.15", "0.08", "0.02", "0.06", "0.03", "0.04", "0.03", "1.9"],
  ["Bottom", "Midsole wedge – bottom layer", "1.02", "0.08", "0.09", "0.13", "0.06", "0.02", "0.05", "0.02", "0.03", "0.02", "1.52"],
  ["Bottom", "Outsole", "2.14", "0.16", "0.14", "0.32", "0.11", "0.03", "0.12", "0.04", "0.07", "0.04", "3.17"],
  ["Bottom", "Heel wedge / stabilizer", "0.26", "0.02", "0.02", "0.04", "0.02", "0.01", "0.02", "0.01", "0.01", "0.0", "0.41"],
  ["Consumables", "Thread", "0.06", "0.0", "0.0", "0.0", "0.0", "0.02", "0.0", "0.0", "0.0", "0.0", "0.08"],
  ["Consumables", "Adhesives / cement / primer", "0.18", "0.02", "0.0", "0.03", "0.01", "0.09", "0.0", "0.0", "0.0", "0.01", "0.34"],
  ["Packaging", "Shoe box", "0.49", "0.02", "0.0", "0.03", "0.01", "0.01", "0.09", "0.01", "0.01", "0.01", "0.68"],
  ["Packaging", "Tissue / stuffing / tags / stickers", "0.16", "0.01", "0.0", "0.02", "0.0", "0.01", "0.04", "0.0", "0.0", "0.0", "0.24"],
  ["Packaging", "Master carton allocation", "0.1", "0.0", "0.0", "0.01", "0.0", "0.0", "0.03", "0.0", "0.0", "0.0", "0.14"],
  ["Logistics & Import", "Factory inland + export docs allocation", "0.0", "0.0", "0.0", "0.0", "0.0", "0.0", "0.23", "0.05", "0.0", "0.0", "0.28"],
  ["Logistics & Import", "International freight + insurance", "0.0", "0.0", "0.0", "0.0", "0.0", "0.0", "0.21", "0.16", "0.0", "0.0", "0.37"],
  ["Logistics & Import", "Import duty + customs + destination inland", "0.0", "0.0", "0.0", "0.0", "0.0", "0.0", "0.05", "0.02", "0.34", "0.0", "0.41"],
];

const designOverrides: Record<string, CostOverrides> = {
  MSK069: {},
  RIV112: {
    Vamp: { Material: 0.47, Waste: 0.05 },
    "Quarter panel – lateral": { Material: 0.74, Waste: 0.07, Labour: 0.13 },
    "Quarter panel – medial": { Material: 0.72, Waste: 0.07, Labour: 0.12 },
    "Eyestay / lace stay": { Material: 0.38, Processing: 0.03 },
    "Side overlay / logo form": { Material: 0.31, Processing: 0.05, Machine: 0.03 },
    "Collar panel": { Material: 0.32, Labour: 0.07 },
    "Heel overlay": { Material: 0.3, Labour: 0.07 },
    "Tongue top": { Material: 0.43, Waste: 0.05 },
    Laces: { Material: 0.22, "Bought-out / Vendor": 0.09 },
    "Heel logo / branding patch": { Material: 0.05, "Bought-out / Vendor": 0.04 },
    "Midsole wedge – top layer": { Material: 1.22, Processing: 0.1, Labour: 0.14 },
    "Midsole wedge – bottom layer": { Material: 0.96, Processing: 0.08, Labour: 0.12 },
    Outsole: { Material: 2.08, Waste: 0.14, Labour: 0.28 },
    "Heel wedge / stabilizer": { Material: 0.22, Labour: 0.03 },
    "International freight + insurance": { "Bought-out / Vendor": 0.19, "Inbound Freight": 0.14 },
    "Import duty + customs + destination inland": { "Bought-out / Vendor": 0.05, "Inbound Freight": 0.02, "Duty / Tariff": 0.3 },
  },
  ARC204: {
    "Toe overlay / mudguard": { Material: 0.64, Processing: 0.05 },
    Vamp: { Material: 0.45, Waste: 0.05 },
    "Quarter panel – lateral": { Material: 0.79, Waste: 0.08, Labour: 0.13 },
    "Quarter panel – medial": { Material: 0.76, Waste: 0.07, Labour: 0.12 },
    "Eyestay / lace stay": { Material: 0.4, Processing: 0.03, Labour: 0.08 },
    "Side overlay / logo form": { Material: 0.42, Waste: 0.04, Processing: 0.05, Machine: 0.05, "Bought-out / Vendor": 0.02 },
    "Collar panel": { Material: 0.31, Labour: 0.07 },
    "Heel overlay": { Material: 0.31, Labour: 0.07 },
    "Tongue top": { Material: 0.42, Waste: 0.04, Processing: 0.03 },
    Laces: { Material: 0.26, "Bought-out / Vendor": 0.09 },
    "Tongue label": { Material: 0.04, "Bought-out / Vendor": 0.03 },
    "Heel logo / branding patch": { Material: 0.06, "Bought-out / Vendor": 0.04 },
    "Midsole wedge – top layer": { Material: 1.35, Waste: 0.11, Processing: 0.13, Labour: 0.16, Machine: 0.09 },
    "Midsole wedge – bottom layer": { Material: 1.08, Waste: 0.09, Processing: 0.1, Labour: 0.14, Machine: 0.07 },
    Outsole: { Material: 2.22, Waste: 0.17, Processing: 0.15, Labour: 0.33, Machine: 0.12 },
    "Heel wedge / stabilizer": { Material: 0.31, Processing: 0.03, Labour: 0.05 },
  },
  NVA318: {
    "Toe overlay / mudguard": { Material: 0.56, Waste: 0.05, Labour: 0.09 },
    Vamp: { Material: 0.44, Waste: 0.04, Labour: 0.07 },
    "Quarter panel – lateral": { Material: 0.62, Waste: 0.06, Labour: 0.1 },
    "Quarter panel – medial": { Material: 0.6, Waste: 0.05, Labour: 0.09 },
    "Eyestay / lace stay": { Material: 0.3, Waste: 0.02, Labour: 0.06 },
    "Side overlay / logo form": { Material: 0.2, Processing: 0.03, Labour: 0.04 },
    "Collar panel": { Material: 0.25, Labour: 0.05 },
    "Heel overlay": { Material: 0.22, Labour: 0.05 },
    "Tongue top": { Material: 0.35, Waste: 0.03, Labour: 0.07 },
    "Tongue lining": { Material: 0.13, Labour: 0.03 },
    "Collar lining": { Material: 0.17, Labour: 0.04 },
    Laces: { Material: 0.21, "Bought-out / Vendor": 0.07 },
    "Heel logo / branding patch": { Material: 0.05, "Bought-out / Vendor": 0.03 },
    "Sockliner / footbed": { Material: 0.48, Waste: 0.03, Labour: 0.05, "Bought-out / Vendor": 0.04 },
    "Midsole wedge – top layer": { Material: 1.18, Waste: 0.09, Processing: 0.1, Labour: 0.13, Machine: 0.07 },
    "Midsole wedge – bottom layer": { Material: 0.93, Waste: 0.07, Processing: 0.08, Labour: 0.11, Machine: 0.05 },
    Outsole: { Material: 1.96, Waste: 0.14, Processing: 0.12, Labour: 0.28, Machine: 0.09 },
    "Heel wedge / stabilizer": { Material: 0.2, Labour: 0.03 },
    "Shoe box": { Material: 0.46, "Bought-out / Vendor": 0.08 },
  },
  TRX427: {
    "Toe overlay / mudguard": { Material: 0.74, Waste: 0.07, Processing: 0.05, Labour: 0.11 },
    Vamp: { Material: 0.5, Waste: 0.05, Labour: 0.09 },
    "Quarter panel – lateral": { Material: 0.83, Waste: 0.08, Labour: 0.14 },
    "Quarter panel – medial": { Material: 0.79, Waste: 0.08, Labour: 0.13 },
    "Eyestay / lace stay": { Material: 0.41, Processing: 0.03, Labour: 0.08 },
    "Side overlay / logo form": { Material: 0.35, Processing: 0.05, Labour: 0.06 },
    "Collar panel": { Material: 0.34, Waste: 0.04, Labour: 0.07 },
    "Heel overlay": { Material: 0.33, Waste: 0.04, Labour: 0.07 },
    "Tongue top": { Material: 0.44, Waste: 0.05, Labour: 0.09 },
    "Tongue lining": { Material: 0.18, Labour: 0.05 },
    "Collar lining": { Material: 0.24, Labour: 0.06 },
    Laces: { Material: 0.28, "Bought-out / Vendor": 0.1 },
    "Eyelets / top eyelet": { Material: 0.1, "Bought-out / Vendor": 0.03 },
    "Sockliner / footbed": { Material: 0.56, Waste: 0.05, Labour: 0.07, "Bought-out / Vendor": 0.06 },
    "Midsole wedge – top layer": { Material: 1.42, Waste: 0.12, Processing: 0.13, Labour: 0.17, Machine: 0.09, "Bought-out / Vendor": 0.07 },
    "Midsole wedge – bottom layer": { Material: 1.16, Waste: 0.1, Processing: 0.11, Labour: 0.15, Machine: 0.07, "Bought-out / Vendor": 0.06 },
    Outsole: { Material: 2.52, Waste: 0.18, Processing: 0.17, Labour: 0.36, Machine: 0.13, "Bought-out / Vendor": 0.14, "Inbound Freight": 0.05, "Duty / Tariff": 0.08 },
    "Heel wedge / stabilizer": { Material: 0.38, Processing: 0.03, Labour: 0.05 },
    "International freight + insurance": { "Bought-out / Vendor": 0.24, "Inbound Freight": 0.19 },
    "Import duty + customs + destination inland": { "Bought-out / Vendor": 0.06, "Inbound Freight": 0.03, "Duty / Tariff": 0.36 },
  },
};

function recalculateRowTotal(row: string[]) {
  return row
    .slice(2, headers.length - 1)
    .reduce((sum, value) => sum + Number.parseFloat(value || "0"), 0)
    .toFixed(2);
}

function applyOverrides(rows: string[][], designId: string) {
  const overrides = designOverrides[designId] ?? {};

  return rows.map((row) => {
    const nextRow = [...row];
    const rowOverrides = overrides[row[1]];

    if (!rowOverrides) {
      nextRow[headers.length - 1] = recalculateRowTotal(nextRow);
      return nextRow;
    }

    Object.entries(rowOverrides).forEach(([column, value]) => {
      const index = headers.indexOf(column);
      if (index !== -1) {
        nextRow[index] = value.toFixed(2);
      }
    });

    nextRow[headers.length - 1] = recalculateRowTotal(nextRow);
    return nextRow;
  });
}

function buildTotalRow(rows: string[][]) {
  const totalRow = new Array(headers.length).fill("0.00");
  totalRow[0] = "TOTAL";
  totalRow[1] = "Whole Shoe";

  for (let index = 2; index < headers.length - 1; index += 1) {
    const sum = rows.reduce((acc, row) => acc + Number.parseFloat(row[index] || "0"), 0);
    totalRow[index] = sum.toFixed(2);
  }

  totalRow[headers.length - 1] = rows
    .reduce((acc, row) => acc + Number.parseFloat(row[headers.length - 1] || "0"), 0)
    .toFixed(2);

  return totalRow;
}

export function getCostTableDataForDesign(designId = DEFAULT_DESIGN_ID): CostTableData {
  const rows = applyOverrides(baseRows, designId);
  return {
    headers,
    rows: [...rows, buildTotalRow(rows)],
  };
}
