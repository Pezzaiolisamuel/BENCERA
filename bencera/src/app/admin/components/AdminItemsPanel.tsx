import type { Item } from "@/types/item";
import ItemsTable from "./ItemsTable";
import { adminStyles as styles } from "./admin-styles";

type AdminItemsPanelProps = {
  items: Item[];
  onDeleteClick: (id: string) => void;
  onEditClick: (item: Item) => void;
};

export default function AdminItemsPanel({
  items,
  onDeleteClick,
  onEditClick,
}: AdminItemsPanelProps) {
  return (
    <section
      style={{
        ...styles.card,
        padding: 16,
        minHeight: 500,
        overflow: "scroll",
        height: "85vh",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 16 }}>Items</div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>Latest first</div>
      </div>

      <div style={{ height: 12 }} />

      <ItemsTable items={items} onDeleteClick={onDeleteClick} onEditClick={onEditClick} />
    </section>
  );
}
