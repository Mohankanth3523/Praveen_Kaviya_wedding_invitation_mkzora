/** Hand-drawn antique-gold ornaments used across the invitation. All decorative. */

export function Divider({ className = '', tone = 'gold' }: { className?: string; tone?: 'gold' | 'light' }) {
  // Both tones sit on light surfaces now; 'light' is a softer gold for busy backgrounds.
  const stroke = tone === 'gold' ? '#B58A45' : '#C9A464';
  return (
    <svg className={className} viewBox="0 0 320 24" width="320" height="24" aria-hidden="true" focusable="false">
      <g fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round">
        <path d="M8 12h112" />
        <path d="M200 12h112" />
        <path d="M120 12c8-7 16-7 22 0-6 7-14 7-22 0z" />
        <path d="M200 12c-8-7-16-7-22 0 6 7 14 7 22 0z" />
      </g>
      <g fill={stroke}>
        <path d="M160 2l7 10-7 10-7-10z" />
        <circle cx="146" cy="12" r="1.6" />
        <circle cx="174" cy="12" r="1.6" />
        <circle cx="6" cy="12" r="1.6" />
        <circle cx="314" cy="12" r="1.6" />
      </g>
    </svg>
  );
}

/** A lotus over a brass lamp: the invitation's crest. */
export function Crest({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 96 64" width="96" height="64" aria-hidden="true" focusable="false">
      <g fill="none" stroke="#B58A45" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M48 8c4 6 4 13 0 19-4-6-4-13 0-19z" fill="#B58A45" fillOpacity=".18" />
        <path d="M48 27c-5-6-13-9-21-8 3 7 11 11 21 8z" />
        <path d="M48 27c5-6 13-9 21-8-3 7-11 11-21 8z" />
        <path d="M48 27c-9-1-18 2-25 8 9 3 18 0 25-8z" />
        <path d="M48 27c9-1 18 2 25 8-9 3-18 0-25-8z" />
        <path d="M30 40h36M34 44h28" />
        <path d="M40 44c0 6 3 9 8 9s8-3 8-9" />
        <path d="M42 57h12" />
      </g>
      <path d="M48 0c2 3 2 5 0 7-2-2-2-4 0-7z" fill="#D98B3A" />
    </svg>
  );
}

/** Corner flourish for framed cards; rotate per corner. */
export function Corner({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" width="60" height="60" aria-hidden="true" focusable="false">
      <g fill="none" stroke="#B58A45" strokeWidth="1.1" strokeLinecap="round">
        <path d="M4 56V20C4 10 10 4 20 4h36" />
        <path d="M10 56V24c0-8 6-14 14-14h32" strokeOpacity=".6" />
        <path d="M18 18c6 0 10 4 10 10-6 0-10-4-10-10z" fill="#B58A45" fillOpacity=".2" />
      </g>
      <circle cx="4" cy="4" r="2.2" fill="#B58A45" />
    </svg>
  );
}

export function FramedCorners({ inset = 'inset-3' }: { inset?: string }) {
  return (
    <div className={`pointer-events-none absolute ${inset}`} aria-hidden="true">
      <Corner className="absolute left-0 top-0 h-10 w-10 sm:h-14 sm:w-14" />
      <Corner className="absolute right-0 top-0 h-10 w-10 rotate-90 sm:h-14 sm:w-14" />
      <Corner className="absolute bottom-0 right-0 h-10 w-10 rotate-180 sm:h-14 sm:w-14" />
      <Corner className="absolute bottom-0 left-0 h-10 w-10 -rotate-90 sm:h-14 sm:w-14" />
    </div>
  );
}

/** Marigold-and-jasmine string drawn as a hanging festoon. */
export function Festoon({ className = '' }: { className?: string }) {
  const beads = Array.from({ length: 29 }, (_, i) => {
    const t = i / 28;
    const x = 10 + t * 300;
    const y = 8 + Math.sin(t * Math.PI) * 22;
    return { x, y, i };
  });
  return (
    <svg className={className} viewBox="0 0 320 44" width="320" height="44" aria-hidden="true" focusable="false">
      {beads.map(({ x, y, i }) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i % 4 === 2 ? 3.2 : 4}
          fill={i % 4 === 2 ? '#FFFFFF' : i % 2 ? '#E98A15' : '#F3A823'}
          stroke={i % 4 === 2 ? '#E8C5D2' : 'none'}
          strokeWidth={i % 4 === 2 ? 1 : 0}
        />
      ))}
    </svg>
  );
}

/**
 * Floral corner: a rose bud with jasmine sprigs in rose-gold line art.
 * Drawn for the top-left corner; rotate/flip for the others.
 */
export function FloralCorner({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" width="120" height="120" aria-hidden="true" focusable="false">
      <g fill="none" stroke="#B58A45" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        {/* vine */}
        <path d="M6 114C10 70 34 34 76 12" strokeOpacity=".75" />
        <path d="M14 82c10-4 18-2 24 6M30 52c9 0 16 4 20 12M50 30c8 2 13 7 15 14" strokeOpacity=".6" />
        {/* leaves */}
        <path d="M22 70c-8-6-10-14-6-22 8 4 10 13 6 22z" fill="#F5D3DF" fillOpacity=".55" />
        <path d="M42 42c-4-9-2-17 5-22 5 7 3 16-5 22z" fill="#F5D3DF" fillOpacity=".55" />
        {/* rose bud */}
        <path d="M80 14c6-6 15-6 19 0 2 6-2 12-9 14-7 1-12-4-10-14z" fill="#F5D3DF" fillOpacity=".85" />
        <path d="M84 16c3 4 8 5 12 1M86 22c3 1 7 0 9-3" strokeOpacity=".8" />
      </g>
      {/* jasmine buds */}
      <g fill="#FFFCFD" stroke="#D9BC85" strokeWidth=".9">
        <ellipse cx="12" cy="98" rx="2.6" ry="4.2" transform="rotate(-25 12 98)" />
        <ellipse cx="24" cy="92" rx="2.4" ry="4" transform="rotate(20 24 92)" />
        <ellipse cx="58" cy="26" rx="2.4" ry="4" transform="rotate(35 58 26)" />
        <ellipse cx="66" cy="36" rx="2.2" ry="3.6" transform="rotate(-15 66 36)" />
      </g>
      <g fill="#B58A45">
        <circle cx="34" cy="62" r="1.3" />
        <circle cx="104" cy="8" r="1.5" />
      </g>
    </svg>
  );
}

export function FloralCorners({ className = 'h-24 w-24 sm:h-32 sm:w-32' }: { className?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <FloralCorner className={`absolute left-2 top-2 ${className}`} />
      <FloralCorner className={`absolute right-2 top-2 -scale-x-100 ${className}`} />
      <FloralCorner className={`absolute bottom-2 left-2 -scale-y-100 ${className}`} />
      <FloralCorner className={`absolute bottom-2 right-2 -scale-100 ${className}`} />
    </div>
  );
}
