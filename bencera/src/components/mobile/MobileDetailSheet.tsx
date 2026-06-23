import { MoveHorizontal } from "lucide-react";
import type { PointerEvent as ReactPointerEvent, RefObject, UIEvent } from "react";
import type { Item } from "@/types/item";
import type { MobileStyles } from "./mobile-helpers";
import { getAnimatedTitleLetters, getMobileHeroImage } from "./mobile-helpers";

type MobileDetailSheetProps = {
  activeItem: Item;
  detailTrackRef: RefObject<HTMLDivElement | null>;
  handleBackdropClick: () => void;
  handleDetailTrackScroll: (event: UIEvent<HTMLDivElement>) => void;
  handleSheetPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handleSheetPointerEnd: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handleSheetPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  isSheetClosing: boolean;
  isSheetDragging: boolean;
  sheetDragOffset: number;
  sheetRef: RefObject<HTMLElement | null>;
  styles: MobileStyles;
};

export default function MobileDetailSheet({
  activeItem,
  detailTrackRef,
  handleBackdropClick,
  handleDetailTrackScroll,
  handleSheetPointerDown,
  handleSheetPointerEnd,
  handleSheetPointerMove,
  isSheetClosing,
  isSheetDragging,
  sheetDragOffset,
  sheetRef,
  styles,
}: MobileDetailSheetProps) {
  const selectedDetailedImages = activeItem.images.detailed.length
    ? activeItem.images.detailed
    : [getMobileHeroImage(activeItem)].filter(Boolean);
  const selectedAboveImage = activeItem.images.above[0] || "";
  const animatedTitleLetters = getAnimatedTitleLetters(activeItem.name);

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
  );
}
