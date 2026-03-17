"use client";

import dynamic from "next/dynamic";

const CostReport = dynamic(
  () => import("@/components/cost-report").then((module) => module.CostReport),
  { ssr: false },
);

export function CostReportClient() {
  return <CostReport />;
}
