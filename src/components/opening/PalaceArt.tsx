import { memo, useId } from 'react';
import { motion } from 'framer-motion';
import { PAL, archCurve, archDoorway, cuspedDoorway, lotusPetals, swagPoints } from './palaceGeometry';

/**
 * Static artwork for the royal palace entrance (see PalaceEntrance.tsx).
 *
 * Everything is hand-built SVG in a 600 × 900 unit space so it stays sharp at
 * any size, weighs a few kilobytes, and needs no image downloads or WebGL.
 * Components are memoised: they render once and are then only moved,
 * scaled or faded as whole layers (cheap, GPU-composited transforms).
 */

function useIds() {
  const u = useId().replace(/:/g, '');
  return (name: string) => `${name}-${u}`;
}

const GOLD_STOPS = (
  <>
    <stop offset="0" stopColor={PAL.antiqueDeep} />
    <stop offset=".32" stopColor={PAL.champagne} />
    <stop offset=".5" stopColor="#F3DFAE" />
    <stop offset=".68" stopColor={PAL.champagne} />
    <stop offset="1" stopColor={PAL.antique} />
  </>
);

/* ------------------------------------------------------------------ */
/* Central palace facade                                               */
/* ------------------------------------------------------------------ */

const PEDIMENT =
  'M96 200C150 200 172 186 200 166C230 144 250 128 264 106C278 84 290 72 300 64C310 72 322 84 336 106C350 128 370 144 400 166C428 186 450 200 504 200Z';

/** Pediment outline in its own bounding box, for the shimmer mask. */
export const PEDIMENT_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='96 62 408 138' preserveAspectRatio='none'><path d='${PEDIMENT}' fill='black'/></svg>`,
)}")`;

