"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"

export interface User {
  id: string
  username: string
  email?: string
  provider: "credentials" | "twitter"
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signUp: (username: string, password: string) => Promise<void>
  signIn: (username: string, password: string) => Promise<void>
  signInWithTwitter: () => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount (mock implementation)
  useEffect(() => {
    const storedUser = sessionStorage.getItem("pointer_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const signUp = async (username: string, password: string) => {
    // Mock signup - in production, this would call an API
    if (username.length < 3) {
      throw new Error("Username must be at least 3 characters")
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters")
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      provider: "credentials",
    }

    sessionStorage.setItem("pointer_user", JSON.stringify(newUser))
    setUser(newUser)
  }

  const signIn = async (username: string, password: string) => {
    // Mock signin - in production, this would verify credentials
    if (!username || !password) {
      throw new Error("Please enter username and password")
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      provider: "credentials",
    }

    sessionStorage.setItem("pointer_user", JSON.stringify(newUser))
    setUser(newUser)
  }

  const signInWithTwitter = async () => {
    // Mock Twitter OAuth - in production, this would redirect to Twitter
    const mockTwitterUser: User = {
      id: crypto.randomUUID(),
      username: "twitter_user",
      provider: "twitter",
    }

    sessionStorage.setItem("pointer_user", JSON.stringify(mockTwitterUser))
    setUser(mockTwitterUser)
  }

  const signOut = () => {
    sessionStorage.removeItem("pointer_user")
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, signUp, signIn, signInWithTwitter, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
