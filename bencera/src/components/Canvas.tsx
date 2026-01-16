"use client";

import React, { useEffect, useRef, useState } from "react";
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

    const extendedItems: any[] = [];
    while (extendedItems.length < totalItems) {
      extendedItems.push(...items);
    }
    const itemsToRender = extendedItems.slice(0, totalItems);

    const itemData = useRef<{ size: number; top: number; left: number }[]>([]);
    const [ready, setReady] = useState(false);

    // Persistent drag state
    const posX = useRef(0);
    const posY = useRef(0);

    useEffect(() => {
      if (!ref || !("current" in ref) || !ref.current) return;
      const el = ref.current;

      const rowCount = 10;
      const ySpacing = canvasHeight / (rowCount + 1);
      const oddSpacing = canvasWidth / (itemsPerRow + 1);

      itemData.current = itemsToRender.map((_, idx) => {
        const row = Math.floor(idx / itemsPerRow);
        const col = idx % itemsPerRow;
        const size = Math.floor(Math.random() * 101) + 50;

        let centerX: number;
        let centerY: number = ySpacing * (row + 1);

        if (row % 2 === 0) {
          centerX = oddSpacing * (col + 1);
        } else {
          const xStart = (oddSpacing + oddSpacing * 2) / 2;
          const xEnd = canvasWidth;
          const evenSpacing = (xEnd - xStart) / (itemsPerRow - 1);
          centerX = xStart + col * evenSpacing;
        }

        const left = centerX - size / 2;
        const top = centerY - size / 2;

        return { size, left, top };
      });

      setReady(true);

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const scale = Math.min(vw / canvasWidth, vh / canvasHeight);

      posX.current = (vw - canvasWidth * scale) / 2;
      posY.current = (vh - canvasHeight * scale) / 2;

      // Prevent flash
      gsap.set(el, { x: posX.current, y: posY.current, scale });

      // Smooth intro
      gsap.to(el, { duration: 0.6, ease: "power3.out" });

      // DRAG LOGIC
      let isDown = false;
      let startX = 0;
      let startY = 0;
      let moved = false;
      const DRAG_THRESHOLD = 3;

      let dragTween: gsap.core.Tween | null = null;

      const pointerDown = (e: any) => {
        isDown = true;
        moved = false;

        if (dragTween) dragTween.kill();

        const p = e.touches ? e.touches[0] : e;
        startX = p.clientX - posX.current;
        startY = p.clientY - posY.current;
      };

      const pointerMove = (e: any) => {
        if (!isDown) return;

        const p = e.touches ? e.touches[0] : e;

        const newX = p.clientX - startX;
        const newY = p.clientY - startY;

        const dx = newX - posX.current;
        const dy = newY - posY.current;

        if (!moved && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
          moved = true;
        }

        if (!moved) return;

        posX.current = newX;
        posY.current = newY;

        dragTween = gsap.to(el, {
          x: posX.current,
          y: posY.current,
          duration: 0.18,
          ease: "power3.out",
          overwrite: "auto"
        });
      };

      const pointerUp = () => {
        if (!moved) {
          isDown = false;
          return;
        }

        if (dragTween) dragTween.progress(1);

        isDown = false;
      };

      el.addEventListener("mousedown", pointerDown);
      el.addEventListener("mousemove", pointerMove);
      el.addEventListener("mouseup", pointerUp);
      el.addEventListener("mouseleave", pointerUp);
      el.addEventListener("touchstart", pointerDown);
      el.addEventListener("touchmove", pointerMove);
      el.addEventListener("touchend", pointerUp);
      el.addEventListener("touchcancel", pointerUp);

      // FULLY DISABLE ZOOM + SCROLL = DRAG
      const wheelBlocker = (e: WheelEvent) => {
        // Prevent browser zoom (ctrl+wheel)
        if (e.ctrlKey) {
          e.preventDefault();
          return;
        }

        e.preventDefault();

        // Scroll = drag
        posX.current -= e.deltaX;
        posY.current -= e.deltaY;

        gsap.to(el, {
          x: posX.current,
          y: posY.current,
          duration: 0.15,
          ease: "power2.out",
          overwrite: "auto"
        });
      };

      window.addEventListener("wheel", wheelBlocker, { passive: false });
      document.addEventListener("wheel", wheelBlocker, { passive: false });
      el.addEventListener("wheel", wheelBlocker, { passive: false });

      // ZOOM BUTTONS
      const zoomStep = 0.2;

      const applyZoom = (newScale: number) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const targetX = (vw - canvasWidth * newScale) / 2;
        const targetY = (vh - canvasHeight * newScale) / 2;

        gsap.to(el, {
          scale: newScale,
          x: targetX,
          y: targetY,
          duration: 0.4,
          ease: "power3.out",
          onUpdate: () => {
            posX.current = gsap.getProperty(el, "x") as number;
            posY.current = gsap.getProperty(el, "y") as number;
          }
        });
      };

      const zoomInBtn = document.getElementById("zoom-in");
      const zoomOutBtn = document.getElementById("zoom-out");

      zoomInBtn?.addEventListener("click", () => {
        const currentScale = gsap.getProperty(el, "scale") as number;
        applyZoom(currentScale + zoomStep);
      });

      zoomOutBtn?.addEventListener("click", () => {
        const currentScale = gsap.getProperty(el, "scale") as number;
        applyZoom(Math.max(0.2, currentScale - zoomStep));
      });

      return () => {
        window.removeEventListener("wheel", wheelBlocker);
        document.removeEventListener("wheel", wheelBlocker);
        el.removeEventListener("wheel", wheelBlocker);
      };
    }, [itemsToRender, ref]);

    // Animate each container from its center to its final top-left
    useEffect(() => {
      if (!ready) return;

      itemData.current.forEach((data, idx) => {
        const el = document.querySelector(
          `.item[data-idx="${idx}"]`
        ) as HTMLElement | null;
        if (!el) return;

        const { size, top, left } = data;

        gsap.to(el, {
          width: size,
          height: size,
          top,
          left,
          duration: 0.5,
          ease: "power2.out",
        });
      });
    }, [ready]);

    return (
      <>
        <div
          className="canvas"
          ref={ref}
          style={{
            position: "absolute",
            width: canvasWidth,
            height: canvasHeight,
          }}
        >
          {ready &&
            itemsToRender.map((item, idx) => {
              const data = itemData.current[idx];
              if (!data) return null;

              const { size, top, left } = data;

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className="item"
                  data-idx={idx}
                  onClick={() => onItemClick(item)}
                  style={{
                    position: "absolute",
                    width: "0px",
                    height: "0px",
                    top: `${top + size / 2}px`,
                    left: `${left + size / 2}px`,
                    borderRadius: "50%",
                    cursor: "pointer",
                    overflow: "hidden",
                  }}
                >
                  <div
                    className="plate"
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      backgroundColor: `hsl(${Math.floor(
                        Math.random() * 360
                      )},70%,60%)`,
                    }}
                  ></div>
                </div>
              );
            })}
        </div>

        {/* ZOOM BUTTONS */}
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            zIndex: 9999,
          }}
        >
          <button
            id="zoom-in"
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              fontSize: "24px",
              cursor: "pointer",
            }}
          >
            +
          </button>

          <button
            id="zoom-out"
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              fontSize: "24px",
              cursor: "pointer",
            }}
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
