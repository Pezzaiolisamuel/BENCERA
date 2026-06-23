import type { ItemFormValues } from "@/lib/admin-item-form";
import AdminField from "./AdminField";
import { adminStyles } from "./admin-styles";

type ItemFieldsProps = {
  keyPrefix: string;
  onFieldChange: (fieldName: keyof ItemFormValues, value: string | boolean) => void;
  values: ItemFormValues;
};

export default function ItemFields({ keyPrefix, onFieldChange, values }: ItemFieldsProps) {
  return (
    <>
      <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.8 }}>Basic info</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <AdminField label="Name" hint="Optional">
          <input name={`${keyPrefix}-name`} placeholder="Item name" value={values.name} onChange={(event) => onFieldChange("name", event.target.value)} style={adminStyles.input} />
        </AdminField>
        <AdminField label="Shopify" hint="Required - full product link">
          <input name={`${keyPrefix}-shopify`} placeholder="https://bencera.myshopify.com/products/3?variant=53256942518609" required type="url" value={values.shopify} onChange={(event) => onFieldChange("shopify", event.target.value)} style={adminStyles.input} />
        </AdminField>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <AdminField label="Type" hint="Optional">
          <input name={`${keyPrefix}-type`} placeholder="Type" value={values.type} onChange={(event) => onFieldChange("type", event.target.value)} style={adminStyles.input} />
        </AdminField>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <AdminField label="Category" hint="Optional">
          <input name={`${keyPrefix}-category`} placeholder="Category" value={values.category} onChange={(event) => onFieldChange("category", event.target.value)} style={adminStyles.input} />
        </AdminField>
        <AdminField label="Season" hint="Optional">
          <input name={`${keyPrefix}-season`} placeholder="Season" value={values.season} onChange={(event) => onFieldChange("season", event.target.value)} style={adminStyles.input} />
        </AdminField>
      </div>

      <AdminField label="Collection name" hint="Optional">
        <input name={`${keyPrefix}-collectionName`} placeholder="Collection name" value={values.collectionName} onChange={(event) => onFieldChange("collectionName", event.target.value)} style={adminStyles.input} />
      </AdminField>

      <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.8, marginTop: 4 }}>Description</div>

      <AdminField label="Short description" hint="Optional">
        <input name={`${keyPrefix}-shortDescription`} placeholder="Short description" value={values.shortDescription} onChange={(event) => onFieldChange("shortDescription", event.target.value)} style={adminStyles.input} />
      </AdminField>
      <AdminField label="Long description" hint="Optional">
        <textarea name={`${keyPrefix}-longDescription`} placeholder="Long description" value={values.longDescription} onChange={(event) => onFieldChange("longDescription", event.target.value)} style={adminStyles.textarea} />
      </AdminField>

      <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.8, marginTop: 4 }}>Details</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <AdminField label="Material" hint="Optional">
          <input name={`${keyPrefix}-material`} placeholder="Material" value={values.material} onChange={(event) => onFieldChange("material", event.target.value)} style={adminStyles.input} />
        </AdminField>
        <AdminField label="Products in collection" hint="Optional">
          <input name={`${keyPrefix}-productsInCollection`} type="number" placeholder="Products in collection" value={values.productsInCollection} onChange={(event) => onFieldChange("productsInCollection", event.target.value)} style={adminStyles.input} />
        </AdminField>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <AdminField label="Available colors" hint="Optional - comma separated">
          <input name={`${keyPrefix}-availableColors`} placeholder="e.g. white, beige, black" value={values.availableColors} onChange={(event) => onFieldChange("availableColors", event.target.value)} style={adminStyles.input} />
        </AdminField>
        <AdminField label="Matching palette" hint="Optional - comma separated">
          <input name={`${keyPrefix}-matchingPalette`} placeholder="e.g. sand, clay, ash" value={values.matchingPalette} onChange={(event) => onFieldChange("matchingPalette", event.target.value)} style={adminStyles.input} />
        </AdminField>
      </div>

      <AdminField label="Sizes" hint="Optional - comma separated">
        <input name={`${keyPrefix}-sizes`} placeholder="e.g. 20cm, 25cm, 30cm" value={values.sizes} onChange={(event) => onFieldChange("sizes", event.target.value)} style={adminStyles.input} />
      </AdminField>

      <div style={{ display: "flex", gap: 12 }}>
        {([
          ["unique", "Unique"],
          ["handmade", "Handmade"],
        ] as const).map(([fieldName, label]) => (
          <label key={fieldName} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "12px 12px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)", background: "rgba(255,255,255,0.75)", cursor: "pointer" }}>
            <input type="checkbox" name={`${keyPrefix}-${fieldName}`} checked={values[fieldName]} onChange={(event) => onFieldChange(fieldName, event.target.checked)} />
            <span style={{ fontSize: 13, fontWeight: 650 }}>{label}</span>
          </label>
        ))}
      </div>
    </>
  );
}
