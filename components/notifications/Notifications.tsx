"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  Bell,
  Settings,
  TrendingUp,
  TrendingDown,
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
import { FaReddit } from "react-icons/fa"
import { SiTradingview } from "react-icons/si"

const getToken = () => Cookies.get("jwt") ?? ""

const NOTIF_URL = `${process.env.NEXT_PUBLIC_NOTIF_API_URL}`
const BASE_API_URL = `${process.env.NEXT_PUBLIC_BASE_API_URL}`

// ─── REST response types ────────────────────────────────────────────────────

interface TradeOrder {
  order_id: string
  symbol: string
  action: "BUY" | "SELL" | string
  suggested_qty: string
  reasonings: string
  profile: string
  timestamp?: string
}

// ⚠️ Adjust these fields once you confirm the real /trading/decisions/signals/ response shape
interface HistoricalSignal {
  id: string
  ticker: string
  trade_signal: string
  credibility: string
  confidence: number
  rumor_summary: string
  timestamp?: string
}

interface HistoricalNewsItem {
  topic_id: string
  text_content: string
  metadata: {
    topic_id: string
    tickers: string[]
    tickers_metadata: Array<{
      ticker: string
      event_type: string
      sentiment_score: number
      sentiment_label: string
    }>
    timestamp: string // ISO string e.g. "2026-03-31T02:35:28+08:00"
    source_domain: string
    credibility_score: number
    headline: string // may be empty string — fall back to text_content
    text_content: string
    url: string
    author: string
  }
}

interface HistoricalNewsResponse {
  status: string
  count: number
  next_offset: string
  data: HistoricalNewsItem[]
}

// ─── WebSocket types ────────────────────────────────────────────────────────

interface WSNewsNotification {
  type?: "NEWS_RECEIVED" | string
  // server sends "id" but may also send "news_id" — handle both
  id?: string
  news_id?: string
  headline: string
  tickers: Array<{
    symbol: string
    event_type: string
    sentiment_label: string
  }>
  event_description: string
}

interface WSSignalNotification {
  type?: "SIGNAL_GENERATED" | string
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

// ─── UI Notification types ──────────────────────────────────────────────────

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

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Decode user_id from JWT. Returns null if token is missing or malformed. */
function getUserIdFromToken(): string | null {
  const token = getToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.sub ?? payload.user_id ?? payload.id ?? null
  } catch {
    return null
  }
}

