export function getCredibilityColor(credibility: string): string {
  switch (credibility?.toLowerCase()) {
    case "high":
      return "text-green-500 bg-green-500/10 border-green-500/20"
    case "medium":
      return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
    case "low":
      return "text-red-500 bg-red-500/10 border-red-500/20"
    default:
      return "text-gray-500 bg-gray-500/10 border-gray-500/20"
  }
}

export function getRiskStatusColor(status: string): string {
  switch (status) {
    case "APPROVED":
      return "text-green-500 bg-green-500/10 border-green-500/20"
    case "WARNING":
      return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
    case "REJECTED":
      return "text-red-500 bg-red-500/10 border-red-500/20"
    default:
      return "text-gray-500 bg-gray-500/10 border-gray-500/20"
  }
}
