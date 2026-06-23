import { adminStyles as styles } from "./admin-styles";

type AdminHeaderProps = {
  isSubmitting: boolean;
  onRefresh: () => Promise<void>;
};

export default function AdminHeader({ isSubmitting, onRefresh }: AdminHeaderProps) {
  return (
    <header
      style={{
        maxWidth: 1400,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 8px 18px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.3 }}>Admin</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Create items, upload images, manage the catalog
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          type="button"
          onClick={onRefresh}
          style={styles.softButton}
          disabled={isSubmitting}
          title="Refresh items"
        >
          Refresh
        </button>

        <div
          style={{
            fontSize: 12,
            padding: "10px 12px",
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,0.10)",
            background: "rgba(255,255,255,0.75)",
          }}
        >
          {isSubmitting ? "Saving..." : "Ready"}
        </div>
      </div>
    </header>
  );
}
