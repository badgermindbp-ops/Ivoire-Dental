/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CLINIC CONFIGURATION — the single source of truth for every clinic detail.
 * ─────────────────────────────────────────────────────────────────────────────
 *  Everything marked `PLACEHOLDER` must be replaced with verified, clinic-approved
 *  information before launch. Nothing here is a real person, credential or review.
 *
 *  - Doctor names, qualifications and portraits are sample content.
 *  - Testimonials are sample copy; set `verified: true` only for real, consented reviews.
 *  - Structured data (JSON-LD) is only emitted when `seo.structuredDataVerified` is true.
 *  - Booking: set `booking.endpoint` to your API. Until then the form never claims
 *    a booking succeeded; it hands the request to WhatsApp / phone instead.
 */

export type TreatmentId =
  | 'smile-makeover'
  | 'implants'
  | 'whitening'
  | 'root-canal'
  | 'orthodontics'
  | 'aligners'
  | 'cosmetic'
  | 'pediatric'

export interface Treatment {
  id: TreatmentId
  name: string
  short: string
  description: string
  highlights: string[]
  duration: string
  visits: string
}

export interface Doctor {
  id: string
  name: string
  qualification: string
  specialization: string
  experience: string
  intro: string
  /** Path or URL to a portrait. Leave empty to show the studio placeholder. */
  portrait?: string
  placeholder: boolean
}

export interface Testimonial {
  id: string
  quote: string
  name: string
  treatment: string
  /** Only display a rating if the review is verified. */
  rating?: number
  verified: boolean
  portrait?: string
}

