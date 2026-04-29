"use client"

import LoaderSpinner from "@/components/loader-spinner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

type Step = "email" | "success"

export default function WaitlistPage() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_API_URL ?? "http://localhost:8000/api/v1"

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch(`${baseUrl}/trading/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to join waitlist")
      }

      setStep("success")
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
                    Be among the first to experience AI-powered autonomous
                    trading
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

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="py-4 text-center"
              >
                <div className="mb-6 flex justify-center">
                  <CheckCircle2
                    className="h-14 w-14 text-green-500"
                    strokeWidth={1.5}
                  />
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
