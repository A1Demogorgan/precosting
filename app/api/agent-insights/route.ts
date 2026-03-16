import { NextResponse } from "next/server";
import {
  agentConfigs,
  type AgentId,
  type AgentScanRow,
} from "@/lib/agent-recommendations";

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

  const topDrivers = [...body.rows]
    .sort((a, b) => b.actual - a.actual)
    .slice(0, 3);

  const fallbackPayload = {
    title: `${config.name} Review`,
    summary: config.fallbackSummary,
    recommendations: config.fallbackRecommendations.map((recommendation, index) =>
      index === 0 && topDrivers[0]
        ? `${recommendation} Focus first on ${topDrivers[0].component}.`
        : recommendation,
    ),
    changes: topDrivers.map((driver, index) => {
      const savingsFactor = [0.92, 0.9, 0.91][index] ?? 0.92;

      return {
        component: driver.component,
        column: config.column,
        currentValue: driver.actual,
        recommendedValue: Number((driver.actual * savingsFactor).toFixed(2)),
        rationale: config.rationaleTemplate(driver.benchmark),
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
    const response = await fetch(
      `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are a footwear pre-costing optimization analyst. Return concise JSON only.",
            },
            {
              role: "user",
              content: JSON.stringify({
                task: `${config.promptFocus} Return JSON with title, summary, recommendations[], and changes[]. Each change must include component, column='${config.column}', currentValue, recommendedValue, rationale.`,
                rows: body.rows,
              }),
            },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json(fallbackPayload);
    }

    const completion = await response.json();
    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(fallbackPayload);
    }

    return NextResponse.json(JSON.parse(content));
  } catch {
    return NextResponse.json(fallbackPayload);
  }
}
