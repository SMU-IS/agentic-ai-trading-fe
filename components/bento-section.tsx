import AiCodeReviews from "./bento/ai-code-reviews"
import EasyDeployment from "./bento/easy-deployment"
import MCPConnectivityIllustration from "./bento/mcp-connectivity-illustration" // Updated import
import OneClickIntegrationsIllustration from "./bento/one-click-integrations-illustration"
import ParallelCodingAgents from "./bento/parallel-agents" // Updated import
import RealtimeCodingPreviews from "./bento/real-time-previews"

const BentoCard = ({ title, description, Component }) => (
  <div className="relative flex flex-col items-start justify-start overflow-hidden rounded-2xl border border-white/20">
    {/* Background with blur effect */}
    <div
      className="absolute inset-0 rounded-2xl"
      style={{
        background: "rgba(231, 236, 235, 0.08)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    />
    {/* Additional subtle gradient overlay */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent" />

    <div className="relative z-10 flex flex-col items-start justify-start gap-2 self-stretch p-6">
      <div className="flex flex-col items-start justify-start gap-1.5 self-stretch">
        <p className="self-stretch text-lg font-normal leading-7 text-foreground">
          {title} <br />
          <span className="text-muted-foreground">{description}</span>
        </p>
      </div>
    </div>
    <div className="relative z-10 -mt-0.5 h-72 self-stretch">
      <Component />
    </div>
  </div>
)

export function BentoSection() {
  const cards = [
    {
      title: "Real-Time Financial News Aggregation",
      description:
        "Automatically scrapes and collects daily financial news from multiple sources to keep your portfolio insights current.",
      Component: AiCodeReviews,
    },
    {
      title: "AI-Powered News Analysis",
      description:
        "NLP-powered analysis that extracts investment-relevant events and sentiment from financial news to inform trading decisions.",
      Component: RealtimeCodingPreviews,
    },
    {
      title: "Autonomous Trading Agent",
      description:
        "Synthesizes market data with your portfolio context to autonomously execute personalized buy/sell orders via brokerage APIs.",
      Component: OneClickIntegrationsIllustration,
    },
    {
      title: "Investment Assistant Chatbot",
      description:
        "Query your portfolio and financial news database using natural language to get instant, contextual investment insights.",
      Component: MCPConnectivityIllustration, // Updated component
    },
    {
      title: "Smart Portfolio Alerts", // Swapped position
      description:
        "Delivers real-time critical alerts when breaking news directly impacts your specific holdings and confirms trade executions.",
      Component: ParallelCodingAgents, // Updated component
    },
    {
      title: "Comprehensive Trading Dashboard", // Swapped position
      description:
        "Visual analytics displaying sentiment indicators, P&L trends, and portfolio holdings for informed investment monitoring.",
      Component: EasyDeployment,
    },
  ]

  return (
    <section className="flex w-full flex-col items-center justify-center overflow-visible bg-transparent px-5">
      <div className="relative flex w-full flex-col items-start justify-start gap-6 py-8 md:py-16">
        <div className="absolute left-[80px] top-[614px] z-0 h-[938px] w-[547px] origin-top-left rotate-[-33.39deg] bg-primary/10 blur-[130px]" />
        <div className="z-10 flex flex-col items-center justify-center gap-2 self-stretch py-8 md:py-14">
          <div className="flex flex-col items-center justify-start gap-4">
            <h2 className="w-full max-w-[655px] text-center text-4xl font-semibold leading-tight text-foreground md:text-6xl md:leading-[66px]">
              Autonomous Trading with a RAG AI system
            </h2>
            <p className="w-full max-w-[600px] pt-32 text-lg font-medium leading-relaxed text-muted-foreground md:text-xl">
              Your personalised AI agent for autonomous trades, seamless
              integrations with your exisiting portfolios, and actionable news
              insights to stay on top — so you never miss a market-moving event
              on your portfolio again.
            </p>
          </div>
        </div>
        <div className="z-10 grid grid-cols-1 gap-6 self-stretch md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <BentoCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  )
}
