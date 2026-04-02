"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"

const testimonials = [
  {
    quote:
      "Agent M reads the news, weighs the sentiment, and just executes the trade — I check my dashboard in the morning and see exactly what it did and why. I don't have time to monitor markets all day so this is great.",
    name: "Shawn N.",
    company: "Retail Investor",
    avatar: "https://agent-m-fe-assets.s3.us-east-1.amazonaws.com/Shawn.jpeg",
    type: "large-teal",
  },
  {
    quote:
      "Agent M only acts within the risk limits I set. It trades aggressively when I want it to, or conservatively when I dial it back.",
    name: "Tim C.",
    company: "Independent Trader",
    avatar:
      "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=1065&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    type: "small-dark",
  },
  {
    quote:
      "I used to spend hours reading financial news and Reddit threads. Now Agent M scrapes all of that and I only get pinged when something actually affects my holdings.",
    name: "Joshua A.",
    company: "Retail Trader",
    avatar: "https://agent-m-fe-assets.s3.us-east-1.amazonaws.com/Josh.png",
    type: "small-dark",
  },
  {
    quote:
      "The moment breaking news drops that's relevant to my stocks, I get a notification instantly, not 20 minutes later. And right after, another alert confirms the trade was executed. The speed is the whole point.",
    name: "Z Y.",
    company: "Swing Trader",
    avatar: "https://agent-m-fe-assets.s3.us-east-1.amazonaws.com/ZY.jpeg",
    type: "small-dark",
  },
  {
    quote:
      "I connected my existing account from Alpaca and Agent M immediately connected and got to work. The process was so seamless.",
    name: "Derrick L.",
    company: "Long-term Investor",
    avatar: "https://agent-m-fe-assets.s3.us-east-1.amazonaws.com/Derrick.jpeg",
    type: "small-dark",
  },
  {
    quote:
      "I'll type 'Why did you sell NVDA yesterday?' and it explains the exact news event and sentiment score that triggered it. It's crazy transparent for a retail investor.",
    name: "J Y.",
    company: "Quantitative Analyst",
    avatar: "https://agent-m-fe-assets.s3.us-east-1.amazonaws.com/JY.jpeg",
    type: "small-dark",
  },
  {
    quote:
      "I was skeptical on social media news and it would hallucinate and make bad trades. But I'm amazed at how it fact-checks claims and only acts on credibility-weighted sentiment, it's held off on trades when news turned out to be unreliable.",
    name: "Bryan C.",
    company: "Student",
    avatar: "https://agent-m-fe-assets.s3.us-east-1.amazonaws.com/Bryan.png",
    type: "large-light",
  },
]
const TestimonialCard = ({
  quote,
  name,
  company,
  avatar,
  type,
  fixedHeight = true, // ← new opt-out prop
}: {
  quote: string
  name: string
  company: string
  avatar: string
  type: string
  fixedHeight?: boolean
}) => {
  const isLargeCard = type.startsWith("large")
  const avatarSize = isLargeCard ? 48 : 36
  const avatarBorderRadius = isLargeCard
    ? "rounded-[41px]"
    : "rounded-[30.75px]"
  const padding = isLargeCard ? "p-6" : "p-[30px]"

  let cardClasses = `flex flex-col justify-between items-start overflow-hidden rounded-[10px] shadow-[0px_2px_4px_rgba(0,0,0,0.08)] relative ${padding}`
  let quoteClasses = ""
  let nameClasses = ""
  let companyClasses = ""
  let backgroundElements = null
  const cardWidth = "w-full md:w-[384px]"

  // Only apply fixed height when the prop allows it
  const cardHeight = fixedHeight
    ? type === "large-teal" || type === "large-light"
      ? "h-[502px]"
      : "h-[244px]"
    : "" // no height class → card sizes to its content

  if (type === "large-teal") {
    cardClasses += " bg-primary"
    quoteClasses += " text-primary-foreground text-xl font-medium leading-8"
    nameClasses += " text-primary-foreground text-base font-normal leading-6"
    companyClasses +=
      " text-primary-foreground/60 text-base font-normal leading-6"
    backgroundElements = (
      <div
        className="absolute inset-0 h-full w-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/large-card-background.svg')",
          zIndex: 0,
        }}
      />
    )
  } else if (type === "large-light") {
    cardClasses += " bg-[rgba(231,236,235,0.12)]"
    quoteClasses += " text-foreground text-xl font-medium leading-8"
    nameClasses += " text-foreground text-base font-normal leading-6"
    companyClasses += " text-muted-foreground text-base font-normal leading-6"
    backgroundElements = (
      <div
        className="absolute inset-0 h-full w-full bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: "url('/images/large-card-background.svg')",
          zIndex: 0,
        }}
      />
    )
  } else {
    cardClasses +=
      " bg-card outline outline-1 outline-border outline-offset-[-1px] gap-4"
    quoteClasses += " text-foreground/80 text-[17px] font-normal leading-6"
    nameClasses += " text-foreground text-sm font-normal leading-[22px]"
    companyClasses +=
      " text-muted-foreground text-sm font-normal leading-[22px]"
  }

  return (
    <div className={`${cardClasses} ${cardWidth} ${cardHeight}`}>
      {backgroundElements}
      <div className={`relative z-10 break-words font-normal ${quoteClasses}`}>
        {quote}
      </div>
      <div className="relative z-10 flex items-center justify-start gap-3 mt-4">
        <Image
          src={avatar || "/placeholder.svg"}
          alt={`${name} avatar`}
          width={avatarSize}
          height={avatarSize}
          className={`w-${avatarSize / 4} h-${avatarSize / 4} ${avatarBorderRadius}`}
          style={{ border: "1px solid rgba(255, 255, 255, 0.08)" }}
        />
        <div className="flex flex-col items-start justify-start gap-0.5">
          <div className={nameClasses}>{name}</div>
          <div className={companyClasses}>{company}</div>
        </div>
      </div>
    </div>
  )
}

