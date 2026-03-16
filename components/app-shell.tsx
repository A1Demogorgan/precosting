"use client";

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
        <header className="relative z-10 border-b border-black/10 px-5 py-4 sm:px-8 sm:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="eyebrow">TF Corp</p>
              <div>
                <h1 className="editorial-title text-3xl font-semibold sm:text-5xl">
                  Pre-Costing Assistant
                </h1>
                {sectionTitle ? (
                  <p className="mt-1 text-sm text-black/55 sm:text-base">
                    {sectionTitle}
                  </p>
                ) : null}
              </div>
            </div>
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-[var(--accent-strong)] !text-[#fff9f1]"
                        : "bg-black/4 text-black/72 hover:bg-black/8"
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
