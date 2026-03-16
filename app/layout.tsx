import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "TF Corp Pre-Costing Assistant",
  description: "Design selector, spec browser, and pre-cost estimator for footwear concepts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#FFFFFF] text-[#171717]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
