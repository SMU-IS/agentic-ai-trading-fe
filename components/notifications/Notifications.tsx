"use client"

import { useState } from "react"
import {
  Bell,
  Settings,
  X,
  CheckCheck,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type NotificationType = "filled" | "cancelled" | "partial_fill"

interface Notification {
  id: string
  type: NotificationType
  symbol: string
  side: "buy" | "sell"
  quantity: number
  price: number
  timestamp: Date
  isRead: boolean
  orderId: string
}

// Mock notifications data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "filled",
    symbol: "AAPL",
    side: "buy",
    quantity: 10,
    price: 182.45,
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    isRead: false,
    orderId: "abc123def456",
  },
  {
    id: "2",
    type: "filled",
    symbol: "TSLA",
    side: "sell",
    quantity: 5,
    price: 245.32,
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    isRead: false,
    orderId: "xyz789ghi012",
  },
  {
    id: "3",
    type: "cancelled",
    symbol: "NVDA",
    side: "buy",
    quantity: 8,
    price: 875.6,
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    isRead: true,
    orderId: "mno345pqr678",
  },
  {
    id: "4",
    type: "filled",
    symbol: "MSFT",
    side: "buy",
    quantity: 15,
    price: 425.8,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: true,
    orderId: "stu901vwx234",
  },
]

export default function NotificationsDropdown() {
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [activeTab, setActiveTab] = useState<"inbox" | "general">("inbox")

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    )
  }

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`

    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? "s" : ""} ago`
  }

  const getNotificationIcon = (notification: Notification) => {
    if (notification.type === "cancelled") {
      return <AlertCircle className="h-5 w-5 text-red-500" />
    }
    return notification.side === "buy" ? (
      <TrendingUp className="h-5 w-5 text-green-500" />
    ) : (
      <TrendingDown className="h-5 w-5 text-red-500" />
    )
  }

  const getNotificationTitle = (notification: Notification) => {
    if (notification.type === "cancelled") {
      return `Order cancelled: ${notification.symbol}`
    }
    return `Order filled: ${notification.side.toUpperCase()} ${notification.symbol}`
  }

  const getNotificationDescription = (notification: Notification) => {
    if (notification.type === "cancelled") {
      return `${notification.quantity} shares at $${notification.price.toFixed(2)}`
    }
    return `${notification.quantity} shares filled at $${notification.price.toFixed(2)}`
  }

  const getNotificationBgColor = (notification: Notification) => {
    if (notification.type === "cancelled") return "bg-red-50"
    return notification.side === "buy" ? "bg-green-50" : "bg-red-50"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[480px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-lg font-semibold">Notifications</h3>
          <button
            onClick={markAllAsRead}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Mark all as read
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b px-4">
          <button
            onClick={() => setActiveTab("inbox")}
            className={cn(
              "relative pb-3 pt-3 text-sm font-medium transition-colors",
              activeTab === "inbox"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Inbox
            {unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {unreadCount}
              </span>
            )}
            {activeTab === "inbox" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("general")}
            className={cn(
              "relative pb-3 pt-3 text-sm font-medium transition-colors",
              activeTab === "general"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            General
            {activeTab === "general" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>

          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Notifications List */}
        <div className="max-h-[500px] overflow-y-auto">
          {activeTab === "inbox" ? (
            notifications.length > 0 ? (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={cn(
                      "flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                      !notification.isRead && "bg-muted/30",
                    )}
                  >
                    {/* Avatar/Icon */}
                    <div
                      className={cn(
                        "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full",
                        getNotificationBgColor(notification),
                      )}
                    >
                      {getNotificationIcon(notification)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {getNotificationTitle(notification)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getTimeAgo(notification.timestamp)} •{" "}
                        {getNotificationDescription(notification)}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCheck className="mb-3 h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  All caught up!
                </p>
                <p className="text-xs text-muted-foreground">
                  No new notifications
                </p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                No general notifications
              </p>
              <p className="text-xs text-muted-foreground">Check back later</p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
