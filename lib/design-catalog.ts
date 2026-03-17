import baseDesignData from "@/data/design.json";
import baseSpecBrowserData from "@/data/spec-browser.json";

export type TableRow = Record<string, string>;

export type GridTable = {
  name: string;
  type: "grid";
  columns: string[];
  rows: TableRow[];
  notes?: string;
};

export type KeyValueTable = {
  name: string;
  type: "keyValue";
  rows: Array<{ field: string; value: string }>;
};

export type DesignTable = GridTable | KeyValueTable;

export type SpecBrowserComponent = {
  number: number;
  group: string;
  componentType: string;
  componentSpecification: string;
  color: string;
  ref: string;
  supplier: string;
};

export type SpecBrowserHotspot = {
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

export type SpecBrowserImage = {
  src: string;
  alt: string;
  label: string;
  hotspots: SpecBrowserHotspot[];
};

export type DesignOption = {
  id: string;
  label: string;
  season: string;
  viewSrcs: {
    quarter: string;
    rear: string;
    top: string;
    bottom: string;
  };
  viewAspectRatios: {
    quarter: number;
    rear: number;
    top: number;
    bottom: number;
  };
};

type DesignProfile = {
  option: DesignOption;
  detailOverrides: Record<string, string>;
  componentOverrides: Record<number, Partial<SpecBrowserComponent>>;
  tableOverrides?: Record<string, Record<string, Partial<TableRow>>>;
};

export const DEFAULT_DESIGN_ID = "MSK069";

const baseTables = structuredClone(baseDesignData.tables) as DesignTable[];
const baseComponents = structuredClone(
  baseSpecBrowserData.components,
) as SpecBrowserComponent[];
export const baseImages = baseSpecBrowserData.images as SpecBrowserImage[];

export const designOptions: DesignOption[] = [
  {
    id: "MSK069",
    label: "Sneaker Factory Jogger",
    season: "Spring 2025",
    viewSrcs: {
      quarter: "/1.png",
      rear: "/3.png",
      top: "/4.png",
      bottom: "/5.png",
    },
    viewAspectRatios: {
      quarter: 16 / 9,
      rear: 16 / 9,
      top: 16 / 9,
      bottom: 16 / 9,
    },
  },
  {
    id: "RIV112",
    label: "Riverline Trainer Pro",
    season: "Fall 2025",
    viewSrcs: {
      quarter: "/design-riv112-quarter.png",
      rear: "/design-riv112-rear.png",
      top: "/design-riv112-top.png",
      bottom: "/design-riv112-bottom.png",
    },
    viewAspectRatios: {
      quarter: 16 / 9,
      rear: 16 / 9,
      top: 1,
      bottom: 16 / 9,
    },
  },
  {
    id: "ARC204",
    label: "Arc Runner Evo 2",
    season: "Winter 2025",
    viewSrcs: {
      quarter: "/design-arc204-quarter.png",
      rear: "/design-arc204-rear.png",
      top: "/design-arc204-top.png",
      bottom: "/design-arc204-bottom.png",
    },
    viewAspectRatios: {
      quarter: 16 / 9,
      rear: 1,
      top: 1,
      bottom: 16 / 9,
    },
  },
  {
    id: "NVA318",
    label: "Nova Glide Elite",
    season: "Spring 2026",
    viewSrcs: {
      quarter: "/design-nva318-quarter.png",
      rear: "/design-nva318-rear.png",
      top: "/design-nva318-top.png",
      bottom: "/design-nva318-bottom.png",
    },
    viewAspectRatios: {
      quarter: 16 / 9,
      rear: 1,
      top: 16 / 9,
      bottom: 16 / 9,
    },
  },
  {
    id: "TRX427",
    label: "Trailstar Motion X",
    season: "Summer 2026",
    viewSrcs: {
      quarter: "/design-trx427-quarter.png",
      rear: "/design-trx427-rear.png",
      top: "/design-trx427-top.png",
      bottom: "/design-trx427-bottom.png",
    },
    viewAspectRatios: {
      quarter: 16 / 9,
      rear: 16 / 9,
      top: 16 / 9,
      bottom: 16 / 9,
    },
  },
];

const designProfiles: Record<string, DesignProfile> = {
  MSK069: {
    option: designOptions[0],
    detailOverrides: {
      "Project Name": "Sneaker Factory Jogger",
      Factory: "Houjie #1",
      "Prototype ID": "MSK069",
      Season: "Spring 2025",
      Division: "Running",
      "Color Description": "WHITE / SUN YELLOW / CHARCOAL",
      "Country of Origin": "China",
      Construction: "Cold Cement",
      "Gender/Size": "M'S 9#",
      SizeRun: "5-14",
      "Last Code": "SFX-6000",
      "O/S Code": "LF_204",
      Status: "PHOTO SAMPLE",
    },
    componentOverrides: {
      2: { color: "Sun Yellow" },
      10: { color: "Sun Yellow" },
      12: { color: "Sun Yellow" },
      13: { color: "Charcoal Grey" },
      20: { color: "Grey" },
      22: { color: "Grey" },
    },
  },
  RIV112: {
    option: designOptions[1],
    detailOverrides: {
      "Project Name": "Riverline Trainer Pro",
      Factory: "Fujian Run #2",
      "Prototype ID": "RIV112",
      Season: "Fall 2025",
      Division: "Road Running",
      "Color Description": "NAVY / ICE BLUE / SILVER",
      "Country of Origin": "Vietnam",
      Construction: "Cold Cement",
      "Gender/Size": "M'S 9#",
      SizeRun: "6-13",
      "Last Code": "RIV-12",
      "O/S Code": "RD_112",
      Status: "DEVELOPMENT",
    },
    componentOverrides: {
      1: {
        componentSpecification: "0.9mm no-sew TPU film + fused support frame",
        color: "Navy",
        supplier: "Nan-Ya",
      },
      2: {
        componentSpecification: "Engineered jacquard mesh with mono backing",
        color: "Deep Cobalt",
        supplier: "Cosmo HK",
      },
      3: {
        componentType: "Eyerow",
        componentSpecification: "No-sew support film with reflective edge print",
        color: "Navy",
        supplier: "Nan-Ya",
      },
      4: {
        componentSpecification: "Mono mesh tongue with thin foam core",
        color: "Navy",
      },
      5: {
        componentSpecification: "Reflective riverline tongue print",
        color: "Silver",
      },
      7: {
        componentSpecification: "Molded top eyelet in matte gunmetal",
        color: "Gunmetal",
      },
      8: {
        componentSpecification: "7mm flat performance lace",
        color: "Navy",
        supplier: "Pahio",
      },
      10: {
        componentSpecification: "Engineered jacquard quarter with fused underlay",
        color: "Deep Cobalt",
      },
      11: {
        componentSpecification: "Reflective heel print with riverline icon",
        color: "Silver",
      },
      12: {
        componentSpecification: "Engineered jacquard collar panel",
        color: "Deep Cobalt",
      },
      13: {
        componentSpecification: "Injected heel clip with external stabilizer ribs",
        color: "Navy",
      },
      14: {
        componentSpecification: "Synthetic collar underlay with reflective edge trim",
        color: "Silver",
      },
      15: {
        componentSpecification: "Moisture-wicking tricot lining",
        color: "Midnight Navy",
      },
      16: {
        componentSpecification: "Riverline insole print, heat transfer",
        color: "Ice Blue / White",
      },
      20: {
        componentSpecification: "External heel carrier for rear-foot stability",
        color: "Navy",
      },
      21: {
        componentSpecification: "Compression molded EVA top carrier, responsive road compound",
        color: "White",
      },
      22: {
        componentSpecification: "Lightweight EVA bottom wedge with rebound insert",
        color: "Ice Blue",
      },
      23: {
        componentSpecification: "Road traction outsole with segmented forefoot rubber",
        color: "Navy",
      },
      24: {
        componentSpecification: "Visible EVA midsole carrier with sculpted heel bevel",
        color: "White",
      },
      25: {
        componentSpecification: "Midfoot traction insert with aqua grip compound",
        color: "Ice Blue",
      },
    },
  },
  ARC204: {
    option: designOptions[2],
    detailOverrides: {
      "Project Name": "Arc Runner Evo 2",
      Factory: "Dongguan Sprint Studio",
      "Prototype ID": "ARC204",
      Season: "Winter 2025",
      Division: "Performance Running",
      "Color Description": "GRAPHITE / LIME / COOL GREY",
      "Country of Origin": "Vietnam",
      Construction: "Cold Cement",
      "Gender/Size": "M'S 9#",
      SizeRun: "6-13",
      "Last Code": "ARC-EVO",
      "O/S Code": "AR_204",
      Status: "DEVELOPMENT",
    },
    componentOverrides: {
      1: {
        componentSpecification: "Printed synthetic mudguard with angular fused toe cap",
        color: "Graphite",
      },
      2: {
        componentSpecification: "Open performance mesh with engineered support zones",
        color: "Cool Grey",
      },
      3: {
        componentSpecification: "Angular eyestay with welded support frame",
        color: "Graphite",
      },
      4: {
        componentSpecification: "Perforated tongue with notch collar top",
        color: "Graphite",
      },
      5: {
        componentSpecification: "Lime reflective tongue badge",
        color: "Lime",
      },
      7: {
        componentSpecification: "Top eyelet reinforcement with molded anchor ring",
        color: "Black",
      },
      8: {
        componentSpecification: "6mm engineered flat lace",
        color: "Graphite",
      },
      10: {
        componentSpecification: "Open mesh quarter with neon welded arc overlay",
        color: "Cool Grey",
      },
      11: {
        componentSpecification: "ARC heel wordmark print",
        color: "Lime",
      },
      12: {
        componentSpecification: "Mesh collar panel with molded heel support wing",
        color: "Cool Grey",
      },
      13: {
        componentSpecification: "Sculpted heel frame with split-density support fins",
        color: "Graphite",
      },
      14: {
        componentSpecification: "Synthetic underlay with neon trim edge",
        color: "Lime",
      },
      15: {
        componentSpecification: "Comfort tricot lining with anti-slip print",
        color: "Dark Grey",
      },
      16: {
        componentSpecification: "ARC insole graphic print",
        color: "Lime / Black",
      },
      20: {
        componentSpecification: "Injected rear stabilizer clip with arc geometry",
        color: "Graphite",
      },
      21: {
        componentSpecification: "High-rebound EVA top carrier with rocker profile",
        color: "White",
      },
      22: {
        componentSpecification: "Bottom wedge with neon strike line insert",
        color: "Lime",
      },
      23: {
        componentSpecification: "Rubber outsole with segmented road lugs",
        color: "Graphite / Lime",
      },
      24: {
        componentSpecification: "Sculpted midsole carrier visible through outsole window",
        color: "White",
      },
      25: {
        componentSpecification: "Midfoot insert with lime traction compound",
        color: "Lime",
      },
    },
  },
  NVA318: {
    option: designOptions[3],
    detailOverrides: {
      "Project Name": "Nova Glide Elite",
      Factory: "Binh Duong Light Run",
      "Prototype ID": "NVA318",
      Season: "Spring 2026",
      Division: "Women's Running",
      "Color Description": "PEARL / SOFT CORAL / SILVER",
      "Country of Origin": "Vietnam",
      Construction: "Cold Cement",
      "Gender/Size": "W'S 7#",
      SizeRun: "5-11",
      "Last Code": "NVA-318",
      "O/S Code": "NG_318",
      Status: "DEVELOPMENT",
    },
    componentOverrides: {
      1: {
        componentSpecification: "Thin printed synthetic mudguard with soft flex edge",
        color: "Pearl White",
      },
      2: {
        componentSpecification: "Breathable knit mesh with open forefoot zones",
        color: "Pearl White",
      },
      3: {
        componentSpecification: "Soft eyestay overlay with printed silver edge",
        color: "Silver",
      },
      4: {
        componentSpecification: "Lightweight stretch tongue with brushed backing",
        color: "Pearl White",
      },
      5: {
        componentSpecification: "Nova heat-transfer tongue mark",
        color: "Coral",
      },
      7: {
        componentSpecification: "Minimal reinforced eyelet anchor",
        color: "Silver",
      },
      8: {
        componentSpecification: "6mm comfort flat lace",
        color: "White",
      },
      10: {
        componentSpecification: "Knit quarter with silver support print",
        color: "Pearl White",
      },
      11: {
        componentSpecification: "Soft coral heel brand print",
        color: "Coral",
      },
      12: {
        componentSpecification: "Padded knit collar panel",
        color: "Pearl White",
      },
      13: {
        componentSpecification: "Lightweight heel clip with soft-touch finish",
        color: "Silver",
      },
      14: {
        componentSpecification: "Microfiber collar underlay",
        color: "Silver Grey",
      },
      15: {
        componentSpecification: "Soft moisture-wicking lining",
        color: "Light Grey",
      },
      16: {
        componentSpecification: "Nova insole print with coral fade",
        color: "Coral / Silver",
      },
      20: {
        componentSpecification: "Minimal heel carrier integrated into rear sidewall",
        color: "Silver",
      },
      21: {
        componentSpecification: "Soft rebound EVA carrier with featherweight geometry",
        color: "White",
      },
      22: {
        componentSpecification: "Bottom wedge with coral accent line",
        color: "Soft Coral",
      },
      23: {
        componentSpecification: "Light road rubber outsole with reduced lug depth",
        color: "Ice Grey",
      },
      24: {
        componentSpecification: "Compression EVA carrier with tapered heel bevel",
        color: "White",
      },
      25: {
        componentSpecification: "Center insert with light grip compound",
        color: "Soft Blue",
      },
    },
  },
  TRX427: {
    option: designOptions[4],
    detailOverrides: {
      "Project Name": "Trailstar Motion X",
      Factory: "Quanzhou Outdoor Tech",
      "Prototype ID": "TRX427",
      Season: "Summer 2026",
      Division: "Trail Running",
      "Color Description": "SAND / OLIVE / BLACK",
      "Country of Origin": "China",
      Construction: "Cold Cement",
      "Gender/Size": "M'S 9#",
      SizeRun: "6-13",
      "Last Code": "TRX-427",
      "O/S Code": "TS_427",
      Status: "DEVELOPMENT",
    },
    componentOverrides: {
      1: {
        componentSpecification: "Abrasion-resistant synthetic mudguard with textured rand",
        color: "Black",
      },
      2: {
        componentSpecification: "Ripstop mesh with welded support net",
        color: "Sand",
      },
      3: {
        componentSpecification: "Reinforced eyestay with webbing anchors",
        color: "Olive",
      },
      4: {
        componentSpecification: "Trail tongue with gusseted lower construction",
        color: "Olive",
      },
      5: {
        componentSpecification: "Trailstar woven tongue badge",
        color: "Black / Sand",
      },
      7: {
        componentSpecification: "Top eyelet with webbing reinforcement",
        color: "Black",
      },
      8: {
        componentSpecification: "Round trail lace with anti-slip texture",
        color: "Black",
      },
      10: {
        componentSpecification: "Ripstop quarter with welded support cage",
        color: "Sand",
      },
      11: {
        componentSpecification: "Trailstar heel print",
        color: "Olive / Black",
      },
      12: {
        componentSpecification: "Trail collar panel with rugged mesh backing",
        color: "Sand",
      },
      13: {
        componentSpecification: "External heel counter with trail protection wrap",
        color: "Black",
      },
      14: {
        componentSpecification: "Durable synthetic collar underlay",
        color: "Olive",
      },
      15: {
        componentSpecification: "Anti-slip lining with moisture protection finish",
        color: "Black",
      },
      16: {
        componentSpecification: "Motion X insole print with safety orange hit",
        color: "Orange / Black",
      },
      20: {
        componentSpecification: "Reinforced heel stabilizer clip for uneven terrain",
        color: "Olive",
      },
      21: {
        componentSpecification: "Compression EVA top carrier with trail stability geometry",
        color: "Taupe",
      },
      22: {
        componentSpecification: "Bottom wedge with rugged sidewall texture",
        color: "Olive Grey",
      },
      23: {
        componentSpecification: "High-traction trail outsole with deeper multidirectional lugs",
        color: "Black",
      },
      24: {
        componentSpecification: "Visible midsole carrier with rock-plate channel",
        color: "Olive Grey",
      },
      25: {
        componentSpecification: "Midfoot traction insert with sticky rubber compound",
        color: "Safety Orange / Black",
      },
    },
  },
};

function applyTableOverrides(
  table: DesignTable,
  profile: DesignProfile,
): DesignTable {
  if (table.type === "keyValue" && table.name === "designDetails") {
    return {
      ...table,
      rows: table.rows.map((row) => ({
        ...row,
        value: profile.detailOverrides[row.field] ?? row.value,
      })),
    };
  }

  const overrideRows = profile.tableOverrides?.[table.name];

  if (table.type !== "grid" || !overrideRows) {
    return table;
  }

  return {
    ...table,
    rows: table.rows.map((row) => {
      const overrides = overrideRows[row.componentType] ?? {};
      const sanitizedOverrides = Object.fromEntries(
        Object.entries(overrides).filter(([, value]) => value !== undefined),
      ) as TableRow;

      return {
        ...row,
        ...sanitizedOverrides,
      };
    }),
  };
}

export function getDesignProfile(designId: string) {
  return designProfiles[designId] ?? designProfiles[DEFAULT_DESIGN_ID];
}

export function getDesignTables(designId: string) {
  const profile = getDesignProfile(designId);

  return baseTables.map((table) => applyTableOverrides(structuredClone(table), profile));
}

export function getDesignComponents(designId: string) {
  const profile = getDesignProfile(designId);

  return baseComponents.map((component) => ({
    ...component,
    ...(profile.componentOverrides[component.number] ?? {}),
  }));
}
