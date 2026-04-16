"use client";

import React, { useRef, useState } from "react";
import NavBar from "./NavBar";
import Canvas from "./Canvas";
import DetailsPanel from "./DetailsPanel";
import type { Item } from "@/types/item";

type GalleryViewportProps = {
  items: Item[];
};

export default function GalleryViewport({ items }: GalleryViewportProps) {
  console.log("GalleryViewport items:", items?.length, items?.[0]);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [activeItem, setActiveItem] = useState<Item | null>(null);
  

  return (
    <div id="viewport" style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      <NavBar />

      <div
        className="main"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          backgroundColor: "transparent",
        }}
      >
        <DetailsPanel
          key={activeItem?.id ?? "empty"}
          item={activeItem}
          onClose={() => setActiveItem(null)}
        />
        <Canvas ref={canvasRef} items={items} onItemClick={setActiveItem} />
      </div>
    </div>
  );
}
