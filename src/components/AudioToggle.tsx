import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { AmbientAudio } from '../utils/ambientAudio';
import { assetUrl } from '../utils/directions';
import { wedding } from '../config/wedding';

/** Discreet, persistent sound control. Silent by default; starts only on click. */
export function AudioToggle({ onMessage }: { onMessage: (text: string) => void }) {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const audio = useRef<AmbientAudio | null>(null);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && audio.current?.isRunning) {
        audio.current.stop();
        setOn(false);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      audio.current?.dispose();
    };
  }, []);

  const toggle = async () => {
    if (busy) return;
    if (!audio.current) audio.current = new AmbientAudio(wedding.audio.src ? assetUrl(wedding.audio.src) : null);
    if (on) {
      audio.current.stop();
      setOn(false);
      return;
    }
    setBusy(true);
    const ok = await audio.current.start();
    setBusy(false);
    setOn(ok);
    if (!ok) onMessage('Sound could not be played on this device.');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? 'Mute ambient sound' : 'Play ambient sound'}
      title={on ? 'Mute ambient sound' : 'Play ambient sound'}
      className="on-dark fixed right-3 top-3 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/50 bg-stone/60 text-ivory backdrop-blur-sm transition-colors hover:bg-stone/80 sm:right-5 sm:top-5"
    >
      {on ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
    </button>
  );
}
