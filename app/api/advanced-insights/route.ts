import { NextResponse } from "next/server";
import {
  buildAdvancedFallback,
  type AdvancedInsightsPayload,
} from "@/lib/advanced-insights";
import {
  createAzureCompletion,
  getAzureOpenAIConfig,
} from "@/lib/azure-openai";

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

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isGenericDesignEcho(
  candidate: string | undefined,
  reportRecommendation: string | undefined,
) {
  if (!candidate) {
    return true;
  }

  const normalizedCandidate = normalizeText(candidate);
  const normalizedRecommendation = normalizeText(reportRecommendation ?? "");

  if (!normalizedCandidate) {
    return true;
  }

  if (normalizedRecommendation && normalizedCandidate === normalizedRecommendation) {
    return true;
  }

  return (
    normalizedCandidate.includes("reduce cost") ||
    normalizedCandidate.includes("optimize process") ||
    normalizedCandidate.includes("change supplier") ||
    normalizedCandidate.includes("simplify specification")
  );
}

function isValidReportPayload(value: unknown): value is CostReportPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const report = value as Partial<CostReportPayload>;
  return (
    Array.isArray(report.headers) &&
    Array.isArray(report.currentRows) &&
    Array.isArray(report.newRows) &&
    Array.isArray(report.recommendations) &&
    !!report.summary
  );
}

