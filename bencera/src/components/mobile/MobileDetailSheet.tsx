import { MoveHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import type { Item } from "@/types/item";
import type { MobileStyles } from "./mobile-helpers";
import { getAnimatedTitleLetters, getMobileHeroImage } from "./mobile-helpers";

type MobileDetailSheetProps = {
  activeItem: Item;
  detailTrackRef: RefObject<HTMLDivElement | null>;
  handleBackdropClick: () => void;
  handleSheetPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handleSheetPointerEnd: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handleSheetPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  isSheetClosing: boolean;
  isSheetDragging: boolean;
  sheetDragOffset: number;
  sheetRef: RefObject<HTMLElement | null>;
  styles: MobileStyles;
};

type DetailIndexState = {
  itemId: string;
  index: number;
};

export default function MobileDetailSheet({
  activeItem,
  detailTrackRef,
  handleBackdropClick,
  handleSheetPointerDown,
  handleSheetPointerEnd,
  handleSheetPointerMove,
  isSheetClosing,
  isSheetDragging,
  sheetDragOffset,
  sheetRef,
  styles,
}: MobileDetailSheetProps) {
  const selectedDetailedImages = useMemo(
    () =>
      activeItem.images.detailed.length
        ? activeItem.images.detailed
        : [getMobileHeroImage(activeItem)].filter(Boolean),
    [activeItem]
  );
  const selectedAboveImage = activeItem.images.above[0] || "";
  const animatedTitleLetters = getAnimatedTitleLetters(activeItem.name);
  const [detailIndexState, setDetailIndexState] = useState<DetailIndexState>({
    itemId: activeItem.id,
    index: 0,
  });
  const detailIndex = detailIndexState.itemId === activeItem.id ? detailIndexState.index : 0;

  useEffect(() => {
    const track = detailTrackRef.current;
    if (!track || selectedDetailedImages.length <= 1) return;

    const handleScroll = () => {
      const nextIndex = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
      setDetailIndexState({
        itemId: activeItem.id,
        index: Math.min(selectedDetailedImages.length - 1, Math.max(0, nextIndex)),
      });
    };

    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", handleScroll);
    };
  }, [activeItem.id, detailTrackRef, selectedDetailedImages.length]);

  useEffect(() => {
    const track = detailTrackRef.current;
    if (!track || selectedDetailedImages.length <= 1) return;

    const interval = window.setInterval(() => {
      setDetailIndexState((current) => {
        const currentIndex = current.itemId === activeItem.id ? current.index : 0;
        const nextIndex =
          currentIndex + 1 >= selectedDetailedImages.length ? 0 : currentIndex + 1;
        track.scrollTo({
          left: track.clientWidth * nextIndex,
          behavior: "smooth",
        });
        return {
          itemId: activeItem.id,
          index: nextIndex,
        };
      });
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeItem.id, detailTrackRef, selectedDetailedImages.length]);

  return (
    <>
      <button
        type="button"
        aria-label="Close details"
        className={styles.backdrop}
        onClick={handleBackdropClick}
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
        </div>

        <div className={styles.sheetStage}>
          <div className={styles.sheetBackdropGlow} />

          <div ref={detailTrackRef} className={styles.detailTrack}>
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

          <a
            href={activeItem.shopify}
            className={styles.purchaseButton}
            aria-label={`View and purchase ${activeItem.name}`}
          >
            View &amp; Purchase
          </a>

          {selectedDetailedImages.length > 1 ? (
            <>
              <div className={styles.mobileCarouselTracker} aria-label={`Image ${detailIndex + 1} of ${selectedDetailedImages.length}`}>
                {selectedDetailedImages.map((_, index) => (
                  <span
                    key={index}
                    className={`${styles.mobileCarouselDot} ${
                      index === detailIndex ? styles.mobileCarouselDotActive : ""
                    }`}
                  />
                ))}
              </div>

              <div className={styles.swipeHint} aria-hidden="true">
                <MoveHorizontal size={18} />
              </div>
            </>
          ) : null}
        </div>
      </aside>
    </>
  );
}