export const Facade = memo(function Facade() {
  const id = useIds();
  const g = `url(#${id('gold')})`;
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 900" focusable="false" aria-hidden="true">
      <defs>
        <linearGradient id={id('gold')} x1="0" y1="0" x2="1" y2="1">
          {GOLD_STOPS}
        </linearGradient>
        <linearGradient id={id('marble')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAL.marbleHi} />
          <stop offset="1" stopColor="#F4E7E5" />
        </linearGradient>
        <linearGradient id={id('pillar')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E2CDCB" />
          <stop offset=".28" stopColor="#FAF2F0" />
          <stop offset=".48" stopColor={PAL.marbleHi} />
          <stop offset=".72" stopColor="#F5E8E6" />
          <stop offset="1" stopColor="#D9C2C0" />
        </linearGradient>
        <linearGradient id={id('wall')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FCE4CC" />
          <stop offset="1" stopColor="#F6CDA8" />
        </linearGradient>
        <linearGradient id={id('recess')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAL.peacockDeep} />
          <stop offset=".5" stopColor={PAL.peacock} />
          <stop offset="1" stopColor="#3C9C98" />
        </linearGradient>
        <linearGradient id={id('carpet')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B3123E" />
          <stop offset="1" stopColor="#7E0B2B" />
        </linearGradient>
        <pattern id={id('fresco')} width="30" height="30" patternUnits="userSpaceOnUse">
          <path d={lotusPetals(4, 0.8, 6.5, 2.6)} transform="translate(15 15)" fill={PAL.champagne} opacity=".75" />
          <circle cx="15" cy="15" r="1.4" fill={PAL.ruby} />
          <circle cx="0" cy="0" r="1.3" fill="#FFF8F7" opacity=".7" />
          <circle cx="30" cy="0" r="1.3" fill="#FFF8F7" opacity=".7" />
          <circle cx="0" cy="30" r="1.3" fill="#FFF8F7" opacity=".7" />
          <circle cx="30" cy="30" r="1.3" fill="#FFF8F7" opacity=".7" />
        </pattern>
        <linearGradient id={id('wood')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAL.rosewoodLight} />
          <stop offset="1" stopColor={PAL.rosewood} />
        </linearGradient>
        <linearGradient id={id('tread')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAL.marbleHi} />
          <stop offset="1" stopColor="#F6EBE9" />
        </linearGradient>
        <linearGradient id={id('riser')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EBD8D6" />
          <stop offset="1" stopColor="#F3E6E4" />
        </linearGradient>
        <pattern id={id('jaali')} width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill={PAL.rosewood} />
          {[
            [0, 0, '#FF6F8A'],
            [12, 0, '#FFC94A'],
            [0, 12, '#4CC28A'],
            [12, 12, '#5AA2F0'],
          ].map(([x, y, c]) => (
            <path
              key={`${x}${y}`}
              transform={`translate(${x} ${y})`}
              d="M6 1.2C7.6 3.4 7.6 4.4 6 6 4.4 4.4 4.4 3.4 6 1.2ZM6 10.8C4.4 8.6 4.4 7.6 6 6c1.6 1.6 1.6 2.6 0 4.8ZM1.2 6C3.4 4.4 4.4 4.4 6 6 4.4 7.6 3.4 7.6 1.2 6ZM10.8 6C8.6 7.6 7.6 7.6 6 6c1.6-1.6 2.6-1.6 4.8 0Z"
              fill={c as string}
            />
          ))}
        </pattern>
      </defs>

      {/* Kalasam finial crowning the pediment */}
      <g fill={g}>
        <path d="M300 4c4 8 5 14 0 20-5-6-4-12 0-20Z" />
        <rect x="297.5" y="23" width="5" height="12" />
        <ellipse cx="300" cy="36" rx="7" ry="2.4" />
        <path d="M287 58c-4-10 2-17 13-19 11 2 17 9 13 19Z" />
        <rect x="284" y="57" width="32" height="5" rx="1.5" />
      </g>

      <Chhatri cx={58} gold={g} marble={`url(#${id('marble')})`} recess={`url(#${id('recess')})`} />
      <Chhatri cx={542} gold={g} marble={`url(#${id('marble')})`} recess={`url(#${id('recess')})`} />

      {/* Pediment with filigree and the royal crest */}
      <path d={PEDIMENT} fill={`url(#${id('marble')})`} stroke={g} strokeWidth="2" />
      <path d={PEDIMENT} transform="translate(300 200) scale(.84 .8) translate(-300 -200)" fill={`url(#${id('recess')})`} stroke={g} strokeWidth="1.3" />
      <path d={PEDIMENT} transform="translate(300 200) scale(.84 .8) translate(-300 -200)" fill={`url(#${id('fresco')})`} />
      <path
        d={PEDIMENT}
        transform="translate(300 200) scale(.66 .58) translate(-300 -200)"
        fill="none"
        stroke={PAL.antique}
        strokeWidth="1.1"
        strokeDasharray="0.1 4.2"
        strokeLinecap="round"
      />
      {/* Lotus-bud cresting along both slopes */}
      <g fill={g}>
        {[
          [132, 197],
          [170, 186],
          [203, 163],
          [234, 139],
          [258, 114],
        ].flatMap(([x, y]) => [x, 600 - x].map((bx) => <path key={`${bx}-${y}`} d={`M${bx} ${y - 13}c3.4 4 3.6 8 0 11-3.6-3-3.4-7 0-11Z`} />))}
      </g>
      <g fill="none" stroke={g} strokeWidth="1.4" strokeLinecap="round">
        <path id={id('scroll')} d="M266 188c-24 4-42-4-48-14-6-10 4-16 12-12 6 3 4 12-4 10M218 174c-14 4-28 12-46 14M246 192c-6-8-2-16 6-16" />
        <use href={`#${id('scroll')}`} transform="translate(600 0) scale(-1 1)" />
      </g>
      <g transform="translate(300 150)">
        <g stroke={g} strokeWidth="1.3" strokeLinecap="round">
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const r2 = i % 2 ? 36 : 42;
            return <line key={i} x1={Math.cos(a) * 30} y1={Math.sin(a) * 30} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} />;
          })}
        </g>
        <circle r="29" fill={`url(#${id('marble')})`} stroke={g} strokeWidth="3.2" />
        <circle r="22.5" fill={PAL.ruby} stroke={g} strokeWidth="1" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
          return <circle key={i} cx={Math.cos(a) * 26} cy={Math.sin(a) * 26} r="1.9" fill={i % 2 ? PAL.emerald : PAL.sapphire} />;
        })}
        <path d={lotusPetals(8, 3, 19, 5.6)} fill={g} opacity=".95" />
        <path d={lotusPetals(8, 3, 12, 3.6)} fill={PAL.marble} opacity=".7" transform="rotate(22.5)" />
        <circle r="3.6" fill={g} />
      </g>

      {/* Cornice with dentils */}
      <rect x="6" y="200" width="588" height="8" fill={`url(#${id('marble')})`} stroke={g} strokeWidth=".8" />
      <g fill={PAL.marbleShade}>
        {Array.from({ length: 49 }, (_, i) => (
          <rect key={i} x={9 + i * 12} y="209" width="6" height="8" />
        ))}
      </g>
      <rect x="6" y="217" width="588" height="5" fill={g} />
      <rect x="14" y="222" width="572" height="4" fill={PAL.antiqueDeep} opacity=".14" />

      {/* Facade body and blush inner wall */}
      <rect x="14" y="226" width="572" height="536" fill={`url(#${id('marble')})`} />
      <rect x="100" y="226" width="400" height="536" fill={`url(#${id('wall')})`} />
      <path d="M100 226V762M500 226V762" stroke={g} strokeWidth="1.2" />
      <g>
        {Array.from({ length: 20 }, (_, i) => (
          <path key={i} d={`M${100 + i * 20} 226h20l-10 14Z`} fill={[PAL.magenta, PAL.marigold, PAL.peacock, PAL.ruby, PAL.saffron][i % 5]} opacity=".9" />
        ))}
      </g>

      {/* Layer 1: the great marble iwan with a cusped recess */}
      <path d={archDoorway(300, 372, 190, 140, 762)} fill={`url(#${id('marble')})`} stroke={g} strokeWidth="1.8" />
      <path d={archDoorway(300, 372, 184, 134, 762)} fill="none" stroke={PAL.antique} strokeWidth=".7" strokeOpacity=".7" />
      <path d={cuspedDoorway(300, 372, 176, 128, 762, 5)} fill={`url(#${id('recess')})`} stroke={g} strokeWidth="1.3" />
      <path d={cuspedDoorway(300, 372, 176, 128, 762, 5)} fill={`url(#${id('fresco')})`} />
      {/* Spandrel rosettes */}
      {[128, 472].map((x) => (
        <g key={x} transform={`translate(${x} 258)`}>
          <circle r="14" fill={PAL.marble} stroke={g} strokeWidth="1" />
          <path d={lotusPetals(8, 2.5, 12, 3.8)} fill={g} opacity=".85" />
          <circle r="3" fill={PAL.ruby} />
        </g>
      ))}
      {/* Shadow pooling at the foot of the recess */}
      <rect x="124" y="736" width="352" height="26" fill={PAL.rosewood} opacity=".06" />

      {/* Layer 2: carved marble moulding around the doorway */}
      <path d={archDoorway(300, 418, 124, 122, 762)} fill={`url(#${id('marble')})`} stroke={g} strokeWidth="1.6" />
      <path d={archDoorway(300, 418, 118, 116, 762)} fill="none" stroke={PAL.antique} strokeWidth=".8" />
      <g fill={g} opacity=".8">
        {Array.from({ length: 12 }, (_, i) => (
          <g key={i}>
            <rect x="180" y={440 + i * 26} width="4" height="4" transform={`rotate(45 182 ${442 + i * 26})`} />
            <rect x="416" y={440 + i * 26} width="4" height="4" transform={`rotate(45 418 ${442 + i * 26})`} />
          </g>
        ))}
      </g>

      {/* Layer 3: rosewood door frame and glowing jaali tympanum */}
      <path d={archDoorway(300, 418, 110, 108, 762)} fill={`url(#${id('wood')})`} stroke={g} strokeWidth="1.3" />
      <path d={archDoorway(300, 418, 104, 103, 762)} fill="none" stroke={PAL.champagne} strokeWidth=".9" />
      <path d={`${archCurve(300, 412, 98, 96)}Z`} fill={`url(#${id('jaali')})`} stroke={g} strokeWidth="1.6" />
      <g transform="translate(300 360)">
        <circle r="15" fill={PAL.rosewood} stroke={g} strokeWidth="1.6" />
        <path d={lotusPetals(8, 2, 12, 3.6)} fill={g} />
      </g>
      <rect x="194" y="410" width="212" height="8" fill={g} />
      <rect x="200" y="418" width="200" height="342" fill={PAL.rosewoodDark} />
      <rect x="184" y="758" width="232" height="6" fill={g} />

      <Pillar cx={58} gold={g} pillar={`url(#${id('pillar')})`} marble={`url(#${id('marble')})`} />
      <Pillar cx={542} gold={g} pillar={`url(#${id('pillar')})`} marble={`url(#${id('marble')})`} />

      {/* Yali guardians on plinths, facing the doors */}
      <g transform="translate(118 636)">
        <Yali gold={g} marble={`url(#${id('marble')})`} />
      </g>
      <g transform="translate(482 636) scale(-1 1)">
        <Yali gold={g} marble={`url(#${id('marble')})`} />
      </g>

      {/* Ceremonial platform and broad marble staircase */}
      <rect x="62" y="762" width="476" height="10" fill={`url(#${id('tread')})`} stroke={g} strokeWidth=".8" />
      {Array.from({ length: 5 }, (_, i) => {
        const y = 772 + i * 25;
        const x1 = 62 - 16 * (i + 1);
        const x2 = 538 + 16 * (i + 1);
        return (
          <g key={i}>
            <rect x={x1} y={y} width={x2 - x1} height="18" fill={`url(#${id('riser')})`} />
            <rect x={x1} y={y + 18} width={x2 - x1} height="7" fill={`url(#${id('tread')})`} />
            <line x1={x1} x2={x2} y1={y + 3} y2={y + 3} stroke={PAL.antique} strokeWidth=".7" strokeOpacity=".55" />
            <line x1={x1} x2={x2} y1={y + 18} y2={y + 18} stroke={PAL.marbleDeep} strokeWidth=".8" />
          </g>
        );
      })}
      <path d="M216 762H384L424 900H176Z" fill={`url(#${id('carpet')})`} />
      <path d="M224 762L186 900M376 762L414 900" stroke={PAL.champagne} strokeWidth="2.4" />
      <path d="M230 762L194 900M370 762L406 900" stroke={PAL.champagne} strokeWidth=".8" />
      <g stroke="#4E0619" strokeWidth="1" opacity=".45">
        {[790, 815, 840, 865, 890].map((y) => (
          <line key={y} x1={216 - (y - 762) * 0.29} x2={384 + (y - 762) * 0.29} y1={y} y2={y} />
        ))}
      </g>
      {[
        [236, 776, PAL.marigold],
        [262, 798, '#FFFDF8'],
        [338, 784, PAL.saffron],
        [356, 808, '#F6A5C0'],
        [212, 828, '#FFFDF8'],
        [296, 822, PAL.marigold],
        [380, 846, '#FFFDF8'],
        [250, 858, '#F6A5C0'],
        [326, 872, PAL.saffron],
        [200, 886, PAL.marigold],
        [404, 884, '#F6A5C0'],
        [300, 780, '#F6A5C0'],
      ].map(([x, y, c]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="3.4" ry="2" fill={c as string} transform={`rotate(${((x as number) * 7) % 180} ${x} ${y})`} />
      ))}
    </svg>
  );
});

