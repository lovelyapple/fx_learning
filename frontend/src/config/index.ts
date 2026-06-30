/**
 * Frontend configuration.
 * All values come from environment variables or defaults.
 * No hardcoded paths or magic numbers.
 */

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  backendPort: import.meta.env.VITE_BACKEND_PORT || '8000',
  frontendPort: import.meta.env.VITE_FRONTEND_PORT || '5173',

  // Chart defaults
  defaultPair: 'USDJPY=X',
  defaultInterval: '1h',
  defaultPeriod: '5d',

  // Available options
  intervals: ['1m', '5m', '15m', '1h', '4h', '1d'] as const,
  periods: ['1d', '5d', '1mo', '3mo', '6mo', '1y'] as const,

  // UI
  maxChatMessages: 100,
  chartHeight: 500,

  // Auto-refresh
  autoRefreshIntervalMs: 30000,
  livePriceIntervalMs: 10000,
} as const
