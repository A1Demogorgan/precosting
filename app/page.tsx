import { DesignSelector } from "@/components/design-selector";

export default function HomePage() {
  return (
    <section className="flex min-h-[66vh] flex-col">
      <div className="flex flex-1 items-center justify-center">
        <DesignSelector />
      </div>
    </section>
  );
}
