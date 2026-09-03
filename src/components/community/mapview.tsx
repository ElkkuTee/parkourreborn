'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogPortal, DialogTitle } from '@/components/ui/dialog';

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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const drag = useRef<Point | null>(null);
  const pinch = useRef<{ distance: number; zoom: number; pan: Point; center: Point } | null>(null);
  const ready = size.width > 16 && size.height > 16 && natural.width > 0 && natural.height > 0;

  const fit = useMemo(() => {
    if (!ready) return 1;
    const widthFit = (size.width - 32) / natural.width;
    const heightFit = (size.height - 96) / natural.height;
    return Math.max(0.001, Math.min(widthFit, heightFit, 1));
  }, [natural.height, natural.width, ready, size.height, size.width]);

  const clampPan = useCallback((next: Point, nextZoom = zoom) => {
    const mapWidth = natural.width * nextZoom;
    const mapHeight = natural.height * nextZoom;
    const maxX = Math.max(0, (mapWidth - size.width) / 2 + 80);
    const maxY = Math.max(0, (mapHeight - size.height) / 2 + 80);
    return { x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
  }, [natural.height, natural.width, size.height, size.width, zoom]);

  const setClampedZoom = useCallback((next: number) => {
    const value = clamp(next, fit, maxZoom);
    setZoom(value);
    setPan((current) => clampPan(current, value));
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
    if (!rect) return { x: 0, y: 0 };
    return { x: point.x - rect.left - rect.width / 2, y: point.y - rect.top - rect.height / 2 };
  }, []);

  const measure = useCallback(() => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) setSize({ width: rect.width, height: rect.height });

    const img = imageRef.current;
    if (img?.naturalWidth && img.naturalHeight) setNatural({ width: img.naturalWidth, height: img.naturalHeight });
  }, []);

  const reset = useCallback(() => {
    if (!ready) return;
    setZoom(fit);
    setPan({ x: 0, y: 0 });
  }, [fit, ready]);

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      modalRef.current?.focus();
      measure();
      requestAnimationFrame(measure);
    });

    const timer = window.setTimeout(measure, 80);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previous;
    };
  }, [measure, open]);

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

    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    if (stageRef.current) observer?.observe(stageRef.current);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure, open]);

  useEffect(() => {
    if (open && ready) reset();
  }, [open, ready, reset]);

  useEffect(() => {
    if (open) return;
    pointers.current.clear();
    drag.current = null;
    pinch.current = null;
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoomAt(zoom * (event.deltaY > 0 ? 0.9 : 1.1), pointInStage({ x: event.clientX, y: event.clientY }));
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [open, pointInStage, setZoomAt, zoom]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);

    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      pinch.current = {
        distance: distance(a, b),
        zoom,
        pan,
        center: pointInStage({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }),
      };
      drag.current = null;
    } else {
      drag.current = { x: point.x - pan.x, y: point.y - pan.y };
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = { x: event.clientX, y: event.clientY };
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, point);

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = Array.from(pointers.current.values());
      const center = pointInStage({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      const nextZoom = pinch.current.zoom * (distance(a, b) / pinch.current.distance);
      const centerDrift = { x: center.x - pinch.current.center.x, y: center.y - pinch.current.center.y };
      const nextPan = { x: pinch.current.pan.x + centerDrift.x, y: pinch.current.pan.y + centerDrift.y };
      setZoomAt(nextZoom, center, pinch.current.zoom, nextPan);
      return;
    }

    if (drag.current) setPan(clampPan({ x: point.x - drag.current.x, y: point.y - drag.current.y }));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    pinch.current = null;
    drag.current = null;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!next) onClose();
    }}>
      <DialogPortal>
        <DialogPrimitive.Content className="map-modal" aria-label="Map viewer" ref={modalRef} tabIndex={-1}>
          <div className="tt-dialog__head map-modal__bar">
            <DialogTitle asChild><h2>Map</h2></DialogTitle>
            <div className="map-modal__tools">
              <Button type="button" onClick={() => setClampedZoom(zoom * 1.18)}>Zoom In</Button>
              <Button type="button" onClick={() => setClampedZoom(zoom / 1.18)}>Zoom Out</Button>
              <Button type="button" onClick={reset}>Reset</Button>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <DialogClose asChild>
              <Button className="tt-close" type="button" aria-label="Close map">
                <span className="tt-close__icon" />
              </Button>
            </DialogClose>
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
              ref={imageRef}
              src={image}
              alt="PARKOUR Reborn world map"
              draggable={false}
              onLoad={measure}
              style={{ transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
