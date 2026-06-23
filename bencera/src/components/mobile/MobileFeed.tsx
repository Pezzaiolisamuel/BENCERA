import type { Item } from "@/types/item";
import type { FeedTile, MobileStyles } from "./mobile-helpers";
import MobileCatalogTile from "./MobileCatalogTile";

type MobileFeedProps = {
  onSelectItem: (item: Item) => void;
  styles: MobileStyles;
  tiles: FeedTile[];
};

export default function MobileFeed({ onSelectItem, styles, tiles }: MobileFeedProps) {
  return (
    <main className={styles.grid}>
      {tiles.map(({ key, item }) => (
        <MobileCatalogTile
          key={key}
          className={styles.itemTile}
          item={item}
          onSelectItem={onSelectItem}
          styles={styles}
        />
      ))}
    </main>
  );
}
