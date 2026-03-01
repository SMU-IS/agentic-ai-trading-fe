import { useState, useEffect, useRef } from "react"

export type HealthStatus = "healthy" | "unhealthy" | "loading"

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_API_URL ?? "http://localhost:8000/api/v1"

const HEALTH_ENDPOINTS: Record<string, string> = {
  "14": `${BASE_URL}/rag/healthcheck`,
  "15": `${BASE_URL}/trading/healthcheck`,
  "16": `${BASE_URL}/trading/healthcheck`,
  "18": `${BASE_URL}/user/healthcheck`,
  "17": `${BASE_URL}/notification/healthcheck`,
}

export function useHealthCheck(intervalMs = 30000) {
  const [statuses, setStatuses] = useState<Record<string, HealthStatus>>(
    Object.keys(HEALTH_ENDPOINTS).reduce(
      (acc, id) => {
        acc[id] = "loading"
        return acc
      },
      {} as Record<string, HealthStatus>,
    ),
  )

  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(
    Math.floor(intervalMs / 1000),
  )
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const resetCountdown = () => {
    setSecondsUntilRefresh(Math.floor(intervalMs / 1000))
  }

  const checkAll = async () => {
    const results = await Promise.allSettled(
      Object.entries(HEALTH_ENDPOINTS).map(async ([nodeId, url]) => {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(5000),
          credentials: "include",
        })
        return { nodeId, ok: res.ok }
      }),
    )

    setStatuses((prev) => {
      const next = { ...prev }
      results.forEach((result, i) => {
        const nodeId = Object.keys(HEALTH_ENDPOINTS)[i]
        next[nodeId] =
          result.status === "fulfilled" && result.value.ok
            ? "healthy"
            : "unhealthy"
      })
      return next
    })

    resetCountdown()
  }

  useEffect(() => {
    checkAll()
    const interval = setInterval(checkAll, intervalMs)

    // Tick countdown every second
    countdownRef.current = setInterval(() => {
      setSecondsUntilRefresh((prev) =>
        prev <= 1 ? Math.floor(intervalMs / 1000) : prev - 1,
      )
    }, 1000)

    return () => {
      clearInterval(interval)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  return { statuses, secondsUntilRefresh }
}

export const MONITORED_NODE_IDS = new Set(Object.keys(HEALTH_ENDPOINTS))
