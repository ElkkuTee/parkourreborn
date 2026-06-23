'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ScreenReaderLoading, Skeleton } from '@/components/skeleton';
import PageHero from '@/components/page-hero';
import { images } from '@/lib/assets';
import { fetchTimeTrials, fetchWorldRecords, trialKey, wrVideoURL } from '@/lib/pages/timetrials';
import type { TimeTrial, WorldRecord } from '@/lib/pages/timetrials';
import { cleanTimeInput, formatTime, parseTime } from '@/lib/pages/time';
import { calculateWasansScore, formatWasansScore } from '@/lib/pages/wasans';

type VideoMode = 'plat1' | 'plat2' | 'wr';
type Pbs = Record<string, string>;

const saveKey = 'timetrialhub-pbs';
const medals = [
  [images.elements.timetrials.bronze, 'Bronze', 'bronzeTime'],
  [images.elements.timetrials.silver, 'Silver', 'silverTime'],
  [images.elements.timetrials.gold, 'Gold', 'goldTime'],
  [images.elements.timetrials.platinum, 'Plat', 'platinumTime'],
] as const;

function rowScore(trial: TimeTrial, wr: WorldRecord | undefined, value: string) {
  const playerTime = parseTime(value);
  const bronzeTime = parseTime(trial.bronzeTime);
  const platinumTime = parseTime(trial.platinumTime);
  if (playerTime === null || playerTime === 0 || bronzeTime === null || platinumTime === null || !wr) return 0;
  if (playerTime >= bronzeTime) return 0;
  return calculateWasansScore({ playerTime, bronzeTime, platinumTime, worldRecordTime: wr.time }) ?? 0;
}

function invalidTime(trial: TimeTrial, value: string) {
  if (!value) return false;
  const playerTime = parseTime(value);
  const bronzeTime = parseTime(trial.bronzeTime);
  if (playerTime === null) return true;
  if (playerTime === 0 || bronzeTime === null) return false;
  return playerTime > bronzeTime;
}

const isTimeCell = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(target.closest('.tt-time'));

const rowSkeletons = Array.from({length: 24});

function EmbedVideo({ url }: { url: string }) {
  if (!url) return <div className="tt-empty">No video yet</div>;

  return (
    <iframe
      src={url}
      title="Platinum route"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

function RecordVideo({ url }: { url: string }) {
  if (!url) return <div className="tt-empty">No WR video yet</div>;
  return <video src={url} controls playsInline />;
}

function TrialModal({ trial, wr, onClose }: { trial: TimeTrial; wr?: WorldRecord; onClose: () => void }) {
  const [mode, setMode] = useState<VideoMode>('plat1');
  const [mounted, setMounted] = useState(false);
  const wrURL = wrVideoURL(wr?.submissionUuid ?? '');

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="tt-modal" role="dialog" aria-modal="true" aria-label={`${trial.name} route videos`}>
      <button className="tt-scrim" type="button" aria-label="Close" onClick={onClose} />
      <section className="tt-dialog">
        <header className="tt-dialog__head">
          <div>
            <span>{trial.district}</span>
            <h2>{trial.name}</h2>
            <small>{trial.difficulty}</small>
          </div>
          <button className="tt-close" type="button" aria-label="Close" onClick={onClose}><span className="tt-close__icon" /></button>
        </header>

        <div className="tt-tabs" role="tablist" aria-label="Route video">
          <button className={mode === 'plat1' ? 'is-on' : ''} type="button" aria-pressed={mode === 'plat1'} onClick={() => setMode('plat1')}>Plat 1</button>
          <button className={mode === 'plat2' ? 'is-on' : ''} type="button" aria-pressed={mode === 'plat2'} onClick={() => setMode('plat2')}>Plat 2</button>
          <button className={mode === 'wr' ? 'is-on' : ''} type="button" aria-pressed={mode === 'wr'} onClick={() => setMode('wr')}>WR</button>
        </div>

        <div className="tt-video">
          {mode === 'plat1' ? <EmbedVideo url={trial.videoURL} /> : null}
          {mode === 'plat2' ? <EmbedVideo url={trial.videoURL2} /> : null}
          {mode === 'wr' ? <RecordVideo url={wrURL} /> : null}
        </div>

        <footer className="tt-medals">
          {medals.map(([icon, label, key]) => (
            <div className="tt-medal" key={label}>
              <span className="tt-medal__icon" style={{backgroundImage: `url(${icon})`}} />
              <strong>{formatTime(trial[key])}</strong>
            </div>
          ))}
          <div className="tt-medal">
            <span className="tt-medal__icon" style={{backgroundImage: `url(${images.elements.timetrials.worldrecord})`}} />
            <strong>{wr ? formatTime(wr.time) : 'N/A'}</strong>
          </div>
        </footer>
      </section>
    </div>
  ), document.body);
}

