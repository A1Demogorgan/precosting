import retailPriceCompsData from "@/data/retail-price-comps.json";
import syntheticSalesHistoryData from "@/data/synthetic-sales-history.json";
import vendorBenchmarksData from "@/data/vendor-benchmarks.json";

type ReportRecommendationRow = {
  component: string;
  costHead: string;
  recommendation: string;
  oldValue: string;
  newValue: string;
  change: string;
  shapeContext: string;
  rationale: string;
};

type CostReportPayload = {
  meta?: {
    designId?: string;
  };
  headers: string[];
  currentRows: string[][];
  newRows: string[][];
  recommendations: ReportRecommendationRow[];
  summary: {
    totalBefore: number;
    totalAfter: number;
    netChange: number;
    recommendationCount: number;
  };
};

type RetailPriceComp = {
  brand: string;
  model: string;
  price: number;
  sourceLabel: string;
  sourceUrl: string;
  notes: string;
};

type VendorBenchmark = {
  vendor: string;
  region: string;
  specialization: string;
  moqPairs: number;
  leadTimeDays: number;
  baseSavingsPct: number;
  focusAreas: string[];
  strength: string;
};

type SyntheticSalesHistory = {
  archetype: string;
  marketPosition: string;
  priceSensitivity: string;
  historicalSales: Array<{
    season: string;
    units: number;
    sellThroughPct: number;
    avgRetailPrice: number;
  }>;
  forecastQuarters: Array<{
    quarter: string;
    units: number;
  }>;
};

export type AdvancedDesignChange = {
  component: string;
  currentDirection: string;
  proposedChange: string;
  performanceGuardrail: string;
  estimatedUnitImpact: number;
  vendorAction: string;
  strategicReason: string;
};

export type CostReductionLever = {
  lever: string;
  area: string;
  action: string;
  estimatedSavingsPct: number;
  estimatedUnitSavings: number;
  difficulty: "low" | "medium" | "high";
  timing: string;
};

export type AdvancedVendorStrategy = {
  vendor: string;
  region: string;
  specialization: string;
  proposedChange: string;
  targetComponent: string;
  estimatedSavingsPct: number;
  estimatedUnitSavings: number;
  moqPairs: number;
  leadTimeDays: number;
};

export type AdvancedVolumeScenario = {
  volume: number;
  unitCost: number;
  targetRetailPrice: number;
  wholesalePrice: number;
  grossMarginPct: number;
  grossProfit: number;
  materialSavings: number;
  labourSavings: number;
  freightSavings: number;
  vendorSavings: number;
  overheadSavings: number;
};

export type MarginVolumeScenario = {
  name: string;
  annualVolume: number;
  targetRetailPrice: number;
  targetWholesalePrice: number;
  grossMarginPct: number;
  contributionProfit: number;
  channelMix: string;
  recommendation: string;
  useWhen: string;
};

export type DemandOutlook = {
  archetype: string;
  marketPosition: string;
  priceSensitivity: string;
  historicalSales: Array<{
    season: string;
    units: number;
    sellThroughPct: number;
    avgRetailPrice: number;
  }>;
  forecastQuarters: Array<{
    quarter: string;
    units: number;
  }>;
  forecastAnnualUnits: number;
  demandSignal: "low" | "medium" | "high";
  insight: string;
};

export type AdvancedInsightsPayload = {
  title: string;
  summary: string;
  targetCostReductionPct: number;
  demandOutlook: DemandOutlook;
  costReductionPlan: {
    currentLandedCost: number;
    targetLandedCost: number;
    achievableLandedCost: number;
    gapToTargetPct: number;
    levers: CostReductionLever[];
  };
  designChanges: AdvancedDesignChange[];
  vendorStrategies: AdvancedVendorStrategy[];
  retailPositioning: {
    averageMarketPrice: number;
    priceBandLow: number;
    priceBandHigh: number;
    suggestedRetailPrice: number;
    positionNote: string;
    comps: RetailPriceComp[];
  };
  marginSnapshot: {
    currentLandedCost: number;
    optimizedLandedCost: number;
    suggestedWholesalePrice: number;
    suggestedRetailPrice: number;
    wholesaleMarginPct: number;
    dtcMarginPct: number;
  };
  marginVolumePlaybook: {
    recommendedPosture: string;
    rationale: string;
    scenarios: MarginVolumeScenario[];
  };
  volumeScenarios: AdvancedVolumeScenario[];
  assumptions: string[];
};

