import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Hook điều khiển carousel (slider) với autoplay, pause-on-hover/focus,
 * tạm dừng khi tab ẩn, hỗ trợ vuốt (touch/swipe) và điều hướng bằng bàn phím.
 *
 * @param {object} options
 * @param {number} options.length - tổng số slide
 * @param {number} [options.interval=5500] - chu kỳ autoplay (ms)
 * @param {boolean} [options.autoplay=true]
 * @param {boolean} [options.loop=true]
 * @param {boolean} [options.pauseOnHover=true]
 * @param {boolean} [options.pauseOnFocus=true]
 * @returns {{
 *   index: number,
 *   isPlaying: boolean,
 *   isPaused: boolean,
 *   next: () => void,
 *   prev: () => void,
 *   goTo: (i: number) => void,
 *   setPaused: (v: boolean) => void,
 *   handlers: { onMouseEnter: Function, onMouseLeave: Function, onFocusCapture: Function, onBlurCapture: Function, onTouchStart: Function, onTouchEnd: Function, onKeyDown: Function }
 * }}
 */
export function useCarousel({
  length,
  interval = 5500,
  autoplay = true,
  loop = true,
  pauseOnHover = true,
  pauseOnFocus = true,
}) {
  const total = Math.max(0, length || 0);
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  const reducedMotion = useReducedMotion();
  const touchStartX = useRef(null);

  const goTo = useCallback(
    (nextIndex) => {
      if (total === 0) return;
      if (loop) {
        setIndex(((nextIndex % total) + total) % total);
      } else {
        setIndex(Math.min(Math.max(nextIndex, 0), total - 1));
      }
    },
    [loop, total],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Autoplay chỉ chạy khi: có slide, bật autoplay, không reduced-motion,
  // người dùng chưa pause, không hover, không focus trong vùng, tab đang hiển thị.
  const isPaused =
    userPaused ||
    hovered ||
    focused ||
    tabHidden ||
    reducedMotion ||
    !autoplay ||
    total <= 1;

  const isPlaying = !isPaused;

  useEffect(() => {
    if (isPaused || total <= 1) return undefined;
    const timer = setTimeout(() => {
      setIndex((current) => (loop ? (current + 1) % total : Math.min(current + 1, total - 1)));
    }, interval);
    return () => clearTimeout(timer);
  }, [isPaused, interval, total, loop]);

  // Dừng autoplay khi tab bị ẩn
  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Giữ index hợp lệ khi danh sách slide thay đổi
  useEffect(() => {
    if (index > total - 1) setIndex(0);
  }, [index, total]);

  const onKeyDown = useCallback(
    (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        next();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        prev();
      } else if (event.key === 'Home') {
        event.preventDefault();
        goTo(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        goTo(total - 1);
      }
    },
    [next, prev, goTo, total],
  );

  const handlers = {
    onMouseEnter: () => pauseOnHover && setHovered(true),
    onMouseLeave: () => pauseOnHover && setHovered(false),
    onFocusCapture: () => pauseOnFocus && setFocused(true),
    onBlurCapture: (event) => {
      if (pauseOnFocus && !event.currentTarget.contains(event.relatedTarget)) {
        setFocused(false);
      }
    },
    onTouchStart: (event) => {
      touchStartX.current = event.touches?.[0]?.clientX ?? null;
    },
    onTouchEnd: (event) => {
      if (touchStartX.current === null) return;
      const endX = event.changedTouches?.[0]?.clientX ?? null;
      if (endX === null) return;
      const delta = endX - touchStartX.current;
      touchStartX.current = null;
      const threshold = 45;
      if (Math.abs(delta) < threshold) return;
      if (delta < 0) next();
      else prev();
    },
    onKeyDown,
  };

  return {
    index,
    isPlaying,
    isPaused,
    next,
    prev,
    goTo,
    setPaused: setUserPaused,
    handlers,
  };
}

export default useCarousel;
