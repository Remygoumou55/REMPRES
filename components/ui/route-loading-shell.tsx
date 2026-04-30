/**
 * Chargement de route léger : peu de DOM, animations CSS natives.
 * Remplace les grilles de squelettes lourdes pour des navigations plus fluides.
 */
export function RouteLoadingShell({ label = "Chargement…" }: { label?: string }) {
  return (
    <div
      className="flex flex-col items-center gap-4 py-8 md:py-10"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative h-1 w-full max-w-md overflow-hidden rounded-full bg-gray-100">
        <div className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-primary/70 motion-safe:animate-route-load" />
      </div>
      <div className="flex gap-1.5">
        <span className="size-1.5 rounded-full bg-primary/40 motion-safe:animate-bounce" />
        <span
          className="size-1.5 rounded-full bg-primary/40 motion-safe:animate-bounce"
          style={{ animationDelay: "120ms" }}
        />
        <span
          className="size-1.5 rounded-full bg-primary/40 motion-safe:animate-bounce"
          style={{ animationDelay: "240ms" }}
        />
      </div>
      <p className="text-xs font-medium text-gray-400">{label}</p>
    </div>
  );
}
