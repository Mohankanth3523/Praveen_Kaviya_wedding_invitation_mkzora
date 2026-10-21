import { AnimatePresence, motion } from 'framer-motion';
import type { Photo } from '../../config/wedding';
import { Picture } from '../Picture';
import { FloralCorner } from '../Ornaments';

/**
 * Scene B: the couple's own photographs, one at a time, in an antique-gold frame.
 * The frame always takes the photo's own aspect ratio, so nothing is stretched
 * or cropped; the only movement inside the frame is a gentle zoom-out.
 */
export function PhotoReveal({ photos, index, reducedMotion, duration }: { photos: Photo[]; index: number; reducedMotion: boolean; duration: number }) {
  const photo = photos[index];
  if (!photo) return null;
  const ratio = photo.width / photo.height;

  return (
    <div className="relative flex items-center justify-center" style={{ minHeight: 'min(74svh, 46rem)' }}>
      <AnimatePresence initial>
        <motion.figure
          key={index}
          className="opening-photo-frame absolute"
          style={{ aspectRatio: `${photo.width} / ${photo.height}`, width: `min(86vw, calc(66svh * ${ratio}), 44rem)` }}
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.03, filter: 'blur(4px)' }}
          transition={{ duration: reducedMotion ? 0.5 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Blush matting + double gold frame */}
          <div className="frame-double h-full w-full rounded-[8px] bg-blush p-[clamp(6px,1.4vw,12px)] shadow-[0_40px_80px_-36px_rgba(117,68,87,0.6)]">
            <motion.div
              className="relative h-full w-full overflow-hidden rounded-[4px]"
              initial={reducedMotion ? false : { clipPath: 'circle(8% at 50% 45%)' }}
              animate={{ clipPath: 'circle(80% at 50% 50%)' }}
              transition={{ duration: 1.3, ease: [0.65, 0, 0.35, 1] }}
            >
              <motion.div
                className="h-full w-full"
                initial={reducedMotion ? false : { scale: 1.08, x: '-1%' }}
                animate={{ scale: 1, x: '0%' }}
                transition={{ duration: duration + 0.6, ease: 'easeOut' }}
              >
                <Picture photo={photo} sizes="(min-width: 768px) 44rem, 86vw" eager imgClassName="block h-full w-full object-cover" />
              </motion.div>
              {!reducedMotion && <div className="gold-sweep pointer-events-none absolute inset-0" aria-hidden="true" />}
            </motion.div>
          </div>
          <FloralCorner className="pointer-events-none absolute -left-5 -top-5 h-16 w-16 sm:h-20 sm:w-20" />
          <FloralCorner className="pointer-events-none absolute -bottom-5 -right-5 h-16 w-16 -scale-100 sm:h-20 sm:w-20" />
          <figcaption className="sr-only">{photo.alt}</figcaption>
        </motion.figure>
      </AnimatePresence>
    </div>
  );
}