// ─── Mobile conveyor belt ─────────────────────────────────────────────────────

function MobileCarousel() {
  const trackRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(0)
  const rafRef = useRef<number>()
  const isPausedRef = useRef(false)
  const SPEED = 0.7

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const tick = () => {
      if (!isPausedRef.current) {
        posRef.current += SPEED
        const halfWidth = track.scrollWidth / 2
        if (posRef.current >= halfWidth) posRef.current = 0
        track.style.transform = `translateX(-${posRef.current}px)`
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    const pause = () => {
      isPausedRef.current = true
    }
    const resume = () => {
      isPausedRef.current = false
    }
    track.addEventListener("touchstart", pause, { passive: true })
    track.addEventListener("touchend", resume, { passive: true })

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      track.removeEventListener("touchstart", pause)
      track.removeEventListener("touchend", resume)
    }
  }, [])

  const items = [...testimonials, ...testimonials]

  return (
    <div
      className="relative w-full overflow-hidden md:hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
      }}
    >
      <div
        ref={trackRef}
        className="flex items-start gap-4 will-change-transform"
        style={{ width: "max-content" }}
      >
        {items.map((t, i) => (
          <div key={i} className="w-[280px] flex-shrink-0">
            {/* fixedHeight={false} → card grows with its content */}
            <TestimonialCard {...t} fixedHeight={false} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function TestimonialGridSection() {
  return (
    <section className="flex w-full flex-col justify-start overflow-hidden px-5 py-6 md:py-8 lg:py-14">
      <div className="flex flex-col items-center justify-center gap-2 self-stretch py-6 md:py-8 lg:py-14">
        <div className="flex flex-col items-center justify-start gap-4">
          <h2 className="text-center text-3xl font-semibold leading-tight text-foreground md:text-4xl md:leading-tight lg:text-[40px] lg:leading-[40px]">
            Trading made effortless
          </h2>
          <p className="self-stretch text-center text-sm font-medium leading-[18.20px] text-muted-foreground md:text-sm md:leading-relaxed lg:text-base lg:leading-relaxed">
            {
              "We are on beta, but here's what our users are saying about Agent M"
            }
          </p>
        </div>
      </div>

      {/* Mobile: conveyor belt, no fixed height */}
      <MobileCarousel />

      {/* Desktop: original 3-column grid with fixed heights */}
      <div className="mx-auto hidden w-full max-w-[1100px] md:flex md:flex-row items-start justify-center gap-4 pb-4 pt-0.5 md:gap-4 md:pb-6 lg:gap-6 lg:pb-10">
        <div className="flex flex-1 flex-col items-start justify-start gap-4 md:gap-4 lg:gap-6">
          <TestimonialCard {...testimonials[0]} />
          <TestimonialCard {...testimonials[1]} />
        </div>
        <div className="flex flex-1 flex-col items-start justify-start gap-4 md:gap-4 lg:gap-6">
          <TestimonialCard {...testimonials[2]} />
          <TestimonialCard {...testimonials[3]} />
          <TestimonialCard {...testimonials[4]} />
        </div>
        <div className="flex flex-1 flex-col items-start justify-start gap-4 md:gap-4 lg:gap-6">
          <TestimonialCard {...testimonials[5]} />
          <TestimonialCard {...testimonials[6]} />
        </div>
      </div>
    </section>
  )
}
