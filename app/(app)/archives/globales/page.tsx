import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Legacy — Globales retiré ; redirection vers Archives Vente. */
export default function ArchivesGlobalesLegacyPage() {
  redirect("/archives/vente");
}
