import { Globe, Heart, MessageCircle } from 'lucide-react';

/** Studio credit shown at the very bottom of the invitation. */
const STUDIO = {
  name: 'MKZORA',
  website: 'https://mkzora.com/',
  websiteLabel: 'mkzora.com',
  phoneDisplay: '+91 88389 35124',
  whatsappNumber: '918838935124',
  whatsappMessage:
    'Hi MKZORA, I saw the Praveen & Kaviya digital wedding invitation and would love a digital invitation like this for my event.',
};

export function DesignerCredit() {
  const whatsapp = `https://wa.me/${STUDIO.whatsappNumber}?text=${encodeURIComponent(STUDIO.whatsappMessage)}`;
  return (
    <div className="mx-auto mt-10 max-w-xl border-t border-gold/30 pt-8">
      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-caps text-[0.95rem] uppercase tracking-[0.18em] text-ivory/90 sm:text-[1.02rem]">
        Digital invitation made with
        <Heart size={17} className="fill-[#e0596b] text-[#e0596b]" aria-label="love" role="img" />
        by
        <a
          href={STUDIO.website}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold tracking-[0.24em] text-gold-light underline decoration-gold/50 underline-offset-4 transition-colors hover:text-amber-lamp"
        >
          {STUDIO.name}
        </a>
      </p>
      <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href={STUDIO.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-gold/60 px-5 text-[1rem] text-ivory transition-colors hover:border-gold-light hover:bg-white/5"
        >
          <Globe size={18} className="text-gold-light" aria-hidden="true" />
          {STUDIO.websiteLabel}
        </a>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-gold/60 px-5 text-[1rem] text-ivory transition-colors hover:border-gold-light hover:bg-white/5"
          aria-label={`Chat with ${STUDIO.name} on WhatsApp, ${STUDIO.phoneDisplay}`}
        >
          <MessageCircle size={18} className="text-gold-light" aria-hidden="true" />
          {STUDIO.phoneDisplay}
        </a>
      </div>
    </div>
  );
}
