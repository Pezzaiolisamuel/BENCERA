import type { RefObject } from "react";
import styles from "../DetailsPanel.module.css";

type DetailsPanelPreviewProps = {
  aboveImage: string | null;
  aboveImageRef: RefObject<HTMLImageElement | null>;
  previewRef: RefObject<HTMLDivElement | null>;
};

export default function DetailsPanelPreview({
  aboveImage,
  aboveImageRef,
  previewRef,
}: DetailsPanelPreviewProps) {
  if (!aboveImage) return null;

  return (
    <div ref={previewRef} className={styles.previewWrap} aria-hidden="true">
      <img ref={aboveImageRef} src={aboveImage} alt="" className={styles.previewImage} />
    </div>
  );
}
