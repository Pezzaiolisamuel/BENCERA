type PreviewImage = { url: string };

type ImagePreviewListProps = {
  images: PreviewImage[];
  onRemove: (index: number) => void;
  removeAriaLabel?: string;
};

export default function ImagePreviewList({
  images,
  onRemove,
  removeAriaLabel = "Remove image",
}: ImagePreviewListProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
      {images.map((image, index) => (
        <div
          key={`${image.url}-${index}`}
          style={{
            position: "relative",
            width: 66,
            height: 66,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.10)",
            background: "rgba(255,255,255,0.9)",
          }}
        >
          <img src={image.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <button
            type="button"
            onClick={() => onRemove(index)}
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              background: "rgba(0,0,0,0.75)",
              color: "white",
              border: "none",
              borderRadius: 999,
              width: 22,
              height: 22,
              cursor: "pointer",
              lineHeight: "22px",
              textAlign: "center",
              fontWeight: 800,
            }}
            aria-label={removeAriaLabel}
            title="Remove"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}
