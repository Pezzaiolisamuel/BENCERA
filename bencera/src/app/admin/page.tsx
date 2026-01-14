"use client";

import { useState } from "react";

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {

    const form = e.currentTarget;

    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    const payload = {
      name: formData.get("name"),
      type: formData.get("type"),
      category: formData.get("category"),

      availableColors: formData
        .get("availableColors")
        ?.toString()
        .split(",")
        .map(s => s.trim()),

      matchingPalette: formData
        .get("matchingPalette")
        ?.toString()
        .split(",")
        .map(s => s.trim()),

      imagesAbove: [],
      imagesDetailed: [],
      imagesBackground: [],
      imagesHowToUse: [],

      shortDescription: formData.get("shortDescription"),
      longDescription: formData.get("longDescription"),

      collectionName: formData.get("collectionName"),
      season: formData.get("season"),

      sizes: formData
        .get("sizes")
        ?.toString()
        .split(",")
        .map(s => s.trim()),

      productsInCollection: Number(
        formData.get("productsInCollection")
      ),

      unique: formData.get("unique") === "on",
      handmade: formData.get("handmade") === "on",

      material: formData.get("material"),
    };

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      setSuccess(true);
      form.reset(); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: "40px auto" }}>
      <h1>Admin – Create Item</h1>

      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Item name" required />
        <input name="type" placeholder="Type" required />
        <input name="category" placeholder="Category" required />

        <input
          name="availableColors"
          placeholder="Available colors (comma separated)"
        />

        <input
          name="matchingPalette"
          placeholder="Matching palette (comma separated)"
        />

        <input
          name="shortDescription"
          placeholder="Short description"
          required
        />

        <textarea
          name="longDescription"
          placeholder="Long description"
          required
        />

        <input
          name="collectionName"
          placeholder="Collection name"
          required
        />

        <input name="season" placeholder="Season" required />

        <input
          name="sizes"
          placeholder="Sizes (comma separated)"
        />

        <input
          name="productsInCollection"
          type="number"
          placeholder="Products in collection"
          required
        />

        <input name="material" placeholder="Material" required />

        <label>
          <input type="checkbox" name="unique" /> Unique
        </label>

        <label>
          <input type="checkbox" name="handmade" /> Handmade
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Create Item"}
        </button>
      </form>

      {success && <p style={{ color: "green" }}>Item created ✔</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </main>
  );
}
