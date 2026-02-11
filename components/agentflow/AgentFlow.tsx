"use client"

import { motion } from "framer-motion"
import {
  Clock,
  Newspaper,
  Brain,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"

interface FlowNodeProps {
  icon: React.ReactNode
  title: string
  description: string
  delay: number
}

const FlowNode = ({ icon, title, description, delay }: FlowNodeProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        type: "spring",
        stiffness: 200,
        damping: 15,
      }}
      whileHover={{ scale: 1.05 }}
      className="relative flex flex-col items-center gap-3 rounded-2xl border border-foreground/10 bg-card/50 p-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ rotate: -180, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.2 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
      >
        {icon}
      </motion.div>
      <h3 className="text-center text-lg font-semibold text-foreground">
        {title}
      </h3>
      <p className="text-center text-sm text-muted-foreground">{description}</p>
    </motion.div>
  )
}

const FlowConnector = ({ delay }: { delay: number }) => {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.5, delay }}
      className="flex items-center justify-center"
    >
      <motion.div
        animate={{ x: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowRight className="h-8 w-8 text-primary" />
      </motion.div>
    </motion.div>
  )
}

export default function AgentFlowTab() {
  const flowSteps = [
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Schedule Daily Post",
      description: "Automated monitoring triggers at scheduled intervals",
      delay: 0.2,
    },
    {
      icon: <Newspaper className="h-8 w-8 text-blue-500" />,
      title: "Scrape News",
      description:
        "Reddit, Yahoo Finance, and social media sources scraped for financial news",
      delay: 0.4,
    },
    {
      icon: <Brain className="h-8 w-8 text-purple-500" />,
      title: "Analyze with Gemini",
      description:
        "NLP extracts events, sentiment, and credibility scores using Gemini LLM",
      delay: 0.6,
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-teal-500" />,
      title: "Generate Trade Signal",
      description:
        "RAG Trading Agent synthesizes insights to create buy/sell decisions",
      delay: 0.8,
    },
    {
      icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
      title: "Execute Trade",
      description: "Order placed via ALPACA Brokerage API and status updated",
      delay: 1.0,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col gap-8 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col gap-4"
      >
        <h1 className="text-4xl font-bold text-foreground">Agent Flow</h1>
        <p className="text-lg text-muted-foreground">
          Automated workflow: From news scraping to trade execution
        </p>
      </motion.div>

      {/* Flow Chart - Desktop */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-4">
          {flowSteps.map((step, index) => (
            <>
              <FlowNode key={step.title} {...step} />
              {index < flowSteps.length - 1 && (
                <FlowConnector
                  key={`connector-${index}`}
                  delay={step.delay + 0.3}
                />
              )}
            </>
          ))}
        </div>
      </div>

      {/* Flow Chart - Mobile */}
      <div className="flex flex-col gap-6 lg:hidden">
        {flowSteps.map((step, index) => (
          <div key={step.title} className="flex flex-col items-center gap-4">
            <FlowNode {...step} />
            {index < flowSteps.length - 1 && (
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, delay: step.delay + 0.3 }}
              >
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <ArrowRight className="h-8 w-8 rotate-90 text-primary" />
                </motion.div>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Info Cards */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="rounded-2xl border border-foreground/10 bg-card/50 p-6 backdrop-blur-sm"
        >
          <h3 className="mb-3 text-xl font-semibold text-foreground">
            Pipeline Performance
          </h3>
          <div className="space-y-2 text-muted-foreground">
            <p>
              ⚡ End-to-End Latency:{" "}
              <span className="font-semibold text-primary">&lt;300ms</span>
            </p>
            <p>
              📊 Articles Processed Daily:{" "}
              <span className="font-semibold text-primary">5,000+</span>
            </p>
            <p>
              🎯 Sentiment Accuracy:{" "}
              <span className="font-semibold text-primary">90%</span>
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="rounded-2xl border border-foreground/10 bg-card/50 p-6 backdrop-blur-sm"
        >
          <h3 className="mb-3 text-xl font-semibold text-foreground">
            Key Technologies
          </h3>
          <div className="space-y-2 text-muted-foreground">
            <p>
              🤖 NLP Engine:{" "}
              <span className="font-semibold text-foreground">Gemini LLM</span>
            </p>
            <p>
              💾 Vector DB:{" "}
              <span className="font-semibold text-foreground">Qdrant</span>
            </p>
            <p>
              📈 Broker API:{" "}
              <span className="font-semibold text-foreground">ALPACA</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
