"use client"

import type React from "react"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqData = [
  {
    question: "What is Agent M and who is it for?",
    answer:
      "Agent M aims to deliver a fully autonomous investment companion that continuously ingests real-time market data, financial news, and internet sentiment, then translates them into timely, personalised buy/sell decisions executed via external brokerage APIs on behalf of retail investors.",
  },
  {
    question: "How does the system help retail investors in practice?",
    answer:
      "It addresses time delay and information overload by automatically scraping and analysing financial news, extracting investment-relevant events and sentiment, and then either answering user queries via a RAG chatbot or autonomously executing trades within user-defined risk limits.",
  },
  {
    question: "What kind of analytics and dashboard features will users see?",
    answer:
      "Users get a trading dashboard that visualises real-time sentiment indicators per stock, profit and loss trends over time, current portfolio holdings, trade logs, and portfolio positions, allowing them to monitor performance and understand how news affects their investments.",
  },
  {
    question: "How does the RAG Trading Agent decide when to buy or sell?",
    answer:
      "The RAG Trading Agent uses a pipeline where scraped news and social media posts are preprocessed, checked for credibility, analysed for sentiment, embedded, and retrieved via RAG; it then makes automated trading decisions using weighted sentiment and user-set risk guardrails before executing orders through broker APIs.",
  },
  {
    question: "How do you ensure accuracy of the trade decisions?",
    answer:
      "The team will conduct multiple rounds of functional testing, data validation testing, and user acceptance testing across all modules, and has identified risks such as scraping failures, anti-bot blocking, unreliable data sources, hallucinations, and stakeholder misalignment, each with mitigation strategies like modular scrapers, use of official APIs, curated sources, RAG-based validation, and regular stakeholder communication.",
  },
]

interface FAQItemProps {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}

const FAQItem = ({ question, answer, isOpen, onToggle }: FAQItemProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onToggle()
  }
  return (
    <div
      className={`w-full cursor-pointer overflow-hidden rounded-[10px] bg-[rgba(231,236,235,0.08)] shadow-[0px_2px_4px_rgba(0,0,0,0.16)] outline outline-1 outline-offset-[-1px] outline-border transition-all duration-500 ease-out`}
      onClick={handleClick}
    >
      <div className="flex w-full items-center justify-between gap-5 px-5 py-[18px] pr-4 text-left transition-all duration-300 ease-out">
        <div className="flex-1 break-words text-base font-medium leading-6 text-foreground">
          {question}
        </div>
        <div className="flex items-center justify-center">
          <ChevronDown
            className={`text-muted-foreground-dark h-6 w-6 transition-all duration-500 ease-out ${
              isOpen ? "rotate-180 scale-110" : "rotate-0 scale-100"
            }`}
          />
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{
          transitionProperty: "max-height, opacity, padding",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          className={`px-5 transition-all duration-500 ease-out ${
            isOpen ? "translate-y-0 pb-[18px] pt-2" : "-translate-y-2 pb-0 pt-0"
          }`}
        >
          <div className="break-words text-sm font-normal leading-6 text-foreground/80">
            {answer}
          </div>
        </div>
      </div>
    </div>
  )
}

export function FAQSection() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())
  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }
  return (
    <section className="relative flex w-full flex-col items-center justify-center px-5 pb-20 pt-[66px] md:pb-40">
      <div className="absolute left-1/2 top-[150px] z-0 h-[500px] w-[300px] origin-top-left -translate-x-1/2 rotate-[-33.39deg] bg-primary/10 blur-[100px]" />
      <div className="relative z-10 flex flex-col items-center justify-center gap-2 self-stretch pb-8 pt-8 md:pb-14 md:pt-14">
        <div className="flex flex-col items-center justify-start gap-4">
          <h2 className="w-full max-w-[435px] break-words text-center text-4xl font-semibold leading-10 text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="self-stretch break-words text-center text-sm font-medium leading-[18.20px] text-muted-foreground">
            Everything you need to know about Agent M and how it can transform
            your trading experience.
          </p>
        </div>
      </div>
      <div className="relative z-10 flex w-full max-w-[600px] flex-col items-start justify-start gap-4 pb-10 pt-0.5">
        {faqData.map((faq, index) => (
          <FAQItem
            key={index}
            {...faq}
            isOpen={openItems.has(index)}
            onToggle={() => toggleItem(index)}
          />
        ))}
      </div>
    </section>
  )
}
