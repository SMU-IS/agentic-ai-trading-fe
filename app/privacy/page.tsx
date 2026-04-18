"use client"

import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

export default function PrivacyPolicyPage() {
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
        <motion.div {...fadeUp}>
          <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-2">Last updated: April 19, 2026</p>
        </motion.div>

        {/* 1. Introduction */}
        <Section title="1. Introduction">
          <p>
            Agent M is an AI-powered autonomous investment assistant (&quot;Agent M,&quot; &quot;we,&quot;
            &quot;our,&quot; or &quot;us&quot;) that provides financial insights, news analysis, and
            automated investment support. This Privacy Policy explains how we collect,
            use, store, and protect your personal data when you interact with Agent M.
          </p>
          <p className="mt-3">
            By using Agent M, you agree to the practices described in this policy. If
            you do not agree, please discontinue use immediately.
          </p>
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground italic">
            &quot;You are interacting with Agent M, an AI-powered investment assistant. This
            conversation may be recorded and processed to improve our services. Your
            data will be handled in accordance with our Privacy Policy. Do you consent
            to proceed?&quot;
          </div>
        </Section>

        {/* 2. Information We Collect */}
        <Section title="2. Information We Collect">
          <p>Agent M may collect the following categories of data:</p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Data Category</th>
                  <th className="px-4 py-3 text-left font-medium">Examples</th>
                  <th className="px-4 py-3 text-left font-medium">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Account Information", "Name, email, user ID", "Authentication & personalization"],
                  ["Financial Preferences", "Risk tolerance, investment goals", "Portfolio recommendations"],
                  ["Conversation Data", "Chat messages, queries sent to Agent M", "AI response generation, model improvement"],
                  ["Market Interaction Data", "Trades initiated, assets viewed", "Auto-trading & performance tracking"],
                  ["Device & Usage Data", "IP address, browser type, session timestamps", "Security, fraud prevention"],
                  ["News & Research Queries", "Topics searched, articles read", "NLP analysis and personalized briefings"],
                ].map(([cat, ex, purpose]) => (
                  <tr key={cat} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{cat}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ex}</td>
                    <td className="px-4 py-3 text-muted-foreground">{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-muted-foreground text-sm">
            We do <strong className="text-foreground">not</strong> collect sensitive personal data
            (e.g., biometric data, health records) unless explicitly required and disclosed.
          </p>
        </Section>

        {/* 3. How We Use Your Data */}
        <Section title="3. How We Use Your Data">
          <p>Your data is used for the following purposes:</p>
          <ul className="mt-3 space-y-2 list-none">
            {[
              ["Providing AI Services", "To power Agent M\u2019s news scraping, NLP analysis, RAG chatbot responses, and auto-trading recommendations."],
              ["Personalization", "To tailor investment insights and portfolio suggestions to your profile."],
              ["Automated Decision-Making", "Agent M may use your financial data to make or suggest automated trade executions. You have the right to request human review of any automated decision."],
              ["Security & Fraud Prevention", "To monitor for unauthorized access or suspicious activity."],
              ["Service Improvement", "Anonymized conversation data may be used to retrain and improve Agent M\u2019s models."],
              ["Notifications", "To send real-time alerts about portfolio performance, market events, or account activity."],
            ].map(([label, desc]) => (
              <li key={label} className="flex gap-2 text-sm">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500 mt-2" />
                <span>
                  <strong>{label}</strong> &ndash; {desc}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        {/* 4. Automated Decision-Making */}
        <Section title="4. Automated Decision-Making">
          <p>
            Agent M uses AI and algorithmic models to generate investment insights and
            may execute trades autonomously on your behalf based on your configured
            preferences.
          </p>
          <p className="mt-3">You have the right to:</p>
          <ul className="mt-2 space-y-2">
            {[
              "Opt out of fully automated trade execution at any time via your account settings.",
              "Request human review of any decision that significantly affects your financial position.",
              "Understand the logic behind automated decisions by contacting us at privacy@agentm.com.",
            ].map((item) => (
              <li key={item} className="flex gap-2 text-sm">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* 5. Data Sharing & Third Parties */}
        <Section title="5. Data Sharing & Third Parties">
          <p>
            We do <strong>not</strong> sell your personal data. We may share data with:
          </p>
          <ul className="mt-3 space-y-2">
            {[
              ["Brokerage/Trading Platforms", "To execute authorized trades on your behalf."],
              ["Cloud Infrastructure Providers", "For secure data storage and processing (e.g., AWS, GCP)."],
              ["Analytics Providers", "Anonymized/aggregated data for performance monitoring."],
              ["Regulatory Authorities", "Where required by law (e.g., MAS in Singapore, SEC regulations)."],
              ["UBS (Sponsor/Partner)", "As relevant to the project scope, under strict data processing agreements."],
            ].map(([label, desc]) => (
              <li key={label} className="flex gap-2 text-sm">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                <span>
                  <strong>{label}</strong> &ndash; {desc}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            All third parties are contractually bound to process your data only as
            instructed and in compliance with applicable law.
          </p>
        </Section>

        {/* 6. Data Retention */}
        <Section title="6. Data Retention">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Data Type</th>
                  <th className="px-4 py-3 text-left font-medium">Retention Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Conversation logs", "90 days (then anonymized)"],
                  ["Account & financial data", "Duration of account + 5 years (regulatory compliance)"],
                  ["Trade execution records", "7 years (financial regulation requirement)"],
                  ["Device/usage logs", "30 days"],
                ].map(([type, period]) => (
                  <tr key={type} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            You may request deletion of your data at any time, subject to legal
            retention requirements.
          </p>
        </Section>

        {/* 7. Your Rights */}
        <Section title="7. Your Rights">
          <p>
            Depending on your jurisdiction (e.g., Singapore PDPA, EU GDPR), you have
            the right to:
          </p>
          <ul className="mt-3 space-y-2">
            {[
              ["Access", "Request a copy of your personal data."],
              ["Rectification", "Correct inaccurate or incomplete data."],
              ["Erasure", "Request deletion of your data (\u201cright to be forgotten\u201d)."],
              ["Restriction", "Limit how your data is processed."],
              ["Portability", "Receive your data in a machine-readable format."],
              ["Objection", "Object to data processing for marketing or profiling purposes."],
              ["Withdraw Consent", "At any time, without affecting prior processing."],
            ].map(([label, desc]) => (
              <li key={label} className="flex gap-2 text-sm">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                <span>
                  <strong>{label}</strong> &ndash; {desc}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            To exercise any right, contact:{" "}
            <a
              href="mailto:privacy@agentm.com"
              className="text-teal-500 hover:underline"
            >
              privacy@agentm.com
            </a>
            . We will respond within <strong className="text-foreground">30 days</strong> of
            your verified request.
          </p>
        </Section>

        {/* 8. Data Security */}
        <Section title="8. Data Security">
          <p>We implement industry-standard security measures including:</p>
          <ul className="mt-3 space-y-2">
            {[
              "End-to-end encryption (HTTPS/TLS) for all data in transit.",
              "AES-256 encryption for data at rest.",
              "Role-based access control (RBAC) — only authorized personnel can access user data.",
              "Automatic PII detection and redaction in conversation logs.",
              "Regular security audits and vulnerability assessments.",
            ].map((item) => (
              <li key={item} className="flex gap-2 text-sm">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            In the event of a data breach that affects your rights, we will notify you
            within <strong className="text-foreground">72 hours</strong> as required by
            applicable law.
          </p>
        </Section>

        {/* 9. Cookies & Tracking */}
        <Section title="9. Cookies & Tracking">
          <p>
            Agent M&apos;s platform may use cookies and similar technologies for:
          </p>
          <ul className="mt-3 space-y-2">
            {[
              ["Session management", "Keeping you logged in securely."],
              ["Analytics", "Understanding how users interact with the app."],
              ["Preferences", "Remembering your settings."],
            ].map(([label, desc]) => (
              <li key={label} className="flex gap-2 text-sm">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                <span>
                  <strong>{label}</strong> &ndash; {desc}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            You may manage cookie preferences in your browser settings or via our
            in-app Cookie Preferences panel.
          </p>
        </Section>

        {/* 10. Children's Privacy */}
        <Section title="10. Children's Privacy">
          <p>
            Agent M is not intended for users under the age of{" "}
            <strong>18</strong>. We do not knowingly collect data from minors. If we
            discover such data has been collected, it will be deleted immediately.
          </p>
        </Section>

        {/* 11. Changes to This Policy */}
        <Section title="11. Changes to This Policy">
          <p>
            We may update this Privacy Policy periodically to reflect changes in law or
            our services. We will notify you of material changes via email or an in-app
            notification at least <strong>14 days</strong> before the change takes
            effect. Continued use of Agent M after that date constitutes acceptance of
            the updated policy.
          </p>
        </Section>

        <Separator />
        <p className="text-xs text-muted-foreground pb-8">
          &copy; {new Date().getFullYear()} Agent M. All rights reserved. Built in
          collaboration with UBS &amp; SMU-IS.
        </p>
      </main>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-2"
    >
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <Separator />
      <div className="pt-2 text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </motion.section>
  )
}