function Chhatri({ cx, gold, marble, recess }: { cx: number; gold: string; marble: string; recess: string }) {
  return (
    <g>
      <path d={`M${cx} 82c3 6 3 10 0 14-3-4-3-8 0-14Z`} fill={gold} />
      <path d={`M${cx - 24} 144C${cx - 28} 122 ${cx - 12} 108 ${cx} 98C${cx + 12} 108 ${cx + 28} 122 ${cx + 24} 144Z`} fill={marble} stroke={gold} strokeWidth="1.2" />
      <path d={`M${cx - 20} 136C${cx - 10} 132 ${cx + 10} 132 ${cx + 20} 136`} fill="none" stroke={gold} strokeWidth=".8" />
      <path d={`M${cx - 32} 152H${cx + 32}L${cx + 26} 144H${cx - 26}Z`} fill={marble} stroke={gold} strokeWidth="1" />
      <rect x={cx - 19} y="152" width="38" height="38" fill={recess} />
      <path d={archCurve(cx, 190, 13, 24)} fill="none" stroke={gold} strokeWidth=".9" />
      <rect x={cx - 25} y="152" width="7" height="38" fill={marble} stroke={gold} strokeWidth=".8" />
      <rect x={cx + 18} y="152" width="7" height="38" fill={marble} stroke={gold} strokeWidth=".8" />
      <rect x={cx - 31} y="190" width="62" height="10" fill={marble} stroke={gold} strokeWidth=".9" />
    </g>
  );
}

function Pillar({ cx, gold, pillar, marble }: { cx: number; gold: string; pillar: string; marble: string }) {
  return (
    <g>
      <rect x={cx - 34} y="226" width="68" height="10" fill={marble} stroke={gold} strokeWidth="1" />
      <path
        d={`M${cx - 32} 236H${cx + 32}C${cx + 30} 252 ${cx + 22} 262 ${cx + 21} 272H${cx - 21}C${cx - 22} 262 ${cx - 30} 252 ${cx - 32} 236Z`}
        fill={pillar}
        stroke={gold}
        strokeWidth="1"
      />
      <g fill={gold} fillOpacity=".22" stroke={gold} strokeWidth=".8">
        {[-14, 0, 14].map((k) => (
          <path key={k} d={`M${cx + k} 239q-6 12 0 24q6-12 0-24Z`} />
        ))}
      </g>
      <rect x={cx - 23} y="272" width="46" height="8" fill={gold} />
      <rect x={cx - 21} y="280" width="42" height="410" fill={pillar} />
      <g stroke={PAL.marbleDeep} strokeWidth=".9" strokeOpacity=".7">
        {[-14, -7, 0, 7, 14].map((k) => (
          <line key={k} x1={cx + k} x2={cx + k} y1="300" y2="680" />
        ))}
      </g>
      <g fill={gold}>
        {[-12, 0, 12].map((k) => (
          <circle key={k} cx={cx + k} cy="292" r="2.2" />
        ))}
      </g>
      {[380, 490, 600].map((y) => (
        <g key={y}>
          <rect x={cx - 23} y={y} width="46" height="13" fill={marble} stroke={gold} strokeWidth=".9" />
          {[-16, -8, 0, 8, 16].map((k) => (
            <rect key={k} x={cx + k - 2.2} y={y + 4.3} width="4.4" height="4.4" fill={[PAL.ruby, PAL.emerald, PAL.sapphire, PAL.emerald, PAL.ruby][(k + 16) / 8]} stroke={gold} strokeWidth=".6" transform={`rotate(45 ${cx + k} ${y + 6.5})`} />
          ))}
        </g>
      ))}
      <rect x={cx - 25} y="688" width="50" height="6" fill={gold} />
      <rect x={cx - 29} y="694" width="58" height="30" fill={marble} stroke={gold} strokeWidth=".8" />
      <g fill="none" stroke={gold} strokeWidth=".8">
        {[-18, -6, 6, 18].map((k) => (
          <path key={k} d={`M${cx + k - 5} 722q5-20 10 0`} />
        ))}
      </g>
      <rect x={cx - 33} y="724" width="66" height="38" fill={marble} stroke={gold} strokeWidth="1" />
      <line x1={cx - 33} x2={cx + 33} y1="732" y2="732" stroke={gold} strokeWidth=".8" />
    </g>
  );
}

