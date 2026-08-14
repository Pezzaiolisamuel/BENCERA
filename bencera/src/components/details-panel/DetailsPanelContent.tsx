import type { RefObject, WheelEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Item } from "@/types/item";
import styles from "../DetailsPanel.module.css";

type DetailsPanelContentProps = {
  detailImage: string | null;
  detailIndex: number;
  detailImageCount: number;
  item: Item;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onWheel: (event: WheelEvent<HTMLDivElement>) => void;
  panelRef: RefObject<HTMLDivElement | null>;
};

export default function DetailsPanelContent({
  detailImage,
  detailIndex,
  detailImageCount,
  item,
  onClose,
  onNext,
  onPrevious,
  onWheel,
  panelRef,
}: DetailsPanelContentProps) {
  const hasMultipleImages = detailImageCount > 1;

  return (
    <aside ref={panelRef} className={styles.panel} onWheel={onWheel}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close details"
        className={styles.closeButton}
      >
        x
      </button>

      <div className={styles.imageViewport}>
        {detailImage ? (
          <img
            key={`${item.id}-${detailIndex}`}
            src={detailImage}
            alt={`${item.name} detail ${detailIndex + 1}`}
            className={styles.detailImage}
          />
        ) : null}
      </div>

      <h2 className={styles.itemName}>{item.name}</h2>

      {hasMultipleImages ? (
        <div className={styles.carouselControls}>
          <button
            type="button"
            onClick={onPrevious}
            aria-label="Previous image"
            className={`${styles.carouselArrow} ${styles.carouselArrowPrevious}`}
          >
            <ChevronLeft size={24} strokeWidth={1.8} />
          </button>

          <div className={styles.carouselTracker} aria-label={`Image ${detailIndex + 1} of ${detailImageCount}`}>
            {Array.from({ length: detailImageCount }).map((_, index) => (
              <span
                key={index}
                className={`${styles.carouselDot} ${
                  index === detailIndex ? styles.carouselDotActive : ""
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onNext}
            aria-label="Next image"
            className={`${styles.carouselArrow} ${styles.carouselArrowNext}`}
          >
            <ChevronRight size={24} strokeWidth={1.8} />
          </button>
        </div>
      ) : null}

      <a
        href={item.shopify}
        className={styles.purchaseButton}
        aria-label={`View and purchase ${item.name}`}
      >
        View &amp; Purchase
      </a>
    </aside>
  );
}
