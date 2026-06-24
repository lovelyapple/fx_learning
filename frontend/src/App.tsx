/**
 * Main App component - FX Learning Application.
 */

import { useState, useEffect, useCallback } from 'react'
import { CandlestickChart } from '@/components/CandlestickChart'
import { ChatPanel } from '@/components/ChatPanel'
import { ChartControls } from '@/components/ChartControls'
import { HypothesisPanel } from '@/components/HypothesisPanel'
import { fetchChart } from '@/services/api'
import { config } from '@/config'
import type { CandleData, IndicatorData, HypothesisData } from '@/types'

export default function App() {
  const [pair] = useState(config.defaultPair as string)
  const [interval, setInterval_] = useState(config.defaultInterval as string)
  const [period, setPeriod] = useState(config.defaultPeriod as string)
  const [candles, setCandles] = useState<CandleData[]>([])
  const [indicators, setIndicators] = useState<IndicatorData[]>([])
  const [hypothesis, setHypothesis] = useState<HypothesisData | null>(null)
  const [visibleIndicators, setVisibleIndicators] = useState<string[]>(['sma_20', 'sma_50'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [delayNote, setDelayNote] = useState('')

  const loadChart = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchChart(pair, interval, period)
      setCandles(data.candles)
      setIndicators(data.indicators)
      setDelayNote(data.delay_note)
    } catch (err) {
      setError('チャートデータの取得に失敗しました。バックエンドが起動しているか確認してください。')
    } finally {
      setLoading(false)
    }
  }, [pair, interval, period])

  useEffect(() => {
    loadChart()
  }, [loadChart])

  const handleToggleIndicator = (id: string) => {
    setVisibleIndicators(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const handleHypothesis = (h: HypothesisData) => {
    setHypothesis(h)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📊 FX Learning App</h1>
        <span className="subtitle">AIと学ぶテクニカル分析</span>
        {delayNote && <span className="delay-note">⚠️ {delayNote}</span>}
      </header>

      <div className="app-layout">
        <div className="chart-section">
          <ChartControls
            pair={pair}
            interval={interval}
            period={period}
            visibleIndicators={visibleIndicators}
            onIntervalChange={setInterval_}
            onPeriodChange={setPeriod}
            onToggleIndicator={handleToggleIndicator}
            onRefresh={loadChart}
          />

          {error && <div className="error-banner">{error}</div>}
          {loading && <div className="loading-overlay">読み込み中...</div>}

          <CandlestickChart
            candles={candles}
            indicators={indicators}
            hypothesis={hypothesis}
            visibleIndicators={visibleIndicators}
          />

          <HypothesisPanel hypothesis={hypothesis} />
        </div>

        <div className="chat-section">
          <ChatPanel
            pair={pair}
            interval={interval}
            onHypothesis={handleHypothesis}
          />
        </div>
      </div>
    </div>
  )
}
