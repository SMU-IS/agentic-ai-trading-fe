"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { LogIn, Menu } from "lucide-react"
import Link from "next/link"

export function Header() {
  const navItems = [
    { name: "Features", href: "#features-section" },
    { name: "FAQ", href: "#faq-section" },
  ]

  const handleScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault()
    const targetId = href.substring(1)
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <header className="w-full px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span
              className={`text-xl font-semibold text-foreground font-geist font-thin`}
            >
              Agent M
            </span>
          </div>
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleScroll(e, item.href)}
                className="rounded-full px-4 py-2 font-medium text-[#888888] transition-colors hover:text-foreground"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden md:block">
            <Button className="relative rounded-full border bg-gradient-to-r from-primary to-cyan-200/20 px-5 py-3 font-semibold text-white shadow-[0_8px_32px_0_rgba(20,184,166,0.4)] backdrop-blur-lg transition-all duration-300 before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-teal-500/0 before:via-white/20 before:to-teal-500/0 before:opacity-0 before:transition-opacity before:duration-500 hover:from-teal-500/30 hover:to-cyan-900/10 hover:shadow-[0_8px_32px_0_rgba(20,184,166,0.6)] hover:text-background hover:before:opacity-100 dark:from-primary/20 dark:to-cyan-200/20 from-teal-600/60 to-cyan-700/50">
              Login
            </Button>
          </Link>
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="h-7 w-7" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="border-t border-border bg-background text-foreground"
            >
              <SheetHeader>
                <SheetTitle className="text-left text-xl font-semibold text-foreground">
                  Navigation
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleScroll(e, item.href)}
                    className="justify-start py-2 text-lg text-[#888888] hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                ))}
                <Link href="/login" className="mt-4 w-full">
                  <Button className="rounded-full bg-secondary px-6 py-2 font-medium text-secondary-foreground shadow-sm hover:bg-secondary/90">
                    Login
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
