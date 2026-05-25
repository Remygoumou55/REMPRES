import { DEVELOPER_ECOSYSTEM_GUIDE, DEVELOPER_SANDBOX_MANIFEST } from "@/lib/platform/runtime/developer-ecosystem-registry";

export function DeveloperEcosystemGuide() {
  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 text-sm">
      <p className="font-semibold text-gray-900">Écosystème développeur — {DEVELOPER_ECOSYSTEM_GUIDE.sdkStrategy}</p>
      <ol className="list-decimal space-y-1 pl-5 text-gray-700">
        {DEVELOPER_ECOSYSTEM_GUIDE.onboardingSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-600">
        Sandbox : {DEVELOPER_SANDBOX_MANIFEST.plugin_key} — isolation {DEVELOPER_SANDBOX_MANIFEST.isolation}
      </div>
    </div>
  );
}
