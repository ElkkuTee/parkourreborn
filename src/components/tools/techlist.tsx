'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CardSkeleton, ScreenReaderLoading, Skeleton } from '@/components/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DialogClose, DialogTitle } from '@/components/ui/dialog';
import { HubDialog, HubDialogContent } from '@/components/ui/hub-dialog';
import {
  fetchTechs,
  filterLabels,
  findStepEntry,
  kindLabels,
  parseStep,
  previewKind,
  searchTechs,
  youtubeEmbedUrl,
} from '@/lib/pages/techlist';
import type { MovementEntry, TechFilter } from '@/lib/pages/techlist';
import { useInView, useProgressiveList } from '@/lib/use-progressive-list';

type Tab = 'overview' | 'tutorial';

const filters: TechFilter[] = ['all', 'tech', 'concept', 'basic'];
const skeletons = Array.from({ length: 18 });

function Preview({ entry }: { entry: MovementEntry }) {
  const kind = previewKind(entry.videoUrl);
  if (kind === 'none') return null;

  return (
    <div className="tech-preview">
      {kind === 'video' ? <video src={entry.videoUrl} autoPlay muted loop playsInline /> : <img src={entry.videoUrl} alt={`${entry.name} preview`} />}
    </div>
  );
}

function CardPreview({ entry }: { entry: MovementEntry }) {
  const kind = previewKind(entry.videoUrl);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [wrapRef, inView] = useInView<HTMLSpanElement>();
  const [loaded, setLoaded] = useState(false);
  const active = kind === 'image' || inView || loaded;

  useEffect(() => {
    if (kind !== 'video' || !videoRef.current) return;

    if (inView && loaded) {
      void videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [inView, kind, loaded]);

  if (kind === 'none') return null;

  return (
    <span className={`tech-card__preview${loaded ? ' is-loaded' : ''}`} ref={wrapRef}>
      {!loaded ? <Skeleton className="card-media-skeleton" /> : null}
      {kind === 'video' && active ? (
        <video ref={videoRef} src={entry.videoUrl} muted loop playsInline preload={inView ? 'metadata' : 'none'} onLoadedData={() => setLoaded(true)} onError={() => setLoaded(true)} />
      ) : null}
      {kind === 'image' ? <img src={entry.videoUrl} alt="" loading="lazy" onLoad={() => setLoaded(true)} onError={() => setLoaded(true)} /> : null}
    </span>
  );
}

function TechModal({ entry, entries, onClose, onPick }: { entry: MovementEntry; entries: MovementEntry[]; onClose: () => void; onPick: (entry: MovementEntry) => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const tutorial = youtubeEmbedUrl(entry.tutorialUrl);

  useEffect(() => {
    setTab('overview');
  }, [entry.name]);

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <HubDialog onOpenChange={(next) => {
      if (!next) onClose();
    }}>
      <HubDialogContent className="tt-dialog tech-dialog" aria-label={entry.name}>
        <header className="tt-dialog__head">
          <div>
            <span>{kindLabels[entry.kind]}</span>
            <DialogTitle asChild>
              <h2>{entry.name}</h2>
            </DialogTitle>
          </div>
          <DialogClose asChild>
            <Button className="tt-close" type="button" aria-label="Close" autoFocus>
              <span className="tt-close__icon" />
            </Button>
          </DialogClose>
        </header>

        {tutorial ? (
          <div className="tt-tabs" role="tablist" aria-label="Tech list tabs">
            <Button className={tab === 'overview' ? 'is-on' : ''} type="button" role="tab" aria-selected={tab === 'overview'} onClick={() => setTab('overview')}>
              Overview
            </Button>
            <Button className={tab === 'tutorial' ? 'is-on' : ''} type="button" role="tab" aria-selected={tab === 'tutorial'} onClick={() => setTab('tutorial')}>
              Tutorial
            </Button>
          </div>
        ) : null}

        {tab === 'overview' ? (
          <div className="tech-overview">
            {entry.steps.length ? (
              <Card className="tech-steps">
                {entry.steps.map((step, index) => {
                  const item = parseStep(step);
                  const match = findStepEntry(entries, item.label);

                  return (
                    <span className="tech-step-wrap" key={`${step}-${index}`}>
                      <Button
                        className={`tech-step${item.optional ? ' is-optional' : ''}`}
                        type="button"
                        onClick={() => {
                          if (match) onPick(match);
                        }}
                      >
                        <span>{item.label}</span>
                        {item.optional ? <small>optional</small> : null}
                      </Button>
                      {index < entry.steps.length - 1 ? <span className="tech-arrow" aria-hidden="true">&rarr;</span> : null}
                    </span>
                  );
                })}
              </Card>
            ) : null}

            <Preview entry={entry} />

            {entry.aliases.length ? (
              <Card className="tech-aliases">
                <h3>Aliases</h3>
                <div>
                  {entry.aliases.map((alias) => <span key={alias}>{alias}</span>)}
                </div>
              </Card>
            ) : null}
          </div>
        ) : null}

        {tab === 'tutorial' && tutorial ? (
          <div className="tech-tutorial">
            <iframe
              src={tutorial}
              title={`${entry.name} tutorial`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : null}
      </HubDialogContent>
    </HubDialog>
  );
}

export default function TechList() {
  const [entries, setEntries] = useState<MovementEntry[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<TechFilter>('all');
  const [selected, setSelected] = useState<MovementEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const results = useMemo(() => searchTechs(entries, query, filter), [entries, filter, query]);
  const shown = useProgressiveList(results, `${query.trim().toLowerCase()}-${filter}-${entries.length}`);

  useEffect(() => {
    let alive = true;

    fetchTechs()
      .then((data) => {
        if (alive) setEntries(data);
      })
      .catch(() => {
        if (alive) setError('Tech list is unavailable right now.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="tech-page">
      <section className="tech-search">
        <label>
          <span>Search movement</span>
          <input value={query} placeholder="Search techs, concepts, basics, aliases, steps..." onChange={(event) => setQuery(event.target.value)} />
        </label>

        <div className="tech-filters" aria-label="Tech list filters">
          {filters.map((item) => (
            <Button className={filter === item ? 'is-on' : ''} type="button" aria-pressed={filter === item} key={item} onClick={() => setFilter(item)}>
              {filterLabels[item]}
            </Button>
          ))}
        </div>
      </section>

      {error ? <div className="tt-note tt-note--bad">{error}</div> : null}

      <section className="tech-results" aria-live="polite" aria-busy={loading || shown.revealing}>
        {loading ? <ScreenReaderLoading>Loading movement entries...</ScreenReaderLoading> : null}
        {shown.revealing ? <ScreenReaderLoading>Loading more movement entries...</ScreenReaderLoading> : null}
        {loading ? skeletons.map((_, index) => <CardSkeleton className="tech-card" key={index} />) : null}
        {!loading && !entries.length && !error ? <div className="tt-state">No movement entries found.</div> : null}
        {!loading && entries.length > 0 && !results.length ? <div className="tt-state">No entries matched your search.</div> : null}

        {!loading ? shown.visibleItems.map(({entry, matchedAlias}) => (
          <Button className="tech-card" type="button" key={entry.name} onClick={() => setSelected(entry)}>
            <CardPreview entry={entry} />
            <span className="tech-card__body">
              <strong>{entry.name}</strong>
              {matchedAlias ? <small>matched: {matchedAlias}</small> : null}
            </span>
          </Button>
        )) : null}
        {!loading && shown.revealing ? skeletons.slice(0, 6).map((_, index) => <CardSkeleton className="tech-card" key={`more-${index}`} />) : null}
        {!loading && shown.hasMore ? <div className="skeleton-sentinel" ref={shown.sentinelRef} aria-hidden="true" /> : null}
      </section>

      {selected ? <TechModal entry={selected} entries={entries} key={selected.name} onClose={() => setSelected(null)} onPick={setSelected} /> : null}
    </div>
  );
}
