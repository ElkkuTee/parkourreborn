'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export function useProgressiveList<T>(items: T[], resetKey: string, initialVisible = 18, batchSize = 18) {
  const [visibleCount, setVisibleCount] = useState(initialVisible);
  const [revealing, setRevealing] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const hasMore = visibleCount < items.length;
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setVisibleCount(initialVisible);
    setRevealing(false);
  }, [initialVisible, resetKey]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!hasMore || revealing) return;

    const node = sentinelRef.current;
    if (!node) return;

    if (!('IntersectionObserver' in window)) {
      setVisibleCount(items.length);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || timer.current) return;

      setRevealing(true);
      timer.current = window.setTimeout(() => {
        setVisibleCount((current) => Math.min(current + batchSize, items.length));
        setRevealing(false);
        timer.current = null;
      }, 160);
    }, {rootMargin: '420px 0px'});

    observer.observe(node);
    return () => observer.disconnect();
  }, [batchSize, hasMore, items.length, revealing]);

  return {
    hasMore,
    revealing,
    sentinelRef,
    visibleItems,
  };
}

export function useInView<T extends Element>(rootMargin = '220px 0px') {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {rootMargin});
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return [ref, inView] as const;
}
