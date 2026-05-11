export type HrVisualTelemetryEvent = {
  kind: "hr_visual_snapshot_loaded" | "hr_visual_snapshot_missing";
  correlationId?: string;
};

export function emitHrVisualTelemetry(event: HrVisualTelemetryEvent): void {
  void event;
}
