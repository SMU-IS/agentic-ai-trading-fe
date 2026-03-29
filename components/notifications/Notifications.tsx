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
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"
import Cookies from "js-cookie"

const getToken = () => Cookies.get("jwt") ?? ""

// WebSocket notification types from backend
type WSNotificationType = "NEWS_RECEIVED" | "SIGNAL_GENERATED"

const NOTIF_URL = `${process.env.NEXT_PUBLIC_NOTIF_API_URL}`
const BASE_API_URL = `${process.env.NEXT_PUBLIC_BASE_API_URL}`

// ─── NEW: Trade Order type matching the REST API response ───────────────────
interface TradeOrder {
  order_id: string
  symbol: string
  action: "BUY" | "SELL" | string
  suggested_qty: string
  reasonings: string
  profile: string
}

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
  signal_id: {
    id: string
    ticker: string
    rumor_summary: string
    credibility: string
    credibility_reason: string
    references: string[]
    trade_signal: string
    confidence: number
    trade_rationale: string
    position_size_pct: number
    stop_loss_pct: number
    target_pct: number
  }
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
  ticker: string
  trade_signal: string
  credibility: string
  confidence: number
  rumor_summary: string
}

// ─── NEW: UI type for executed trade orders ──────────────────────────────────
interface OrderNotification extends BaseNotification {
  type: "order"
  order_id: string
  symbol: string
  action: string
  suggested_qty: string
  reasonings: string
  profile: string
}

