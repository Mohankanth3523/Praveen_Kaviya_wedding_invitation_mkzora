/**
 * Single source of truth for every piece of invitation content.
 * Edit this file to change names, dates, venues, family details or photos.
 * The 3D scene and UI components only read from here.
 *
 * Fields marked `verify` are intentionally left out of the public page until the
 * family confirms them. Never fill them with guesses.
 */

export interface Venue {
  name: string;
  /** Address lines exactly as they should be printed. */
  addressLines: string[];
  /** Text used for the Google Maps search link. */
  mapsQuery: string;
}

export interface Person {
  name: string;
  qualifications?: string;
  /** Short role shown above the name, e.g. "The Groom". */
  role: string;
  /** Parent lines, already confirmed. Empty array = omit from the page. */
  parents: string[];
}

export interface Photo {
  /** Paths are relative to /public so they work under any base path. */
  webp: { src: string; width: number }[];
  jpg: { src: string; width: number }[];
  width: number;
  height: number;
  alt: string;
}

export interface CalendarEventConfig {
  /** Local wall-clock times in the time zone below, ISO without offset. */
  start: string;
  end: string;
  timeZone: 'Asia/Kolkata';
  title: string;
  description: string;
}

export interface PendingVerification {
  field: string;
  note: string;
}

export interface Ritual {
  name: string;
  tamil: string;
  description: string;
}

export interface WeddingConfig {
  couple: { short: string; groomShort: string; brideShort: string };
  dateLabel: string;
  dateISO: string;
  intro: { eyebrow: string; button: string };
  invitation: { blessing: string; request: string };
  ceremony: {
    heading: string;
    timeLabel: string;
    timeRange: string;
    venue: Venue;
    calendar: CalendarEventConfig;
  };
  reception: {
    heading: string;
    /** Confirmed start time. `null` keeps the time off the page. */
    time: string | null;
    venue: Venue;
  };
  family: {
    heading: string;
    groom: Person;
    bride: Person;
  };
  portraitCaption: string;
  /** Thirukkural 45 (Chapter: Domestic Life). Public-domain classical verse. */
  verse: { source: string; tamilLines: string[]; meaning: string };
  /** Exact instant of the muhurtham, with the IST offset, for the countdown. */
  countdownTarget: string;
  rituals: { heading: string; intro: string; items: Ritual[] };
  guestNotes: { heading: string; notes: { title: string; text: string }[] };
  closing: { line: string; signature: string };
  photos: {
    hero: Photo;
    gallery: Photo[];
    reception: Photo;
  };
  audio: {
    /** Optional licensed audio file in /public/assets/audio. `null` = use the
     *  gentle synthesised tanpura drone built into the site. */
    src: string | null;
  };
  /** Shown only in the README / console for the site owner. */
  pendingVerification: PendingVerification[];
}

const photo = (
  base: string,
  sizes: number[],
  width: number,
  height: number,
  alt: string,
): Photo => ({
  webp: sizes.map((w) => ({ src: `assets/photos/${base}-${w}.webp`, width: w })),
  jpg: sizes.map((w) => ({ src: `assets/photos/${base}-${w}.jpg`, width: w })),
  width,
  height,
  alt,
});

