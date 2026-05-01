"use client";

import { useCallback } from "react";
import { createSaleAction } from "@/app/(app)/vente/nouvelle-vente/actions";
import type { CreateSaleInput } from "@/lib/validations/sale";

type CreateSalePayload = Omit<CreateSaleInput, "sellerId">;

export function useSales() {
  const submitSale = useCallback(async (payload: CreateSalePayload) => {
    try {
      return await createSaleAction(payload);
    } catch {
      return {
        success: false as const,
        error: "Une erreur inattendue est survenue pendant l'enregistrement de la vente.",
      };
    }
  }, []);

  return { submitSale };
}
