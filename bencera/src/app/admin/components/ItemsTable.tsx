"use client";

import { Pencil, Trash2, X } from "lucide-react";
import type { Item, ItemImageKey } from "@/types/item";

interface ItemsTableProps {
  items: Item[];
  onDeleteClick: (id: string) => void;
  onEditClick: (item: Item) => void;
}

const imageColumnOrder: ItemImageKey[] = ["above", "detailed", "background", "howToUse"];

const disabledControlStyle = {
  opacity: 0.45,
  cursor: "not-allowed",
};

export default function ItemsTable({ items, onDeleteClick, onEditClick }: ItemsTableProps) {
  return (
    <div
      style={{
        width: "100%",
        maxHeight: "600px",
        overflowY: "auto",
        overflowX: "auto",
        marginTop: 40,
        border: "1px solid #ccc",
        borderRadius: 5,
        padding: 10,
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead style={{ position: "sticky", top: 0, background: "#f5f5f5", zIndex: 1 }}>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Shopify</th>
            <th>Type</th>
            <th>Category</th>
            <th>Available Colors</th>
            <th>Matching Palette</th>
            <th>Images Above</th>
            <th>Images Detailed</th>
            <th>Images Background</th>
            <th>Images HowToUse</th>
            <th>Short Desc</th>
            <th>Long Desc</th>
            <th>Collection</th>
            <th>Season</th>
            <th>Sizes</th>
            <th>Products</th>
            <th>Unique</th>
            <th>Handmade</th>
            <th>Material</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} style={{ borderBottom: "1px solid #ccc", verticalAlign: "top" }}>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => onEditClick(item)}
                    style={{ background: "transparent", border: "none", cursor: "pointer" }}
                    aria-label={`Edit ${item.name}`}
                    title="Edit item"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteClick(item.id)}
                    style={{ background: "transparent", border: "none", cursor: "pointer" }}
                    aria-label={`Delete ${item.name}`}
                    title="Delete item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>

              <td>{item.name}</td>
              <td>{item.shopify}</td>
              <td>{item.type}</td>
              <td>{item.category}</td>
              <td>{item.availableColors.join(", ")}</td>
              <td>{item.matchingPalette.join(", ")}</td>

              {imageColumnOrder.map((imageKey) => {
                const imageUrls = item.images?.[imageKey] || [];

                return (
                  <td key={imageKey}>
                    {imageUrls.map((url, index) =>
                      url ? (
                        <div
                          key={`${url}-${index}`}
                          style={{ display: "flex", alignItems: "center", marginBottom: 5 }}
                        >
                          <img
                            src={url}
                            alt=""
                            style={{
                              width: 50,
                              height: 50,
                              objectFit: "cover",
                              borderRadius: 5,
                              marginRight: 5,
                            }}
                          />
                          <input
                            type="text"
                            value={url}
                            readOnly
                            aria-label={`${imageKey} image url`}
                            style={{ width: 120, background: "#f6f6f6", color: "#666" }}
                          />
                          <button
                            type="button"
                            disabled
                            title="Not available yet"
                            aria-label="Remove image unavailable"
                            style={{
                              background: "transparent",
                              border: "none",
                              marginLeft: 2,
                              ...disabledControlStyle,
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : null
                    )}

                    <button
                      type="button"
                      disabled
                      title="Not available yet"
                      style={{ marginTop: 2, ...disabledControlStyle }}
                    >
                      + Add
                    </button>
                  </td>
                );
              })}

              <td>{item.shortDescription}</td>
              <td>{item.longDescription}</td>
              <td>{item.collectionName}</td>
              <td>{item.season}</td>
              <td>{item.sizes.join(", ")}</td>
              <td>{item.productsInCollection}</td>
              <td>{item.unique ? "\u2714" : ""}</td>
              <td>{item.handmade ? "\u2714" : ""}</td>
              <td>{item.material}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
