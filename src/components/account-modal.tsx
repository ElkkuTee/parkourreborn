'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/components/auth-provider';
import { discordAvatar } from '@/lib/discord';

type AccountModalProps = {
  onClose: () => void;
};

type Tab = 'stats' | 'account' | 'games';

const tabs: { id: Tab; label: string }[] = [
  { id: 'stats', label: 'Stats' },
  { id: 'account', label: 'Account' },
  { id: 'games', label: 'Games' },
];

export default function AccountModal({ onClose }: AccountModalProps) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>('account');
  const { discord, loading, busy, error, login, logout } = useAuth();
  const name = discord?.globalName || discord?.username || 'Discord user';
  const avatar = discord ? discordAvatar(discord) : '';

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
    <div className="account-modal" role="dialog" aria-modal="true" aria-label="Account">
      <button className="tt-scrim" type="button" aria-label="Close account" onClick={onClose} />
      <section className="account-dialog">
        <header className="tt-dialog__head">
          <div>
            <span>Profile</span>
            <h2>Account</h2>
          </div>
          <button className="tt-close" type="button" aria-label="Close account" onClick={onClose}><span className="tt-close__icon" /></button>
        </header>

        <div className="tt-tabs account-tabs" role="tablist" aria-label="Account sections">
          {tabs.map((item) => (
            <button className={tab === item.id ? 'is-on' : ''} type="button" role="tab" aria-selected={tab === item.id} key={item.id} onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'account' ? (
          <div className="account-panel">
            {loading ? <span className="account-status">Checking login...</span> : null}

            {!loading && discord ? (
              <>
                <div className="account-card">
                  {avatar ? <img src={avatar} alt="" /> : <span className="account-avatar">{name.slice(0, 1)}</span>}
                  <span>
                    <small>Logged in as</small>
                    <strong>{name}</strong>
                  </span>
                </div>
                {error ? <span className="account-error">{error}</span> : null}
                <button className="account-action" type="button" disabled={busy} onClick={logout}>
                  {busy ? 'Logging out...' : 'Log out'}
                </button>
              </>
            ) : null}

            {!loading && !discord ? (
              <>
                <div className="account-empty">
                  <small>Not logged in</small>
                </div>
                {error ? <span className="account-error">{error}</span> : null}
                <button className="account-action" type="button" disabled={busy} onClick={login}>
                  {busy ? 'Opening Discord...' : 'Log in with Discord'}
                </button>
              </>
            ) : null}
          </div>
        ) : (
          <div className="account-panel account-panel--soon">
            <span>Coming soon</span>
          </div>
        )}
      </section>
    </div>
  ), document.body);
}
