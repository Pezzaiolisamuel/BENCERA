import ImagePreviewList from "./ImagePreviewList";

type ExistingImageListProps = {
  onRemove: (index: number) => void;
  urls: string[];
};

export default function ExistingImageList({ onRemove, urls }: ExistingImageListProps) {
  return (
    <ImagePreviewList
      images={urls.map((url) => ({ url }))}
      onRemove={onRemove}
      removeAriaLabel="Remove existing image"
    />
  );
}
