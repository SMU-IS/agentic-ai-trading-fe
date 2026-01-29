const MANUAL_TICKERS: Record<string, string> = {
  BTCUSD: 'Bitcoin',
  ETHUSD: 'Ethereum',
  SOLUSD: 'Solana',
  ADAUSD: 'Cardano',
  DOGEUSD: 'Dogecoin',
  XRPUSD: 'Ripple',
  BNBUSD: 'Binance Coin',
  MATICUSD: 'Polygon',
  DOTUSD: 'Polkadot',
  AVAXUSD: 'Avalanche',
  LINKUSD: 'Chainlink',
  UNIUSD: 'Uniswap',
  ATOMUSD: 'Cosmos',
  LTCUSD: 'Litecoin',
  NEARUSD: 'NEAR Protocol',
  ALGOUSD: 'Algorand',
  XLMUSD: 'Stellar',
  SHIBUSD: 'Shiba Inu',
  APTUSD: 'Aptos',
  ARBUSD: 'Arbitrum',
  OPUSD: 'Optimism',
  FTMUSD: 'Fantom',
  SANDUSD: 'The Sandbox',
  MANAUSD: 'Decentraland',
  GRTUSD: 'The Graph',
  AAVEUSD: 'Aave',
  MKRUSD: 'Maker',
  EOSUSD: 'EOS',
  FILUSD: 'Filecoin',
  VETUSD: 'VeChain',
  ETHBTC: 'Ethereum/Bitcoin',
  SOLBTC: 'Solana/Bitcoin',
  ADABTC: 'Cardano/Bitcoin',
  DOGEBTC: 'Dogecoin/Bitcoin',
}

let TICKER_MAP: Record<string, string> = {}

async function loadTickerData() {
  if (Object.keys(TICKER_MAP).length > 0) {
    return
  }

  try {
    const response = await fetch('/company_tickers.json')
    const data = await response.json()

    Object.values(data).forEach((entry: any) => {
      TICKER_MAP[entry.ticker] = entry.title
    })
  } catch (error) {
    console.error('Failed to load ticker data:', error)
  }
}

if (typeof window !== 'undefined') {
  loadTickerData()
}

/**
 * Get company name from ticker symbol
 * @param ticker
 * @returns Company name or the ticker itself if not found
 */
export function getCompanyName(ticker: string): string {
  if (!ticker) return ''

  const upperTicker = ticker.toUpperCase()

  if (MANUAL_TICKERS[upperTicker]) {
    return MANUAL_TICKERS[upperTicker]
  }

  if (TICKER_MAP[upperTicker]) {
    return TICKER_MAP[upperTicker]
  }

  return ticker
}

/**
 * Pre-load ticker data (call this on app initialization)
 */
export async function initializeTickerMap() {
  await loadTickerData()
}

/**
 * Check if ticker data is loaded
 */
export function isTickerMapReady(): boolean {
  return Object.keys(TICKER_MAP).length > 0
}
