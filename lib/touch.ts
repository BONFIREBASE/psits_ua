/**
 * Touch and pointer gesture utilities for motion components.
 */

export function capturePointer(element: HTMLElement, pointerId: number | null) {
  if (pointerId === null) return;
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // Ignore errors if pointer is already lost or uncaptured
  }
}

export const TOUCH_GESTURE_CONTENT_CLASS = "touch-pan-y select-none";
