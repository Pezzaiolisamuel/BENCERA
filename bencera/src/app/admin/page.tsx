"use client";

import { useState, useEffect } from "react";
import ItemsTable from "./components/ItemsTable";

interface ImagePreview {
  file: File;
  url: string;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  // Image previews for each category
  const [imagesAbove, setImagesAbove] = useState<ImagePreview[]>([]);
  const [imagesDetailed, setImagesDetailed] = useState<ImagePreview[]>([]);
  const [imagesBackground, setImagesBackground] = useState<ImagePreview[]>([]);
  const [imagesHowToUse, setImagesHowToUse] = useState<ImagePreview[]>([]);

  // Fetch items from API
  const fetchItems = async () => {
    try {
      const res = await fetch("/api/items");
      if (!res.ok) throw new Error("Failed to fetch items");
      const data = await res.json();
      // Parse JSON fields
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

  useEffect(() => {
    fetchItems();
  }, []);

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

      // Append images
      const imageGroups = [
        ["imagesAbove", imagesAbove],
        ["imagesDetailed", imagesDetailed],
        ["imagesBackground", imagesBackground],
        ["imagesHowToUse", imagesHowToUse],
      ] satisfies Array<[string, ImagePreview[]]>;
      imageGroups.forEach(([key, list]) => {
        list.forEach((img) => {
          formData.append(key, img.file);
        });
      });

      const res = await fetch("/api/items", {
        method: "POST",
        body: formData,
      });

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
      fetchItems();
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
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 5 }}>
      {list.map((img, idx) => (
        <div key={idx} style={{ position: "relative" }}>
          <img
            src={img.url}
            alt=""
            style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 5 }}
          />
          <button
            type="button"
            onClick={() => removePreview(setter, idx)}
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              background: "red",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: 18,
              height: 18,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "40px auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1>Admin – Create Item</h1>

      <form onSubmit={handleSubmit} style={{ width: "80%" }}>
        <input name="name" placeholder="Item name" required />
        <input name="type" placeholder="Type" required />
        <input name="category" placeholder="Category" required />
        <input name="availableColors" placeholder="Available colors (comma separated)" />
        <input name="matchingPalette" placeholder="Matching palette (comma separated)" />
        <input name="shortDescription" placeholder="Short description" required />
        <textarea name="longDescription" placeholder="Long description" required />
        <input name="collectionName" placeholder="Collection name" required />
        <input name="season" placeholder="Season" required />
        <input name="sizes" placeholder="Sizes (comma separated)" />
        <input name="productsInCollection" type="number" placeholder="Products in collection" required />
        <input name="material" placeholder="Material" required />
        <label><input type="checkbox" name="unique" /> Unique</label>
        <label><input type="checkbox" name="handmade" /> Handmade</label>

        {/* IMAGE UPLOAD INPUTS */}
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
          <div key={label} style={{ marginTop: 15 }}>
            <h4>{label} Images</h4>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileChange(e, setter as any)}
            />
            {renderImagePreviews(list as ImagePreview[], setter as any)}
          </div>
        ))}

        <button type="submit" disabled={loading} style={{ marginTop: 20 }}>
          {loading ? "Saving..." : "Create Item"}
        </button>
      </form>

      {success && <p style={{ color: "green" }}>Item created ✔</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Items Table */}
      <ItemsTable items={items} onDeleteClick={deleteItem} />
    </main>
  );
}
