"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import type { Item } from "@/types/item";
import {
  calculateCanvasItemLayouts,
  createRepeatedCanvasItems,
} from "./canvas/canvas-layout";
import type { ItemLayout } from "./canvas/canvas-types";
import CanvasControls from "./canvas/CanvasControls";
import CanvasSurface from "./canvas/CanvasSurface";
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

  const itemData = useRef<ItemLayout[]>([]);
  const [itemLayouts, setItemLayouts] = useState<ItemLayout[]>([]);
  const [ready, setReady] = useState(false);

  const didIntroZoom = useRef(false);
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
    itemLayoutsRef: itemData,
    ready,
  });

  useEffect(() => {
    if (!ref || !("current" in ref) || !ref.current) return;

    const nextItemLayouts = calculateCanvasItemLayouts(itemsToRender.length, Math.random);
    itemData.current = nextItemLayouts;
    didIntroZoom.current = false;

    let isCurrentLayout = true;
    queueMicrotask(() => {
      if (!isCurrentLayout) return;
      setItemLayouts(nextItemLayouts);
      setReady(true);
    });

    return () => {
      isCurrentLayout = false;
    };
  }, [itemsToRender, ref]);

  useEffect(() => {
    if (!ready) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".item"));
    if (!nodes.length) return;

    gsap.set(nodes, { xPercent: -50, yPercent: -50, transformOrigin: "50% 50%" });

    gsap.killTweensOf(nodes);

    const triggerIntroZoom = () => {
      if (didIntroZoom.current) return;
      if (userInteractedRef.current) return;

      didIntroZoom.current = true;

      const targetScale = getScaleForVisibleItems(11);

      if (targetScale > focusRef.current.scale) {
        const applyFocus = applyFocusRef.current;
        if (!applyFocus) return;

        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;

        const s1 = focusRef.current.scale;
        const s2 = targetScale;

        const wx = (cx - focusRef.current.x) / s1;
        const wy = (cy - focusRef.current.y) / s1;

        const target = { scale: s2, x: cx - wx * s2, y: cy - wy * s2 };

        gsap.killTweensOf(focusRef.current);
        gsap.to(focusRef.current, {
          scale: target.scale,
          x: target.x,
          y: target.y,
          duration: 1.7,
          ease: "power3.out",
          onUpdate: applyFocus,
        });
      }
    };

    gsap.fromTo(
      nodes,
      { opacity: 0, scale: 0 },
      {
        opacity: 1,
        scale: 0.8,
        duration: 0.45,
        stagger: { each: 0.01, from: "random" },
        ease: "back.out(1.6)",
        onStart: () => {
          window.setTimeout(triggerIntroZoom, 500);
        },
      }
    );
  }, [ready, applyFocusRef, focusRef, getScaleForVisibleItems, userInteractedRef]);

  useEffect(() => {
    if (!ready) return;

    const targets = Array.from(document.querySelectorAll<HTMLElement>(".itemReveal"));
    if (!targets.length) return;

    for (const el of targets) el.classList.remove("is-visible");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add("is-visible");
          io.unobserve(el);
        }
      },
      { root: null, threshold: 0.12, rootMargin: "120px" }
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ready, itemsToRender]);

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
