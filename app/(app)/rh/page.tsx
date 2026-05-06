import { redirect } from "next/navigation";

/**
 * Module RH — en cours de développement.
 * Redirige vers la page "En construction" dédiée.
 */
export default function RHPage() {
  redirect("/coming-soon?module=rh");
}
