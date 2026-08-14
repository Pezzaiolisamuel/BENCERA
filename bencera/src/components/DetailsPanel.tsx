"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import type { Item } from "@/types/item";
import styles from "./DetailsPanel.module.css";
import DetailsPanelBackdrop from "./details-panel/DetailsPanelBackdrop";
import DetailsPanelContent from "./details-panel/DetailsPanelContent";
import DetailsPanelPreview from "./details-panel/DetailsPanelPreview";

type DetailsPanelProps = {
  item: Item | null;
  onClose: () => void;
};

type DetailIndexState = {
  itemId: string;
  index: number;
};

type CarouselControlState = {
  itemId: string;
  hasUserControlled: boolean;
};

export default function DetailsPanel({ item, onClose }: DetailsPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const aboveImageRef = useRef<HTMLImageElement | null>(null);
  const wheelCooldownRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const [detailIndexState, setDetailIndexState] = useState<DetailIndexState>({
    itemId: "",
    index: 0,
  });
  const [isClosing, setIsClosing] = useState(false);
  const [carouselControlState, setCarouselControlState] = useState<CarouselControlState>({
    itemId: "",
    hasUserControlled: false,
  });

  const detailedImages = useMemo(() => {
    const images = item?.images?.detailed;
    return Array.isArray(images) ? images.filter((src): src is string => !!src) : [];
  }, [item]);

  const detailIndex = item && detailIndexState.itemId === item.id ? detailIndexState.index : 0;
  const hasUserControlledCarousel =
    item !== null &&
    carouselControlState.itemId === item.id &&
    carouselControlState.hasUserControlled;
  const detailImage = detailedImages[detailIndex] ?? detailedImages[0] ?? null;
  const aboveImage = item?.images?.above?.[0] || null;

  const updateDetailIndex = useCallback((direction: 1 | -1) => {
    if (!item || detailedImages.length <= 1) return;

    setDetailIndexState((current) => {
      const currentIndex = current.itemId === item.id ? current.index : 0;
      const nextIndex = currentIndex + direction;

      if (nextIndex < 0) {
        return {
          itemId: item.id,
          index: detailedImages.length - 1,
        };
      }

      if (nextIndex >= detailedImages.length) {
        return {
          itemId: item.id,
          index: 0,
        };
      }

      return {
        itemId: item.id,
        index: nextIndex,
      };
    });
  }, [detailedImages.length, item]);

  useEffect(() => {
    if (!item) return;

    const panel = panelRef.current;
    const preview = previewRef.current;

    if (panel) {
      gsap.killTweensOf(panel);
      gsap.fromTo(
        panel,
        { xPercent: -100, opacity: 0.94 },
        {
          xPercent: 0,
          opacity: 1,
          duration: 0.72,
          ease: "power3.out",
        }
      );
    }

    if (preview) {
      gsap.killTweensOf(preview);
      gsap.fromTo(
        preview,
        { x: 80, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          delay: 0.08,
        }
      );
    }
  }, [item]);

  useEffect(() => {
    const image = aboveImageRef.current;
    if (!item || !image) return;

    gsap.killTweensOf(image);
    gsap.set(image, {
      rotate: -18,
      transformOrigin: "58% 56%",
    });

    const tween = gsap.to(image, {
      rotate: 18,
      duration: 18,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    return () => {
      tween.kill();
    };
  }, [item, aboveImage]);

  useEffect(() => {
    return () => {
      if (wheelCooldownRef.current !== null) {
        window.clearTimeout(wheelCooldownRef.current);
      }
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!item || detailedImages.length <= 1 || isClosing) return;
    if (hasUserControlledCarousel) return;

    const interval = window.setInterval(() => {
      updateDetailIndex(1);
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [item, detailedImages.length, hasUserControlledCarousel, isClosing, updateDetailIndex]);

  const handleCarouselArrowClick = (direction: 1 | -1) => {
    if (item) {
      setCarouselControlState({
        itemId: item.id,
        hasUserControlled: true,
      });
    }
    updateDetailIndex(direction);
  };

  const requestClose = () => {
    if (isClosing) return;

    setIsClosing(true);

    const panel = panelRef.current;
    const preview = previewRef.current;

    if (panel) {
      gsap.killTweensOf(panel);
      gsap.to(panel, {
        xPercent: -100,
        opacity: 0.92,
        duration: 0.5,
        ease: "power3.inOut",
      });
    }

    if (preview) {
      gsap.killTweensOf(preview);
      gsap.to(preview, {
        x: 90,
        opacity: 0,
        duration: 0.42,
        ease: "power2.inOut",
      });
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      onClose();
    }, 500);
  };

  const handlePanelWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (detailedImages.length <= 1) return;

    event.preventDefault();

    if (wheelCooldownRef.current !== null) return;

    updateDetailIndex(event.deltaY > 0 ? 1 : -1);
    wheelCooldownRef.current = window.setTimeout(() => {
      wheelCooldownRef.current = null;
    }, 240);
  };

  if (!item) return null;

  return (
    <div className={styles.overlay}>
      <DetailsPanelBackdrop onClose={requestClose} />

      <DetailsPanelContent
        detailImage={detailImage}
        detailIndex={detailIndex}
        detailImageCount={detailedImages.length}
        item={item}
        onClose={requestClose}
        onNext={() => handleCarouselArrowClick(1)}
        onPrevious={() => handleCarouselArrowClick(-1)}
        onWheel={handlePanelWheel}
        panelRef={panelRef}
      />

      <DetailsPanelPreview
        aboveImage={aboveImage}
        aboveImageRef={aboveImageRef}
        previewRef={previewRef}
      />
    </div>
  );
}
