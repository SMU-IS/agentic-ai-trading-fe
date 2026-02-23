import { useState, useEffect } from "react"

export type HealthStatus = "healthy" | "unhealthy" | "loading"

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_API_URL ?? "http://localhost:8000/api/v1"

// Map each nodeId to its health endpoint
const HEALTH_ENDPOINTS: Record<string, string> = {
  "7": `${BASE_URL}/rag/healthcheck`,
  "8": `${BASE_URL}/trading/healthcheck`,
  "11": `${BASE_URL}/notification/healthcheck`,
  "9": `${BASE_URL}/notification/healthcheck`,
  // add remaining nodes...
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

  const checkAll = async () => {
    const results = await Promise.allSettled(
      Object.entries(HEALTH_ENDPOINTS).map(async ([nodeId, url]) => {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
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
  }

  useEffect(() => {
    checkAll()
    const interval = setInterval(checkAll, intervalMs)
    return () => clearInterval(interval)
  }, [])

  return statuses
}