/** A stylised yali (mythical lion-elephant guardian), sculpted in marble with gilded detail. */
function Yali({ gold, marble }: { gold: string; marble: string }) {
  return (
    <g>
      <path
        d="M10 110V92C10 80 14 70 20 64C16 56 16 46 22 40C24 34 22 26 26 20C28 12 36 6 44 8C50 9 54 14 54 20C58 22 61 28 57 32C61 36 61 43 56 45C52 46 51 42 54 40C50 40 46 39 44 37C46 41 46 45 42 47C44 51 48 54 52 54C57 54 59 59 55 61C51 63 45 61 41 59C40 66 42 76 46 84C48 92 50 100 52 104L56 110Z"
        fill={marble}
        stroke={gold}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Mane curls, eye, tusk and tail */}
      <g fill="none" stroke={gold} strokeWidth="1" strokeLinecap="round">
        <path d="M26 22c-4 2-4 7 0 8M23 32c-4 2-4 7 0 8M21 42c-4 2-3 7 1 8M30 14c-3-3-1-7 3-6" />
        <path d="M12 86C2 80 1 66 9 63c5-2 7 4 3 6" />
        <path d="M22 68c6 8 8 20 6 32M40 60c-6 2-10 6-12 10" strokeOpacity=".6" />
        <path d="M47 33c3 2 6 2 8 0" />
      </g>
      <circle cx="44" cy="18" r="2" fill={PAL.rosewood} />
      <circle cx="44" cy="18" r="3.4" fill="none" stroke={gold} strokeWidth=".8" />
      {/* Plinth */}
      <rect x="-4" y="110" width="68" height="6" fill={gold} />
      <rect x="-1" y="116" width="62" height="10" fill={marble} stroke={gold} strokeWidth=".8" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Side wings — arcaded palace facade with jharokha balconies          */
/* ------------------------------------------------------------------ */

export const Wing = memo(function Wing({ mirrored = false }: { mirrored?: boolean }) {
  const id = useIds();
  const g = `url(#${id('gold')})`;
  const bays = [150, 450, 750];
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 900 900"
      preserveAspectRatio="xMaxYMid meet"
      focusable="false"
      aria-hidden="true"
      style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
    >
      <defs>
        <linearGradient id={id('gold')} x1="0" y1="0" x2="1" y2="1">
          {GOLD_STOPS}
        </linearGradient>
        <linearGradient id={id('body')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF6EC" />
          <stop offset="1" stopColor="#F9E4D2" />
        </linearGradient>
        <linearGradient id={id('arch')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAL.peacockDeep} />
          <stop offset=".6" stopColor={PAL.peacock} />
          <stop offset="1" stopColor="#4BA9A3" />
        </linearGradient>
        <linearGradient id={id('silk')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D63C83" />
          <stop offset="1" stopColor={PAL.magenta} />
        </linearGradient>
        <linearGradient id={id('floor')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7EBEA" />
          <stop offset="1" stopColor="#FFF9F8" />
        </linearGradient>
        <linearGradient id={id('haze')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFF4EC" stopOpacity=".55" />
          <stop offset=".55" stopColor="#FFF4EC" stopOpacity=".15" />
          <stop offset="1" stopColor="#FFF7FA" stopOpacity="0" />
        </linearGradient>
        <pattern id={id('jaali')} width="18" height="18" patternUnits="userSpaceOnUse">
          <rect width="18" height="18" fill="#8A5A44" />
          <circle cx="4.5" cy="4.5" r="3.2" fill="#FF8FA3" />
          <circle cx="13.5" cy="4.5" r="3.2" fill="#FFD36B" />
          <circle cx="4.5" cy="13.5" r="3.2" fill="#6FD3A0" />
          <circle cx="13.5" cy="13.5" r="3.2" fill="#7FB6F5" />
        </pattern>
      </defs>

      {/* Parapet with kanguras and small domed pavilions */}
      <g fill={`url(#${id('body')})`} stroke={g} strokeWidth=".7">
        {Array.from({ length: 30 }, (_, i) => {
          const x = i * 30;
          return <path key={i} d={`M${x + 4} 330V320C${x + 4} 311 ${x + 26} 311 ${x + 26} 320V330Z`} />;
        })}
      </g>
      {bays.map((cx) => (
        <g key={cx}>
          <path d={`M${cx - 30} 312C${cx - 34} 290 ${cx - 14} 274 ${cx} 266C${cx + 14} 274 ${cx + 34} 290 ${cx + 30} 312Z`} fill={`url(#${id('body')})`} stroke={g} strokeWidth="1" />
          <path d={`M${cx} 250c3 6 3 11 0 16-3-5-3-10 0-16Z`} fill={g} />
        </g>
      ))}

      {/* Body and cornices */}
      <rect x="0" y="330" width="900" height="432" fill={`url(#${id('body')})`} />
      <rect x="0" y="330" width="900" height="7" fill={g} />
      <g fill="#EDDCDA">
        {Array.from({ length: 75 }, (_, i) => (
          <rect key={i} x={3 + i * 12} y="338" width="6" height="6" />
        ))}
      </g>
      <rect x="0" y="516" width="900" height="6" fill={g} opacity=".85" />
      {bays.map((cx, i) => (
        <g key={`silk-${cx}`}>
          <path d={`M${cx - 150} 345Q${cx} 404 ${cx + 150} 345Q${cx} 380 ${cx - 150} 345Z`} fill={`url(#${id('silk')})`} />
          <path d={`M${cx - 150} 345Q${cx} 404 ${cx + 150} 345`} fill="none" stroke={i % 2 ? PAL.peacock : PAL.saffron} strokeWidth="3" />
          <path d={`M${cx - 150} 345Q${cx} 404 ${cx + 150} 345`} fill="none" stroke={PAL.champagne} strokeWidth="1" transform="translate(0 3)" />
          <path d={`M${cx + 150} 345l-9 70q9 6 18 0Z`} fill={`url(#${id('silk')})`} />
          <circle cx={cx + 150} cy="420" r="4" fill={PAL.marigold} />
        </g>
      ))}

      {bays.map((cx) => (
        <g key={cx}>
          {/* Upper floor: jharokha balcony */}
          <path d={`M${cx - 54} 394C${cx - 30} 374 ${cx + 30} 374 ${cx + 54} 394L${cx + 48} 400H${cx - 48}Z`} fill={`url(#${id('body')})`} stroke={g} strokeWidth="1" />
          <path d={archDoorway(cx, 446, 32, 40, 490)} fill={`url(#${id('jaali')})`} stroke={g} strokeWidth="1.2" />
          <rect x={cx - 44} y="400" width="7" height="90" fill={`url(#${id('body')})`} stroke={g} strokeWidth=".7" />
          <rect x={cx + 37} y="400" width="7" height="90" fill={`url(#${id('body')})`} stroke={g} strokeWidth=".7" />
          <rect x={cx - 52} y="490" width="104" height="9" fill={`url(#${id('body')})`} stroke={g} strokeWidth=".9" />
          <path d={`M${cx - 40} 499l6 14 6-14M${cx - 6} 499l6 14 6-14M${cx + 28} 499l6 14 6-14`} fill={`url(#${id('body')})`} stroke={g} strokeWidth=".8" />
          {/* Ground floor: arcade arch glowing from within */}
          <path d={archDoorway(cx, 622, 122, 92, 762)} fill={`url(#${id('body')})`} stroke={g} strokeWidth="1.3" />
          <path d={cuspedDoorway(cx, 622, 110, 84, 762, 4)} fill={`url(#${id('arch')})`} stroke={g} strokeWidth="1" />
          <path d={`M${cx} 560v34`} stroke={PAL.antique} strokeWidth="1" />
          <path d={`M${cx - 7} 594h14l-3 16h-8Z`} fill={g} />
          <circle cx={cx} cy="604" r="10" fill="#FFE7BF" opacity=".55" />
        </g>
      ))}
      {[300, 600].map((x) => (
        <g key={x} transform={`translate(${x} 446)`}>
          <circle r="13" fill={PAL.peacock} stroke={g} strokeWidth=".9" />
          <path d={lotusPetals(8, 2, 11, 3.4)} fill={g} />
          <circle r="2.4" fill={PAL.ruby} />
        </g>
      ))}

      {/* Balustrade along the terrace */}
      <rect x="0" y="738" width="900" height="5" fill={`url(#${id('body')})`} stroke={g} strokeWidth=".6" />
      <g fill="#F3E3E2" stroke={PAL.antique} strokeWidth=".4" strokeOpacity=".6">
        {Array.from({ length: 64 }, (_, i) => (
          <path key={i} d={`M${6 + i * 14} 743h5c-2 5 2 9 0 19h-5c-2-10 2-14 0-19Z`} />
        ))}
      </g>

      {/* Marble terrace with perspective joints */}
      <rect x="0" y="762" width="900" height="138" fill={`url(#${id('floor')})`} />
      <g stroke={PAL.antique} strokeWidth=".6" strokeOpacity=".22">
        {Array.from({ length: 13 }, (_, i) => {
          const x = -300 + i * 100;
          const xTop = x + (1200 - x) * 0.46;
          return <line key={i} x1={x} y1="900" x2={xTop} y2="762" />;
        })}
        {[790, 826, 870].map((y) => (
          <line key={y} x1="0" x2="900" y1={y} y2={y} />
        ))}
      </g>

      {/* Flower rangoli on the terrace, seen in perspective */}
      {bays.map((cx) => (
        <g key={`rangoli-${cx}`} transform={`translate(${cx} 832) scale(1 .3)`}>
          <circle r="86" fill={PAL.magenta} opacity=".85" />
          <path d={lotusPetals(16, 40, 84, 13)} fill={PAL.marigold} />
          <circle r="54" fill={PAL.peacock} />
          <path d={lotusPetals(12, 18, 50, 10)} fill={PAL.saffron} />
          <circle r="22" fill="#FFFDF8" />
          <path d={lotusPetals(8, 3, 20, 6)} fill={PAL.ruby} />
          {Array.from({ length: 24 }, (_, k) => {
            const a = (k / 24) * Math.PI * 2;
            return <circle key={k} cx={Math.cos(a) * 94} cy={Math.sin(a) * 94} r="4" fill="#FFFDF8" />;
          })}
        </g>
      ))}

      {/* Atmospheric haze: the wings sit further back than the central portal */}
      <rect x="0" y="240" width="900" height="660" fill={`url(#${id('haze')})`} />
    </svg>
  );
});

/* ------------------------------------------------------------------ */
/* Beyond the doors — a radiant ivory-and-blush hall                   */
/* ------------------------------------------------------------------ */

export const Interior = memo(function Interior() {
  const id = useIds();
  const g = `url(#${id('gold')})`;
  const pillars = [0, 1, 2, 3].map((d) => {
    const x = 6 + d * 17;
    const w = 13 - d * 2.6;
    const floorY = 342 - ((x + w / 2) / 72) * 128;
    const top = 190 - (floorY - 190) * 1.25;
    return { x, w, floorY, top };
  });
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 342" preserveAspectRatio="none" focusable="false" aria-hidden="true">
      <defs>
        <linearGradient id={id('gold')} x1="0" y1="0" x2="1" y2="1">
          {GOLD_STOPS}
        </linearGradient>
        <linearGradient id={id('bg')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBE3EA" />
          <stop offset=".55" stopColor="#FFF6EE" />
          <stop offset="1" stopColor="#FBE7EC" />
        </linearGradient>
        <linearGradient id={id('floor')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF7EE" />
          <stop offset="1" stopColor="#F6DCE4" />
        </linearGradient>
        <radialGradient id={id('bloom')} cx="100" cy="182" r="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".25" stopColor="#FFF6E2" stopOpacity=".95" />
          <stop offset=".6" stopColor="#FFE7C4" stopOpacity=".35" />
          <stop offset="1" stopColor="#FFE7C4" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="342" fill={`url(#${id('bg')})`} />
      <path d="M0 342H200L128 214H72Z" fill={`url(#${id('floor')})`} />
      <g stroke={PAL.antique} strokeOpacity=".28" strokeWidth=".5">
        {Array.from({ length: 7 }, (_, i) => (
          <line key={i} x1={72 + (i * 56) / 6} y1="214" x2={(i * 200) / 6} y2="342" />
        ))}
        {[226, 244, 270, 304].map((y) => (
          <line key={y} x1={72 - ((y - 214) / 128) * 72} x2={128 + ((y - 214) / 128) * 72} y1={y} y2={y} />
        ))}
      </g>
      {/* Receding colonnade with garlanded arches */}
      {pillars.map(({ x, w, floorY, top }, d) => (
        <g key={d}>
          {[x, 200 - x - w].map((px) => (
            <g key={px}>
              <rect x={px} y={top} width={w} height={floorY - top} fill="#FFFBF8" stroke={g} strokeWidth=".5" />
              <rect x={px - 1} y={top} width={w + 2} height={w * 0.5} fill={g} />
            </g>
          ))}
          <path
            d={`M${x + w} ${top + w}Q100 ${top - 22 + d * 6} ${200 - x - w} ${top + w}`}
            fill="none"
            stroke={g}
            strokeWidth={1.4 - d * 0.25}
          />
          <path
            d={`M${x + w} ${top + w + 4}Q100 ${top + 30 + d * 4} ${200 - x - w} ${top + w + 4}`}
            fill="none"
            stroke={PAL.marigold}
            strokeWidth={2.4 - d * 0.4}
            strokeDasharray="0.1 3"
            strokeLinecap="round"
          />
        </g>
      ))}
      {/* Mandapam glowing at the far end */}
      <g>
        <rect x="76" y="204" width="48" height="10" fill="#FFF8F2" stroke={g} strokeWidth=".6" />
        {[80, 90, 108, 118].map((x) => (
          <rect key={x} x={x} y="172" width="2.4" height="32" fill={g} />
        ))}
        <path d="M74 172C84 160 92 152 100 146C108 152 116 160 126 172Z" fill="#F4C9D7" stroke={g} strokeWidth=".7" />
        <path d="M82 172q9 12 18 0q9 12 18 0" fill="none" stroke="#E79AB4" strokeWidth="1.2" />
        <path d="M100 140c2 3 2 5 0 7-2-2-2-4 0-7Z" fill={g} />
      </g>
      <rect width="200" height="342" fill={`url(#${id('bloom')})`} />
    </svg>
  );
});

/* ------------------------------------------------------------------ */
/* Rosewood door leaf with gold inlay                                  */
/* ------------------------------------------------------------------ */

export const DoorLeaf = memo(function DoorLeaf({ mirrored = false }: { mirrored?: boolean }) {
  const id = useIds();
  const g = `url(#${id('gold')})`;
  const brass = `url(#${id('brass')})`;
  return (
    <svg
      className="block h-full w-full"
      viewBox="0 0 100 342"
      preserveAspectRatio="none"
      focusable="false"
      aria-hidden="true"
      style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
    >
      <defs>
        <linearGradient id={id('gold')} x1="0" y1="0" x2="1" y2="1">
          {GOLD_STOPS}
        </linearGradient>
        <linearGradient id={id('wood')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={PAL.rosewoodDark} />
          <stop offset=".35" stopColor={PAL.rosewood} />
          <stop offset=".62" stopColor={PAL.rosewoodLight} />
          <stop offset="1" stopColor="#3C1C17" />
        </linearGradient>
        <linearGradient id={id('sheen')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".08" />
          <stop offset=".5" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity=".18" />
        </linearGradient>
        <radialGradient id={id('brass')} cx=".35" cy=".3" r=".75">
          <stop offset="0" stopColor="#FFF0C9" />
          <stop offset=".45" stopColor={PAL.champagne} />
          <stop offset="1" stopColor={PAL.antiqueDeep} />
        </radialGradient>
      </defs>
      <rect width="100" height="342" fill={`url(#${id('wood')})`} />
      <rect x="3" y="3" width="94" height="336" fill="none" stroke={g} strokeWidth="2" />
      <rect x="7" y="7" width="86" height="328" fill="none" stroke={PAL.antique} strokeWidth=".7" />

      {/* Top panel: cusped arch with lotus medallion */}
      <path d="M14 112V54C14 32 34 22 50 16C66 22 86 32 86 54V112Z" fill="#3E1E19" stroke={g} strokeWidth="1.4" />
      <path d="M19 107V56C19 38 36 29 50 24C64 29 81 38 81 56V107Z" fill="none" stroke={PAL.antique} strokeWidth=".6" />
      <g transform="translate(50 70)">
        <circle r="17" fill="none" stroke={g} strokeWidth="1.3" />
        <circle r="15.4" fill="none" stroke={PAL.ruby} strokeWidth="2" />
        <path d={lotusPetals(8, 3, 14, 4.2)} fill={g} opacity=".9" />
        <circle r="3" fill={PAL.rose} />
      </g>

      {/* Middle panel: grand lotus medallion and gold vine */}
      <rect x="14" y="124" width="72" height="112" rx="3" fill="#3E1E19" stroke={g} strokeWidth="1.4" />
      <g transform="translate(50 180)">
        <circle r="27" fill="none" stroke={g} strokeWidth="1.4" />
        <circle r="24.5" fill="none" stroke={PAL.peacock} strokeWidth="2.6" />
        <circle r="23" fill="none" stroke={PAL.antique} strokeWidth=".6" strokeDasharray="0.1 2.6" strokeLinecap="round" />
        <path d={lotusPetals(12, 4, 21, 4.4)} fill={g} opacity=".92" />
        <path d={lotusPetals(6, 2, 11, 3.4)} fill="#F3DFAE" opacity=".85" transform="rotate(15)" />
        <circle r="3.4" fill={PAL.rose} />
      </g>
      <g fill="none" stroke={g} strokeWidth="1" strokeLinecap="round">
        <path d="M20 132c8 0 12 4 12 10M80 132c-8 0-12 4-12 10M20 228c8 0 12-4 12-10M80 228c-8 0-12-4-12-10" />
        <path d="M24 136c3 1 4 3 3 5M76 136c-3 1-4 3-3 5M24 224c3-1 4-3 3-5M76 224c-3-1-4-3-3-5" />
      </g>

      {/* Lower panel: lozenge with flower */}
      <rect x="14" y="248" width="72" height="78" rx="3" fill="#3E1E19" stroke={g} strokeWidth="1.4" />
      <path d="M50 258L76 287L50 316L24 287Z" fill="none" stroke={g} strokeWidth="1.2" />
      <g transform="translate(50 287)">
        <path d={lotusPetals(6, 2, 10, 3.6)} fill={g} />
        <circle r="2.4" fill={PAL.rose} />
      </g>

      {/* Brass bosses along the rails */}
      {[118, 242].flatMap((y) =>
        [14, 32, 50, 68, 86].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.4" fill={brass} />),
      )}
      {[30, 70, 150, 200, 270, 310].map((y) => (
        <circle key={y} cx="8" cy={y} r="2.6" fill={brass} />
      ))}

      {/* Yali-mask knocker on the meeting edge */}
      <g transform="translate(88 196)">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <circle key={i} cx={Math.cos(a) * 7.5} cy={Math.sin(a) * 7.5} r="2.2" fill={brass} />;
        })}
        <circle r="6.2" fill={brass} />
        <circle cx="-2" cy="-1.2" r=".9" fill={PAL.rosewood} />
        <circle cx="2" cy="-1.2" r=".9" fill={PAL.rosewood} />
        <path d="M-2.4 2.4q2.4 2 4.8 0" fill="none" stroke={PAL.rosewood} strokeWidth=".8" />
        <circle cy="15" r="7" fill="none" stroke={brass} strokeWidth="2.2" />
      </g>
      <rect width="100" height="342" fill={`url(#${id('sheen')})`} />
    </svg>
  );
});

/* ------------------------------------------------------------------ */
/* Lamps                                                               */
/* ------------------------------------------------------------------ */

interface LightProps {
  /** Seconds after the scene appears when this lamp is lit. */
  delay: number;
  reducedMotion: boolean;
}

function Flame({ x, y, scale = 1, delay, reducedMotion }: LightProps & { x: number; y: number; scale?: number }) {
  return (
    <motion.g
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9, delay, ease: 'easeOut' }}
    >
      <g className="lamp-flame" style={{ transformOrigin: `${x}px ${y}px` }}>
        <path
          d={`M${x} ${y - 16 * scale}c${5 * scale} ${7 * scale} ${6 * scale} ${12 * scale} 0 ${16 * scale}c${-6 * scale} ${-4 * scale} ${-5 * scale} ${-9 * scale} 0 ${-16 * scale}Z`}
          fill="#FFBE5C"
        />
        <path
          d={`M${x} ${y - 10 * scale}c${2.4 * scale} ${4 * scale} ${2.6 * scale} ${7 * scale} 0 ${10 * scale}c${-2.6 * scale} ${-3 * scale} ${-2.4 * scale} ${-6 * scale} 0 ${-10 * scale}Z`}
          fill="#FFF6DD"
        />
      </g>
    </motion.g>
  );
}

function Halo({ cx, cy, r, delay, reducedMotion, fill }: LightProps & { cx: number; cy: number; r: number; fill: string }) {
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.4, delay, ease: 'easeOut' }}
    />
  );
}

