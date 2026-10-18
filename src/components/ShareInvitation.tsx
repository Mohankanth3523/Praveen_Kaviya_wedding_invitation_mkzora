import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { wedding, SITE_TITLE } from '../config/wedding';
import { currentInvitationUrl, shareInvitation } from '../utils/sharing';

/** Native share sheet where available; otherwise copies the link. */
export function ShareInvitation({
  onMessage,
  label = 'Share Invitation',
  variant = 'outline',
}: {
  onMessage: (text: string) => void;
  label?: string;
  variant?: 'primary' | 'outline' | 'dark';
}) {
  const [manualUrl, setManualUrl] = useState<string | null>(null);
  const handle = async () => {
    const url = currentInvitationUrl();
    const result = await shareInvitation({
      title: SITE_TITLE,
      text: `${wedding.invitation.blessing}, ${wedding.couple.short} invite you to their wedding on ${wedding.dateLabel}.`,
      url,
    });
    if (result === 'copied') onMessage('Invitation link copied to the clipboard.');
    if (result === 'manual') setManualUrl(url);
  };
  const cls = variant === 'primary' ? 'btn-primary' : variant === 'dark' ? 'btn-ghost-dark' : 'btn-outline';
  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" onClick={handle} className={cls}>
        <Share2 size={16} aria-hidden="true" /> {label}
      </button>
      {manualUrl && (
        <label className="flex w-full max-w-xs flex-col items-center gap-1 text-sm">
          <span>Copy this link:</span>
          <input
            readOnly
            value={manualUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded border border-gold/60 bg-ivory px-2 py-1 text-center text-burgundy"
          />
        </label>
      )}
    </div>
  );
}
