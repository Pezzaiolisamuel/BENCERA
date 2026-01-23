"use client";

import { useEffect, useMemo, useState } from "react";
import ItemsTable from "./components/ItemsTable";

interface ImagePreview {
  file: File;
  url: string;
}

export default function AdminPage() {
  // ---------- UI/Auth ----------
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showLogin, setShowLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // ---------- Page state ----------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  // Image previews for each category
  const [imagesAbove, setImagesAbove] = useState<ImagePreview[]>([]);
  const [imagesDetailed, setImagesDetailed] = useState<ImagePreview[]>([]);
  const [imagesBackground, setImagesBackground] = useState<ImagePreview[]>([]);
  const [imagesHowToUse, setImagesHowToUse] = useState<ImagePreview[]>([]);

  // ---------- Styles (inline, no deps) ----------
  const S = useMemo(() => {
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
    } as const;

    const textarea = {
      minHeight: 110,
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.12)",
      padding: "10px 12px",
      outline: "none",
      resize: "vertical" as const,
      background: "rgba(255,255,255,0.9)",
    } as const;

    const button = {
      height: 44,
      borderRadius: 12,
      border: "none",
      cursor: "pointer",
      fontWeight: 750,
      background: "black",
      color: "white",
    } as const;

    const softButton = {
      height: 44,
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.12)",
      cursor: "pointer",
      fontWeight: 650,
      background: "rgba(255,255,255,0.8)",
    } as const;

    return { card, label, input, textarea, button, softButton };
  }, []);

  // ---------- Data ----------
  const fetchItems = async () => {
    try {
      const res = await fetch("/api/items", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch items");
      const data = await res.json();

      const parsed = data.map((item: any) => ({
        ...item,
        availableColors: JSON.parse(item.availableColors || "[]"),
        matchingPalette: JSON.parse(item.matchingPalette || "[]"),
        sizes: JSON.parse(item.sizes || "[]"),
        images: {
          above: JSON.parse(item.imagesAbove || "[]"),
          detailed: JSON.parse(item.imagesDetailed || "[]"),
          background: JSON.parse(item.imagesBackground || "[]"),
          howToUse: JSON.parse(item.imagesHowToUse || "[]"),
        },
      }));

      setItems(parsed);
    } catch (err: any) {
      console.error(err);
    }
  };

  // ---------- check auth on load ----------
  useEffect(() => {
    const checkAuth = async () => {
      setCheckingAuth(true);
      setError(null);

      try {
        const res = await fetch("/api/admin/me", { cache: "no-store" });
        const data = await res.json();

        const authed = !!data?.authenticated;
        setShowLogin(!authed);

        if (authed) await fetchItems();
      } catch {
        setShowLogin(true);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // prevent ESC bypass
  useEffect(() => {
    if (!showLogin) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
  }, [showLogin]);

  // login submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Login failed");
        return;
      }

      setShowLogin(false);
      setPassword("");
      await fetchItems();
    } catch {
      setError("Login failed");
    }
  };

  // ---------- CRUD ----------
  const deleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/items?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  // Handle file selection
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<ImagePreview[]>>
  ) => {
    const files = e.target.files;
    if (!files) return;

    const previews: ImagePreview[] = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setter((prev) => [...prev, ...previews]);
  };

  const removePreview = (
    setter: React.Dispatch<React.SetStateAction<ImagePreview[]>>,
    index: number
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const imageGroups = [
        ["imagesAbove", imagesAbove],
        ["imagesDetailed", imagesDetailed],
        ["imagesBackground", imagesBackground],
        ["imagesHowToUse", imagesHowToUse],
      ] satisfies Array<[string, ImagePreview[]]>;

      imageGroups.forEach(([key, list]) => list.forEach((img) => formData.append(key, img.file)));

      const res = await fetch("/api/items", { method: "POST", body: formData });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      setSuccess(true);
      form.reset();
      setImagesAbove([]);
      setImagesDetailed([]);
      setImagesBackground([]);
      setImagesHowToUse([]);
      await fetchItems();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const renderImagePreviews = (
    list: ImagePreview[],
    setter: React.Dispatch<React.SetStateAction<ImagePreview[]>>
  ) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
      {list.map((img, idx) => (
        <div
          key={idx}
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
            src={img.url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <button
            type="button"
            onClick={() => removePreview(setter, idx)}
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
            ×
          </button>
        </div>
      ))}
    </div>
  );

  const Field = ({
    label,
    hint,
    children,
  }: {
    label: string;
    hint?: string;
    children: React.ReactNode;
  }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={S.label}>{label}</span>
        {hint ? <span style={{ fontSize: 12, opacity: 0.65 }}>{hint}</span> : null}
      </div>
      {children}
    </div>
  );

  // ---------- UI ----------
  return (
    <>
      {/* Full-screen auth gate modal */}
      {showLogin && (
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
              height: 320,
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

            <Field label="Username">
              <input
                id="admin-username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoFocus
                disabled={checkingAuth}
                style={S.input}
              />
            </Field>

            <Field label="Password">
              <input
                id="admin-password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                type="password"
                disabled={checkingAuth}
                style={S.input}
              />
            </Field>


            <button type="submit" disabled={checkingAuth} style={S.button}>
              {checkingAuth ? "Checking..." : "Sign in"}
            </button>

            {error && (
              <div style={{ marginTop: 4, fontSize: 12, color: "#b00020", textAlign: "center" }}>
                {error}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Full page visible + nicer layout */}
      <div
        style={{
          minHeight: "100vh",
          padding: 18,
          background:
            "radial-gradient(1200px 600px at 20% 0%, rgba(0,0,0,0.06), transparent 60%), radial-gradient(1200px 600px at 80% 40%, rgba(0,0,0,0.05), transparent 60%), #f7f7f7",
          pointerEvents: showLogin ? "none" : "auto",
          userSelect: showLogin ? "none" : "auto",
        }}
      >
        {/* Top bar */}
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
              style={S.softButton}
              disabled={loading}
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
              {loading ? "Saving…" : "Ready"}
            </div>
          </div>
        </header>

        {/* Content grid */}
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
          {/* Left: Form */}
          <section style={{ ...S.card, padding: 16, position: "sticky", top: 18, overflow: "scroll", maxHeight: "60%" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Create Item</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                {items.length} items
              </div>
            </div>

            <div style={{ height: 10 }} />

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Basic info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Name">
                  <input name="name" placeholder="Item name" required style={S.input} />
                </Field>
                <Field label="Type">
                  <input name="type" placeholder="Type" required style={S.input} />
                </Field>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Category">
                  <input name="category" placeholder="Category" required style={S.input} />
                </Field>
                <Field label="Season">
                  <input name="season" placeholder="Season" required style={S.input} />
                </Field>
              </div>

              <Field label="Collection name">
                <input name="collectionName" placeholder="Collection name" required style={S.input} />
              </Field>

              <Field label="Short description">
                <input name="shortDescription" placeholder="Short description" required style={S.input} />
              </Field>

              <Field label="Long description">
                <textarea name="longDescription" placeholder="Long description" required style={S.textarea} />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Material">
                  <input name="material" placeholder="Material" required style={S.input} />
                </Field>
                <Field label="Products in collection">
                  <input
                    name="productsInCollection"
                    type="number"
                    placeholder="Products in collection"
                    required
                    style={S.input}
                  />
                </Field>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Available colors" hint="Comma separated">
                  <input name="availableColors" placeholder="e.g. white, beige, black" style={S.input} />
                </Field>
                <Field label="Matching palette" hint="Comma separated">
                  <input name="matchingPalette" placeholder="e.g. sand, clay, ash" style={S.input} />
                </Field>
              </div>

              <Field label="Sizes" hint="Comma separated">
                <input name="sizes" placeholder="e.g. 20cm, 25cm, 30cm" style={S.input} />
              </Field>

              {/* Booleans */}
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
                  <input type="checkbox" name="unique" />
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
                  <input type="checkbox" name="handmade" />
                  <span style={{ fontSize: 13, fontWeight: 650 }}>Handmade</span>
                </label>
              </div>

              {/* Image upload sections */}
              {(
                [
                  ["Above", imagesAbove, setImagesAbove],
                  ["Detailed", imagesDetailed, setImagesDetailed],
                  ["Background", imagesBackground, setImagesBackground],
                  ["HowToUse", imagesHowToUse, setImagesHowToUse],
                ] satisfies Array<
                  [string, ImagePreview[], React.Dispatch<React.SetStateAction<ImagePreview[]>>]
                >
              ).map(([label, list, setter]) => (
                <div
                  key={label}
                  style={{
                    border: "1px dashed rgba(0,0,0,0.18)",
                    borderRadius: 16,
                    padding: 12,
                    background: "rgba(255,255,255,0.7)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 850, fontSize: 13 }}>{label} Images</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{list.length} selected</div>
                  </div>

                  <div style={{ height: 10 }} />

                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setter as any)}
                    style={{ width: "100%" }}
                  />

                  {renderImagePreviews(list as ImagePreview[], setter as any)}
                </div>
              ))}

              <button type="submit" disabled={loading} style={{ ...S.button, opacity: loading ? 0.75 : 1 }}>
                {loading ? "Saving..." : "Create Item"}
              </button>

              {success && <div style={{ color: "green", fontSize: 13, fontWeight: 650 }}>Item created ✔</div>}
              {error && <div style={{ color: "#b00020", fontSize: 13 }}>{error}</div>}
            </form>
          </section>

          {/* Right: Table */}
          <section style={{ ...S.card, padding: 16, minHeight: 500, overflow: "scroll", height: "85vh" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Items</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Latest first</div>
            </div>

            <div style={{ height: 12 }} />

            <ItemsTable items={items} onDeleteClick={deleteItem} />
          </section>
        </div>

        <div style={{ height: 28 }} />
      </div>
    </>
  );
}
