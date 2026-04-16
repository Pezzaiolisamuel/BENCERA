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
  createEmptyImagePreviewGroups,
  imageUploadSections,
  initialItemFormValues,
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

  const updateField = (fieldName: keyof ItemFormValues, value: string | boolean) => {
    setItemFormValues((currentValues) => ({
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

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    imageKey: ItemImageKey
  ) => {
    const files = event.target.files;
    if (!files) return;

    const nextPreviews: ImagePreview[] = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

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
      const data = await response.json();

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
              <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.8 }}>Basic info</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Name" labelStyle={styles.label}>
                  <input
                    name="name"
                    placeholder="Item name"
                    required
                    value={itemFormValues.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    style={styles.input}
                  />
                </Field>

                <Field label="Type" labelStyle={styles.label}>
                  <input
                    name="type"
                    placeholder="Type"
                    required
                    value={itemFormValues.type}
                    onChange={(event) => updateField("type", event.target.value)}
                    style={styles.input}
                  />
                </Field>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Category" labelStyle={styles.label}>
                  <input
                    name="category"
                    placeholder="Category"
                    required
                    value={itemFormValues.category}
                    onChange={(event) => updateField("category", event.target.value)}
                    style={styles.input}
                  />
                </Field>

                <Field label="Season" labelStyle={styles.label}>
                  <input
                    name="season"
                    placeholder="Season"
                    required
                    value={itemFormValues.season}
                    onChange={(event) => updateField("season", event.target.value)}
                    style={styles.input}
                  />
                </Field>
              </div>

              <Field label="Collection name" labelStyle={styles.label}>
                <input
                  name="collectionName"
                  placeholder="Collection name"
                  required
                  value={itemFormValues.collectionName}
                  onChange={(event) => updateField("collectionName", event.target.value)}
                  style={styles.input}
                />
              </Field>

              <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                Description
              </div>

              <Field label="Short description" labelStyle={styles.label}>
                <input
                  name="shortDescription"
                  placeholder="Short description"
                  required
                  value={itemFormValues.shortDescription}
                  onChange={(event) => updateField("shortDescription", event.target.value)}
                  style={styles.input}
                />
              </Field>

              <Field label="Long description" labelStyle={styles.label}>
                <textarea
                  name="longDescription"
                  placeholder="Long description"
                  required
                  value={itemFormValues.longDescription}
                  onChange={(event) => updateField("longDescription", event.target.value)}
                  style={styles.textarea}
                />
              </Field>

              <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                Details
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Material" labelStyle={styles.label}>
                  <input
                    name="material"
                    placeholder="Material"
                    required
                    value={itemFormValues.material}
                    onChange={(event) => updateField("material", event.target.value)}
                    style={styles.input}
                  />
                </Field>

                <Field label="Products in collection" labelStyle={styles.label}>
                  <input
                    name="productsInCollection"
                    type="number"
                    placeholder="Products in collection"
                    required
                    value={itemFormValues.productsInCollection}
                    onChange={(event) =>
                      updateField("productsInCollection", event.target.value)
                    }
                    style={styles.input}
                  />
                </Field>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field
                  label="Available colors"
                  hint="Comma separated"
                  labelStyle={styles.label}
                >
                  <input
                    name="availableColors"
                    placeholder="e.g. white, beige, black"
                    value={itemFormValues.availableColors}
                    onChange={(event) => updateField("availableColors", event.target.value)}
                    style={styles.input}
                  />
                </Field>

                <Field
                  label="Matching palette"
                  hint="Comma separated"
                  labelStyle={styles.label}
                >
                  <input
                    name="matchingPalette"
                    placeholder="e.g. sand, clay, ash"
                    value={itemFormValues.matchingPalette}
                    onChange={(event) => updateField("matchingPalette", event.target.value)}
                    style={styles.input}
                  />
                </Field>
              </div>

              <Field label="Sizes" hint="Comma separated" labelStyle={styles.label}>
                <input
                  name="sizes"
                  placeholder="e.g. 20cm, 25cm, 30cm"
                  value={itemFormValues.sizes}
                  onChange={(event) => updateField("sizes", event.target.value)}
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
                    name="unique"
                    checked={itemFormValues.unique}
                    onChange={(event) => updateField("unique", event.target.checked)}
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
                    name="handmade"
                    checked={itemFormValues.handmade}
                    onChange={(event) => updateField("handmade", event.target.checked)}
                  />
                  <span style={{ fontSize: 13, fontWeight: 650 }}>Handmade</span>
                </label>
              </div>

              <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                Images
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

            <ItemsTable items={catalogItems} onDeleteClick={handleDeleteItem} />
          </section>
        </div>

        <div style={{ height: 28 }} />
      </div>
    </>
  );
}
