import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-graylight px-4">
      <LoginForm />
    </main>
  );
}
