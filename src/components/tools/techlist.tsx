'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CardSkeleton, ScreenReaderLoading, Skeleton } from '@/components/skeleton';
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
const skeletons = Array.from({length: 18});

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
  const [mounted, setMounted] = useState(false);
  const tutorial = youtubeEmbedUrl(entry.tutorialUrl);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTab('overview');
  }, [entry.name]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', close);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', close);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal((
    <div className="tt-modal tech-modal" role="dialog" aria-modal="true" aria-label={entry.name}>
      <button className="tt-scrim" type="button" aria-label="Close" onClick={onClose} />
      <section className="tt-dialog tech-dialog">
        <header className="tt-dialog__head">
          <div>
            <span>{kindLabels[entry.kind]}</span>
            <h2>{entry.name}</h2>
          </div>
          <button className="tt-close" type="button" aria-label="Close" onClick={onClose} autoFocus><span className="tt-close__icon" /></button>
        </header>

        {tutorial ? (
          <div className="tt-tabs" role="tablist" aria-label="Tech list tabs">
            <button className={tab === 'overview' ? 'is-on' : ''} type="button" aria-pressed={tab === 'overview'} onClick={() => setTab('overview')}>Overview</button>
            <button className={tab === 'tutorial' ? 'is-on' : ''} type="button" aria-pressed={tab === 'tutorial'} onClick={() => setTab('tutorial')}>Tutorial</button>
          </div>
        ) : null}

        {tab === 'overview' ? (
          <div className="tech-overview">
            {entry.steps.length ? (
              <div className="tech-steps">
                {entry.steps.map((step, index) => {
                  const item = parseStep(step);
                  const match = findStepEntry(entries, item.label);

                  return (
                    <span className="tech-step-wrap" key={`${step}-${index}`}>
                      <button
                        className={`tech-step${item.optional ? ' is-optional' : ''}`}
                        type="button"
                        onClick={() => {
                          if (match) onPick(match);
                        }}
                      >
                        <span>{item.label}</span>
                        {item.optional ? <small>optional</small> : null}
                      </button>
                      {index < entry.steps.length - 1 ? <span className="tech-arrow" aria-hidden="true">&rarr;</span> : null}
                    </span>
                  );
                })}
              </div>
            ) : null}

            <Preview entry={entry} />

            {entry.aliases.length ? (
              <section className="tech-aliases">
                <h3>Aliases</h3>
                <div>
                  {entry.aliases.map((alias) => <span key={alias}>{alias}</span>)}
                </div>
              </section>
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
      </section>
    </div>
  ), document.body);
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
            <button className={filter === item ? 'is-on' : ''} type="button" aria-pressed={filter === item} key={item} onClick={() => setFilter(item)}>
              {filterLabels[item]}
            </button>
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
          <button className="tech-card" type="button" key={entry.name} onClick={() => setSelected(entry)}>
            <CardPreview entry={entry} />
            <span className="tech-card__body">
              <strong>{entry.name}</strong>
              {matchedAlias ? <small>matched: {matchedAlias}</small> : null}
            </span>
          </button>
        )) : null}
        {!loading && shown.revealing ? skeletons.slice(0, 6).map((_, index) => <CardSkeleton className="tech-card" key={`more-${index}`} />) : null}
        {!loading && shown.hasMore ? <div className="skeleton-sentinel" ref={shown.sentinelRef} aria-hidden="true" /> : null}
      </section>

      {selected ? <TechModal entry={selected} entries={entries} onClose={() => setSelected(null)} onPick={setSelected} /> : null}
    </div>
  );
}
