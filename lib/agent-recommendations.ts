export type AgentId =
  | "material"
  | "waste"
  | "processing"
  | "labour"
  | "machine"
  | "consumable"
  | "vendor"
  | "freight"
  | "duty"
  | "quality";

export type ScanStatus = "green" | "amber" | "red";

export type RecommendationChange = {
  component: string;
  column: string;
  currentValue: number;
  recommendedValue: number;
  rationale: string;
};

export type RecommendationPayload = {
  title: string;
  summary: string;
  recommendations: string[];
  changes: RecommendationChange[];
};

export type AgentScanRow = {
  group: string;
  component: string;
  column: string;
  actual: number;
  benchmark: number;
  status: ScanStatus;
};

export type AgentConfig = {
  id: AgentId;
  name: string;
  column: string;
  focusArea: string;
  fallbackSummary: string;
  fallbackRecommendations: string[];
  rationaleTemplate: (benchmark: number) => string;
  promptFocus: string;
};

export const agentConfigs: Record<AgentId, AgentConfig> = {
  material: {
    id: "material",
    name: "Material & Wastage",
    column: "Material",
    focusArea: "material intensity, wastage, and yield efficiency",
    fallbackSummary:
      "Benchmark scan completed. Recommendation set generated from synthetic averages and current component costs.",
    fallbackRecommendations: [
      "Reduce material intensity on the largest cost drivers first by reviewing spec thickness, compound grade, or geometry.",
      "Improve yield and nesting efficiency before changing downstream overhead assumptions.",
      "Target foam density and panel consumption adjustments where current costs exceed benchmark tolerance.",
    ],
    rationaleTemplate: (benchmark) =>
      `Synthetic benchmark of ${benchmark.toFixed(2)} suggests this material line can be reduced without shifting non-material assumptions.`,
    promptFocus: "Review material and wastage-related costs and suggest targeted reductions.",
  },
  waste: {
    id: "waste",
    name: "Waste",
    column: "Waste",
    focusArea: "yield loss, scrap, and material wastage control",
    fallbackSummary:
      "Waste review completed. Recommendations focus on reducing scrap, improving cutting yield, and controlling material loss.",
    fallbackRecommendations: [
      "Reduce waste on the highest-loss components by improving nesting and yield assumptions.",
      "Review scrap allowances and overconsumption factors before changing base material specs.",
      "Target pattern efficiency improvements on upper components with the largest waste burden.",
    ],
    rationaleTemplate: (benchmark) =>
      `Synthetic waste benchmark of ${benchmark.toFixed(2)} suggests scrap and yield loss can be reduced on this line item.`,
    promptFocus: "Review waste costs and suggest scrap, yield, or material-loss reductions.",
  },
  processing: {
    id: "processing",
    name: "Processing",
    column: "Processing",
    focusArea: "process route simplification and touchpoint reduction",
    fallbackSummary:
      "Processing review completed. Recommendations focus on route simplification and reducing process touchpoints.",
    fallbackRecommendations: [
      "Combine or eliminate non-critical process steps where components exceed benchmark duration.",
      "Review tooling and setup assumptions for components with the highest processing intensity.",
      "Standardize finishing operations across similar upper and bottom components.",
    ],
    rationaleTemplate: (benchmark) =>
      `Synthetic process benchmark of ${benchmark.toFixed(2)} indicates route simplification can reduce this cost line.`,
    promptFocus: "Review processing costs and suggest process simplification opportunities.",
  },
  labour: {
    id: "labour",
    name: "Labour",
    column: "Labour",
    focusArea: "operator time, productivity, and line balancing",
    fallbackSummary:
      "Labour review completed. Recommendations focus on balancing operator time and reducing manual effort on key components.",
    fallbackRecommendations: [
      "Reduce manual touch time on the highest labour components before changing wage assumptions.",
      "Shift repetitive work to standardized operations with tighter line balancing.",
      "Prioritize simplification on upper components with the greatest cumulative labour load.",
    ],
    rationaleTemplate: (benchmark) =>
      `Synthetic labour benchmark of ${benchmark.toFixed(2)} suggests operator time can be reduced on this line item.`,
    promptFocus: "Review labour costs and suggest productivity or line-balancing improvements.",
  },
  machine: {
    id: "machine",
    name: "Machine",
    column: "Machine",
    focusArea: "machine utilization, setup, and cycle-time efficiency",
    fallbackSummary:
      "Machine review completed. Recommendations focus on reducing machine time, setup overhead, and inefficient equipment use.",
    fallbackRecommendations: [
      "Reduce machine-hour consumption on the largest machine-cost components.",
      "Review setup and cycle assumptions on components that appear over-machined versus benchmark.",
      "Align machine selection with actual precision and throughput requirements.",
    ],
    rationaleTemplate: (benchmark) =>
      `Synthetic machine benchmark of ${benchmark.toFixed(2)} suggests machine utilization can be tightened on this line item.`,
    promptFocus: "Review machine costs and suggest equipment or cycle-time reductions.",
  },
  consumable: {
    id: "consumable",
    name: "Consumable",
    column: "Consumables",
    focusArea: "adhesives, trims, and auxiliary usage efficiency",
    fallbackSummary:
      "Consumables review completed. Recommendations focus on adhesives, trims, and auxiliary usage efficiency.",
    fallbackRecommendations: [
      "Reduce excess adhesive and auxiliary usage on the highest consumable-cost components.",
      "Standardize trims and bonding inputs across adjacent parts where possible.",
      "Review over-specification of tapes, solvents, and finishing inputs.",
    ],
    rationaleTemplate: (benchmark) =>
      `Synthetic consumables benchmark of ${benchmark.toFixed(2)} suggests auxiliary usage can be reduced on this cost line.`,
    promptFocus: "Review consumable costs and suggest reductions in auxiliary usage or standardization.",
  },
  vendor: {
    id: "vendor",
    name: "Bought Out Vendor",
    column: "Bought-out / Vendor",
    focusArea: "supplier spend, bought-out parts, and sourcing leverage",
    fallbackSummary:
      "Vendor review completed. Recommendations focus on bought-out part consolidation and supplier-side savings.",
    fallbackRecommendations: [
      "Consolidate bought-out part sourcing on the highest external spend items.",
      "Review supplier quotes and minimum order assumptions for vendor-supplied components.",
      "Target spec simplification where supplier cost is above synthetic benchmark.",
    ],
    rationaleTemplate: (benchmark) =>
      `Synthetic vendor benchmark of ${benchmark.toFixed(2)} suggests supplier-side savings are available on this line item.`,
    promptFocus: "Review bought-out or vendor costs and suggest sourcing or specification savings.",
  },
  freight: {
    id: "freight",
    name: "Inbound Freight",
    column: "Inbound Freight",
    focusArea: "shipment consolidation and inbound logistics efficiency",
    fallbackSummary:
      "Inbound freight review completed. Recommendations focus on shipment consolidation and logistics efficiency.",
    fallbackRecommendations: [
      "Consolidate inbound loads on the highest freight-cost components.",
      "Review sourcing geography and shipment frequency assumptions for components above benchmark.",
      "Target packaging and cube efficiency before accepting current freight burden.",
    ],
    rationaleTemplate: (benchmark) =>
      `Synthetic freight benchmark of ${benchmark.toFixed(2)} suggests inbound logistics can be optimized on this line item.`,
    promptFocus: "Review inbound freight costs and suggest logistics optimization opportunities.",
  },
  duty: {
    id: "duty",
    name: "Duty / Tariff",
    column: "Duty / Tariff",
    focusArea: "tariff exposure, sourcing origin, and classification",
    fallbackSummary:
      "Duty review completed. Recommendations focus on sourcing mix and tariff-sensitive component choices.",
    fallbackRecommendations: [
      "Review tariff-sensitive sourced components with the highest duty burden.",
      "Explore alternate origin or classification opportunities where benchmark variance is highest.",
      "Prioritize duty reduction on components with repeatable imported content.",
    ],
    rationaleTemplate: (benchmark) =>
      `Synthetic duty benchmark of ${benchmark.toFixed(2)} suggests tariff exposure can be improved on this line item.`,
    promptFocus: "Review duty or tariff costs and suggest sourcing or classification improvements.",
  },
  quality: {
    id: "quality",
    name: "Quality Rejection",
    column: "Quality Rejection",
    focusArea: "reject cost reduction and process capability",
    fallbackSummary:
      "Quality review completed. Recommendations focus on reducing reject-driven cost leakage on the most affected components.",
    fallbackRecommendations: [
      "Reduce quality loss on the highest reject-cost components first.",
      "Review defect drivers and inspection placement for components above benchmark.",
      "Target process capability improvements before accepting current rejection costs.",
    ],
    rationaleTemplate: (benchmark) =>
      `Synthetic quality benchmark of ${benchmark.toFixed(2)} suggests reject-related cost can be reduced on this line item.`,
    promptFocus: "Review quality rejection costs and suggest defect-reduction opportunities.",
  },
};

export function hashBenchmark(component: string, actual: number) {
  const hash = component.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const offset = ((hash % 21) - 10) / 100;
  return Number((actual * (1 + offset)).toFixed(2));
}

export function classifyAgainstBenchmark(actual: number, benchmark: number): ScanStatus {
  if (actual <= benchmark * 0.95) {
    return "green";
  }

  if (actual <= benchmark * 1.1) {
    return "amber";
  }

  return "red";
}
