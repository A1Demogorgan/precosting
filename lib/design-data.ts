import componentShapeMetadataData from "@/data/component-shape-metadata.json";
import {
  baseImages,
  DEFAULT_DESIGN_ID,
  designOptions,
  getDesignComponents,
  getDesignTables,
  type GridTable,
  type SpecBrowserHotspot,
} from "@/lib/design-catalog";

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
  laces: ["shoe lace"],
  "eyelets top eyelet": ["lace eyelet"],
  "heel logo branding patch": ["heel logo"],
  "midsole wedge top": ["midsole wedge top"],
  "midsole wedge top layer": ["midsole wedge top"],
  "midsole wedge bottom": ["midsole wedge bottom"],
  "midsole wedge bottom layer": ["midsole wedge bottom"],
  "sockliner footbed": ["footbed"],
};

export { designOptions };

export function getShoeViews(designId: string) {
  const selectedDesign =
    designOptions.find((design) => design.id === designId) ??
    designOptions.find((design) => design.id === DEFAULT_DESIGN_ID) ??
    designOptions[0];
  const viewOrder: Array<keyof (typeof selectedDesign.viewSrcs)> = [
    "quarter",
    "rear",
    "top",
    "bottom",
  ];

  return baseImages.map((view, index) => ({
    ...view,
    src: selectedDesign.viewSrcs[viewOrder[index]] ?? view.src,
    alt: `${selectedDesign.label} ${view.label.toLowerCase()}`,
    aspectRatio: selectedDesign.viewAspectRatios[viewOrder[index]] ?? 16 / 9,
  }));
}

export function findSpecForCostComponent(
  componentName: string,
  designId = DEFAULT_DESIGN_ID,
) {
  const specBrowserComponents = getDesignComponents(designId);
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
    componentShapeMetadata.find((component) => component.componentNumber === componentNumber) ??
    null
  );
}

export function findShapeMetadataForCostComponent(
  componentName: string,
  designId = DEFAULT_DESIGN_ID,
) {
  const spec = findSpecForCostComponent(componentName, designId);

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

export function getDesignDetails(designId = DEFAULT_DESIGN_ID) {
  const tables = getDesignTables(designId);
  const table = tables.find((entry) => entry.name === "designDetails");

  if (!table || table.type !== "keyValue") {
    return [];
  }

  return table.rows;
}

export function getGridTable(name: string, designId = DEFAULT_DESIGN_ID) {
  const tables = getDesignTables(designId);
  const table = tables.find((entry) => entry.name === name);

  if (!table || table.type !== "grid") {
    return null;
  }

  return table;
}

export function findSpecRow(componentType: string, designId = DEFAULT_DESIGN_ID) {
  const tables = getDesignTables(designId);
  const gridTables = tables.filter(
    (entry): entry is GridTable => entry.type === "grid",
  );

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

export function getSpecComponent(number: number, designId = DEFAULT_DESIGN_ID) {
  const specBrowserComponents = getDesignComponents(designId);
  return specBrowserComponents.find((component) => component.number === number) ?? null;
}

export function resolveHotspotComponent(
  hotspot: SpecBrowserHotspot,
  designId = DEFAULT_DESIGN_ID,
) {
  const base = getSpecComponent(hotspot.number, designId);

  if (!base) {
    return null;
  }

  return {
    ...base,
    ...(hotspot.group ? { group: hotspot.group } : {}),
    ...(base.componentType ? {} : hotspot.componentType ? { componentType: hotspot.componentType } : {}),
    ...(base.componentSpecification
      ? {}
      : hotspot.componentSpecification
        ? { componentSpecification: hotspot.componentSpecification }
        : {}),
    ...(base.color ? {} : hotspot.color ? { color: hotspot.color } : {}),
    ...(base.ref ? {} : hotspot.ref ? { ref: hotspot.ref } : {}),
    ...(base.supplier ? {} : hotspot.supplier ? { supplier: hotspot.supplier } : {}),
  };
}
