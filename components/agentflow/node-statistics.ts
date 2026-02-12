export interface Statistic {
  label: string
  value: number
  suffix: string
}

export const nodeStatistics: Record<string, Statistic[]> = {
  "1": [
    { label: "Active Sources", value: 1, suffix: "" },
    { label: "News Sources Monitored", value: 120, suffix: "+" },
  ],
  "2": [
    { label: "News Ingested", value: 60, suffix: "/hour" },
    { label: "Success Rate", value: 98, suffix: "%" },
  ],
  "3": [
    { label: "Queue Size", value: 1250, suffix: "" },
    { label: "Processing Rate", value: 50, suffix: "/min" },
  ],
  "4": [
    { label: "Articles Processed", value: 2400, suffix: "/day" },
    { label: "Avg Processing Time", value: 3, suffix: "s" },
  ],
  "5": [
    { label: "Vectors Stored", value: 125000, suffix: "+" },
    { label: "Query Latency", value: 45, suffix: "ms" },
  ],
  "6": [
    { label: "Embeddings Generated", value: 500, suffix: "/min" },
    { label: "Context Accuracy", value: 94, suffix: "%" },
  ],
  "7": [
    { label: "Daily Conversations", value: 850, suffix: "" },
    { label: "Avg Response Time", value: 2, suffix: "s" },
  ],
  "8": [
    { label: "Trades Executed", value: 24, suffix: "/day" },
    { label: "Win Rate", value: 67, suffix: "%" },
  ],
  "9": [
    { label: "Topics Tracked", value: 45, suffix: "" },
    { label: "Alerts Sent", value: 12, suffix: "/day" },
  ],
  "10": [
    { label: "Notifications Sent", value: 320, suffix: "/day" },
    { label: "Delivery Rate", value: 99, suffix: "%" },
  ],
}
