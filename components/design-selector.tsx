"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { designOptions } from "@/lib/design-data";

export function DesignSelector() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="w-full max-w-xl">
      <label
        htmlFor="design-select"
        className="mb-3 block text-sm font-medium text-black/80"
      >
        Choose a Design
      </label>
      <select
        id="design-select"
        defaultValue=""
        className="w-full appearance-none rounded-[18px] border border-black/14 bg-white bg-[position:right_1.25rem_center] bg-no-repeat px-5 py-4 pr-14 text-lg text-black/78 outline-none transition focus:border-black/28"
        onChange={(event) => {
          const value = event.target.value;

          if (!value) {
            return;
          }

          startTransition(() => {
            router.push(`/design-specs?design=${value}`);
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
      <p className="mt-3 text-xs text-black/45">
        {isPending ? "Opening design specs..." : "5 sample designs available"}
      </p>
    </div>
  );
}
