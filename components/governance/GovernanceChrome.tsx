"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { resolveGovernanceChromeBand } from "@/lib/navigation/super-admin-lockdown";
import { ActionsGovernanceNav } from "@/components/actions/ActionsGovernanceNav";
import { ArchivesGovernanceNav } from "@/components/archives/ArchivesGovernanceNav";
import { SettingsGovernanceNav } from "@/components/settings/SettingsGovernanceNav";

type Props = {
  children: React.ReactNode;
};

/**
 * Bandeaux Actions / Archives / Paramètres mutuellement exclusifs.
 */
export function GovernanceChrome({ children }: Props) {
  const pathname = usePathname() || "";
  const search = useSearchParams();
  const band = resolveGovernanceChromeBand(pathname, search);

  return (
    <>
      {band === "actions" ? <ActionsGovernanceNav /> : null}
      {band === "archives" ? <ArchivesGovernanceNav /> : null}
      {band === "settings" ? <SettingsGovernanceNav /> : null}
      <div className="space-y-6">{children}</div>
    </>
  );
}
