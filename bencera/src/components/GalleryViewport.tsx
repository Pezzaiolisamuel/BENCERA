"use client";

import React, { useRef, useState } from "react";
import NavBar from "./NavBar";
import Canvas from "./Canvas";
import DetailsPanel from "./DetailsPanel";
import { useGalleryViewport } from "../app/hooks/useGalleryViewport";

export default function GalleryViewport({ items }: any) {
  const canvasRef = useRef<HTMLDivElement>(null);
  useGalleryViewport({ canvasRef });

  const [activeItem, setActiveItem] = useState(null);

  return (
    <div id="viewport">
      <NavBar />

      <div className="main">
        <DetailsPanel item={activeItem} onClose={() => setActiveItem(null)} />
        <Canvas ref={canvasRef} items={items} onItemClick={setActiveItem} />
      </div>
    </div>
  );
}
