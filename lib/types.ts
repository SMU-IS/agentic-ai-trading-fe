export interface Transaction {
  id: string
  symbol: string
  name: string
  type: "buy" | "sell"
  datetime: string
  price: number
  shares: number
  totalValue: number
  reason: string
}
