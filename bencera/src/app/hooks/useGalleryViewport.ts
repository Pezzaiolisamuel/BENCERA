"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);


interface UseGalleryViewportProps {
  canvasRef: React.RefObject<HTMLDivElement>;
}

export function useGalleryViewport({ canvasRef }: UseGalleryViewportProps) {
  const pos = useRef({ x: 0, y: 0 });
  const vel = useRef({ x: 0, y: 0 });
  const isDown = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const currentScale = useRef(1);
  const maxScale = 3;
  const canvasWidth = 3000; // vw*10 approximation
  const canvasHeight = 2000;

  const friction = 0.92;
  const parallaxStrength = 0.15;

  function applyBounds() {
    if (!canvasRef.current) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const scaledWidth = canvasWidth * currentScale.current;
    const scaledHeight = canvasHeight * currentScale.current;

    const maxX = scaledWidth - vw;
    const maxY = scaledHeight - vh;

    pos.current.x = Math.min(Math.max(pos.current.x, 0), maxX);
    pos.current.y = Math.min(Math.max(pos.current.y, 0), maxY);
  }

  function applyParallax() {
    if (!canvasRef.current) return;
    canvasRef.current.querySelectorAll(".item").forEach((el: any) => {
      const depth = parseFloat(el.dataset.depth || "1");
      const px = -(pos.current.x * parallaxStrength * depth);
      const py = -(pos.current.y * parallaxStrength * depth);
      el.style.transform = `translate(${px}px, ${py}px)`;
    });
  }

  function pointerDown(e: any) {
    isDown.current = true;
    const p = e.touches ? e.touches[0] : e;
    start.current.x = p.clientX + pos.current.x;
    start.current.y = p.clientY + pos.current.y;
    vel.current.x = 0;
    vel.current.y = 0;
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
  }

  function pointerUp() {
    isDown.current = false;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
  }

  function pointerMove(e: any) {
    if (!isDown.current) return;
    const p = e.touches ? e.touches[0] : e;
    const newX = start.current.x - p.clientX;
    const newY = start.current.y - p.clientY;

    vel.current.x = newX - pos.current.x;
    vel.current.y = newY - pos.current.y;

    pos.current.x = newX;
    pos.current.y = newY;

    applyBounds();

    if (canvasRef.current) {
      gsap.to(canvasRef.current, {
        x: -pos.current.x,
        y: -pos.current.y,
        duration: 0.15,
        ease: "power2.out",
      });
    }

    applyParallax();
  }

  function animate() {
    if (!canvasRef.current) return;
    if (!isDown.current) {
      pos.current.x += vel.current.x;
      pos.current.y += vel.current.y;

      vel.current.x *= friction;
      vel.current.y *= friction;

      applyBounds();

      gsap.set(canvasRef.current, {
        x: -pos.current.x,
        y: -pos.current.y,
      });

      applyParallax();
    }
    requestAnimationFrame(animate);
  }

  function zoom(e: WheelEvent) {
    e.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const oldScale = currentScale.current;
    const minScale = Math.max(
      window.innerWidth / canvasWidth,
      window.innerHeight / canvasHeight,
      0.4
    );

    let newScale = currentScale.current - e.deltaY * 0.001;
    newScale = Math.min(Math.max(newScale, minScale), maxScale);

    const scaleFactor = newScale / oldScale;
    pos.current.x = cx + (pos.current.x - cx) * scaleFactor;
    pos.current.y = cy + (pos.current.y - cy) * scaleFactor;

    currentScale.current = newScale;

    applyBounds();

    gsap.to(canvasRef.current, {
      scale: currentScale.current,
      x: -pos.current.x,
      y: -pos.current.y,
      duration: 0.25,
      ease: "power2.out",
    });

    applyParallax();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.style.cursor = "grab";

    // Mouse events
    canvas.addEventListener("mousedown", pointerDown);
    canvas.addEventListener("mouseup", pointerUp);
    canvas.addEventListener("mouseleave", pointerUp);
    canvas.addEventListener("mousemove", pointerMove);

    // Touch events
    canvas.addEventListener("touchstart", pointerDown, { passive: false });
    canvas.addEventListener("touchend", pointerUp);
    canvas.addEventListener("touchcancel", pointerUp);
    canvas.addEventListener("touchmove", pointerMove, { passive: false });

    // Wheel zoom
    canvas.addEventListener("wheel", zoom, { passive: false });

    animate();

    return () => {
      canvas.removeEventListener("mousedown", pointerDown);
      canvas.removeEventListener("mouseup", pointerUp);
      canvas.removeEventListener("mouseleave", pointerUp);
      canvas.removeEventListener("mousemove", pointerMove);

      canvas.removeEventListener("touchstart", pointerDown as any);
      canvas.removeEventListener("touchend", pointerUp as any);
      canvas.removeEventListener("touchcancel", pointerUp as any);
      canvas.removeEventListener("touchmove", pointerMove as any);

      canvas.removeEventListener("wheel", zoom as any);
    };
  }, [canvasRef]);
}
