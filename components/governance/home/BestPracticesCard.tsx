import { ListCard } from "./ListCard";

type BestPracticesCardProps = {
  items: readonly string[];
};

export function BestPracticesCard({ items }: BestPracticesCardProps) {
  return <ListCard title="Bonnes pratiques" items={items} />;
}
