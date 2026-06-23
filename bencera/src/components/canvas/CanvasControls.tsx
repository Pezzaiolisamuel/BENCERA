type CanvasControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export default function CanvasControls({ onZoomIn, onZoomOut }: CanvasControlsProps) {
  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 9999,
      }}
    >
      <button
        onClick={onZoomIn}
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(0,0,0,0.55)",
          color: "white",
          fontSize: 18,
          lineHeight: "44px",
        }}
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={onZoomOut}
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(0,0,0,0.55)",
          color: "white",
          fontSize: 18,
          lineHeight: "44px",
        }}
        aria-label="Zoom out"
      >
        −
      </button>
    </div>
  );
}
