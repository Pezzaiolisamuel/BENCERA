import type { CSSProperties } from "react";
import type { Item } from "@/types/item";
import { getItemThumbnail } from "@/lib/item-images";
import {
  mobileFeedRepeatCount,
  mobileMapColumnCount,
  mobileMapLateralDriftPixels,
  mobileMapMaximumBaseRows,
  mobileMapMinimumBaseRows,
  mobileMapOddColumnStaggerPixels,
  mobileMapRowDriftStepPixels,
  mobileMapRowMultiplier,
  mobileTitleBaseDelaySeconds,
  mobileTitleStaggerDelaySeconds,
} from "./mobile-config";

export type MobileStyles = Record<string, string>;

export type FeedTile = {
  key: string;
  item: Item;
};

export type MapTile = FeedTile & {
  columnIndex: number;
  rowIndex: number;
  variant: number;
  style: CSSProperties;
};

export function getMobileHeroImage(item: Item) {
  return getItemThumbnail(item);
}

export function getAnimatedTitleLetters(name: string) {
  return Array.from(name).map((character, index) => ({
    key: `${character}-${index}`,
    character: character === " " ? "\u00A0" : character,
    delay: `${mobileTitleBaseDelaySeconds + index * mobileTitleStaggerDelaySeconds}s`,
  }));
}

export function createFeedTiles(items: Item[]): FeedTile[] {
  if (!items.length) return [];

  return Array.from({ length: mobileFeedRepeatCount }, (_, blockIndex) =>
    items.map((item, itemIndex) => ({
      key: `${item.id}-${blockIndex}-${itemIndex}`,
      item,
    }))
  ).flat();
}

export function createMapTiles(items: Item[]): MapTile[] {
  if (!items.length) return [];

  const baseRowCount = Math.max(
    mobileMapMinimumBaseRows,
    Math.min(items.length, mobileMapMaximumBaseRows)
  );
  const rowCount = baseRowCount * mobileMapRowMultiplier;

  return Array.from({ length: rowCount }, (_, rowIndex) =>
    Array.from({ length: mobileMapColumnCount }, (_, columnIndex) => {
      const itemIndex =
        (rowIndex * 2 + columnIndex * 3 + Math.floor(columnIndex / 2)) % items.length;
      const variant = (rowIndex + columnIndex * 2) % 5;
      const columnStagger = columnIndex % 2 === 0 ? 0 : mobileMapOddColumnStaggerPixels;
      const rowDrift = (rowIndex % 3) * mobileMapRowDriftStepPixels;
      const lateralDrift =
        ((rowIndex + columnIndex) % 3 - 1) * mobileMapLateralDriftPixels;

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
}

export function isSafariLikeBrowser() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);

  return isSafari || isIOS;
}
