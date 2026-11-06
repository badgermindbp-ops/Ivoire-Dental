# Ivoire Dental Studio — *The Art of Smiling*

A cinematic, 3D character-driven website for a modern dental clinic. Built with React 19, TypeScript, Vite, Tailwind CSS v4, GSAP + ScrollTrigger, Lenis, React Three Fiber and Framer Motion.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build → dist/
npm run preview   # serve the production build
```

---

## Before launch: replace the placeholders

Every clinic detail lives in **`src/config/clinic.ts`**. Nothing in it is a real person, credential or review.

| What | Where | Notes |
|---|---|---|
| Name, phone, WhatsApp, email, address, hours, socials | `clinic.contact`, `clinic.address`, `clinic.hours`, `clinic.social` | `whatsappE164` is digits only (e.g. `919876543210`). |
| Production URL | `clinic.url` | Used for canonical + Open Graph URLs. |
| Doctors | `clinic.doctors` | Set `portrait` to an image path (e.g. `/doctors/dr-name.jpg` in `public/`) and `placeholder: false`. Use verified qualifications only. |
| Testimonials | `clinic.testimonials` | Publish only real, consented reviews. Set `verified: true` (and optionally `rating`) — stars only appear when verified. |
| Before/after | `src/components/SmileIllustration.tsx` | Currently an illustration, labelled "Illustrative example — not a patient result". Swap in consented clinical photos. |
| Structured data | `clinic.seo.structuredDataVerified` | Set to `true` once address/phone/hours are verified; `Dentist` JSON-LD is then injected at build time. |
| Social share image | `public/og-image.jpg` | Generated from the hero; replace if you like. |

## Booking backend

The form is a **request**, never a fake confirmation.

- Set `VITE_BOOKING_ENDPOINT` (e.g. in `.env.production`) to an endpoint that accepts `POST` JSON:
  `{ name, phone, email, treatment, date, message, source: "website" }`
- Respond `2xx` → the UI shows **"Request received"**.
- Respond `2xx` with `{ "status": "confirmed", "reference": "ABC-123" }` → the UI shows **"You're booked"** with the reference.
- Non-2xx / network error → the UI says the request was **not sent** and offers WhatsApp + phone.
- **No endpoint configured** → "hand-off" mode: nothing is sent; the visitor gets a WhatsApp message prefilled with their details, plus click-to-call.

Client: `src/lib/booking.ts`.

## Architecture

```
src/
  config/clinic.ts          ← all clinic content & settings
  animations/               ← scroll timelines (hero, story, technology) + shared state objects
  three/                    ← 3D, lazy-loaded (three.js never ships in the entry bundle)
    toothGeometry.ts        ← procedural teeth: signed-distance fields → marching cubes
    ToothMascot.tsx         ← the character: enamel, conformed face, morph-target smile, blink, gaze
    HeroScene / StoryScene / SpecimenScene / ScanScene / FooterScene
    SceneCanvas.tsx         ← shared canvas: renders only when on screen, DPR caps on mobile
  sections/                 ← Hero, Story, Treatments, Technology, Doctors, Transformation, Testimonials, Booking, Footer
  components/               ← Nav, Loader, TreatmentPanel, art & UI primitives (MagneticButton, SplitWords, Counter)
  lib/                      ← gsap setup, Lenis, booking client, store, env/media helpers
```

**No external 3D or image assets.** The tooth character, treatment specimens and the scanned dental arch are generated procedurally at runtime (SDF + marching cubes); lighting uses local Lightformers instead of a downloaded HDR.

### Motion system
- **Hero:** pinned, scroll-scrubbed GSAP timeline — the character turns to face you, the camera dollies in, it moves right, the studio becomes a 3D dental environment (halo, grid, ghost specimens, particles, light streaks) and the headline splits apart word by word.
- **Story:** pinned word-by-word reveal; the mascot rises in, tilts toward the text and beams when the sentence completes.
- **Treatments:** pinned horizontal track (desktop) with mask reveals, a live connecting line, cursor "View" bubble, blueprint hover reveal, and a 3D specimen that changes per treatment. Native swipe rail on touch devices.
- **Technology:** scroll-driven intraoral scan → 3D plan → X-ray diagnostics → finished model, with a scroll-controlled camera orbit.
- **Reduced motion:** no pinning, no scrubbing, no smooth-scroll hijack; a calm static composition with all content visible.

### Accessibility & resilience
Semantic landmarks and headings, skip link, keyboard-operable everything (slider: arrows/Home/End; dialogs: focus moved in, trapped, Esc to close, focus restored), labelled form fields with inline errors, `prefers-reduced-motion` respected, and an illustrated SVG mascot fallback when WebGL is unavailable.
