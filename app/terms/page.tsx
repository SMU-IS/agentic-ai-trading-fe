"use client"

import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

export default function TermsOfServicePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <span className="font-geist font-thin text-xl text-foreground">
              Agent M
            </span>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-10">
        {/* Title */}
        <motion.div {...fadeUp}>
          <div className="inline-block rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs text-blue-400 mb-4">
            Governing Law: Singapore &nbsp;·&nbsp; Financial Services Disclaimer
            Included
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Agent M &nbsp;·&nbsp; Effective Date: April 19, 2026 &nbsp;·&nbsp;
            Last Updated: April 19, 2026
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="text-sm text-muted-foreground leading-relaxed"
        >
          Welcome to {` `}
          <strong className="text-foreground">Agent M</strong>, our AI-powered
          autonomous investment assistant. These Terms of Service
          (&quot;Terms&quot;) govern your access to and use of the platform,
          including Agent M&apos;s news analysis, RAG chatbot, and automated
          trading features. By creating an account or using Agent M, you agree
          to be legally bound by these Terms.
        </motion.p>

        {/* Warning box */}
        <WarningBox>
          <strong>Important:</strong> Agent M facilitates automated investment
          decisions. Trading in financial instruments involves risk. Agent M
          does not guarantee any investment returns. Please read these Terms
          carefully before proceeding.
        </WarningBox>

        {/* Table of Contents */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-lg border border-border bg-muted/30 p-6"
        >
          <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-4">
            Table of Contents
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm">
            {[
              ["#eligibility", "Eligibility & Account Registration"],
              ["#services", "Description of Services"],
              ["#financial-disclaimer", "Financial Disclaimer & Risk Warning"],
              ["#automated-trading", "Automated Trading & Agent M Behaviour"],
              ["#user-obligations", "User Obligations & Prohibited Conduct"],
              ["#intellectual-property", "Intellectual Property"],
              ["#data-privacy", "Data & Privacy"],
              ["#third-party", "Third-Party Services & Integrations"],
              ["#liability", "Limitation of Liability"],
              ["#termination", "Termination"],
              ["#changes", "Changes to Terms"],
              ["#governing-law", "Governing Law & Disputes"],
              ["#contact", "Contact Us"],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="text-teal-500 hover:underline">
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </motion.div>

        {/* Section 1 */}
        <Section id="eligibility" title="1. Eligibility & Account Registration">
          <p>To use Agent M, you must:</p>
          <BulletList
            items={[
              "Be at least 18 years of age.",
              "Have the legal capacity to enter into a binding agreement in your jurisdiction.",
              "Not be prohibited from using financial services under applicable law.",
              "Provide accurate, complete, and up-to-date information during registration.",
              "Maintain the security of your account credentials and notify us immediately of any unauthorised access.",
            ]}
          />
          <p className="mt-3">
            You are responsible for all activity that occurs under your account.
            Agent M reserves the right to suspend or terminate accounts that
            violate these Terms or provide false information.
          </p>
        </Section>

        {/* Section 2 */}
        <Section id="services" title="2. Description of Services">
          <p>
            Agent M provides a multi-agent AI investment platform comprising the
            following core modules:
          </p>
          <DataTable
            headers={["Module", "Description"]}
            rows={[
              [
                "News Scraper",
                "Automatically scrapes and aggregates financial news from Reddit, Yahoo Finance, and other sources.",
              ],
              [
                "News Analysis",
                "NLP-powered sentiment analysis and event extraction using multiple LLMs to identify market-moving information relevant to your portfolio.",
              ],
              [
                "RAG Chatbot",
                "Conversational AI that answers investment queries using your portfolio context and verified news.",
              ],
              [
                "RAG Trading Agent",
                "Autonomously executes buy/sell orders via broker APIs based on sentiment and your risk limits.",
              ],
              [
                "Notification Module",
                "Real-time alerts for breaking news events and trade execution confirmations.",
              ],
              [
                "Dashboard",
                "Unified view of portfolio holdings, trade logs, P&L, and real-time sentiment indicators.",
              ],
            ]}
          />
          <p className="mt-4">
            Agent M reserves the right to modify, suspend, or discontinue any
            feature at any time with reasonable notice.
          </p>
        </Section>

        {/* Section 3 */}
        <Section
          id="financial-disclaimer"
          title="3. Financial Disclaimer & Risk Warning"
        >
          <WarningBox>
            <strong>Agent M is not a licensed financial advisor.</strong> All
            content, insights, and trade recommendations generated by Agent M
            are for informational and assistive purposes only and do not
            constitute personalised financial advice under the Singapore
            Financial Advisers Act (FAA) or any other applicable law.
          </WarningBox>
          <BulletList
            items={[
              "Past performance of any trading strategy does not guarantee future results.",
              "Investing in financial instruments carries the risk of partial or total loss of capital.",
              "You should consult a licensed financial adviser before making significant investment decisions.",
              "Agent M is not responsible for losses resulting from reliance on Agent M's analysis or trade executions.",
              "Automated sentiment-based trading may not account for all market risks, including black swan events.",
            ]}
          />
        </Section>

        {/* Section 4 */}
        <Section
          id="automated-trading"
          title="4. Automated Trading & Agent M Behaviour"
        >
          <p>
            By enabling the RAG Trading Agent, you explicitly authorise Agent M
            to execute buy and sell orders on your behalf through connected
            broker APIs (e.g. Alpaca, IBKR), strictly within the risk limits and
            guardrails you have configured in your account settings.
          </p>
          <HighlightBox>
            You are solely responsible for setting appropriate risk limits (e.g.
            maximum trade size, stop-loss thresholds, permitted asset classes).
            Agent M will act within — but not beyond — the parameters you
            define.
          </HighlightBox>
          <BulletList
            items={[
              "You may pause or stop the Trading Agent at any time from your dashboard.",
              "All executed trades are logged and visible in your Trade History dashboard.",
              "Agent M does not guarantee execution price, fill rate, or successful order placement due to broker API dependencies and market conditions.",
              "You acknowledge that automated systems may behave unexpectedly during extreme market volatility.",
              "Agent M reserves the right to halt automated trading if system anomalies or security issues are detected.",
            ]}
          />
        </Section>

        {/* Section 5 */}
        <Section
          id="user-obligations"
          title="5. User Obligations & Prohibited Conduct"
        >
          <p>
            You agree to use Agent M only for lawful purposes. You must{" "}
            <strong className="text-foreground">not</strong>:
          </p>
          <BulletList
            items={[
              "Use the platform to engage in market manipulation, insider trading, or any fraudulent activity.",
              "Attempt to reverse-engineer, scrape, or exploit Agent M's AI models, APIs, or infrastructure.",
              "Share account credentials or allow third parties to access your account.",
              "Introduce malicious code, bots, or automated scripts not authorised by Agent M.",
              "Use Agent M's outputs to provide unlicensed financial advice to third parties.",
              "Circumvent access controls, rate limits, or security mechanisms of the platform.",
              "Violate any applicable laws, including Singapore MAS regulations or securities laws.",
            ]}
          />
          <p className="mt-3">
            Violation of these obligations may result in immediate account
            termination and, where applicable, referral to relevant regulatory
            authorities.
          </p>
        </Section>

        {/* Section 6 */}
        <Section id="intellectual-property" title="6. Intellectual Property">
          <p>
            All content, software, AI models, algorithms, branding, and
            interfaces associated with Agent M are the intellectual property of{" "}
            <strong className="text-foreground">Agent M</strong> and its
            licensors. All rights are reserved.
          </p>
          <BulletList
            items={[
              "You are granted a limited, non-exclusive, non-transferable licence to use the platform for personal investment management only.",
              "You may not reproduce, distribute, or create derivative works from any part of the platform without prior written consent.",
              "User-generated content (e.g. portfolio data, custom watchlists) remains your property. By submitting it, you grant Agent M a licence to process it for service delivery.",
            ]}
          />
        </Section>

        {/* Section 7 */}
        <Section id="data-privacy" title="7. Data & Privacy">
          <p>
            Your use of Agent M is also governed by our{" "}
            <Link href="/privacy" className="text-teal-500 hover:underline">
              Privacy Policy
            </Link>
            , which is incorporated into these Terms by reference. By agreeing
            to these Terms, you also accept our Privacy Policy.
          </p>
          <BulletList
            items={[
              "We collect and process personal and financial data as described in our Privacy Policy.",
              "Conversation data with Agent M may be used to improve model performance in anonymised form.",
              "You may request deletion of your data at any time, subject to legal retention requirements.",
            ]}
          />
        </Section>

        {/* Section 8 */}
        <Section
          id="third-party"
          title="8. Third-Party Services & Integrations"
        >
          <p>
            Agent M integrates with the following third-party services to
            deliver it's functionality:
          </p>
          <DataTable
            headers={["Service", "Purpose"]}
            rows={[
              ["Alpaca / IBKR", "Brokerage API for trade execution"],
              [
                "Reddit API / Yahoo Finance RSS",
                "Financial news and sentiment data ingestion",
              ],
              [
                "Google Gemini",
                "LLM for event extraction and RAG response generation",
              ],
              ["Amazon Web Services", "Cloud infrastructure and deployment"],
              ["Qdrant", "Vector database for RAG pipeline"],
            ]}
          />
          <p className="mt-4">
            Agent M is not responsible for the availability, accuracy, or
            policies of third-party services. Your use of these integrations is
            also subject to their respective terms of service.
          </p>
        </Section>

        {/* Section 9 */}
        <Section id="liability" title="9. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, Agent M, its team members,
            sponsors, and partners shall not be liable for:
          </p>
          <BulletList
            items={[
              "Any financial losses, including loss of capital, resulting from trades executed by Agent M.",
              "Losses arising from inaccurate, delayed, or incomplete news data or NLP analysis.",
              "Service interruptions, downtime, or data loss caused by infrastructure failures or third-party outages.",
              "Unauthorised access to your account arising from your failure to maintain credential security.",
              "Indirect, incidental, consequential, or punitive damages of any kind.",
            ]}
          />
          <p className="mt-3">
            Where liability cannot be fully excluded by law, Agent M&apos;s
            total aggregate liability shall not exceed the fees paid by you in
            the three (3) months preceding the event giving rise to the claim.
          </p>
        </Section>

        {/* Section 10 */}
        <Section id="termination" title="10. Termination">
          <p>
            Either party may terminate the agreement at any time. You may close
            your account via your account settings or by contacting us. Agent M
            may suspend or terminate your access with or without notice if:
          </p>
          <BulletList
            items={[
              "You breach any provision of these Terms.",
              "We are required to do so by applicable law or a regulatory authority.",
              "We determine that continued access poses a risk to the platform or other users.",
              "The platform is discontinued.",
            ]}
          />
          <p className="mt-3">
            Upon termination, your right to access the platform ceases
            immediately. Sections relating to intellectual property, liability,
            and governing law survive termination.
          </p>
        </Section>

        {/* Section 11 */}
        <Section id="changes" title="11. Changes to Terms">
          <p>
            Agent M may update these Terms at any time to reflect changes in
            law, our services, or business practices. We will notify you of
            material changes via email or an in-app notification at least{" "}
            <strong className="text-foreground">14 days</strong> before the
            changes take effect.
          </p>
          <p className="mt-3">
            Continued use of Agent M after the effective date of updated Terms
            constitutes your acceptance of those changes. If you do not agree to
            the updated Terms, you must discontinue use and close your account.
          </p>
        </Section>

        {/* Section 12 */}
        <Section id="governing-law" title="12. Governing Law & Disputes">
          <p>
            These Terms are governed by and construed in accordance with the
            laws of <strong className="text-foreground">Singapore</strong>,
            without regard to its conflict of law provisions.
          </p>
          <BulletList
            items={[
              "Any dispute arising out of or in connection with these Terms shall first be referred to mediation under the Singapore Mediation Centre.",
              "If mediation fails, disputes shall be resolved by the courts of Singapore, to whose exclusive jurisdiction you submit.",
              "Nothing in this clause prevents Agent M from seeking urgent injunctive relief in any competent jurisdiction.",
            ]}
          />
        </Section>

        {/* Section 13 */}
        <Section id="contact" title="13. Contact Us">
          <p>
            If you have questions about these Terms or wish to exercise any
            rights described herein, please contact us:
          </p>
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm space-y-1">
            <p>
              <strong className="text-foreground">Agent M</strong>
            </p>
            <p>
              Email:{" "}
              <a
                href="mailto:legal@agentm.com"
                className="text-teal-500 hover:underline"
              >
                hello@agentic-m.com
              </a>
            </p>
          </div>
        </Section>

        <Separator />
        <p className="text-xs text-muted-foreground pb-8">
          &copy; {new Date().getFullYear()} Agent M. All rights reserved.
        </p>
      </main>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-2 scroll-mt-6"
    >
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <Separator />
      <div className="pt-2 text-sm text-muted-foreground leading-relaxed space-y-3">
        {children}
      </div>
    </motion.section>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 mt-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm text-muted-foreground">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
          {item}
        </li>
      ))}
    </ul>
  )
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border mt-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left font-medium text-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(([first, ...rest]) => (
            <tr key={first} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 font-medium text-foreground">{first}</td>
              {rest.map((cell, i) => (
                <td key={i} className="px-4 py-3 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-red-500 bg-red-500/5 px-4 py-3 text-sm text-red-400">
      {children}
    </div>
  )
}

function HighlightBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-amber-500 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
      {children}
    </div>
  )
}
