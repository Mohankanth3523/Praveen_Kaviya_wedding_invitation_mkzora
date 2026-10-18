import type { Photo } from '../config/wedding';
import { assetUrl } from '../utils/directions';

/** Responsive original photograph: WebP with JPEG fallback, never cropped by default. */
export function Picture({
  photo,
  sizes,
  className = '',
  imgClassName = '',
  eager = false,
}: {
  photo: Photo;
  sizes: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
}) {
  const set = (list: Photo['webp']) => list.map((s) => `${assetUrl(s.src)} ${s.width}w`).join(', ');
  const fallback = photo.jpg[photo.jpg.length - 1];
  return (
    <picture className={className}>
      <source type="image/webp" srcSet={set(photo.webp)} sizes={sizes} />
      <img
        src={assetUrl(fallback.src)}
        srcSet={set(photo.jpg)}
        sizes={sizes}
        width={photo.width}
        height={photo.height}
        alt={photo.alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={imgClassName}
      />
    </picture>
  );
}
