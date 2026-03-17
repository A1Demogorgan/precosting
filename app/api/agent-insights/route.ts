import { NextResponse } from "next/server";
import {
  agentConfigs,
  type AgentId,
  type AgentScanRow,
} from "@/lib/agent-recommendations";
import { findShapeMetadataForCostComponent, findSpecForCostComponent } from "@/lib/design-data";

function proposeAlternativeSpecification(agentId: AgentId, currentSpecification: string) {
  const spec = currentSpecification.toLowerCase();

  if (agentId === "material") {
    if (spec.includes("pu duratec")) {
      return "1.0mm PU synthetic with lighter backing";
    }

    if (spec.includes("mesh")) {
      return "Open mesh with lower GSM backing";
    }

    if (spec.includes("eva")) {
      return "Compression molded EVA Asker C 45 with lower density";
    }

    if (spec.includes("rubber") || spec.includes("shore")) {
      return "Blown rubber compound with reduced filler content";
    }
  }

  if (agentId === "waste") {
    return `${currentSpecification} with revised pattern geometry for better nesting`;
  }

  return undefined;
}

function buildFallbackRecommendationText(
  agentId: AgentId,
  component: string,
  currentSpecification?: string | null,
  proposedSpecification?: string,
) {
  if (currentSpecification && proposedSpecification && agentId === "material") {
    return `Change ${component} from ${currentSpecification} to ${proposedSpecification}.`;
  }

  if (currentSpecification && proposedSpecification && agentId === "waste") {
    return `Redesign ${component} from ${currentSpecification} to ${proposedSpecification}.`;
  }

  return agentConfigs[agentId].changeRecommendationTemplate(component);
}

