'use client';

import type React from 'react';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqData = [
  {
    question: 'What is Agent M and who is it for?',
    answer:
      'Agent M aims to deliver a fully autonomous investment companion that continuously ingests real-time market data, financial news, and internet sentiment, then translates them into timely, personalised buy/sell decisions executed via external brokerage APIs on behalf of retail investors.',
  },
  {
    question: 'How does the system help retail investors in practice?',
    answer:
      'It addresses time delay and information overload by automatically scraping and analysing financial news, extracting investment-relevant events and sentiment, and then either answering user queries via a RAG chatbot or autonomously executing trades within user-defined risk limits.',
  },
  {
    question: 'What kind of analytics and dashboard features will users see?',
    answer:
      'Users get a trading dashboard that visualises real-time sentiment indicators per stock, profit and loss trends over time, current portfolio holdings, trade logs, and portfolio positions, allowing them to monitor performance and understand how news affects their investments.',
  },
  {
    question: 'How does the RAG Trading Agent decide when to buy or sell?',
    answer:
      'The RAG Trading Agent uses a pipeline where scraped news and social media posts are preprocessed, checked for credibility, analysed for sentiment, embedded, and retrieved via RAG; it then makes automated trading decisions using weighted sentiment and user-set risk guardrails before executing orders through broker APIs.',
  },
  {
    question: 'How do you ensure accuracy of the trade decisions?',
    answer:
      'The team will conduct multiple rounds of functional testing, data validation testing, and user acceptance testing across all modules, and has identified risks such as scraping failures, anti-bot blocking, unreliable data sources, hallucinations, and stakeholder misalignment, each with mitigation strategies like modular scrapers, use of official APIs, curated sources, RAG-based validation, and regular stakeholder communication.',
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem = ({ question, answer, isOpen, onToggle }: FAQItemProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onToggle();
  };
  return (
    <div
      className={`w-full bg-[rgba(231,236,235,0.08)] shadow-[0px_2px_4px_rgba(0,0,0,0.16)] overflow-hidden rounded-[10px] outline outline-1 outline-border outline-offset-[-1px] transition-all duration-500 ease-out cursor-pointer`}
      onClick={handleClick}
    >
      <div className="w-full px-5 py-[18px] pr-4 flex justify-between items-center gap-5 text-left transition-all duration-300 ease-out">
        <div className="flex-1 text-foreground text-base font-medium leading-6 break-words">
          {question}
        </div>
        <div className="flex justify-center items-center">
          <ChevronDown
            className={`w-6 h-6 text-muted-foreground-dark transition-all duration-500 ease-out ${
              isOpen ? 'rotate-180 scale-110' : 'rotate-0 scale-100'
            }`}
          />
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{
          transitionProperty: 'max-height, opacity, padding',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          className={`px-5 transition-all duration-500 ease-out ${
            isOpen ? 'pb-[18px] pt-2 translate-y-0' : 'pb-0 pt-0 -translate-y-2'
          }`}
        >
          <div className="text-foreground/80 text-sm font-normal leading-6 break-words">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
};

export function FAQSection() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };
  return (
    <section className="w-full pt-[66px] pb-20 md:pb-40 px-5 relative flex flex-col justify-center items-center">
      <div className="w-[300px] h-[500px] absolute top-[150px] left-1/2 -translate-x-1/2 origin-top-left rotate-[-33.39deg] bg-primary/10 blur-[100px] z-0" />
      <div className="self-stretch pt-8 pb-8 md:pt-14 md:pb-14 flex flex-col justify-center items-center gap-2 relative z-10">
        <div className="flex flex-col justify-start items-center gap-4">
          <h2 className="w-full max-w-[435px] text-center text-foreground text-4xl font-semibold leading-10 break-words">
            Frequently Asked Questions
          </h2>
          <p className="self-stretch text-center text-muted-foreground text-sm font-medium leading-[18.20px] break-words">
            Everything you need to know about Pointer and how it can transform
            your development workflow
          </p>
        </div>
      </div>
      <div className="w-full max-w-[600px] pt-0.5 pb-10 flex flex-col justify-start items-start gap-4 relative z-10">
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
  );
}
