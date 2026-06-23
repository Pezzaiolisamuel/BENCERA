"use client";

import ItemsTable from "./components/ItemsTable";
import ExistingImageList from "./components/ExistingImageList";
import ImagePreviewList from "./components/ImagePreviewList";
import ImageUploadSection from "./components/ImageUploadSection";
import ItemFields from "./components/ItemFields";
import LoginModal from "./components/LoginModal";
import { adminStyles as styles } from "./components/admin-styles";
import { useAdminAuth } from "./hooks/useAdminAuth";
import { useAdminCatalog } from "./hooks/useAdminCatalog";
import { useCreateItemForm } from "./hooks/useCreateItemForm";
import { useEditItemForm } from "./hooks/useEditItemForm";
import {
  formatFileSize,
  imageUploadSections,
  maxImageFileSizeBytes,
  maxImagesPerItem,
  maxTotalImageUploadBytes,
} from "@/lib/admin-item-form";

export default function AdminPage() {
  const { catalogItems, fetchItems, handleDeleteItem } = useAdminCatalog();
  const {
    clearForm,
    formError,
    handleFileChange,
    handleSubmit,
    hideSuccess,
    imagePreviewGroups,
    isSubmitting,
    itemFormValues,
    removePreview,
    showSuccess,
    updateField,
  } = useCreateItemForm({ refreshItems: fetchItems });
  const {
    handleLoginSubmit,
    isCheckingAuth,
    isLoginVisible,
    loginError,
    password,
    setPassword,
    setUsername,
    username,
  } = useAdminAuth({ onAuthenticated: fetchItems, onLoginAttempt: hideSuccess });
  const {
    closeEditModal,
    editAboveImagePreviews,
    editDetailedImagePreviews,
    editExistingAboveImages,
    editExistingDetailedImages,
    editFormError,
    editFormValues,
    handleEditImagesChange,
    handleUpdateItem,
    isUpdatingItem,
    openEditModal,
    removeEditExistingImage,
    removeEditPreview,
    selectedEditItem,
    updateEditField,
  } = useEditItemForm({ refreshItems: fetchItems });

  return (
    <>
      {isLoginVisible ? (
        <LoginModal
          isCheckingAuth={isCheckingAuth}
          loginError={loginError}
          onPasswordChange={setPassword}
          onSubmit={handleLoginSubmit}
          onUsernameChange={setUsername}
          password={password}
          username={username}
        />
      ) : null}

      <div
        style={{
          minHeight: "100vh",
          padding: 18,
          background:
            "radial-gradient(1200px 600px at 20% 0%, rgba(0,0,0,0.06), transparent 60%), radial-gradient(1200px 600px at 80% 40%, rgba(0,0,0,0.05), transparent 60%), #f7f7f7",
          pointerEvents: isLoginVisible ? "none" : "auto",
          userSelect: isLoginVisible ? "none" : "auto",
        }}
      >
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
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.3 }}>
              Admin
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Create items, upload images, manage the catalog
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              onClick={fetchItems}
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

        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "minmax(420px, 520px) 1fr",
            gap: 18,
            alignItems: "start",
          }}
        >
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
              <div style={{ fontSize: 12, opacity: 0.6 }}>{catalogItems.length} items</div>
            </div>

            <div style={{ height: 6 }} />
            <div style={{ fontSize: 12, opacity: 0.65 }}>
              Fields marked as required should be filled before saving.
            </div>

            <div style={{ height: 14 }} />

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <ItemFields
                keyPrefix="create"
                onFieldChange={updateField}
                values={itemFormValues}
              />

              <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                Images
              </div>
              <div style={{ fontSize: 12, opacity: 0.65 }}>
                Maximum {maxImagesPerItem} uploaded images total per item. Each image must be{" "}
                {formatFileSize(maxImageFileSizeBytes)} or smaller. One upload request can be at
                most {formatFileSize(maxTotalImageUploadBytes)}.
              </div>

              {imageUploadSections.map((section) => (
                <ImageUploadSection
                  key={section.key}
                  count={imagePreviewGroups[section.key].length}
                  label={section.label}
                  onChange={(event) => handleFileChange(event, section.key)}
                  required={section.key === "above" || section.key === "detailed"}
                >
                  <ImagePreviewList
                    images={imagePreviewGroups[section.key]}
                    onRemove={(index) => removePreview(section.key, index)}
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
                    onClick={clearForm}
                    disabled={isSubmitting}
                    style={{ ...styles.softButton, minWidth: 110 }}
                  >
                    Clear
                  </button>
                </div>

                {showSuccess && (
                  <div style={{ color: "green", fontSize: 13, fontWeight: 650 }}>
                    Item created ✔
                  </div>
                )}

                {formError && <div style={{ color: "#b00020", fontSize: 13 }}>{formError}</div>}
              </div>
            </form>
          </section>

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

            <ItemsTable
              items={catalogItems}
              onDeleteClick={handleDeleteItem}
              onEditClick={openEditModal}
            />
          </section>
        </div>

        <div style={{ height: 28 }} />
      </div>

      {selectedEditItem ? (
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
            onClick={closeEditModal}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          />

          <form
            onSubmit={handleUpdateItem}
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
                onClick={closeEditModal}
                style={{ ...styles.softButton, minWidth: 44, padding: 0 }}
                aria-label="Close edit modal"
              >
                x
              </button>
            </div>

            <ItemFields
              keyPrefix="edit"
              onFieldChange={updateEditField}
              values={editFormValues}
            />

            <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.8, marginTop: 4 }}>
              Required Images
            </div>
            <div style={{ fontSize: 12, opacity: 0.65 }}>
              Above and Detailed images are required. You can delete existing images as long as at
              least one image remains or a replacement is added.
            </div>

            {[
              {
                key: "above" as const,
                label: "Above",
                existing: editExistingAboveImages,
                previews: editAboveImagePreviews,
                onRemoveExisting: (index: number) => removeEditExistingImage("above", index),
                onRemovePreview: (index: number) => removeEditPreview("above", index),
              },
              {
                key: "detailed" as const,
                label: "Detailed",
                existing: editExistingDetailedImages,
                previews: editDetailedImagePreviews,
                onRemoveExisting: (index: number) => removeEditExistingImage("detailed", index),
                onRemovePreview: (index: number) => removeEditPreview("detailed", index),
              },
            ].map((section) => (
              <ImageUploadSection
                key={section.key}
                beforeInput={
                  <ExistingImageList
                    onRemove={section.onRemoveExisting}
                    urls={section.existing}
                  />
                }
                count={section.existing.length + section.previews.length}
                label={section.label}
                onChange={(event) => handleEditImagesChange(event, section.key)}
                required
              >
                <ImagePreviewList
                  images={section.previews}
                  onRemove={section.onRemovePreview}
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
                  onClick={closeEditModal}
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
      ) : null}
    </>
  );
}
