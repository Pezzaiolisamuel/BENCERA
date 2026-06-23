import { useEffect, useRef } from "react";

type UseMobileViewportEffectsOptions = {
  isMapVariant: boolean;
  itemCount: number;
  itemVisibleClassName: string;
  visibleTileCount: number;
};

export function useMobileViewportEffects({
  isMapVariant,
  itemCount,
  itemVisibleClassName,
  visibleTileCount,
}: UseMobileViewportEffectsOptions) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "auto";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !itemCount) return;

    requestAnimationFrame(() => {
      const segmentHeight = container.scrollHeight / 5;
      container.scrollTop = segmentHeight * 2;

      if (isMapVariant) {
        container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
      }
    });

    const handleScroll = () => {
      const segmentHeight = container.scrollHeight / 5;
      if (!segmentHeight) return;

      if (container.scrollTop < segmentHeight * 0.75) {
        container.scrollTop += segmentHeight;
      } else if (container.scrollTop > segmentHeight * 3.25) {
        container.scrollTop -= segmentHeight;
      }

      // Horizontal map momentum remains native; changing scrollLeft during a swipe causes snapping.
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isMapVariant, itemCount, visibleTileCount]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const targets = Array.from(container.querySelectorAll<HTMLElement>("[data-mobile-item]"));
    if (!targets.length) return;

    for (const target of targets) {
      target.classList.remove(itemVisibleClassName);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).classList.add(itemVisibleClassName);
        }
      },
      {
        root: container,
        threshold: 0.2,
        rootMargin: "140px 0px",
      }
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [itemVisibleClassName, visibleTileCount]);

  return { scrollRef };
}
