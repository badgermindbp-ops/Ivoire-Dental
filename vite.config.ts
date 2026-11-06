import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { clinic } from './src/config/clinic.ts'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/**
 * Injects SEO meta + Open Graph from the clinic config, and Dentist JSON-LD
 * only when `seo.structuredDataVerified` is true (never publish placeholder data).
 */
function clinicSeo(): Plugin {
  return {
    name: 'clinic-seo',
    transformIndexHtml(html) {
      const { seo } = clinic
      const og = new URL(seo.ogImage, clinic.url).toString()
      const meta = `
    <title>${esc(seo.title)}</title>
    <meta name="description" content="${esc(seo.description)}" />
    <link rel="canonical" href="${esc(clinic.url)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${esc(clinic.name)}" />
    <meta property="og:title" content="${esc(seo.title)}" />
    <meta property="og:description" content="${esc(seo.description)}" />
    <meta property="og:url" content="${esc(clinic.url)}" />
    <meta property="og:image" content="${esc(og)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(seo.title)}" />
    <meta name="twitter:description" content="${esc(seo.description)}" />
    <meta name="twitter:image" content="${esc(og)}" />`
      let ld = ''
      if (seo.structuredDataVerified) {
        const data = {
          '@context': 'https://schema.org',
          '@type': 'Dentist',
          name: clinic.name,
          url: clinic.url,
          image: og,
          telephone: clinic.contact.phoneE164,
          email: clinic.contact.email,
          address: {
            '@type': 'PostalAddress',
            streetAddress: `${clinic.address.line1}, ${clinic.address.line2}`,
            addressLocality: clinic.address.city,
            addressRegion: clinic.address.region,
            postalCode: clinic.address.postalCode,
            addressCountry: clinic.address.country,
          },
          openingHours: clinic.hours.map((h) => h.open).filter(Boolean),
          sameAs: clinic.social.map((s) => s.href),
          medicalSpecialty: 'Dentistry',
          availableService: clinic.treatments.map((t) => ({ '@type': 'MedicalProcedure', name: t.name })),
        }
        ld = `\n    <script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`
      } else {
        ld = '\n    <!-- Dentist JSON-LD disabled: set clinic.seo.structuredDataVerified = true once details are verified -->'
      }
      return html.replace('<!--seo-->', meta + ld)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), clinicSeo()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
})
