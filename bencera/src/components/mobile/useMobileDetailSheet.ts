import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Dispatch,
  PointerEvent as ReactPointerEvent,
  SetStateAction,
  UIEvent,
} from "react";
import type { Item } from "@/types/item";
import { isSafariLikeBrowser } from "./mobile-helpers";

type DragMode = "pending" | "vertical" | "horizontal" | null;

type UseMobileDetailSheetOptions = {
  selectedItem: Item | null;
  setSelectedItem: Dispatch<SetStateAction<Item | null>>;
};

export function useMobileDetailSheet({
  selectedItem,
  setSelectedItem,
}: UseMobileDetailSheetOptions) {
  const [visibleSheetItem, setVisibleSheetItem] = useState<Item | null>(null);
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const [isSheetClosing, setIsSheetClosing] = useState(false);
  const sheetRef = useRef<HTMLElement | null>(null);
  const detailTrackRef = useRef<HTMLDivElement | null>(null);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragModeRef = useRef<DragMode>(null);
  const sheetDragOffsetRef = useRef(0);
  const touchIdentifierRef = useRef<number | null>(null);
  const suppressBackdropClickRef = useRef(false);
  const activeItem = visibleSheetItem ?? selectedItem;

  useEffect(() => {
    const track = detailTrackRef.current;
    if (!track) return;
    track.scrollTo({ left: 0, behavior: "instant" as ScrollBehavior });
  }, [selectedItem?.id]);

  const openSheet = (item: Item) => {
    setSheetDragOffset(window.innerHeight);
    setIsSheetDragging(false);
    setIsSheetClosing(false);
    setSelectedItem(item);
    setVisibleSheetItem(item);
    window.requestAnimationFrame(() => {
      setSheetDragOffset(0);
    });
  };

  const closeSheet = useCallback((animated = true) => {
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
  }, [setSelectedItem]);

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
      if (nextOffset > 4) suppressBackdropClickRef.current = true;

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
  }, [activeItem, closeSheet]);

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
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;
      dragModeRef.current =
        Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0 ? "vertical" : "horizontal";
    }

    if (dragModeRef.current !== "vertical") return;

    const nextOffset = Math.max(0, deltaY);
    if (nextOffset > 6) suppressBackdropClickRef.current = true;
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
    if (wasVerticalDrag) event.preventDefault();
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (wasVerticalDrag && shouldClose) {
      closeSheet(true);
      return;
    }

    setIsSheetDragging(false);
    sheetDragOffsetRef.current = 0;
    setSheetDragOffset(0);
  };

  const handleBackdropClick = () => {
    if (suppressBackdropClickRef.current) {
      suppressBackdropClickRef.current = false;
      return;
    }
    closeSheet(true);
  };

  return {
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
  };
}
