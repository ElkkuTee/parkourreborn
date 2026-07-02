'use client';

import * as React from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog';

function HubDialog({ open = true, onOpenChange, ...props }: React.ComponentProps<typeof Dialog>) {
  return <Dialog open={open} onOpenChange={onOpenChange} {...props} />;
}

function HubDialogContent({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <div className="tt-modal">
        <DialogOverlay className="tt-scrim" />
        <DialogPrimitive.Content data-slot="dialog-content" className={className} {...props} />
      </div>
    </DialogPortal>
  );
}

export { HubDialog, HubDialogContent };
