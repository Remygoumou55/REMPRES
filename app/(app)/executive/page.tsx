import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";

/** Hub exécutif — redirige vers le centre de commandement. */
export default function ExecutiveHubPage() {
  redirect(ROUTES.executive);
}
