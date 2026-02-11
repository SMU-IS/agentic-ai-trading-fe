import React from "react"
import { Header } from "./header"

export function HeroSection() {
  return (
    <section className="relative mx-auto my-6 flex h-[400px] w-full flex-col items-center overflow-hidden rounded-2xl bg-gradient-to-br from-foreground/5 via-primary/10 to-primary/20 px-4 py-0 text-left md:h-[550px] md:w-[1220px] md:px-0 lg:h-[750px]">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 z-0 opacity-5">
        <div className="h-full w-full bg-[linear-gradient(to_right,hsl(var(--foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground))_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
      </div>

      {/* Gradient orbs */}
      <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-primary/30 blur-[150px]" />
      <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-foreground/20 blur-[120px]" />

      {/* Border */}
      <div className="absolute inset-0 rounded-2xl border border-foreground/10" />

      {/* Header positioned at top of hero container */}
      <div className="absolute left-0 right-0 top-0 z-20">
        <Header />
      </div>

      <div className="relative z-10 mb-6 mt-16 max-w-md space-y-4 px-4 text-center md:mb-7 md:mt-[120px] md:max-w-[500px] md:space-y-5 lg:mb-9 lg:mt-[160px] lg:max-w-[588px] lg:space-y-6">
        <h1 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl lg:text-5xl">
          Meet Agent M.
        </h1>
        <p className="mx-auto max-w-lg text-base font-medium leading-relaxed text-muted-foreground md:text-base lg:text-lg">
          <b>Agent M</b> crawls through insider news, uses AI to detect real
          signals from noise, and executes high‑conviction trades so your
          portfolio is always working.
        </p>
      </div>
    </section>
  )
}
