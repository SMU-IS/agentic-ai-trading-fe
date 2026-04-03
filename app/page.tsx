import { AboutSection } from "@/components/about-section"
import { FAQSection } from "@/components/faq-section"
import { FeatureGrid } from "@/components/feature-grid"
import { Footer } from "@/components/footer"
import { GlitchMarquee } from "@/components/glitch-marquee"
import { HeroSection } from "@/components/hero-section"
import { Navbar } from "@/components/navbar"
import { TestimonialGridSection } from "@/components/testimonial-grid-section"
import AgentMFeatures from "@/components/ui/AgentMFeatures"
import { Banner } from "@/components/ui/banner"

export default function Page() {
  return (
    <div className="min-h-screen dot-grid-bg w-[100vw] overflow-x-hidden">
      {process.env.NEXT_PUBLIC_SHOW_BANNER == "true" && (
        <Banner
          variant="default"
          sticky
          dismissible
          className="text-xs md:text-md"
        >
          {process.env.NEXT_PUBLIC_BANNER_MESSAGE}
        </Banner>
      )}
      <Navbar />
      <main>
        <HeroSection />
        <GlitchMarquee />
        <AgentMFeatures />
        <FeatureGrid />
        <AboutSection />
        <TestimonialGridSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
