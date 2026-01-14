import AiCodeReviews from './bento/ai-code-reviews';
import RealtimeCodingPreviews from './bento/real-time-previews';
import OneClickIntegrationsIllustration from './bento/one-click-integrations-illustration';
import MCPConnectivityIllustration from './bento/mcp-connectivity-illustration'; // Updated import
import EasyDeployment from './bento/easy-deployment';
import ParallelCodingAgents from './bento/parallel-agents'; // Updated import

const BentoCard = ({ title, description, Component }) => (
  <div className="overflow-hidden rounded-2xl border border-white/20 flex flex-col justify-start items-start relative">
    {/* Background with blur effect */}
    <div
      className="absolute inset-0 rounded-2xl"
      style={{
        background: 'rgba(231, 236, 235, 0.08)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    />
    {/* Additional subtle gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />

    <div className="self-stretch p-6 flex flex-col justify-start items-start gap-2 relative z-10">
      <div className="self-stretch flex flex-col justify-start items-start gap-1.5">
        <p className="self-stretch text-foreground text-lg font-normal leading-7">
          {title} <br />
          <span className="text-muted-foreground">{description}</span>
        </p>
      </div>
    </div>
    <div className="self-stretch h-72 relative -mt-0.5 z-10">
      <Component />
    </div>
  </div>
);

export function BentoSection() {
  const cards = [
    {
      title: 'Real-Time Financial News Aggregation',
      description:
        'Automatically scrapes and collects daily financial news from multiple sources to keep your portfolio insights current.',
      Component: AiCodeReviews,
    },
    {
      title: 'AI-Powered News Analysis',
      description:
        'NLP-powered analysis that extracts investment-relevant events and sentiment from financial news to inform trading decisions.',
      Component: RealtimeCodingPreviews,
    },
    {
      title: 'Autonomous Trading Agent',
      description:
        'Synthesizes market data with your portfolio context to autonomously execute personalized buy/sell orders via brokerage APIs.',
      Component: OneClickIntegrationsIllustration,
    },
    {
      title: 'Investment Assistant Chatbot',
      description:
        'Query your portfolio and financial news database using natural language to get instant, contextual investment insights.',
      Component: MCPConnectivityIllustration, // Updated component
    },
    {
      title: 'Smart Portfolio Alerts', // Swapped position
      description:
        'Delivers real-time critical alerts when breaking news directly impacts your specific holdings and confirms trade executions.',
      Component: ParallelCodingAgents, // Updated component
    },
    {
      title: 'Comprehensive Trading Dashboard', // Swapped position
      description:
        'Visual analytics displaying sentiment indicators, P&L trends, and portfolio holdings for informed investment monitoring.',
      Component: EasyDeployment,
    },
  ];

  return (
    <section className="w-full px-5 flex flex-col justify-center items-center overflow-visible bg-transparent">
      <div className="w-full py-8 md:py-16 relative flex flex-col justify-start items-start gap-6">
        <div className="w-[547px] h-[938px] absolute top-[614px] left-[80px] origin-top-left rotate-[-33.39deg] bg-primary/10 blur-[130px] z-0" />
        <div className="self-stretch py-8 md:py-14 flex flex-col justify-center items-center gap-2 z-10">
          <div className="flex flex-col justify-start items-center gap-4">
            <h2 className="w-full max-w-[655px] text-center text-foreground text-4xl md:text-6xl font-semibold leading-tight md:leading-[66px]">
              Empower Your Workflow with AI
            </h2>
            <p className="w-full max-w-[600px] text-center text-muted-foreground text-lg md:text-xl font-medium leading-relaxed">
              Ask your AI Agent for real-time collaboration, seamless
              integrations, and actionable insights to streamline your
              operations.
            </p>
          </div>
        </div>
        <div className="self-stretch grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 z-10">
          {cards.map((card) => (
            <BentoCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
