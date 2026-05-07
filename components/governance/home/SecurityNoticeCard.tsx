import { ListCard } from "./ListCard";

type SecurityNoticeCardProps = {
  items: readonly string[];
};

export function SecurityNoticeCard({ items }: SecurityNoticeCardProps) {
  return <ListCard title="Rappels de securite" items={items} />;
}
