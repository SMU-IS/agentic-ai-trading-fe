"use client"

import { ModeToggle } from "@/components/mode-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/lib/auth-context"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Eye,
  EyeOff,
  ExternalLink,
  KeyRound,
  Link2,
  Loader2,
  LogOut,
  Shield,
  Trash2,
  User,
  XCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type AlpacaStatus = "disconnected" | "connecting" | "connected" | "error"

export default function UserSettingsPage() {
  const { user, isLoading, signOut } = useAuth()
  const router = useRouter()

  // Profile state
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [profileSaved, setProfileSaved] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSaved, setPasswordSaved] = useState(false)

  // Alpaca state
  const [alpacaApiKey, setAlpacaApiKey] = useState("")
  const [alpacaSecretKey, setAlpacaSecretKey] = useState("")
  const [alpacaPaper, setAlpacaPaper] = useState(true)
  const [showAlpacaSecret, setShowAlpacaSecret] = useState(false)
  const [alpacaStatus, setAlpacaStatus] = useState<AlpacaStatus>("disconnected")
  const [alpacaAccount, setAlpacaAccount] = useState<{
    account_number: string
    buying_power: string
    portfolio_value: string
  } | null>(null)

  // Notification prefs
  const [notifTrades, setNotifTrades] = useState(true)
  const [notifAlerts, setNotifAlerts] = useState(true)
  const [notifUpdates, setNotifUpdates] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
    if (user) {
      setDisplayName(user.username ?? "")
      setEmail(user.email ?? "")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!user) return null

  const initials = (user.username ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  function handleSaveProfile() {
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
  }

  function handleChangePassword() {
    setPasswordError("")
    if (!currentPassword) {
      setPasswordError("Current password is required.")
      return
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.")
      return
    }
    setPasswordSaved(true)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setTimeout(() => setPasswordSaved(false), 2500)
  }

  async function handleConnectAlpaca() {
    if (!alpacaApiKey || !alpacaSecretKey) return
    setAlpacaStatus("connecting")
    // Simulate API verification — replace with real endpoint call
    await new Promise((r) => setTimeout(r, 1500))
    const success = alpacaApiKey.length > 4
    if (success) {
      setAlpacaStatus("connected")
      setAlpacaAccount({
        account_number: "PA" + Math.random().toString(36).slice(2, 10).toUpperCase(),
        buying_power: "$24,850.00",
        portfolio_value: "$31,200.00",
      })
    } else {
      setAlpacaStatus("error")
    }
  }

  function handleDisconnectAlpaca() {
    setAlpacaStatus("disconnected")
    setAlpacaApiKey("")
    setAlpacaSecretKey("")
    setAlpacaAccount(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/portfolio")}
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
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await signOut().catch(() => {})
                router.push("/")
              }}
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account, integrations, and preferences.
          </p>
        </div>

        {/* ── Profile ── */}
        <Section id="profile" icon={<User className="h-4 w-4" />} title="Profile">
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 text-lg">
                <AvatarFallback className="bg-teal-500/20 text-teal-400 font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <Badge variant="outline" className="mt-1 text-xs capitalize">
                  {user.provider ?? "credentials"}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button size="sm" onClick={handleSaveProfile}>
                Save changes
              </Button>
              {profileSaved && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-sm text-teal-500"
                >
                  <CheckCircle2 className="h-4 w-4" /> Saved
                </motion.span>
              )}
            </div>
          </CardContent>
        </Section>

        {/* ── Password ── */}
        <Section
          id="security"
          icon={<Shield className="h-4 w-4" />}
          title="Security"
          description="Update your password to keep your account secure."
        >
          <CardContent className="space-y-4">
            {user.provider === "twitter" ? (
              <p className="text-sm text-muted-foreground">
                You signed in with Twitter / X. Password management is handled by your
                OAuth provider.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="currentPw">Current password</Label>
                  <div className="relative">
                    <Input
                      id="currentPw"
                      type={showCurrentPw ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="newPw">New password</Label>
                    <div className="relative">
                      <Input
                        id="newPw"
                        type={showNewPw ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPw ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPw">Confirm new password</Label>
                    <Input
                      id="confirmPw"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                    />
                  </div>
                </div>

                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}

                <div className="flex items-center gap-3">
                  <Button size="sm" onClick={handleChangePassword}>
                    Update password
                  </Button>
                  {passwordSaved && (
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1 text-sm text-teal-500"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Password updated
                    </motion.span>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Section>

        {/* ── Alpaca Integration ── */}
        <Section
          id="alpaca"
          icon={<KeyRound className="h-4 w-4" />}
          title="Alpaca Brokerage"
          description="Connect your Alpaca account to enable live or paper trading."
          badge={
            alpacaStatus === "connected" ? (
              <Badge className="bg-teal-500/15 text-teal-400 border-teal-500/30 hover:bg-teal-500/20">
                Connected
              </Badge>
            ) : alpacaStatus === "error" ? (
              <Badge variant="destructive" className="opacity-80">
                Auth failed
              </Badge>
            ) : null
          }
        >
          <CardContent className="space-y-5">
            {alpacaStatus === "connected" && alpacaAccount ? (
              <AlpacaConnectedView
                account={alpacaAccount}
                paper={alpacaPaper}
                onDisconnect={handleDisconnectAlpaca}
              />
            ) : (
              <>
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
                  <p>
                    Agent M uses your Alpaca API keys to place orders on your behalf.
                    Keys are stored locally in your session and never sent to our
                    servers.
                  </p>
                  <a
                    href="https://alpaca.markets"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-teal-500 hover:underline mt-1"
                  >
                    Get your API keys at alpaca.markets{" "}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="paperToggle" className="text-sm font-medium">
                      Paper trading mode
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Use Alpaca&apos;s paper environment (recommended for testing)
                    </p>
                  </div>
                  <Switch
                    id="paperToggle"
                    checked={alpacaPaper}
                    onCheckedChange={setAlpacaPaper}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="alpacaKey">API Key ID</Label>
                    <Input
                      id="alpacaKey"
                      value={alpacaApiKey}
                      onChange={(e) => setAlpacaApiKey(e.target.value)}
                      placeholder={alpacaPaper ? "PK…" : "AK…"}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="alpacaSecret">Secret Key</Label>
                    <div className="relative">
                      <Input
                        id="alpacaSecret"
                        type={showAlpacaSecret ? "text" : "password"}
                        value={alpacaSecretKey}
                        onChange={(e) => setAlpacaSecretKey(e.target.value)}
                        placeholder="••••••••••••••••••••"
                        autoComplete="off"
                        className="pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAlpacaSecret((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showAlpacaSecret ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {alpacaStatus === "error" && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <XCircle className="h-4 w-4 shrink-0" />
                    Invalid credentials. Check your API key and secret and try again.
                  </div>
                )}

                <Button
                  size="sm"
                  onClick={handleConnectAlpaca}
                  disabled={
                    !alpacaApiKey ||
                    !alpacaSecretKey ||
                    alpacaStatus === "connecting"
                  }
                  className="gap-1.5"
                >
                  {alpacaStatus === "connecting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4" /> Connect Alpaca
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Section>

        {/* ── Notifications ── */}
        <Section
          id="notifications"
          icon={<Bell className="h-4 w-4" />}
          title="Notifications"
          description="Choose which events you'd like to be notified about."
        >
          <CardContent className="space-y-4">
            <NotifRow
              label="Trade executions"
              description="When Agent M opens or closes a position"
              checked={notifTrades}
              onCheckedChange={setNotifTrades}
            />
            <Separator />
            <NotifRow
              label="Price alerts"
              description="When a watched stock hits a target price"
              checked={notifAlerts}
              onCheckedChange={setNotifAlerts}
            />
            <Separator />
            <NotifRow
              label="System updates"
              description="Maintenance windows and new feature releases"
              checked={notifUpdates}
              onCheckedChange={setNotifUpdates}
            />
          </CardContent>
        </Section>

        {/* ── Danger Zone ── */}
        <Section
          id="danger"
          icon={<Trash2 className="h-4 w-4 text-destructive" />}
          title="Danger Zone"
          description="Irreversible account actions."
          destructive
        >
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div>
                <p className="text-sm font-medium">Delete account</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently remove your account and all associated data. This cannot
                  be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="shrink-0"
                onClick={() =>
                  alert(
                    "Account deletion is not yet implemented. Please contact support.",
                  )
                }
              >
                Delete account
              </Button>
            </div>
          </CardContent>
        </Section>
      </main>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Section({
  id,
  icon,
  title,
  description,
  badge,
  children,
  destructive,
}: {
  id: string
  icon: React.ReactNode
  title: string
  description?: string
  badge?: React.ReactNode
  children: React.ReactNode
  destructive?: boolean
}) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={
          destructive ? "border-destructive/30" : "border-border"
        }
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              {icon}
              {title}
            </CardTitle>
            {badge}
          </div>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </CardHeader>
        <Separator />
        {children}
      </Card>
    </motion.div>
  )
}

function NotifRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function AlpacaConnectedView({
  account,
  paper,
  onDisconnect,
}: {
  account: { account_number: string; buying_power: string; portfolio_value: string }
  paper: boolean
  onDisconnect: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-teal-500">
        <CheckCircle2 className="h-4 w-4" />
        Successfully connected to Alpaca{" "}
        {paper ? "Paper" : "Live"} trading
      </div>

      <div className="grid gap-3 sm:grid-cols-3 rounded-lg border border-border bg-muted/30 p-4">
        <StatItem label="Account" value={account.account_number} />
        <StatItem label="Buying power" value={account.buying_power} />
        <StatItem label="Portfolio value" value={account.portfolio_value} />
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onDisconnect}
        className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive gap-1.5"
      >
        <XCircle className="h-4 w-4" />
        Disconnect
      </Button>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  )
}
