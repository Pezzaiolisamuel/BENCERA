import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { Item } from "@/types/item";
import mapStyles from "@/app/mobilehome/page.module.css";
import type { MapTile, MobileStyles } from "./mobile-helpers";
import MobileCatalogTile from "./MobileCatalogTile";

export const mapZoomLevels = [0.78, 1, 1.24] as const;

type MobileMapProps = {
  mapZoomIndex: number;
  onSelectItem: (item: Item) => void;
  setMapZoomIndex: Dispatch<SetStateAction<number>>;
  styles: MobileStyles;
  tiles: MapTile[];
};

export default function MobileMap({
  mapZoomIndex,
  onSelectItem,
  setMapZoomIndex,
  styles,
  tiles,
}: MobileMapProps) {
  const zoomMapIn = () => {
    setMapZoomIndex((currentIndex) => Math.min(currentIndex + 1, mapZoomLevels.length - 1));
  };

  const zoomMapOut = () => {
    setMapZoomIndex((currentIndex) => Math.max(currentIndex - 1, 0));
  };

  return (
    <>
      <main
        className={mapStyles.map}
        style={{ "--map-zoom": mapZoomLevels[mapZoomIndex] } as CSSProperties}
      >
        {tiles.map(({ key, item, style, variant }) => (
          <MobileCatalogTile
            key={key}
            className={`${styles.itemTile} ${mapStyles[`tileVariant${variant}`]}`}
            item={item}
            onSelectItem={onSelectItem}
            style={style}
            styles={styles}
          />
        ))}
      </main>

      <div className={mapStyles.zoomControls} aria-label="Map zoom controls">
        <button
          type="button"
          className={mapStyles.zoomButton}
          onClick={zoomMapOut}
          disabled={mapZoomIndex === 0}
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          type="button"
          className={mapStyles.zoomButton}
          onClick={zoomMapIn}
          disabled={mapZoomIndex === mapZoomLevels.length - 1}
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
    </>
  );
}
