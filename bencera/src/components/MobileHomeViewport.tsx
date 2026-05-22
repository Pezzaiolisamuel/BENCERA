"use client";

import { MoveHorizontal } from "lucide-react";
import { Inter } from "next/font/google";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, UIEvent } from "react";
import type { Item } from "@/types/item";
import feedStyles from "@/app/mobilehome/landing-mobile.module.css";
import mapStyles from "@/app/mobilehome/page.module.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["500", "700"],
});

type MobileHomeViewportProps = {
  items: Item[];
  variant?: "feed" | "map";
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

function getAnimatedTitleLetters(name: string) {
  return Array.from(name).map((character, index) => ({
    key: `${character}-${index}`,
    character: character === " " ? "\u00A0" : character,
    delay: `${0.2 + index * 0.04}s`,
  }));
}

const mapZoomLevels = [0.78, 1, 1.24] as const;

function isSafariLikeBrowser() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);

  return isSafari || isIOS;
}

export default function MobileHomeViewport({ items, variant = "feed" }: MobileHomeViewportProps) {
  const isMapVariant = variant === "map";
  const styles = isMapVariant ? mapStyles : feedStyles;
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [visibleSheetItem, setVisibleSheetItem] = useState<Item | null>(null);
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const [isSheetClosing, setIsSheetClosing] = useState(false);
  const [mapZoomIndex, setMapZoomIndex] = useState(1);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLElement | null>(null);
  const detailTrackRef = useRef<HTMLDivElement | null>(null);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragModeRef = useRef<"pending" | "vertical" | "horizontal" | null>(null);
  const sheetDragOffsetRef = useRef(0);
  const touchIdentifierRef = useRef<number | null>(null);
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

  const feedTiles = useMemo(() => {
    if (!items.length) return [];

    return Array.from({ length: 5 }, (_, blockIndex) =>
      items.map((item, itemIndex) => ({
        key: `${item.id}-${blockIndex}-${itemIndex}`,
        item,
      }))
    ).flat();
  }, [items]);

  const mapTiles = useMemo(() => {
    if (!items.length) return [];

    const columnCount = 21;
    const baseRowCount = Math.max(6, Math.min(items.length, 9));
    const rowCount = baseRowCount * 5;

    return Array.from({ length: rowCount }, (_, rowIndex) =>
      Array.from({ length: columnCount }, (_, columnIndex) => {
        const itemIndex =
          (rowIndex * 2 + columnIndex * 3 + Math.floor(columnIndex / 2)) % items.length;
        const variant = (rowIndex + columnIndex * 2) % 5;
        const columnStagger = columnIndex % 2 === 0 ? 0 : 62;
        const rowDrift = (rowIndex % 3) * 12;
        const lateralDrift = ((rowIndex + columnIndex) % 3 - 1) * 16;

        return {
          key: `${items[itemIndex].id}-${rowIndex}-${columnIndex}`,
          item: items[itemIndex],
          columnIndex,
          rowIndex,
          variant,
          style: {
            gridColumn: columnIndex + 1,
            gridRow: rowIndex + 1,
            "--tile-shift-x": `${lateralDrift}px`,
            "--tile-shift-y": `${columnStagger + rowDrift}px`,
            "--tile-scale": variant === 0 ? 1.08 : variant === 3 ? 0.88 : 1,
          } as CSSProperties,
        };
      })
    ).flat();
  }, [items]);

  const visibleTiles = isMapVariant ? mapTiles : feedTiles;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !items.length) return;

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

      // Horizontal movement stays native on the map variant. Changing scrollLeft mid-swipe
      // makes mobile browsers feel like they snap into a new view while momentum is active.
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isMapVariant, items.length, visibleTiles.length]);

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
  }, [styles, visibleTiles.length]);

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
  const animatedTitleLetters = activeItem ? getAnimatedTitleLetters(activeItem.name) : [];

  const closeSheet = (animated = true) => {
    if (!animated) {
      sheetDragOffsetRef.current = 0;
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
      const closingOffset = Math.max(sheetDragOffsetRef.current, viewportHeight);
      sheetDragOffsetRef.current = closingOffset;
      setSheetDragOffset(closingOffset);
    });

    window.setTimeout(() => {
      setSelectedItem(null);
      setVisibleSheetItem(null);
      sheetDragOffsetRef.current = 0;
      setSheetDragOffset(0);
      setIsSheetClosing(false);
    }, 380);
  };

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!activeItem || !sheet || !isSafariLikeBrowser()) return;

    const resetTouchDrag = () => {
      dragStartXRef.current = null;
      dragStartYRef.current = null;
      dragModeRef.current = null;
      touchIdentifierRef.current = null;
    };

    const getTouch = (touches: TouchList) => {
      if (touchIdentifierRef.current === null) return touches[0] ?? null;

      for (let index = 0; index < touches.length; index += 1) {
        const touch = touches.item(index);
        if (touch?.identifier === touchIdentifierRef.current) return touch;
      }

      return null;
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;

      dragStartXRef.current = touch.clientX;
      dragStartYRef.current = touch.clientY;
      dragModeRef.current = "pending";
      touchIdentifierRef.current = touch.identifier;
      sheetDragOffsetRef.current = 0;
      suppressBackdropClickRef.current = false;
      setIsSheetDragging(false);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (dragStartYRef.current === null) return;

      const touch = getTouch(event.touches);
      if (!touch) return;

      const deltaX = touch.clientX - (dragStartXRef.current ?? touch.clientX);
      const deltaY = touch.clientY - dragStartYRef.current;

      if (dragModeRef.current === "pending") {
        if (Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5) return;
        dragModeRef.current =
          Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0 ? "vertical" : "horizontal";
      }

      if (dragModeRef.current !== "vertical") return;

      const nextOffset = Math.max(0, deltaY);
      if (nextOffset > 4) {
        suppressBackdropClickRef.current = true;
      }

      event.preventDefault();
      sheetDragOffsetRef.current = nextOffset;
      setIsSheetDragging(true);
      setSheetDragOffset(nextOffset);
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (dragStartYRef.current === null) return;

      const touch = getTouch(event.changedTouches);
      const finalOffset = touch
        ? Math.max(0, touch.clientY - dragStartYRef.current, sheetDragOffsetRef.current)
        : sheetDragOffsetRef.current;
      const wasVerticalDrag = dragModeRef.current === "vertical";

      resetTouchDrag();

      if (wasVerticalDrag && finalOffset > 55) {
        event.preventDefault();
        closeSheet(true);
        return;
      }

      setIsSheetDragging(false);
      sheetDragOffsetRef.current = 0;
      setSheetDragOffset(0);
    };

    sheet.addEventListener("touchstart", handleTouchStart, { passive: true });
    sheet.addEventListener("touchmove", handleTouchMove, { passive: false });
    sheet.addEventListener("touchend", handleTouchEnd, { passive: false });
    sheet.addEventListener("touchcancel", handleTouchEnd, { passive: false });

    return () => {
      sheet.removeEventListener("touchstart", handleTouchStart);
      sheet.removeEventListener("touchmove", handleTouchMove);
      sheet.removeEventListener("touchend", handleTouchEnd);
      sheet.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [activeItem]);

  const handleDetailTrackScroll = (event: UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const width = container.clientWidth;
    if (!width) return;

  };

  const handleSheetPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" && isSafariLikeBrowser()) return;

    dragStartXRef.current = event.clientX;
    dragStartYRef.current = event.clientY;
    dragPointerIdRef.current = event.pointerId;
    dragModeRef.current = "pending";
    sheetDragOffsetRef.current = 0;
    suppressBackdropClickRef.current = false;
    setIsSheetDragging(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSheetPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" && isSafariLikeBrowser()) return;
    if (dragStartYRef.current === null || dragPointerIdRef.current !== event.pointerId) return;

    const deltaX = event.clientX - (dragStartXRef.current ?? event.clientX);
    const deltaY = event.clientY - dragStartYRef.current;

    if (dragModeRef.current === "pending") {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) {
        return;
      }

      dragModeRef.current =
        Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0 ? "vertical" : "horizontal";
    }

    if (dragModeRef.current !== "vertical") {
      return;
    }

    const nextOffset = Math.max(0, deltaY);
    if (nextOffset > 6) {
      suppressBackdropClickRef.current = true;
    }
    setIsSheetDragging(true);
    event.preventDefault();
    sheetDragOffsetRef.current = nextOffset;
    setSheetDragOffset(nextOffset);
  };

  const handleSheetPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" && isSafariLikeBrowser()) return;
    if (dragStartYRef.current === null || dragPointerIdRef.current !== event.pointerId) return;

    const wasVerticalDrag = dragModeRef.current === "vertical";
    const finalOffset = Math.max(0, event.clientY - dragStartYRef.current, sheetDragOffsetRef.current);
    const closeThreshold = isSafariLikeBrowser() ? 70 : 140;
    const shouldClose = finalOffset > closeThreshold;
    dragStartXRef.current = null;
    dragStartYRef.current = null;
    dragPointerIdRef.current = null;
    dragModeRef.current = null;
    if (wasVerticalDrag) {
      event.preventDefault();
    }
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (wasVerticalDrag && shouldClose) {
      closeSheet(true);
      return;
    }

    setIsSheetDragging(false);
    sheetDragOffsetRef.current = 0;
    setSheetDragOffset(0);
  };

  const zoomMapIn = () => {
    setMapZoomIndex((currentIndex) => Math.min(currentIndex + 1, mapZoomLevels.length - 1));
  };

  const zoomMapOut = () => {
    setMapZoomIndex((currentIndex) => Math.max(currentIndex - 1, 0));
  };

  return (
    <div className={styles.page} ref={scrollRef}>
      <header
        className={`${styles.mobileHeader} ${activeItem ? styles.mobileHeaderDetailOpen : ""} ${inter.className}`}
      >
        <div className={styles.mobileBrand}>
          <img className={styles.mobileBrandIcon} src="/brand-icon.png" alt="" width={40} height={40} />
          <div className={styles.mobileLogo}>Bencera</div>
        </div>
        <a
          className={styles.mobileShopLink}
          href="https://bencera.myshopify.com/collections/all"
          aria-label="Open Bencera shop"
        >
          Shop All
        </a>
      </header>

      <main
        className={isMapVariant ? mapStyles.map : feedStyles.grid}
        style={
          isMapVariant
            ? ({ "--map-zoom": mapZoomLevels[mapZoomIndex] } as CSSProperties)
            : undefined
        }
      >
        {visibleTiles.map((tile) => {
          const { key, item } = tile;
          const heroImage = getHeroImage(item);
          const mapTile = isMapVariant
            ? (tile as (typeof mapTiles)[number])
            : null;

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
              className={
                mapTile
                  ? `${styles.itemTile} ${mapStyles[`tileVariant${mapTile.variant}`]}`
                  : styles.itemTile
              }
              style={mapTile?.style}
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

      {isMapVariant ? (
        <div className={mapStyles.zoomControls} aria-label="Map zoom controls">
          <button
            type="button"
            className={mapStyles.zoomButton}
            onClick={zoomMapOut}
            disabled={mapZoomIndex === 0}
            aria-label="Zoom out"
          >
            -
          </button>
          <button
            type="button"
            className={mapStyles.zoomButton}
            onClick={zoomMapIn}
            disabled={mapZoomIndex === mapZoomLevels.length - 1}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      ) : null}

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
            ref={sheetRef}
            className={styles.sheet}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={handleSheetPointerDown}
            onPointerMove={handleSheetPointerMove}
            onPointerUp={handleSheetPointerEnd}
            onPointerCancel={handleSheetPointerEnd}
            style={{
              transform: `translateY(${sheetDragOffset}px)`,
              transition: isSheetDragging
                ? "none"
                : isSheetClosing
                  ? "transform 380ms cubic-bezier(0.22, 0.61, 0.36, 1)"
                  : "transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1)",
            }}
          >
            <div className={styles.sheetDragArea}>
              <div className={styles.sheetHandle} />

              <div className={styles.sheetHeader}>
                <h2 key={activeItem.id} className={styles.sheetTitle} aria-label={activeItem.name}>
                  {animatedTitleLetters.map((letter) => (
                    <span
                      key={letter.key}
                      className={styles.sheetTitleLetter}
                      style={{ animationDelay: letter.delay }}
                      aria-hidden="true"
                    >
                      {letter.character}
                    </span>
                  ))}
                </h2>
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

              <a
                href={activeItem.shopify}
                className={styles.purchaseButton}
                aria-label={`View more pictures of ${activeItem.name}`}
              >
                MORE IMAGES
              </a>

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
