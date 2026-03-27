"use client"

import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react"
import * as React from "react"

const bannerVariants = cva(
  "relative w-full px-4 py-3 flex items-center justify-between text-sm transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground border-b border-border",
        info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-b border-blue-500/20",
        warning:
          "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-b border-yellow-500/20",
        error:
          "bg-destructive/10 text-destructive border-b border-destructive/20",
        success:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-b border-emerald-500/20",
      },
      sticky: {
        true: "sticky top-0 z-50",
        false: "relative",
      },
    },
    defaultVariants: {
      variant: "default",
      sticky: false,
    },
  },
)

interface BannerProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bannerVariants> {
  icon?: React.ReactNode
  onClose?: () => void
  dismissible?: boolean
  action?: React.ReactNode
}

const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  (
    {
      className,
      variant,
      sticky,
      icon,
      children,
      onClose,
      dismissible = true,
      action,
      ...props
    },
    ref,
  ) => {
    const [isVisible, setIsVisible] = React.useState(true)

    if (!isVisible) return null

    const handleClose = () => {
      setIsVisible(false)
      onClose?.()
    }

    const defaultIcon = () => {
      switch (variant) {
        case "info":
          return <Info className="h-4 w-4" />
        case "warning":
          return <AlertTriangle className="h-4 w-4" />
        case "error":
          return <AlertCircle className="h-4 w-4" />
        case "success":
          return <CheckCircle2 className="h-4 w-4" />
        default:
          return null
      }
    }

    return (
      <div
        ref={ref}
        className={cn(bannerVariants({ variant, sticky }), className)}
        {...props}
      >
        <div className="flex items-center justify-start gap-3 w-full pr-12">
          {icon || defaultIcon()}
          <div className="font-medium text-left">{children}</div>
          {action && (
            <div className="hidden sm:block ml-auto mr-4">{action}</div>
          )}
        </div>
        {dismissible && (
          <button
            onClick={handleClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-foreground/10 transition-colors"
            aria-label="Close banner"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  },
)
Banner.displayName = "Banner"

export { Banner }
