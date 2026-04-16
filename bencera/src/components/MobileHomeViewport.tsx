"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Item } from "@/types/item";
import styles from "@/app/mobilehome/page.module.css";

type MobileHomeViewportProps = {
  items: Item[];
};

function getHeroImage(item: Item) {
  return (
    item.images.above[0] ||
    item.images.detailed[0] ||
    item.images.background[0] ||
    item.images.howToUse[0] ||
    ""
  );
}

export default function MobileHomeViewport({ items }: MobileHomeViewportProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
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

  const repeatedItems = useMemo(() => {
    if (!items.length) return [];

    return Array.from({ length: 5 }, (_, blockIndex) =>
      items.map((item, itemIndex) => ({
        key: `${item.id}-${blockIndex}-${itemIndex}`,
        item,
      }))
    ).flat();
  }, [items]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !items.length) return;

    requestAnimationFrame(() => {
      const segmentHeight = container.scrollHeight / 5;
      container.scrollTop = segmentHeight * 2;
    });

    const handleScroll = () => {
      const segmentHeight = container.scrollHeight / 5;
      if (!segmentHeight) return;

      if (container.scrollTop < segmentHeight * 0.75) {
        container.scrollTop += segmentHeight;
      } else if (container.scrollTop > segmentHeight * 3.25) {
        container.scrollTop -= segmentHeight;
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [items.length, repeatedItems.length]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const targets = Array.from(container.querySelectorAll<HTMLElement>("[data-mobile-item]"));
    if (!targets.length) return;

    for (const target of targets) {
      target.classList.remove(styles.itemVisible);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).classList.add(styles.itemVisible);
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
  }, [repeatedItems.length]);

  const selectedDetailedImages = selectedItem?.images.detailed ?? [];
  const selectedDetailImage =
    selectedDetailedImages[detailImageIndex] ||
    (selectedItem ? getHeroImage(selectedItem) : "");
  const selectedAboveImage = selectedItem?.images.above[0] || "";

  return (
    <div className={styles.page} ref={scrollRef}>
      <main className={styles.grid}>
        {repeatedItems.map(({ key, item }) => {
          const heroImage = getHeroImage(item);

          return (
            <button
              key={key}
              type="button"
              data-mobile-item
              onClick={() => {
                setDetailImageIndex(0);
                setSelectedItem(item);
              }}
              className={styles.itemTile}
            >
              <div className={styles.itemMedia}>
                {heroImage ? (
                  <img src={heroImage} alt={item.name} className={styles.itemImage} />
                ) : (
                  <div className={styles.itemFallback}>No preview</div>
                )}
              </div>
              <div className={styles.itemName}>{item.name}</div>
            </button>
          );
        })}
      </main>

      {selectedItem ? (
        <>
          <button
            type="button"
            aria-label="Close details"
            className={styles.backdrop}
            onClick={() => {
              setDetailImageIndex(0);
              setSelectedItem(null);
            }}
          />

          <aside className={styles.sheet}>
            <div className={styles.sheetHandle} />

            <div className={styles.sheetHeader}>
              <div>
                <h2 className={styles.sheetTitle}>{selectedItem.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDetailImageIndex(0);
                  setSelectedItem(null);
                }}
                className={styles.closeButton}
              >
                x
              </button>
            </div>

            <div className={styles.sheetStage}>
              <div className={styles.sheetBackdropGlow} />

              <div className={styles.sheetImageFrame}>
                {selectedDetailImage ? (
                  <img
                    src={selectedDetailImage}
                    alt={selectedItem.name}
                    className={styles.sheetImage}
                  />
                ) : (
                  <div className={styles.itemFallback}>No preview</div>
                )}
              </div>

              {selectedAboveImage ? (
                <div className={styles.rotatingPreviewFrame}>
                  <img
                    src={selectedAboveImage}
                    alt={`${selectedItem.name} above`}
                    className={styles.rotatingPreviewImage}
                  />
                </div>
              ) : null}
            </div>

            {selectedDetailedImages.length > 1 ? (
              <div className={styles.sheetControls}>
                <button
                  type="button"
                  onClick={() =>
                    setDetailImageIndex((currentIndex) =>
                      currentIndex === 0
                        ? selectedDetailedImages.length - 1
                        : currentIndex - 1
                    )
                  }
                  className={styles.sheetControlButton}
                >
                  Prev
                </button>
                <div className={styles.sheetCounter}>
                  {detailImageIndex + 1} / {selectedDetailedImages.length}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDetailImageIndex((currentIndex) =>
                      currentIndex === selectedDetailedImages.length - 1
                        ? 0
                        : currentIndex + 1
                    )
                  }
                  className={styles.sheetControlButton}
                >
                  Next
                </button>
              </div>
            ) : null}
          </aside>
        </>
      ) : null}
    </div>
  );
}
