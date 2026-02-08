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
        <div className="relative rounded-2xl bg-primary-light/10 p-2 shadow-2xl">
          <Image
            src="/images/dashboard-preview.png"
            alt="Dashboard preview"
            width={1160}
            height={700}
            className="h-full w-full rounded-xl object-cover shadow-lg"
          />
        </div>
      </div>

      {/* CSS for the gradient animation */}
      <style jsx global>{`
        @keyframes spin-border {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin-border {
          animation: spin-border 4s linear infinite;
        }

        /* Teal to background gradient - smooth transitions */
        .bg-gradient-conic-teal-background {
          background: conic-gradient(
            from 0deg,
            #14b8a6,
            #0d9488,
            #0a7a6e,
            #075e59,
            #044e49,
            #023d3a,
            #012b29,
            #001a19,
            #000000,
            #000000,
            #000000,
            #001a19,
            #012b29,
            #023d3a,
            #044e49,
            #075e59,
            #0a7a6e,
            #0d9488,
            #14b8a6
          );
        }
      `}</style>
    </div>
  )
}
