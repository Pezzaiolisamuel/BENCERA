import type { CSSProperties } from "react";
import type { Item } from "@/types/item";
import type { MobileStyles } from "./mobile-helpers";
import { getMobileHeroImage } from "./mobile-helpers";

type MobileCatalogTileProps = {
  className: string;
  item: Item;
  onSelectItem: (item: Item) => void;
  style?: CSSProperties;
  styles: MobileStyles;
};

export default function MobileCatalogTile({
  className,
  item,
  onSelectItem,
  style,
  styles,
}: MobileCatalogTileProps) {
  const heroImage = getMobileHeroImage(item);

  return (
    <button
      type="button"
      data-mobile-item
      onClick={() => onSelectItem(item)}
      className={className}
      style={style}
    >
      <div className={styles.itemMedia}>
        {heroImage ? (
          <img src={heroImage} alt={item.name} className={styles.itemImage} />
        ) : (
          <div className={styles.itemFallback}>No preview</div>
        )}
      </div>
      <div className={styles.itemName}>{item.name}</div>
    </button>
  );
}
