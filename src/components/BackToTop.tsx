import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 1.2);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.a
          href="#invitation"
          aria-label="Return to top"
          className="on-dark fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 bg-stone/80 text-gold-light shadow-lg backdrop-blur-sm sm:right-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <ArrowUp size={20} aria-hidden="true" />
        </motion.a>
      )}
    </AnimatePresence>
  );
}
