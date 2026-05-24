"use client";

import { memo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { resolveGovernanceChromeBand } from "@/lib/navigation/super-admin-lockdown";
import { ActionsGovernanceNav } from "@/components/actions/ActionsGovernanceNav";
import { SettingsGovernanceNav } from "@/components/settings/SettingsGovernanceNav";

type Props = {
  children: React.ReactNode;
};

/**
 * Bandeaux Actions / Archives / Paramètres mutuellement exclusifs.
 */
export const GovernanceChrome = memo(function GovernanceChrome({ children }: Props) {
  const pathname = usePathname() || "";
  const search = useSearchParams();

  if (pathname === ROUTES.home || pathname.startsWith(`${ROUTES.home}/`)) {
    return <div className="space-y-6">{children}</div>;
  }

  const band = resolveGovernanceChromeBand(pathname, search);

  return (
    <>
      {band === "actions" ? <ActionsGovernanceNav /> : null}
      {band === "settings" ? <SettingsGovernanceNav /> : null}
      <div className="space-y-6">{children}</div>
    </>
  );
});
