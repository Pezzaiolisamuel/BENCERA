"use client";

import { Inter } from "next/font/google";
import { useMemo, useState } from "react";
import type { Item } from "@/types/item";
import feedStyles from "@/app/mobilehome/landing-mobile.module.css";
import mapStyles from "@/app/mobilehome/page.module.css";
import MobileDetailSheet from "./mobile/MobileDetailSheet";
import MobileFeed from "./mobile/MobileFeed";
import MobileMap from "./mobile/MobileMap";
import { createFeedTiles, createMapTiles } from "./mobile/mobile-helpers";
import { useMobileDetailSheet } from "./mobile/useMobileDetailSheet";
import { useMobileViewportEffects } from "./mobile/useMobileViewportEffects";

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
  const feedTiles = useMemo(() => createFeedTiles(items), [items]);
  const mapTiles = useMemo(() => createMapTiles(items), [items]);
  const visibleTileCount = isMapVariant ? mapTiles.length : feedTiles.length;
  const { scrollRef } = useMobileViewportEffects({
    isMapVariant,
    itemCount: items.length,
    itemVisibleClassName: styles.itemVisible,
    visibleTileCount,
  });
  const {
    activeItem,
    detailTrackRef,
    handleBackdropClick,
    handleSheetPointerDown,
    handleSheetPointerEnd,
    handleSheetPointerMove,
    isSheetClosing,
    isSheetDragging,
    openSheet,
    sheetDragOffset,
    sheetRef,
  } = useMobileDetailSheet({ selectedItem, setSelectedItem });

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
