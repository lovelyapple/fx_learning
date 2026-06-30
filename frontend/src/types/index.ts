/** Shared type definitions for FX Learning App */

export interface CandleData {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface IndicatorData {
  timestamp: string
  sma_20: number | null
  sma_50: number | null
  ema_12: number | null
  ema_26: number | null
  bb_upper: number | null
  bb_middle: number | null
  bb_lower: number | null
  rsi: number | null
  macd: number | null
  macd_signal: number | null
  macd_histogram: number | null
}

export interface ChartResponse {
  pair: string
  interval: string
  period: string
  source: string
  is_realtime: boolean
  delay_note: string
  latest_timestamp: string | null
  candles: CandleData[]
  indicators: IndicatorData[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  ref_candles?: number[]
  ref_selected_timestamps?: string[]  // snapshot of selected candle timestamps at message time
  ref_chart_timestamps?: string[]
}

export interface HypothesisData {
  direction: 'up' | 'down' | 'sideways'
  confidence: 'high' | 'medium' | 'low'
  base_price: number
  entry_price: number | null
  target_price: number | null
  stop_price: number | null
  horizon_candles: number | null
  invalidation_condition: string | null
  reasoning: string
  indicators_used: string[]
  created_at: string
}

export interface ChatResponse {
  message: string
  hypothesis: HypothesisData | null
  ref_candles: number[] | null
  ref_chart: number[] | null
  ref_chart_timestamps: string[] | null
  disclaimer: string
}

export interface LivePriceResponse {
  pair: string
  price: number
  fetched_at: string
}

export interface IndicatorInfo {
  id: string
  name: string
  category: string
  description: string
}
