/**
 * API service layer - all backend communication goes through here.
 * Uses relative URLs (proxied by Vite in dev).
 */

import { config } from '@/config'
import type { ChartResponse, ChatMessage, ChatResponse, IndicatorInfo } from '@/types'

const API_PREFIX = '/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${config.apiBaseUrl}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

/** Fetch chart data (candles + indicators) */
export async function fetchChart(
  pair?: string,
  interval?: string,
  period?: string
): Promise<ChartResponse> {
  const params = new URLSearchParams()
  if (pair) params.set('pair', pair)
  if (interval) params.set('interval', interval)
  if (period) params.set('period', period)
  return fetchJson<ChartResponse>(`${API_PREFIX}/chart?${params}`)
}

/** Send chat message to AI */
export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  pair?: string,
  interval?: string
): Promise<ChatResponse> {
  return fetchJson<ChatResponse>(`${API_PREFIX}/chat?session_id=default`, {
    method: 'POST',
    body: JSON.stringify({
      message,
      history,
      pair: pair || config.defaultPair,
      interval: interval || config.defaultInterval,
    }),
  })
}

/** Get chat history */
export async function fetchChatHistory(sessionId = 'default'): Promise<{ messages: ChatMessage[] }> {
  return fetchJson(`${API_PREFIX}/chat/history?session_id=${sessionId}`)
}

/** Get available indicators */
export async function fetchIndicators(): Promise<{ indicators: IndicatorInfo[] }> {
  return fetchJson(`${API_PREFIX}/indicators`)
}

/** Get saved hypotheses */
export async function fetchHypotheses(sessionId = 'default'): Promise<{ hypotheses: HypothesisData[] }> {
  return fetchJson(`${API_PREFIX}/hypotheses?session_id=${sessionId}`)
}

/** Resolve a hypothesis */
export async function resolveHypothesis(id: number, outcome: string): Promise<void> {
  await fetchJson(`${API_PREFIX}/hypotheses/${id}/resolve?outcome=${outcome}`, {
    method: 'POST',
  })
}

// Re-export type for convenience
import type { HypothesisData } from '@/types'
