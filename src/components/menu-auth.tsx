'use client';

import { useState } from 'react';
import { CircleUser } from 'lucide-react';
import AccountModal from '@/components/account-modal';
import { Button } from '@/components/ui/button';

export default function MenuAuth() {
  const [open, setOpen] = useState(false);

  return (
    <div className="menu-auth">
      <Button className="side-menu__link side-menu__link--account" type="button" tabIndex={-1} onClick={() => setOpen(true)}>
        <CircleUser className="side-menu__icon size-8" aria-hidden="true" />
        <span>Account</span>
      </Button>
      {open ? <AccountModal onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
