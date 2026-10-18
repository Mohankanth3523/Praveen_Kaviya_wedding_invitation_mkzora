import type { Venue } from '../config/wedding';

/** Google Maps universal search link — opens the Maps app on phones. */
export function directionsUrl(venue: Venue): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.mapsQuery)}`;
}

/** Resolve a /public asset path against Vite's configured base. */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base.endsWith('/') ? base : `${base}/`}${path.replace(/^\//, '')}`;
}