async function createAzureCompletion(
  endpoint: string,
  apiKey: string,
  deployment: string,
  apiVersion: string,
  messages: Array<{ role: "system" | "user"; content: string }>,
) {
  const response = await fetch(
    `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        messages,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    },
  );

  if (!response.ok) {
    return null;
  }

  const completion = await response.json();
  return completion.choices?.[0]?.message?.content ?? null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    agentId?: AgentId;
    rows?: AgentScanRow[];
  };

  if (!body.agentId || !body.rows) {
    return NextResponse.json({ error: "Unsupported agent payload" }, { status: 400 });
  }

  const config = agentConfigs[body.agentId];

  if (!config) {
    return NextResponse.json({ error: "Unsupported agent payload" }, { status: 400 });
  }

  const enrichedRows = body.rows.map((row) => {
    const spec = findSpecForCostComponent(row.component);
    const shapeMetadata = findShapeMetadataForCostComponent(row.component);

    return {
      ...row,
      currentSpecification: spec?.componentSpecification ?? null,
      supplier: spec?.supplier ?? null,
      color: spec?.color ?? null,
      shapeMetadata: shapeMetadata
        ? {
            shapeFamily: shapeMetadata.shapeFamily,
            sizeClass: shapeMetadata.sizeClass,
            symmetry: shapeMetadata.symmetry,
            dimensionalIntent: shapeMetadata.dimensionalIntent,
            visibleViews: Object.entries(shapeMetadata.viewMetadata)
              .filter(([, view]) => view?.visible)
              .map(([viewId, view]) => ({
                viewId,
                visible: view?.visible,
                estimatedFootprintPct: view?.estimatedFootprintPct ?? null,
                shapeNotes: view?.shapeNotes ?? null,
              })),
            confidence: shapeMetadata.confidence,
          }
        : null,
    };
  });
  const enrichedTopDrivers = [...enrichedRows]
    .sort((a, b) => b.actual - a.actual)
    .slice(0, 3);
  const enrichedRowMap = new Map(enrichedRows.map((row) => [row.component, row]));

  const fallbackPayload = {
    title: `${config.name} Review`,
    summary: config.fallbackSummary,
    recommendations: config.fallbackRecommendations.map((recommendation, index) =>
      index === 0 && enrichedTopDrivers[0]
        ? `${recommendation} Focus first on ${enrichedTopDrivers[0].component}.`
        : recommendation,
    ),
    changes: enrichedTopDrivers.map((driver, index) => {
      const savingsFactor = [0.92, 0.9, 0.91][index] ?? 0.92;
      const proposedSpecification =
        driver.currentSpecification
          ? proposeAlternativeSpecification(config.id, driver.currentSpecification)
          : undefined;

      return {
        component: driver.component,
        column: config.column,
        currentValue: driver.actual,
        recommendedValue: Number((driver.actual * savingsFactor).toFixed(2)),
        currentSpecification: driver.currentSpecification ?? undefined,
        proposedSpecification,
        shapeContext: driver.shapeMetadata ?? undefined,
        recommendation: buildFallbackRecommendationText(
          config.id,
          driver.component,
          driver.currentSpecification,
          proposedSpecification,
        ),
        rationale:
          proposedSpecification && driver.currentSpecification
            ? `${config.rationaleTemplate(driver.benchmark)} Current spec: ${driver.currentSpecification}. Proposed spec: ${proposedSpecification}.${driver.shapeMetadata ? ` Shape context: ${driver.shapeMetadata.shapeFamily}, ${driver.shapeMetadata.sizeClass}, ${driver.shapeMetadata.dimensionalIntent.relativeLength} length.` : ""}`
            : config.rationaleTemplate(driver.benchmark),
      };
    }),
  };

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2024-10-21";

  if (!endpoint || !apiKey || !deployment) {
    return NextResponse.json(fallbackPayload);
  }

  try {
    const content = await createAzureCompletion(endpoint, apiKey, deployment, apiVersion, [
      {
        role: "system",
        content:
          "You are a footwear pre-costing optimization analyst. Return concise JSON only. Recommendations must be specific to the requested cost head and propose a real cost-reduction lever, not a generic cost cut. When current specification and shape context are provided, use them directly and produce explicit proposed specifications for every change.",
      },
      {
        role: "user",
        content: JSON.stringify({
          task: `${config.promptFocus} Return JSON with title, summary, recommendations[], and changes[]. Each change must include component, column='${config.column}', currentValue, recommendedValue, currentSpecification, proposedSpecification, recommendation, and rationale.`,
          rules: [
            `Every change must reduce only the ${config.column} cost head for that component.`,
            "Each recommendation must describe the concrete action causing the reduction, such as material substitution, shape redesign, route simplification, supplier change, shipment consolidation, or defect reduction.",
            "If current specification data is provided, copy it into currentSpecification and provide a concrete proposedSpecification for every change.",
            "Put the actual recommendation detail in proposedSpecification. Do not leave proposedSpecification blank.",
            "If shapeMetadata is provided, use the shape family, size class, dimensional intent, and visible view footprint to justify realistic recommendations.",
            "For material changes, proposedSpecification must name the current material replacement or lighter construction in specific terms.",
            "For waste changes, proposedSpecification must describe the actual shape, pattern, nesting, or geometry revision.",
            "For process, labour, machine, consumable, freight, vendor, duty, and quality changes, proposedSpecification must still hold the specific changed method, route, source, or control proposal.",
            "Recommendation should be a short action sentence, but the detailed change itself must be in proposedSpecification.",
            "Do not recommend a shape change that conflicts with the available footprint, symmetry, or visible-view geometry context.",
            "Do not return generic advice like 'reduce cost' or 'optimize process' without naming the lever.",
            "recommendedValue must be lower than currentValue.",
          ],
          rows: enrichedRows,
        }),
      },
    ]);

    if (!content) {
      return NextResponse.json(fallbackPayload);
    }

    const parsed = JSON.parse(content) as {
      title?: string;
      summary?: string;
      recommendations?: string[];
      changes?: Array<{
        component?: string;
        column?: string;
        currentValue?: number;
        recommendedValue?: number;
        recommendation?: string;
        currentSpecification?: string;
        proposedSpecification?: string;
        shapeContext?: unknown;
        rationale?: string;
      }>;
    };

    const normalizedPayload = {
      title: parsed.title ?? fallbackPayload.title,
      summary: parsed.summary ?? fallbackPayload.summary,
      recommendations: parsed.recommendations ?? fallbackPayload.recommendations,
      changes: (parsed.changes ?? fallbackPayload.changes).map((change) => {
        const component = change.component ?? "";
        const enrichedRow = component ? enrichedRowMap.get(component) : undefined;
        const currentSpecification =
          change.currentSpecification ?? enrichedRow?.currentSpecification ?? undefined;

        return {
          component,
          column: change.column ?? config.column,
          currentValue: change.currentValue ?? enrichedRow?.actual ?? 0,
          recommendedValue:
            change.recommendedValue ??
            Math.max(0, Number(((change.currentValue ?? enrichedRow?.actual ?? 0) * 0.92).toFixed(2))),
          currentSpecification,
          proposedSpecification: change.proposedSpecification?.trim() || change.recommendation?.trim() || undefined,
          shapeContext:
            change.shapeContext && typeof change.shapeContext === "object"
              ? change.shapeContext
              : enrichedRow?.shapeMetadata ?? undefined,
          recommendation: change.recommendation?.trim() || undefined,
          rationale:
            change.rationale?.trim() ||
            (enrichedRow
              ? config.rationaleTemplate(enrichedRow.benchmark)
              : config.rationaleTemplate(0)),
        };
      }),
    };

    const missingProposedSpecComponents = normalizedPayload.changes
      .filter((change) => !change.proposedSpecification?.trim() && change.component)
      .map((change) => change.component);

    if (missingProposedSpecComponents.length > 0) {
      const repairRows = missingProposedSpecComponents
        .map((component) => enrichedRowMap.get(component))
        .filter(Boolean);

      const repairContent = await createAzureCompletion(endpoint, apiKey, deployment, apiVersion, [
        {
          role: "system",
          content:
            "You are repairing incomplete footwear pre-costing JSON. Return concise JSON only. Fill proposedSpecification for every listed change using the provided current spec and shape context.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: `For the ${config.name} agent, fill in missing proposedSpecification values for the listed changes. Keep them specific and actionable.`,
            rules: [
              "Return JSON with changes[].",
              "Each returned change must include component, currentSpecification, proposedSpecification, recommendation, and rationale.",
              "proposedSpecification is mandatory and must contain the actual change detail.",
            ],
            rows: repairRows,
            incompleteChanges: normalizedPayload.changes.filter((change) =>
              missingProposedSpecComponents.includes(change.component),
            ),
          }),
        },
      ]);

      if (repairContent) {
        const repaired = JSON.parse(repairContent) as {
          changes?: Array<{
            component?: string;
            currentSpecification?: string;
            proposedSpecification?: string;
            recommendation?: string;
            rationale?: string;
          }>;
        };
        const repairedMap = new Map(
          (repaired.changes ?? [])
            .filter((change) => change.component)
            .map((change) => [change.component as string, change]),
        );

        normalizedPayload.changes = normalizedPayload.changes.map((change) => {
          const repairedChange = repairedMap.get(change.component);

          if (!repairedChange) {
            return change;
          }

          return {
            ...change,
            currentSpecification:
              repairedChange.currentSpecification?.trim() || change.currentSpecification,
            proposedSpecification:
              repairedChange.proposedSpecification?.trim() || change.proposedSpecification,
            recommendation: repairedChange.recommendation?.trim() || change.recommendation,
            rationale: repairedChange.rationale?.trim() || change.rationale,
          };
        });
      }
    }

    normalizedPayload.changes = normalizedPayload.changes.map((change) => {
      const enrichedRow = enrichedRowMap.get(change.component);
      const currentSpecification = change.currentSpecification ?? enrichedRow?.currentSpecification ?? undefined;
      const fallbackProposedSpecification =
        change.recommendation?.trim() ||
        (currentSpecification ? proposeAlternativeSpecification(config.id, currentSpecification) : undefined) ||
        config.changeRecommendationTemplate(change.component);

      return {
        ...change,
        currentSpecification,
        proposedSpecification: change.proposedSpecification?.trim() || fallbackProposedSpecification,
        shapeContext: change.shapeContext ?? enrichedRow?.shapeMetadata ?? undefined,
      };
    });

    return NextResponse.json(normalizedPayload);
  } catch {
    return NextResponse.json(fallbackPayload);
  }
}
