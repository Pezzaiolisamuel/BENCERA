"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

interface CanvasProps {
  items: any[];
  onItemClick: (item: any) => void;
}

type Focus = { x: number; y: number; scale: number };
type ItemLayout = { size: number; cx: number; cy: number };

const Canvas = React.forwardRef<HTMLDivElement, CanvasProps>(({ items, onItemClick }, ref) => {
  const totalItems = 150;
  const itemsPerRow = 15;
  const canvasWidth = 3000;
  const canvasHeight = 2000;

  const seedRef = useRef<number>(Math.random() * 1e9);

  // ---- helpers ----
  const safeJsonArray = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter((x) => typeof x === "string");
    if (typeof val !== "string") return [];
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  };

  // Pick a thumbnail URL from the first available group
  const getThumb = (item: any): string => {
    // Preferred shape (what your server page builds)
    const imgObj = item?.images;
    const candidates =
      (imgObj?.above?.[0] && [imgObj.above[0]]) ||
      (imgObj?.detailed?.[0] && [imgObj.detailed[0]]) ||
      (imgObj?.background?.[0] && [imgObj.background[0]]) ||
      (imgObj?.howToUse?.[0] && [imgObj.howToUse[0]]) ||
      [];

    if (candidates.length) return candidates[0];

    // Fallback for any legacy/raw DB shape
    const above = safeJsonArray(item?.imagesAbove);
    const detailed = safeJsonArray(item?.imagesDetailed);
    const background = safeJsonArray(item?.imagesBackground);
    const howToUse = safeJsonArray(item?.imagesHowToUse);

    return (
      above[0] ||
      detailed[0] ||
      background[0] ||
      howToUse[0] ||
      ""
    );
  };

  const itemsToRender = useMemo(() => {
    const mulberry32 = (a: number) => {
      return () => {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };

    const rng = mulberry32(seedRef.current);

    const shuffle = <T,>(arr: T[]) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const extended: any[] = [];
    if (!items?.length) return extended;

    while (extended.length < totalItems) {
      extended.push(...shuffle(items));
    }

    return extended.slice(0, totalItems);
  }, [items]);

  const itemData = useRef<ItemLayout[]>([]);
  const [ready, setReady] = useState(false);

  const focus = useRef<Focus>({ x: 0, y: 0, scale: 1 });
  const focusTarget = useRef<Focus>({ x: 0, y: 0, scale: 1 });

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

  const applyFocusRef = useRef<(() => void) | null>(null);

  const didIntroZoom = useRef(false);
  const userInteracted = useRef(false);

  const getMinScale = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return Math.max(vw / canvasWidth, vh / canvasHeight);
  };

  const computeScaleForVisibleItems = (desired = 11) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const sizes = itemData.current.map((d) => d?.size).filter(Boolean) as number[];
    const avg = sizes.length ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 200;

    const s = Math.sqrt((vw * vh) / (desired * avg * avg));
    return Math.min(4, Math.max(getMinScale(), s));
  };

  // 1) Layout
  useEffect(() => {
    if (!ref || !("current" in ref) || !ref.current) return;

    const rowCount = Math.ceil(totalItems / itemsPerRow);

    const MIN_SIZE = 250;
    const MAX_SIZE = 350;

    const sizes: number[] = new Array(totalItems).fill(0).map(() => {
      return MIN_SIZE + Math.floor(Math.random() * (MAX_SIZE - MIN_SIZE));
    });

    const rowMax: number[] = new Array(rowCount).fill(0);

    for (let i = 0; i < totalItems; i++) {
      const row = Math.floor(i / itemsPerRow);
      rowMax[row] = Math.max(rowMax[row], sizes[i]);
    }

    const marginY = 50;
    const baseGapY = 30;
    const extraY = 0.15;

    const rowCentersY: number[] = new Array(rowCount).fill(0);
    let yCursor = marginY;

    for (let r = 0; r < rowCount; r++) {
      const rowHeight = rowMax[r] + baseGapY + rowMax[r] * extraY;
      rowCentersY[r] = yCursor + rowHeight / 2;
      yCursor += rowHeight;
    }

    const usedH = yCursor + marginY;
    const yScale = canvasHeight / usedH;

    const marginX = 50;
    const baseGapX = 30;
    const extraX = 0.25;

    itemData.current = itemsToRender.map((_, idx) => {
      const row = Math.floor(idx / itemsPerRow);
      const col = idx % itemsPerRow;

      const size = sizes[idx];

      const rowBig = rowMax[row];

      const usableW = canvasWidth - marginX * 2;

      const step = rowBig + baseGapX + rowBig * extraX;

      const rowWidth = step * (itemsPerRow - 1);
      const startX = marginX + (usableW - rowWidth) / 2;

      const stagger = row % 2 === 0 ? 0 : step * 0.5;

      const cx = startX + col * step + stagger;
      const cy = rowCentersY[row] * yScale;

      return { size, cx, cy };
    });

    didIntroZoom.current = false;
    setReady(true);
  }, [itemsToRender, ref]);

  // 2) Fit
  useLayoutEffect(() => {
    if (!ready) return;
    if (!ref || !("current" in ref) || !ref.current) return;

    const el = ref.current;

    const applyFit = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const scale = Math.max(vw / canvasWidth, vh / canvasHeight);

      const cx = vw / 2;
      const cy = vh / 2;

      const wx = canvasWidth / 2;
      const wy = canvasHeight / 2;

      const x = cx - wx * scale;
      const y = cy - wy * scale;

      focus.current = { x, y, scale };
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    };

    applyFit();
    window.addEventListener("resize", applyFit);
    return () => window.removeEventListener("resize", applyFit);
  }, [ready, ref]);

  // 3) Load-in
  useEffect(() => {
    if (!ready) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".item"));
    if (!nodes.length) return;

    gsap.set(nodes, { xPercent: -50, yPercent: -50, transformOrigin: "50% 50%" });

    gsap.killTweensOf(nodes);
    gsap.fromTo(
      nodes,
      { opacity: 0, scale: 0 },
      {
        opacity: 1,
        scale: 0.8,
        duration: 0.45,
        stagger: { each: 0.01, from: "random" },
        ease: "back.out(1.6)",
        onComplete: () => {
          if (didIntroZoom.current) return;
          if (userInteracted.current) return;

          didIntroZoom.current = true;

          const targetScale = computeScaleForVisibleItems(11);

          if (targetScale > focus.current.scale) {
            const applyFocus = applyFocusRef.current;
            if (!applyFocus) return;

            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;

            const s1 = focus.current.scale;
            const s2 = targetScale;

            const wx = (cx - focus.current.x) / s1;
            const wy = (cy - focus.current.y) / s1;

            const target = { scale: s2, x: cx - wx * s2, y: cy - wy * s2 };

            gsap.killTweensOf(focus.current);
            gsap.to(focus.current, {
              scale: target.scale,
              x: target.x,
              y: target.y,
              duration: 1.4,
              ease: "power3.out",
              onUpdate: applyFocus,
            });
          }
        },
      }
    );
  }, [ready]);

  // 4) Drag + inertia + wrap
  useEffect(() => {
    if (!ready) return;
    if (!ref || !("current" in ref) || !ref.current) return;

    const el = ref.current;

    const wrapFocus = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const scaledW = canvasWidth * focus.current.scale;
      const scaledH = canvasHeight * focus.current.scale;

      const minX = -scaledW - vw;
      const maxX = vw;
      while (focus.current.x < minX) focus.current.x += scaledW;
      while (focus.current.x > maxX) focus.current.x -= scaledW;

      const minY = -scaledH - vh;
      const maxY = vh;
      while (focus.current.y < minY) focus.current.y += scaledH;
      while (focus.current.y > maxY) focus.current.y -= scaledH;
    };

    const clampFocusToBounds = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const scaledW = canvasWidth * focus.current.scale;
      const scaledH = canvasHeight * focus.current.scale;

      if (scaledW > vw) {
        focus.current.x = Math.min(0, Math.max(vw - scaledW, focus.current.x));
      } else {
        focus.current.x = (vw - scaledW) / 2;
      }

      if (scaledH > vh) {
        focus.current.y = Math.min(0, Math.max(vh - scaledH, focus.current.y));
      } else {
        focus.current.y = (vh - scaledH) / 2;
      }
    };

    const applyFocus = () => {
      wrapFocus();
      clampFocusToBounds();
      const { x, y, scale } = focus.current;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    };

    applyFocusRef.current = applyFocus;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== undefined && e.button !== 0) return;

      userInteracted.current = true;

      focusTarget.current.x = focus.current.x;
      focusTarget.current.y = focus.current.y;

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
      gsap.killTweensOf(focus.current);
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

      focusTarget.current.x += dx;
      focusTarget.current.y += dy;

      gsap.killTweensOf(focus.current);

      gsap.to(focus.current, {
        x: focusTarget.current.x,
        y: focusTarget.current.y,
        duration: 0.65,
        ease: "power3.out",
        onUpdate: applyFocus,
      });
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!drag.current.active || e.pointerId !== drag.current.pointerId) return;

      drag.current.active = false;
      gsap.killTweensOf(focus.current);

      if (!drag.current.moved) {
        drag.current.pointerId = -1;
        return;
      }

      const speed = Math.hypot(drag.current.vx, drag.current.vy);
      if (speed < 0.1) {
        drag.current.pointerId = -1;
        return;
      }

      const inertiaX = focus.current.x + drag.current.vx * 18;
      const inertiaY = focus.current.y + drag.current.vy * 18;

      gsap.to(focus.current, {
        x: inertiaX,
        y: inertiaY,
        duration: 0.9,
        delay: 3,
        ease: "power3.out",
        onUpdate: applyFocus,
      });

      drag.current.pointerId = -1;
    };

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
      applyFocusRef.current = null;
    };
  }, [ready, ref]);

  // 4.5) scroll
  useEffect(() => {
    if (!ready) return;

    const SCROLL_SPEED = 1;
    const SMOOTH_DURATION = 0.6;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      userInteracted.current = true;

      gsap.killTweensOf(focus.current);

      const dx = e.shiftKey ? -e.deltaY : -e.deltaX;
      const dy = -e.deltaY;

      focus.current.x += dx * SCROLL_SPEED;
      focus.current.y += dy * SCROLL_SPEED;

      gsap.to(focus.current, {
        x: focus.current.x,
        y: focus.current.y,
        duration: SMOOTH_DURATION,
        ease: "power3.out",
        onUpdate: applyFocusRef.current!,
      });
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel as any);
  }, [ready]);

  // 5) block zoom
  useEffect(() => {
    const blockWheel = (e: WheelEvent) => e.preventDefault();

    const blockKeyZoom = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;
      if (e.key === "+" || e.key === "=" || e.key === "-" || e.key === "0") e.preventDefault();
    };

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

  // 6) magnetic
  useEffect(() => {
    if (!ready) return;

    const RADIUS = 400;

    const inners = Array.from(document.querySelectorAll<HTMLElement>(".itemInner"));

    let mx = 0;
    let my = 0;
    let raf = 0;

    const tick = () => {
      raf = 0;

      const s = focus.current.scale;
      const wx = (mx - focus.current.x) / s;
      const wy = (my - focus.current.y) / s;
      const r = RADIUS / s;

      for (let i = 0; i < inners.length; i++) {
        const d = itemData.current[i];
        if (!d) continue;

        const dist = Math.hypot(wx - d.cx, wy - d.cy);
        inners[i].classList.toggle("is-near", dist < r);
      }
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove as any);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ready]);

  // 7) lazyload
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

  function zoomTo(nextScale: number) {
    const applyFocus = applyFocusRef.current;
    if (!applyFocus) return;

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    const s1 = focus.current.scale;
    const s2 = nextScale;

    const wx = (cx - focus.current.x) / s1;
    const wy = (cy - focus.current.y) / s1;

    const target = { scale: s2, x: cx - wx * s2, y: cy - wy * s2 };

    gsap.killTweensOf(focus.current);

    gsap.to(focus.current, {
      scale: target.scale,
      x: target.x,
      y: target.y,
      duration: 0.85,
      ease: "power3.out",
      onUpdate: applyFocus,
    });
  }

  const onZoomIn = () => {
    userInteracted.current = true;
    zoomTo(Math.min(focus.current.scale * 1.12, 4));
  };

  const onZoomOut = () => {
    userInteracted.current = true;
    zoomTo(Math.max(focus.current.scale / 1.12, getMinScale()));
  };

  return (
    <>
      <div
        className="canvas"
        ref={ref}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: canvasWidth,
          height: canvasHeight,
          transformOrigin: "top left",
          cursor: drag.current.active ? "grabbing" : "grab",
        }}
      >
        {ready &&
          itemsToRender.map((item, idx) => {
            const data = itemData.current[idx];
            if (!data) return null;

            const img = getThumb(item); // ✅ FIXED: use fallback logic

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
                  cursor: drag.current.active ? "grabbing" : "grab",
                  overflow: "visible",
                  left: data.cx,
                  top: data.cy,
                  width: data.size,
                  height: data.size,
                }}
              >
                <div className="itemReveal">
                  <div className="itemInner">
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
                    ) : (
                      // Optional: show a placeholder so you can SEE the tile exists
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "1px solid rgba(255,255,255,0.15)",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

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
});

Canvas.displayName = "Canvas";
export default Canvas;
