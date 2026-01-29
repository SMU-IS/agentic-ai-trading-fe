'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true)

  const pricingPlans = [
    {
      name: 'Free',
      monthlyPrice: '$0',
      annualPrice: '$0',
      description: 'Perfect for individuals starting their journey.',
      features: [
        'Real-time code suggestions',
        'Basic integration logos',
        'Single MCP server connection',
        'Up to 2 AI coding agents',
        'Vercel deployments with Pointer branding',
      ],
      buttonText: 'Get Started',
      buttonClass:
        'bg-zinc-300 shadow-[0px_1px_1px_-0.5px_rgba(16,24,40,0.20)] outline outline-0.5 outline-[#1e29391f] outline-offset-[-0.5px] text-gray-800 text-shadow-[0px_1px_1px_rgba(16,24,40,0.08)] hover:bg-zinc-400',
    },
    {
      name: 'Pro',
      monthlyPrice: '$20',
      annualPrice: '$16',
      description: 'Ideal for professionals.',
      features: [
        'Enhanced real-time previews',
        'Unlimited integrations with custom logos',
        'Multiple MCP server connections',
        'Up to 10 concurrent AI coding agents',
        'Collaborative coding with team chat',
        'Advanced version control integrations',
        'Priority email and chat support',
      ],
      buttonText: 'Join now',
      buttonClass:
        'bg-primary-foreground shadow-[0px_1px_1px_-0.5px_rgba(16,24,40,0.20)] text-primary text-shadow-[0px_1px_1px_rgba(16,24,40,0.08)] hover:bg-primary-foreground/90',
      popular: true,
    },
    {
      name: 'Ultra',
      monthlyPrice: '$200',
      annualPrice: '$160',
      description: 'Tailored solutions for teams.',
      features: [
        'Dedicated account support',
        'Unlimited MCP server clusters',
        'Unlimited AI coding agents',
        'Enterprise-grade security and compliance',
        'Priority deployments and SLA guarantees',
      ],
      buttonText: 'Talk to Sales',
      buttonClass:
        'bg-secondary shadow-[0px_1px_1px_-0.5px_rgba(16,24,40,0.20)] text-secondary-foreground text-shadow-[0px_1px_1px_rgba(16,24,40,0.08)] hover:bg-secondary/90',
    },
  ]

  return (
    <section className="my-0 flex w-full flex-col items-center justify-start overflow-hidden px-5 py-8 md:py-14">
      <div className="relative flex flex-col items-center justify-center gap-2 self-stretch py-0">
        <div className="flex flex-col items-center justify-start gap-4">
          <h2 className="text-center text-4xl font-semibold leading-tight text-foreground md:text-5xl md:leading-[40px]">
            Pricing built for every developer
          </h2>
          <p className="self-stretch text-center text-sm font-medium leading-tight text-muted-foreground">
            Choose a plan that fits your coding workflow, from individuals
            starting out to <br /> growing professionals and large
            organizations.
          </p>
        </div>
        <div className="pt-4">
          <div className="flex items-center justify-start gap-1 rounded-lg bg-muted p-0.5 outline outline-1 outline-offset-[-1px] outline-[#0307120a] md:mt-0">
            <button
              onClick={() => setIsAnnual(true)}
              className={`flex items-start justify-start gap-2 rounded-md py-1 pl-2 pr-1 ${isAnnual ? 'bg-accent shadow-[0px_1px_1px_-0.5px_rgba(0,0,0,0.08)]' : ''}`}
            >
              <span
                className={`text-center text-sm font-medium leading-tight ${isAnnual ? 'text-accent-foreground' : 'text-zinc-400'}`}
              >
                Annually
              </span>
            </button>
            <button
              onClick={() => setIsAnnual(false)}
              className={`flex items-start justify-start rounded-md px-2 py-1 ${!isAnnual ? 'bg-accent shadow-[0px_1px_1px_-0.5px_rgba(0,0,0,0.08)]' : ''}`}
            >
              <span
                className={`text-center text-sm font-medium leading-tight ${!isAnnual ? 'text-accent-foreground' : 'text-zinc-400'}`}
              >
                Monthly
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-6 flex max-w-[1100px] flex-col items-start justify-start gap-4 self-stretch px-5 md:flex-row md:gap-6">
        {pricingPlans.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-1 flex-col items-start justify-start gap-6 overflow-hidden rounded-xl p-4 ${plan.popular ? 'bg-primary shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.10)]' : 'bg-gradient-to-b from-gray-50/5 to-gray-50/0'}`}
            style={
              plan.popular
                ? {}
                : {
                    outline: '1px solid hsl(var(--border))',
                    outlineOffset: '-1px',
                  }
            }
          >
            <div className="flex flex-col items-start justify-start gap-6 self-stretch">
              <div className="flex flex-col items-start justify-start gap-8 self-stretch">
                <div
                  className={`h-5 w-full text-sm font-medium leading-tight ${plan.popular ? 'text-primary-foreground' : 'text-zinc-200'}`}
                >
                  {plan.name}
                  {plan.popular && (
                    <div className="ml-2 mt-0 inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-white bg-gradient-to-b from-primary-light/50 to-primary-light px-2 py-0.5">
                      <div className="break-words text-center text-xs font-normal leading-tight text-primary-foreground">
                        Popular
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start justify-start gap-1 self-stretch">
                  <div className="flex items-center justify-start gap-1.5">
                    <div
                      className={`relative flex h-10 items-center text-3xl font-medium leading-10 ${plan.popular ? 'text-primary-foreground' : 'text-zinc-50'}`}
                    >
                      <span className="invisible">
                        {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span
                        className="absolute inset-0 flex items-center transition-all duration-500"
                        style={{
                          opacity: isAnnual ? 1 : 0,
                          transform: `scale(${isAnnual ? 1 : 0.8})`,
                          filter: `blur(${isAnnual ? 0 : 4}px)`,
                        }}
                        aria-hidden={!isAnnual}
                      >
                        {plan.annualPrice}
                      </span>
                      <span
                        className="absolute inset-0 flex items-center transition-all duration-500"
                        style={{
                          opacity: !isAnnual ? 1 : 0,
                          transform: `scale(${!isAnnual ? 1 : 0.8})`,
                          filter: `blur(${!isAnnual ? 0 : 4}px)`,
                        }}
                        aria-hidden={isAnnual}
                      >
                        {plan.monthlyPrice}
                      </span>
                    </div>
                    <div
                      className={`text-center text-sm font-medium leading-tight ${plan.popular ? 'text-primary-foreground/70' : 'text-zinc-400'}`}
                    >
                      /month
                    </div>
                  </div>
                  <div
                    className={`self-stretch text-sm font-medium leading-tight ${plan.popular ? 'text-primary-foreground/70' : 'text-zinc-400'}`}
                  >
                    {plan.description}
                  </div>
                </div>
              </div>
              <Link href="/login" className="self-stretch">
                <Button
                  className={`flex w-full items-center justify-center rounded-[40px] px-5 py-2 ${plan.buttonClass}`}
                >
                  <div className="flex items-center justify-center gap-2 px-1.5">
                    <span
                      className={`text-center text-sm font-medium leading-tight ${plan.name === 'Free' ? 'text-gray-800' : plan.name === 'Pro' ? 'text-primary' : 'text-zinc-950'}`}
                    >
                      {plan.buttonText}
                    </span>
                  </div>
                </Button>
              </Link>
            </div>
            <div className="flex flex-col items-start justify-start gap-4 self-stretch">
              <div
                className={`self-stretch text-sm font-medium leading-tight ${plan.popular ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
              >
                {plan.name === 'Free'
                  ? 'Get Started today:'
                  : 'Everything in Free +'}
              </div>
              <div className="flex flex-col items-start justify-start gap-3 self-stretch">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center justify-start gap-2 self-stretch"
                  >
                    <div className="flex h-4 w-4 items-center justify-center">
                      <Check
                        className={`h-full w-full ${plan.popular ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                        strokeWidth={2}
                      />
                    </div>
                    <div
                      className={`text-left text-sm font-normal leading-tight ${plan.popular ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                    >
                      {feature}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
