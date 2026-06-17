'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type MapViewerProps = {
  image: string;
  open: boolean;
  onClose: () => void;
};

type Point = {
  x: number;
  y: number;
};

const maxZoom = 8;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export default function MapViewer({ image, open, onClose }: MapViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({x: 0, y: 0});
  const [size, setSize] = useState({width: 1, height: 1});
  const [natural, setNatural] = useState({width: 1, height: 1});
  const modalRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const drag = useRef<Point | null>(null);
  const pinch = useRef<{ distance: number; zoom: number; pan: Point; center: Point } | null>(null);

  const fit = useMemo(() => {
    const widthFit = (size.width - 32) / natural.width;
    const heightFit = (size.height - 96) / natural.height;
    return Math.max(0.001, Math.min(widthFit, heightFit, 1));
  }, [natural.height, natural.width, size.height, size.width]);

  const clampPan = useCallback((next: Point, nextZoom = zoom) => {
    const mapWidth = natural.width * nextZoom;
    const mapHeight = natural.height * nextZoom;
    const maxX = Math.max(0, (mapWidth - size.width) / 2 + 80);
    const maxY = Math.max(0, (mapHeight - size.height) / 2 + 80);
    return {x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY)};
  }, [natural.height, natural.width, size.height, size.width, zoom]);

  const setClampedZoom = useCallback((next: number) => {
    setZoom((current) => {
      const value = clamp(next, fit, maxZoom);
      setPan((currentPan) => clampPan(currentPan, value));
      return value;
    });
  }, [clampPan, fit]);

  const setZoomAt = useCallback((next: number, anchor: Point, startZoom = zoom, startPan = pan) => {
    const value = clamp(next, fit, maxZoom);
    const ratio = value / startZoom;
    const nextPan = {
      x: anchor.x - (anchor.x - startPan.x) * ratio,
      y: anchor.y - (anchor.y - startPan.y) * ratio,
    };

    setZoom(value);
    setPan(clampPan(nextPan, value));
  }, [clampPan, fit, pan, zoom]);

  const pointInStage = useCallback((point: Point) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return {x: 0, y: 0};
    return {x: point.x - rect.left - rect.width / 2, y: point.y - rect.top - rect.height / 2};
  }, []);

  const reset = useCallback(() => {
    setZoom(fit);
    setPan({x: 0, y: 0});
  }, [fit]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => modalRef.current?.focus());

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;

      const focusable = modalRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;

    const update = () => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (rect) setSize({width: rect.width, height: rect.height});
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [open]);

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;

    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoomAt(zoom * (event.deltaY > 0 ? 0.9 : 1.1), pointInStage({x: event.clientX, y: event.clientY}));
    };

    stage.addEventListener('wheel', onWheel, {passive: false});
    return () => stage.removeEventListener('wheel', onWheel);
  }, [open, pointInStage, setZoomAt, zoom]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = {x: event.clientX, y: event.clientY};
    pointers.current.set(event.pointerId, point);

    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      pinch.current = {
        distance: distance(a, b),
        zoom,
        pan,
        center: pointInStage({x: (a.x + b.x) / 2, y: (a.y + b.y) / 2}),
      };
      drag.current = null;
    } else {
      drag.current = {x: point.x - pan.x, y: point.y - pan.y};
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = {x: event.clientX, y: event.clientY};
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, point);

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = Array.from(pointers.current.values());
      const center = pointInStage({x: (a.x + b.x) / 2, y: (a.y + b.y) / 2});
      const nextZoom = pinch.current.zoom * (distance(a, b) / pinch.current.distance);
      const centerDrift = {x: center.x - pinch.current.center.x, y: center.y - pinch.current.center.y};
      const nextPan = {x: pinch.current.pan.x + centerDrift.x, y: pinch.current.pan.y + centerDrift.y};
      setZoomAt(nextZoom, center, pinch.current.zoom, nextPan);
      return;
    }

    if (drag.current) setPan(clampPan({x: point.x - drag.current.x, y: point.y - drag.current.y}));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    pinch.current = null;
    drag.current = null;
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div className="map-modal" role="dialog" aria-modal="true" aria-label="Map viewer" ref={modalRef} tabIndex={-1}>
      <div className="map-modal__bar">
        <button type="button" onClick={() => setClampedZoom(zoom * 1.18)}>Zoom In</button>
        <button type="button" onClick={() => setClampedZoom(zoom / 1.18)}>Zoom Out</button>
        <button type="button" onClick={reset}>Reset</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button className="map-modal__close" type="button" aria-label="Close map" onClick={onClose}><span className="tt-close__icon" /></button>
      </div>
      <div
        className="map-modal__stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          src={image}
          alt="PARKOUR Reborn world map"
          draggable={false}
          onLoad={(event) => setNatural({width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight})}
          style={{transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`}}
        />
      </div>
    </div>,
    document.body
  );
}
