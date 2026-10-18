import { AnimatePresence, motion } from 'framer-motion';

/** Polite live region for share/calendar/audio feedback. */
export function Toast({ message }: { message: string | null }) {
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4">
      <AnimatePresence>
        {message && (
          <motion.p
            key={message}
            className="max-w-sm rounded-full border border-gold/50 bg-stone/95 px-5 py-3 text-center text-[0.95rem] text-ivory shadow-xl"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
