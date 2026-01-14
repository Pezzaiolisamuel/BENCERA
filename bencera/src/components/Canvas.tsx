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

    // Duplicate items to hit 100
    const extendedItems: any[] = [];
    while (extendedItems.length < totalItems) {
      extendedItems.push(...items);
    }
    const itemsToRender = extendedItems.slice(0, totalItems);

    const itemData = useRef<{ size: number; top: number; left: number }[]>(
      []
    );

    const renderedItems = useRef(new Set<number>());
    const [_, forceUpdate] = useState(0); // only for re-rendering visible items

useEffect(() => { 
    if (!ref || !("current" in ref) || !ref.current) return;
     const el = ref.current; 
     const rowCount = 10; 
     const ySpacing = canvasHeight / (rowCount + 1); 
    // 1. Pre-calculate spacing for Odd Rows (centered)
    const oddSpacing = canvasWidth / (itemsPerRow + 1); 

    // 2. Precompute positions
    itemData.current = itemsToRender.map((_, idx) => { 
        const row = Math.floor(idx / itemsPerRow);
        const col = idx % itemsPerRow;
        const size = Math.floor(Math.random() * 101) + 50;// 50–150px 
        

        let centerX: number;
        let centerY: number = ySpacing * (row + 1);
        
        if (row % 2 === 0) { 
            // ODD ROWS: Perfectly centered and equally spaced 
             
            centerX = oddSpacing * (col + 1); 
        } else { 
            // EVEN ROWS: // Start: Midpoint between 1st and 2nd point of odd rows 
            const xStart = (oddSpacing + (oddSpacing * 2)) / 2;
            // End: Very right edge 
             
            const xEnd = canvasWidth;
            const evenSpacing = (xEnd - xStart) / (itemsPerRow - 1);
            
            centerX = xStart + col * evenSpacing;
        }
        
        // Adjust for the div's top-left corner so the circle center is at (centerX, centerY) 
        const left = centerX - size / 2;
        const top = centerY - size / 2;
        
        return { size, left, top };
    });

      // Initial center
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let posX = -(canvasWidth - vw) / 2;
      let posY = -(canvasHeight - vh) / 2;
      gsap.set(el, { x: posX, y: posY });

      // Lazy render only items in viewport
      const checkVisibleItems = () => {
        let changed = false;
        itemData.current.forEach((item, idx) => {
          if (renderedItems.current.has(idx)) return;

          const cx = item.left + item.size / 2 + posX;
          const cy = item.top + item.size / 2 + posY;

          if (
            cx >= -100 &&
            cx <= vw + 100 &&
            cy >= -100 &&
            cy <= vh + 100
          ) {
            renderedItems.current.add(idx);
            changed = true;
          }
        });
        if (changed) forceUpdate((x) => x + 1);
      };
      checkVisibleItems();

      // Drag
      let isDown = false;
      let startX = 0;
      let startY = 0;

      const pointerDown = (e: any) => {
        isDown = true;
        const p = e.touches ? e.touches[0] : e;
        startX = p.clientX - posX;
        startY = p.clientY - posY;
      };

      const pointerMove = (e: any) => {
        if (!isDown) return;
        const p = e.touches ? e.touches[0] : e;
        posX = p.clientX - startX;
        posY = p.clientY - startY;
        gsap.set(el, { x: posX, y: posY });

        checkVisibleItems();
      };

      const pointerUp = () => (isDown = false);

      el.addEventListener("mousedown", pointerDown);
      el.addEventListener("mousemove", pointerMove);
      el.addEventListener("mouseup", pointerUp);
      el.addEventListener("mouseleave", pointerUp);
      el.addEventListener("touchstart", pointerDown);
      el.addEventListener("touchmove", pointerMove);
      el.addEventListener("touchend", pointerUp);
      el.addEventListener("touchcancel", pointerUp);

      return () => {
        el.removeEventListener("mousedown", pointerDown);
        el.removeEventListener("mousemove", pointerMove);
        el.removeEventListener("mouseup", pointerUp);
        el.removeEventListener("mouseleave", pointerUp);
        el.removeEventListener("touchstart", pointerDown);
        el.removeEventListener("touchmove", pointerMove);
        el.removeEventListener("touchend", pointerUp);
        el.removeEventListener("touchcancel", pointerUp);
      };
    }, [itemsToRender, ref]);

    return (
      <div
        className="canvas"
        ref={ref}
        style={{
          position: "absolute",
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        {itemsToRender.map((item, idx) => {
          if (!renderedItems.current.has(idx)) return null;
          const { size, top, left } = itemData.current[idx];
          return (
            <div
              key={`${item.id}-${idx}`}
              className="item"
              onClick={() => onItemClick(item)}
              style={{
                position: "absolute",
                width: `${size}px`,
                height: `${size}px`,
                top: `${top}px`,
                left: `${left}px`,
                borderRadius: "50%",
                cursor: "pointer",
                opacity: 1,
              }}
            >
              <div
                className="plate"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  backgroundColor: `hsl(${Math.floor(Math.random() * 360)},70%,60%)`,
                }}
              ></div>
            </div>
          );
        })}
      </div>
    );
  }
);

Canvas.displayName = "Canvas";
export default Canvas;
