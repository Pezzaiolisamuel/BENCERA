"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

interface CanvasProps {
  items: any[];
  onItemClick: (item: any) => void;
}

const Canvas = React.forwardRef<HTMLDivElement, CanvasProps>(
  ({ items, onItemClick }, ref) => {
    const totalItems = 100;
    const itemsPerRow = 10;
    const canvasWidth = 3000;
    const canvasHeight = 2000;

    const itemsToRender = useMemo(() => {
      const extended: any[] = [];
      while (extended.length < totalItems) extended.push(...items);
      return extended.slice(0, totalItems);
    }, [items]);

    const itemData = useRef<{ size: number; top: number; left: number }[]>([]);
    const [ready, setReady] = useState(false);

    // camera + drag
    const camera = useRef({ x: 0, y: 0, scale: 1 });
    const drag = useRef({
      active: false,
      pointerId: -1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      vx: 0,
      vy: 0,
      moved: false,
    });

    // quick setters + applyCamera ref so buttons can use it
    const setters = useRef<{
      setX?: (v: number) => void;
      setY?: (v: number) => void;
      setScale?: (v: number) => void;
      applyCamera?: () => void;
    }>({});

    /**
     * 1) Layout (no randomness, square tiles, safe spacing)
     */
    useEffect(() => {
      if (!ref || !("current" in ref) || !ref.current) return;

      const rowCount = Math.ceil(totalItems / itemsPerRow);

      const ySpacing = canvasHeight / (rowCount + 1);
      const oddSpacing = canvasWidth / (itemsPerRow + 1);

      // cell sizes based on spacing; use factor to avoid overlap
      const cellW = canvasWidth / (itemsPerRow + 1);
      const cellH = canvasHeight / (rowCount + 1);
      const squareSize = Math.floor(Math.min(cellW, cellH) * 0.6); // tweak 0.55-0.75

      itemData.current = itemsToRender.map((_, idx) => {
        const row = Math.floor(idx / itemsPerRow);
        const col = idx % itemsPerRow;

        const size = squareSize;

        const centerY = ySpacing * (row + 1);
        let centerX: number;

        if (row % 2 === 0) {
          centerX = oddSpacing * (col + 1);
        } else {
          const xStart = oddSpacing / 2;
          const xEnd = canvasWidth - oddSpacing / 2;
          const evenSpacing = (xEnd - xStart) / (itemsPerRow - 1);
          centerX = xStart + col * evenSpacing;
        }

        return {
          size,
          left: centerX - size / 2,
          top: centerY - size / 2,
        };
      });

      setReady(true);
    }, [itemsToRender, ref]);

    /**
     * 2) Fit canvas to viewport (cover) and start at TOP-RIGHT
     */
    useEffect(() => {
      if (!ready) return;
      if (!ref || !("current" in ref) || !ref.current) return;

      const el = ref.current;

      const applyFit = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const scale = Math.max(vw / canvasWidth, vh / canvasHeight);

        // TOP-RIGHT start
        const x = vw - canvasWidth * scale;
        const y = 0;

        camera.current = { x, y, scale };
        gsap.set(el, { x, y, scale });
      };

      applyFit();
      window.addEventListener("resize", applyFit);
      return () => window.removeEventListener("resize", applyFit);
    }, [ready, ref]);

    /**
     * 3) Load-in (opacity/scale only; doesn't fight layout)
     */
    useEffect(() => {
      if (!ready) return;

      const nodes = Array.from(document.querySelectorAll<HTMLElement>(".item"));
      if (!nodes.length) return;

      gsap.killTweensOf(nodes);
      gsap.fromTo(
        nodes,
        { opacity: 0, scale: 0.7, transformOrigin: "50% 50%" },
        {
          opacity: 1,
          scale: 1,
          duration: 0.35,
          stagger: 0.01,
          ease: "back.out(1.6)",
        }
      );
    }, [ready]);

    /**
     * 4) Drag + inertia + wrap + initialize quickSetters
     */
    useEffect(() => {
      if (!ready) return;
      if (!ref || !("current" in ref) || !ref.current) return;

      const el = ref.current;

      const setX = gsap.quickSetter(el, "x", "px") as (v: number) => void;
      const setY = gsap.quickSetter(el, "y", "px") as (v: number) => void;
      const setScale = gsap.quickSetter(el, "scale") as (v: number) => void;

      setters.current.setX = setX;
      setters.current.setY = setY;
      setters.current.setScale = setScale;

      const wrapCamera = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const scaledW = canvasWidth * camera.current.scale;
        const scaledH = canvasHeight * camera.current.scale;

        const minX = -scaledW - vw;
        const maxX = vw;
        while (camera.current.x < minX) camera.current.x += scaledW;
        while (camera.current.x > maxX) camera.current.x -= scaledW;

        const minY = -scaledH - vh;
        const maxY = vh;
        while (camera.current.y < minY) camera.current.y += scaledH;
        while (camera.current.y > maxY) camera.current.y -= scaledH;
      };

      const applyCamera = () => {
        wrapCamera();
        setScale(camera.current.scale);
        setX(camera.current.x);
        setY(camera.current.y);
      };

      setters.current.applyCamera = applyCamera;

      const onPointerDown = (e: PointerEvent) => {
        if (e.button !== undefined && e.button !== 0) return;

        drag.current.active = true;
        drag.current.pointerId = e.pointerId;
        drag.current.startX = e.clientX;
        drag.current.startY = e.clientY;
        drag.current.lastX = e.clientX;
        drag.current.lastY = e.clientY;
        drag.current.vx = 0;
        drag.current.vy = 0;
        drag.current.moved = false;

        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        gsap.killTweensOf(camera.current);
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!drag.current.active || e.pointerId !== drag.current.pointerId) return;

        const dx = e.clientX - drag.current.lastX;
        const dy = e.clientY - drag.current.lastY;

        const totalDx = e.clientX - drag.current.startX;
        const totalDy = e.clientY - drag.current.startY;
        if (!drag.current.moved && (Math.abs(totalDx) > 6 || Math.abs(totalDy) > 6)) {
          drag.current.moved = true;
        }

        drag.current.lastX = e.clientX;
        drag.current.lastY = e.clientY;

        drag.current.vx = drag.current.vx * 0.8 + dx * 0.2;
        drag.current.vy = drag.current.vy * 0.8 + dy * 0.2;

        camera.current.x += dx;
        camera.current.y += dy;

        applyCamera();
      };

      const onPointerUp = (e: PointerEvent) => {
        if (!drag.current.active || e.pointerId !== drag.current.pointerId) return;

        drag.current.active = false;

        // click: no inertia, no wrap snap
        if (!drag.current.moved) {
          drag.current.pointerId = -1;
          return;
        }

        const speed = Math.hypot(drag.current.vx, drag.current.vy);
        if (speed < 0.1) {
          drag.current.pointerId = -1;
          return;
        }

        const inertiaX = camera.current.x + drag.current.vx * 18;
        const inertiaY = camera.current.y + drag.current.vy * 18;

        gsap.to(camera.current, {
          x: inertiaX,
          y: inertiaY,
          duration: 0.9,
          ease: "power3.out",
          onUpdate: applyCamera,
        });

        drag.current.pointerId = -1;
      };

      // critical: prevents browser gesture scrolling/zooming on touch devices
      el.style.touchAction = "none";

      el.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);

      return () => {
        el.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
      };
    }, [ready, ref]);

    /**
     * 5) HARD BLOCK browser zoom + scroll gestures (wheel, pinch, keyboard)
     *    This prevents the *page* zoom; you’ll zoom only via our buttons.
     */
    useEffect(() => {
      const blockWheel = (e: WheelEvent) => {
        // block scroll + ctrl/cmd zoom
        e.preventDefault();
      };

      const blockKeyZoom = (e: KeyboardEvent) => {
        const isMac = navigator.platform.toLowerCase().includes("mac");
        const mod = isMac ? e.metaKey : e.ctrlKey;

        if (!mod) return;

        // Ctrl/Cmd + + / - / 0
        if (e.key === "+" || e.key === "=" || e.key === "-" || e.key === "0") {
          e.preventDefault();
        }
      };

      // Safari gesture events
      const blockGesture = (e: Event) => e.preventDefault();

      window.addEventListener("wheel", blockWheel, { passive: false, capture: true });
      document.addEventListener("wheel", blockWheel, { passive: false, capture: true });

      window.addEventListener("keydown", blockKeyZoom, { capture: true });

      document.addEventListener("gesturestart", blockGesture as any, { passive: false });
      document.addEventListener("gesturechange", blockGesture as any, { passive: false });
      document.addEventListener("gestureend", blockGesture as any, { passive: false });

      return () => {
        window.removeEventListener("wheel", blockWheel as any, true as any);
        document.removeEventListener("wheel", blockWheel as any, true as any);

        window.removeEventListener("keydown", blockKeyZoom as any, true as any);

        document.removeEventListener("gesturestart", blockGesture as any);
        document.removeEventListener("gesturechange", blockGesture as any);
        document.removeEventListener("gestureend", blockGesture as any);
      };
    }, []);

    /**
     * Center-anchored zoom helper (keeps focus at screen center)
     */
    const zoomTo = (nextScale: number) => {
      const applyCamera = setters.current.applyCamera;
      if (!applyCamera) return;

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;

      const s1 = camera.current.scale;
      const s2 = nextScale;

      const wx = (cx - camera.current.x) / s1;
      const wy = (cy - camera.current.y) / s1;

      camera.current.scale = s2;
      camera.current.x = cx - wx * s2;
      camera.current.y = cy - wy * s2;

      applyCamera();
    };

    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

    const onZoomIn = () => {
      const next = clamp(camera.current.scale * 1.12, 0.2, 4);
      zoomTo(next);
    };

    const onZoomOut = () => {
      const next = clamp(camera.current.scale / 1.12, 0.2, 4);
      zoomTo(next);
    };

    return (
      <>
        <div
          className="canvas"
          ref={ref}
          style={{
            position: "absolute",
            width: canvasWidth,
            height: canvasHeight,
            transformOrigin: "top left",
          }}
        >
          {ready &&
            itemsToRender.map((item, idx) => {
              const data = itemData.current[idx];
              if (!data) return null;

              const img = item.images?.above?.[0];

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className="item"
                  data-idx={idx}
                  onClick={() => {
                    if (drag.current.moved) return;
                    onItemClick(item);
                    drag.current.moved = false;
                  }}
                  style={{
                    position: "absolute",
                    cursor: "pointer",
                    overflow: "hidden",
                    top: data.top,
                    left: data.left,
                    width: data.size,
                    height: data.size,
                  }}
                >
                  {img ? (
                    <img
                      src={img}
                      alt={item.name}
                      draggable={false}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    />
                  ) : null}
                </div>
              );
            })}
        </div>

        {/* Zoom UI (fixed bottom-right) */}
        <div
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            zIndex: 9999,
          }}
        >
          <button
            onClick={onZoomIn}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.55)",
              color: "white",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: "44px",
            }}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={onZoomOut}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.55)",
              color: "white",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: "44px",
            }}
            aria-label="Zoom out"
          >
            −
          </button>
        </div>
      </>
    );
  }
);

Canvas.displayName = "Canvas";
export default Canvas;
