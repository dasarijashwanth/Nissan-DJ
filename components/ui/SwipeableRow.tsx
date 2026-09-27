"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";

const SWIPE_THRESHOLD = 88;
const MAX_DRAG = 140;

/**
 * Wraps a <tr> with a left-swipe-to-delete gesture (mobile's standard list-delete pattern).
 * Renders a `<tr>` itself (not a wrapping element) so it stays valid directly under a `<tbody>`.
 * Pointer events (not touch/mouse separately) so the same code handles touch, mouse, and pen.
 */
export function SwipeableRow({
  onDelete,
  children,
  className,
}: {
  onDelete: () => void;
  children: ReactNode;
  className?: string;
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);

  function handlePointerDown(e: PointerEvent<HTMLTableRowElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX.current = e.clientX;
    setDragging(true);
  }

  function handlePointerMove(e: PointerEvent<HTMLTableRowElement>) {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    // Only track leftward drags (negative delta); clamp so the row can't fly off past MAX_DRAG.
    setDragX(Math.max(-MAX_DRAG, Math.min(0, delta)));
  }

  function endDrag() {
    if (startX.current === null) return;
    startX.current = null;
    setDragging(false);
    if (Math.abs(dragX) >= SWIPE_THRESHOLD) {
      onDelete();
    }
    setDragX(0);
  }

  const revealProgress = Math.min(1, Math.abs(dragX) / SWIPE_THRESHOLD);

  return (
    <tr
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => dragging && endDrag()}
      className={className}
      style={{
        transform: `translateX(${dragX}px)`,
        transition: dragging ? "none" : "transform 0.2s ease",
        backgroundColor: revealProgress > 0 ? `rgba(239, 68, 68, ${revealProgress * 0.12})` : undefined,
        touchAction: "pan-y",
      }}
    >
      {children}
    </tr>
  );
}