/** Tall brass kuthu vilakku standing on the steps (viewBox 0 0 60 340). */
export function KuthuVilakku({ className, delay, reducedMotion }: LightProps & { className: string }) {
  const id = useIds();
  const brass = `url(#${id('brass')})`;
  const wicks = [8, 19, 30, 41, 52];
  return (
    <svg className={className} viewBox="-30 -40 120 380" focusable="false" aria-hidden="true">
      <defs>
        <linearGradient id={id('brass')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={PAL.antiqueDeep} />
          <stop offset=".3" stopColor={PAL.champagne} />
          <stop offset=".45" stopColor="#FFF0C6" />
          <stop offset=".62" stopColor={PAL.champagne} />
          <stop offset="1" stopColor="#6A4A1D" />
        </linearGradient>
        <radialGradient id={id('halo')}>
          <stop offset="0" stopColor="#FFE3A8" stopOpacity=".85" />
          <stop offset=".45" stopColor="#FFE3A8" stopOpacity=".25" />
          <stop offset="1" stopColor="#FFE3A8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Halo cx={30} cy={52} r={58} delay={delay} reducedMotion={reducedMotion} fill={`url(#${id('halo')})`} />
      {/* Annam (swan) finial */}
      <path d="M30 4c4 0 6 4 4 8 6 2 10 8 8 16H18c0-6 4-12 10-14-2-4-1-10 2-10Z" fill={brass} />
      <rect x="28" y="28" width="4" height="30" fill={brass} />
      <ellipse cx="30" cy="40" rx="6" ry="2.4" fill={brass} />
      {/* Five-wick bowl */}
      <path d="M2 66C6 81 17 88 30 88S54 81 58 66Z" fill={brass} />
      <ellipse cx="30" cy="66" rx="28" ry="5" fill="#E9C989" stroke={PAL.antiqueDeep} strokeWidth=".6" />
      {wicks.map((x) => (
        <path key={x} d={`M${x - 3} 66l3-5 3 5Z`} fill={brass} />
      ))}
      {wicks.map((x, i) => (
        <Flame key={x} x={x} y={61} scale={0.72} delay={delay + i * 0.08} reducedMotion={reducedMotion} />
      ))}
      {/* Knopped stem and domed foot */}
      <rect x="27" y="88" width="6" height="196" fill={brass} />
      {[
        [104, 8, 3.4],
        [134, 10, 4.4],
        [172, 7, 3],
        [212, 11, 5],
        [252, 8, 3.4],
      ].map(([y, rx, ry]) => (
        <ellipse key={y} cx="30" cy={y} rx={rx} ry={ry} fill={brass} />
      ))}
      <path d="M5 330C9 302 21 288 30 284C39 288 51 302 55 330Z" fill={brass} />
      <rect x="1" y="328" width="58" height="8" rx="2" fill={brass} />
      <ellipse cx="30" cy="340" rx="34" ry="4" fill={PAL.rosewood} opacity=".14" />
    </svg>
  );
}

/** Hanging brass lantern drawn in palace units, centred on `cx`, hung from `top`. */
export function Lantern({ cx, top, delay, reducedMotion }: LightProps & { cx: number; top: number }) {
  const id = useIds();
  const brass = `url(#${id('brass')})`;
  const y = top + 64;
  return (
    <g>
      <defs>
        <linearGradient id={id('brass')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={PAL.antiqueDeep} />
          <stop offset=".45" stopColor="#F2D9A0" />
          <stop offset="1" stopColor={PAL.antiqueDeep} />
        </linearGradient>
        <radialGradient id={id('halo')}>
          <stop offset="0" stopColor="#FFE6B3" stopOpacity=".9" />
          <stop offset=".5" stopColor="#FFE6B3" stopOpacity=".25" />
          <stop offset="1" stopColor="#FFE6B3" stopOpacity="0" />
        </radialGradient>
      </defs>
      <line x1={cx} x2={cx} y1={top} y2={y - 6} stroke={PAL.antique} strokeWidth="1.1" strokeDasharray="3 2" />
      <Halo cx={cx} cy={y + 22} r={46} delay={delay} reducedMotion={reducedMotion} fill={`url(#${id('halo')})`} />
      <path d={`M${cx - 10} ${y + 2}C${cx - 8} ${y - 6} ${cx + 8} ${y - 6} ${cx + 10} ${y + 2}Z`} fill={brass} />
      <path d={`M${cx - 13} ${y + 2}H${cx + 13}L${cx + 11} ${y + 40}H${cx - 11}Z`} fill={brass} />
      <motion.path
        d={`M${cx - 8} ${y + 7}H${cx + 8}L${cx + 7} ${y + 35}H${cx - 7}Z`}
        fill="#FFE2A6"
        initial={reducedMotion ? false : { opacity: 0.25 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay }}
      />
      <g stroke={PAL.antiqueDeep} strokeWidth=".8" opacity=".7">
        <line x1={cx} x2={cx} y1={y + 7} y2={y + 35} />
        <line x1={cx - 8} x2={cx + 8} y1={y + 21} y2={y + 21} />
      </g>
      <Flame x={cx} y={y + 30} scale={0.55} delay={delay} reducedMotion={reducedMotion} />
      <path d={`M${cx - 11} ${y + 40}H${cx + 11}L${cx} ${y + 56}Z`} fill={brass} />
      <circle cx={cx} cy={y + 59} r="2.4" fill={brass} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Jasmine and rose garlands                                           */
/* ------------------------------------------------------------------ */

function Beads({
  points,
  roseEvery,
  big = false,
  marigold = false,
}: {
  points: Array<[number, number]>;
  roseEvery: number;
  big?: boolean;
  marigold?: boolean;
}) {
  return (
    <>
      {points.map(([x, y], i) => {
        const rose = roseEvery > 0 && i % roseEvery === Math.floor(roseEvery / 2);
        if (marigold && !rose) {
          const yellow = i % 3 === 1;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={big ? 4.8 : 4} fill={yellow ? '#FFC23A' : '#F5891B'} stroke={yellow ? '#E9A21A' : '#D9661A'} strokeWidth=".7" />
              <circle cx={x - 0.7} cy={y - 0.7} r={big ? 2 : 1.6} fill={yellow ? '#FFE07A' : '#FFB347'} />
            </g>
          );
        }
        if (rose) {
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={big ? 5.2 : 4.4} fill="#E79AB4" stroke="#C8728F" strokeWidth=".6" />
              <circle cx={x - 0.6} cy={y - 0.6} r={big ? 2.4 : 2} fill="#F6C3D3" />
            </g>
          );
        }
        return <circle key={i} cx={x} cy={y} r={big ? 3.6 : 3.1} fill="#FFFDF8" stroke="#E2D1B6" strokeWidth=".6" />;
      })}
    </>
  );
}

export const Garlands = memo(function Garlands() {
  const swags: Array<[number, number, number, number, number]> = [
    [34, 230, 196, 236, 40],
    [196, 236, 404, 236, 62],
    [404, 236, 566, 230, 40],
  ];
  const strands = [34, 196, 404, 566];
  const leaves: Array<[number, number, number]> = [];
  swags.forEach(([x1, y1, x2, y2, sag]) =>
    swagPoints(x1, y1 + 5, x2, y2 + 5, sag + 6, 22).forEach(([x, y], i) => leaves.push([x, y, i % 2 ? 35 : -35])),
  );
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 600 900" focusable="false" aria-hidden="true">
      {leaves.map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y + 3} rx="4.4" ry="1.8" fill="#8DAA87" opacity=".85" transform={`rotate(${r} ${x} ${y + 3})`} />
      ))}
      {swags.map(([x1, y1, x2, y2, sag], k) => (
        <g key={k}>
          <Beads points={swagPoints(x1, y1, x2, y2, sag, 5.4)} roseEvery={0} />
          <Beads points={swagPoints(x1, y1 + 6, x2, y2 + 6, sag + 6, 7.4)} roseEvery={6} big marigold />
          <Beads points={swagPoints(x1, y1 + 13, x2, y2 + 13, sag + 10, 6)} roseEvery={4} />
        </g>
      ))}
      {/* Hanging tassels where the swags meet */}
      {strands.map((x) => {
        const len = x === 34 || x === 566 ? 22 : 15;
        const pts: Array<[number, number]> = Array.from({ length: len }, (_, i) => [x, 240 + i * 5.6]);
        return (
          <g key={x}>
            <Beads points={pts} roseEvery={5} marigold />
            <circle cx={x} cy={244 + len * 5.6} r="5.6" fill="#E79AB4" stroke="#C8728F" strokeWidth=".6" />
            <path d={`M${x - 3} ${250 + len * 5.6}l3 9 3-9`} fill={PAL.champagne} />
          </g>
        );
      })}
      {/* Mango-leaf toran across the door lintel */}
      {Array.from({ length: 23 }, (_, i) => {
        const x = 199 + i * 9.3;
        return (
          <g key={`toran-${i}`}>
            <path d={`M${x} 412c4 6 4 16 0 24c-4-8-4-18 0-24Z`} fill={i % 2 ? '#3E8E41' : '#5DAA4C'} stroke="#2E6B30" strokeWidth=".5" />
            <circle cx={x} cy="411" r="2.6" fill={i % 2 ? '#F5891B' : '#FFC23A'} />
          </g>
        );
      })}

      {/* Garlands wound around the outer pillars */}
      {[58, 542].map((cx) => (
        <g key={cx}>
          {Array.from({ length: 6 }, (_, j) => {
            const y = 300 + j * 50;
            return <Beads key={j} points={swagPoints(cx - 23, y, cx + 23, y + 22, 6, 5.6)} roseEvery={5} marigold={j % 2 === 0} />;
          })}
        </g>
      ))}
    </svg>
  );
});

