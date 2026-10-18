# Praveen & Kaviya — 3D Temple Wedding Invitation

A cinematic digital invitation. Visitors arrive at a Tamil temple gopuram before dawn, open the carved
teak doors, travel down a lamp-lit pillared hall, and an ivory parchment unrolls in the mandapam. The
ceremony details, couple portraits, reception card and family blessings follow below.

Built with React 18, TypeScript, Vite, Tailwind CSS, Three.js (React Three Fiber and Drei), Framer
Motion and Lucide icons. The site is fully static. RSVPs are saved to the family's private Google Sheet
by a Google Apps Script web app (`apps-script/Code.gs`). Setup steps are in
**[RSVP_SETUP.md](RSVP_SETUP.md)**.

The first screen shows only the names, the date and an **Open Wedding Invitation** button. The page
stays locked until the visitor opens the doors. Once the parchment has unfolded, they scroll down for
these sections:

1. Thirukkural blessing verse (Tamil with English meaning)
2. Wedding ceremony details, directions, calendar and sharing
3. Couple portrait
4. Live countdown to the muhurtham
5. The sacred rituals of a Tamil wedding
6. Reception card
7. Photo gallery (tap a photo to view it larger)
8. Notes for guests
9. **RSVP**: Kindly Confirm Your Presence (saved to Google Sheets)
10. Family blessings and closing

The verse, rituals and guest notes are edited in `src/config/wedding.ts` like everything else.

---

## Quick start

Requirements: Node.js 22 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script              | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Local development server with hot reload        |
| `npm run typecheck` | Strict TypeScript check                         |
| `npm run lint`      | ESLint (TypeScript + React hooks rules)         |
| `npm run build`     | Type-check, then production build into `dist/`  |
| `npm run preview`   | Serve the production build locally              |
| `npm test`          | RSVP test suite: runs the real Apps Script against a fake sheet (no credentials needed) |

Useful URLs while testing:

- `?lite` forces the illustrated (non-WebGL) stage, the same one used on devices without WebGL or with
  very little memory.
- Turn on "Reduce motion" in your OS to see the short transition. The invitation appears directly.

---

## Editing the invitation content

**All wording, dates, venues, family details and photo references live in one typed file:**
`src/config/wedding.ts`. The 3D scene and the components only read from it.

- `reception.time` is `null` on purpose. No reception start time has been confirmed, so none is shown.
  Set it to a string such as `'7:00 PM onwards'` once the family confirms it.
- `family.groom.parents` is empty on purpose. See "Items to verify" below.
- The wedding calendar event (`ceremony.calendar`) uses local times in `Asia/Kolkata`. The downloaded
  `.ics` includes the IST time-zone definition.

## Replacing photos

Photos are in `public/assets/photos/`. Each has a WebP file and a JPEG fallback at two widths:

| Role in the site                        | Files                          | Source photograph                                |
| --------------------------------------- | ------------------------------ | ------------------------------------------------ |
| Main couple portrait (Scene 6)          | `couple-temple-lamps-*`        | Golden Temple Wedding Portrait.png               |
| Gallery, left                           | `couple-jasmine-pillars-*`     | Temple Wedding Portrait with Jasmine Garlands.png |
| Gallery, right                          | `couple-studio-*`              | Traditional South Indian Wedding Portrait.png    |
| Reception card                          | `couple-full-length-*`         | Traditional Indian Wedding Portrait.png          |

The originals were only resized and re-encoded. There is no retouching, face editing or colour change.
To swap a photo, export new files with the same names and sizes (or update the `photo(...)` entries in
`wedding.ts`, including `width`/`height` and the `alt` text). Example using ImageMagick:

```bash
magick original.png -resize 800x  -quality 86 couple-studio-800.webp
magick original.png -resize 800x  -quality 86 couple-studio-800.jpg
magick original.png -resize 1024x -quality 86 couple-studio-1024.webp
magick original.png -resize 1024x -quality 86 couple-studio-1024.jpg
```

After replacing any file in `public/`, bump `CACHE` in `public/sw.js` (for example `pk-invitation-v2`) so
returning visitors get the new version.

## Ambient sound

Sound is **off by default** and only starts when a visitor taps the speaker button. With no audio file
configured, the site plays a soft tanpura drone with an occasional distant temple bell. It's generated
in the browser, so there's nothing to license. To use your own licensed recording, place it at
`public/assets/audio/ambient.mp3` and set `audio.src: 'assets/audio/ambient.mp3'` in `wedding.ts`.

