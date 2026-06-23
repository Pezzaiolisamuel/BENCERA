import { useEffect, useRef, useState } from "react";
import { calculateCanvasItemLayouts } from "./canvas-layout";
import type { ItemLayout } from "./canvas-types";

type UseCanvasLayoutStateOptions = {
  itemCount: number;
};

export function useCanvasLayoutState({ itemCount }: UseCanvasLayoutStateOptions) {
  const itemLayoutsRef = useRef<ItemLayout[]>([]);
  const [itemLayouts, setItemLayouts] = useState<ItemLayout[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const nextItemLayouts = calculateCanvasItemLayouts(itemCount, Math.random);
    itemLayoutsRef.current = nextItemLayouts;

    let isCurrentLayout = true;
    queueMicrotask(() => {
      if (!isCurrentLayout) return;
      setItemLayouts(nextItemLayouts);
      setReady(true);
    });

    return () => {
      isCurrentLayout = false;
    };
  }, [itemCount]);

  return {
    itemLayouts,
    itemLayoutsRef,
    ready,
  };
}
