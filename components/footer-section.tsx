"use client"

import { Twitter, Github, Linkedin } from "lucide-react"

export function FooterSection() {
  return (
    <footer className="mx-auto flex w-full max-w-[1320px] flex-col items-start justify-between gap-8 px-5 py-10 md:flex-row md:gap-0 md:py-[70px]">
      {/* Left Section: Logo, Description, Social Links */}
      <div className="flex flex-col items-start justify-start gap-8 p-4 md:p-8">
        <div className="flex items-stretch justify-center gap-3">
          <div className="font-geist font-thin text-center text-xl font-semibold leading-4 text-foreground">
            Agent M
          </div>
        </div>
        <p className="text-left text-sm font-medium leading-[18px] text-foreground/90">
          Trading made effortless
        </p>
        <div className="flex items-start justify-start gap-3">
          <a
            href="https://github.com/SMU-IS/agentic-ai-trading-be"
            aria-label="GitHub"
            className="flex h-4 w-4 items-center justify-center"
          >
            <Github className="h-full w-full text-muted-foreground" />
          </a>
        </div>
      </div>
      {/* Right Section: Product, Company, Resources */}
      <div className="grid w-full grid-cols-2 gap-8 p-4 md:w-auto md:grid-cols-3 md:gap-12 md:p-8">
        <div className="flex flex-col items-start justify-start gap-3">
          <h3 className="text-sm font-medium leading-5 text-muted-foreground">
            Product
          </h3>
          <div className="flex flex-col items-start justify-end gap-2">
            <a
              href="#"
              className="text-sm font-normal leading-5 text-foreground hover:underline"
            >
              Features
            </a>
          </div>
        </div>
        <div className="flex flex-col items-start justify-start gap-3">
          <h3 className="text-sm font-medium leading-5 text-muted-foreground">
            Company
          </h3>
          <div className="flex flex-col items-start justify-center gap-2">
            <a
              href="#"
              className="text-sm font-normal leading-5 text-foreground hover:underline"
            >
              About us
            </a>
            <a
              href="#"
              className="text-sm font-normal leading-5 text-foreground hover:underline"
            >
              Our team
            </a>
            <a
              href="#"
              className="text-sm font-normal leading-5 text-foreground hover:underline"
            >
              Contact
            </a>
          </div>
        </div>
        <div className="flex flex-col items-start justify-start gap-3">
          <div className="flex flex-col items-start justify-center gap-2">
            <a
              href="#"
              className="text-sm font-normal leading-5 text-foreground hover:underline"
            >
              Documentation
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
