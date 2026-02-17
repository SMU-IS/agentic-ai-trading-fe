"use client"

import { useState, useEffect, useRef } from "react"
import {
  Bell,
  Settings,
  X,
  CheckCheck,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  DollarSign,
  Newspaper,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// WebSocket notification types from backend
type WSNotificationType = "NEWS_RECEIVED" | "SIGNAL_GENERATED"

const NOTIF_URL = `${process.env.NEXT_PUBLIC_NOTIF_API_URL}`

interface WSNewsNotification {
  type: "NEWS_RECEIVED"
  news_id: string
  headline: string
  tickers: Array<{
    symbol: string
    event_type: string
    sentiment_label: string
  }>
  event_description: string
}

interface WSSignalNotification {
  type: "SIGNAL_GENERATED"
  news_id: string
}

type WSNotification = WSNewsNotification | WSSignalNotification

// UI Notification types
interface BaseNotification {
  id: string
  timestamp: Date
  isRead: boolean
}

interface NewsNotification extends BaseNotification {
  type: "news"
  headline: string
  tickers: Array<{
    symbol: string
    event_type: string
    sentiment_label: string
  }>
  event_description: string
}

interface SignalNotification extends BaseNotification {
  type: "signal"
  news_id: string
}

type Notification = NewsNotification | SignalNotification

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState<"inbox" | "general">("inbox")
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const unreadCount = notifications.filter((n) => !n.isRead).length

  // WebSocket connection
  useEffect(() => {
    let isComponentMounted = true

    const connectWebSocket = () => {
      // Don't connect if component is unmounting
      if (!isComponentMounted) return

      try {
        const wsUrl = `${NOTIF_URL}/ws/notifications`
        console.log("Attempting to connect to:", wsUrl)

        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          if (!isComponentMounted) {
            ws.close()
            return
          }
          console.log("✅ Connected to notifications WebSocket")
          setIsConnected(true)
        }

        ws.onmessage = (event) => {
          if (!isComponentMounted) return

          console.log("📨 Received message:", event.data)
          try {
            const data: WSNotification = JSON.parse(event.data)

            let newNotification: Notification

            if (data.type === "NEWS_RECEIVED") {
              // Validate and normalize tickers
              const tickers = Array.isArray(data.tickers)
                ? data.tickers
                : data.tickers
                  ? [data.tickers] // Convert single object to array
                  : [] // Default to empty array

              console.log("✅ Parsed tickers:", tickers) // Debug log

              newNotification = {
                id: data.news_id,
                type: "news",
                headline: data.headline,
                tickers: tickers,
                event_description: data.event_description,
                timestamp: new Date(),
                isRead: false,
              }
            } else {
              newNotification = {
                id: `signal-${data.news_id}-${Date.now()}`,
                type: "signal",
                news_id: data.news_id,
                timestamp: new Date(),
                isRead: false,
              }
            }

            setNotifications((prev) => [newNotification, ...prev])

            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification("New Market Update", {
                body:
                  data.type === "NEWS_RECEIVED"
                    ? data.headline
                    : "Trading signal generated",
                icon: "/favicon.ico",
              })
            }
          } catch (err) {
            console.error(
              "❌ Failed to parse WebSocket message:",
              err,
              event.data,
            )
          }
        }

        ws.onerror = (error) => {
          // Only log error if it's not a connection close during unmount
          if (isComponentMounted) {
            console.error("❌ WebSocket error")
          }
        }

        ws.onclose = (event) => {
          if (!isComponentMounted) return

          console.log("🔌 WebSocket closed:", event.code)
          setIsConnected(false)

          // Only reconnect if:
          // 1. Component is still mounted
          // 2. Closure was not intentional (code 1000)
          // 3. Not a strict mode cleanup (code 1006 during development)
          if (event.code !== 1000 && isComponentMounted) {
            console.log("⏳ Attempting to reconnect in 5 seconds...")
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isComponentMounted) {
                connectWebSocket()
              }
            }, 5000)
          }
        }
      } catch (err) {
        console.error("❌ Failed to create WebSocket:", err)
      }
    }

    connectWebSocket()

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    return () => {
      isComponentMounted = false

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log("🛑 Closing WebSocket connection")
        wsRef.current.close(1000, "Component unmounted")
      }
    }
  }, [])

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

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "text-green-600 bg-green-50"
      case "negative":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType.toUpperCase()) {
      case "PRICE_ALERT":
        return "text-orange-600 bg-orange-50"
      case "VOLUME_SPIKE":
        return "text-blue-600 bg-blue-50"
      default:
        return "text-purple-600 bg-purple-50"
    }
  }

  const renderNewsNotification = (notification: NewsNotification) => (
    <div
      key={notification.id}
      onClick={() => markAsRead(notification.id)}
      className={cn(
        "flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
        !notification.isRead && "bg-muted/30",
      )}
    >
      {/* Icon */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-50">
        <Newspaper className="h-5 w-5 text-blue-500" />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        <p className="text-sm font-semibold text-foreground line-clamp-2">
          {notification.headline}
        </p>

        {/* Tickers - Add safety check */}
        {notification.tickers &&
          Array.isArray(notification.tickers) &&
          notification.tickers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {notification.tickers.map((ticker, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {ticker.symbol}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      getEventTypeColor(ticker.event_type),
                    )}
                  >
                    {ticker.event_type}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      getSentimentColor(ticker.sentiment_label),
                    )}
                  >
                    {ticker.sentiment_label}
                  </span>
                </div>
              ))}
            </div>
          )}

        {/* Event description */}
        {notification.event_description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.event_description}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          {getTimeAgo(notification.timestamp)}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="flex-shrink-0">
          <div className="h-2 w-2 rounded-full bg-primary" />
        </div>
      )}
    </div>
  )

  const renderSignalNotification = (notification: SignalNotification) => (
    <div
      key={notification.id}
      onClick={() => markAsRead(notification.id)}
      className={cn(
        "flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
        !notification.isRead && "bg-muted/30",
      )}
    >
      {/* Icon */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-50">
        <TrendingUp className="h-5 w-5 text-purple-500" />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold text-foreground">
          Trading Signal Generated
        </p>
        <p className="text-xs text-muted-foreground">
          {getTimeAgo(notification.timestamp)} • News ID: {notification.news_id}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="flex-shrink-0">
          <div className="h-2 w-2 rounded-full bg-primary" />
        </div>
      )}
    </div>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          className="relative border bg-muted/20 text-foreground hover:bg-primary/10 rounded-full"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount}
            </span>
          )}
          {/* Connection status indicator */}
          <span
            className={cn(
              "absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-background",
              isConnected ? "bg-green-500" : "bg-red-500",
            )}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[480px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                isConnected
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700",
              )}
            >
              {isConnected ? "Live" : "Offline"}
            </span>
          </div>
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
                {notifications.map((notification) =>
                  notification.type === "news"
                    ? renderNewsNotification(notification)
                    : renderSignalNotification(notification),
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCheck className="mb-3 h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  All caught up!
                </p>
                <p className="text-xs text-muted-foreground">
                  {isConnected
                    ? "Listening for new notifications..."
                    : "Reconnecting..."}
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
