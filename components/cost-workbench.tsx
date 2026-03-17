"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CostTableData } from "@/lib/cost-table";
import {
  agentConfigs,
  classifyAgainstBenchmark,
  hashBenchmark,
  type AgentId,
  type AgentScanRow,
  type RecommendationChange,
  type RecommendationPayload,
  type ScanStatus,
} from "@/lib/agent-recommendations";

type AgentTile = {
  name: string;
  icon: string;
  color: string;
  id: AgentId;
};

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

type AgentExecutionResult = {
  recommendation: RecommendationPayload;
  nextRows: string[][];
  totalBefore: number;
  totalAfter: number;
  recommendationRows: ReportRecommendationRow[];
};

const agentTiles: AgentTile[] = [
  { name: "Material & Wastage", icon: "layers", color: "bg-[#ff6b6b] text-white", id: "material" },
  { name: "Waste", icon: "scissors", color: "bg-[#ff922b] text-white", id: "waste" },
  { name: "Processing", icon: "flow", color: "bg-[#4dabf7] text-white", id: "processing" },
  { name: "Labour", icon: "users", color: "bg-[#51cf66] text-white", id: "labour" },
  { name: "Machine", icon: "gear", color: "bg-[#845ef7] text-white", id: "machine" },
  { name: "Consumable", icon: "drop", color: "bg-[#f59f00] text-white", id: "consumable" },
  { name: "Bought Out Vendor", icon: "box", color: "bg-[#f06595] text-white", id: "vendor" },
  { name: "Inbound Freight", icon: "truck", color: "bg-[#22b8cf] text-white", id: "freight" },
  { name: "Duty / Tariff", icon: "shield", color: "bg-[#fa5252] text-white", id: "duty" },
  { name: "Quality Rejection", icon: "alert", color: "bg-[#495057] text-white", id: "quality" },
];

