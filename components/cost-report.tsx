"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AdvancedInsightsPayload } from "@/lib/advanced-insights";

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

type AdvancedModalState = {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  payload: AdvancedInsightsPayload | null;
};

type TabId = "current" | "new" | "recommendations";

const tabs: { id: TabId; label: string }[] = [
  { id: "current", label: "Current Cost" },
  { id: "new", label: "New Cost" },
  { id: "recommendations", label: "Recommendations" },
];

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function ExecutiveStatCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "neutral" | "blue" | "green" | "slate";
}) {
  const toneClasses = {
    neutral: "border-black/8 bg-white text-black",
    blue: "border-[var(--accent)]/20 bg-[var(--accent)]/[0.07] text-black",
    green: "border-emerald-200 bg-emerald-50 text-black",
    slate: "border-black/8 bg-[#f5f7fb] text-black",
  } satisfies Record<string, string>;

  return (
    <div className={`rounded-[20px] border p-4 shadow-[0_10px_24px_rgba(17,17,17,0.05)] ${toneClasses[tone]}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/48">{label}</p>
      <p className="mt-3 text-[1.9rem] font-semibold leading-none text-black">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-5 text-black/62">{detail}</p> : null}
    </div>
  );
}

function AccordionSection({
  index,
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  index: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-[24px] border border-black/8 bg-white shadow-[0_16px_34px_rgba(17,17,17,0.06)]">
      <button
        type="button"
        className="w-full cursor-pointer bg-[linear-gradient(180deg,rgba(0,76,151,0.08),rgba(255,255,255,0.75))] px-5 py-4 text-left"
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--accent)] text-sm font-bold tracking-[0.16em] text-white shadow-[0_12px_24px_rgba(0,76,151,0.2)]">
              {index}
            </div>
            <div>
              <p className="text-lg font-semibold text-black">{title}</p>
              <p className="mt-1 max-w-3xl text-sm text-black/55">{subtitle}</p>
            </div>
          </div>
          <span className="rounded-full border border-[var(--accent)]/15 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            {isOpen ? "Close Brief" : "Open Brief"}
          </span>
        </div>
      </button>
      {isOpen ? <div className="border-t border-black/6 px-5 py-5">{children}</div> : null}
    </div>
  );
}

const tableHeaders = [
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

function buildTotalRow(rows: string[][], headers: string[]) {
  const componentGroupIndex = headers.indexOf("Component Group");
  const componentIndex = headers.indexOf("Component");
  const rowTotalIndex = headers.indexOf("Row Total");
  const totalRow = new Array(headers.length).fill("0.00");

  headers.forEach((header, index) => {
    if (header === "Component Group") {
      totalRow[index] = "TOTAL";
    } else if (header === "Component") {
      totalRow[index] = "Landed Cost";
    } else if (header === "Waste") {
      totalRow[index] = "";
    } else if (header === "Row Total") {
      const total = rows.reduce((sum, row) => sum + Number.parseFloat(row[rowTotalIndex] || "0"), 0);
      totalRow[index] = total.toFixed(2);
    } else {
      const sum = rows.reduce((acc, row) => acc + Number.parseFloat(row[index] || "0"), 0);
      totalRow[index] = sum.toFixed(2);
    }
  });

  totalRow[componentGroupIndex] = "TOTAL";
  totalRow[componentIndex] = "Landed Cost";
  return totalRow;
}

function CostTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  const componentGroupIndex = headers.indexOf("Component Group");
  const componentIndex = headers.indexOf("Component");
  const visibleIndexes = tableHeaders.map((header) => headers.indexOf(header));
  const groupedRows = useMemo(() => {
    return rows.reduce<Record<string, string[][]>>((acc, row) => {
      const group = row[componentGroupIndex];

      if (!acc[group]) {
        acc[group] = [];
      }

      acc[group].push(row);
      return acc;
    }, {});
  }, [rows, componentGroupIndex]);
  const totalRow = useMemo(() => buildTotalRow(rows, headers), [rows, headers]);

  return (
    <div className="space-y-3">
      {Object.entries(groupedRows).map(([group, groupRows]) => (
        <div key={group} className="overflow-hidden rounded-[18px] border border-black/8">
          <div className="flex items-center justify-between gap-4 bg-black/[0.02] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-black">{group}</p>
              <p className="text-xs text-black/45">{groupRows.length} line items</p>
            </div>
          </div>
          <div className="px-3 py-3">
            <table className="data-table w-full table-fixed text-[11px]">
              <thead>
                <tr>
                  {tableHeaders.map((header) => (
                    <th key={`${group}-${header}`}>{headerLabels[header]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupRows.map((row) => (
                  <tr key={`${group}-${row[componentIndex]}`}>
                    {visibleIndexes.map((index, visibleIndex) => (
                      <td
                        key={`${group}-${row[componentIndex]}-${tableHeaders[visibleIndex]}`}
                        className={visibleIndex === 0 ? "font-semibold break-words" : ""}
                      >
                        {row[index]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="rounded-[18px] border border-black/10 bg-black/[0.03] px-4 py-3">
        <div className="grid grid-cols-[1.2fr_repeat(11,minmax(0,1fr))] gap-3 text-sm">
          <div>
            <p className="font-semibold text-black">TOTAL</p>
            <p className="text-black/55">{totalRow[componentIndex]}</p>
          </div>
          {visibleIndexes.slice(1).map((index, i) => (
            <div key={`total-${tableHeaders[i + 1]}`}>
              <p className="text-[11px] uppercase tracking-[0.08em] text-black/45">
                {headerLabels[tableHeaders[i + 1]]}
              </p>
              <p className="mt-1 font-semibold text-black">{totalRow[index]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CostReport() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>("current");
  const [advancedModal, setAdvancedModal] = useState<AdvancedModalState>({
    isOpen: false,
    isLoading: false,
    error: null,
    payload: null,
  });
  const reportId = searchParams.get("id");
  const report = useMemo(() => {
    if (!reportId || typeof window === "undefined") {
      return null;
    }

    const saved = window.localStorage.getItem(`precosting-report:${reportId}`);
    return saved ? (JSON.parse(saved) as CostReportPayload) : null;
  }, [reportId]);

  if (!reportId || !report) {
    return (
      <section className="mx-auto max-w-5xl rounded-[24px] border border-black/8 bg-white p-6">
        <p className="eyebrow">Cost Sheet</p>
        <h2 className="mt-2 text-2xl font-semibold text-black">No generated report found</h2>
        <p className="mt-2 text-sm text-black/55">
          Run all agents from the cost estimator to generate a new comparison sheet.
        </p>
        <Link href="/cost" className="mt-5 inline-flex rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
          Back to estimator
        </Link>
      </section>
    );
  }

  async function openAdvancedModal() {
    setAdvancedModal((current) => ({
      ...current,
      isOpen: true,
      error: null,
      isLoading: current.payload ? false : true,
    }));

    if (typeof window === "undefined") {
      return;
    }

    const cacheKey = `precosting-advanced:${reportId}`;
    const cached = window.localStorage.getItem(cacheKey);

    if (cached) {
      setAdvancedModal({
        isOpen: true,
        isLoading: false,
        error: null,
        payload: JSON.parse(cached) as AdvancedInsightsPayload,
      });
      return;
    }

    try {
      const response = await fetch("/api/advanced-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ report }),
      });

      if (!response.ok) {
        throw new Error("Failed to get advanced insights");
      }

      const payload = (await response.json()) as AdvancedInsightsPayload;
      window.localStorage.setItem(cacheKey, JSON.stringify(payload));
      setAdvancedModal({
        isOpen: true,
        isLoading: false,
        error: null,
        payload,
      });
    } catch {
      setAdvancedModal({
        isOpen: true,
        isLoading: false,
        error: "Unable to generate advanced recommendations right now.",
        payload: null,
      });
    }
  }

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div className="rounded-[24px] border border-black/8 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Cost Sheet</p>
            <h2 className="mt-2 text-3xl font-semibold text-black">Run-All Cost Comparison</h2>
            <p className="mt-2 text-sm text-black/55">
              New landed cost generated from all agent recommendations.
            </p>
          </div>
          <Link href="/cost" className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-black">
            Back to estimator
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[18px] border border-black/8 bg-black/[0.02] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Current Landed Cost</p>
            <p className="mt-2 text-2xl font-semibold text-black">{report.summary.totalBefore.toFixed(2)}</p>
          </div>
          <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700">New Landed Cost</p>
            <p className="mt-2 text-2xl font-semibold text-black">{report.summary.totalAfter.toFixed(2)}</p>
          </div>
          <div className="rounded-[18px] border border-sky-200 bg-sky-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sky-700">Net Change</p>
            <p className="mt-2 text-2xl font-semibold text-black">
              {report.summary.netChange > 0 ? "+" : ""}
              {report.summary.netChange.toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-black/55">
              {report.summary.recommendationCount} recommendation changes applied
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-black/8 bg-white p-4">
        <div className="flex flex-wrap gap-2 border-b border-black/8 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id ? "bg-[var(--accent-strong)] text-white" : "bg-black/4 text-black/72 hover:bg-black/8"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {activeTab === "current" ? (
            <CostTable headers={report.headers} rows={report.currentRows} />
          ) : null}

          {activeTab === "new" ? (
            <CostTable headers={report.headers} rows={report.newRows} />
          ) : null}

          {activeTab === "recommendations" ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-[18px] border border-black/8 bg-black/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-black">Advanced scenario planning</p>
                  <p className="mt-1 text-sm text-black/55">
                    Generate a deeper design, sourcing, MSRP, margin, and volume readout for this recommended cost sheet.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/85"
                  onClick={() => {
                    void openAdvancedModal();
                  }}
                >
                  Advanced
                </button>
              </div>

              <div className="overflow-hidden rounded-[18px] border border-black/8">
                <table className="data-table w-full text-sm">
                  <colgroup>
                    <col className="w-[18%]" />
                    <col className="w-[10%]" />
                    <col className="w-[34%]" />
                    <col className="w-[18%]" />
                    <col className="w-[7%]" />
                    <col className="w-[7%]" />
                    <col className="w-[10%]" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Cost Head</th>
                      <th>Recommendation</th>
                      <th>Shape Context</th>
                      <th>Old Value</th>
                      <th>New Value</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.recommendations.map((row) => (
                      <tr key={`${row.recommendation}-${row.oldValue}-${row.newValue}`}>
                        <td className="font-semibold">{row.component}</td>
                        <td>{row.costHead}</td>
                        <td className="font-semibold">{row.recommendation}</td>
                        <td>{row.shapeContext || "-"}</td>
                        <td>{row.oldValue}</td>
                        <td>{row.newValue}</td>
                        <td>{row.change}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {advancedModal.isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6"
          onClick={() =>
            setAdvancedModal((current) => ({
              ...current,
              isOpen: false,
            }))
          }
        >
          <div
            className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[28px] border border-black/10 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-6 border-b border-black/8 bg-[linear-gradient(135deg,#0b1e3f_0%,#004c97_48%,#dce8f6_160%)] px-6 py-6 text-white shadow-[0_18px_34px_rgba(17,17,17,0.14)] backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/74">Advanced Scenario</p>
                  <h3 className="mt-2 text-3xl font-semibold text-white">
                    {advancedModal.payload?.title || "Advanced Cost and Commercial View"}
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm text-white/78">
                    {advancedModal.payload?.summary ||
                      "Generating design-safe cost changes, vendor options, market pricing, and volume economics."}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-3 lg:items-end">
                  {advancedModal.payload ? (
                    <div className="rounded-[18px] border border-white/18 bg-white/10 px-4 py-3 backdrop-blur">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">Executive View</p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {advancedModal.payload.demandOutlook.demandSignal.toUpperCase()} demand · {formatPercent(advancedModal.payload.targetCostReductionPct)} modeled reduction
                      </p>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="inline-flex rounded-full border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-[var(--accent)] shadow-[0_8px_20px_rgba(17,17,17,0.14)]"
                    onClick={() =>
                      setAdvancedModal((current) => ({
                        ...current,
                        isOpen: false,
                      }))
                    }
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            {advancedModal.isLoading ? (
              <div className="py-16 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-black/12 border-t-black" />
                <p className="mt-4 text-sm text-black/55">
                  Generating advanced design, sourcing, and pricing guidance.
                </p>
              </div>
            ) : null}

            {advancedModal.error ? (
              <div className="mt-6 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {advancedModal.error}
              </div>
            ) : null}

            {!advancedModal.isLoading && advancedModal.payload ? (
              <div className="mt-6 space-y-6">
                <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr]">
                  <div className="rounded-[24px] bg-[linear-gradient(135deg,#f7fbff_0%,#e8f1fb_55%,#ffffff_100%)] p-5 shadow-[0_18px_36px_rgba(17,17,17,0.06)]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Board Summary</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <ExecutiveStatCard
                        label="Current Landed"
                        value={formatCurrency(advancedModal.payload.marginSnapshot.currentLandedCost)}
                        detail={`${formatCurrency(advancedModal.payload.marginSnapshot.suggestedWholesalePrice)} wholesale anchor`}
                        tone="neutral"
                      />
                      <ExecutiveStatCard
                        label="Achievable Landed"
                        value={formatCurrency(advancedModal.payload.costReductionPlan.achievableLandedCost)}
                        detail={`Recommendation case from the current landed baseline`}
                        tone="green"
                      />
                      <ExecutiveStatCard
                        label="Modeled Reduction"
                        value={formatPercent(advancedModal.payload.targetCostReductionPct)}
                        detail={`${formatCurrency(advancedModal.payload.marginSnapshot.optimizedLandedCost)} optimized landed view`}
                        tone="blue"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                    <ExecutiveStatCard
                      label="Demand Signal"
                      value={advancedModal.payload.demandOutlook.demandSignal.toUpperCase()}
                      detail={`${formatCompactNumber(advancedModal.payload.demandOutlook.forecastAnnualUnits)} units forecast`}
                      tone="blue"
                    />
                    <ExecutiveStatCard
                      label="Recommended Posture"
                      value={advancedModal.payload.marginVolumePlaybook.recommendedPosture}
                      detail={advancedModal.payload.retailPositioning.positionNote}
                      tone="slate"
                    />
                  </div>
                </div>

                <AccordionSection
                  index="01"
                  title="Demand Outlook"
                  subtitle="Synthetic historical sales and forward demand signal used to shape the strategy."
                >
                  <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-[18px] border border-black/8 bg-black/[0.02] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Demand Thesis</p>
                      <p className="mt-3 text-2xl font-semibold text-black">
                        {advancedModal.payload.demandOutlook.archetype}
                      </p>
                      <p className="mt-2 text-sm text-black/60">
                        {advancedModal.payload.demandOutlook.marketPosition} · Price sensitivity {advancedModal.payload.demandOutlook.priceSensitivity}
                      </p>
                      <p className="mt-4 text-sm leading-6 text-black/68">
                        {advancedModal.payload.demandOutlook.insight}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-black/8 bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Historical Sales</p>
                      <div className="mt-3 overflow-hidden rounded-[14px] border border-black/8">
                        <table className="data-table w-full text-sm">
                          <thead>
                            <tr>
                              <th>Season</th>
                              <th>Units</th>
                              <th>Sell-through</th>
                              <th>Avg MSRP</th>
                            </tr>
                          </thead>
                          <tbody>
                            {advancedModal.payload.demandOutlook.historicalSales.map((entry, index) => (
                              <tr key={`historical-sales-${index}`}>
                                <td>{entry.season}</td>
                                <td>{formatCompactNumber(entry.units)}</td>
                                <td>{formatPercent(entry.sellThroughPct)}</td>
                                <td>{formatCurrency(entry.avgRetailPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-4">
                        {advancedModal.payload.demandOutlook.forecastQuarters.map((entry, index) => (
                          <div key={`forecast-quarter-${index}`} className="rounded-[14px] bg-black/[0.02] p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">{entry.quarter}</p>
                            <p className="mt-2 text-lg font-semibold text-black">{formatCompactNumber(entry.units)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionSection>

                <AccordionSection
                  index="02"
                  title="Cost Reduction Plan"
                  subtitle="Recommendation-based landed cost plan built from design, sourcing, and commercial changes."
                >
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-[18px] border border-black/8 bg-black/[0.02] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Current</p>
                      <p className="mt-2 text-xl font-semibold text-black">{formatCurrency(advancedModal.payload.costReductionPlan.currentLandedCost)}</p>
                    </div>
                    <div className="rounded-[18px] border border-sky-200 bg-sky-50 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sky-700">Recommendation Case</p>
                      <p className="mt-2 text-xl font-semibold text-black">{formatCurrency(advancedModal.payload.marginSnapshot.optimizedLandedCost)}</p>
                    </div>
                    <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700">Achievable</p>
                      <p className="mt-2 text-xl font-semibold text-black">{formatCurrency(advancedModal.payload.costReductionPlan.achievableLandedCost)}</p>
                    </div>
                    <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-700">Reduction Vs Current</p>
                      <p className="mt-2 text-xl font-semibold text-black">
                        {formatPercent(
                          ((advancedModal.payload.costReductionPlan.currentLandedCost -
                            advancedModal.payload.costReductionPlan.achievableLandedCost) /
                            advancedModal.payload.costReductionPlan.currentLandedCost) *
                            100,
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {advancedModal.payload.costReductionPlan.levers.map((lever, index) => (
                      <div key={`cost-lever-${index}`} className="rounded-[20px] border border-black/8 bg-[linear-gradient(180deg,rgba(245,247,251,0.92),#ffffff)] p-4 shadow-[0_10px_24px_rgba(17,17,17,0.05)]">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-black">{lever.lever}</p>
                            <p className="mt-1 text-sm text-black/55">{lever.area}</p>
                          </div>
                          <div className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white">
                            {formatPercent(lever.estimatedSavingsPct)} savings
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-black/68">{lever.action}</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-[14px] bg-white p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Unit Impact</p>
                            <p className="mt-2 font-semibold text-black">{formatCurrency(lever.estimatedUnitSavings)}</p>
                          </div>
                          <div className="rounded-[14px] bg-white p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Difficulty</p>
                            <p className="mt-2 font-semibold capitalize text-black">{lever.difficulty}</p>
                          </div>
                          <div className="rounded-[14px] bg-white p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Timing</p>
                            <p className="mt-2 font-semibold text-black">{lever.timing}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionSection>

                <AccordionSection
                  index="03"
                  title="Design Changes"
                  subtitle="Construction and geometry changes that protect performance intent."
                >
                    <div className="mt-4 grid gap-3">
                      {advancedModal.payload.designChanges.map((change, index) => (
                        <div key={`design-change-${index}-${change.component}`} className="rounded-[18px] border border-black/8 bg-black/[0.02] p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-black">{change.component}</p>
                              <p className="mt-1 text-sm text-black/60">{change.currentDirection}</p>
                            </div>
                            <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              {formatCurrency(change.estimatedUnitImpact)} unit impact
                            </div>
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div className="rounded-[14px] bg-white p-3">
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Proposed Change</p>
                              <p className="mt-2 text-sm font-medium text-black">{change.proposedChange}</p>
                            </div>
                            <div className="rounded-[14px] bg-white p-3">
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Performance Guardrail</p>
                              <p className="mt-2 text-sm text-black">{change.performanceGuardrail}</p>
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-black/62">{change.vendorAction}</p>
                          <div className="mt-3 rounded-[14px] bg-white p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Why This Matters</p>
                            <p className="mt-2 text-sm text-black/68">{change.strategicReason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                </AccordionSection>

                <AccordionSection
                  index="04"
                  title="Margin-Volume Playbook"
                  subtitle="Recommended commercial posture based on expected demand rather than a generic pricing assumption."
                >
                  <div className="rounded-[18px] border border-black/8 bg-black/[0.02] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Recommended Posture</p>
                    <p className="mt-2 text-2xl font-semibold text-black">{advancedModal.payload.marginVolumePlaybook.recommendedPosture}</p>
                    <p className="mt-3 text-sm leading-6 text-black/68">{advancedModal.payload.marginVolumePlaybook.rationale}</p>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {advancedModal.payload.marginVolumePlaybook.scenarios.map((scenario, index) => (
                      <div key={`playbook-scenario-${index}`} className="rounded-[18px] border border-black/8 bg-black/[0.02] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-black">{scenario.name}</p>
                            <p className="mt-1 text-sm text-black/55">{scenario.useWhen}</p>
                          </div>
                          <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                            {formatCompactNumber(scenario.annualVolume)} annual units
                          </div>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-4">
                          <div className="rounded-[14px] bg-white p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">MSRP</p>
                            <p className="mt-2 font-semibold text-black">{formatCurrency(scenario.targetRetailPrice)}</p>
                          </div>
                          <div className="rounded-[14px] bg-white p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Wholesale</p>
                            <p className="mt-2 font-semibold text-black">{formatCurrency(scenario.targetWholesalePrice)}</p>
                          </div>
                          <div className="rounded-[14px] bg-white p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Gross Margin</p>
                            <p className="mt-2 font-semibold text-black">{formatPercent(scenario.grossMarginPct)}</p>
                          </div>
                          <div className="rounded-[14px] bg-white p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Contribution</p>
                            <p className="mt-2 font-semibold text-black">{formatCurrency(scenario.contributionProfit)}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-black/68">{scenario.recommendation}</p>
                        <p className="mt-2 text-sm text-black/55">Channel mix: {scenario.channelMix}</p>
                      </div>
                    ))}
                  </div>
                </AccordionSection>

                <AccordionSection
                  index="05"
                  title="Vendor Moves"
                  subtitle="Synthetic sourcing options aligned to the recommended cost-down areas."
                >
                      <div className="grid gap-3">
                        {advancedModal.payload.vendorStrategies.map((strategy, index) => (
                          <div key={`vendor-strategy-${index}-${strategy.vendor}`} className="rounded-[18px] border border-black/8 bg-black/[0.02] p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-black">{strategy.vendor}</p>
                                <p className="mt-1 text-sm text-black/55">
                                  {strategy.region} · {strategy.specialization}
                                </p>
                              </div>
                              <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                                {strategy.estimatedSavingsPct.toFixed(1)}% savings
                              </div>
                            </div>
                            <p className="mt-3 text-sm text-black/65">{strategy.proposedChange}</p>
                            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                              <div className="rounded-[14px] bg-white p-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Target</p>
                                <p className="mt-2 font-medium text-black">{strategy.targetComponent}</p>
                              </div>
                              <div className="rounded-[14px] bg-white p-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">MOQ</p>
                                <p className="mt-2 font-medium text-black">{formatCompactNumber(strategy.moqPairs)} pairs</p>
                              </div>
                              <div className="rounded-[14px] bg-white p-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Lead Time</p>
                                <p className="mt-2 font-medium text-black">{strategy.leadTimeDays} days</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                </AccordionSection>

                <AccordionSection
                  index="06"
                  title="Market Pricing"
                  subtitle="Similar-model MSRP anchors from official brand sites."
                >
                      <div className="mt-4 rounded-[18px] border border-black/8 bg-black/[0.02] p-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Peer Average</p>
                            <p className="mt-2 text-xl font-semibold text-black">
                              {formatCurrency(advancedModal.payload.retailPositioning.averageMarketPrice)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Market Band</p>
                            <p className="mt-2 text-xl font-semibold text-black">
                              {formatCurrency(advancedModal.payload.retailPositioning.priceBandLow)} to{" "}
                              {formatCurrency(advancedModal.payload.retailPositioning.priceBandHigh)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Suggested</p>
                            <p className="mt-2 text-xl font-semibold text-black">
                              {formatCurrency(advancedModal.payload.retailPositioning.suggestedRetailPrice)}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-black/60">
                          {advancedModal.payload.retailPositioning.positionNote}
                        </p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {advancedModal.payload.retailPositioning.comps.map((comp, index) => (
                          <a
                            key={`retail-comp-${index}-${comp.brand}`}
                            href={comp.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-start justify-between gap-4 rounded-[16px] border border-black/8 px-4 py-3 transition hover:bg-black/[0.02]"
                          >
                            <div>
                              <p className="text-sm font-semibold text-black">
                                {comp.brand} {comp.model}
                              </p>
                              <p className="mt-1 text-sm text-black/55">{comp.notes}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-black">{formatCurrency(comp.price)}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-black/45">
                                {comp.sourceLabel}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                </AccordionSection>

                <AccordionSection
                  index="07"
                  title="Volume Curve"
                  subtitle="Unit-cost savings by bucket, plus resulting price and profit at different order volumes."
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                    </div>
                    <p className="text-xs uppercase tracking-[0.12em] text-black/45">
                      Savings bars show reduction vs. optimized landed cost
                    </p>
                  </div>

                  <div className="mt-5 space-y-4">
                    {advancedModal.payload.volumeScenarios.map((scenario, index) => {
                      const totalSavings =
                        scenario.materialSavings +
                        scenario.labourSavings +
                        scenario.freightSavings +
                        scenario.vendorSavings +
                        scenario.overheadSavings;
                      const denominator = totalSavings || 1;

                      return (
                        <div key={`volume-scenario-${index}-${scenario.volume}`} className="rounded-[18px] border border-black/8 bg-black/[0.02] p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-black">{formatCompactNumber(scenario.volume)} pairs</p>
                              <p className="mt-1 text-sm text-black/55">
                                Unit cost {formatCurrency(scenario.unitCost)} · Wholesale {formatCurrency(scenario.wholesalePrice)} · MSRP {formatCurrency(scenario.targetRetailPrice)}
                              </p>
                            </div>
                            <div className="text-left lg:text-right">
                              <p className="text-sm font-semibold text-black">
                                {scenario.grossMarginPct.toFixed(1)}% gross margin
                              </p>
                              <p className="mt-1 text-sm text-black/55">
                                Profit {formatCurrency(scenario.grossProfit)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 overflow-hidden rounded-full bg-white">
                            <div className="flex h-4 w-full">
                              <div
                                className="bg-[#1f7a8c]"
                                style={{ width: `${(scenario.materialSavings / denominator) * 100}%` }}
                              />
                              <div
                                className="bg-[#bfdbf7]"
                                style={{ width: `${(scenario.labourSavings / denominator) * 100}%` }}
                              />
                              <div
                                className="bg-[#f4d35e]"
                                style={{ width: `${(scenario.vendorSavings / denominator) * 100}%` }}
                              />
                              <div
                                className="bg-[#ee964b]"
                                style={{ width: `${(scenario.freightSavings / denominator) * 100}%` }}
                              />
                              <div
                                className="bg-[#f95738]"
                                style={{ width: `${(scenario.overheadSavings / denominator) * 100}%` }}
                              />
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-5">
                            <div className="rounded-[14px] bg-white p-3">
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Material</p>
                              <p className="mt-2 font-semibold text-black">{formatCurrency(scenario.materialSavings)}</p>
                            </div>
                            <div className="rounded-[14px] bg-white p-3">
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Labour</p>
                              <p className="mt-2 font-semibold text-black">{formatCurrency(scenario.labourSavings)}</p>
                            </div>
                            <div className="rounded-[14px] bg-white p-3">
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Vendor</p>
                              <p className="mt-2 font-semibold text-black">{formatCurrency(scenario.vendorSavings)}</p>
                            </div>
                            <div className="rounded-[14px] bg-white p-3">
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Freight</p>
                              <p className="mt-2 font-semibold text-black">{formatCurrency(scenario.freightSavings)}</p>
                            </div>
                            <div className="rounded-[14px] bg-white p-3">
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Overhead</p>
                              <p className="mt-2 font-semibold text-black">{formatCurrency(scenario.overheadSavings)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionSection>

                <AccordionSection
                  index="08"
                  title="Model Assumptions"
                  subtitle="Directional assumptions used to generate pricing, sourcing, and volume outputs."
                >
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {advancedModal.payload.assumptions.map((assumption, index) => (
                      <div key={`assumption-${index}`} className="rounded-[16px] border border-black/8 bg-white px-4 py-3 text-sm text-black/65">
                        {assumption}
                      </div>
                    ))}
                  </div>
                </AccordionSection>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
