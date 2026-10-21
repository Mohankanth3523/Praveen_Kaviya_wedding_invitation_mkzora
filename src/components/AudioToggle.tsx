import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { music, useMusicPlaying } from '../utils/music';

/** Discreet, persistent music control (top-right). */
export function AudioToggle({ onMessage }: { onMessage: (text: string) => void }) {
  const on = useMusicPlaying();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    music.preload();
  }, []);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const ok = await music.toggle();
    setBusy(false);
    if (!ok) onMessage('Music could not be played on this device.');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? 'Mute music' : 'Play music'}
      title={on ? 'Mute music' : 'Play music'}
      className="fixed right-3 top-3 z-[70] inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/70 bg-blush text-burgundy shadow-[0_6px_18px_-10px_rgba(117,68,87,0.6)] transition-colors hover:border-gold hover:bg-blush-rose sm:right-5 sm:top-5"
    >
      {on ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
    </button>
  );
}
