"use client";

import { MoveHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, UIEvent } from "react";
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
  const [visibleSheetItem, setVisibleSheetItem] = useState<Item | null>(null);
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const [isSheetClosing, setIsSheetClosing] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const detailTrackRef = useRef<HTMLDivElement | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const suppressBackdropClickRef = useRef(false);

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

  useEffect(() => {
    const track = detailTrackRef.current;
    if (!track) return;
    track.scrollTo({ left: 0, behavior: "instant" as ScrollBehavior });
  }, [selectedItem?.id]);

  const activeItem = visibleSheetItem ?? selectedItem;

  const selectedDetailedImages = activeItem?.images.detailed.length
    ? activeItem.images.detailed
    : activeItem
      ? [getHeroImage(activeItem)].filter(Boolean)
      : [];
  const selectedAboveImage = activeItem?.images.above[0] || "";

  const closeSheet = (animated = true) => {
    if (!animated) {
      setSheetDragOffset(0);
      setIsSheetDragging(false);
      setIsSheetClosing(false);
      setSelectedItem(null);
      setVisibleSheetItem(null);
      return;
    }

    setIsSheetDragging(false);
    setIsSheetClosing(true);
    window.requestAnimationFrame(() => {
      const viewportHeight = window.innerHeight || 0;
      setSheetDragOffset(Math.max(sheetDragOffset, viewportHeight));
    });

    window.setTimeout(() => {
      setSelectedItem(null);
      setVisibleSheetItem(null);
      setSheetDragOffset(0);
      setIsSheetClosing(false);
    }, 380);
  };

  const handleDetailTrackScroll = (event: UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const width = container.clientWidth;
    if (!width) return;

  };

  const handleSheetPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStartYRef.current = event.clientY;
    dragPointerIdRef.current = event.pointerId;
    suppressBackdropClickRef.current = false;
    setIsSheetDragging(true);
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSheetPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null || dragPointerIdRef.current !== event.pointerId) return;

    const nextOffset = Math.max(0, event.clientY - dragStartYRef.current);
    if (nextOffset > 6) {
      suppressBackdropClickRef.current = true;
    }
    event.preventDefault();
    setSheetDragOffset(nextOffset);
  };

  const handleSheetPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null || dragPointerIdRef.current !== event.pointerId) return;

    const shouldClose = sheetDragOffset > 140;
    dragStartYRef.current = null;
    dragPointerIdRef.current = null;
    event.preventDefault();
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (shouldClose) {
      closeSheet(true);
      return;
    }

    setIsSheetDragging(false);
    setSheetDragOffset(0);
  };

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
                setSheetDragOffset(window.innerHeight);
                setIsSheetDragging(false);
                setIsSheetClosing(false);
                setSelectedItem(item);
                setVisibleSheetItem(item);
                window.requestAnimationFrame(() => {
                  setSheetDragOffset(0);
                });
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

      {activeItem ? (
        <>
          <button
            type="button"
            aria-label="Close details"
            className={styles.backdrop}
            onClick={() => {
              if (suppressBackdropClickRef.current) {
                suppressBackdropClickRef.current = false;
                return;
              }
              closeSheet(true);
            }}
          />

          <aside
            className={styles.sheet}
            onClick={(event) => event.stopPropagation()}
            style={{
              transform: `translateY(${sheetDragOffset}px)`,
              transition: isSheetDragging
                ? "none"
                : isSheetClosing
                  ? "transform 380ms cubic-bezier(0.22, 0.61, 0.36, 1)"
                  : "transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1)",
            }}
          >
            <div
              className={styles.sheetDragArea}
              onPointerDown={handleSheetPointerDown}
              onPointerMove={handleSheetPointerMove}
              onPointerUp={handleSheetPointerEnd}
              onPointerCancel={handleSheetPointerEnd}
            >
              <div className={styles.sheetHandle} />

              <div className={styles.sheetHeader}>
                <h2 className={styles.sheetTitle}>{activeItem.name}</h2>
                <a
                  href={activeItem.shopify}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.purchaseButton}
                  aria-label={`Purchase ${activeItem.name}`}
                >
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/2430/2430422.png"
                    alt=""
                    className={styles.purchaseIcon}
                  />
                </a>
              </div>
            </div>

            <div className={styles.sheetStage}>
              <div className={styles.sheetBackdropGlow} />

              <div
                ref={detailTrackRef}
                className={styles.detailTrack}
                onScroll={handleDetailTrackScroll}
              >
                {selectedDetailedImages.map((image, index) => (
                  <div key={`${image}-${index}`} className={styles.detailSlide}>
                    <div className={styles.sheetImageFrame}>
                      <img
                        src={image}
                        alt={`${activeItem.name} detail ${index + 1}`}
                        className={styles.sheetImage}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {selectedAboveImage ? (
                <div className={styles.rotatingPreviewFrame}>
                  <img
                    src={selectedAboveImage}
                    alt={`${activeItem.name} above`}
                    className={styles.rotatingPreviewImage}
                  />
                </div>
              ) : null}

              {selectedDetailedImages.length > 1 ? (
                <div className={styles.swipeHint} aria-hidden="true">
                  <MoveHorizontal size={18} />
                </div>
              ) : null}
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
