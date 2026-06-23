import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ForwardedRef, RefObject } from "react";
import gsap from "gsap";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./canvas-config";
import type { CanvasDragState, Focus, ItemLayout } from "./canvas-types";
import {
  calculateCanvasZoomLevels,
  calculateMinimumCanvasScale,
  calculateScaleForVisibleItems,
  findNearestZoomStepIndex,
} from "./canvas-zoom";

type UseCanvasViewportOptions = {
  canvasRef: ForwardedRef<HTMLDivElement>;
  itemLayoutsRef: RefObject<ItemLayout[]>;
  ready: boolean;
};

export function useCanvasViewport({
  canvasRef,
  itemLayoutsRef,
  ready,
}: UseCanvasViewportOptions) {
  // Mutable refs let GSAP and native events share animation state without rerendering each frame.
  const focusRef = useRef<Focus>({ x: 0, y: 0, scale: 1 });
  const focusTargetRef = useRef<Focus>({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<CanvasDragState>({
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
  const userInteractedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const getScaleForVisibleItems = useCallback(
    (desired = 11) => {
      return calculateScaleForVisibleItems(
        itemLayoutsRef.current,
        window.innerWidth,
        window.innerHeight,
        desired
      );
    },
    [itemLayoutsRef]
  );

  const getZoomLevels = useCallback(() => {
    return calculateCanvasZoomLevels(
      itemLayoutsRef.current,
      window.innerWidth,
      window.innerHeight
    );
  }, [itemLayoutsRef]);

  const getNearestZoomStepIndex = useCallback(
    (scale: number) => {
      return findNearestZoomStepIndex(scale, getZoomLevels());
    },
    [getZoomLevels]
  );

  useLayoutEffect(() => {
    if (!ready) return;
    if (!canvasRef || !("current" in canvasRef) || !canvasRef.current) return;

    const element = canvasRef.current;

    const applyFit = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scale = calculateMinimumCanvasScale(viewportWidth, viewportHeight);
      const viewportCenterX = viewportWidth / 2;
      const viewportCenterY = viewportHeight / 2;
      const canvasCenterX = CANVAS_WIDTH / 2;
      const canvasCenterY = CANVAS_HEIGHT / 2;
      const x = viewportCenterX - canvasCenterX * scale;
      const y = viewportCenterY - canvasCenterY * scale;

      focusRef.current = { x, y, scale };
      element.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    };

    applyFit();
    window.addEventListener("resize", applyFit);
    return () => window.removeEventListener("resize", applyFit);
  }, [ready, canvasRef]);

  useEffect(() => {
    if (!ready) return;
    if (!canvasRef || !("current" in canvasRef) || !canvasRef.current) return;

    const element = canvasRef.current;

    const wrapFocus = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scaledWidth = CANVAS_WIDTH * focusRef.current.scale;
      const scaledHeight = CANVAS_HEIGHT * focusRef.current.scale;
      const minimumX = -scaledWidth - viewportWidth;
      const maximumX = viewportWidth;

      while (focusRef.current.x < minimumX) focusRef.current.x += scaledWidth;
      while (focusRef.current.x > maximumX) focusRef.current.x -= scaledWidth;

      const minimumY = -scaledHeight - viewportHeight;
      const maximumY = viewportHeight;
      while (focusRef.current.y < minimumY) focusRef.current.y += scaledHeight;
      while (focusRef.current.y > maximumY) focusRef.current.y -= scaledHeight;
    };

    const clampFocusToBounds = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scaledWidth = CANVAS_WIDTH * focusRef.current.scale;
      const scaledHeight = CANVAS_HEIGHT * focusRef.current.scale;

      if (scaledWidth > viewportWidth) {
        focusRef.current.x = Math.min(
          0,
          Math.max(viewportWidth - scaledWidth, focusRef.current.x)
        );
      } else {
        focusRef.current.x = (viewportWidth - scaledWidth) / 2;
      }

      if (scaledHeight > viewportHeight) {
        focusRef.current.y = Math.min(
          0,
          Math.max(viewportHeight - scaledHeight, focusRef.current.y)
        );
      } else {
        focusRef.current.y = (viewportHeight - scaledHeight) / 2;
      }
    };

    const applyFocus = () => {
      wrapFocus();
      clampFocusToBounds();
      const { x, y, scale } = focusRef.current;
      element.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    };

    applyFocusRef.current = applyFocus;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== undefined && event.button !== 0) return;

      userInteractedRef.current = true;
      focusTargetRef.current.x = focusRef.current.x;
      focusTargetRef.current.y = focusRef.current.y;
      dragRef.current.active = true;
      setIsDragging(true);
      dragRef.current.pointerId = event.pointerId;
      dragRef.current.startX = event.clientX;
      dragRef.current.startY = event.clientY;
      dragRef.current.lastX = event.clientX;
      dragRef.current.lastY = event.clientY;
      dragRef.current.vx = 0;
      dragRef.current.vy = 0;
      dragRef.current.moved = false;

      (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
      gsap.killTweensOf(focusRef.current);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragRef.current.active || event.pointerId !== dragRef.current.pointerId) return;

      const deltaX = event.clientX - dragRef.current.lastX;
      const deltaY = event.clientY - dragRef.current.lastY;
      const totalDeltaX = event.clientX - dragRef.current.startX;
      const totalDeltaY = event.clientY - dragRef.current.startY;

      if (
        !dragRef.current.moved &&
        (Math.abs(totalDeltaX) > 6 || Math.abs(totalDeltaY) > 6)
      ) {
        dragRef.current.moved = true;
      }

      dragRef.current.lastX = event.clientX;
      dragRef.current.lastY = event.clientY;
      dragRef.current.vx = dragRef.current.vx * 0.8 + deltaX * 0.2;
      dragRef.current.vy = dragRef.current.vy * 0.8 + deltaY * 0.2;
      focusTargetRef.current.x += deltaX;
      focusTargetRef.current.y += deltaY;

      gsap.killTweensOf(focusRef.current);
      gsap.to(focusRef.current, {
        x: focusTargetRef.current.x,
        y: focusTargetRef.current.y,
        duration: 0.65,
        ease: "power3.out",
        onUpdate: applyFocus,
      });
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragRef.current.active || event.pointerId !== dragRef.current.pointerId) return;

      dragRef.current.active = false;
      setIsDragging(false);
      gsap.killTweensOf(focusRef.current);

      if (!dragRef.current.moved) {
        dragRef.current.pointerId = -1;
        return;
      }

      const speed = Math.hypot(dragRef.current.vx, dragRef.current.vy);
      if (speed < 0.1) {
        dragRef.current.pointerId = -1;
        return;
      }

      const inertiaX = focusRef.current.x + dragRef.current.vx * 18;
      const inertiaY = focusRef.current.y + dragRef.current.vy * 18;

      gsap.to(focusRef.current, {
        x: inertiaX,
        y: inertiaY,
        duration: 0.9,
        delay: 3,
        ease: "power3.out",
        onUpdate: applyFocus,
      });

      dragRef.current.pointerId = -1;
    };

    element.style.touchAction = "none";
    element.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      applyFocusRef.current = null;
    };
  }, [ready, canvasRef]);

  useEffect(() => {
    if (!ready) return;

    const SMOOTH_DURATION = 1.55;

    const normalizeWheelDelta = (delta: number, deltaMode: number) => {
      if (deltaMode === 1) return delta * 16;
      if (deltaMode === 2) return delta * window.innerHeight;
      return delta;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      userInteractedRef.current = true;

      const normalizedDeltaY = normalizeWheelDelta(event.deltaY, event.deltaMode);
      const levels = getZoomLevels();
      const currentIndex = getNearestZoomStepIndex(focusRef.current.scale);
      const nextIndex =
        normalizedDeltaY > 0
          ? Math.max(currentIndex - 1, 0)
          : Math.min(currentIndex + 1, levels.length - 1);
      const nextScale = levels[nextIndex];

      if (Math.abs(nextScale - focusRef.current.scale) < 0.0001) return;

      const cursorX = event.clientX;
      const cursorY = event.clientY;
      const worldX = (cursorX - focusRef.current.x) / focusRef.current.scale;
      const worldY = (cursorY - focusRef.current.y) / focusRef.current.scale;

      focusTargetRef.current.scale = nextScale;
      focusTargetRef.current.x = cursorX - worldX * nextScale;
      focusTargetRef.current.y = cursorY - worldY * nextScale;

      gsap.to(focusRef.current, {
        scale: focusTargetRef.current.scale,
        x: focusTargetRef.current.x,
        y: focusTargetRef.current.y,
        duration: SMOOTH_DURATION,
        ease: "expo.out",
        onUpdate: applyFocusRef.current!,
        overwrite: true,
      });
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [ready, getNearestZoomStepIndex, getZoomLevels]);

  useEffect(() => {
    const blockWheel = (event: WheelEvent) => event.preventDefault();

    const blockKeyZoom = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const modifierPressed = isMac ? event.metaKey : event.ctrlKey;
      if (!modifierPressed) return;
      if (
        event.key === "+" ||
        event.key === "=" ||
        event.key === "-" ||
        event.key === "0"
      ) {
        event.preventDefault();
      }
    };

    const blockGesture = (event: Event) => event.preventDefault();

    window.addEventListener("wheel", blockWheel, { passive: false, capture: true });
    document.addEventListener("wheel", blockWheel, { passive: false, capture: true });
    window.addEventListener("keydown", blockKeyZoom, { capture: true });
    document.addEventListener("gesturestart", blockGesture, { passive: false });
    document.addEventListener("gesturechange", blockGesture, { passive: false });
    document.addEventListener("gestureend", blockGesture, { passive: false });

    return () => {
      window.removeEventListener("wheel", blockWheel, true);
      document.removeEventListener("wheel", blockWheel, true);
      window.removeEventListener("keydown", blockKeyZoom, true);
      document.removeEventListener("gesturestart", blockGesture);
      document.removeEventListener("gesturechange", blockGesture);
      document.removeEventListener("gestureend", blockGesture);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    const RADIUS = 400;
    const innerElements = Array.from(
      document.querySelectorAll<HTMLElement>(".itemInner")
    );
    let pointerX = 0;
    let pointerY = 0;
    let animationFrame = 0;

    const updateMagneticState = () => {
      animationFrame = 0;
      const scale = focusRef.current.scale;
      const worldX = (pointerX - focusRef.current.x) / scale;
      const worldY = (pointerY - focusRef.current.y) / scale;
      const radius = RADIUS / scale;

      for (let index = 0; index < innerElements.length; index += 1) {
        const layout = itemLayoutsRef.current[index];
        if (!layout) continue;

        const distance = Math.hypot(worldX - layout.cx, worldY - layout.cy);
        innerElements[index].classList.toggle("is-near", distance < radius);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!animationFrame) animationFrame = requestAnimationFrame(updateMagneticState);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [ready, itemLayoutsRef]);

  const zoomTo = (nextScale: number) => {
    const applyFocus = applyFocusRef.current;
    if (!applyFocus) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const currentScale = focusRef.current.scale;
    const worldX = (centerX - focusRef.current.x) / currentScale;
    const worldY = (centerY - focusRef.current.y) / currentScale;
    const target = {
      scale: nextScale,
      x: centerX - worldX * nextScale,
      y: centerY - worldY * nextScale,
    };

    gsap.killTweensOf(focusRef.current);
    gsap.to(focusRef.current, {
      scale: target.scale,
      x: target.x,
      y: target.y,
      duration: 0.85,
      ease: "power3.out",
      onUpdate: applyFocus,
    });
  };

  const zoomIn = () => {
    userInteractedRef.current = true;
    const levels = getZoomLevels();
    const currentIndex = getNearestZoomStepIndex(focusRef.current.scale);
    const nextIndex = Math.min(currentIndex + 1, levels.length - 1);
    zoomTo(levels[nextIndex]);
  };

  const zoomOut = () => {
    userInteractedRef.current = true;
    const levels = getZoomLevels();
    const currentIndex = getNearestZoomStepIndex(focusRef.current.scale);
    const nextIndex = Math.max(currentIndex - 1, 0);
    zoomTo(levels[nextIndex]);
  };

  return {
    applyFocusRef,
    dragRef,
    focusRef,
    getScaleForVisibleItems,
    isDragging,
    userInteractedRef,
    zoomIn,
    zoomOut,
  };
}
