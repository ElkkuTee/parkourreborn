'use client';

import { useState } from 'react';
import AccountModal from '@/components/account-modal';

export default function MenuAuth() {
  const [open, setOpen] = useState(false);

  return (
    <div className="menu-auth">
      <button className="side-menu__link side-menu__link--account" type="button" tabIndex={-1} onClick={() => setOpen(true)}>
        Account
      </button>
      {open ? <AccountModal onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
