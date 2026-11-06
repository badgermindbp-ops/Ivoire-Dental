import { useEffect } from 'react'
import Nav from './components/Nav'
import Loader from './components/Loader'
import CursorLight from './components/CursorLight'
import Hero from './sections/Hero'
import { heroReadyPromise } from './lib/heroReady'
import Story from './sections/Story'
import Treatments from './sections/Treatments'
import Technology from './sections/Technology'
import Doctors from './sections/Doctors'
import Transformation from './sections/Transformation'
import Testimonials from './sections/Testimonials'
import Booking from './sections/Booking'
import Footer from './sections/Footer'
import { initSmoothScroll } from './lib/smoothScroll'
import { ScrollTrigger } from './lib/gsap'

export default function App() {
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    initSmoothScroll()
    // pinned sections stack — recalculate once everything (fonts, lazy chunks) has settled
    const t = setTimeout(() => ScrollTrigger.refresh(), 1200)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <Loader until={heroReadyPromise} />
      <Nav />
      <CursorLight />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Story />
        <Treatments />
        <Technology />
        <Doctors />
        <Transformation />
        <Testimonials />
        <Booking />
      </main>
      <Footer />
    </>
  )
}
