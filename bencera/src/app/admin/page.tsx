"use client";

import type {
  ChangeEvent,
  CSSProperties,
  FormEvent,
  ReactNode,
} from "react";
import { useEffect, useMemo, useState } from "react";
import ItemsTable from "./components/ItemsTable";
import {
  buildItemFormData,
  createItemFormValuesFromItem,
  createEmptyImagePreviewGroups,
  formatFileSize,
  getImagePreviewCount,
  imageUploadSections,
  initialItemFormValues,
  maxImageFileSizeBytes,
  maxImagesPerItem,
  maxTotalImageUploadBytes,
  type ImagePreview,
  type ImagePreviewGroups,
  type ItemFormValues,
  validateItemForm,
} from "@/lib/admin-item-form";
import { parseStoredItems } from "@/lib/item-data";
import type { Item, ItemImageKey } from "@/types/item";

function Field({
  label,
  hint,
  children,
  labelStyle,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  labelStyle: CSSProperties;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={labelStyle}>{label}</span>
        {hint ? <span style={{ fontSize: 12, opacity: 0.65 }}>{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function cloneImagePreviewGroups(groups: ImagePreviewGroups) {
  return {
    above: [...groups.above],
    detailed: [...groups.detailed],
    background: [...groups.background],
    howToUse: [...groups.howToUse],
  };
}

function revokePreviewUrls(previews: ImagePreview[]) {
  previews.forEach((preview) => URL.revokeObjectURL(preview.url));
}

async function readResponsePayload(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return {
    error: text || response.statusText || "Request failed",
  };
}

function getOversizedImageError(files: File[]) {
  const oversizedFiles = files.filter((file) => file.size > maxImageFileSizeBytes);

  if (!oversizedFiles.length) return null;

  const names = oversizedFiles.map((file) => `${file.name} (${formatFileSize(file.size)})`);
  return `Image upload is too large. Each image must be ${formatFileSize(maxImageFileSizeBytes)} or smaller: ${names.join(", ")}.`;
}

function getTotalImageUploadError(files: File[]) {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  if (totalSize <= maxTotalImageUploadBytes) return null;

  return `Image upload is too large. The selected images are ${formatFileSize(totalSize)} total, but one upload request can be at most ${formatFileSize(maxTotalImageUploadBytes)}.`;
}

export default function AdminPage() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoginVisible, setIsLoginVisible] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [catalogItems, setCatalogItems] = useState<Item[]>([]);
  const [itemFormValues, setItemFormValues] = useState<ItemFormValues>(initialItemFormValues);
  const [imagePreviewGroups, setImagePreviewGroups] = useState<ImagePreviewGroups>(
    createEmptyImagePreviewGroups
  );
  const [selectedEditItem, setSelectedEditItem] = useState<Item | null>(null);
  const [editFormValues, setEditFormValues] = useState<ItemFormValues>(initialItemFormValues);
  const [editDetailedImagePreviews, setEditDetailedImagePreviews] = useState<ImagePreview[]>([]);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);

  const updateField = (fieldName: keyof ItemFormValues, value: string | boolean) => {
    setItemFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));
  };

  const updateEditField = (fieldName: keyof ItemFormValues, value: string | boolean) => {
    setEditFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));
  };

  const styles = useMemo(() => {
    const card = {
      background: "rgba(255,255,255,0.85)",
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 18,
      boxShadow: "0 18px 60px rgba(0,0,0,0.08)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
    } as const;

    const label = {
      fontSize: 12,
      fontWeight: 650,
      opacity: 0.8,
      letterSpacing: 0.2,
    } as const;

    const input = {
      height: 44,
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.12)",
      padding: "0 12px",
      outline: "none",
      background: "rgba(255,255,255,0.9)",
      width: "100%",
    } as const;

    const textarea = {
      minHeight: 110,
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.12)",
      padding: "10px 12px",
      outline: "none",
      resize: "vertical" as const,
      background: "rgba(255,255,255,0.9)",
      width: "100%",
    } as const;

    const button = {
      height: 44,
      borderRadius: 12,
      border: "none",
      cursor: "pointer",
      fontWeight: 750,
      background: "black",
      color: "white",
      padding: "0 14px",
    } as const;

    const softButton = {
      height: 44,
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.12)",
      cursor: "pointer",
      fontWeight: 650,
      background: "rgba(255,255,255,0.8)",
      padding: "0 14px",
    } as const;

    return { card, label, input, textarea, button, softButton };
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/items", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setCatalogItems(parseStoredItems(data));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      setLoginError(null);

      try {
        const response = await fetch("/api/admin/me", { cache: "no-store" });
        const data = await response.json();
        const isAuthenticated = !!data?.authenticated;

        setIsLoginVisible(!isAuthenticated);

        if (isAuthenticated) {
          await fetchItems();
        }
      } catch {
        setIsLoginVisible(true);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoginVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () =>
      window.removeEventListener("keydown", handleKeyDown, {
        capture: true,
      } as EventListenerOptions);
  }, [isLoginVisible]);

  const handleLoginSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoginError(null);
    setShowSuccess(false);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data?.error || "Login failed");
        return;
      }

      setIsLoginVisible(false);
      setPassword("");
      await fetchItems();
    } catch {
      setLoginError("Login failed");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/items?id=${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Delete failed");
      }

      setCatalogItems((currentItems) => currentItems.filter((item) => item.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed";
      console.error(error);
      alert(message);
    }
  };

  const openEditModal = (item: Item) => {
    setSelectedEditItem(item);
    setEditFormValues(createItemFormValuesFromItem(item));
    setEditDetailedImagePreviews([]);
    setEditFormError(null);
  };

  const closeEditModal = () => {
    revokePreviewUrls(editDetailedImagePreviews);
    setSelectedEditItem(null);
    setEditFormValues(initialItemFormValues);
    setEditDetailedImagePreviews([]);
    setEditFormError(null);
    setIsUpdatingItem(false);
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    imageKey: ItemImageKey
  ) => {
    const files = event.target.files;
    if (!files) return;
    const selectedFiles = Array.from(files);

    const oversizedImageError = getOversizedImageError(selectedFiles);
    if (oversizedImageError) {
      setFormError(oversizedImageError);
      event.target.value = "";
      return;
    }

    const currentImageCount = getImagePreviewCount(imagePreviewGroups);
    const remainingSlots = maxImagesPerItem - currentImageCount;
    const currentSelectedFiles = [
      ...imagePreviewGroups.above,
      ...imagePreviewGroups.detailed,
      ...imagePreviewGroups.background,
      ...imagePreviewGroups.howToUse,
    ].map((preview) => preview.file);
    const acceptedFiles = selectedFiles.slice(0, Math.max(remainingSlots, 0));
    const totalImageUploadError = getTotalImageUploadError([
      ...currentSelectedFiles,
      ...acceptedFiles,
    ]);

    if (totalImageUploadError) {
      setFormError(totalImageUploadError);
      event.target.value = "";
      return;
    }

    if (remainingSlots <= 0) {
      setFormError(`You can upload a maximum of ${maxImagesPerItem} images per item.`);
      event.target.value = "";
      return;
    }

    const nextPreviews: ImagePreview[] = acceptedFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));

    if (nextPreviews.length < files.length) {
      setFormError(`Only ${maxImagesPerItem} images total are allowed per item.`);
    } else {
      setFormError(null);
    }

    setImagePreviewGroups((currentGroups) => ({
      ...currentGroups,
      [imageKey]: [...currentGroups[imageKey], ...nextPreviews],
    }));

    event.target.value = "";
  };

  const removePreview = (imageKey: ItemImageKey, index: number) => {
    setImagePreviewGroups((currentGroups) => {
      const nextGroups = cloneImagePreviewGroups(currentGroups);
      const [removedPreview] = nextGroups[imageKey].splice(index, 1);
      if (removedPreview) {
        URL.revokeObjectURL(removedPreview.url);
      }
      return nextGroups;
    });
  };

  const clearForm = () => {
    revokePreviewUrls([
      ...imagePreviewGroups.above,
      ...imagePreviewGroups.detailed,
      ...imagePreviewGroups.background,
      ...imagePreviewGroups.howToUse,
    ]);

    setItemFormValues(initialItemFormValues);
    setImagePreviewGroups(createEmptyImagePreviewGroups());
    setFormError(null);
    setShowSuccess(false);
  };

  const handleEditDetailedImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedEditItem) return;

    const files = event.target.files;
    if (!files) return;
    const selectedFiles = Array.from(files);

    const oversizedImageError = getOversizedImageError(selectedFiles);
    if (oversizedImageError) {
      setEditFormError(oversizedImageError);
      event.target.value = "";
      return;
    }

    const remainingSlots = maxImagesPerItem - (selectedEditItem.images.detailed.length + editDetailedImagePreviews.length);
    const acceptedFiles = selectedFiles.slice(0, Math.max(remainingSlots, 0));
    const totalImageUploadError = getTotalImageUploadError([
      ...editDetailedImagePreviews.map((preview) => preview.file),
      ...acceptedFiles,
    ]);

    if (totalImageUploadError) {
      setEditFormError(totalImageUploadError);
      event.target.value = "";
      return;
    }

    if (remainingSlots <= 0) {
      setEditFormError(`A piece can have a maximum of ${maxImagesPerItem} detailed images.`);
      event.target.value = "";
      return;
    }

    const nextPreviews = acceptedFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));

    if (nextPreviews.length < files.length) {
      setEditFormError(`Only ${maxImagesPerItem} detailed images are allowed per piece.`);
    } else {
      setEditFormError(null);
    }

    setEditDetailedImagePreviews((currentPreviews) => [...currentPreviews, ...nextPreviews]);
    event.target.value = "";
  };

  const removeEditDetailedPreview = (index: number) => {
    setEditDetailedImagePreviews((currentPreviews) => {
      const nextPreviews = [...currentPreviews];
      const [removedPreview] = nextPreviews.splice(index, 1);
      if (removedPreview) {
        URL.revokeObjectURL(removedPreview.url);
      }
      return nextPreviews;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setShowSuccess(false);

    try {
      const validationError = validateItemForm(itemFormValues);
      if (validationError) {
        throw new Error(validationError);
      }

      const response = await fetch("/api/items", {
        method: "POST",
        body: buildItemFormData(itemFormValues, imagePreviewGroups),
      });
      const data = await readResponsePayload(response);

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setShowSuccess(true);
      clearForm();
      await fetchItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create item";
      console.error(error);
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedEditItem) return;

    setIsUpdatingItem(true);
    setEditFormError(null);

    try {
      const validationError = validateItemForm(editFormValues);
      if (validationError) {
        throw new Error(validationError);
      }

      const confirmed = window.confirm(
        `Are you sure you want to update "${selectedEditItem.name}" in the database?`
      );

      if (!confirmed) {
        setIsUpdatingItem(false);
        return;
      }

      const formData = new FormData();
      formData.append("id", selectedEditItem.id);
      formData.append("name", editFormValues.name);
      formData.append("type", editFormValues.type);
      formData.append("category", editFormValues.category);
      formData.append("season", editFormValues.season);
      formData.append("collectionName", editFormValues.collectionName);
      formData.append("shortDescription", editFormValues.shortDescription);
      formData.append("longDescription", editFormValues.longDescription);
      formData.append("material", editFormValues.material);
      formData.append("productsInCollection", editFormValues.productsInCollection);
      formData.append("availableColors", editFormValues.availableColors);
      formData.append("matchingPalette", editFormValues.matchingPalette);
      formData.append("sizes", editFormValues.sizes);
      formData.append("unique", String(editFormValues.unique));
      formData.append("handmade", String(editFormValues.handmade));

      for (const preview of editDetailedImagePreviews) {
        formData.append("imagesDetailed", preview.file);
      }

      const response = await fetch("/api/items", {
        method: "PATCH",
        body: formData,
      });
      const data = await readResponsePayload(response);

      if (!response.ok) {
        throw new Error(data.error || "Failed to update item");
      }

      await fetchItems();
      closeEditModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update item";
      console.error(error);
      setEditFormError(message);
      setIsUpdatingItem(false);
    }
  };

  const renderImagePreviews = (
    previews: ImagePreview[],
    imageKey: ItemImageKey
  ) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
      {previews.map((image, index) => (
        <div
          key={`${image.url}-${index}`}
          style={{
            position: "relative",
            width: 66,
            height: 66,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.10)",
            background: "rgba(255,255,255,0.9)",
          }}
        >
          <img
            src={image.url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <button
            type="button"
            onClick={() => removePreview(imageKey, index)}
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              background: "rgba(0,0,0,0.75)",
              color: "white",
              border: "none",
              borderRadius: 999,
              width: 22,
              height: 22,
              cursor: "pointer",
              lineHeight: "22px",
              textAlign: "center",
              fontWeight: 800,
            }}
            aria-label="Remove image"
            title="Remove"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );

  const renderStandaloneImagePreviews = (
    previews: ImagePreview[],
    onRemove: (index: number) => void
  ) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
      {previews.map((image, index) => (
        <div
          key={`${image.url}-${index}`}
          style={{
            position: "relative",
            width: 66,
            height: 66,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.10)",
            background: "rgba(255,255,255,0.9)",
          }}
        >
          <img
            src={image.url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              background: "rgba(0,0,0,0.75)",
              color: "white",
              border: "none",
              borderRadius: 999,
              width: 22,
              height: 22,
              cursor: "pointer",
              lineHeight: "22px",
              textAlign: "center",
              fontWeight: 800,
            }}
            aria-label="Remove image"
            title="Remove"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );

  const renderItemFormFields = (
    values: ItemFormValues,
    onFieldChange: (fieldName: keyof ItemFormValues, value: string | boolean) => void,
    keyPrefix: string
  ) => (
    <>
      <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.8 }}>Basic info</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Name" labelStyle={styles.label}>
          <input
            name={`${keyPrefix}-name`}
            placeholder="Item name"
            required
            value={values.name}
            onChange={(event) => onFieldChange("name", event.target.value)}
            style={styles.input}
          />
        </Field>

        <Field label="Shopify" labelStyle={styles.label} hint="Product or collection link">
          <input
            name={`${keyPrefix}-shopify`}
            placeholder="shopify.com"
            required
            value={values.shopify}
            onChange={(event) => onFieldChange("shopify", event.target.value)}
            style={styles.input}
          />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Type" labelStyle={styles.label}>
          <input
            name={`${keyPrefix}-type`}
            placeholder="Type"
            required
            value={values.type}
            onChange={(event) => onFieldChange("type", event.target.value)}
            style={styles.input}
          />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Category" labelStyle={styles.label}>
          <input
            name={`${keyPrefix}-category`}
            placeholder="Category"
            required
            value={values.category}
            onChange={(event) => onFieldChange("category", event.target.value)}
            style={styles.input}
          />
        </Field>

        <Field label="Season" labelStyle={styles.label}>
          <input
            name={`${keyPrefix}-season`}
            placeholder="Season"
            required
            value={values.season}
            onChange={(event) => onFieldChange("season", event.target.value)}
            style={styles.input}
          />
        </Field>
      </div>

      <Field label="Collection name" labelStyle={styles.label}>
        <input
          name={`${keyPrefix}-collectionName`}
          placeholder="Collection name"
          required
          value={values.collectionName}
          onChange={(event) => onFieldChange("collectionName", event.target.value)}
          style={styles.input}
        />
      </Field>

      <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.8, marginTop: 4 }}>
        Description
      </div>

      <Field label="Short description" labelStyle={styles.label}>
        <input
          name={`${keyPrefix}-shortDescription`}
          placeholder="Short description"
          required
          value={values.shortDescription}
          onChange={(event) => onFieldChange("shortDescription", event.target.value)}
          style={styles.input}
        />
      </Field>

      <Field label="Long description" labelStyle={styles.label}>
        <textarea
          name={`${keyPrefix}-longDescription`}
          placeholder="Long description"
          required
          value={values.longDescription}
          onChange={(event) => onFieldChange("longDescription", event.target.value)}
          style={styles.textarea}
        />
      </Field>

      <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.8, marginTop: 4 }}>
        Details
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Material" labelStyle={styles.label}>
          <input
            name={`${keyPrefix}-material`}
            placeholder="Material"
            required
            value={values.material}
            onChange={(event) => onFieldChange("material", event.target.value)}
            style={styles.input}
          />
        </Field>

        <Field label="Products in collection" labelStyle={styles.label}>
          <input
            name={`${keyPrefix}-productsInCollection`}
            type="number"
            placeholder="Products in collection"
            required
            value={values.productsInCollection}
            onChange={(event) => onFieldChange("productsInCollection", event.target.value)}
            style={styles.input}
          />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Available colors" hint="Comma separated" labelStyle={styles.label}>
          <input
            name={`${keyPrefix}-availableColors`}
            placeholder="e.g. white, beige, black"
            value={values.availableColors}
            onChange={(event) => onFieldChange("availableColors", event.target.value)}
            style={styles.input}
          />
        </Field>

        <Field label="Matching palette" hint="Comma separated" labelStyle={styles.label}>
          <input
            name={`${keyPrefix}-matchingPalette`}
            placeholder="e.g. sand, clay, ash"
            value={values.matchingPalette}
            onChange={(event) => onFieldChange("matchingPalette", event.target.value)}
            style={styles.input}
          />
        </Field>
      </div>

      <Field label="Sizes" hint="Comma separated" labelStyle={styles.label}>
        <input
          name={`${keyPrefix}-sizes`}
          placeholder="e.g. 20cm, 25cm, 30cm"
          value={values.sizes}
          onChange={(event) => onFieldChange("sizes", event.target.value)}
          style={styles.input}
        />
      </Field>

      <div style={{ display: "flex", gap: 12 }}>
        <label
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 12px",
            borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.10)",
            background: "rgba(255,255,255,0.75)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            name={`${keyPrefix}-unique`}
            checked={values.unique}
            onChange={(event) => onFieldChange("unique", event.target.checked)}
          />
          <span style={{ fontSize: 13, fontWeight: 650 }}>Unique</span>
        </label>

        <label
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 12px",
            borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.10)",
            background: "rgba(255,255,255,0.75)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            name={`${keyPrefix}-handmade`}
            checked={values.handmade}
            onChange={(event) => onFieldChange("handmade", event.target.checked)}
          />
          <span style={{ fontSize: 13, fontWeight: 650 }}>Handmade</span>
        </label>
      </div>
    </>
  );

  return (
    <>
      {isLoginVisible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9000,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              background: "rgba(0,0,0,0.35)",
            }}
          />

          <form
            onSubmit={handleLoginSubmit}
            style={{
              position: "relative",
              width: 320,
              minHeight: 320,
              borderRadius: 18,
              background: "rgba(255,255,255,0.92)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              justifyContent: "center",
              alignItems: "stretch",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Admin Access</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Please sign in to continue
              </div>
            </div>

            <Field label="Username" labelStyle={styles.label}>
              <input
                id="admin-username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                disabled={isCheckingAuth}
                style={styles.input}
              />
            </Field>

            <Field label="Password" labelStyle={styles.label}>
              <input
                id="admin-password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                type="password"
                disabled={isCheckingAuth}
                style={styles.input}
              />
            </Field>

            <button type="submit" disabled={isCheckingAuth} style={styles.button}>
              {isCheckingAuth ? "Checking..." : "Sign in"}
            </button>

            {loginError && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#b00020",
                  textAlign: "center",
                }}
              >
                {loginError}
              </div>
            )}
          </form>
        </div>
      )}

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
              {renderItemFormFields(itemFormValues, updateField, "create")}

              <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                Images
              </div>
              <div style={{ fontSize: 12, opacity: 0.65 }}>
                Maximum {maxImagesPerItem} uploaded images total per item. Each image must be{" "}
                {formatFileSize(maxImageFileSizeBytes)} or smaller. One upload request can be at
                most {formatFileSize(maxTotalImageUploadBytes)}.
              </div>

              {imageUploadSections.map((section) => (
                <div
                  key={section.key}
                  style={{
                    border: "1px dashed rgba(0,0,0,0.18)",
                    borderRadius: 16,
                    padding: 12,
                    background: "rgba(255,255,255,0.7)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ fontWeight: 850, fontSize: 13 }}>{section.label} Images</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      {imagePreviewGroups[section.key].length} selected
                    </div>
                  </div>

                  <div style={{ height: 10 }} />

                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(event) => handleFileChange(event, section.key)}
                    style={{ width: "100%" }}
                  />

                  {renderImagePreviews(imagePreviewGroups[section.key], section.key)}
                </div>
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

            {renderItemFormFields(editFormValues, updateEditField, "edit")}

            <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.8, marginTop: 4 }}>
              Add Detailed Images
            </div>
            <div style={{ fontSize: 12, opacity: 0.65 }}>
              Existing detailed images: {selectedEditItem.images.detailed.length}. Maximum {maxImagesPerItem} total.
            </div>

            <div
              style={{
                border: "1px dashed rgba(0,0,0,0.18)",
                borderRadius: 16,
                padding: 12,
                background: "rgba(255,255,255,0.7)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ fontWeight: 850, fontSize: 13 }}>New Detailed Images</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {editDetailedImagePreviews.length} selected
                </div>
              </div>

              <div style={{ height: 10 }} />

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleEditDetailedImagesChange}
                style={{ width: "100%" }}
              />

              {renderStandaloneImagePreviews(
                editDetailedImagePreviews,
                removeEditDetailedPreview
              )}
            </div>

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
