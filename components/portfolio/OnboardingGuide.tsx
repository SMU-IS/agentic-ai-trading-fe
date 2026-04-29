"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  XCircle,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

type Step = 1 | 2 | 3 | 4

interface OnboardingGuideProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function OnboardingGuide({
  open,
  onOpenChange,
}: OnboardingGuideProps) {
  const { markOnboardingComplete } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [apiKey, setApiKey] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [isPaper, setIsPaper] = useState(true)
  const [showSecret, setShowSecret] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState("")
  const [keyError, setKeyError] = useState("")

  function resetState() {
    setStep(1)
    setApiKey("")
    setSecretKey("")
    setIsPaper(true)
    setShowSecret(false)
    setVerifying(false)
    setVerifyError("")
    setKeyError("")
  }

  function handleClose() {
    onOpenChange(false)
    setTimeout(resetState, 300)
  }

  function validateKeys(): boolean {
    const expectedPrefix = isPaper ? "PK" : "AK"
    if (
      !apiKey.toUpperCase().startsWith(expectedPrefix) ||
      apiKey.length < 10
    ) {
      setKeyError(
        `API Key must start with "${expectedPrefix}" for ${isPaper ? "paper" : "live"} trading`,
      )
      return false
    }
    if (secretKey.length < 10) {
      setKeyError("Secret Key appears too short — please check and try again.")
      return false
    }
    setKeyError("")
    return true
  }

  async function handleVerify() {
    if (!validateKeys()) return
    setStep(3)
    setVerifying(true)
    setVerifyError("")

    try {
      // TODO: replace with POST /api/user/alpaca-keys + real validation
      await new Promise((r) => setTimeout(r, 1500))
      const success = apiKey.length >= 10

      if (success) {
        // TODO: PATCH /api/user/onboarding
        markOnboardingComplete()
        setVerifying(false)
        setStep(4)
      } else {
        setVerifying(false)
        setVerifyError(
          "Invalid credentials. Check your API key and secret and try again.",
        )
      }
    } catch {
      setVerifying(false)
      setVerifyError("Connection failed. Please try again.")
    }
  }

  const titles: Record<Step, string> = {
    1: "Welcome to Agent M",
    2: "Connect Alpaca",
    3: "Verifying Connection",
    4: "You're all set!",
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-teal-400" />
            {titles[step]}
          </DialogTitle>
        </DialogHeader>

        <StepIndicator current={step} />

        {step === 1 && (
          <StepWelcome onNext={() => setStep(2)} onSkip={handleClose} />
        )}
        {step === 2 && (
          <StepConnect
            apiKey={apiKey}
            secretKey={secretKey}
            isPaper={isPaper}
            showSecret={showSecret}
            keyError={keyError}
            onApiKeyChange={(v) => {
              setApiKey(v)
              setKeyError("")
            }}
            onSecretKeyChange={(v) => {
              setSecretKey(v)
              setKeyError("")
            }}
            onPaperChange={(v) => {
              setIsPaper(v)
              setKeyError("")
            }}
            onShowSecretChange={setShowSecret}
            onBack={() => setStep(1)}
            onNext={handleVerify}
          />
        )}
        {step === 3 && (
          <StepVerify
            verifying={verifying}
            error={verifyError}
            onRetry={() => {
              setStep(2)
              setVerifyError("")
            }}
          />
        )}
        {step === 4 && <StepDone onFinish={handleClose} />}
      </DialogContent>
    </Dialog>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-1.5 mb-1">
      {([1, 2, 3, 4] as Step[]).map((s) => (
        <div
          key={s}
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
            s <= current ? "bg-teal-500" : "bg-muted"
          }`}
        />
      ))}
    </div>
  )
}

function StepWelcome({
  onNext,
  onSkip,
}: {
  onNext: () => void
  onSkip: () => void
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Agent M</span> is your
          AI-powered trading manager, built to run completely autonomously.
          Here&apos;s what you can do:
        </p>
        <ul className="space-y-1.5 list-none">
          {[
            "View your live portfolio, holdings, and performance charts",
            "Let the AI agent execute trades automatically on your behalf",
            "Monitor agent decisions in real-time via AgentFlow",
            "Review full trade history with reasoning and risk evaluations",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-400 mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p>
          To get started, you&apos;ll need to connect your Alpaca brokerage
          account.
        </p>
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={onSkip}>
          Skip for now
        </Button>
        <Button size="sm" onClick={onNext} className="gap-1.5">
          Get started
        </Button>
      </div>
    </div>
  )
}

function StepConnect({
  apiKey,
  secretKey,
  isPaper,
  showSecret,
  keyError,
  onApiKeyChange,
  onSecretKeyChange,
  onPaperChange,
  onShowSecretChange,
  onBack,
  onNext,
}: {
  apiKey: string
  secretKey: string
  isPaper: boolean
  showSecret: boolean
  keyError: string
  onApiKeyChange: (v: string) => void
  onSecretKeyChange: (v: string) => void
  onPaperChange: (v: boolean) => void
  onShowSecretChange: (v: boolean) => void
  onBack: () => void
  onNext: () => void
}) {
  const [agreed, setAgreed] = useState(false)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        <p>
          Agent M uses your Alpaca API keys to place orders on your behalf. Keys
          are stored locally in your session and never sent to our servers.
        </p>
        <a
          href="https://alpaca.markets"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-teal-500 hover:underline mt-2"
        >
          Get your API keys at alpaca.markets
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Authorization terms */}
      <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
        <div className="h-24 overflow-y-auto px-3 pt-3 pb-2 text-xs text-muted-foreground leading-relaxed scrollbar-thin">
          <p className="font-medium text-foreground mb-1">Authorize Agent M</p>
          <p>
            {/* By connecting your Alpaca account, you grant Agent M access to your
            account information and authorize it to place transactions on your
            behalf at your direction. You acknowledge that all trades are
            executed automatically by the AI agent based on market signals and
            configured risk parameters.  */}
            Authorize Agent M By allowing Agent M to access your Alpaca account,
            you are granting Agent M access to your account information and
            authorization to place transactions in your account at your
            direction. Alpaca does not warrant or guarantee that Agent M will
            work as advertised or expected. Before authorizing, learn more about
            Agent M.
          </p>
          <p className="mt-2">
            Agent M is an independent application and is not affiliated with,
            endorsed by, or warranted by Alpaca Securities LLC. Alpaca does not
            guarantee that Agent M will perform as advertised. You are solely
            responsible for all trading activity in your account. Past
            performance does not guarantee future results. Trading involves
            risk, including the possible loss of principal.
          </p>
          <p className="mt-2">
            You may revoke access at any time by disconnecting your API keys
            from the Settings page.
          </p>
        </div>
        <div className="border-t border-border px-3 py-2.5 bg-background/50">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-teal-500 cursor-pointer"
            />
            <span className="text-xs text-muted-foreground">
              I have read and agree to authorize Agent M to access my Alpaca
              account and place trades on my behalf.
            </span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Paper trading mode</Label>
          <p className="text-xs text-muted-foreground">
            Use Alpaca&apos;s paper environment (recommended for testing)
          </p>
        </div>
        <Switch checked={isPaper} onCheckedChange={onPaperChange} />
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="ob-apiKey">API Key ID</Label>
          <Input
            id="ob-apiKey"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder={isPaper ? "PK…" : "AK…"}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ob-secretKey">Secret Key</Label>
          <div className="relative">
            <Input
              id="ob-secretKey"
              type={showSecret ? "text" : "password"}
              value={secretKey}
              onChange={(e) => onSecretKeyChange(e.target.value)}
              placeholder="••••••••••••••••••••"
              autoComplete="off"
              className="pr-9"
            />
            <button
              type="button"
              onClick={() => onShowSecretChange(!showSecret)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showSecret ? "Hide secret key" : "Show secret key"}
            >
              {showSecret ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {keyError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="h-4 w-4 shrink-0" />
          {keyError}
        </div>
      )}

      <div className="flex justify-between pt-1">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
        <Button
          size="sm"
          onClick={onNext}
          disabled={!apiKey || !secretKey || !agreed}
          className="gap-1.5"
        >
          Connect &amp; verify
        </Button>
      </div>
    </div>
  )
}

function StepVerify({
  verifying,
  error,
  onRetry,
}: {
  verifying: boolean
  error: string
  onRetry: () => void
}) {
  return (
    <div className="space-y-5 py-4">
      {verifying ? (
        <div className="flex flex-col items-center gap-3 text-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
          <p className="text-sm text-muted-foreground">
            Verifying your Alpaca credentials…
          </p>
        </div>
      ) : error ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 text-center py-4">
            <XCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
          <div className="flex justify-center">
            <Button size="sm" variant="outline" onClick={onRetry}>
              Try again
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function StepDone({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="space-y-5 py-2">
      <div className="flex flex-col items-center gap-3 text-center py-4">
        <div className="rounded-full bg-teal-500/20 p-3">
          <CheckCircle2 className="h-8 w-8 text-teal-400" />
        </div>
        <div>
          <p className="font-medium text-foreground">Alpaca connected!</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your account is set up and ready to trade. Head to the Portfolio tab
            to view your holdings.
          </p>
        </div>
      </div>
      <div className="flex justify-center">
        <Button size="sm" onClick={onFinish}>
          Go to dashboard
        </Button>
      </div>
    </div>
  )
}
