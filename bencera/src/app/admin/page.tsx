"use client";

import AdminHeader from "./components/AdminHeader";
import AdminItemsPanel from "./components/AdminItemsPanel";
import CreateItemPanel from "./components/CreateItemPanel";
import EditItemModal from "./components/EditItemModal";
import LoginModal from "./components/LoginModal";
import { useAdminPageCoordinator } from "./hooks/useAdminPageCoordinator";

export default function AdminPage() {
  const { auth, catalogItems, createForm, editForm, fetchItems, handleDeleteItem } =
    useAdminPageCoordinator();
  const {
    handleLoginSubmit,
    isCheckingAuth,
    isLoginVisible,
    loginError,
    password,
    setPassword,
    setUsername,
    username,
  } = auth;
  const {
    clearForm,
    formError,
    handleFileChange,
    handleSubmit,
    imagePreviewGroups,
    isSubmitting,
    itemFormValues,
    removePreview,
    showSuccess,
    updateField,
  } = createForm;
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
  } = editForm;

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
        <AdminHeader isSubmitting={isSubmitting} onRefresh={fetchItems} />

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
          <CreateItemPanel
            catalogItemCount={catalogItems.length}
            formError={formError}
            imagePreviewGroups={imagePreviewGroups}
            isSubmitting={isSubmitting}
            itemFormValues={itemFormValues}
            onClear={clearForm}
            onFieldChange={updateField}
            onFileChange={handleFileChange}
            onRemovePreview={removePreview}
            onSubmit={handleSubmit}
            showSuccess={showSuccess}
          />

          <AdminItemsPanel
            items={catalogItems}
            onDeleteClick={handleDeleteItem}
            onEditClick={openEditModal}
          />
        </div>

        <div style={{ height: 28 }} />
      </div>

      {selectedEditItem ? (
        <EditItemModal
          editAboveImagePreviews={editAboveImagePreviews}
          editDetailedImagePreviews={editDetailedImagePreviews}
          editExistingAboveImages={editExistingAboveImages}
          editExistingDetailedImages={editExistingDetailedImages}
          editFormError={editFormError}
          editFormValues={editFormValues}
          isUpdatingItem={isUpdatingItem}
          onClose={closeEditModal}
          onFieldChange={updateEditField}
          onImageChange={handleEditImagesChange}
          onRemoveExistingImage={removeEditExistingImage}
          onRemovePreview={removeEditPreview}
          onSubmit={handleUpdateItem}
          selectedEditItem={selectedEditItem}
        />
      ) : null}
    </>
  );
}
