import styles from "../DetailsPanel.module.css";

type DetailsPanelBackdropProps = {
  onClose: () => void;
};

export default function DetailsPanelBackdrop({ onClose }: DetailsPanelBackdropProps) {
  return (
    <button
      type="button"
      className={styles.backdrop}
      onClick={onClose}
      aria-label="Close details"
    />
  );
}