const retailPriceComps = retailPriceCompsData as RetailPriceComp[];
const vendorBenchmarks = vendorBenchmarksData as VendorBenchmark[];
const syntheticSalesHistory = syntheticSalesHistoryData as Record<string, SyntheticSalesHistory>;
const volumeTiers = [12000, 25000, 50000, 100000] as const;

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function roundPercent(value: number) {
  return Number(value.toFixed(1));
}

function roundToNearestFive(value: number) {
  return Math.round(value / 5) * 5;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function parseColumnTotals(headers: string[], rows: string[][]) {
  return headers.reduce<Record<string, number>>((acc, header, index) => {
    if (header === "Component Group" || header === "Component" || header === "Row Total") {
      return acc;
    }

    acc[header] = rows.reduce((sum, row) => sum + Number.parseFloat(row[index] || "0"), 0);
    return acc;
  }, {});
}

function buildPerformanceGuardrail(component: string, recommendation: string) {
  const text = `${component} ${recommendation}`.toLowerCase();

  if (text.includes("midsole") || text.includes("outsole") || text.includes("wedge")) {
    return "Hold cushioning response, transition feel, and traction performance within the current product brief.";
  }

  if (text.includes("vamp") || text.includes("mesh") || text.includes("tongue")) {
    return "Preserve breathability, forefoot flex, and step-in comfort through wear testing.";
  }

  if (text.includes("eyestay") || text.includes("lace") || text.includes("heel")) {
    return "Keep lockdown, fit retention, and abrasion durability at the current target level.";
  }

  return "Maintain durability and consumer-perceived quality while simplifying build complexity.";
}

function buildDesignCurrentState(component: string, costHead: string) {
  const name = normalizeText(component);

  if (name.includes("toe overlay") || name.includes("mudguard")) {
    return "Current toe package uses a broad wrap overlay and extra edge return that add cost without improving consumer value.";
  }

  if (name.includes("vamp")) {
    return "Current forefoot package carries too much layered material for a shoe that should convert through breathable comfort and everyday wear.";
  }

  if (name.includes("quarter")) {
    return "Current quarter panel uses separate support pieces where a lighter visual-support system could achieve the same look.";
  }

  if (name.includes("eyestay") || name.includes("eyerow")) {
    return "Current lace-stay geometry uses more material width and more hardware complexity than the fit brief requires.";
  }

  if (name.includes("tongue")) {
    return "Current tongue package is overbuilt for the comfort target and carries excess area, padding, or construction steps.";
  }

  if (name.includes("heel")) {
    return "Current heel package uses multiple support and branding layers, increasing both cost and assembly complexity.";
  }

  if (name.includes("midsole")) {
    return "Current foam geometry retains mass in low-value zones that do not materially change cushioning perception.";
  }

  if (name.includes("outsole")) {
    return "Current outsole layout keeps rubber coverage in low-wear zones that do not drive perceived traction value.";
  }

  if (costHead === "Material" || costHead === "Waste") {
    return "Current component geometry and material usage are above the target cost envelope for this category.";
  }

  return "Current build package contains avoidable complexity for the intended market position.";
}

function buildConcreteDesignProposal(component: string, costHead: string) {
  const name = normalizeText(component);

  if (name.includes("toe overlay") || name.includes("mudguard")) {
    return "Convert the stitched toe overlay into a narrower no-sew bumper and trim overlay return length on both sidewalls to cut material and labor at once.";
  }

  if (name.includes("vamp")) {
    return "Move to a mono-layer engineered mesh vamp, remove the broad hidden underlay, and concentrate support only under the lower lace throat.";
  }

  if (name.includes("quarter")) {
    return "Replace the multi-piece quarter package with a lighter open mesh base plus printed support graphics, eliminating one support sub-panel entirely.";
  }

  if (name.includes("eyestay") || name.includes("eyerow")) {
    return "Replace the stitched eyestay with a welded film stay, narrow the geometry, and remove one non-critical eyelet row to reduce trim and make cost.";
  }

  if (name.includes("tongue lining")) {
    return "Shift to a tricot sleeve tongue lining with localized foam islands instead of full-surface padded backing.";
  }

  if (name.includes("tongue")) {
    return "Shorten the tongue height slightly and use a single-layer spacer body with targeted comfort pods rather than full-coverage padding.";
  }

  if (name.includes("collar")) {
    return "Reduce collar wrap depth and integrate support into a printed or laminated edge treatment instead of a separate underlay piece.";
  }

  if (name.includes("heel logo") || name.includes("branding")) {
    return "Replace stitched branding with a direct heat transfer or reflective print applied onto the support panel.";
  }

  if (name.includes("heel counter")) {
    return "Redesign the heel support as a thinner external clip with cutouts, keeping hold while removing redundant coverage and tooling mass.";
  }

  if (name.includes("lace")) {
    return "Move to a narrower flat lace and shorten the visible lace run to match a reduced eyelet count.";
  }

  if (name.includes("eyelet")) {
    return "Eliminate separate eyelets and punch reinforcement directly into the welded or laminated lace stay.";
  }

  if (name.includes("midsole wedge top")) {
    return "Pocket out non-load-bearing foam on the underside of the top wedge and sharpen sidewall geometry so visual volume remains while mass drops.";
  }

  if (name.includes("midsole wedge bottom")) {
    return "Reduce bottom wedge depth in low-compression zones and add sculpted reliefs instead of carrying full foam volume through the entire profile.";
  }

  if (name.includes("outsole")) {
    return "Delete center-zone rubber, keep traction pods only in heel strike and forefoot push-off zones, and use deeper segmentation instead of full-area coverage.";
  }

  if (costHead === "Waste") {
    return "Redraw the component set to create straighter nesting edges and mirrored left-right geometry so roll utilization improves materially.";
  }

  if (costHead === "Material") {
    return "Simplify the design into fewer physical parts and move visual expression into print, welding, or emboss instead of added material layers.";
  }

  return "Collapse the build into fewer pieces with narrower coverage and more printed or welded visual expression instead of physical component buildup.";
}

function buildStrategicReason(demandSignal: "low" | "medium" | "high", costHead: string) {
  if (demandSignal === "low") {
    return `Demand looks niche, so this change needs to protect gross margin rather than assume scale will rescue the P&L. Target the ${costHead.toLowerCase()} line with a high-certainty simplification.`;
  }

  if (demandSignal === "high") {
    return `Demand looks scale-worthy, so this change should remove recurring cost from high-run-rate components where cumulative savings compound meaningfully.`;
  }

  return `Demand looks mid-volume, so this change should balance shelf price competitiveness with margin protection rather than optimize for only one extreme.`;
}

function buildVendorAction(component: string, costHead: string, index: number) {
  const vendor = vendorBenchmarks[index % vendorBenchmarks.length];
  return `${vendor.vendor} can industrialize the revised ${component.toLowerCase()} package through its ${vendor.specialization} lane and quote the simplified build as a bundled source move for ${costHead.toLowerCase()}.`;
}

function resolveSalesProfile(report: CostReportPayload): SyntheticSalesHistory {
  const designId = report.meta?.designId ?? "MSK069";
  return syntheticSalesHistory[designId] ?? syntheticSalesHistory.MSK069;
}

function buildDemandOutlook(report: CostReportPayload): DemandOutlook {
  const profile = resolveSalesProfile(report);
  const forecastAnnualUnits = profile.forecastQuarters.reduce((sum, quarter) => sum + quarter.units, 0);
  const demandSignal =
    forecastAnnualUnits < 45000 ? "low" : forecastAnnualUnits < 95000 ? "medium" : "high";

  const insight =
    demandSignal === "low"
      ? "Historical sales suggest a lower-volume or more specialty proposition. Margin discipline matters more than chasing aggressive volume through price cuts."
      : demandSignal === "high"
        ? "Historical sales suggest a scale-friendly proposition. A stronger cost-down plan can support sharper pricing while still protecting total profit."
        : "Historical sales suggest a balanced program. The best commercial answer is a moderate cost-down paired with disciplined margin retention.";

  return {
    ...profile,
    forecastAnnualUnits,
    demandSignal,
    insight,
  };
}

function buildCostReductionPlan(
  report: CostReportPayload,
  demandOutlook: DemandOutlook,
): AdvancedInsightsPayload["costReductionPlan"] {
  const currentLandedCost = roundCurrency(report.summary.totalBefore);
  const targetCostReductionPct = demandOutlook.demandSignal === "low" ? 15 : demandOutlook.demandSignal === "medium" ? 17.5 : 20;
  const targetLandedCost = roundCurrency(currentLandedCost * (1 - targetCostReductionPct / 100));
  const optimizedLandedCost = roundCurrency(report.summary.totalAfter);
  const achievableLandedCost = roundCurrency(Math.min(targetLandedCost, currentLandedCost * 0.84));
  const gapToTargetPct = roundPercent(((optimizedLandedCost - targetLandedCost) / currentLandedCost) * 100);

  const levers: CostReductionLever[] = [
    {
      lever: "Architecture simplification",
      area: "Upper package",
      action: "Eliminate one non-critical panel family and move support expression to welds, print, or geometry reliefs.",
      estimatedSavingsPct: demandOutlook.demandSignal === "high" ? 5.2 : 4.4,
      estimatedUnitSavings: roundCurrency(currentLandedCost * (demandOutlook.demandSignal === "high" ? 0.052 : 0.044)),
      difficulty: "medium",
      timing: "next round design freeze",
    },
    {
      lever: "Bottom-unit mass takeout",
      area: "Midsole / outsole",
      action: "Pocket foam and reduce low-wear rubber coverage rather than treating the bottom as a fixed spec.",
      estimatedSavingsPct: demandOutlook.demandSignal === "low" ? 3.8 : 4.6,
      estimatedUnitSavings: roundCurrency(currentLandedCost * (demandOutlook.demandSignal === "low" ? 0.038 : 0.046)),
      difficulty: "high",
      timing: "tooling revision cycle",
    },
    {
      lever: "Source consolidation",
      area: "Bought-out parts and trims",
      action: "Bundle trim, component, and inbound logistics purchasing to convert fragmented quotes into scale pricing.",
      estimatedSavingsPct: 3.1,
      estimatedUnitSavings: roundCurrency(currentLandedCost * 0.031),
      difficulty: "low",
      timing: "RFQ / commercialization",
    },
    {
      lever: "Margin-volume fit",
      area: "Commercial model",
      action: demandOutlook.demandSignal === "low"
        ? "Protect margin with a tighter assortment and higher wholesale discipline instead of assuming broad volume."
        : "Use the cost-down to sharpen the value equation, then selectively lean into volume where sell-through supports it.",
      estimatedSavingsPct: demandOutlook.demandSignal === "low" ? 2.1 : 2.8,
      estimatedUnitSavings: roundCurrency(currentLandedCost * (demandOutlook.demandSignal === "low" ? 0.021 : 0.028)),
      difficulty: "medium",
      timing: "pricing and assortment review",
    },
  ];

  return {
    currentLandedCost,
    targetLandedCost,
    achievableLandedCost,
    gapToTargetPct,
    levers,
  };
}

function buildDesignChanges(
  report: CostReportPayload,
  demandOutlook: DemandOutlook,
): AdvancedDesignChange[] {
  return report.recommendations.slice(0, 5).map((row, index) => {
    const unitImpact = Math.abs(
      Number.parseFloat(row.oldValue || "0") - Number.parseFloat(row.newValue || "0"),
    );

    return {
      component: row.component,
      currentDirection: buildDesignCurrentState(row.component, row.costHead),
      proposedChange: buildConcreteDesignProposal(row.component, row.costHead),
      performanceGuardrail: buildPerformanceGuardrail(row.component, row.recommendation),
      estimatedUnitImpact: roundCurrency(Math.max(unitImpact, report.summary.totalBefore * 0.015)),
      vendorAction: buildVendorAction(row.component, row.costHead, index),
      strategicReason: buildStrategicReason(demandOutlook.demandSignal, row.costHead),
    };
  });
}

function buildVendorStrategies(
  report: CostReportPayload,
  baseLandedCost: number,
  demandOutlook: DemandOutlook,
): AdvancedVendorStrategy[] {
  const recommendations = report.recommendations;
  const scaleMultiplier = demandOutlook.demandSignal === "high" ? 1.18 : demandOutlook.demandSignal === "low" ? 0.92 : 1;

  return vendorBenchmarks.map((vendor, index) => {
    const matchedRow =
      recommendations.find((row) => vendor.focusAreas.includes(row.costHead)) ??
      recommendations[index % Math.max(recommendations.length, 1)];
    const estimatedSavingsPct = roundPercent((vendor.baseSavingsPct + index * 0.3) * scaleMultiplier);
    const estimatedUnitSavings = roundCurrency(baseLandedCost * (estimatedSavingsPct / 100) * 0.28);

    return {
      vendor: vendor.vendor,
      region: vendor.region,
      specialization: vendor.specialization,
      proposedChange:
        demandOutlook.demandSignal === "low"
          ? `${vendor.strength} Use this vendor only for a narrower, higher-margin component package and avoid overcommitting to MOQ-heavy styles.`
          : `${vendor.strength} Shift ${matchedRow?.component ?? "high-cost components"} into a consolidated quote package and use scale leverage to reduce recurring unit cost.`,
      targetComponent: matchedRow?.component ?? "Multi-component package",
      estimatedSavingsPct,
      estimatedUnitSavings,
      moqPairs: vendor.moqPairs,
      leadTimeDays: vendor.leadTimeDays,
    };
  });
}

function buildRetailPositioning(optimizedLandedCost: number, demandOutlook: DemandOutlook) {
  const averageMarketPrice =
    retailPriceComps.reduce((sum, comp) => sum + comp.price, 0) / retailPriceComps.length;
  const priceBandLow = Math.min(...retailPriceComps.map((comp) => comp.price));
  const priceBandHigh = Math.max(...retailPriceComps.map((comp) => comp.price));
  const pricingMultiple =
    demandOutlook.demandSignal === "low" ? 5.8 : demandOutlook.demandSignal === "high" ? 4.9 : 5.3;
  const targetFromCost = optimizedLandedCost * pricingMultiple;
  const suggestedRetailPrice = roundToNearestFive(
    Math.max(priceBandLow, Math.min(priceBandHigh + 10, (averageMarketPrice + targetFromCost) / 2)),
  );

  return {
    averageMarketPrice: roundCurrency(averageMarketPrice),
    priceBandLow,
    priceBandHigh,
    suggestedRetailPrice,
    positionNote:
      demandOutlook.demandSignal === "low"
        ? "Expected demand is narrower, so the pricing posture should favor margin protection and avoid chasing volume through discount-led positioning."
        : demandOutlook.demandSignal === "high"
          ? "Expected demand is scalable, so pricing can stay competitive if cost-down actions land with discipline."
          : "Expected demand is balanced, so pricing should hold the middle of the market while protecting enough gross margin for seasonal risk.",
    comps: retailPriceComps,
  };
}

function buildMarginVolumePlaybook(
  currentLandedCost: number,
  retailPositioning: AdvancedInsightsPayload["retailPositioning"],
  demandOutlook: DemandOutlook,
) {
  const scenarios: MarginVolumeScenario[] = [
    {
      name: "Margin-first",
      annualVolume: Math.round(demandOutlook.forecastAnnualUnits * 0.82),
      targetRetailPrice: retailPositioning.suggestedRetailPrice + 10,
      targetWholesalePrice: roundCurrency((retailPositioning.suggestedRetailPrice + 10) * 0.54),
      grossMarginPct: roundPercent((((retailPositioning.suggestedRetailPrice + 10) * 0.54 - currentLandedCost) / ((retailPositioning.suggestedRetailPrice + 10) * 0.54)) * 100),
      contributionProfit: roundCurrency((((retailPositioning.suggestedRetailPrice + 10) * 0.54) - currentLandedCost) * Math.round(demandOutlook.forecastAnnualUnits * 0.82)),
      channelMix: "Higher DTC and selective wholesale",
      recommendation: "Use when demand is niche or style risk is high and the business needs to protect gross margin.",
      useWhen: "Low-volume or more premium-positioned demand",
    },
    {
      name: "Balanced",
      annualVolume: demandOutlook.forecastAnnualUnits,
      targetRetailPrice: retailPositioning.suggestedRetailPrice,
      targetWholesalePrice: roundCurrency(retailPositioning.suggestedRetailPrice * 0.52),
      grossMarginPct: roundPercent((((retailPositioning.suggestedRetailPrice * 0.52) - currentLandedCost) / (retailPositioning.suggestedRetailPrice * 0.52)) * 100),
      contributionProfit: roundCurrency(((retailPositioning.suggestedRetailPrice * 0.52) - currentLandedCost) * demandOutlook.forecastAnnualUnits),
      channelMix: "Balanced wholesale and DTC",
      recommendation: "Use when the category is expected to perform in line with prior seasons without outsized risk or upside.",
      useWhen: "Base-case demand",
    },
    {
      name: "Scale play",
      annualVolume: Math.round(demandOutlook.forecastAnnualUnits * 1.18),
      targetRetailPrice: retailPositioning.suggestedRetailPrice - 5,
      targetWholesalePrice: roundCurrency((retailPositioning.suggestedRetailPrice - 5) * 0.5),
      grossMarginPct: roundPercent((((retailPositioning.suggestedRetailPrice - 5) * 0.5 - currentLandedCost) / ((retailPositioning.suggestedRetailPrice - 5) * 0.5)) * 100),
      contributionProfit: roundCurrency((((retailPositioning.suggestedRetailPrice - 5) * 0.5) - currentLandedCost) * Math.round(demandOutlook.forecastAnnualUnits * 1.18)),
      channelMix: "Broader wholesale scale",
      recommendation: "Use only if sell-through and volume confidence justify more aggressive pricing and larger commitments.",
      useWhen: "High-confidence scalable demand",
    },
  ];

  const recommendedPosture =
    demandOutlook.demandSignal === "low"
      ? "Margin-first"
      : demandOutlook.demandSignal === "high"
        ? "Balanced moving toward scale"
        : "Balanced";

  const rationale =
    demandOutlook.demandSignal === "low"
      ? "The synthetic sales history points to lower annual volume, so the business case improves more through margin capture than volume chasing."
      : demandOutlook.demandSignal === "high"
        ? "The synthetic history supports better volume confidence, so cost-down can be reinvested into a stronger value equation while preserving profitability."
        : "The synthetic history supports a balanced posture: protect margin, but do not overprice the style relative to the market band.";

  return { recommendedPosture, rationale, scenarios };
}

function buildVolumeScenarios(
  columnTotals: Record<string, number>,
  retailPrice: number,
  demandOutlook: DemandOutlook,
) {
  const baseUnitCost = Object.values(columnTotals).reduce((sum, value) => sum + value, 0);
  const wholesaleFactor = demandOutlook.demandSignal === "low" ? 0.54 : 0.52;
  const labourBase =
    (columnTotals["Labour"] ?? 0) +
    (columnTotals["Processing"] ?? 0) +
    (columnTotals["Machine"] ?? 0);
  const overheadBase = (columnTotals["Consumables"] ?? 0) + (columnTotals["Waste"] ?? 0);
  const freightBase =
    (columnTotals["Inbound Freight"] ?? 0) + (columnTotals["Duty / Tariff"] ?? 0);
  const vendorBase = columnTotals["Bought-out / Vendor"] ?? 0;
  const materialBase = columnTotals["Material"] ?? 0;

  const reductionCurves =
    demandOutlook.demandSignal === "low"
      ? [
          { material: 0.01, labour: 0.008, freight: 0.006, vendor: 0.008, overhead: 0.006, priceOffset: 8 },
          { material: 0.018, labour: 0.012, freight: 0.01, vendor: 0.014, overhead: 0.01, priceOffset: 5 },
          { material: 0.024, labour: 0.016, freight: 0.014, vendor: 0.019, overhead: 0.012, priceOffset: 2 },
          { material: 0.03, labour: 0.02, freight: 0.017, vendor: 0.024, overhead: 0.014, priceOffset: 0 },
        ]
      : [
          { material: 0.012, labour: 0.008, freight: 0.008, vendor: 0.01, overhead: 0.007, priceOffset: 2 },
          { material: 0.026, labour: 0.014, freight: 0.014, vendor: 0.018, overhead: 0.011, priceOffset: 0 },
          { material: 0.045, labour: 0.024, freight: 0.024, vendor: 0.031, overhead: 0.018, priceOffset: -4 },
          { material: 0.062, labour: 0.034, freight: 0.034, vendor: 0.042, overhead: 0.024, priceOffset: -8 },
        ];

  return volumeTiers.map((volume, index) => {
    const curve = reductionCurves[index];
    const materialSavings = roundCurrency(materialBase * curve.material);
    const labourSavings = roundCurrency(labourBase * curve.labour);
    const freightSavings = roundCurrency(freightBase * curve.freight);
    const vendorSavings = roundCurrency(vendorBase * curve.vendor);
    const overheadSavings = roundCurrency(overheadBase * curve.overhead);
    const totalSavings =
      materialSavings + labourSavings + freightSavings + vendorSavings + overheadSavings;
    const unitCost = roundCurrency(baseUnitCost - totalSavings);
    const targetRetailPrice = Math.max(95, retailPrice + curve.priceOffset);
    const wholesalePrice = roundCurrency(targetRetailPrice * wholesaleFactor);
    const grossMarginPct = roundPercent(((wholesalePrice - unitCost) / wholesalePrice) * 100);
    const grossProfit = roundCurrency((wholesalePrice - unitCost) * volume);

    return {
      volume,
      unitCost,
      targetRetailPrice,
      wholesalePrice,
      grossMarginPct,
      grossProfit,
      materialSavings,
      labourSavings,
      freightSavings,
      vendorSavings,
      overheadSavings,
    };
  });
}

export function buildAdvancedFallback(report: CostReportPayload): AdvancedInsightsPayload {
  const demandOutlook = buildDemandOutlook(report);
  const columnTotals = parseColumnTotals(report.headers, report.newRows);
  const currentLandedCost = roundCurrency(report.summary.totalBefore);
  const costReductionPlan = buildCostReductionPlan(report, demandOutlook);
  const optimizedLandedCost = costReductionPlan.achievableLandedCost;
  const retailPositioning = buildRetailPositioning(optimizedLandedCost, demandOutlook);
  const suggestedWholesalePrice = roundCurrency(
    retailPositioning.suggestedRetailPrice * (demandOutlook.demandSignal === "low" ? 0.54 : 0.52),
  );
  const wholesaleMarginPct = roundPercent(
    ((suggestedWholesalePrice - optimizedLandedCost) / suggestedWholesalePrice) * 100,
  );
  const dtcMarginPct = roundPercent(
    ((retailPositioning.suggestedRetailPrice - optimizedLandedCost) /
      retailPositioning.suggestedRetailPrice) *
      100,
  );
  const marginVolumePlaybook = buildMarginVolumePlaybook(
    optimizedLandedCost,
    retailPositioning,
    demandOutlook,
  );

  return {
    title: "Advanced Cost, Demand, and Margin Strategy",
    summary:
      "Advanced mode now reframes the shoe as a category business case: synthetic historical demand, a 15-20% cost-down target, margin-volume posture, and design changes that are materially stronger than the base landed-cost recommendations.",
    targetCostReductionPct: demandOutlook.demandSignal === "low" ? 15 : demandOutlook.demandSignal === "medium" ? 17.5 : 20,
    demandOutlook,
    costReductionPlan,
    designChanges: buildDesignChanges(report, demandOutlook),
    vendorStrategies: buildVendorStrategies(report, optimizedLandedCost, demandOutlook),
    retailPositioning,
    marginSnapshot: {
      currentLandedCost,
      optimizedLandedCost,
      suggestedWholesalePrice,
      suggestedRetailPrice: retailPositioning.suggestedRetailPrice,
      wholesaleMarginPct,
      dtcMarginPct,
    },
    marginVolumePlaybook,
    volumeScenarios: buildVolumeScenarios(
      columnTotals,
      retailPositioning.suggestedRetailPrice,
      demandOutlook,
    ),
    assumptions: [
      "Historical demand and sell-through are synthetic category benchmarks by shoe archetype, not actual ERP sales.",
      "The target cost-down ambition is intentionally higher than the base agent pass and assumes architectural, sourcing, and commercial interventions together.",
      "Low-volume scenarios prioritize margin capture over aggressive scale assumptions.",
      "High-volume scenarios assume stronger source consolidation and manufacturing leverage.",
      "Retail price anchors still reference current official brand-site comps for directional market positioning.",
    ],
  };
}
