import { ListCard } from "./ListCard";

type RestrictedActionsCardProps = {
  items: readonly string[];
};

export function RestrictedActionsCard({ items }: RestrictedActionsCardProps) {
  return <ListCard title="Actions interdites" items={items} />;
}
