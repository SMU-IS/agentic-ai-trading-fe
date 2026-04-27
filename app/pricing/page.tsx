"use client"

import { Navbar } from "@/components/navbar"
import { PricingSection } from "@/components/pricing-section"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"

export default function PricingPage() {
  return (
    <div className="min-h-screen dot-grid-bg w-[100vw] overflow-x-hidden">
      <Navbar />
      <main>
        <PricingSection />
      </main>
      <Footer />
    </div>
  )
}
