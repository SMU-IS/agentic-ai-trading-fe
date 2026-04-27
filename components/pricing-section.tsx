"use client"

import { useState } from "react"
import { Check, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

const ease = [0.22, 1, 0.36, 1] as const

const cardVariants = {
  hidden: { opacity: 0, y: 48, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: 0.2 + i * 0.15, duration: 0.7, ease },
  }),
}

const featureVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.5 + i * 0.07, duration: 0.35, ease },
  }),
}

const pricingPlans = [
  {
    name: "Free",
    monthlyPrice: "$0",
    annualPrice: "$0",
    period: "/month",
    description: "Start trading with AI-driven automation at no cost.",
    features: [
      "Paper trading via Alpaca",
      "Up to 3 paper trading accounts",
      "Daily News Signals (Reddit & TradingView)",
      "24/7 automated trading",
    ],
    buttonText: "Join the waitlist",
    href: "/waitlist",
  },
  {
    name: "Pro",
    monthlyPrice: "$25",
    annualPrice: "$18",
    period: "/month",
    description: "Unlock live trading and full strategy customization.",
    features: [
      "Live trading via Alpaca",
      "Additional news sources (Twitter, Stocktwits)",
      "Customized trading strategies",
      "Custom agent guardrails for risk management",
    ],
    buttonText: "To be released",
    href: "/",
    popular: true,
  },
]

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <section id="pricing-section" className="w-full px-6 py-20 lg:px-12">
      {/* Headline */}
      <div className="flex flex-col items-center gap-4 mb-10 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
          className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground"
        >
          Simple, transparent pricing
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15, ease }}
          className="text-sm text-muted-foreground font-mono max-w-sm"
        >
          Start for free with paper trading, upgrade when you&apos;re ready for
          the real thing.
        </motion.p>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.25, ease }}
          className="mt-2 relative flex items-center rounded-lg bg-muted p-0.5 border border-border"
        >
          {/* Sliding pill — always mounted, position driven by state */}
          <motion.div
            className="absolute top-0.5 bottom-0.5 rounded-md bg-accent pointer-events-none"
            animate={{ left: isAnnual ? "2px" : "50%" }}
            style={{ width: "calc(50% - 2px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
          {(["Annually", "Monthly"] as const).map((label) => {
            const active = label === "Annually" ? isAnnual : !isAnnual
            return (
              <motion.button
                key={label}
                onClick={() => setIsAnnual(label === "Annually")}
                className={`relative z-10 flex-1 px-3 py-1.5 text-xs font-mono tracking-widest uppercase transition-colors duration-200 ${active ? "text-foreground" : "text-muted-foreground"}`}
                whileTap={{ scale: 0.97 }}
              >
                {label}
              </motion.button>
            )
          })}
        </motion.div>
      </div>

      {/* Cards */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="mx-auto grid max-w-3xl grid-cols-1 md:grid-cols-2 gap-px border border-foreground/20 bg-foreground/10"
      >
        {pricingPlans.map((plan, i) => (
          <motion.div
            key={plan.name}
            custom={i}
            variants={cardVariants}
            whileHover={{ y: -4, transition: { duration: 0.25, ease } }}
            className={`relative flex flex-col gap-8 p-8 ${
              plan.popular ? "bg-primary" : "bg-background"
            }`}
          >
            {/* Popular badge */}
            {/* {plan.popular && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.3, ease }}
                className="absolute top-4 right-4"
              >
                <span className="text-[9px] font-mono tracking-[0.2em] uppercase border border-primary-foreground/30 text-primary-foreground px-2 py-0.5">
                  Popular
                </span>
              </motion.div>
            )} */}

            {/* Plan name + price */}
            <div className="flex flex-col gap-4">
              <span
                className={`text-[10px] font-mono tracking-[0.2em] uppercase ${plan.popular ? "text-primary-foreground/60" : "text-muted-foreground"}`}
              >
                {plan.name}
              </span>

              <div className="flex items-end gap-1">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={isAnnual ? "annual" : "monthly"}
                    initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                    transition={{ duration: 0.25, ease }}
                    className={`text-4xl font-semibold tracking-tight ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}
                  >
                    {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </motion.span>
                </AnimatePresence>
                <span
                  className={`mb-1 text-xs font-mono ${plan.popular ? "text-primary-foreground/50" : "text-muted-foreground"}`}
                >
                  {plan.period}
                </span>
              </div>

              <p
                className={`text-xs font-mono leading-relaxed ${plan.popular ? "text-primary-foreground/60" : "text-muted-foreground"}`}
              >
                {plan.description}
              </p>
            </div>

            {/* CTA button */}
            {plan.popular ? (
              <div className="flex items-center gap-2 border px-5 py-2.5 text-xs font-mono tracking-widest uppercase cursor-not-allowed border-primary-foreground/20 text-primary-foreground/30 select-none">
                {plan.buttonText}
              </div>
            ) : (
              <Link href={plan.href}>
                <motion.div
                  whileHover={{ gap: "12px" }}
                  className="group flex items-center gap-2 border px-5 py-2.5 text-xs font-mono tracking-widest uppercase transition-colors duration-200 border-foreground/30 text-foreground hover:border-foreground"
                >
                  {plan.buttonText}
                  <motion.span
                    className="inline-flex"
                    whileHover={{ x: 3 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <ArrowRight size={12} strokeWidth={1.5} />
                  </motion.span>
                </motion.div>
              </Link>
            )}

            {/* Divider */}
            <div
              className={`border-t ${plan.popular ? "border-primary-foreground/20" : "border-border"}`}
            />

            {/* Features */}
            <div className="flex flex-col gap-3">
              <span
                className={`text-[10px] font-mono tracking-[0.15em] uppercase ${plan.popular ? "text-primary-foreground/50" : "text-muted-foreground/60"}`}
              >
                {plan.name === "Free"
                  ? "What's included"
                  : "Everything in Free, plus"}
              </span>

              <motion.ul
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex flex-col gap-2.5"
              >
                {plan.features.map((feature, fi) => (
                  <motion.li
                    key={feature}
                    custom={fi}
                    variants={featureVariants}
                    className="flex items-start gap-2.5"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: 0.6 + fi * 0.07,
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      }}
                      className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${
                        plan.popular
                          ? "bg-primary-foreground/20"
                          : "bg-foreground/10"
                      }`}
                    >
                      <Check
                        size={8}
                        strokeWidth={2.5}
                        className={
                          plan.popular
                            ? "text-primary-foreground"
                            : "text-foreground"
                        }
                      />
                    </motion.span>
                    <span
                      className={`text-xs font-mono leading-relaxed ${plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                    >
                      {feature}
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