/* ------------------------------------------------------------------ */
/* Floral arrangements for the lower corners                           */
/* ------------------------------------------------------------------ */

function Rose({ x, y, r, tone = 0 }: { x: number; y: number; r: number; tone?: number }) {
  const outer = ['#F4C1D1', '#F7D3DE', '#EFB0C4'][tone] ?? '#F4C1D1';
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={outer} stroke="#D98EA8" strokeWidth=".8" />
      <circle cx={x + r * 0.08} cy={y - r * 0.05} r={r * 0.68} fill="#EDA6BE" />
      <path
        d={`M${x - r * 0.5} ${y}a${r * 0.5} ${r * 0.5} 0 0 1 ${r} 0M${x - r * 0.3} ${y + r * 0.2}a${r * 0.32} ${r * 0.32} 0 0 0 ${r * 0.6} 0`}
        fill="none"
        stroke="#D27F9C"
        strokeWidth={Math.max(0.6, r * 0.08)}
      />
      <circle cx={x} cy={y - r * 0.05} r={r * 0.22} fill="#D9819F" />
    </g>
  );
}

function Marigold({ x, y, r, yellow = false }: { x: number; y: number; r: number; yellow?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={lotusPetals(16, 0, r, r * 0.32)} fill={yellow ? '#FFC23A' : '#F5891B'} stroke={yellow ? '#E9A21A' : '#D9661A'} strokeWidth=".6" />
      <path d={lotusPetals(12, 0, r * 0.66, r * 0.26)} fill={yellow ? '#FFD966' : '#FFA63D'} transform="rotate(12)" />
      <circle r={r * 0.22} fill={yellow ? '#E9A21A' : '#D9661A'} />
    </g>
  );
}

