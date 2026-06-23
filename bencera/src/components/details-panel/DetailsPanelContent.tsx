import type { RefObject, WheelEvent } from "react";
import type { Item } from "@/types/item";
import styles from "../DetailsPanel.module.css";

type DetailsPanelContentProps = {
  detailImage: string | null;
  detailIndex: number;
  item: Item;
  onClose: () => void;
  onWheel: (event: WheelEvent<HTMLDivElement>) => void;
  panelRef: RefObject<HTMLDivElement | null>;
};

export default function DetailsPanelContent({
  detailImage,
  detailIndex,
  item,
  onClose,
  onWheel,
  panelRef,
}: DetailsPanelContentProps) {
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

      <a
        href={item.shopify}
        className={styles.purchaseButton}
        aria-label={`View more pictures of ${item.name}`}
      >
        MORE IMAGES
      </a>
    </aside>
  );
}
