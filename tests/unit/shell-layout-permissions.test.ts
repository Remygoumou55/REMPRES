import { describe, expect, it } from "vitest";
import {
  SHELL_LAYOUT_MODULE_KEYS,
  aggregatePermissionsForModuleKeys,
} from "@/lib/server/shell-permission-helpers";

describe("shell layout permissions", () => {
  it("SHELL_LAYOUT_MODULE_KEYS — 10 modules uniques", () => {
    expect(SHELL_LAYOUT_MODULE_KEYS).toHaveLength(10);
    expect(new Set(SHELL_LAYOUT_MODULE_KEYS).size).toBe(10);
  });

  it("aggregatePermissionsForModuleKeys — agrège par module", () => {
    const rows = [
      {
        module_key: "clients",
        can_read: true,
        can_create: false,
        can_update: false,
        can_delete: false,
      },
      {
        module_key: "vente",
        can_read: false,
        can_create: true,
        can_update: false,
        can_delete: false,
      },
      {
        module_key: "finance",
        can_read: true,
        can_create: true,
        can_update: true,
        can_delete: true,
      },
    ];
    const clients = aggregatePermissionsForModuleKeys(rows, ["clients", "vente"]);
    expect(clients.canRead).toBe(true);
    expect(clients.canCreate).toBe(true);
    const finance = aggregatePermissionsForModuleKeys(rows, ["finance"]);
    expect(finance.canDelete).toBe(true);
  });
});
