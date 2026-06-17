'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchCommunityResources } from '@/lib/pages/search';
import type { CommunityResource, CommunityResourceType } from '@/lib/pages/search';

type TypeOption = {
  id: CommunityResourceType;
  label: string;
};

type ResourceModalProps = {
  item: CommunityResource;
  onClose: () => void;
};

const typeOptions: TypeOption[] = [
  {id: 'gif', label: 'GIFs'},
  {id: 'file', label: 'Files'},
  {id: 'link', label: 'Links'},
];

const labels: Record<CommunityResourceType, string> = {
  gif: 'GIF',
  file: 'File',
  link: 'Link',
};

const sortType = {gif: 0, file: 1, link: 2} satisfies Record<CommunityResourceType, number>;

function safeURL(link: string) {
  try {
    const url = new URL(link);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function ResourceModal({ item, onClose }: ResourceModalProps) {
  const [mounted, setMounted] = useState(false);
  const action = item.type === 'file' && item.downloadable ? 'Download' : 'Open';
  const canOpen = safeURL(item.link);

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
    <div className="tt-modal search-modal" role="dialog" aria-modal="true" aria-label={item.name}>
      <button className="tt-scrim" type="button" aria-label="Close" onClick={onClose} />
      <section className={`tt-dialog search-dialog search-dialog--${item.type}`}>
        <header className="tt-dialog__head">
          <div>
            <span>{labels[item.type]}</span>
            <h2>{item.name}</h2>
          </div>
          <button className="tt-close" type="button" aria-label="Close" onClick={onClose}><span className="tt-close__icon" /></button>
        </header>

        {item.type === 'gif' ? (
          <div className="search-gif">
            <img src={item.link} alt={item.name} />
          </div>
        ) : (
          <div className="search-info">
            {item.description ? <p>{item.description}</p> : <p>No description yet.</p>}
            {canOpen ? <a className="search-url" href={item.link} target="_blank" rel="noopener noreferrer">{item.link}</a> : <span className="search-url">Link looks broken.</span>}
            {canOpen ? (
              <a className="account-action search-action" href={item.link} target="_blank" rel="noopener noreferrer" download={item.type === 'file' && item.downloadable ? '' : undefined}>
                {action}
              </a>
            ) : null}
          </div>
        )}
      </section>
    </div>
  ), document.body);
}

export default function CommunitySearch() {
  const [items, setItems] = useState<CommunityResource[]>([]);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<CommunityResourceType>('gif');
  const [typeOpen, setTypeOpen] = useState(false);
  const [selected, setSelected] = useState<CommunityResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const typeRef = useRef<HTMLDivElement>(null);
  const activeType = typeOptions.find((option) => option.id === type) ?? typeOptions[0];

  useEffect(() => {
    fetchCommunityResources()
      .then(setItems)
      .catch(() => setError('Community stuff is unavailable right now.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!typeOpen) return;

    const close = (event: MouseEvent) => {
      if (typeRef.current?.contains(event.target as Node)) return;
      setTypeOpen(false);
    };

    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTypeOpen(false);
    };

    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', key);

    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', key);
    };
  }, [typeOpen]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return items
      .filter((item) => item.type === type)
      .filter((item) => {
        if (!search) return true;
        return [item.name, item.type, labels[item.type], item.description ?? ''].some((value) => value.toLowerCase().includes(search));
      })
      .sort((a, b) => sortType[a.type] - sortType[b.type] || a.name.localeCompare(b.name));
  }, [items, query, type]);

  return (
    <div className="search-page">
      <section className="search-panel">
        <label className="search-field">
          <span>Search library</span>
          <input value={query} placeholder="Search..." onChange={(event) => setQuery(event.target.value)} />
        </label>

        <div className={`search-select${typeOpen ? ' is-open' : ''}`} ref={typeRef}>
          <span id="search-type-label">Type</span>
          <button className="search-select__button" type="button" aria-haspopup="listbox" aria-expanded={typeOpen} aria-labelledby="search-type-label search-type-value" onClick={() => setTypeOpen((open) => !open)}>
            <strong id="search-type-value">{activeType.label}</strong>
          </button>
          {typeOpen ? (
            <div className="search-select__menu" role="listbox" aria-labelledby="search-type-label">
              {typeOptions.map((option) => (
                <button
                  className={option.id === type ? 'is-on' : ''}
                  type="button"
                  role="option"
                  aria-selected={option.id === type}
                  key={option.id}
                  onClick={() => {
                    setType(option.id);
                    setTypeOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {error ? <div className="tt-note tt-note--bad">{error}</div> : null}

      <section className="search-results" aria-live="polite">
        {loading ? <div className="tt-state">Loading resources...</div> : null}
        {!loading && !items.length && !error ? <div className="tt-state">No resources found yet.</div> : null}
        {!loading && items.length > 0 && !filtered.length ? <div className="tt-state">No matches found.</div> : null}

        {filtered.map((item) => (
          <button className={`search-card search-card--${item.type}`} type="button" key={item.id} onClick={() => setSelected(item)}>
            {item.type === 'gif' ? (
              <span className="search-card__preview">
                <img src={item.link} alt="" loading="lazy" />
              </span>
            ) : null}
            <span className="search-card__body">
              <small>{labels[item.type]}</small>
              <strong>{item.name}</strong>
              {item.description ? <span>{item.description}</span> : null}
            </span>
          </button>
        ))}
      </section>

      {selected ? <ResourceModal item={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