export const wedding: WeddingConfig = {
  couple: { short: 'Praveen & Kaviya', groomShort: 'Praveen', brideShort: 'Kaviya' },
  dateLabel: 'Sunday, 29 November 2026',
  dateISO: '2026-11-29',
  intro: {
    eyebrow: 'An invitation to a sacred beginning',
    button: 'Open Wedding Invitation',
  },
  invitation: {
    blessing: 'With the blessings of the Almighty',
    request: 'Request the pleasure of your company as they begin their journey together.',
  },
  ceremony: {
    heading: 'Wedding Ceremony',
    timeLabel: 'Muhurtham',
    timeRange: '4:45 AM – 5:33 AM',
    venue: {
      name: 'Arulmigu Sri Aditheswarar Temple',
      addressLines: ['Devasthanam, Old Vaniyambadi', 'Vaniyambadi – 635751', 'Tamil Nadu, India'],
      mapsQuery: 'Arulmigu Sri Aditheswarar Temple, Old Vaniyambadi, Vaniyambadi 635751, Tamil Nadu, India',
    },
    calendar: {
      start: '2026-11-29T04:45:00',
      end: '2026-11-29T05:33:00',
      timeZone: 'Asia/Kolkata',
      title: 'Wedding of Praveen & Kaviya — Muhurtham',
      description:
        'With the blessings of the Almighty, Praveen & Kaviya request the pleasure of your company. Muhurtham 4:45 AM – 5:33 AM.',
    },
  },
  reception: {
    heading: 'Reception',
    time: null,
    venue: {
      name: 'V.N.G. Palace',
      addressLines: ['Survey No. 243/3, NH46,', 'Marapattu Village,', 'Vaniyambadi – 635751,', 'Tamil Nadu, India.'],
      mapsQuery: 'V.N.G. Palace, NH46, Marapattu Village, Vaniyambadi 635751, Tamil Nadu, India',
    },
  },
  family: {
    heading: 'With the Blessings of Our Families',
    groom: {
      role: 'The Groom',
      name: 'S. Praveen Kumar',
      qualifications: 'M.S. (Germany)',
      parents: [],
    },
    bride: {
      role: 'The Bride',
      name: 'R. Kaviya',
      qualifications: 'M.B.A.',
      parents: ['Daughter of Mrs. R. Kavitha Selvam, M.A., B.Ed., M.Phil.'],
    },
  },
  portraitCaption: 'Two hearts. One beautiful journey.',
  verse: {
    source: 'Thirukkural · 45',
    tamilLines: ['அன்பும் அறனும் உடைத்தாயின் இல்வாழ்க்கை', 'பண்பும் பயனும் அது.'],
    meaning: 'When a home is filled with love and virtue, that itself is its grace and its fulfilment.',
  },
  countdownTarget: '2026-11-29T04:45:00+05:30',
  rituals: {
    heading: 'The Sacred Rituals',
    intro: 'The timeless moments of a Tamil Hindu wedding, celebrated with the blessings of elders and the music of the nadaswaram.',
    items: [
      {
        name: 'Kashi Yatra',
        tamil: 'காசி யாத்திரை',
        description: 'In playful tradition, the groom sets out for a life of learning, until the bride’s father persuades him to accept his daughter’s hand.',
      },
      {
        name: 'Maalai Maatral',
        tamil: 'மாலை மாற்றல்',
        description: 'The bride and groom exchange fragrant garlands three times, each offering themselves to the other.',
      },
      {
        name: 'Oonjal',
        tamil: 'ஊஞ்சல்',
        description: 'Seated together on a decorated swing, the couple is blessed with songs, milk and coloured rice balls to ward off the evil eye.',
      },
      {
        name: 'Kanyadaanam',
        tamil: 'கன்னிகாதானம்',
        description: 'The bride’s parents place her hand in the groom’s, entrusting him with her happiness for a lifetime.',
      },
      {
        name: 'Mangalya Dharanam',
        tamil: 'மாங்கல்ய தாரணம்',
        description: 'At the auspicious muhurtham, to the crescendo of the getti melam, the groom ties the sacred thali.',
      },
      {
        name: 'Saptapadi',
        tamil: 'சப்தபதி',
        description: 'Seven steps around the sacred fire, each a vow of companionship, strength and devotion.',
      },
    ],
  },
  guestNotes: {
    heading: 'For Our Guests',
    notes: [
      {
        title: 'A dawn muhurtham',
        text: 'The muhurtham is between 4:45 AM and 5:33 AM. Kindly arrive a little early so you are seated before the sacred moment.',
      },
      {
        title: 'Save the date',
        text: 'Add the muhurtham to your calendar so the early start doesn’t take you by surprise.',
      },
      {
        title: 'Finding the venues',
        text: 'Directions to Arulmigu Sri Aditheswarar Temple and to V.N.G. Palace open in Google Maps.',
      },
    ],
  },
  closing: {
    line: 'Your presence and blessings will make our celebration complete.',
    signature: 'With love, Praveen & Kaviya',
  },
  photos: {
    hero: photo(
      'couple-temple-lamps',
      [800, 1536],
      1536,
      1024,
      'Praveen and Kaviya standing together in a temple courtyard, both wearing jasmine and lotus garlands; Kaviya in a red silk saree and Praveen in a navy suit, with brass lamps and carved pillars behind them.',
    ),
    gallery: [
      photo(
        'couple-jasmine-pillars',
        [800, 1024],
        1024,
        1536,
        'Praveen holding Kaviya’s hand among carved temple pillars hung with jasmine and rose garlands; Kaviya wears a red and gold silk saree with jasmine in her hair.',
      ),
      photo(
        'couple-studio',
        [800, 1024],
        1024,
        1536,
        'Studio portrait of Praveen and Kaviya; Kaviya in a magenta and gold silk saree with gold jewellery, Praveen in a navy suit with his arm around her shoulder.',
      ),
    ],
    reception: photo(
      'couple-full-length',
      [800, 1024],
      1024,
      1536,
      'Full-length portrait of Kaviya in a gold-and-red silk saree and Praveen in a navy suit, both wearing lotus and jasmine garlands and holding a gift together.',
    ),
  },
  audio: { src: 'assets/audio/wedding-music.mp3' },
  pendingVerification: [
    {
      field: 'family.groom.parents',
      note: "Groom's parents and family details were not legible in the supplied files; add them only once confirmed.",
    },
    {
      field: 'reception.time',
      note: 'No confirmed reception start time. Leave null until the family confirms it.',
    },
    {
      field: '11:30 AM',
      note: 'One printed invitation mentions 11:30 AM; its meaning is unconfirmed, so it is not shown anywhere.',
    },
  ],
};

export const SITE_TITLE = `${wedding.couple.short} — Wedding Invitation`;

/**
 * RSVP backend: the Google Apps Script web-app URL (Deploy → Manage deployments → Web app URL).
 * It is a public endpoint, not a secret, so it can live here. It looks like
 *   https://script.google.com/macros/s/AKfycb…/exec
 * VITE_RSVP_ENDPOINT in a .env file overrides it (useful for a test deployment).
 * Until it is set, the form explains that the response could not be saved.
 */
export const RSVP_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycby4pCKK4i6AHyGIgQPHz2asoKQyiXTi7i2fjvALjM-ldnU7ih2Cqu5DUTVJ9_qDAz9e/exec';

export const RSVP_ENDPOINT: string =
  ((import.meta.env.VITE_RSVP_ENDPOINT as string | undefined) ?? '').trim() || RSVP_APPS_SCRIPT_URL;
