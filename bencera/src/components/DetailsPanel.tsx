"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import type { Item } from "@/types/item";
import styles from "./DetailsPanel.module.css";

type DetailsPanelProps = {
  item: Item | null;
  onClose: () => void;
};

function getAnimatedTitleLetters(name: string) {
  return Array.from(name).map((character, index) => ({
    key: `${character}-${index}`,
    character: character === " " ? "\u00A0" : character,
    delay: `${0.2 + index * 0.04}s`,
  }));
}

export default function DetailsPanel({ item, onClose }: DetailsPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const aboveImageRef = useRef<HTMLImageElement | null>(null);
  const wheelCooldownRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const [detailIndex, setDetailIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const detailedImages = useMemo(() => {
    const images = item?.images?.detailed;
    return Array.isArray(images) ? images.filter((src): src is string => !!src) : [];
  }, [item]);

  const detailImage = detailedImages[detailIndex] ?? detailedImages[0] ?? null;
  const aboveImage = item?.images?.above?.[0] || null;
  const animatedTitleLetters = item ? getAnimatedTitleLetters(item.name) : [];

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

  const updateDetailIndex = (direction: 1 | -1) => {
    if (detailedImages.length <= 1) return;

    setDetailIndex((current) => {
      const nextIndex = current + direction;

      if (nextIndex < 0) {
        return detailedImages.length - 1;
      }

      if (nextIndex >= detailedImages.length) {
        return 0;
      }

      return nextIndex;
    });
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
      <button
        type="button"
        className={styles.backdrop}
        onClick={requestClose}
        aria-label="Close details"
      />

      <aside
        ref={panelRef}
        className={styles.panel}
        onWheel={handlePanelWheel}
      >
        <button
          type="button"
          onClick={requestClose}
          aria-label="Close details"
          className={styles.closeButton}
        >
          x
        </button>

        <div className={styles.panelHeader}>
          <h1 key={item.id} className={styles.title} aria-label={item.name}>
            {animatedTitleLetters.map((letter) => (
              <span
                key={letter.key}
                className={styles.titleLetter}
                style={{ animationDelay: letter.delay }}
                aria-hidden="true"
              >
                {letter.character}
              </span>
            ))}
          </h1>
        </div>

        <div className={styles.imageViewport}>
          {detailImage ? (
            <img
              key={`${item.id}-${detailIndex}`}
              src={detailImage}
              alt={`${item.name} detail ${detailIndex + 1}`}
              className={styles.detailImage}
            />
          ) : null}
        </div>

        <a
          href={item.shopify}
          target="_blank"
          rel="noreferrer"
          className={styles.purchaseButton}
          aria-label={`Purchase ${item.name}`}
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/2430/2430422.png"
            alt=""
            className={styles.purchaseIcon}
          />
        </a>

        <div className={styles.scrollCue} aria-hidden="true">
          <span className={styles.scrollCueText}>Scroll</span>
          <span className={styles.scrollCueIcon} />
        </div>
      </aside>

      {aboveImage ? (
        <div ref={previewRef} className={styles.previewWrap} aria-hidden="true">
          <img ref={aboveImageRef} src={aboveImage} alt="" className={styles.previewImage} />
        </div>
      ) : null}
    </div>
  );
}
