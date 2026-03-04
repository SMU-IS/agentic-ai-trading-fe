"use client"

import Image from "next/image"

export function DashboardPreview() {
  return (
    <div className="w-[calc(100vw-32px)] md:w-[1160px]">
      {/* Animated gradient border wrapper */}
      <div className="relative rounded-2xl p-[2px]">
        {/* Spinning gradient border (behind the content) */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="bg-gradient-conic-teal-background animate-spin-border absolute inset-[-100%]" />
        </div>

        {/* Actual content (on top, covers the center) */}
        <div className="relative rounded-2xl bg-primary-light/10 p-1 shadow-2xl">
          <Image
            src="/images/dashboard-preview.png"
            alt="Dashboard preview"
            width={1160}
            height={700}
            className="h-full w-full rounded-xl object-cover shadow-lg"
          />
        </div>
      </div>
    </div>
  )
}
