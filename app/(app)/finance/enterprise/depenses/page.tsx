import { redirect } from "next/navigation";

/** Garde-fou UX : dépenses historiques sur le module existant `/finance/depenses`. */
export default function FinanceEnterpriseDepensesRedirectPage() {
  redirect("/finance/depenses");
}
