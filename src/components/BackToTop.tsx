import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

/** Back-to-top button with a thin gold ring that fills as the page is read. */
export function BackToTop() {
  const [show, setShow] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

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
          className="group fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-pearl/90 text-burgundy shadow-[0_10px_24px_-12px_rgba(117,68,87,0.55)] backdrop-blur-sm transition-colors hover:bg-blush sm:right-5"
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
        >
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
            <circle cx="24" cy="24" r="22" fill="none" stroke="#E8C5D2" strokeWidth="1.5" />
            <motion.circle cx="24" cy="24" r="22" fill="none" stroke="#B58A45" strokeWidth="1.8" strokeLinecap="round" style={{ pathLength: progress }} />
          </svg>
          <ArrowUp size={20} aria-hidden="true" className="relative transition-transform duration-300 group-hover:-translate-y-0.5" />
        </motion.a>
      )}
    </AnimatePresence>
  );
}
