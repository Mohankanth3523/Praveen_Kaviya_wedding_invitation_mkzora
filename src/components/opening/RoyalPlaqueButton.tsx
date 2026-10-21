import type { ReactNode } from 'react';
import { PlaqueEmblem } from './PalaceArt';

/**
 * The royal plaque button: deep muted rose, a thin double antique-gold border,
 * ivory serif lettering and a small gold lotus at each end. Styles live in
 * global.css (.royal-plaque) so hover, press and focus stay in CSS.
 */
export function RoyalPlaqueButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="royal-plaque" onClick={onClick} disabled={disabled}>
      <PlaqueEmblem className="royal-plaque__emblem" />
      <span className="royal-plaque__label">{children}</span>
      <PlaqueEmblem className="royal-plaque__emblem" />
    </button>
  );
}