export const clinic = {
  name: 'Ivoire Dental Studio', // PLACEHOLDER brand name
  shortName: 'Ivoire',
  tagline: 'The Art of Smiling',
  statement:
    'A modern dental studio where clinical precision meets quiet, considered hospitality.',
  url: 'https://www.example-dental.com', // PLACEHOLDER — production URL

  contact: {
    phoneDisplay: '+91 00000 00000', // PLACEHOLDER
    phoneE164: '+910000000000', // PLACEHOLDER — used for tel: links
    whatsappE164: '910000000000', // PLACEHOLDER — digits only, used for wa.me links
    whatsappGreeting: "Hello! I'd like to book an appointment.",
    email: 'hello@example-dental.com', // PLACEHOLDER
  },

  address: {
    line1: 'Studio 01, Placeholder Avenue', // PLACEHOLDER
    line2: 'Your Neighbourhood',
    city: 'Your City',
    region: 'Your State',
    postalCode: '000000',
    country: 'IN',
    mapUrl: 'https://maps.google.com', // PLACEHOLDER — link to your Google Maps listing
  },

  hours: [
    { days: 'Monday – Friday', time: '9:00 am – 8:00 pm', open: 'Mo-Fr 09:00-20:00' },
    { days: 'Saturday', time: '9:00 am – 5:00 pm', open: 'Sa 09:00-17:00' },
    { days: 'Sunday', time: 'By appointment', open: '' },
  ], // PLACEHOLDER hours
  daysOpenPerWeek: 6,

  social: [
    { label: 'Instagram', href: 'https://instagram.com/' },
    { label: 'Facebook', href: 'https://facebook.com/' },
    { label: 'YouTube', href: 'https://youtube.com/' },
    { label: 'Google', href: 'https://maps.google.com/' },
  ], // PLACEHOLDER profile links

  booking: {
    /**
     * POST endpoint that accepts JSON: { name, phone, email, treatment, date, message }.
     * Respond 2xx with optional JSON { status: 'confirmed' | 'received', reference?: string }.
     * Leave empty ('') to run in "handoff" mode (WhatsApp / call).
     */
    endpoint: (import.meta.env?.VITE_BOOKING_ENDPOINT as string | undefined) ?? '',
  },

  seo: {
    title: 'Ivoire Dental Studio — The Art of Smiling',
    description:
      'Exceptional dental care, thoughtfully designed around you. Smile makeovers, implants, aligners, whitening and family dentistry with 3D digital planning.',
    ogImage: '/og-image.jpg',
    /** Set to true only once every address/phone/hour above is verified. */
    structuredDataVerified: false,
  },

  treatments: [
    {
      id: 'smile-makeover',
      name: 'Smile Makeover',
      short: 'A complete, digitally designed transformation.',
      description:
        'We combine facial analysis, digital smile design and a sequenced treatment plan so you can preview your new smile before a single tooth is touched.',
      highlights: ['Digital smile preview', 'Facial proportion analysis', 'Phased, transparent plan'],
      duration: 'Plan-dependent',
      visits: 'Typically 3–6 visits',
    },
    {
      id: 'implants',
      name: 'Dental Implants',
      short: 'Permanent foundations that feel like your own.',
      description:
        'Guided implant placement planned in 3D, restored with a custom crown matched to the shade and form of your natural teeth.',
      highlights: ['3D guided placement', 'Custom-shaded crowns', 'Single, bridge or full-arch'],
      duration: '3–6 months incl. healing',
      visits: '3–5 visits',
    },
    {
      id: 'whitening',
      name: 'Teeth Whitening',
      short: 'Brighter, evenly — and comfortably.',
      description:
        'Professionally supervised whitening with sensitivity care, in-studio or with custom take-home trays.',
      highlights: ['Shade-mapped results', 'Sensitivity protocol', 'In-studio or take-home'],
      duration: '60–90 minutes',
      visits: '1–2 visits',
    },
    {
      id: 'root-canal',
      name: 'Root Canal Treatment',
      short: 'Gentle, precise relief that saves the tooth.',
      description:
        'Microscope-assisted endodontics with rotary instruments and digital imaging for a calm, efficient experience.',
      highlights: ['Digital imaging', 'Rotary instrumentation', 'Same-day relief focus'],
      duration: '60–120 minutes',
      visits: '1–2 visits',
    },
    {
      id: 'orthodontics',
      name: 'Orthodontics',
      short: 'Alignment engineered for function and form.',
      description:
        'Modern fixed braces — metal or ceramic — planned from a digital scan for predictable movement and comfortable reviews.',
      highlights: ['Ceramic or metal options', 'Digital progress tracking', 'Retention planning'],
      duration: '12–24 months',
      visits: 'Reviews every 4–8 weeks',
    },
    {
      id: 'aligners',
      name: 'Invisalign / Clear Aligners',
      short: 'Nearly invisible. Entirely intentional.',
      description:
        'Clear aligner therapy with a 3D simulation of every stage, so you see the destination on day one.',
      highlights: ['3D movement simulation', 'Removable & discreet', 'Remote check-ins'],
      duration: '6–18 months',
      visits: 'Reviews every 6–10 weeks',
    },
    {
      id: 'cosmetic',
      name: 'Cosmetic Dentistry',
      short: 'Veneers, bonding and contouring — crafted by hand.',
      description:
        'Minimally invasive veneers, composite bonding and gum contouring, designed around your face rather than a template.',
      highlights: ['Porcelain & composite veneers', 'Minimal-prep focus', 'Mock-up before treatment'],
      duration: 'Plan-dependent',
      visits: '2–4 visits',
    },
    {
      id: 'pediatric',
      name: 'Pediatric Dentistry',
      short: 'Calm, playful care for growing smiles.',
      description:
        'Gentle first visits, preventive sealants and habit guidance in an environment designed to make children feel safe.',
      highlights: ['Child-first communication', 'Preventive sealants', 'Growth monitoring'],
      duration: '30–45 minutes',
      visits: 'Every 6 months',
    },
  ] satisfies Treatment[],

  doctors: [
    {
      id: 'doctor-1',
      name: 'Dr. Lead Dentist',
      qualification: 'BDS, MDS — Prosthodontics (sample)',
      specialization: 'Smile Design & Implant Restoration',
      experience: '— years (to be supplied)',
      intro:
        'Sample profile. Replace with your lead clinician’s verified biography, philosophy of care and registration details.',
      placeholder: true,
    },
    {
      id: 'doctor-2',
      name: 'Dr. Orthodontist',
      qualification: 'BDS, MDS — Orthodontics (sample)',
      specialization: 'Braces & Clear Aligner Therapy',
      experience: '— years (to be supplied)',
      intro:
        'Sample profile. Replace with your orthodontist’s verified biography, areas of focus and professional memberships.',
      placeholder: true,
    },
    {
      id: 'doctor-3',
      name: 'Dr. Pediatric Dentist',
      qualification: 'BDS, MDS — Pedodontics (sample)',
      specialization: 'Children’s & Preventive Dentistry',
      experience: '— years (to be supplied)',
      intro:
        'Sample profile. Replace with your pediatric dentist’s verified biography and approach to anxious young patients.',
      placeholder: true,
    },
  ] satisfies Doctor[],

  testimonials: [
    {
      id: 't1',
      quote:
        'Sample testimonial — the whole visit felt calm and unhurried, and I could see my new smile on screen before we started.',
      name: 'Patient name',
      treatment: 'Smile Makeover',
      verified: false,
    },
    {
      id: 't2',
      quote:
        'Sample testimonial — I was anxious about implants, but every step was explained clearly and the result feels completely natural.',
      name: 'Patient name',
      treatment: 'Dental Implants',
      verified: false,
    },
    {
      id: 't3',
      quote:
        'Sample testimonial — my aligner journey was mapped out in 3D, so I always knew exactly where we were heading.',
      name: 'Patient name',
      treatment: 'Clear Aligners',
      verified: false,
    },
    {
      id: 't4',
      quote:
        'Sample testimonial — our daughter actually looks forward to her check-ups now. That says everything.',
      name: 'Parent name',
      treatment: 'Pediatric Dentistry',
      verified: false,
    },
    {
      id: 't5',
      quote:
        'Sample testimonial — the root canal I had been dreading was over before I knew it, and completely comfortable.',
      name: 'Patient name',
      treatment: 'Root Canal Treatment',
      verified: false,
    },
  ] satisfies Testimonial[],
} as const

export const nav = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Treatments', href: '#treatments' },
  { label: 'Technology', href: '#technology' },
  { label: 'Our Doctors', href: '#doctors' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Contact', href: '#contact' },
] as const

export const telHref = `tel:${clinic.contact.phoneE164}`
export const whatsappHref = (text: string = clinic.contact.whatsappGreeting) =>
  `https://wa.me/${clinic.contact.whatsappE164}?text=${encodeURIComponent(text)}`
