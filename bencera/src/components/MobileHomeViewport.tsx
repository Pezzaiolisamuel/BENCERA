"use client";

import { Inter } from "next/font/google";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Item } from "@/types/item";
import feedStyles from "@/app/mobilehome/landing-mobile.module.css";
import mapStyles from "@/app/mobilehome/page.module.css";
import MobileDetailSheet from "./mobile/MobileDetailSheet";
import MobileFeed from "./mobile/MobileFeed";
import MobileMap from "./mobile/MobileMap";
import { createFeedTiles, createMapTiles } from "./mobile/mobile-helpers";
import { useMobileDetailSheet } from "./mobile/useMobileDetailSheet";

const inter = Inter({
  subsets: ["latin"],
  weight: ["500", "700"],
});

type MobileHomeViewportProps = {
  items: Item[];
  variant?: "feed" | "map";
};

export default function MobileHomeViewport({ items, variant = "feed" }: MobileHomeViewportProps) {
  const isMapVariant = variant === "map";
  const styles = isMapVariant ? mapStyles : feedStyles;
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [mapZoomIndex, setMapZoomIndex] = useState(1);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const feedTiles = useMemo(() => createFeedTiles(items), [items]);
  const mapTiles = useMemo(() => createMapTiles(items), [items]);
  const visibleTileCount = isMapVariant ? mapTiles.length : feedTiles.length;
  const {
    activeItem,
    detailTrackRef,
    handleBackdropClick,
    handleDetailTrackScroll,
    handleSheetPointerDown,
    handleSheetPointerEnd,
    handleSheetPointerMove,
    isSheetClosing,
    isSheetDragging,
    openSheet,
    sheetDragOffset,
    sheetRef,
  } = useMobileDetailSheet({ selectedItem, setSelectedItem });

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

      // Horizontal map momentum remains native; changing scrollLeft during a swipe causes snapping.
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isMapVariant, items.length, visibleTileCount]);

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
  }, [styles, visibleTileCount]);

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

      {isMapVariant ? (
        <MobileMap
          mapZoomIndex={mapZoomIndex}
          onSelectItem={openSheet}
          setMapZoomIndex={setMapZoomIndex}
          styles={styles}
          tiles={mapTiles}
        />
      ) : (
        <MobileFeed onSelectItem={openSheet} styles={styles} tiles={feedTiles} />
      )}

      {activeItem ? (
        <MobileDetailSheet
          activeItem={activeItem}
          detailTrackRef={detailTrackRef}
          handleBackdropClick={handleBackdropClick}
          handleDetailTrackScroll={handleDetailTrackScroll}
          handleSheetPointerDown={handleSheetPointerDown}
          handleSheetPointerEnd={handleSheetPointerEnd}
          handleSheetPointerMove={handleSheetPointerMove}
          isSheetClosing={isSheetClosing}
          isSheetDragging={isSheetDragging}
          sheetDragOffset={sheetDragOffset}
          sheetRef={sheetRef}
          styles={styles}
        />
      ) : null}
    </div>
  );
}
