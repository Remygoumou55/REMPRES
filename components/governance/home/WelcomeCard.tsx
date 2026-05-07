type WelcomeCardProps = {
  title: string;
  subtitle: string;
  userDisplayName: string;
};

export function WelcomeCard({ title, subtitle, userDisplayName }: WelcomeCardProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">Bienvenue, {userDisplayName}</p>
      <h1 className="mt-1 text-2xl font-semibold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
    </section>
  );
}
