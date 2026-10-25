"use client";
import { useEffect, useRef } from "react";

/** Apple's momentum projection: where a flick with this velocity would come to rest. */
export function project(velocityPxPerSecond: number, deceleration = 0.998) {
  return (velocityPxPerSecond / 1000) * deceleration / (1 - deceleration);
}

/** Progressive resistance past a boundary, so the sheet feels responsive but "there's nothing more here". */
function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * Drag-to-dismiss for the phone bottom sheet.
 *  - Pointer Events with capture, 1:1 tracking that respects where the sheet was grabbed.
 *  - Grabbing a moving sheet continues from its live on-screen position (interruptible).
 *  - On release the dismiss decision uses the velocity-projected resting point, and the animation
 *    starts from the current position (no jump).
 * Only elements marked [data-sheet-handle] start a drag, so the scrolling body is never hijacked.
 */
export function useSheetDrag(paper: HTMLElement | null, onClose: () => void, busy: boolean) {
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  closeRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    if (!paper) return;
    const sheet = paper;
    const mobile = window.matchMedia("(max-width: 599.95px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pointer = -1;
    let startY = 0;
    let base = 0;
    let offset = 0;
    let samples: { y: number; t: number }[] = [];
    let animation: Animation | null = null;

    const liveOffset = () => new DOMMatrixReadOnly(getComputedStyle(sheet).transform).m42 || 0;

    function down(event: PointerEvent) {
      if (!mobile.matches || reduce.matches || busyRef.current || pointer !== -1) return;
      const target = event.target as Element;
      if (!target.closest("[data-sheet-handle]") || target.closest("button, a, input, textarea, select")) return;
      if (!event.isPrimary || event.button !== 0) return;
      // Prevent native text/image dragging from cancelling the sheet gesture.
      event.preventDefault();
      base = liveOffset();
      animation?.cancel();
      animation = null;
      sheet.style.animation = "none";
      sheet.style.transform = `translateY(${base}px)`;
      pointer = event.pointerId;
      startY = event.clientY;
      offset = base;
      samples = [{ y: event.clientY, t: event.timeStamp }];
      sheet.setPointerCapture(pointer);
    }
    function move(event: PointerEvent) {
      if (event.pointerId !== pointer) return;
      let next = base + (event.clientY - startY);
      if (next < 0) next = -rubberband(-next, sheet.offsetHeight);
      offset = next;
      sheet.style.transform = `translateY(${next}px)`;
      samples.push({ y: event.clientY, t: event.timeStamp });
      samples = samples.filter(s => event.timeStamp - s.t <= 100);
    }
    function up(event: PointerEvent) {
      if (event.pointerId !== pointer) return;
      pointer = -1;
      if (sheet.hasPointerCapture(event.pointerId)) sheet.releasePointerCapture(event.pointerId);
      samples.push({ y: event.clientY, t: event.timeStamp });
      samples = samples.filter(s => event.timeStamp - s.t <= 100);
      const first = samples[0];
      const last = samples[samples.length - 1] ?? first;
      const velocity = first && last && last.t > first.t ? ((last.y - first.y) / (last.t - first.t)) * 1000 : 0;
      const height = sheet.offsetHeight;
      const dismiss = event.type !== "pointercancel" && !busyRef.current && offset + project(velocity) > height * 0.5;
      const from = `translateY(${offset}px)`;
      const to = dismiss ? `translateY(${height + 40}px)` : "translateY(0px)";
      animation = sheet.animate([{ transform: from }, { transform: to }], { duration: dismiss ? 240 : 320, easing: "cubic-bezier(0.2, 0.9, 0.25, 1)", fill: "forwards" });
      sheet.style.transform = to;
      animation.finished.then(() => {
        if (dismiss && !busyRef.current) closeRef.current();
        else if (dismiss) { sheet.style.transform = ""; animation?.cancel(); animation = null; }
        else { sheet.style.transform = ""; animation?.cancel(); animation = null; }
      }).catch(() => undefined);
    }

    sheet.addEventListener("pointerdown", down);
    sheet.addEventListener("pointermove", move);
    sheet.addEventListener("pointerup", up);
    sheet.addEventListener("pointercancel", up);
    return () => {
      sheet.removeEventListener("pointerdown", down);
      sheet.removeEventListener("pointermove", move);
      sheet.removeEventListener("pointerup", up);
      sheet.removeEventListener("pointercancel", up);
      animation?.cancel();
    };
  }, [paper]);
}
