import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { FeatureGrid } from "@/components/feature-grid"
import { AboutSection } from "@/components/about-section"
import { GlitchMarquee } from "@/components/glitch-marquee"
import { Footer } from "@/components/footer"
import { FAQSection } from "@/components/faq-section"

export default function Page() {
  return (
    <div className="min-h-screen dot-grid-bg w-[100vw] overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <GlitchMarquee />
        <FeatureGrid />
        <AboutSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