type Notification = NewsNotification | SignalNotification | OrderNotification

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState<"news" | "signals" | "orders">("news")
  const [isConnected, setIsConnected] = useState(false)
  // ─── NEW: loading / error state for historical orders ────────────────────
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "news") return n.type === "news"
    if (activeTab === "signals") return n.type === "signal"
    if (activeTab === "orders") return n.type === "order"
    return false
  })

  const unreadNewsCount = notifications.filter((n) => !n.isRead && n.type === "news").length
  const unreadSignalsCount = notifications.filter((n) => !n.isRead && n.type === "signal").length
  const unreadOrdersCount = notifications.filter((n) => !n.isRead && n.type === "order").length

  // ─── NEW: Fetch historical trade orders on mount ─────────────────────────
  useEffect(() => {
    const fetchHistoricalOrders = async () => {
      const token = getToken()
      if (!token) return

      // Decode user_id from JWT payload (base64 segment)
      let userId: string
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        userId = payload.sub ?? payload.user_id ?? payload.id
        if (!userId) throw new Error("user_id not found in token")
      } catch (err) {
        console.error("❌ Failed to decode JWT for user_id:", err)
        return
      }

      setOrdersLoading(true)
      setOrdersError(null)

      try {
        const res = await fetch(
          `${BASE_API_URL}/trading/decisions/notification/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        )

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data: TradeOrder[] = await res.json()

        const orderNotifications: OrderNotification[] = data.map((order) => ({
          id: order.order_id,
          type: "order",
          order_id: order.order_id,
          symbol: order.symbol,
          action: order.action,
          suggested_qty: order.suggested_qty,
          reasonings: order.reasonings,
          profile: order.profile,
          // Historical orders have no server timestamp — use epoch 0 as sentinel
          // so they sort behind any live notifications
          timestamp: new Date(0),
          isRead: false,
        }))

        setNotifications((prev) => {
          // Merge: skip duplicates already in state (e.g. from localStorage)
          const existingIds = new Set(prev.map((n) => n.id))
          const fresh = orderNotifications.filter((o) => !existingIds.has(o.id))
          // Prepend live notifications, append historical orders at the end
          return [...prev, ...fresh]
        })
      } catch (err: any) {
        console.error("❌ Failed to fetch historical orders:", err)
        setOrdersError("Failed to load order history.")
      } finally {
        setOrdersLoading(false)
      }
    }

    fetchHistoricalOrders()
  }, []) // runs once on mount

  // WebSocket connection — unchanged
  useEffect(() => {
    let isComponentMounted = true

    const connectWebSocket = () => {
      if (!isComponentMounted) return

      const token = getToken()
      if (!token) return

      // Decode user_id from JWT payload (base64 segment)
      let userId: string
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        userId = payload.sub ?? payload.user_id ?? payload.id
        if (!userId) throw new Error("user_id not found in token")
      } catch (err) {
        console.error("❌ Failed to decode JWT for user_id:", err)
        return
      }

      try {
        const wsUrl = `${NOTIF_URL}/ws/notifications/${userId}`
        console.log("Attempting to connect to:", wsUrl)

        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          if (!isComponentMounted) { ws.close(); return }
          console.log("✅ Connected to notifications WebSocket")
          setIsConnected(true)
        }

        ws.onmessage = (event) => {
          if (!isComponentMounted) return

          try {
            const data: WSNotification = JSON.parse(event.data)
            let newNotification: Notification

            if (data.type === "NEWS_RECEIVED") {
              const tickers = Array.isArray(data.tickers)
                ? data.tickers
                : data.tickers ? [data.tickers] : []

              newNotification = {
                id: data.news_id,
                type: "news",
                headline: data.headline,
                tickers,
                event_description: data.event_description,
                timestamp: new Date(),
                isRead: false,
              }
            } else {
              const signal = data.signal_id
              newNotification = {
                id: `signal-${signal.id}-${Date.now()}`,
                type: "signal",
                ticker: signal.ticker,
                trade_signal: signal.trade_signal,
                credibility: signal.credibility,
                confidence: signal.confidence,
                rumor_summary: signal.rumor_summary,
                timestamp: new Date(),
                isRead: false,
              }
            }

            setNotifications((prev) => {
              if (prev.some((n) => n.id === newNotification.id)) return prev
              return [newNotification, ...prev]
            })

            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Incoming: Market News Update", {
                body:
                  data.type === "NEWS_RECEIVED"
                    ? data.headline
                    : `${data.signal_id.ticker} — ${data.signal_id.trade_signal} signal (${data.signal_id.credibility} credibility)`,
                icon: "/favicon.ico",
              })
            }
          } catch (err) {
            console.error("❌ Failed to parse WebSocket message:", err, event.data)
          }
        }

        ws.onerror = () => {
          if (isComponentMounted) console.error("❌ WebSocket error")
        }

        ws.onclose = (event) => {
          if (!isComponentMounted) return
          console.log("🔌 WebSocket closed:", event.code)
          setIsConnected(false)

          if (event.code !== 1000 && isComponentMounted) {
            console.log("⏳ Attempting to reconnect in 5 seconds...")
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isComponentMounted) connectWebSocket()
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
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log("🛑 Closing WebSocket connection")
        wsRef.current.close(1000, "Component unmounted")
      }
    }
  }, [])

  // Load notifications from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("mvdia_notifications")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setNotifications(
          parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) })),
        )
      } catch (err) {
        console.error("Failed to restore notifications:", err)
      }
    }
  }, [])

  // Save to localStorage whenever notifications change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem("mvdia_notifications", JSON.stringify(notifications))
    }
  }, [notifications])

  const markAllAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))

  const markAsRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    )

  const getTimeAgo = (date: Date) => {
    // Sentinel: historical orders have no real timestamp
    if (date.getTime() === 0) return "Historical"

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? "s" : ""} ago`
  }

  const getEventTypeColor = (eventType: string) => {
    if (!eventType) return "text-purple-600 bg-purple-50"
    switch (eventType.toUpperCase()) {
      case "PRICE_ALERT": return "text-orange-600 bg-orange-50"
      case "VOLUME_SPIKE": return "text-blue-600 bg-blue-50"
      default: return "text-purple-600 bg-purple-50"
    }
  }

  const getSentimentColor = (sentiment: string) => {
    if (!sentiment) return "text-gray-600 bg-gray-50"
    switch (sentiment.toLowerCase()) {
      case "positive": return "text-green-600 bg-green-50"
      case "negative": return "text-red-600 bg-red-50"
      default: return "text-gray-600 bg-gray-50"
    }
  }

  const renderNewsNotification = (notification: NewsNotification) => (
    <div
      key={`${notification.id}-${uuidv4()}`}
      onClick={() => markAsRead(notification.id)}
      className={cn(
        "flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
        !notification.isRead && "bg-muted/30",
      )}
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-50">
        <Newspaper className="h-5 w-5 text-blue-500" />
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-sm font-semibold text-foreground line-clamp-2">
          {notification.headline}
        </p>
        {notification.tickers &&
          Array.isArray(notification.tickers) &&
          notification.tickers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {notification.tickers.map((ticker, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{ticker.symbol || "N/A"}</span>
                  {ticker.event_type && (
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", getEventTypeColor(ticker.event_type))}>
                      {ticker.event_type}
                    </span>
                  )}
                  {ticker.sentiment_label && (
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", getSentimentColor(ticker.sentiment_label))}>
                      {ticker.sentiment_label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        {notification.event_description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.event_description}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{getTimeAgo(notification.timestamp)}</p>
      </div>
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
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-50">
      <TrendingUp className="h-5 w-5 text-purple-500" />
    </div>
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm font-semibold text-foreground">
          {notification.ticker ?? "—"}
        </p>

        {/* Trade signal badge — guard against undefined */}
        {notification.trade_signal && (
          <span
            className={cn(
              "rounded border px-2 py-0.5 text-[10px] font-bold",
              notification.trade_signal === "BUY"
                ? "border-green-500/20 bg-green-500/10 text-green-600"
                : notification.trade_signal === "SELL"
                  ? "border-red-500/20 bg-red-500/10 text-red-500"
                  : "border-gray-500/20 bg-gray-500/10 text-gray-500",
            )}
          >
            {notification.trade_signal}
          </span>
        )}

        {/* Credibility badge — guard against undefined before .toLowerCase() */}
        {notification.credibility && (
          <span
            className={cn(
              "rounded border px-2 py-0.5 text-[10px] font-medium",
              notification.credibility.toLowerCase() === "high"
                ? "border-green-500/20 bg-green-500/10 text-green-600"
                : notification.credibility.toLowerCase() === "medium"
                  ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-600"
                  : "border-red-500/20 bg-red-500/10 text-red-500",
            )}
          >
            {notification.credibility}
          </span>
        )}

        {/* Confidence — guard against undefined */}
        {notification.confidence != null && (
          <span className="text-[10px] text-muted-foreground">
            {notification.confidence}/10
          </span>
        )}
      </div>

      {notification.rumor_summary && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.rumor_summary}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        {getTimeAgo(notification.timestamp)}
      </p>
    </div>

    {!notification.isRead && (
      <div className="flex-shrink-0">
        <div className="h-2 w-2 rounded-full bg-primary" />
      </div>
    )}
  </div>
)

  // ─── NEW: Render executed trade order notification ────────────────────────
  const renderOrderNotification = (notification: OrderNotification) => (
    <div
      key={notification.id}
      onClick={() => markAsRead(notification.id)}
      className={cn(
        "flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
        !notification.isRead && "bg-muted/30",
      )}
    >
      {/* Icon */}
      <div className={cn(
        "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full",
        notification.action === "BUY" ? "bg-green-50" : "bg-red-50",
      )}>
        {notification.action === "BUY"
          ? <TrendingUp className="h-5 w-5 text-green-500" />
          : <TrendingDown className="h-5 w-5 text-red-500" />
        }
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          {/* Symbol */}
          <p className="text-sm font-semibold text-foreground">{notification.symbol}</p>

          {/* Action badge */}
          <span className={cn(
            "rounded border px-2 py-0.5 text-[10px] font-bold",
            notification.action === "BUY"
              ? "border-green-500/20 bg-green-500/10 text-green-600"
              : "border-red-500/20 bg-red-500/10 text-red-500",
          )}>
            {notification.action}
          </span>

          {/* Quantity */}
          <span className="text-[10px] text-muted-foreground">
            Qty: {notification.suggested_qty}
          </span>

          {/* Profile badge */}
          <span className="rounded border border-gray-500/20 bg-gray-500/10 px-2 py-0.5 text-[10px] font-medium text-gray-500 capitalize">
            {notification.profile}
          </span>
        </div>

        {/* Truncated reasoning */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.reasonings}
        </p>

        <p className="text-xs text-muted-foreground">{getTimeAgo(notification.timestamp)}</p>
      </div>

      {/* Unread dot */}
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
          {unreadCount > 0 && <></>}
          <span className={cn(
            "absolute -top-0 -left-1 h-3.5 w-3.5 rounded-full border-2 border-background animate-pulse",
            isConnected ? "bg-green-500" : "bg-red-500",
          )} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[480px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
            )}>
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
          {/* News tab */}
          <button
            onClick={() => setActiveTab("news")}
            className={cn(
              "relative pb-3 pt-3 text-sm font-medium transition-colors",
              activeTab === "news" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            News
            {unreadNewsCount > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {unreadNewsCount}
              </span>
            )}
            {activeTab === "news" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>

          {/* Trade Signals tab */}
          <button
            onClick={() => setActiveTab("signals")}
            className={cn(
              "relative pb-3 pt-3 text-sm font-medium transition-colors",
              activeTab === "signals" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Trade Signals
            {unreadSignalsCount > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {unreadSignalsCount}
              </span>
            )}
            {activeTab === "signals" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>

          {/* ─── NEW: Orders tab ─────────────────────────────────────────── */}
          <button
            onClick={() => setActiveTab("orders")}
            className={cn(
              "relative pb-3 pt-3 text-sm font-medium transition-colors",
              activeTab === "orders" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Orders
            {unreadOrdersCount > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {unreadOrdersCount}
              </span>
            )}
            {activeTab === "orders" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>

          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Notifications List */}
        <div className="max-h-[500px] overflow-y-auto">
          {/* ─── NEW: Orders loading / error state ───────────────────────── */}
          {activeTab === "orders" && ordersLoading && (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading order history…
            </div>
          )}
          {activeTab === "orders" && ordersError && !ordersLoading && (
            <div className="flex items-center justify-center py-8 text-sm text-red-500">
              {ordersError}
            </div>
          )}

          {filteredNotifications.length > 0 ? (
            <div className="divide-y">
              {filteredNotifications.map((notification) => {
                if (notification.type === "news") return renderNewsNotification(notification)
                if (notification.type === "signal") return renderSignalNotification(notification)
                if (notification.type === "order") return renderOrderNotification(notification)
              })}
            </div>
          ) : (
            !ordersLoading && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                {activeTab === "news" ? (
                  <>
                    <Newspaper className="mb-3 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">No news notifications</p>
                    <p className="text-xs text-muted-foreground">
                      {isConnected ? "Listening for new updates..." : "Reconnecting..."}
                    </p>
                  </>
                ) : activeTab === "signals" ? (
                  <>
                    <TrendingUp className="mb-3 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">No trade signals</p>
                    <p className="text-xs text-muted-foreground">
                      {isConnected ? "Listening for new signals..." : "Reconnecting..."}
                    </p>
                  </>
                ) : (
                  <>
                    <History className="mb-3 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">No executed orders</p>
                    <p className="text-xs text-muted-foreground">Agent-M has not placed any orders yet.</p>
                  </>
                )}
              </div>
            )
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}