function TrialRowsSkeleton() {
  return (
    <>
      {rowSkeletons.map((_, index) => (
        <div className="tt-row tt-row--skeleton" key={index} aria-hidden="true">
          <Skeleton className="tt-skeleton-cell tt-skeleton-cell--district" />
          <Skeleton className="tt-skeleton-cell tt-skeleton-cell--name" />
          <Skeleton className="tt-skeleton-cell tt-skeleton-cell--input" />
          <Skeleton className="tt-skeleton-cell tt-skeleton-cell--score" />
        </div>
      ))}
    </>
  );
}

export default function TimeTrialHub() {
  const [trials, setTrials] = useState<TimeTrial[]>([]);
  const [records, setRecords] = useState<Record<string, WorldRecord>>({});
  const [pbs, setPbs] = useState<Pbs>({});
  const [selected, setSelected] = useState<TimeTrial | null>(null);
  const [trialsLoading, setTrialsLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [trialsError, setTrialsError] = useState('');
  const [recordsError, setRecordsError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const rowPress = useRef<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(saveKey);
      if (saved) setPbs(JSON.parse(saved) as Pbs);
    } catch {}

    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchTimeTrials()
      .then(setTrials)
      .catch(() => setTrialsError('Firebase trials are unavailable right now.'))
      .finally(() => setTrialsLoading(false));

    fetchWorldRecords()
      .then(setRecords)
      .catch(() => setRecordsError('World records are unavailable right now.'))
      .finally(() => setRecordsLoading(false));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(saveKey, JSON.stringify(pbs));
  }, [loaded, pbs]);

  const scores = useMemo(() => trials.map((trial) => rowScore(trial, records[trialKey(trial.name)], pbs[trial.name] ?? '')), [pbs, records, trials]);
  const averageScore = trials.length ? scores.reduce((total, score) => total + score, 0) / trials.length : 0;

  const setPb = (name: string, value: string) => setPbs((current) => ({...current, [name]: value}));
  const cleanPb = (name: string) => setPbs((current) => ({...current, [name]: cleanTimeInput(current[name] ?? '')}));

  return (
    <div className="tt-page">
      <PageHero eyebrow="Tool" title="Time Trial Hub" image={images.backgrounds.tools.timetrialhub} />

      <section className="tt-summary">
        <div className="xp-result xp-result--big tt-average">
          <span>Average Wasans score</span>
          {recordsLoading ? <Skeleton className="tt-average-skeleton" /> : <strong>{formatWasansScore(averageScore)}</strong>}
        </div>
      </section>

      {recordsError ? <div className="tt-note">{recordsError}</div> : null}
      {trialsError ? <div className="tt-note tt-note--bad">{trialsError}</div> : null}

      <section className="tt-panel" aria-busy={trialsLoading || recordsLoading}>
        <div className="tt-table">
          <div className="tt-row tt-row--head">
            <span>District</span>
            <span>Trial</span>
            <span>Your Time</span>
            <span>Score</span>
          </div>

          {trialsLoading ? <ScreenReaderLoading>Loading trials...</ScreenReaderLoading> : null}
          {recordsLoading ? <ScreenReaderLoading>Loading world records...</ScreenReaderLoading> : null}
          {trialsLoading ? <TrialRowsSkeleton /> : null}
          {!trialsLoading && !trials.length && !trialsError ? <div className="tt-state">No trials found yet.</div> : null}

          {trials.map((trial) => {
            const wr = records[trialKey(trial.name)];
            const value = pbs[trial.name] ?? '';
            const score = rowScore(trial, wr, value);
            const invalid = invalidTime(trial, value);
            const waitingForWr = recordsLoading && !wr && (parseTime(value) ?? 0) > 0 && !invalid;
            const openRow = (event: React.MouseEvent<HTMLButtonElement>) => {
              if (rowPress.current !== trial.name || isTimeCell(event.target)) return;
              setSelected(trial);
            };

            return (
              <button
                className="tt-row"
                type="button"
                key={trial.name}
                onPointerDown={(event) => {
                  rowPress.current = isTimeCell(event.target) ? null : trial.name;
                }}
                onClick={openRow}
              >
                <span data-label="District">{trial.district}</span>
                <strong data-label="Trial">{trial.name}</strong>
                <label className="tt-time" data-label="Your Time" onClick={(event) => event.stopPropagation()}>
                  <input
                    value={value}
                    inputMode="decimal"
                    placeholder="0.000"
                    aria-label={`${trial.name} personal best`}
                    onChange={(event) => setPb(trial.name, event.target.value)}
                    onBlur={() => cleanPb(trial.name)}
                  />
                  {invalid ? <small>Invalid</small> : null}
                </label>
                <span className="tt-score" data-label="Score">{waitingForWr ? <Skeleton className="tt-score-skeleton" /> : formatWasansScore(score)}</span>
              </button>
            );
          })}
        </div>
      </section>

      {selected ? <TrialModal trial={selected} wr={records[trialKey(selected.name)]} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
