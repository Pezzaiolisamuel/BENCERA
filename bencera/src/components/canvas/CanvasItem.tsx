import type { RefObject } from "react";
import { getItemThumbnail } from "@/lib/item-images";
import type { Item } from "@/types/item";
import type { CanvasDragState, ItemLayout } from "./canvas-types";

type CanvasItemProps = {
  dragRef: RefObject<CanvasDragState>;
  index: number;
  isDragging: boolean;
  item: Item;
  layout: ItemLayout;
  onItemClick: (item: Item) => void;
};

export default function CanvasItem({
  dragRef,
  index,
  isDragging,
  item,
  layout,
  onItemClick,
}: CanvasItemProps) {
  const image = getItemThumbnail(item);

  return (
    <div
      className="item"
      data-idx={index}
      onClick={() => {
        if (dragRef.current.moved) return;
        onItemClick(item);
        dragRef.current.moved = false;
      }}
      style={{
        position: "absolute",
        cursor: isDragging ? "grabbing" : "grab",
        overflow: "visible",
        left: layout.cx,
        top: layout.cy,
        width: layout.size,
        height: layout.size,
      }}
    >
      <div className="itemReveal">
        <div className="itemInner">
          {image ? (
            <img
              src={image}
              alt={item.name}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.03)",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
