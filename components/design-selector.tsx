"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { designOptions } from "@/lib/design-data";
import { DEFAULT_DESIGN_ID } from "@/lib/design-catalog";

export function DesignSelector() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fallbackDesignId = DEFAULT_DESIGN_ID;

  return (
    <div className="w-full">
      <label
        htmlFor="design-select"
        className="mb-3 block text-sm font-medium uppercase tracking-[0.12em] text-white/78"
      >
        Choose a Design
      </label>
      <select
        id="design-select"
        defaultValue=""
        required
        className="w-full appearance-none rounded-[22px] border border-white/70 bg-white px-5 py-4 pr-14 text-lg font-semibold text-black outline-none transition focus:border-white"
        onChange={(event) => {
          const value = event.target.value;

          if (!value) {
            return;
          }

          startTransition(() => {
            router.push(`/design-specs?design=${fallbackDesignId}`);
          });
        }}
      >
        <option value="" disabled>
          Pick a design spec
        </option>
        {designOptions.map((design) => (
          <option key={design.id} value={design.id}>
            {design.label} · {design.season}
          </option>
        ))}
      </select>
      <p className="mt-3 text-xs text-white/74">
        {isPending ? "Opening design specs..." : "5 sample designs available"}
      </p>
    </div>
  );
}
