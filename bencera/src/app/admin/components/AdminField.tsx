import type { ReactNode } from "react";
import { adminStyles } from "./admin-styles";

type AdminFieldProps = {
  children: ReactNode;
  hint?: string;
  label: string;
};

export default function AdminField({ children, hint, label }: AdminFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={adminStyles.label}>{label}</span>
        {hint ? <span style={{ fontSize: 12, opacity: 0.65 }}>{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
