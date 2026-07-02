'use client';

import { useState } from 'react';
import MapViewer from '@/components/community/mapview';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type MapCardProps = {
  image: string;
};

export default function MapCard({ image }: MapCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Card className="map-card">
        <Button className="map-card__open" type="button" aria-label="Open fullscreen map" onClick={() => setOpen(true)}>
          Fullscreen
        </Button>
        <img src={image} alt="PARKOUR Reborn world map" />
      </Card>
      <MapViewer image={image} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
