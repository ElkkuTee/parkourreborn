'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { ScreenReaderLoading, Skeleton } from '@/components/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DialogClose, DialogTitle } from '@/components/ui/dialog';
import { HubDialog, HubDialogContent } from '@/components/ui/hub-dialog';
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

function AccountSkeleton() {
  return (
    <>
      <Card className="account-card account-card--skeleton" aria-hidden="true">
        <Skeleton className="account-avatar-skeleton" />
        <span>
          <Skeleton className="account-line account-line--small" />
          <Skeleton className="account-line account-line--name" />
        </span>
      </Card>
      <Skeleton className="account-action-skeleton" />
    </>
  );
}

export default function AccountModal({ onClose }: AccountModalProps) {
  const [tab, setTab] = useState<Tab>('account');
  const { discord, loading, busy, error, login, logout } = useAuth();
  const name = discord?.globalName || discord?.username || 'Discord user';
  const avatar = discord ? discordAvatar(discord) : '';

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
      <HubDialogContent className="account-dialog" aria-label="Account">
        <header className="tt-dialog__head">
          <div>
            <span>Profile</span>
            <DialogTitle asChild>
              <h2>Account</h2>
            </DialogTitle>
          </div>
          <DialogClose asChild>
            <Button className="tt-close" type="button" aria-label="Close account">
              <span className="tt-close__icon" />
            </Button>
          </DialogClose>
        </header>

        <div className="tt-tabs account-tabs" role="tablist" aria-label="Account sections">
          {tabs.map((item) => (
            <Button
              className={tab === item.id ? 'is-on' : ''}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              key={item.id}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        {tab === 'account' ? (
          <div className="account-panel" aria-busy={loading || busy}>
            {loading ? <ScreenReaderLoading>Checking login...</ScreenReaderLoading> : null}
            {busy ? <ScreenReaderLoading>Updating account...</ScreenReaderLoading> : null}
            {loading ? <AccountSkeleton /> : null}

            {!loading && discord ? (
              <>
                <Card className="account-card">
                  <Avatar className="account-avatar">
                    {avatar ? <AvatarImage src={avatar} alt="" /> : null}
                    <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <span>
                    <small>Logged in as</small>
                    <strong>{name}</strong>
                  </span>
                </Card>
                {error ? <span className="account-error">{error}</span> : null}
                <Button className="account-action" type="button" disabled={busy} onClick={logout}>
                  Log out
                </Button>
              </>
            ) : null}

            {!loading && !discord ? (
              <>
                <div className="account-empty">
                  <small>Not logged in</small>
                </div>
                {error ? <span className="account-error">{error}</span> : null}
                <Button className="account-action" type="button" disabled={busy} onClick={login}>
                  Log in with Discord
                </Button>
              </>
            ) : null}
          </div>
        ) : null}

        {tab !== 'account' ? (
          <div className="account-panel account-panel--soon">
            <span>Coming soon</span>
          </div>
        ) : null}
      </HubDialogContent>
    </HubDialog>
  );
}
