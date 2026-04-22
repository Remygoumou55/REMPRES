import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions } from "@/lib/server/permissions";
import type { Product } from "@/types/product";
import type { Client } from "@/types/client";
import { NouvelleVenteClient } from "./NouvelleVenteClient";

export const metadata = { title: "Nouvelle vente" };

export default async function NouvelleVentePage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const permissions = await getModulePermissions(data.user.id, ["produits", "vente"]);
  if (!permissions.canCreate) redirect("/access-denied");

  // Charger tous les produits actifs pour le catalogue (max 500)
  const { data: rawProducts } = await supabase
    .from("products")
    .select(
      "id,sku,name,description,image_url,unit,price_gnf,stock_quantity,stock_threshold,created_by,created_at,updated_at,deleted_at",
    )
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .limit(500);

  // Charger les 150 derniers clients pour le sélecteur
  const { data: rawClients } = await supabase
    .from("clients")
    .select(
      "id,client_type,first_name,last_name,company_name,email,phone,address,city,country,notes,created_by,created_at,updated_at,deleted_at",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(150);

  const products = (rawProducts ?? []) as Product[];
  const clients = (rawClients ?? []) as Client[];

  return (
    <NouvelleVenteClient
      products={products}
      clients={clients}
    />
  );
}
