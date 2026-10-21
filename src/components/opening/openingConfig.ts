import { wedding, type Photo } from '../../config/wedding';

/**
 * Opening sequence configuration.
 *
 * PHOTOS: the couple photographs revealed before the invitation scroll.
 * They come from `wedding.photos` (src/config/wedding.ts), the same files the
 * gallery uses, so there is one place to replace them. Use only real
 * photographs of Praveen and Kaviya here — never stock or generated people.
 * Remove an entry to show fewer photos; an empty list skips the photo scene.
 */
export const OPENING_PHOTOS: Photo[] = [wedding.photos.hero, wedding.photos.gallery[0], wedding.photos.gallery[1]].filter(
  (p): p is Photo => Boolean(p),
);

/** Scene lengths in seconds. Reduced-motion visitors get the short set. */
export const OPENING_TIMING = {
  full: { doors: 3.8, photo: 2.6, names: 3.0, scrollReady: 3.4 },
  reduced: { doors: 0.6, photo: 2.2, names: 1.8, scrollReady: 0.2 },
} as const;

/** Session flag so a page reload within the same visit goes straight to the invitation. */
export const OPENING_SEEN_KEY = 'pk-opening-seen';
