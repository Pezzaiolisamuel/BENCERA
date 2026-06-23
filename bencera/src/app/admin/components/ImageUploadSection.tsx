import type { ChangeEvent, ReactNode } from "react";

type ImageUploadSectionProps = {
  beforeInput?: ReactNode;
  children: ReactNode;
  count: number;
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  required: boolean;
};

export default function ImageUploadSection({
  beforeInput,
  children,
  count,
  label,
  onChange,
  required,
}: ImageUploadSectionProps) {
  return (
    <div
      style={{
        border: "1px dashed rgba(0,0,0,0.18)",
        borderRadius: 16,
        padding: 12,
        background: "rgba(255,255,255,0.7)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontWeight: 850, fontSize: 13 }}>{label} Images</div>
          <span style={{ fontSize: 11, opacity: 0.62 }}>{required ? "Required" : "Optional"}</span>
        </div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>{count} selected</div>
      </div>

      {beforeInput}
      <div style={{ height: 10 }} />

      <input type="file" multiple accept="image/*" onChange={onChange} style={{ width: "100%" }} />
      {children}
    </div>
  );
}
