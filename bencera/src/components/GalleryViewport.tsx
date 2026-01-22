"use client";

import React, { useRef, useState } from "react";
import NavBar from "./NavBar";
import Canvas from "./Canvas";
import DetailsPanel from "./DetailsPanel";
import { useGalleryViewport } from "../app/hooks/useGalleryViewport";

export default function GalleryViewport({ items }: any) {
  console.log("GalleryViewport items:", items?.length, items?.[0]);
  const canvasRef = useRef<HTMLDivElement>(null);
//   useGalleryViewport({ canvasRef });

  const [activeItem, setActiveItem] = useState(null);
  

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
        <DetailsPanel item={activeItem} onClose={() => setActiveItem(null)} />
        <Canvas ref={canvasRef} items={items} onItemClick={setActiveItem} />
      </div>
    </div>
  );
}
