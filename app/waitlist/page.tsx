"use client"

import LoaderSpinner from "@/components/loader-spinner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

type Step = "email" | "code" | "success"

export default function WaitlistPage() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_API_URL ?? "http://localhost:8000/api/v1"

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch(`${baseUrl}/waitlist/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to send code")
      }

      setStep("code")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch(`${baseUrl}/waitlist/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Invalid code")
      }

      setStep("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setError("")
    setCode("")
    setIsLoading(true)

    try {
      const res = await fetch(`${baseUrl}/waitlist/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to resend")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="my-8 flex items-center justify-center gap-2">
          <span className="font-geist font-thin text-2xl text-foreground">
            Agent M
          </span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-8 text-center">
                  <h1 className="mb-2 text-2xl font-semibold text-foreground">
                    Join the waitlist
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Be among the first to experience AI-powered autonomous trading
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl border-border bg-background py-5 focus:border-primary"
                      required
                    />
                  </div>

                  {error && (
                    <p className="text-center text-sm text-red-500">{error}</p>
                  )}

                  <Button
                    type="submit"
                    className="flex w-full items-center justify-center rounded-xl bg-secondary py-5 font-medium text-secondary-foreground hover:bg-secondary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? <LoaderSpinner /> : "Request access"}
                  </Button>
                </form>
              </motion.div>
            )}

            {step === "code" && (
              <motion.div
                key="code"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  onClick={() => {
                    setStep("email")
                    setCode("")
                    setError("")
                  }}
                  className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>

                <div className="mb-8 text-center">
                  <h1 className="mb-2 text-2xl font-semibold text-foreground">
                    Check your inbox
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    We sent a 4-digit code to{" "}
                    <span className="text-foreground font-medium">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleCodeSubmit} className="space-y-6">
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={4}
                      value={code}
                      onChange={(val) => setCode(val)}
                    >
                      <InputOTPGroup className="gap-3">
                        <InputOTPSlot
                          index={0}
                          className="h-14 w-14 rounded-xl border-border bg-background text-xl"
                        />
                        <InputOTPSlot
                          index={1}
                          className="h-14 w-14 rounded-xl border-border bg-background text-xl"
                        />
                        <InputOTPSlot
                          index={2}
                          className="h-14 w-14 rounded-xl border-border bg-background text-xl"
                        />
                        <InputOTPSlot
                          index={3}
                          className="h-14 w-14 rounded-xl border-border bg-background text-xl"
                        />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {error && (
                    <p className="text-center text-sm text-red-500">{error}</p>
                  )}

                  <Button
                    type="submit"
                    className="flex w-full items-center justify-center rounded-xl bg-secondary py-5 font-medium text-secondary-foreground hover:bg-secondary/90"
                    disabled={isLoading || code.length < 4}
                  >
                    {isLoading ? <LoaderSpinner /> : "Verify code"}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Didn&apos;t receive it?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </p>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="py-4 text-center"
              >
                <div className="mb-6 flex justify-center">
                  <CheckCircle2 className="h-14 w-14 text-green-500" strokeWidth={1.5} />
                </div>
                <h1 className="mb-3 text-2xl font-semibold text-foreground">
                  You&apos;re on the list.
                </h1>
                <p className="mb-8 text-sm text-muted-foreground">
                  We&apos;ll notify you at{" "}
                  <span className="text-foreground font-medium">{email}</span>{" "}
                  when your access is ready.
                </p>
                <Link
                  href="/"
                  className="text-xs font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to home
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Developer access link */}
        {step !== "success" && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Developer?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Access the platform
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
