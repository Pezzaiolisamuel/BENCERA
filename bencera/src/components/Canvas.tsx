"use client";

import React, { useMemo, useState } from "react";
import type { Item } from "@/types/item";
import { createRepeatedCanvasItems } from "./canvas/canvas-layout";
import CanvasControls from "./canvas/CanvasControls";
import CanvasSurface from "./canvas/CanvasSurface";
import { useCanvasEntranceEffects } from "./canvas/useCanvasEntranceEffects";
import { useCanvasLayoutState } from "./canvas/useCanvasLayoutState";
import { useCanvasViewport } from "./canvas/useCanvasViewport";

interface CanvasProps {
  items: Item[];
  onItemClick: (item: Item) => void;
}

const Canvas = React.forwardRef<HTMLDivElement, CanvasProps>(({ items, onItemClick }, ref) => {
  const [layoutSeed] = useState(() => Math.random() * 1e9);

  const itemsToRender = useMemo(
    () => createRepeatedCanvasItems(items, layoutSeed),
    [items, layoutSeed]
  );
  const { itemLayouts, itemLayoutsRef, ready } = useCanvasLayoutState({
    itemCount: itemsToRender.length,
  });
  const {
    applyFocusRef,
    dragRef,
    focusRef,
    getScaleForVisibleItems,
    isDragging,
    userInteractedRef,
    zoomIn,
    zoomOut,
  } = useCanvasViewport({
    canvasRef: ref,
    itemLayoutsRef,
    ready,
  });

  useCanvasEntranceEffects({
    applyFocusRef,
    focusRef,
    getScaleForVisibleItems,
    itemsToRender,
    ready,
    userInteractedRef,
  });

  return (
    <>
      <CanvasSurface
        ref={ref}
        dragRef={dragRef}
        isDragging={isDragging}
        items={itemsToRender}
        itemLayouts={itemLayouts}
        onItemClick={onItemClick}
        ready={ready}
      />

      <CanvasControls onZoomIn={zoomIn} onZoomOut={zoomOut} />
    </>
  );
});

Canvas.displayName = "Canvas";
export default Canvas;
