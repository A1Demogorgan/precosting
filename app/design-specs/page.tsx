import { SpecBrowser } from "@/components/spec-browser";

export default async function DesignSpecsPage({
  searchParams,
}: {
  searchParams: Promise<{ design?: string }>;
}) {
  const params = await searchParams;
  const designId = params.design ?? "MSK069";

  return <SpecBrowser designId={designId} />;
}
