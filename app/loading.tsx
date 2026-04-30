import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-graylight p-4 md:p-8">
      <RouteLoadingShell />
    </div>
  );
}
