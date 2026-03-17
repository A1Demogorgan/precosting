import designData from "@/data/design.json";
import specBrowserData from "@/data/spec-browser.json";
import componentShapeMetadataData from "@/data/component-shape-metadata.json";

type TableRow = Record<string, string>;

type GridTable = {
  name: string;
  type: "grid";
  columns: string[];
  rows: TableRow[];
  notes?: string;
};

type KeyValueTable = {
  name: string;
  type: "keyValue";
  rows: Array<{ field: string; value: string }>;
};

const tables = designData.tables as Array<GridTable | KeyValueTable>;

export const designOptions = [
  { id: "MSK069", label: "Sneaker Factory Jogger", season: "Spring 2025" },
  { id: "RIV112", label: "Riverline Trainer Pro", season: "Fall 2025" },
  { id: "ARC204", label: "Arc Runner Evo 2", season: "Winter 2025" },
  { id: "NVA318", label: "Nova Glide Elite", season: "Spring 2026" },
  { id: "TRX427", label: "Trailstar Motion X", season: "Summer 2026" },
];

type SpecBrowserComponent = {
  number: number;
  group: string;
  componentType: string;
  componentSpecification: string;
  color: string;
  ref: string;
  supplier: string;
};

type SpecBrowserHotspot = {
  number: number;
  top: string;
  left: string;
  componentType?: string;
  componentSpecification?: string;
  color?: string;
  ref?: string;
  supplier?: string;
  group?: string;
};

type SpecBrowserImage = {
  src: string;
  alt: string;
  label: string;
  hotspots: SpecBrowserHotspot[];
};

type ShapeMetadataComponent = {
  componentNumber: number;
  componentType: string;
  group: string;
  componentSpecification: string;
  shapeFamily: string;
  sizeClass: string;
  symmetry: string;
  dimensionalIntent: {
    relativeLength: string;
    relativeWidth: string;
    relativeThickness: string;
  };
  viewMetadata: Record<
    string,
    | {
        visible: boolean | string;
        anchorPct?: { x: number; y: number };
        estimatedFootprintPct?: { width: number; height: number };
        shapeNotes?: string;
      }
    | undefined
  >;
  confidence: string;
};

export const shoeViews = specBrowserData.images as SpecBrowserImage[];
export const specBrowserComponents =
  specBrowserData.components as SpecBrowserComponent[];
const componentShapeMetadata =
  componentShapeMetadataData.components as ShapeMetadataComponent[];

