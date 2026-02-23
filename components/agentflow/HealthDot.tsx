import { motion } from "framer-motion"
import type { HealthStatus } from "@/hooks/use-health-check"

const statusConfig = {
  healthy: { color: "bg-green-500", ring: "bg-green-500/40", pulse: true },
  unhealthy: { color: "bg-red-500", ring: "bg-red-500/40", pulse: false },
  loading: { color: "bg-yellow-500", ring: "bg-yellow-500/40", pulse: true },
}

export const HealthDot = ({ status }: { status: HealthStatus }) => {
  const cfg = statusConfig[status]
  return (
    <div className="absolute right-2 top-2 flex items-center justify-center">
      {cfg.pulse && (
        <motion.div
          className={`absolute h-3 w-3 rounded-full ${cfg.ring}`}
          animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <div className={`h-2 w-2 rounded-full ${cfg.color}`} />
    </div>
  )
}
