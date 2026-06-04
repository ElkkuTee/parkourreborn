'use client';

import { useAuth } from '@/components/auth-provider';
import { discordAvatar } from '@/lib/discord';

export default function MenuAuth() {
  const { discord, loading, busy, error, login, logout } = useAuth();
  const name = discord?.globalName || discord?.username || 'Discord user';
  const avatar = discord ? discordAvatar(discord) : '';

  if (loading) {
    return (
      <div className="menu-auth">
        <div className="menu-auth__card">
          <span className="menu-auth__status">Checking login...</span>
        </div>
      </div>
    );
  }

  if (discord) {
    return (
      <div className="menu-auth">
        <div className="menu-auth__card">
          {avatar ? <img src={avatar} alt="" /> : <span className="menu-auth__avatar">{name.slice(0, 1)}</span>}
          <span>
            <small>Logged in as</small>
            <strong>{name}</strong>
          </span>
        </div>
        {error ? <span className="menu-auth__error">{error}</span> : null}
        <button className="side-menu__link side-menu__link--auth" type="button" tabIndex={-1} disabled={busy} onClick={logout}>
          {busy ? 'Logging out...' : 'Log out'}
        </button>
      </div>
    );
  }

  return (
    <div className="menu-auth">
      {error ? <span className="menu-auth__error">{error}</span> : null}
      <button className="side-menu__link side-menu__link--auth" type="button" tabIndex={-1} disabled={busy} onClick={login}>
        {busy ? 'Opening Discord...' : 'Log in with Discord'}
      </button>
    </div>
  );
}
