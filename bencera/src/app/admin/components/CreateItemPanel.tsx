import type { ChangeEvent, FormEvent } from "react";
import type { ItemImageKey } from "@/types/item";
import {
  formatFileSize,
  imageUploadSections,
  maxImageFileSizeBytes,
  maxImagesPerItem,
  maxTotalImageUploadBytes,
  type ImagePreviewGroups,
  type ItemFormValues,
} from "@/lib/admin-item-form";
import ImagePreviewList from "./ImagePreviewList";
import ImageUploadSection from "./ImageUploadSection";
import ItemFields from "./ItemFields";
import { adminStyles as styles } from "./admin-styles";

type CreateItemPanelProps = {
  catalogItemCount: number;
  formError: string | null;
  imagePreviewGroups: ImagePreviewGroups;
  isSubmitting: boolean;
  itemFormValues: ItemFormValues;
  onClear: () => void;
  onFieldChange: (fieldName: keyof ItemFormValues, value: string | boolean) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>, imageKey: ItemImageKey) => void;
  onRemovePreview: (imageKey: ItemImageKey, index: number) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  showSuccess: boolean;
};

export default function CreateItemPanel({
  catalogItemCount,
  formError,
  imagePreviewGroups,
  isSubmitting,
  itemFormValues,
  onClear,
  onFieldChange,
  onFileChange,
  onRemovePreview,
  onSubmit,
  showSuccess,
}: CreateItemPanelProps) {
  return (
    <section
      style={{
        ...styles.card,
        padding: 16,
        position: "sticky",
        top: 18,
        height: "calc(100vh - 120px)",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 16 }}>Create Item</div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>{catalogItemCount} items</div>
      </div>

      <div style={{ height: 6 }} />
      <div style={{ fontSize: 12, opacity: 0.65 }}>
        Fields marked as required should be filled before saving.
      </div>

      <div style={{ height: 14 }} />

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <ItemFields keyPrefix="create" onFieldChange={onFieldChange} values={itemFormValues} />

        <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.8, marginTop: 4 }}>Images</div>
        <div style={{ fontSize: 12, opacity: 0.65 }}>
          Maximum {maxImagesPerItem} uploaded images total per item. Each image must be{" "}
          {formatFileSize(maxImageFileSizeBytes)} or smaller. One upload request can be at most{" "}
          {formatFileSize(maxTotalImageUploadBytes)}.
        </div>

        {imageUploadSections.map((section) => (
          <ImageUploadSection
            key={section.key}
            count={imagePreviewGroups[section.key].length}
            label={section.label}
            onChange={(event) => onFileChange(event, section.key)}
            required={section.key === "above" || section.key === "detailed"}
          >
            <ImagePreviewList
              images={imagePreviewGroups[section.key]}
              onRemove={(index) => onRemovePreview(section.key, index)}
            />
          </ImageUploadSection>
        ))}

        <div
          style={{
            position: "sticky",
            bottom: -16,
            background: "rgba(255,255,255,0.97)",
            paddingTop: 12,
            paddingBottom: 6,
            marginTop: 4,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            borderTop: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ ...styles.button, opacity: isSubmitting ? 0.75 : 1, flex: 1 }}
            >
              {isSubmitting ? "Saving..." : "Create Item"}
            </button>

            <button
              type="button"
              onClick={onClear}
              disabled={isSubmitting}
              style={{ ...styles.softButton, minWidth: 110 }}
            >
              Clear
            </button>
          </div>

          {showSuccess ? (
            <div style={{ color: "green", fontSize: 13, fontWeight: 650 }}>
              {"Item created \u2714"}
            </div>
          ) : null}

          {formError ? <div style={{ color: "#b00020", fontSize: 13 }}>{formError}</div> : null}
        </div>
      </form>
    </section>
  );
}
