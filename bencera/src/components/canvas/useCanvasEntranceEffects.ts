import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { MutableRefObject, RefObject } from "react";
import type { Focus } from "./canvas-types";

type UseCanvasEntranceEffectsOptions = {
  applyFocusRef: RefObject<(() => void) | null>;
  focusRef: MutableRefObject<Focus>;
  getScaleForVisibleItems: (desired?: number) => number;
  itemsToRender: readonly unknown[];
  ready: boolean;
  userInteractedRef: MutableRefObject<boolean>;
};

export function useCanvasEntranceEffects({
  applyFocusRef,
  focusRef,
  getScaleForVisibleItems,
  itemsToRender,
  ready,
  userInteractedRef,
}: UseCanvasEntranceEffectsOptions) {
  const didIntroZoom = useRef(false);

  useEffect(() => {
    didIntroZoom.current = false;
  }, [itemsToRender]);

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
      if (targetScale <= focusRef.current.scale) return;

      const applyFocus = applyFocusRef.current;
      if (!applyFocus) return;

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const currentScale = focusRef.current.scale;
      const worldX = (centerX - focusRef.current.x) / currentScale;
      const worldY = (centerY - focusRef.current.y) / currentScale;
      const nextScale = targetScale;

      gsap.killTweensOf(focusRef.current);
      gsap.to(focusRef.current, {
        scale: nextScale,
        x: centerX - worldX * nextScale,
        y: centerY - worldY * nextScale,
        duration: 1.7,
        ease: "power3.out",
        onUpdate: applyFocus,
      });
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

    for (const element of targets) {
      element.classList.remove("is-visible");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          element.classList.add("is-visible");
          observer.unobserve(element);
        }
      },
      { root: null, threshold: 0.12, rootMargin: "120px" }
    );

    targets.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [ready, itemsToRender]);
}
