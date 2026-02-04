"use client"

import type React from "react"

import LoaderSpinner from "@/components/loader-spinner"
import LoadingTransition from "./LoadingTransition"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [fullname, setFullname] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showLoadingTransition, setShowLoadingTransition] = useState(false)

  const { signIn, signInWithTwitter } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_API_URL ?? "http://localhost:8000/api/v1"

      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match")
        }

        const registerRes = await fetch(`${baseUrl}/user/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            full_name: fullname,
            password: password,
          }),
        })

        if (!registerRes.ok) {
          const errorText = await registerRes.text()
          throw new Error(errorText || "Failed to register")
        }

        await signIn(email, password)
      } else {
        const loginRes = await fetch(`${baseUrl}/user/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        })

        if (!loginRes.ok) {
          const errorBody = await loginRes.text()
          let errorMessage = `Login failed (${loginRes.status})`

          try {
            const errorJson = JSON.parse(errorBody)

            if (errorJson.detail) {
              if (Array.isArray(errorJson.detail)) {
                errorMessage = errorJson.detail[0].msg
              } else {
                errorMessage = errorJson.detail
              }
            } else if (errorJson.message) {
              errorMessage = errorJson.message
            } else if (errorJson.error) {
              errorMessage = errorJson.error
            } else if (typeof errorJson === "string") {
              errorMessage = errorJson
            }
          } catch {
            if (errorBody && errorBody.length < 100) {
              errorMessage = errorBody
            }
          }

          throw new Error(errorMessage)
        }

        const loginData = await loginRes.json()
        const accessToken =
          loginData.access_token ?? loginData.token ?? loginData.jwt

        if (accessToken) {
          localStorage.setItem("access_token", accessToken)
        }
        await signIn(email, password)
      }

      // Show loading transition before navigating
      setIsLoading(false)
      setShowLoadingTransition(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsLoading(false)
    }
  }

  const handleTwitterSignIn = async () => {
    setError("")
    setIsLoading(true)
    try {
      await signInWithTwitter()
      setIsLoading(false)
      setShowLoadingTransition(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsLoading(false)
    }
  }

  const handleLoadingComplete = () => {
    router.push("/portfolio")
  }

  return (
    <>
      <LoadingTransition
        isLoading={showLoadingTransition}
        onComplete={handleLoadingComplete}
      />

      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        {/* Background gradient effect */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/4 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Logo */}
          <Link
            href="/"
            className="my-8 flex items-center justify-center gap-2"
          >
            <span className="text-2xl font-semibold text-foreground">
              Agent M
            </span>
          </Link>

          {/* Auth Card */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-2xl font-semibold text-foreground">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isSignUp
                  ? "Start managing your portfolio with AI-powered insights"
                  : "Sign in to access your portfolio"}
              </p>
            </div>

            {/* Twitter Sign In */}
            <Button
              type="button"
              variant="outline"
              className="mb-6 w-full rounded-xl border-border bg-background py-5 hover:bg-muted"
              onClick={handleTwitterSignIn}
              disabled={isLoading}
            >
              <svg
                className="mr-2 h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Continue with X
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-border bg-background py-5 focus:border-primary"
                  required
                />
              </div>
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullname" className="text-foreground">
                    Full Name
                  </Label>
                  <Input
                    id="fullname"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="rounded-xl border-border bg-background py-5 focus:border-primary"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl border-border bg-background py-5 pr-10 focus:border-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-xl border-border bg-background py-5 focus:border-primary"
                    required
                  />
                </div>
              )}
              {error && (
                <p className="text-center text-sm text-red-500">{error}</p>
              )}
              <Button
                type="submit"
                className="flex w-full items-center justify-center rounded-xl bg-secondary py-5 font-medium text-secondary-foreground hover:bg-secondary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoaderSpinner />
                  </>
                ) : isSignUp ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError("")
                }}
                className="font-medium text-primary hover:underline"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
