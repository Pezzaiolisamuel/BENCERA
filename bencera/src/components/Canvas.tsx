"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

interface CanvasProps {
    items: any[];
    onItemClick: (item: any) => void;
}

type Focus = { x: number; y: number; scale: number };

// ✅ store CENTER coords instead of top/left
type ItemLayout = { size: number; cx: number; cy: number };

const Canvas = React.forwardRef<HTMLDivElement, CanvasProps>(
    ({ items, onItemClick }, ref) => {
        const totalItems = 150;
        const itemsPerRow = 15;
        const canvasWidth = 3000;
        const canvasHeight = 2000;

        // ✅ stable per page load (so re-renders don't change the order)
        const seedRef = useRef<number>(Math.random() * 1e9);

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
        }, [items, totalItems]);

        // ✅ CENTER-BASED LAYOUT
        const itemData = useRef<ItemLayout[]>([]);
        const [ready, setReady] = useState(false);

        // ✅ ONE variable for position + scale
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

        /**
         * 1) Layout (CENTER coords)
         */
        useEffect(() => {
            if (!ref || !("current" in ref) || !ref.current) return;

            const rowCount = Math.ceil(totalItems / itemsPerRow);

            // ----- size range -----
            const MIN_SIZE = 250;
            const MAX_SIZE = 350;

            // 1) pick sizes first (stable for this layout run)
            const sizes: number[] = new Array(totalItems).fill(0).map(() => {
                return MIN_SIZE + Math.floor(Math.random() * (MAX_SIZE - MIN_SIZE));
            });

            // 2) compute max size per row (so row spacing adapts)
            const rowMax: number[] = new Array(rowCount).fill(0);

            for (let i = 0; i < totalItems; i++) {
                const row = Math.floor(i / itemsPerRow);
                rowMax[row] = Math.max(rowMax[row], sizes[i]);
            }

            // 3) build cumulative Y centers with row-dependent padding
            //    (bigger rows get more vertical breathing room)
            const marginY = 50;            // outer top/bottom padding
            const baseGapY = 30;           // base gap between rows
            const extraY = 0.15;           // how much size influences spacing

            const rowCentersY: number[] = new Array(rowCount).fill(0);
            let yCursor = marginY;

            for (let r = 0; r < rowCount; r++) {
                const rowHeight = rowMax[r] + baseGapY + rowMax[r] * extraY;
                // center is at cursor + half rowHeight
                rowCentersY[r] = yCursor + rowHeight / 2;
                yCursor += rowHeight;
            }

            // scale Y to fit canvas height (while preserving relative spacing)
            const usedH = yCursor + marginY;
            const yScale = canvasHeight / usedH;

            // 4) for each row, compute X centers with padding based on that row max
            const marginX = 50;          // outer left/right padding
            const baseGapX = 30;          // base gap between columns
            const extraX = 0.25;          // how much size influences spacing

            itemData.current = itemsToRender.map((_, idx) => {
                const row = Math.floor(idx / itemsPerRow);
                const col = idx % itemsPerRow;

                const size = sizes[idx];

                // row max determines spacing for the whole row (consistent rhythm)
                const rowBig = rowMax[row];

                // available width after margins
                const usableW = canvasWidth - marginX * 2;

                // total "cell step" includes size-aware breathing room
                const step = rowBig + baseGapX + rowBig * extraX;

                // compute how many steps fit; then center the sequence in usableW
                const rowWidth = step * (itemsPerRow - 1);
                const startX = marginX + (usableW - rowWidth) / 2;

                // stagger even rows slightly
                const stagger = row % 2 === 0 ? 0 : step * 0.5;

                const cx = startX + col * step + stagger;

                // y from precomputed row center, scaled to fit canvas
                const cy = rowCentersY[row] * yScale;

                return { size, cx, cy };
            });

            didIntroZoom.current = false;
            setReady(true);
        }, [itemsToRender, ref]);

        /**
         * 2) Fit canvas to viewport (cover) and start CENTERED in the viewport
         */
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

        /**
         * 3) Load-in
         * ✅ IMPORTANT: lock center using xPercent/yPercent, then animate scale to 0.8
         */
        useEffect(() => {
            if (!ready) return;

            const nodes = Array.from(document.querySelectorAll<HTMLElement>(".item"));
            if (!nodes.length) return;

            // ✅ ensure every item is centered on its left/top point (cx/cy)
            gsap.set(nodes, { xPercent: -50, yPercent: -50, transformOrigin: "50% 50%" });

            gsap.killTweensOf(nodes);
            gsap.fromTo(
                nodes,
                { opacity: 0, scale: 0 },
                {
                    opacity: 1,
                    scale: 0.8, // ✅ your target visual scale
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

        /**
         * 4) Drag + inertia + wrap (single transform writer)
         */
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
                    duration: 0.65,          // 👈 THIS controls drag smoothness
                    ease: "power3.out",
                    onUpdate: applyFocus,
                });

            };

            const onPointerUp = (e: PointerEvent) => {
                if (!drag.current.active || e.pointerId !== drag.current.pointerId) return;

                drag.current.active = false;

                // stop any in-flight tweens from the smoothing drag move
                gsap.killTweensOf(focus.current);

                // click: no inertia
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

                // start inertia with a tiny delay (no delayedCall needed)
                gsap.to(focus.current, {
                    x: inertiaX,
                    y: inertiaY,
                    duration: 0.9,
                    delay: 3,          // 👈 your "lag" before inertia kicks in
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

        // 4.5) scroll verticalliy to explore
        useEffect(() => {
            if (!ready) return;

            const SCROLL_SPEED = 1;        // 0.5 = slower, 1 = normal, 2 = fast
            const SMOOTH_DURATION = 0.6;   // smoothness of scroll movement

            const onWheel = (e: WheelEvent) => {
                // prevent page scrolling
                e.preventDefault();

                userInteracted.current = true;

                // stop any running tweens (drag / inertia / zoom)
                gsap.killTweensOf(focus.current);

                const dx = e.shiftKey ? -e.deltaY : -e.deltaX;
                const dy = -e.deltaY;

                // update target position
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

            return () => {
                window.removeEventListener("wheel", onWheel as any);
            };
        }, [ready]);



        /**
         * 5) HARD BLOCK browser zoom + scroll gestures (wheel, pinch, keyboard)
         */
        useEffect(() => {
            const blockWheel = (e: WheelEvent) => e.preventDefault();

            const blockKeyZoom = (e: KeyboardEvent) => {
                const isMac = navigator.platform.toLowerCase().includes("mac");
                const mod = isMac ? e.metaKey : e.ctrlKey;
                if (!mod) return;

                if (e.key === "+" || e.key === "=" || e.key === "-" || e.key === "0") {
                    e.preventDefault();
                }
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

        // 6) magnetic mouse effect
        useEffect(() => {
            if (!ready) return;

            const RADIUS = 400;

            const inners = Array.from(
                document.querySelectorAll<HTMLElement>(".itemInner")
            );

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


        // 7) lazyload effect
        useEffect(() => {
            if (!ready) return;

            const targets = Array.from(
                document.querySelectorAll<HTMLElement>(".itemReveal")
            );

            if (!targets.length) return;

            // start hidden (in case CSS loads late)
            for (const el of targets) el.classList.remove("is-visible");

            const io = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        if (!entry.isIntersecting) continue;

                        const el = entry.target as HTMLElement;

                        // reveal once
                        el.classList.add("is-visible");
                        io.unobserve(el);
                    }
                },
                {
                    root: null,          // viewport
                    threshold: 0.12,     // reveal when ~12% visible
                    rootMargin: "120px", // reveal a bit BEFORE it enters view
                }
            );

            targets.forEach((el) => io.observe(el));

            return () => io.disconnect();
        }, [ready, itemsToRender]);

        /**
         * Center-anchored zoom helper (keeps focus at screen center)
         */
        function zoomTo(nextScale: number) {
            const applyFocus = applyFocusRef.current;
            if (!applyFocus) return;

            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;

            const s1 = focus.current.scale;
            const s2 = nextScale;

            const wx = (cx - focus.current.x) / s1;
            const wy = (cy - focus.current.y) / s1;

            const target = {
                scale: s2,
                x: cx - wx * s2,
                y: cy - wy * s2,
            };

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
                        cursor: drag.current.active ? "grabbing" : "grab"

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
                                        cursor: drag.current.active ? "grabbing" : "grab",
                                        overflow: "visible", // ✅ allow inner to scale without clipping
                                        left: data.cx,       // ✅ POSITION BY CENTER
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
                                            ) : null}
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

    }
);

Canvas.displayName = "Canvas";
export default Canvas;
