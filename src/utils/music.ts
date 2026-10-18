import { useSyncExternalStore } from 'react';
import { AmbientAudio } from './ambientAudio';
import { assetUrl } from './directions';
import { wedding } from '../config/wedding';

/**
 * One music player for the whole invitation, shared by the sound button and
 * the "Open Wedding Invitation" button. Browsers only allow sound after a
 * visitor's tap, so playback always starts from a click handler.
 */
const player = new AmbientAudio(wedding.audio.src ? assetUrl(wedding.audio.src) : null);
let playing = false;
let mutedByVisitor = false;
let pausedForHiddenTab = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function start(): Promise<boolean> {
  const ok = await player.start();
  playing = ok;
  emit();
  return ok;
}

function stop() {
  player.stop();
  playing = false;
  emit();
}

export const music = {
  preload: () => player.preload(),
  /** Called from the open-doors click: plays unless the visitor muted earlier. */
  startWithInvitation() {
    if (mutedByVisitor || playing) return;
    void start();
  },
  /** The sound button. */
  async toggle(): Promise<boolean> {
    if (playing) {
      mutedByVisitor = true;
      stop();
      return true;
    }
    mutedByVisitor = false;
    return start();
  },
};

// Pause while the tab is hidden; resume when the visitor comes back.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) {
      pausedForHiddenTab = true;
      stop();
    } else if (!document.hidden && pausedForHiddenTab && !mutedByVisitor) {
      pausedForHiddenTab = false;
      void start();
    }
  });
}

export function useMusicPlaying(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => playing,
    () => false,
  );
}
