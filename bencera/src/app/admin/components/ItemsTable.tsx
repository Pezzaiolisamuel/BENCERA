"use client";

import React, { useState, useEffect } from "react";
import { Trash2, X } from "lucide-react";

interface ItemsTableProps {
  items: any[];
  onDeleteClick: (id: string) => void;
}

export default function ItemsTable({ items, onDeleteClick }: ItemsTableProps) {
  const [localItems, setLocalItems] = useState(items);

  // Sync props.items when they change
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const updateImageArray = (
    id: string,
    type: "above" | "detailed" | "background" | "howToUse",
    value: string[]
  ) => {
    setLocalItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              images: {
                ...item.images,
                [type]: value,
              },
            }
          : item
      )
    );
  };

  return (
    <div
      style={{
        width: "100%",
        maxHeight: "600px", // <-- fixed height
        overflowY: "auto", // <-- vertical scroll
        overflowX: "auto", // <-- horizontal scroll if needed
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
          {localItems.map((item) => (
            <tr key={item.id} style={{ borderBottom: "1px solid #ccc", verticalAlign: "top" }}>
              <td>
                <button
                  onClick={() => onDeleteClick(item.id)}
                  style={{ background: "transparent", border: "none", cursor: "pointer" }}
                >
                  <Trash2 size={16} />
                </button>
              </td>

              <td>{item.name}</td>
              <td>{item.type}</td>
              <td>{item.category}</td>
              <td>{(item.availableColors || []).join(", ")}</td>
              <td>{(item.matchingPalette || []).join(", ")}</td>

              {(["above", "detailed", "background", "howToUse"] as const).map((type) => {
                const arr = item.images?.[type] || [];
                return (
                  <td key={type}>
                    {arr.map((url: string, idx: number) => (
                        url ? (  // <-- only render if url is not empty
                            <div key={idx} style={{ display: "flex", alignItems: "center", marginBottom: 5 }}>
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
                                style={{ width: 120 }}
                                onChange={(e) => {
                                const newArr = [...arr];
                                newArr[idx] = e.target.value;
                                updateImageArray(item.id, type, newArr);
                                }}
                            />
                            <button
                                onClick={() => updateImageArray(item.id, type, arr.filter((_, i) => i !== idx))}
                                style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                marginLeft: 2,
                                }}
                            >
                                <X size={14} />
                            </button>
                            </div>
                        ) : null
                        ))}

                    <button onClick={() => updateImageArray(item.id, type, [...arr, ""])} style={{ marginTop: 2 }}>
                      + Add
                    </button>
                  </td>
                );
              })}

              <td>{item.shortDescription}</td>
              <td>{item.longDescription}</td>
              <td>{item.collectionName}</td>
              <td>{item.season}</td>
              <td>{(item.sizes || []).join(", ")}</td>
              <td>{item.productsInCollection}</td>
              <td>{item.unique ? "✔" : ""}</td>
              <td>{item.handmade ? "✔" : ""}</td>
              <td>{item.material}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