function Leaf({ x, y, len, angle }: { x: number; y: number; len: number; angle: number }) {
  return (
    <path
      d={`M0 0C${len * 0.3} ${-len * 0.22} ${len * 0.75} ${-len * 0.2} ${len} 0C${len * 0.75} ${len * 0.2} ${len * 0.3} ${len * 0.22} 0 0Z`}
      transform={`translate(${x} ${y}) rotate(${angle})`}
      fill="#8DAA87"
      stroke="#6E8C68"
      strokeWidth=".7"
    />
  );
}

function Jasmine({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={lotusPetals(5, 0.5, 6, 2.6)} fill="#FFFDF8" stroke="#E2D1B6" strokeWidth=".5" />
      <circle r="1.2" fill="#F3DFAE" />
    </g>
  );
}

/** Bottom-left arrangement (viewBox 0 0 240 220); mirror it for the right corner. */
export const CornerFlorals = memo(function CornerFlorals({ className }: { className: string }) {
  const id = useIds();
  return (
    <svg className={className} viewBox="0 0 240 220" focusable="false" aria-hidden="true">
      <defs>
        <linearGradient id={id('urn')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={PAL.antiqueDeep} />
          <stop offset=".4" stopColor="#F2D9A0" />
          <stop offset="1" stopColor={PAL.antique} />
        </linearGradient>
      </defs>
      <Leaf x={70} y={120} len={70} angle={-150} />
      <Leaf x={92} y={110} len={64} angle={-70} />
      <Leaf x={130} y={124} len={78} angle={-20} />
      <Leaf x={150} y={150} len={70} angle={10} />
      <Leaf x={60} y={140} len={56} angle={-200} />
      <Marigold x={44} y={92} r={15} />
      <Marigold x={172} y={102} r={13} yellow />
      <Marigold x={196} y={150} r={11} />
      <Marigold x={120} y={150} r={12} yellow />
      {[
        [66, 70],
        [150, 66],
        [24, 124],
        [206, 124],
      ].map(([x, y]) => (
        <g key={`bg-${x}`} transform={`translate(${x} ${y})`}>
          <path d={lotusPetals(3, 0, 8, 5)} fill="#C2185B" />
          <path d={lotusPetals(3, 0, 6, 4)} fill="#E0458A" transform="translate(9 5) rotate(30)" />
        </g>
      ))}
      <Rose x={96} y={106} r={26} />
      <Rose x={140} y={122} r={21} tone={1} />
      <Rose x={62} y={128} r={19} tone={2} />
      <Rose x={118} y={80} r={16} tone={1} />
      <Rose x={170} y={146} r={15} />
      {[
        [76, 84, 1.1],
        [146, 96, 1],
        [42, 112, 0.9],
        [104, 136, 1],
        [184, 126, 0.9],
        [128, 58, 0.9],
        [158, 76, 0.8],
        [34, 140, 0.8],
      ].map(([x, y, s]) => (
        <Jasmine key={`${x}-${y}`} x={x ?? 0} y={y ?? 0} s={s} />
      ))}
      <path d="M0 220V184C16 168 52 160 98 160C132 160 156 166 160 178C163 194 150 210 136 220Z" fill={`url(#${id('urn')})`} />
      <path d="M0 168H112C126 168 132 172 130 176H0Z" fill={`url(#${id('urn')})`} />
      <path d="M0 190C24 180 70 176 140 182" fill="none" stroke="#FFF0C6" strokeWidth="1.4" opacity=".7" />
      <path d="M0 204C40 200 100 200 150 206" fill="none" stroke={PAL.antiqueDeep} strokeWidth="1" opacity=".5" />
    </svg>
  );
});

/** Small gold lotus emblem for the plaque button. */
export function PlaqueEmblem({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="-12 -10 24 20" focusable="false" aria-hidden="true">
      <path d="M0-8C3-4 3.4 0 0 5-3.4 0-3-4 0-8Z" fill="currentColor" />
      <path d="M-1 5C-6 4-9 0-10-4-6-4-2-1-1 5ZM1 5C6 4 9 0 10-4 6-4 2-1 1 5Z" fill="currentColor" opacity=".85" />
      <path d="M-7 7H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
