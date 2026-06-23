import {
  CANVAS_EQUAL_ZOOM_EPSILON,
  CANVAS_EQUAL_ZOOM_STEP_COUNT,
  CANVAS_FALLBACK_AVERAGE_ITEM_SIZE,
  CANVAS_HEIGHT,
  CANVAS_MAX_SCALE,
  CANVAS_MIN_ZOOM_MULTIPLIER,
  CANVAS_WIDTH,
  CANVAS_ZOOM_STEP_COUNT,
} from "./canvas-config";
import type { ItemLayout } from "./canvas-types";

export function calculateMinimumCanvasScale(viewportWidth: number, viewportHeight: number) {
  return Math.max(viewportWidth / CANVAS_WIDTH, viewportHeight / CANVAS_HEIGHT);
}

export function calculateScaleForVisibleItems(
  itemLayouts: readonly ItemLayout[],
  viewportWidth: number,
  viewportHeight: number,
  desiredVisibleItems = 11
) {
  const sizes = itemLayouts.map((layout) => layout.size).filter(Boolean);
  const averageSize = sizes.length
    ? sizes.reduce((sum, size) => sum + size, 0) / sizes.length
    : CANVAS_FALLBACK_AVERAGE_ITEM_SIZE;

  // Equal-area approximation: viewport area / desired tile area, converted to linear scale.
  const visibleItemScale = Math.sqrt(
    (viewportWidth * viewportHeight) /
      (desiredVisibleItems * averageSize * averageSize)
  );

  return Math.min(
    CANVAS_MAX_SCALE,
    Math.max(calculateMinimumCanvasScale(viewportWidth, viewportHeight), visibleItemScale)
  );
}

export function calculateCanvasZoomLevels(
  itemLayouts: readonly ItemLayout[],
  viewportWidth: number,
  viewportHeight: number
) {
  const fullCanvasScale = Math.min(
    viewportWidth / CANVAS_WIDTH,
    viewportHeight / CANVAS_HEIGHT
  );
  const minimumStepScale = fullCanvasScale * CANVAS_MIN_ZOOM_MULTIPLIER;
  const maximumStepScale = Math.max(
    minimumStepScale,
    Math.min(
      CANVAS_MAX_SCALE,
      calculateScaleForVisibleItems(itemLayouts, viewportWidth, viewportHeight, 2)
    )
  );

  // The existing collapsed range intentionally returns five identical entries.
  if (Math.abs(maximumStepScale - minimumStepScale) < CANVAS_EQUAL_ZOOM_EPSILON) {
    return Array(CANVAS_EQUAL_ZOOM_STEP_COUNT).fill(minimumStepScale);
  }

  // Linear interpolation keeps the first and last steps fixed and spaces the middle evenly.
  return Array.from({ length: CANVAS_ZOOM_STEP_COUNT }, (_, index) => {
    const progress = index / (CANVAS_ZOOM_STEP_COUNT - 1);
    return minimumStepScale + (maximumStepScale - minimumStepScale) * progress;
  });
}

export function findNearestZoomStepIndex(scale: number, zoomLevels: readonly number[]) {
  let nearestIndex = 0;
  let smallestDifference = Math.abs(zoomLevels[0] - scale);

  for (let index = 1; index < zoomLevels.length; index += 1) {
    const difference = Math.abs(zoomLevels[index] - scale);
    if (difference < smallestDifference) {
      smallestDifference = difference;
      nearestIndex = index;
    }
  }

  return nearestIndex;
}