const visibleHeaders = [
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

const headerLabels: Record<string, string> = {
  Component: "Component",
  Material: "Material",
  Waste: "Waste",
  Processing: "Processing",
  Labour: "Labour",
  Machine: "Machine",
  Consumables: "Consumable",
  "Bought-out / Vendor": "Vendor",
  "Inbound Freight": "Freight",
  "Duty / Tariff": "Duty",
  "Quality Rejection": "Quality",
  "Row Total": "Ex-Factory Costs",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function formatSignedValue(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
}

function cloneRows(rows: string[][]) {
  return rows.map((row) => [...row]);
}

function calculateRowTotal(row: string[], headers: string[]) {
  const costColumns = headers.filter(
    (header) => header !== "Component Group" && header !== "Component" && header !== "Row Total",
  );

  return costColumns.reduce((sum, header) => {
    const index = headers.indexOf(header);
    return sum + Number.parseFloat(row[index] || "0");
  }, 0);
}

function computeTotalCost(rows: string[][], headers: string[]) {
  return rows.reduce((sum, row) => sum + calculateRowTotal(row, headers), 0);
}

function buildTotalRow(rows: string[][], headers: string[]) {
  const totalRow = new Array(headers.length).fill("0.00");

  headers.forEach((header, index) => {
    if (header === "Component Group") {
      totalRow[index] = "TOTAL";
      return;
    }

    if (header === "Component") {
      totalRow[index] = "Landed Cost";
      return;
    }

    if (header === "Waste") {
      totalRow[index] = "";
      return;
    }

    if (header === "Row Total") {
      totalRow[index] = computeTotalCost(rows, headers).toFixed(2);
      return;
    }

    const sum = rows.reduce((acc, row) => acc + Number.parseFloat(row[index] || "0"), 0);
    totalRow[index] = sum.toFixed(2);
  });

  return totalRow;
}

function applyRecommendationChanges(rows: string[][], headers: string[], changes: RecommendationChange[]) {
  const componentIndex = headers.indexOf("Component");
  const nextRows = cloneRows(rows);

  changes.forEach((change) => {
    const row = nextRows.find((entry) => entry[componentIndex] === change.component);

    if (!row) {
      return;
    }

    const columnIndex = headers.indexOf(change.column);

    if (columnIndex === -1) {
      return;
    }

    row[columnIndex] = change.recommendedValue.toFixed(2);
    const rowTotalIndex = headers.indexOf("Row Total");
    row[rowTotalIndex] = calculateRowTotal(row, headers).toFixed(2);
  });

  return nextRows;
}

function buildRecommendationRows(changes: RecommendationChange[]): ReportRecommendationRow[] {
  return changes.map((change) => ({
    component: change.component,
    costHead: change.column,
    recommendation:
      change.proposedSpecification?.trim() ||
      change.recommendation?.trim() ||
      `${change.component} - ${change.column}`,
    oldValue: change.currentValue.toFixed(2),
    newValue: change.recommendedValue.toFixed(2),
    change: formatSignedValue(change.recommendedValue - change.currentValue),
    shapeContext: change.shapeContext
      ? `${change.shapeContext.shapeFamily} · ${change.shapeContext.sizeClass} · ${change.shapeContext.dimensionalIntent.relativeLength}/${change.shapeContext.dimensionalIntent.relativeWidth}`
      : "",
    rationale: change.rationale,
  }));
}

function normalizeRecommendationPayload(agentId: AgentId, payload: RecommendationPayload): RecommendationPayload {
  const config = agentConfigs[agentId];
  const normalizedTitle = payload.title?.trim() ? payload.title : `${config.name} Review`;
  const normalizedSummary = payload.summary?.trim()
    ? `${payload.summary} Focus area: ${config.focusArea}.`
    : `${config.name} review completed. Focus area: ${config.focusArea}.`;

  return {
    ...payload,
    title: normalizedTitle,
    summary: normalizedSummary,
    recommendations: payload.recommendations.map((recommendation) =>
      recommendation.toLowerCase().includes(config.column.toLowerCase()) ||
      recommendation.toLowerCase().includes(config.name.toLowerCase())
        ? recommendation
        : `${config.name}: ${recommendation}`,
    ),
    changes: payload.changes.map((change) => ({
      ...change,
      recommendation:
        change.recommendation?.trim() ||
        change.proposedSpecification?.trim() ||
        config.changeRecommendationTemplate(change.component),
    })),
  };
}

function buildAgentRows(agentId: AgentId, rows: string[][], headers: string[]) {
  const config = agentConfigs[agentId];
  const componentGroupIndex = headers.indexOf("Component Group");
  const componentIndex = headers.indexOf("Component");
  const targetColumnIndex = headers.indexOf(config.column);

  return rows.map((row) => {
    const actual = Number.parseFloat(row[targetColumnIndex] || "0");
    const benchmark = hashBenchmark(row[componentIndex], actual);

    return {
      group: row[componentGroupIndex],
      component: row[componentIndex],
      column: config.column,
      actual,
      benchmark,
      status: classifyAgainstBenchmark(actual, benchmark),
    } satisfies AgentScanRow;
  });
}

async function fetchAgentRecommendation(agentId: AgentId, scanRows: AgentScanRow[]) {
  const response = await fetch("/api/agent-insights", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agentId,
      rows: scanRows,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get agent insights");
  }

  return normalizeRecommendationPayload(agentId, (await response.json()) as RecommendationPayload);
}

function AgentIcon({ type }: { type: string }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-6 w-6",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "layers":
      return (
        <svg {...common}>
          <path d="M12 4 4 8l8 4 8-4-8-4Z" />
          <path d="m4 12 8 4 8-4" />
          <path d="m4 16 8 4 8-4" />
        </svg>
      );
    case "flow":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="6" height="6" rx="1.5" />
          <rect x="14" y="14" width="6" height="6" rx="1.5" />
          <path d="M10 7h4a2 2 0 0 1 2 2v5" />
        </svg>
      );
    case "scissors":
      return (
        <svg {...common}>
          <circle cx="6" cy="7" r="2.5" />
          <circle cx="6" cy="17" r="2.5" />
          <path d="M8 8.5 19 4" />
          <path d="M8 15.5 19 20" />
          <path d="M14 12 19 12" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="10" cy="7" r="3" />
          <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 4.13a3 3 0 0 1 0 5.74" />
        </svg>
      );
    case "gear":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2H9a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1V9c0 .4.2.7.6.8H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.4.2Z" />
        </svg>
      );
    case "drop":
      return (
        <svg {...common}>
          <path d="M12 3s5 5.4 5 9a5 5 0 0 1-10 0c0-3.6 5-9 5-9Z" />
        </svg>
      );
    case "box":
      return (
        <svg {...common}>
          <path d="M21 8.5 12 13 3 8.5" />
          <path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5v-7Z" />
          <path d="M12 13v7" />
        </svg>
      );
    case "truck":
      return (
        <svg {...common}>
          <path d="M10 17H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h8v11Z" />
          <path d="M14 10h3l3 3v4h-6v-7Z" />
          <circle cx="7.5" cy="17.5" r="1.5" />
          <circle cx="17.5" cy="17.5" r="1.5" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 5 6v6c0 5 3.4 8 7 9 3.6-1 7-4 7-9V6l-7-3Z" />
          <path d="M9 12h6" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      );
  }
}

