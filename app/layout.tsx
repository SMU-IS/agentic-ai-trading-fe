import ScrollToTop from "@/components/scroll-to-top"
import { ThemeProvider } from "@/components/theme-provider"
import { LINKS } from "@/components/utils/utils"
import { AuthProvider } from "@/lib/auth-context"
import { Analytics } from "@vercel/analytics/react"
import { GeistPixelGrid } from "geist/font/pixel"
import type { Metadata } from "next"
import type React from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Agent M",
  description: "Trading On Autopilot",
  openGraph: {
    title: "Trade On Autopilot",
    description: "Trading On Autopilot",
    url: LINKS.URL,
    siteName: "Agent M",
    images:
      "https://agent-m-fe-assets.s3.us-east-1.amazonaws.com/open-graph-banner.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${GeistPixelGrid.variable}`}
      suppressHydrationWarning
    >
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ScrollToTop />
            {children}
          </AuthProvider>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
