"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type ReportRecommendationRow = {
  recommendation: string;
  oldValue: string;
  newValue: string;
  change: string;
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

type TabId = "current" | "new" | "recommendations";

const tabs: { id: TabId; label: string }[] = [
  { id: "current", label: "Current Cost" },
  { id: "new", label: "New Cost" },
  { id: "recommendations", label: "Recommendations" },
];

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
                activeTab === tab.id ? "bg-black text-white" : "bg-black/4 text-black/72 hover:bg-black/8"
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
            <div className="overflow-hidden rounded-[18px] border border-black/8">
              <table className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Recommendation</th>
                    <th>Old Value</th>
                    <th>New Value</th>
                    <th>Change</th>
                    <th>Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {report.recommendations.map((row) => (
                    <tr key={`${row.recommendation}-${row.oldValue}-${row.newValue}`}>
                      <td className="font-semibold">{row.recommendation}</td>
                      <td>{row.oldValue}</td>
                      <td>{row.newValue}</td>
                      <td>{row.change}</td>
                      <td>{row.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
