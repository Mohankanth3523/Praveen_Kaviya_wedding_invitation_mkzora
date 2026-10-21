import { motion } from 'framer-motion';
import { wedding } from '../../config/wedding';

/**
 * Scene D (before opening): the rolled ivory scroll tied with a blush ribbon
 * and a gold seal. The visitor opens it with the button.
 */
export function RolledScroll({ onOpen, reducedMotion }: { onOpen: () => void; reducedMotion: boolean }) {
  return (
    <motion.div
      className="flex flex-col items-center"
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reducedMotion ? 0.4 : 1.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative w-[min(30rem,84vw)]" aria-hidden="true">
        {/* Soft glow */}
        <div className="absolute -inset-10 -z-10 rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,231,194,0.9),rgba(255,231,194,0))]" />
        {/* The two rollers held together, parchment edge between them */}
        <div className="relative h-[46px]">
          <div className="paper absolute inset-x-2 top-[14px] h-[18px] rounded-sm shadow-[0_8px_18px_-10px_rgba(117,68,87,0.6)]" />
          <div className="roller absolute inset-x-0 top-0 h-4 rounded-full" />
          <div className="roller absolute inset-x-0 bottom-0 h-4 rounded-full" />
          <div className="roller-cap absolute -left-2 top-[-4px] h-6 w-6 rounded-full" />
          <div className="roller-cap absolute -right-2 top-[-4px] h-6 w-6 rounded-full" />
          <div className="roller-cap absolute -left-2 bottom-[-4px] h-6 w-6 rounded-full" />
          <div className="roller-cap absolute -right-2 bottom-[-4px] h-6 w-6 rounded-full" />
          {/* Ribbon and seal */}
          <div className="absolute inset-y-[-10px] left-1/2 w-7 -translate-x-1/2 bg-gradient-to-b from-[#F2BFD0] to-[#E3A8BD]" />
          <div className="scroll-seal absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full">
            <span className="font-display text-[1.05rem] italic text-[#FFF6DD]">P&amp;K</span>
          </div>
        </div>
      </div>
      <p className="mt-8 max-w-sm text-center font-display text-[1.2rem] italic text-burgundy">{wedding.invitation.request}</p>
      <button type="button" onClick={onOpen} className="btn-primary mt-6 px-8">
        Open Invitation
      </button>
    </motion.div>
  );
}
