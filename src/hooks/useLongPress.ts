"use client"

import { useCallback, useRef } from "react";

interface UseLongPressOptions {
  shouldPreventDefault?: boolean;
  delay?: number;
}

export interface LongPressEventData {
  event: React.TouchEvent | React.MouseEvent;
  x: number;
  y: number;
}

export function useLongPress(
  onLongPress: (data: LongPressEventData) => void,
  onClick?: () => void,
  { shouldPreventDefault = true, delay = 500 }: UseLongPressOptions = {}
) {
  const timeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const target = useRef<EventTarget | null>(null);
  const isLongPressTriggered = useRef<boolean>(false);
  const isScrolling = useRef<boolean>(false);
  const startPos = useRef<{ x: number, y: number } | null>(null);

  const getCoords = (e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if ('clientX' in e) {
      return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
    }
    return { x: 0, y: 0 };
  };

  const start = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      isLongPressTriggered.current = false;
      isScrolling.current = false;
      startPos.current = getCoords(e);
      
      if (shouldPreventDefault && e.target) {
        e.target.addEventListener("touchend", preventDefault, { passive: false });
        target.current = e.target;
      }
      
      timeout.current = setTimeout(() => {
        if (!isScrolling.current) {
          isLongPressTriggered.current = true;
          const { x, y } = getCoords(e);
          onLongPress({ event: e, x, y });
        }
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault]
  );

  const move = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (isScrolling.current || !startPos.current) return;
      const { x, y } = getCoords(e);
      
      if (Math.abs(x - startPos.current.x) > 10 || Math.abs(y - startPos.current.y) > 10) {
        isScrolling.current = true;
        if (timeout.current) clearTimeout(timeout.current);
      }
    },
    []
  );

  const clear = useCallback(
    (e: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
      if (timeout.current) clearTimeout(timeout.current);
      
      if (shouldTriggerClick && onClick && !isLongPressTriggered.current && !isScrolling.current) {
        onClick();
      }
      
      if (shouldPreventDefault && target.current) {
        target.current.removeEventListener("touchend", preventDefault);
      }
      
      startPos.current = null;
    },
    [shouldPreventDefault, onClick]
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseMove: (e: React.MouseEvent) => move(e),
    onTouchMove: (e: React.TouchEvent) => move(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchEnd: (e: React.TouchEvent) => clear(e),
  };
}

const isTouchEvent = (e: Event): e is TouchEvent => {
  return "touches" in e;
};

const preventDefault = (e: Event) => {
  if (!isTouchEvent(e)) return;
  if (e.touches.length < 2 && e.preventDefault) {
    e.preventDefault();
  }
};