function normalizeAdvancedPayload(
  parsed: Partial<AdvancedInsightsPayload>,
  fallback: AdvancedInsightsPayload,
): AdvancedInsightsPayload {
  return {
    title: parsed.title?.trim() || fallback.title,
    summary: parsed.summary?.trim() || fallback.summary,
    targetCostReductionPct:
      typeof parsed.targetCostReductionPct === "number"
        ? parsed.targetCostReductionPct
        : fallback.targetCostReductionPct,
    demandOutlook: parsed.demandOutlook
      ? {
          archetype: parsed.demandOutlook.archetype?.trim() || fallback.demandOutlook.archetype,
          marketPosition:
            parsed.demandOutlook.marketPosition?.trim() || fallback.demandOutlook.marketPosition,
          priceSensitivity:
            parsed.demandOutlook.priceSensitivity?.trim() ||
            fallback.demandOutlook.priceSensitivity,
          historicalSales:
            parsed.demandOutlook.historicalSales?.length
              ? parsed.demandOutlook.historicalSales.map((entry, index) => ({
                  season: entry.season?.trim() || fallback.demandOutlook.historicalSales[index]?.season || "",
                  units:
                    typeof entry.units === "number"
                      ? entry.units
                      : fallback.demandOutlook.historicalSales[index]?.units || 0,
                  sellThroughPct:
                    typeof entry.sellThroughPct === "number"
                      ? entry.sellThroughPct
                      : fallback.demandOutlook.historicalSales[index]?.sellThroughPct || 0,
                  avgRetailPrice:
                    typeof entry.avgRetailPrice === "number"
                      ? entry.avgRetailPrice
                      : fallback.demandOutlook.historicalSales[index]?.avgRetailPrice || 0,
                }))
              : fallback.demandOutlook.historicalSales,
          forecastQuarters:
            parsed.demandOutlook.forecastQuarters?.length
              ? parsed.demandOutlook.forecastQuarters.map((entry, index) => ({
                  quarter: entry.quarter?.trim() || fallback.demandOutlook.forecastQuarters[index]?.quarter || "",
                  units:
                    typeof entry.units === "number"
                      ? entry.units
                      : fallback.demandOutlook.forecastQuarters[index]?.units || 0,
                }))
              : fallback.demandOutlook.forecastQuarters,
          forecastAnnualUnits:
            typeof parsed.demandOutlook.forecastAnnualUnits === "number"
              ? parsed.demandOutlook.forecastAnnualUnits
              : fallback.demandOutlook.forecastAnnualUnits,
          demandSignal:
            parsed.demandOutlook.demandSignal ?? fallback.demandOutlook.demandSignal,
          insight: parsed.demandOutlook.insight?.trim() || fallback.demandOutlook.insight,
        }
      : fallback.demandOutlook,
    costReductionPlan: parsed.costReductionPlan
      ? {
          currentLandedCost:
            typeof parsed.costReductionPlan.currentLandedCost === "number"
              ? parsed.costReductionPlan.currentLandedCost
              : fallback.costReductionPlan.currentLandedCost,
          targetLandedCost:
            typeof parsed.costReductionPlan.targetLandedCost === "number"
              ? parsed.costReductionPlan.targetLandedCost
              : fallback.costReductionPlan.targetLandedCost,
          achievableLandedCost:
            typeof parsed.costReductionPlan.achievableLandedCost === "number"
              ? parsed.costReductionPlan.achievableLandedCost
              : fallback.costReductionPlan.achievableLandedCost,
          gapToTargetPct:
            typeof parsed.costReductionPlan.gapToTargetPct === "number"
              ? parsed.costReductionPlan.gapToTargetPct
              : fallback.costReductionPlan.gapToTargetPct,
          levers:
            parsed.costReductionPlan.levers?.length
              ? parsed.costReductionPlan.levers.map((lever, index) => ({
                  lever: lever.lever?.trim() || fallback.costReductionPlan.levers[index]?.lever || "",
                  area: lever.area?.trim() || fallback.costReductionPlan.levers[index]?.area || "",
                  action:
                    lever.action?.trim() || fallback.costReductionPlan.levers[index]?.action || "",
                  estimatedSavingsPct:
                    typeof lever.estimatedSavingsPct === "number"
                      ? lever.estimatedSavingsPct
                      : fallback.costReductionPlan.levers[index]?.estimatedSavingsPct || 0,
                  estimatedUnitSavings:
                    typeof lever.estimatedUnitSavings === "number"
                      ? lever.estimatedUnitSavings
                      : fallback.costReductionPlan.levers[index]?.estimatedUnitSavings || 0,
                  difficulty:
                    lever.difficulty ?? fallback.costReductionPlan.levers[index]?.difficulty ?? "medium",
                  timing:
                    lever.timing?.trim() || fallback.costReductionPlan.levers[index]?.timing || "",
                }))
              : fallback.costReductionPlan.levers,
        }
      : fallback.costReductionPlan,
    designChanges:
      parsed.designChanges?.length
        ? parsed.designChanges.map((change, index) => ({
            component: change.component?.trim() || fallback.designChanges[index]?.component || "Component",
            currentDirection:
              change.currentDirection?.trim() ||
              fallback.designChanges[index]?.currentDirection ||
              "",
            proposedChange:
              isGenericDesignEcho(
                change.proposedChange?.trim(),
                fallback.designChanges[index]?.proposedChange,
              )
                ? fallback.designChanges[index]?.proposedChange || ""
                : change.proposedChange?.trim() || fallback.designChanges[index]?.proposedChange || "",
            performanceGuardrail:
              change.performanceGuardrail?.trim() ||
              fallback.designChanges[index]?.performanceGuardrail ||
              "",
            estimatedUnitImpact:
              typeof change.estimatedUnitImpact === "number"
                ? change.estimatedUnitImpact
                : fallback.designChanges[index]?.estimatedUnitImpact || 0,
            vendorAction:
              change.vendorAction?.trim() ||
              fallback.designChanges[index]?.vendorAction ||
              "",
            strategicReason:
              change.strategicReason?.trim() ||
              fallback.designChanges[index]?.strategicReason ||
              "",
          }))
        : fallback.designChanges,
    vendorStrategies:
      parsed.vendorStrategies?.length
        ? parsed.vendorStrategies.map((strategy, index) => ({
            vendor: strategy.vendor?.trim() || fallback.vendorStrategies[index]?.vendor || "Vendor",
            region: strategy.region?.trim() || fallback.vendorStrategies[index]?.region || "",
            specialization:
              strategy.specialization?.trim() ||
              fallback.vendorStrategies[index]?.specialization ||
              "",
            proposedChange:
              strategy.proposedChange?.trim() ||
              fallback.vendorStrategies[index]?.proposedChange ||
              "",
            targetComponent:
              strategy.targetComponent?.trim() ||
              fallback.vendorStrategies[index]?.targetComponent ||
              "",
            estimatedSavingsPct:
              typeof strategy.estimatedSavingsPct === "number"
                ? strategy.estimatedSavingsPct
                : fallback.vendorStrategies[index]?.estimatedSavingsPct || 0,
            estimatedUnitSavings:
              typeof strategy.estimatedUnitSavings === "number"
                ? strategy.estimatedUnitSavings
                : fallback.vendorStrategies[index]?.estimatedUnitSavings || 0,
            moqPairs:
              typeof strategy.moqPairs === "number"
                ? strategy.moqPairs
                : fallback.vendorStrategies[index]?.moqPairs || 0,
            leadTimeDays:
              typeof strategy.leadTimeDays === "number"
                ? strategy.leadTimeDays
                : fallback.vendorStrategies[index]?.leadTimeDays || 0,
          }))
        : fallback.vendorStrategies,
    retailPositioning: parsed.retailPositioning
      ? {
          averageMarketPrice:
            typeof parsed.retailPositioning.averageMarketPrice === "number"
              ? parsed.retailPositioning.averageMarketPrice
              : fallback.retailPositioning.averageMarketPrice,
          priceBandLow:
            typeof parsed.retailPositioning.priceBandLow === "number"
              ? parsed.retailPositioning.priceBandLow
              : fallback.retailPositioning.priceBandLow,
          priceBandHigh:
            typeof parsed.retailPositioning.priceBandHigh === "number"
              ? parsed.retailPositioning.priceBandHigh
              : fallback.retailPositioning.priceBandHigh,
          suggestedRetailPrice:
            typeof parsed.retailPositioning.suggestedRetailPrice === "number"
              ? parsed.retailPositioning.suggestedRetailPrice
              : fallback.retailPositioning.suggestedRetailPrice,
          positionNote:
            parsed.retailPositioning.positionNote?.trim() ||
            fallback.retailPositioning.positionNote,
          comps:
            parsed.retailPositioning.comps?.length
              ? parsed.retailPositioning.comps.map((comp, index) => ({
                  brand: comp.brand?.trim() || fallback.retailPositioning.comps[index]?.brand || "",
                  model: comp.model?.trim() || fallback.retailPositioning.comps[index]?.model || "",
                  price:
                    typeof comp.price === "number"
                      ? comp.price
                      : fallback.retailPositioning.comps[index]?.price || 0,
                  sourceLabel:
                    comp.sourceLabel?.trim() ||
                    fallback.retailPositioning.comps[index]?.sourceLabel ||
                    "",
                  sourceUrl:
                    comp.sourceUrl?.trim() ||
                    fallback.retailPositioning.comps[index]?.sourceUrl ||
                    "",
                  notes:
                    comp.notes?.trim() || fallback.retailPositioning.comps[index]?.notes || "",
                }))
              : fallback.retailPositioning.comps,
        }
      : fallback.retailPositioning,
    marginSnapshot: parsed.marginSnapshot
      ? {
          currentLandedCost:
            typeof parsed.marginSnapshot.currentLandedCost === "number"
              ? parsed.marginSnapshot.currentLandedCost
              : fallback.marginSnapshot.currentLandedCost,
          optimizedLandedCost:
            typeof parsed.marginSnapshot.optimizedLandedCost === "number"
              ? parsed.marginSnapshot.optimizedLandedCost
              : fallback.marginSnapshot.optimizedLandedCost,
          suggestedWholesalePrice:
            typeof parsed.marginSnapshot.suggestedWholesalePrice === "number"
              ? parsed.marginSnapshot.suggestedWholesalePrice
              : fallback.marginSnapshot.suggestedWholesalePrice,
          suggestedRetailPrice:
            typeof parsed.marginSnapshot.suggestedRetailPrice === "number"
              ? parsed.marginSnapshot.suggestedRetailPrice
              : fallback.marginSnapshot.suggestedRetailPrice,
          wholesaleMarginPct:
            typeof parsed.marginSnapshot.wholesaleMarginPct === "number"
              ? parsed.marginSnapshot.wholesaleMarginPct
              : fallback.marginSnapshot.wholesaleMarginPct,
          dtcMarginPct:
            typeof parsed.marginSnapshot.dtcMarginPct === "number"
              ? parsed.marginSnapshot.dtcMarginPct
              : fallback.marginSnapshot.dtcMarginPct,
        }
      : fallback.marginSnapshot,
    marginVolumePlaybook: parsed.marginVolumePlaybook
      ? {
          recommendedPosture:
            parsed.marginVolumePlaybook.recommendedPosture?.trim() ||
            fallback.marginVolumePlaybook.recommendedPosture,
          rationale:
            parsed.marginVolumePlaybook.rationale?.trim() ||
            fallback.marginVolumePlaybook.rationale,
          scenarios:
            parsed.marginVolumePlaybook.scenarios?.length
              ? parsed.marginVolumePlaybook.scenarios.map((scenario, index) => ({
                  name: scenario.name?.trim() || fallback.marginVolumePlaybook.scenarios[index]?.name || "",
                  annualVolume:
                    typeof scenario.annualVolume === "number"
                      ? scenario.annualVolume
                      : fallback.marginVolumePlaybook.scenarios[index]?.annualVolume || 0,
                  targetRetailPrice:
                    typeof scenario.targetRetailPrice === "number"
                      ? scenario.targetRetailPrice
                      : fallback.marginVolumePlaybook.scenarios[index]?.targetRetailPrice || 0,
                  targetWholesalePrice:
                    typeof scenario.targetWholesalePrice === "number"
                      ? scenario.targetWholesalePrice
                      : fallback.marginVolumePlaybook.scenarios[index]?.targetWholesalePrice || 0,
                  grossMarginPct:
                    typeof scenario.grossMarginPct === "number"
                      ? scenario.grossMarginPct
                      : fallback.marginVolumePlaybook.scenarios[index]?.grossMarginPct || 0,
                  contributionProfit:
                    typeof scenario.contributionProfit === "number"
                      ? scenario.contributionProfit
                      : fallback.marginVolumePlaybook.scenarios[index]?.contributionProfit || 0,
                  channelMix:
                    scenario.channelMix?.trim() || fallback.marginVolumePlaybook.scenarios[index]?.channelMix || "",
                  recommendation:
                    scenario.recommendation?.trim() ||
                    fallback.marginVolumePlaybook.scenarios[index]?.recommendation ||
                    "",
                  useWhen:
                    scenario.useWhen?.trim() || fallback.marginVolumePlaybook.scenarios[index]?.useWhen || "",
                }))
              : fallback.marginVolumePlaybook.scenarios,
        }
      : fallback.marginVolumePlaybook,
    volumeScenarios:
      parsed.volumeScenarios?.length
        ? parsed.volumeScenarios.map((scenario, index) => ({
            volume:
              typeof scenario.volume === "number"
                ? scenario.volume
                : fallback.volumeScenarios[index]?.volume || 0,
            unitCost:
              typeof scenario.unitCost === "number"
                ? scenario.unitCost
                : fallback.volumeScenarios[index]?.unitCost || 0,
            targetRetailPrice:
              typeof scenario.targetRetailPrice === "number"
                ? scenario.targetRetailPrice
                : fallback.volumeScenarios[index]?.targetRetailPrice || 0,
            wholesalePrice:
              typeof scenario.wholesalePrice === "number"
                ? scenario.wholesalePrice
                : fallback.volumeScenarios[index]?.wholesalePrice || 0,
            grossMarginPct:
              typeof scenario.grossMarginPct === "number"
                ? scenario.grossMarginPct
                : fallback.volumeScenarios[index]?.grossMarginPct || 0,
            grossProfit:
              typeof scenario.grossProfit === "number"
                ? scenario.grossProfit
                : fallback.volumeScenarios[index]?.grossProfit || 0,
            materialSavings:
              typeof scenario.materialSavings === "number"
                ? scenario.materialSavings
                : fallback.volumeScenarios[index]?.materialSavings || 0,
            labourSavings:
              typeof scenario.labourSavings === "number"
                ? scenario.labourSavings
                : fallback.volumeScenarios[index]?.labourSavings || 0,
            freightSavings:
              typeof scenario.freightSavings === "number"
                ? scenario.freightSavings
                : fallback.volumeScenarios[index]?.freightSavings || 0,
            vendorSavings:
              typeof scenario.vendorSavings === "number"
                ? scenario.vendorSavings
                : fallback.volumeScenarios[index]?.vendorSavings || 0,
            overheadSavings:
              typeof scenario.overheadSavings === "number"
                ? scenario.overheadSavings
                : fallback.volumeScenarios[index]?.overheadSavings || 0,
          }))
        : fallback.volumeScenarios,
    assumptions:
      parsed.assumptions?.filter((item) => typeof item === "string" && item.trim()).length
        ? parsed.assumptions.filter((item): item is string => typeof item === "string" && !!item.trim())
        : fallback.assumptions,
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as { report?: unknown };

  if (!isValidReportPayload(body.report)) {
    return NextResponse.json({ error: "Unsupported advanced payload" }, { status: 400 });
  }

  const fallback = buildAdvancedFallback(body.report);
  const azureConfig = getAzureOpenAIConfig();

  if (!azureConfig) {
    return NextResponse.json(fallback);
  }

  try {
    const content = await createAzureCompletion(azureConfig, [
      {
        role: "system",
        content:
          "You are a footwear commercial costing strategist. Return JSON only. Act like a planning layer above the landed-cost agents. Build a real strategy dashboard: synthetic historical demand, margin-volume posture, a 15-20 percent cost-reduction ambition, stronger design changes, and commercial implications. Do not parrot prior agent recommendations.",
      },
      {
        role: "user",
        content: JSON.stringify({
          task:
            "Build an advanced recommendation package with title, summary, targetCostReductionPct, demandOutlook, costReductionPlan, designChanges[], vendorStrategies[], retailPositioning, marginSnapshot, marginVolumePlaybook, volumeScenarios[], and assumptions[].",
          rules: [
            "Design changes must keep performance intent intact and mention the guardrail explicitly.",
            "Every design change must be a real design modification, such as reducing panel coverage, changing foam geometry, replacing stitched overlays with welded films, reducing rubber coverage, simplifying tongue construction, or changing trim execution.",
            "Do not copy, restate, or lightly paraphrase the agent recommendation text as the design change.",
            "Do not use generic phrases like reduce cost, optimize process, simplify spec, or change supplier as the main design change.",
            "The overall advanced plan should aim for approximately 15 to 20 percent total cost reduction, not a minor incremental improvement.",
            "Use the provided synthetic or fallback historical sales logic to reason about whether the shoe is low, medium, or high volume.",
            "If expected volume is low, recommend a more margin-protective posture. If expected volume is high, show when a stronger scale play makes sense.",
            "costReductionPlan.levers must show meaningful savings levers with estimated percent savings and unit savings.",
            "marginVolumePlaybook.scenarios must compare different volume-margin postures and explain which one should be chosen.",
            "Vendor strategies can use synthetic vendor data, but they must stay plausible and tied to component or cost-head opportunities.",
            "Retail positioning must stay grounded in the provided market comps from current official web pricing.",
            "Volume scenarios must show how specific buckets like material, labour, freight, vendor, and overhead improve with scale.",
            "grossProfit must equal unit gross profit multiplied by volume.",
            "Keep the numbers directional and commercially coherent.",
          ],
          report: body.report,
          fallback,
        }),
      },
    ]);

    if (!content) {
      return NextResponse.json(fallback);
    }

    const parsed = JSON.parse(content) as Partial<AdvancedInsightsPayload>;
    return NextResponse.json(normalizeAdvancedPayload(parsed, fallback));
  } catch {
    return NextResponse.json(fallback);
  }
}
