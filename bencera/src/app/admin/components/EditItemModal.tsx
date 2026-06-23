import type { ChangeEvent, FormEvent } from "react";
import type { ImagePreview, ItemFormValues } from "@/lib/admin-item-form";
import type { Item } from "@/types/item";
import ExistingImageList from "./ExistingImageList";
import ImagePreviewList from "./ImagePreviewList";
import ImageUploadSection from "./ImageUploadSection";
import ItemFields from "./ItemFields";
import { adminStyles as styles } from "./admin-styles";

type EditableImageKey = "above" | "detailed";

type EditItemModalProps = {
  editAboveImagePreviews: ImagePreview[];
  editDetailedImagePreviews: ImagePreview[];
  editExistingAboveImages: string[];
  editExistingDetailedImages: string[];
  editFormError: string | null;
  editFormValues: ItemFormValues;
  isUpdatingItem: boolean;
  onClose: () => void;
  onFieldChange: (fieldName: keyof ItemFormValues, value: string | boolean) => void;
  onImageChange: (event: ChangeEvent<HTMLInputElement>, imageKey: EditableImageKey) => void;
  onRemoveExistingImage: (imageKey: EditableImageKey, index: number) => void;
  onRemovePreview: (imageKey: EditableImageKey, index: number) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  selectedEditItem: Item | null;
};

export default function EditItemModal({
  editAboveImagePreviews,
  editDetailedImagePreviews,
  editExistingAboveImages,
  editExistingDetailedImages,
  editFormError,
  editFormValues,
  isUpdatingItem,
  onClose,
  onFieldChange,
  onImageChange,
  onRemoveExistingImage,
  onRemovePreview,
  onSubmit,
  selectedEditItem,
}: EditItemModalProps) {
  if (!selectedEditItem) return null;

  const imageSections = [
    {
      key: "above" as const,
      label: "Above",
      existing: editExistingAboveImages,
      previews: editAboveImagePreviews,
    },
    {
      key: "detailed" as const,
      label: "Detailed",
      existing: editExistingDetailedImages,
      previews: editDetailedImagePreviews,
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9500,
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      />

      <form
        onSubmit={onSubmit}
        style={{
          ...styles.card,
          position: "relative",
          width: "min(760px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 850 }}>Update Item</div>
            <div style={{ fontSize: 12, opacity: 0.65 }}>
              Edit item information for {selectedEditItem.name}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ ...styles.softButton, minWidth: 44, padding: 0 }}
            aria-label="Close edit modal"
          >
            x
          </button>
        </div>

        <ItemFields keyPrefix="edit" onFieldChange={onFieldChange} values={editFormValues} />

        <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.8, marginTop: 4 }}>
          Required Images
        </div>
        <div style={{ fontSize: 12, opacity: 0.65 }}>
          Above and Detailed images are required. You can delete existing images as long as at
          least one image remains or a replacement is added.
        </div>

        {imageSections.map((section) => (
          <ImageUploadSection
            key={section.key}
            beforeInput={
              <ExistingImageList
                onRemove={(index) => onRemoveExistingImage(section.key, index)}
                urls={section.existing}
              />
            }
            count={section.existing.length + section.previews.length}
            label={section.label}
            onChange={(event) => onImageChange(event, section.key)}
            required
          >
            <ImagePreviewList
              images={section.previews}
              onRemove={(index) => onRemovePreview(section.key, index)}
            />
          </ImageUploadSection>
        ))}

        <div
          style={{
            position: "sticky",
            bottom: -18,
            background: "rgba(255,255,255,0.97)",
            paddingTop: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            borderTop: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={isUpdatingItem}
              style={{
                ...styles.button,
                opacity: isUpdatingItem ? 0.75 : 1,
                flex: 1,
                minWidth: 180,
              }}
            >
              {isUpdatingItem ? "Updating..." : "Confirm Update"}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isUpdatingItem}
              style={{ ...styles.softButton, minWidth: 130 }}
            >
              Cancel
            </button>
          </div>

          {editFormError ? (
            <div style={{ color: "#b00020", fontSize: 13 }}>{editFormError}</div>
          ) : null}
        </div>
      </form>
    </div>
  );
}