function normalizeComponentName(value: string) {
  return value
    .toLowerCase()
    .replace(/[–—-]/g, " ")
    .replace(/[&/]/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\btop layer\b/g, "top")
    .replace(/\bbottom layer\b/g, "bottom")
    .replace(/\b(lateral|medial)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const costComponentAliases: Record<string, string[]> = {
  "toe overlay mudguard": ["toe top mudguard"],
  "quarter panel": ["quarter", "quarter eyerow"],
  "eyestay lace stay": ["eyerow", "quarter eyerow"],
  "tongue top": ["tongue"],
  "tongue lining": ["tongue lining"],
  "collar lining": ["heel lining", "collar panel"],
  "foam padding tongue collar": ["tongue foam"],
  "laces": ["shoe lace"],
  "eyelets top eyelet": ["lace eyelet"],
  "heel logo branding patch": ["heel logo"],
  "midsole wedge top": ["midsole wedge top"],
  "midsole wedge top layer": ["midsole wedge top"],
  "midsole wedge bottom": ["midsole wedge bottom"],
  "midsole wedge bottom layer": ["midsole wedge bottom"],
  "sockliner footbed": ["footbed"],
};

export function findSpecForCostComponent(componentName: string) {
  const normalizedCostName = normalizeComponentName(componentName);
  const candidates = [normalizedCostName, ...(costComponentAliases[normalizedCostName] ?? [])];

  return (
    specBrowserComponents.find((component) => {
      const normalizedSpecName = normalizeComponentName(component.componentType);
      return candidates.some(
        (candidate) =>
          normalizedSpecName === candidate ||
          normalizedSpecName.includes(candidate) ||
          candidate.includes(normalizedSpecName),
      );
    }) ?? null
  );
}

export function getShapeMetadataByComponentNumber(componentNumber: number) {
  return (
    componentShapeMetadata.find((component) => component.componentNumber === componentNumber) ?? null
  );
}

export function findShapeMetadataForCostComponent(componentName: string) {
  const spec = findSpecForCostComponent(componentName);

  if (spec) {
    const byNumber = getShapeMetadataByComponentNumber(spec.number);

    if (byNumber) {
      return byNumber;
    }
  }

  const normalizedCostName = normalizeComponentName(componentName);
  const candidates = [normalizedCostName, ...(costComponentAliases[normalizedCostName] ?? [])];

  return (
    componentShapeMetadata.find((component) => {
      const normalizedShapeName = normalizeComponentName(component.componentType);
      return candidates.some(
        (candidate) =>
          normalizedShapeName === candidate ||
          normalizedShapeName.includes(candidate) ||
          candidate.includes(normalizedShapeName),
      );
    }) ?? null
  );
}

export function getDesignDetails() {
  const table = tables.find((entry) => entry.name === "designDetails");

  if (!table || table.type !== "keyValue") {
    return [];
  }

  return table.rows;
}

export function getGridTable(name: string) {
  const table = tables.find((entry) => entry.name === name);

  if (!table || table.type !== "grid") {
    return null;
  }

  return table;
}

export function findSpecRow(componentType: string) {
  const gridTables = tables.filter((entry): entry is GridTable => entry.type === "grid");

  for (const table of gridTables) {
    const row = table.rows.find((item) => item.componentType === componentType);

    if (row) {
      return {
        table: table.name,
        tableNotes: table.notes ?? "",
        row,
      };
    }
  }

  return null;
}

export function getSpecComponent(number: number) {
  return specBrowserComponents.find((component) => component.number === number) ?? null;
}

export function resolveHotspotComponent(hotspot: SpecBrowserHotspot) {
  const base = getSpecComponent(hotspot.number);

  if (!base) {
    return null;
  }

  return {
    ...base,
    ...(hotspot.group ? { group: hotspot.group } : {}),
    ...(hotspot.componentType ? { componentType: hotspot.componentType } : {}),
    ...(hotspot.componentSpecification
      ? { componentSpecification: hotspot.componentSpecification }
      : {}),
    ...(hotspot.color ? { color: hotspot.color } : {}),
    ...(hotspot.ref ? { ref: hotspot.ref } : {}),
    ...(hotspot.supplier ? { supplier: hotspot.supplier } : {}),
  };
}

type CostRow = {
  group: string;
  component: string;
  material: number;
  waste: number;
  processing: number;
  labour: number;
  machine: number;
  consumables: number;
  boughtOut: number;
  inbound: number;
  duty: number;
  quality: number;
};

const costRows: CostRow[] = [
  {
    group: "Upper",
    component: "Toe overlay / mudguard",
    material: 0.6,
    waste: 0.06,
    processing: 0.04,
    labour: 0.1,
    machine: 0.03,
    consumables: 0.01,
    boughtOut: 0,
    inbound: 0.01,
    duty: 0.01,
    quality: 0.01,
  },
  {
    group: "Upper",
    component: "Vamp",
    material: 0.39,
    waste: 0.04,
    processing: 0.02,
    labour: 0.08,
    machine: 0.03,
    consumables: 0.01,
    boughtOut: 0,
    inbound: 0.01,
    duty: 0.01,
    quality: 0.01,
  },
  {
    group: "Upper",
    component: "Quarter panel",
    material: 0.68,
    waste: 0.07,
    processing: 0.04,
    labour: 0.12,
    machine: 0.04,
    consumables: 0.01,
    boughtOut: 0,
    inbound: 0.01,
    duty: 0.01,
    quality: 0.01,
  },
  {
    group: "Upper",
    component: "Tongue top",
    material: 0.4,
    waste: 0.04,
    processing: 0.02,
    labour: 0.08,
    machine: 0.03,
    consumables: 0.01,
    boughtOut: 0,
    inbound: 0.01,
    duty: 0,
    quality: 0.01,
  },
  {
    group: "Closure",
    component: "Laces + top eyelet",
    material: 0.32,
    waste: 0.01,
    processing: 0.01,
    labour: 0.04,
    machine: 0.01,
    consumables: 0,
    boughtOut: 0.1,
    inbound: 0,
    duty: 0,
    quality: 0,
  },
  {
    group: "Internal",
    component: "Sockliner / footbed",
    material: 0.52,
    waste: 0.04,
    processing: 0.02,
    labour: 0.06,
    machine: 0.02,
    consumables: 0.01,
    boughtOut: 0.05,
    inbound: 0.01,
    duty: 0.01,
    quality: 0.01,
  },
  {
    group: "Bottom",
    component: "Midsole wedge top layer",
    material: 1.28,
    waste: 0.1,
    processing: 0.11,
    labour: 0.15,
    machine: 0.08,
    consumables: 0.02,
    boughtOut: 0.06,
    inbound: 0.03,
    duty: 0.04,
    quality: 0.03,
  },
  {
    group: "Bottom",
    component: "Midsole wedge bottom layer",
    material: 1.02,
    waste: 0.08,
    processing: 0.09,
    labour: 0.13,
    machine: 0.06,
    consumables: 0.02,
    boughtOut: 0.05,
    inbound: 0.02,
    duty: 0.03,
    quality: 0.02,
  },
  {
    group: "Bottom",
    component: "Outsole",
    material: 2.14,
    waste: 0.16,
    processing: 0.14,
    labour: 0.32,
    machine: 0.11,
    consumables: 0.03,
    boughtOut: 0.12,
    inbound: 0.04,
    duty: 0.07,
    quality: 0.04,
  },
  {
    group: "Consumables",
    component: "Thread + cement / primer",
    material: 0.24,
    waste: 0.02,
    processing: 0,
    labour: 0.03,
    machine: 0.01,
    consumables: 0.11,
    boughtOut: 0,
    inbound: 0,
    duty: 0,
    quality: 0.01,
  },
  {
    group: "Packaging",
    component: "Shoe box",
    material: 0.49,
    waste: 0.02,
    processing: 0,
    labour: 0.03,
    machine: 0.01,
    consumables: 0.01,
    boughtOut: 0.09,
    inbound: 0.01,
    duty: 0.01,
    quality: 0.01,
  },
  {
    group: "Packaging",
    component: "Tissue + tags / stickers",
    material: 0.16,
    waste: 0.01,
    processing: 0,
    labour: 0.02,
    machine: 0,
    consumables: 0.01,
    boughtOut: 0.04,
    inbound: 0,
    duty: 0,
    quality: 0,
  },
  {
    group: "Logistics & Import",
    component: "Factory inland + export docs",
    material: 0,
    waste: 0,
    processing: 0,
    labour: 0,
    machine: 0,
    consumables: 0,
    boughtOut: 0.23,
    inbound: 0.05,
    duty: 0,
    quality: 0,
  },
  {
    group: "Logistics & Import",
    component: "International freight + insurance",
    material: 0,
    waste: 0,
    processing: 0,
    labour: 0,
    machine: 0,
    consumables: 0,
    boughtOut: 0.21,
    inbound: 0.16,
    duty: 0,
    quality: 0,
  },
];

export function getCostRows() {
  return costRows.map((row) => ({
    ...row,
    rowTotal: Object.values(row)
      .filter((value): value is number => typeof value === "number")
      .reduce((sum, value) => sum + value, 0),
  }));
}

export function getCostSummary() {
  const rows = getCostRows();
  const totals = rows.reduce(
    (acc, row) => {
      acc.material += row.material;
      acc.waste += row.waste;
      acc.rowTotal += row.rowTotal;
      return acc;
    },
    { material: 0, waste: 0, rowTotal: 0 },
  );

  return {
    material: totals.material,
    waste: totals.waste,
    landed: totals.rowTotal,
  };
}
