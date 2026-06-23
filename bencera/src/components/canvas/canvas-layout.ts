import {
  CANVAS_HEIGHT,
  CANVAS_HORIZONTAL_GAP,
  CANVAS_HORIZONTAL_MARGIN,
  CANVAS_HORIZONTAL_SIZE_GAP_RATIO,
  CANVAS_ITEM_COUNT,
  CANVAS_ITEMS_PER_ROW,
  CANVAS_MAX_ITEM_SIZE,
  CANVAS_MIN_ITEM_SIZE,
  CANVAS_VERTICAL_GAP,
  CANVAS_VERTICAL_MARGIN,
  CANVAS_VERTICAL_SIZE_GAP_RATIO,
  CANVAS_WIDTH,
} from "./canvas-config";
import type { ItemLayout } from "./canvas-types";

type RandomSource = () => number;

function createSeededRandom(seed: number): RandomSource {
  let state = seed;

  return () => {
    let value = (state += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRandom<T>(items: readonly T[], random: RandomSource): T[] {
  const shuffled = items.slice();

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function createRepeatedCanvasItems<T>(items: readonly T[], seed: number): T[] {
  const random = createSeededRandom(seed);
  const repeatedItems: T[] = [];

  if (!items.length) return repeatedItems;

  while (repeatedItems.length < CANVAS_ITEM_COUNT) {
    repeatedItems.push(...shuffleWithRandom(items, random));
  }

  return repeatedItems.slice(0, CANVAS_ITEM_COUNT);
}

export function calculateCanvasItemLayouts(
  renderedItemCount: number,
  random: RandomSource
): ItemLayout[] {
  const rowCount = Math.ceil(CANVAS_ITEM_COUNT / CANVAS_ITEMS_PER_ROW);
  const sizes = new Array(CANVAS_ITEM_COUNT).fill(0).map(
    () =>
      CANVAS_MIN_ITEM_SIZE +
      Math.floor(random() * (CANVAS_MAX_ITEM_SIZE - CANVAS_MIN_ITEM_SIZE))
  );
  const largestSizeByRow: number[] = new Array(rowCount).fill(0);

  for (let index = 0; index < CANVAS_ITEM_COUNT; index += 1) {
    const rowIndex = Math.floor(index / CANVAS_ITEMS_PER_ROW);
    largestSizeByRow[rowIndex] = Math.max(largestSizeByRow[rowIndex], sizes[index]);
  }

  const rowCentersY: number[] = new Array(rowCount).fill(0);
  let yCursor = CANVAS_VERTICAL_MARGIN;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const largestSize = largestSizeByRow[rowIndex];
    const rowHeight =
      largestSize + CANVAS_VERTICAL_GAP + largestSize * CANVAS_VERTICAL_SIZE_GAP_RATIO;
    rowCentersY[rowIndex] = yCursor + rowHeight / 2;
    yCursor += rowHeight;
  }

  // Scale the accumulated row heights back into the fixed virtual-canvas height.
  const usedHeight = yCursor + CANVAS_VERTICAL_MARGIN;
  const verticalScale = CANVAS_HEIGHT / usedHeight;
  const usableWidth = CANVAS_WIDTH - CANVAS_HORIZONTAL_MARGIN * 2;

  return Array.from({ length: renderedItemCount }, (_, itemIndex) => {
    const rowIndex = Math.floor(itemIndex / CANVAS_ITEMS_PER_ROW);
    const columnIndex = itemIndex % CANVAS_ITEMS_PER_ROW;
    const size = sizes[itemIndex];
    const largestSize = largestSizeByRow[rowIndex];
    const step =
      largestSize + CANVAS_HORIZONTAL_GAP + largestSize * CANVAS_HORIZONTAL_SIZE_GAP_RATIO;
    const rowWidth = step * (CANVAS_ITEMS_PER_ROW - 1);
    const startX = CANVAS_HORIZONTAL_MARGIN + (usableWidth - rowWidth) / 2;
    const stagger = rowIndex % 2 === 0 ? 0 : step * 0.5;

    return {
      size,
      cx: startX + columnIndex * step + stagger,
      cy: rowCentersY[rowIndex] * verticalScale,
    };
  });
}