## The 3D temple

No licensed photoreal temple model was available, so the temple is built procedurally in
`src/scenes/`, along with the textures it uses (granite, teak, floor slabs, kolam). Nothing is
downloaded at runtime.

| File                  | Contents                                                                     |
| --------------------- | ---------------------------------------------------------------------------- |
| `Gopuram.tsx`         | Six-tier gopuram with kalasams, base mouldings, niches, porch pillars, kolam |
| `TempleDoors.tsx`     | Teak doors with brass studs and bands, hinged pivots, door-seam light, light shaft |
| `TempleInterior.tsx`  | Pillared hall with Dravidian pillars, beams and lotus ceiling medallions     |
| `Mandapam.tsx`        | Three-tier plinth, pillars, canopy and dome, gilded prabha arch, overhead light |
| `Decor.tsx`           | Brass kuthu vilakku and clay agal lamps, marigold/jasmine garlands, mango-leaf toran |
| `Effects.tsx`         | GPU flames, floating dust, falling petals, pre-dawn sky, palm silhouettes    |
| `CameraSequence.tsx`  | Camera path from the entrance to the mandapam                                |

If you later license a GLB model, put it in `public/assets/models/`, load it with Drei's `useGLTF`
inside `TempleScene.tsx`, and keep the door leaves as separate pivoted nodes.

### Experience states

`src/hooks/useInvitationSequence.ts` is the single state machine:
`intro → opening → entering → mandapam → invitation → details`. Timers in the hook drive every phase,
and the 3D scene only renders progress. A stalled GPU can't trap a visitor (it falls back to the
illustrated stage), and repeated clicks are ignored. `InvitationPanel.tsx` is kept but not used, in case
you want a "View Full Invitation" pop-up again later.

### Performance and fallbacks

- The 3D chunk is lazy-loaded. Photos are lazy-loaded WebP with JPEG fallback.
- Device pixel ratio is capped (1.5 on phones, 1.75 on desktop) and drops to 1 if frame rate falls.
- Phones get a shorter hall, fewer particles and petals, no real-time shadows and no MSAA.
- Rendering pauses when the stage is scrolled out of view or the full-invitation panel is open.
- If WebGL is missing, memory is very low, the context is lost, or the scene takes more than 12 s to
  start, the site switches to an illustrated SVG/CSS stage. All wedding details are always plain HTML
  below the stage (and inside `<noscript>`).

---

## Deploying

The site is fully static. `npm run build` outputs `dist/`. Hashed JS/CSS goes to `dist/static/`, and
photos stay at `dist/assets/` so they can be replaced by name.

### Cloudflare Pages

1. Push this folder to a GitHub/GitLab repository.
2. In Cloudflare → Workers & Pages → Create → Pages → Connect to Git, choose the repo.
3. Build command: `npm run build`. Output directory: `dist`. Set the env var `NODE_VERSION` = `22`.
4. Make sure the Apps Script web-app URL is set in `src/config/wedding.ts` (see **RSVP_SETUP.md**).
5. Deploy. `public/_headers` sets caching. Cloudflare already serves `index.html` for unknown paths, so
   no redirect rule is needed (`public/_redirects` is intentionally empty).

Direct upload without Git: `npx wrangler pages deploy dist --project-name praveen-kaviya`.

### Other static hosts

The whole site, including the RSVP form, works on any static host (Netlify, Vercel, GitHub Pages and so
on), because RSVPs go straight to the Apps Script URL.

Once deployed, the "Share Invitation" buttons share whatever URL the visitor is on. No URL is
hard-coded.

---

## Items to verify before sharing

These were deliberately left off the public page:

1. **Groom's parents and family details.** The supplied files were four couple portraits, not the
   printed invitation cards. Only the details given in the brief are shown (groom S. Praveen Kumar,
   M.S. (Germany); bride R. Kaviya, M.B.A.; bride's mother Mrs. R. Kavitha Selvam, M.A., B.Ed., M.Phil.).
   Add the groom's family in `family.groom.parents` once confirmed.
2. **Reception start time.** It isn't confirmed, so it isn't shown.
3. **"11:30 AM".** It appears on one printed card with an unclear meaning, so it isn't displayed. The
   muhurtham shown is 4:45 AM – 5:33 AM.
4. No RSVP endpoint, phone number, website URL or QR destination was invented. Add them only if the
   family provides them.
