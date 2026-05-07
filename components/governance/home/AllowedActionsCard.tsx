import { ListCard } from "./ListCard";

type AllowedActionsCardProps = {
  items: readonly string[];
};

export function AllowedActionsCard({ items }: AllowedActionsCardProps) {
  return <ListCard title="Actions autorisees" items={items} />;
}