/** Merge incoming notifications into existing state, skipping duplicates by id. */
function mergeNotifications(
  prev: Notification[],
  incoming: Notification[],
  position: "prepend" | "append" = "append",
): Notification[] {
  const existingIds = new Set(prev.map((n) => n.id))
  const fresh = incoming.filter((n) => !existingIds.has(n.id))
  return position === "prepend" ? [...fresh, ...prev] : [...prev, ...fresh]
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState<"news" | "signals" | "orders">(
    "news",
  )
  const [isConnected, setIsConnected] = useState(false)

  // Per-tab loading / error states
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [signalsLoading, setSignalsLoading] = useState(false)
  const [signalsError, setSignalsError] = useState<string | null>(null)
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsError, setNewsError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const unreadNewsCount = notifications.filter(
    (n) => !n.isRead && n.type === "news",
  ).length
  const unreadSignalsCount = notifications.filter(
    (n) => !n.isRead && n.type === "signal",
  ).length
  const unreadOrdersCount = notifications.filter(
    (n) => !n.isRead && n.type === "order",
  ).length

  const filteredNotifications = notifications
    .filter((n) => {
      if (activeTab === "news") return n.type === "news"
      if (activeTab === "signals") return n.type === "signal"
      if (activeTab === "orders") return n.type === "order"
      return false
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  // ─── 1. Fetch historical NEWS ─────────────────────────────────────────────
  useEffect(() => {
    const fetchHistoricalNews = async () => {
      const token = getToken()
      if (!token) return

      setNewsLoading(true)
      setNewsError(null)

      try {
        const res = await fetch(`${BASE_API_URL}/qdrant/news`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json: HistoricalNewsResponse = await res.json()

        const newsNotifications: NewsNotification[] = json.data.map((item) => ({
          id: item.topic_id,
          type: "news",
          // Use headline if present, otherwise fall back to text_content
          headline: item.metadata.headline?.trim()
            ? item.metadata.headline
            : item.text_content,
          // Normalise tickers_metadata → match the existing NewsNotification shape
          tickers: item.metadata.tickers_metadata.map((t) => ({
            symbol: t.ticker, // ticker → symbol
            event_type: t.event_type,
            sentiment_label: t.sentiment_label,
          })),
          event_description: item.metadata.source_domain
            ? `via ${item.metadata.source_domain} · ${item.metadata.author}`
            : "",
          timestamp: item.metadata.timestamp
            ? new Date(item.metadata.timestamp)
            : new Date(0),
          isRead: false,
        }))

        setNotifications((prev) =>
          mergeNotifications(prev, newsNotifications, "append"),
        )
      } catch (err) {
        console.error("❌ Failed to fetch historical news:", err)
        setNewsError("Failed to load news history.")
      } finally {
        setNewsLoading(false)
      }
    }

    fetchHistoricalNews()
  }, [])

  // ─── 2. Fetch historical SIGNALS ─────────────────────────────────────────
  useEffect(() => {
    const fetchHistoricalSignals = async () => {
      const token = getToken()
      if (!token) return

      setSignalsLoading(true)
      setSignalsError(null)

      try {
        const res = await fetch(`${BASE_API_URL}/trading/decisions/signals/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data: HistoricalSignal[] = await res.json()

        const signalNotifications: SignalNotification[] = data.map((item) => ({
          id: `signal-${item.id}`,
          type: "signal",
          ticker: item.ticker ?? "",
          trade_signal: item.trade_signal ?? "",
          credibility: item.credibility ?? "",
          confidence: item.confidence ?? 0,
          rumor_summary: item.rumor_summary ?? "",
          timestamp: item.timestamp ? new Date(item.timestamp) : new Date(0), // ← use it
          isRead: false,
        }))

        setNotifications((prev) =>
          mergeNotifications(prev, signalNotifications, "append"),
        )
      } catch (err) {
        console.error("❌ Failed to fetch historical signals:", err)
        setSignalsError("Failed to load signal history.")
      } finally {
        setSignalsLoading(false)
      }
    }

    fetchHistoricalSignals()
  }, [])

  // ─── 3. Fetch historical ORDERS ──────────────────────────────────────────
  useEffect(() => {
    const fetchHistoricalOrders = async () => {
      const token = getToken()
      const userId = getUserIdFromToken()
      if (!token || !userId) {
        console.error("❌ Missing token or user_id for orders fetch")
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
          timestamp: order.timestamp ? new Date(order.timestamp) : new Date(0), // ← use it
          isRead: false,
        }))

        setNotifications((prev) =>
          mergeNotifications(prev, orderNotifications, "append"),
        )
      } catch (err) {
        console.error("❌ Failed to fetch historical orders:", err)
        setOrdersError("Failed to load order history.")
      } finally {
        setOrdersLoading(false)
      }
    }

    fetchHistoricalOrders()
  }, [])

  // ─── 4. WebSocket — live NEWS + SIGNALS ──────────────────────────────────
  useEffect(() => {
    let isComponentMounted = true

    const connectWebSocket = () => {
      if (!isComponentMounted) return

      const token = getToken()
      const userId = getUserIdFromToken()
      if (!token || !userId) return

      try {
        const wsUrl = `${NOTIF_URL}/ws/notifications?user_id=${userId}`
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

          try {
            const data: WSNotification = JSON.parse(event.data)
            let newNotification: Notification

            if ("tickers" in data) {
              // NEWS — server may omit "type"; detect by presence of "tickers"
              const news = data as WSNewsNotification
              const id = news.id ?? news.news_id ?? `news-${Date.now()}`
              const tickers = Array.isArray(news.tickers) ? news.tickers : []
              const headline =
                news.headline?.trim() || news.event_description || id

              newNotification = {
                id,
                type: "news",
                headline,
                tickers,
                event_description: news.event_description ?? "",
                timestamp: new Date(),
                isRead: false,
              }
            } else {
              // SIGNAL
              const signal = (data as WSSignalNotification).signal_id
              newNotification = {
                id: `signal-${signal.id}-${Date.now()}`,
                type: "signal",
                ticker: signal.ticker ?? "",
                trade_signal: signal.trade_signal ?? "",
                credibility: signal.credibility ?? "",
                confidence: signal.confidence ?? 0,
                rumor_summary: signal.rumor_summary ?? "",
                timestamp: new Date(),
                isRead: false,
              }
            }

            setNotifications((prev) => {
              if (prev.some((n) => n.id === newNotification.id)) return prev
              return [newNotification, ...prev]
            })

            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              const isNews = "tickers" in data
              const newsData = isNews ? (data as WSNewsNotification) : null
              const signalData = !isNews ? (data as WSSignalNotification).signal_id : null
              new Notification("Incoming: Market News Update", {
                body: isNews
                  ? (newsData!.headline?.trim() || newsData!.event_description)
                  : `${signalData!.ticker} — ${signalData!.trade_signal} signal (${signalData!.credibility} credibility)`,
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

        ws.onerror = () => {
          if (isComponentMounted) console.error("❌ WebSocket error")
        }

        ws.onclose = (event) => {
          if (!isComponentMounted) return
          console.log("🔌 WebSocket closed:", event.code)
          setIsConnected(false)

          if (event.code !== 1000 && isComponentMounted) {
            console.log("⏳ Reconnecting in 5 seconds...")
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

  // ─── 5. Persist to / restore from localStorage ───────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("mvdia_notifications")
    if (!saved) return
    try {
      const parsed = JSON.parse(saved).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
        ...(n.type === "news" && {
          tickers: (n.tickers ?? []).map((t: any) => ({
            symbol: t.symbol ?? t.ticker ?? "",
            event_type: t.event_type ?? "",
            sentiment_label: t.sentiment_label ?? "neutral",
          })),
        }),
      }))

      // ✅ Merge instead of replace — preserves any WS notifications already in state
      setNotifications((prev) => mergeNotifications(prev, parsed, "append"))
    } catch (err) {
      console.error("Failed to restore notifications:", err)
    }
  }, [])

  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem("mvdia_notifications", JSON.stringify(notifications))
    }
  }, [notifications])

  // ─── Actions ─────────────────────────────────────────────────────────────
  const markAllAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))

  const markAsRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    )

  const getTimeAgo = (date: Date) => {
    if (!date || isNaN(date.getTime()) || date.getTime() === 0)
      return "Historical"
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
      case "PRICE_ALERT":
        return "text-orange-600 bg-orange-50"
      case "VOLUME_SPIKE":
        return "text-blue-600 bg-blue-50"
      default:
        return "text-purple-600 bg-purple-50"
    }
  }

  const getSentimentColor = (sentiment: string) => {
    if (!sentiment) return "text-gray-600 bg-gray-50"
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "text-green-600 bg-green-50"
      case "negative":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getSourcePill = (topicId: string) => {
    if (topicId.startsWith("reddit")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600 border border-orange-200">
          <FaReddit className="h-3 w-3" />
          Reddit
        </span>
      )
    }

    if (topicId.startsWith("tradingview_ideas")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 border border-blue-200">
          <SiTradingview className="h-3 w-3" />
          TradingView Ideas
        </span>
      )
    }

    if (topicId.startsWith("tradingview_minds")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-600 border border-cyan-200">
          <SiTradingview className="h-3 w-3" />
          TradingView Minds
        </span>
      )
    }

    // Fallback for unknown sources
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500 border border-gray-200">
        Unknown
      </span>
    )
  }

  // ─── Renderers ────────────────────────────────────────────────────────────
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
        {/* News Headline */}
        <p className="text-sm font-semibold text-foreground line-clamp-2">
          {notification.headline}
        </p>

        {/* Source pill + tickers row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Ticker badges */}
          {notification.tickers?.length > 0 &&
            notification.tickers.map((ticker, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span className="text-xs font-medium text-foreground">
                  <span
                    className={cn(
                      "bg-muted rounded-full px-2 py-0.5 text-[10px] font-medium",
                    )}
                  >
                    {ticker.symbol || "N/A"}
                  </span>
                </span>
                {ticker.event_type && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      getEventTypeColor(ticker.event_type),
                    )}
                  >
                    {ticker.event_type}
                  </span>
                )}
                {ticker.sentiment_label && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      getSentimentColor(ticker.sentiment_label),
                    )}
                  >
                    {ticker.sentiment_label}
                  </span>
                )}
              </div>
            ))}
          {/* ── Source pill derived from topic_id ── */}
          {getSourcePill(notification.id)}
        </div>

        {notification.event_description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {notification.event_description}
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
            {notification.ticker || "—"}
          </p>
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
              {notification.trade_signal === "NO_TRADE" ? "No Trade" : notification.trade_signal}
            </span>
          )}
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

  const renderOrderNotification = (notification: OrderNotification) => (
    <div
      key={notification.id}
      onClick={() => markAsRead(notification.id)}
      className={cn(
        "flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
        !notification.isRead && "bg-muted/30",
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full",
          notification.action === "BUY" ? "bg-green-50" : "bg-red-50",
        )}
      >
        {notification.action === "BUY" ? (
          <TrendingUp className="h-5 w-5 text-green-500" />
        ) : (
          <TrendingDown className="h-5 w-5 text-red-500" />
        )}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">
            {notification.symbol}
          </p>
          <span
            className={cn(
              "rounded border px-2 py-0.5 text-[10px] font-bold",
              notification.action === "BUY"
                ? "border-green-500/20 bg-green-500/10 text-green-600"
                : "border-red-500/20 bg-red-500/10 text-red-500",
            )}
          >
            {notification.action}
          </span>
          <span className="text-[10px] text-muted-foreground">
            Qty: {notification.suggested_qty}
          </span>
          <span className="rounded border border-gray-500/20 bg-gray-500/10 px-2 py-0.5 text-[10px] font-medium text-gray-500 capitalize">
            {notification.profile}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.reasonings}
        </p>
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

  // ─── Tab loading/error helper ─────────────────────────────────────────────
  const isTabLoading =
    (activeTab === "news" && newsLoading) ||
    (activeTab === "signals" && signalsLoading) ||
    (activeTab === "orders" && ordersLoading)

  const tabError =
    activeTab === "news"
      ? newsError
      : activeTab === "signals"
        ? signalsError
        : ordersError

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <DropdownMenu >
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          className="relative border bg-muted/20 text-foreground hover:bg-primary/10 rounded-full"
        >
          <Bell className="h-5 w-5" />
          <span
            className={cn(
              "absolute -top-0 -left-1 h-3.5 w-3.5 rounded-full border-2 border-background animate-pulse",
              isConnected ? "bg-green-500" : "bg-red-500",
            )}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[calc(100vw)] p-0 sm:w-[440px]">
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
          {(["news", "signals", "orders"] as const).map((tab) => {
            const label =
              tab === "news"
                ? "News"
                : tab === "signals"
                  ? "Trade Signals"
                  : "Orders"
            const count =
              tab === "news"
                ? unreadNewsCount
                : tab === "signals"
                  ? unreadSignalsCount
                  : unreadOrdersCount
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "relative pb-3 pt-3 text-sm font-medium transition-colors",
                  activeTab === tab
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
                {count > 0 && (
                  <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {count}
                  </span>
                )}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            )
          })}
          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Notifications List */}
        <div className="max-h-[60vh] sm:max-h-[500px] overflow-y-auto">
          {isTabLoading && (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading {activeTab} history…
            </div>
          )}
          {tabError && !isTabLoading && (
            <div className="flex items-center justify-center py-8 text-sm text-red-500">
              {tabError}
            </div>
          )}

          {!isTabLoading && filteredNotifications.length > 0 ? (
            <div className="divide-y">
              {filteredNotifications.map((notification) => {
                if (notification.type === "news")
                  return renderNewsNotification(notification)
                if (notification.type === "signal")
                  return renderSignalNotification(notification)
                if (notification.type === "order")
                  return renderOrderNotification(notification)
              })}
            </div>
          ) : (
            !isTabLoading && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                {activeTab === "news" ? (
                  <>
                    <Newspaper className="mb-3 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      No news notifications
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isConnected
                        ? "Listening for new updates..."
                        : "Reconnecting..."}
                    </p>
                  </>
                ) : activeTab === "signals" ? (
                  <>
                    <TrendingUp className="mb-3 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      No trade signals
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isConnected
                        ? "Listening for new signals..."
                        : "Reconnecting..."}
                    </p>
                  </>
                ) : (
                  <>
                    <History className="mb-3 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      No executed orders
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Agent-M has not placed any orders yet.
                    </p>
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
