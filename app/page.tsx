import { HeroSection } from "@/components/hero-section"
import { DashboardPreview } from "@/components/dashboard-preview"
import { SocialProof } from "@/components/social-proof"
import { BentoSection } from "@/components/bento-section"
import { LargeTestimonial } from "@/components/large-testimonial"
import { PricingSection } from "@/components/pricing-section"
import { TestimonialGridSection } from "@/components/testimonial-grid-section"
import { FAQSection } from "@/components/faq-section"
import { CTASection } from "@/components/cta-section"
import { FooterSection } from "@/components/footer-section"
import { AnimatedSection } from "@/components/animated-section"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden pb-0">
      <div className="relative z-10">
        <main className="relative mx-auto max-w-[1320px]">
          <HeroSection />
          {/* Dashboard Preview Wrapper */}
          <div className="absolute bottom-[-150px] left-1/2 z-30 -translate-x-1/2 transform md:bottom-[-400px]">
            <AnimatedSection>
              <DashboardPreview />
            </AnimatedSection>
          </div>
        </main>
        <AnimatedSection
          className="relative z-10 mx-auto mt-[411px] max-w-[1320px] px-6 md:mt-[400px]"
          delay={0.1}
        >
          <SocialProof />
        </AnimatedSection>
        <AnimatedSection
          id="features-section"
          className="relative z-10 mx-auto mt-16 max-w-[1320px]"
          delay={0.2}
        >
          <BentoSection />
        </AnimatedSection>
        {/* <AnimatedSection
          className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16"
          delay={0.2}
        >
          <LargeTestimonial />
        </AnimatedSection> */}
        {/* <AnimatedSection
          id="pricing-section"
          className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16"
          delay={0.2}
        >
          <PricingSection />
        </AnimatedSection> */}
        {/* <AnimatedSection
          id="testimonials-section"
          className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16"
          delay={0.2}
        >
          <TestimonialGridSection />
        </AnimatedSection> */}
        <AnimatedSection
          id="faq-section"
          className="relative z-10 mx-auto mt-8 max-w-[1320px] md:mt-16"
          delay={0.2}
        >
          <FAQSection />
        </AnimatedSection>
        <AnimatedSection
          className="relative z-10 mx-auto mt-8 max-w-[1320px] md:mt-16"
          delay={0.2}
        >
          <CTASection />
        </AnimatedSection>
        <AnimatedSection
          className="relative z-10 mx-auto mt-8 max-w-[1320px] md:mt-16"
          delay={0.2}
        >
          <FooterSection />
        </AnimatedSection>
      </div>
    </div>
  )
}
