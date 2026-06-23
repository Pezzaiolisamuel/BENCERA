import React from "react";
import type { RefObject } from "react";
import type { Item } from "@/types/item";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./canvas-config";
import type { CanvasDragState, ItemLayout } from "./canvas-types";
import CanvasItem from "./CanvasItem";

type CanvasSurfaceProps = {
  dragRef: RefObject<CanvasDragState>;
  isDragging: boolean;
  items: Item[];
  itemLayouts: ItemLayout[];
  onItemClick: (item: Item) => void;
  ready: boolean;
};

const CanvasSurface = React.forwardRef<HTMLDivElement, CanvasSurfaceProps>(
  ({ dragRef, isDragging, items, itemLayouts, onItemClick, ready }, ref) => {
    return (
      <div
        className="canvas"
        ref={ref}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transformOrigin: "top left",
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        {ready &&
          items.map((item, index) => {
            const layout = itemLayouts[index];
            if (!layout) return null;

            return (
              <CanvasItem
                key={`${item.id}-${index}`}
                dragRef={dragRef}
                index={index}
                isDragging={isDragging}
                item={item}
                layout={layout}
                onItemClick={onItemClick}
              />
            );
          })}
      </div>
    );
  }
);

CanvasSurface.displayName = "CanvasSurface";
export default CanvasSurface;