function formatViewLabel(viewId: string) {
  if (viewId === "quarter") {
    return "Lateral";
  }

  return viewId.charAt(0).toUpperCase() + viewId.slice(1);
}

function getDisplayProposedSpec(agentId: AgentId, change: RecommendationChange) {
  return (
    change.proposedSpecification?.trim() ||
    change.recommendation?.trim() ||
    (change.currentSpecification
      ? `${agentConfigs[agentId].changeRecommendationTemplate(change.component)} Current spec: ${change.currentSpecification}.`
      : agentConfigs[agentId].changeRecommendationTemplate(change.component))
  );
}

function getDisplayShapeContext(change: RecommendationChange) {
  if (change.shapeContext) {
    return change.shapeContext;
  }

  return null;
}

type Props = {
  data: CostTableData;
};

export function CostWorkbench({ data }: Props) {
  const router = useRouter();
  const { headers, rows } = data;
  const componentGroupIndex = headers.indexOf("Component Group");
  const componentIndex = headers.indexOf("Component");

  const baseRows = useMemo(() => rows.filter((row) => row[componentGroupIndex] !== "TOTAL"), [rows, componentGroupIndex]);
  const [workingRows, setWorkingRows] = useState<string[][]>(() => cloneRows(baseRows));
  const [activeAgent, setActiveAgent] = useState<AgentId | null>(null);
  const [scanStatuses, setScanStatuses] = useState<Record<string, ScanStatus>>({});
  const [isScanning, setIsScanning] = useState(false);
  const [scanCursor, setScanCursor] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [hoveredAgent, setHoveredAgent] = useState<AgentId | null>(null);
  const [activeRecommendation, setActiveRecommendation] = useState<
    ((RecommendationPayload & { totalBefore: number; totalAfter: number }) & { agentId: AgentId }) | null
  >(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const visibleColumnIndexes = visibleHeaders.map((header) => headers.indexOf(header));
  const totalRow = useMemo(() => buildTotalRow(workingRows, headers), [workingRows, headers]);
  const currentLandedCost = Number.parseFloat(totalRow[headers.indexOf("Row Total")] || "0");

  const groupedRows = useMemo(() => {
    return workingRows.reduce<Record<string, string[][]>>((acc, row) => {
      const group = row[componentGroupIndex];

      if (!acc[group]) {
        acc[group] = [];
      }

      acc[group].push(row);
      return acc;
    }, {});
  }, [workingRows, componentGroupIndex]);

  function toggleGroup(group: string) {
    setOpenGroups((current) => ({
      ...current,
      [group]: !(current[group] ?? false),
    }));
  }

  async function scanRows(agentId: AgentId, scanRowsForAgent: AgentScanRow[]) {
    const nextOpenGroups = Object.keys(groupedRows).reduce<Record<string, boolean>>((acc, group) => {
      acc[group] = true;
      return acc;
    }, {});

    setActiveAgent(agentId);
    setOpenGroups(nextOpenGroups);
    setScanStatuses({});
    setScanCursor(null);

    for (const row of scanRowsForAgent) {
      const key = `${row.group}-${row.component}`;
      setScanCursor(key);
      await sleep(180);
      setScanStatuses((current) => ({
        ...current,
        [key]: row.status,
      }));
    }

    setScanCursor(null);
  }

  async function executeAgent(agentId: AgentId, sourceRows: string[][]): Promise<AgentExecutionResult> {
    const scanRowsForAgent = buildAgentRows(agentId, sourceRows, headers);
    const totalBefore = computeTotalCost(sourceRows, headers);
    const recommendation = await fetchAgentRecommendation(agentId, scanRowsForAgent);
    const nextRows = applyRecommendationChanges(sourceRows, headers, recommendation.changes);
    const totalAfter = computeTotalCost(nextRows, headers);

    return {
      recommendation,
      nextRows,
      totalBefore,
      totalAfter,
      recommendationRows: buildRecommendationRows(recommendation.changes),
    };
  }

  async function runSingleAgent(agentId: AgentId) {
    setFlashMessage(null);
    setIsScanning(true);
    setActiveRecommendation(null);

    try {
      const scanRowsForAgent = buildAgentRows(agentId, workingRows, headers);
      await scanRows(agentId, scanRowsForAgent);
      const result = await executeAgent(agentId, workingRows);
      setWorkingRows(result.nextRows);
      setActiveRecommendation({
        ...result.recommendation,
        agentId,
        totalBefore: result.totalBefore,
        totalAfter: result.totalAfter,
      });
      setFlashMessage(`${agentConfigs[agentId].name} recommendations applied to the current sheet.`);
    } catch {
      setFlashMessage(`Unable to run the ${agentConfigs[agentId].name} agent right now.`);
    } finally {
      setIsScanning(false);
    }
  }

  async function runAllAgents() {
    setFlashMessage(null);
    setIsScanning(true);
    setActiveRecommendation(null);

    try {
      let nextRows = cloneRows(workingRows);
      const currentRows = cloneRows(workingRows);
      const recommendationRows: ReportRecommendationRow[] = [];
      const totalBefore = computeTotalCost(currentRows, headers);

      for (const agent of agentTiles) {
        const scanRowsForAgent = buildAgentRows(agent.id, nextRows, headers);
        await scanRows(agent.id, scanRowsForAgent);
        const result = await executeAgent(agent.id, nextRows);
        nextRows = result.nextRows;
        recommendationRows.push(...result.recommendationRows);
      }

      setWorkingRows(nextRows);

      const totalAfter = computeTotalCost(nextRows, headers);
      const reportId = crypto.randomUUID();
      const reportPayload: CostReportPayload = {
        headers,
        currentRows: cloneRows(currentRows),
        newRows: cloneRows(nextRows),
        recommendations: recommendationRows,
        summary: {
          totalBefore,
          totalAfter,
          netChange: totalAfter - totalBefore,
          recommendationCount: recommendationRows.length,
        },
      };

      window.localStorage.setItem(`precosting-report:${reportId}`, JSON.stringify(reportPayload));
      router.push(`/cost/report?id=${reportId}`);
    } catch {
      setFlashMessage("Unable to complete the run-all flow right now.");
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="w-full lg:pl-[88px]">
      <aside className="agent-dock w-[86px] rounded-[24px] p-3 lg:fixed lg:left-6 lg:top-1/2 lg:z-20 lg:max-h-[calc(100vh-48px)] lg:-translate-y-1/2 lg:overflow-y-auto">
        <div className="flex flex-col items-center gap-3">
          {agentTiles.map((agent) => (
            <div key={agent.name} className="group relative">
              <button
                type="button"
                className={`agent-button rounded-[18px] p-1 text-center ${
                  activeAgent === agent.id ? "scale-[1.04]" : ""
                }`}
                aria-label={agent.name}
                title={agent.name}
                onMouseEnter={() => setHoveredAgent(agent.id)}
                onMouseLeave={() => setHoveredAgent((current) => (current === agent.id ? null : current))}
                onFocus={() => setHoveredAgent(agent.id)}
                onBlur={() => setHoveredAgent((current) => (current === agent.id ? null : current))}
                onClick={() => {
                  void runSingleAgent(agent.id);
                }}
              >
                <span
                  className={`agent-button-icon mx-auto flex h-[52px] w-[52px] items-center justify-center rounded-[14px] ${agent.color}`}
                >
                  <AgentIcon type={agent.icon} />
                </span>
              </button>
              <div
                className={`pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black shadow-sm transition ${
                  hoveredAgent === agent.id ? "opacity-100 translate-x-0" : "translate-x-1 opacity-0"
                }`}
              >
                {agent.name}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section className="mr-4 w-auto overflow-hidden rounded-[24px] border border-black/8 bg-white sm:mr-5 lg:mr-6">
        <div className="border-b border-black/6 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">Line Item Breakdown</p>
              <p className="mt-2 text-sm text-black/55">
                Directional costing worksheet for concept review.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isScanning ? (
                <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700">
                  {activeAgent ? `Scanning ${agentConfigs[activeAgent].name.toLowerCase()}...` : "Scanning..."}
                </div>
              ) : null}
              <div className="rounded-full border border-black/10 px-3 py-2 text-sm text-black/65">
                Landed cost: <span className="font-semibold text-black">{currentLandedCost.toFixed(2)}</span>
              </div>
              <button
                type="button"
                className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/85"
                onClick={() => {
                  void runAllAgents();
                }}
              >
                Run All Agents
              </button>
            </div>
          </div>
          {flashMessage ? (
            <p className="mt-3 text-sm font-medium text-emerald-700">{flashMessage}</p>
          ) : null}
        </div>

        <div className="space-y-3 px-3 py-3 pb-5 pr-6 sm:px-4 sm:pb-6 sm:pr-8">
          {Object.entries(groupedRows).map(([group, groupRows]) => {
            const subtotal = groupRows
              .reduce((sum, row) => sum + Number.parseFloat(row[headers.indexOf("Row Total")] || "0"), 0)
              .toFixed(2);
            const isOpen = openGroups[group] ?? false;

            return (
              <div
                key={group}
                className="accordion-group overflow-hidden rounded-[18px] border border-black/8"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 bg-black/[0.02] px-4 py-3 text-left"
                  onClick={() => toggleGroup(group)}
                >
                  <div>
                    <p className="text-sm font-semibold text-black">{group}</p>
                    <p className="text-xs text-black/45">{groupRows.length} line items</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-black/45">
                      Ex-Factory {subtotal}
                    </p>
                    <span className="text-sm text-black/45">{isOpen ? "-" : "+"}</span>
                  </div>
                </button>

                {isOpen ? (
                  <div className="px-2 py-2 sm:px-3">
                    <table className="data-table w-full table-fixed text-[11px]">
                      <thead>
                        <tr>
                          {visibleHeaders.map((header) => (
                            <th key={`${group}-${header}`}>{headerLabels[header]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {groupRows.map((row) => {
                          const rowKey = `${group}-${row[componentIndex]}`;

                          return (
                            <tr key={rowKey}>
                              {visibleColumnIndexes.map((index, visibleIndex) => {
                                const targetColumn = activeAgent ? agentConfigs[activeAgent].column : null;
                                const isTargetCell = visibleHeaders[visibleIndex] === targetColumn;
                                const status = scanStatuses[rowKey];
                                const isCurrentScan = scanCursor === rowKey && isTargetCell;

                                return (
                                  <td
                                    key={`${rowKey}-${visibleHeaders[visibleIndex]}`}
                                    className={visibleIndex === 0 ? "font-semibold break-words" : ""}
                                    style={
                                      isTargetCell && status
                                        ? {
                                            backgroundColor:
                                              status === "green"
                                                ? "rgba(81, 207, 102, 0.22)"
                                                : status === "amber"
                                                  ? "rgba(245, 159, 0, 0.24)"
                                                  : "rgba(250, 82, 82, 0.22)",
                                            boxShadow: `inset 0 0 0 1px ${
                                              status === "green"
                                                ? "rgba(81, 207, 102, 0.28)"
                                                : status === "amber"
                                                  ? "rgba(245, 159, 0, 0.28)"
                                                  : "rgba(250, 82, 82, 0.28)"
                                            }`,
                                          }
                                        : isCurrentScan
                                          ? {
                                              backgroundColor: "rgba(74, 171, 247, 0.16)",
                                              boxShadow: "inset 0 0 0 1px rgba(74,171,247,0.28)",
                                            }
                                          : undefined
                                    }
                                  >
                                    {row[index]}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            );
          })}

          <div className="rounded-[18px] border border-black/10 bg-black/[0.03] px-4 py-3">
            <div className="grid grid-cols-[1.2fr_repeat(11,minmax(0,1fr))] gap-3 text-sm">
              <div>
                <p className="font-semibold text-black">TOTAL</p>
                <p className="text-black/55">{totalRow[componentIndex]}</p>
              </div>
              {visibleColumnIndexes.slice(1).map((index, i) => (
                <div key={`total-${visibleHeaders[i + 1]}`}>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-black/45">
                    {headerLabels[visibleHeaders[i + 1]]}
                  </p>
                  <p className="mt-1 font-semibold text-black">{totalRow[index]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {activeRecommendation ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 px-4"
          onClick={() => setActiveRecommendation(null)}
        >
          <div
            className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[24px] border border-black/10 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Agent Output</p>
                <h3 className="mt-2 text-2xl font-semibold text-black">{activeRecommendation.title}</h3>
                <p className="mt-2 text-sm text-black/55">{activeRecommendation.summary}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
                  Focus area: {agentConfigs[activeRecommendation.agentId].focusArea}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-black/10 px-3 py-1 text-sm text-black/60"
                onClick={() => setActiveRecommendation(null)}
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[18px] border border-black/8 bg-black/[0.02] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Before</p>
                <p className="mt-2 text-xl font-semibold text-black">{activeRecommendation.totalBefore.toFixed(2)}</p>
              </div>
              <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700">After</p>
                <p className="mt-2 text-xl font-semibold text-black">{activeRecommendation.totalAfter.toFixed(2)}</p>
              </div>
              <div className="rounded-[18px] border border-sky-200 bg-sky-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sky-700">Change</p>
                <p className="mt-2 text-xl font-semibold text-black">
                  {formatSignedValue(activeRecommendation.totalAfter - activeRecommendation.totalBefore)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {activeRecommendation.changes.map((change) => (
                <div key={`${change.component}-${change.column}`} className="rounded-[18px] border border-red-200 bg-red-50 p-4">
                  {(() => {
                    const displayProposedSpec = getDisplayProposedSpec(activeRecommendation.agentId, change);
                    const displayShapeContext = getDisplayShapeContext(change);

                    return (
                      <>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-red-500">
                    {agentConfigs[activeRecommendation.agentId].name}
                  </p>
                  <h4 className="mt-2 text-sm font-semibold text-black">{change.component}</h4>
                  <p className="mt-1 text-sm text-black/60">{change.column}</p>
                  <div className="mt-3 rounded-[14px] bg-white/80 p-3 text-xs text-black/70">
                      <p className="font-semibold uppercase tracking-[0.08em] text-black/45">Proposed Spec</p>
                      <p className="mt-2 text-sm font-medium text-black">{displayProposedSpec}</p>
                    </div>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="rounded-full bg-white px-2 py-1 text-black/60">{change.currentValue.toFixed(2)}</span>
                    <span className="text-black/35">{"->"}</span>
                    <span className="rounded-full bg-black px-2 py-1 text-white">{change.recommendedValue.toFixed(2)}</span>
                  </div>
                  <details className="mt-3 rounded-[14px] bg-white/70 p-3 text-xs text-black/70">
                    <summary className="cursor-pointer font-semibold text-black">Specification Details</summary>
                    <div className="mt-2 space-y-2">
                      <p>
                        <span className="font-semibold text-black">Current spec:</span>{" "}
                        {change.currentSpecification || "Not available"}
                      </p>
                      <p>
                        <span className="font-semibold text-black">Proposed spec:</span> {displayProposedSpec}
                      </p>
                    </div>
                  </details>
                  <details className="mt-3 rounded-[14px] bg-white/70 p-3 text-xs text-black/70">
                    <summary className="cursor-pointer font-semibold text-black">Shape Context</summary>
                    <div className="mt-2 space-y-2">
                      {displayShapeContext ? (
                        <>
                          <p>
                            <span className="font-semibold text-black">Shape:</span> {displayShapeContext.shapeFamily}
                          </p>
                          <p>
                            <span className="font-semibold text-black">Size:</span> {displayShapeContext.sizeClass}
                          </p>
                          <p>
                            <span className="font-semibold text-black">Geometry:</span>{" "}
                            {displayShapeContext.dimensionalIntent.relativeLength}/
                            {displayShapeContext.dimensionalIntent.relativeWidth}/
                            {displayShapeContext.dimensionalIntent.relativeThickness}
                          </p>
                          <p>
                            <span className="font-semibold text-black">Views:</span>{" "}
                            {displayShapeContext.visibleViews
                              .map((view) =>
                                view.estimatedFootprintPct
                                  ? `${formatViewLabel(view.viewId)} ${view.estimatedFootprintPct.width}x${view.estimatedFootprintPct.height}%`
                                  : formatViewLabel(view.viewId),
                              )
                              .join(", ")}
                          </p>
                        </>
                      ) : (
                        <p>Not available</p>
                      )}
                    </div>
                  </details>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[18px] border border-black/8 bg-black/[0.02] p-4">
              <p className="text-sm font-semibold text-black">Recommendations</p>
              <ul className="mt-3 space-y-3 text-sm text-black/68">
                {activeRecommendation.recommendations.map((recommendation) => (
                  <li key={recommendation}>{recommendation}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
