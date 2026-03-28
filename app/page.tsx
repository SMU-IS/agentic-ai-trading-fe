import { AboutSection } from "@/components/about-section"
import { FAQSection } from "@/components/faq-section"
import { FeatureGrid } from "@/components/feature-grid"
import { Footer } from "@/components/footer"
import { GlitchMarquee } from "@/components/glitch-marquee"
import { HeroSection } from "@/components/hero-section"
import { Navbar } from "@/components/navbar"
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
          Agent M is currently in beta. We are actively refining the platform
          and appreciate your feedback.
        </Banner>
      )}
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
