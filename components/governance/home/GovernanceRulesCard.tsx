import { ListCard } from "./ListCard";

type GovernanceRulesCardProps = {
  items: readonly string[];
};

export function GovernanceRulesCard({ items }: GovernanceRulesCardProps) {
  return <ListCard title="Regles de gouvernance" items={items} />;
}
