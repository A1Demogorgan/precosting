"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { designOptions, resolveHotspotComponent, shoeViews } from "@/lib/design-data";

type SpecBrowserProps = {
  designId: string;
};

export function SpecBrowser({ designId }: SpecBrowserProps) {
  const [viewIndex, setViewIndex] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);

  const activeDesign =
    designOptions.find((item) => item.id === designId) ?? designOptions[0];
  const activeView = shoeViews[viewIndex];

  function stepView(direction: 1 | -1) {
    setActiveHotspot(null);
    setViewIndex((current) => (current + direction + shoeViews.length) % shoeViews.length);
  }

  return (
    <section className="flex min-h-[68vh] flex-col">
      <div className="px-1 py-1">
        <p className="text-sm text-black/55">
          {activeDesign.label} · {activeDesign.id} · {activeView.label}
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="grid w-full max-w-6xl grid-cols-[72px_minmax(0,1fr)_72px] items-center gap-3 sm:gap-8">
          <button
            type="button"
            aria-label="Previous image"
            className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-black bg-white text-black shadow-sm transition hover:bg-black hover:text-white"
            onClick={() => stepView(-1)}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-9 w-9"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>

          <div
            className="relative aspect-[16/9] w-full overflow-hidden bg-transparent"
            onClick={() => setActiveHotspot(null)}
          >
            <div className="absolute right-3 top-3 z-30 sm:right-5 sm:top-5">
              <Link
                href={`/cost?design=${activeDesign.id}`}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-black hover:text-white"
              >
                Pre-Costing Estimator
              </Link>
            </div>
            <Image
              src={activeView.src}
              alt={activeView.alt}
              fill
              className="object-contain"
              priority
            />
            {activeView.hotspots.map((hotspot) => {
              const component = resolveHotspotComponent(hotspot);
              const isActive = hotspot.number === activeHotspot;
              const alignRight = Number.parseFloat(hotspot.left) > 68;
              const alignBottom = Number.parseFloat(hotspot.top) > 68;

              return (
                <div
                  key={`${activeView.src}-${hotspot.number}`}
                  className="absolute"
                  style={{ top: hotspot.top, left: hotspot.left }}
                >
                  <button
                    type="button"
                    className={`hotspot h-6 w-6 ${
                      isActive ? "z-30" : "z-20"
                    }`}
                    data-active={isActive}
                    aria-label={`Open component ${hotspot.number}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveHotspot((current) =>
                        current === hotspot.number ? null : hotspot.number,
                      );
                    }}
                  >
                    <span className="hotspot-mark" aria-hidden="true" />
                  </button>

                  {isActive && component ? (
                    <div
                      className={`spec-card absolute z-40 w-64 rounded-2xl border border-black/12 bg-white p-4 shadow-lg ${
                        alignRight ? "right-12" : "left-12"
                      } ${alignBottom ? "bottom-0 translate-y-[12%]" : "top-0 -translate-y-[12%]"}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-black/45">
                            {component.group} · {component.number}
                          </p>
                          <h3 className="mt-1 text-base font-semibold text-black">
                            {component.componentType}
                          </h3>
                        </div>
                        <button
                          type="button"
                          className="text-sm text-black/45"
                          aria-label="Close hotspot details"
                          onClick={() => setActiveHotspot(null)}
                        >
                          x
                        </button>
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-black/70">
                        <p>{component.componentSpecification}</p>
                        <div className="grid grid-cols-1 gap-2 text-[13px]">
                          <div>
                            <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-black/40">
                              Color
                            </span>
                            <span>{component.color}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            aria-label="Next image"
            className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-black bg-white text-black shadow-sm transition hover:bg-black hover:text-white"
            onClick={() => stepView(1)}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-9 w-9"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
