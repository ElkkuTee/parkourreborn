'use client';

import { useState } from 'react';
import MapViewer from '@/components/community/mapview';

type MapCardProps = {
  image: string;
};

export default function MapCard({ image }: MapCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <section className="map-card">
        <button className="map-card__open" type="button" aria-label="Open fullscreen map" onClick={() => setOpen(true)}>
          Fullscreen
        </button>
        <img src={image} alt="Parkour Reborn world map" />
      </section>
      <MapViewer image={image} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
