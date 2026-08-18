'use client';

import { Button } from '@/components/ui/button';
import { DialogTitle } from '@/components/ui/dialog';
import { HubDialog, HubDialogContent } from '@/components/ui/hub-dialog';
import type { MergeChoice } from '@/lib/use-parkour-save';

type SaveMergeProps = {
  onPick: (choice: MergeChoice) => void;
};

export default function SaveMerge({ onPick }: SaveMergeProps) {
  return (
    <HubDialog>
      <HubDialogContent className="account-dialog ip-merge" aria-label="Pick a save">
        <header className="tt-dialog__head">
          <div>
            <span>Save</span>
            <DialogTitle asChild>
              <h2>Two saves</h2>
            </DialogTitle>
          </div>
        </header>

        <div className="account-panel ip-merge__note">
          <strong>You&apos;ve got progress saved in this browser.</strong>
          <p>Your Discord account also has its own progress. Which one do you want to keep?</p>
        </div>

        <Button className="account-action" type="button" onClick={() => onPick('account')}>Keep account progress</Button>
        <Button className="account-action" type="button" onClick={() => onPick('browser')}>Use browser progress</Button>
      </HubDialogContent>
    </HubDialog>
  );
}
