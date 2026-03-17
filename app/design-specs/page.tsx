import { SpecBrowser } from "@/components/spec-browser";
import { DEFAULT_DESIGN_ID } from "@/lib/design-catalog";

export default async function DesignSpecsPage({
  searchParams,
}: {
  searchParams: Promise<{ design?: string }>;
}) {
  const params = await searchParams;
  const designId = params.design ?? DEFAULT_DESIGN_ID;

  return <SpecBrowser key={designId} designId={designId} />;
}
