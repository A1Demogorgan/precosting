import { DesignSelector } from "@/components/design-selector";

export default function HomePage() {
  return (
    <section className="vf-hero flex min-h-[72vh] flex-col rounded-[32px] px-6 py-8 sm:px-8 sm:py-10">
      <div className="relative z-10 flex flex-1 flex-col justify-between gap-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="max-w-4xl space-y-5">
            <p className="eyebrow">VF Footwear Platform</p>
            <div className="max-w-3xl space-y-4">
              <h2 className="vf-display max-w-3xl text-5xl leading-[0.92] text-black sm:text-6xl lg:text-7xl">
                Build better footwear decisions before the first sample is made.
              </h2>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#00386f] bg-[#004c97] p-6 shadow-[0_16px_40px_rgba(0,76,151,0.22)]">
            <DesignSelector />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[24px] border border-black/8 bg-white/72 p-5 backdrop-blur-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/45">Spec Review</p>
            <p className="mt-3 text-lg font-semibold text-black">Hotspot-led design inspection</p>
          </div>
          <div className="rounded-[24px] border border-black/8 bg-white/72 p-5 backdrop-blur-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/45">Cost Control</p>
            <p className="mt-3 text-lg font-semibold text-black">Component-level landed cost visibility</p>
          </div>
          <div className="rounded-[24px] border border-black/8 bg-white/72 p-5 backdrop-blur-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/45">Advanced Mode</p>
            <p className="mt-3 text-lg font-semibold text-black">Design, sourcing, and MSRP scenario planning</p>
          </div>
        </div>
      </div>
    </section>
  );
}
