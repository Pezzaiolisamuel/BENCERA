export type Focus = {
  x: number;
  y: number;
  scale: number;
};

export type ItemLayout = {
  size: number;
  cx: number;
  cy: number;
};

export type CanvasDragState = {
  active: boolean;
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  vx: number;
  vy: number;
  moved: boolean;
};
