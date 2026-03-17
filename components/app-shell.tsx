"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/design-specs", label: "Design Specs" },
  { href: "/cost", label: "Cost" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const sectionTitle =
    pathname === "/design-specs"
      ? "Design Spec Browser"
      : pathname === "/cost"
        ? "Pre-Cost Estimator"
        : null;

  return (
    <div className="min-h-screen px-4 py-5 text-foreground sm:px-6 lg:px-10">
      <div className="page-shell mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-7xl flex-col rounded-[32px]">
        <div className="rounded-t-[32px] bg-black px-5 py-2 text-center text-[11px] font-semibold tracking-[0.08em] text-white sm:px-8">
          VF Footwear Concepting and Pre-Costing Workspace
        </div>
        <header className="relative z-10 border-b border-black/10 bg-white px-5 py-4 text-black sm:px-8 sm:py-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center">
                <Image
                  src="/vfcorp-logo.svg"
                  alt="VF logo"
                  width={52}
                  height={52}
                  className="h-12 w-12"
                  priority
                />
              </div>
              <div className="space-y-1">
                <h1 className="vf-display text-2xl font-semibold text-black sm:text-4xl">
                  Pre-Costing Assistant
                </h1>
                {sectionTitle ? (
                  <p className="text-sm text-black/60 sm:text-base">
                    {sectionTitle}
                  </p>
                ) : null}
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-2 border-t border-black/8 pt-4 xl:border-t-0 xl:pt-0">
              {navItems.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-[#004c97] !text-white"
                        : "bg-[#e9f1fb] text-[var(--accent-strong)] hover:bg-[#d7e7fb]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>
        <main
          className={`relative z-10 flex-1 py-6 sm:py-8 ${
            pathname === "/cost" ? "px-0 sm:px-0 lg:px-0" : "px-5 sm:px-8"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
