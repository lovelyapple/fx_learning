/**
 * Main App component - FX Learning Application.
 */

import { useState, useEffect, useCallback } from 'react'
import { CandlestickChart } from '@/components/CandlestickChart'
import { ChatPanel } from '@/components/ChatPanel'
import { ChartControls } from '@/components/ChartControls'
import { HypothesisPanel } from '@/components/HypothesisPanel'
import { PatternLibrary } from '@/components/PatternLibrary'
import { PatternSidebar } from '@/components/PatternSidebar'
import { Glossary } from '@/components/Glossary'
import { fetchChart, fetchLivePrice } from '@/services/api'
import { config } from '@/config'
import type { CandleData, IndicatorData, HypothesisData, ChatMessage } from '@/types'

const SIDEBAR_KEY = 'fx_pattern_sidebar_open'

export default function App() {
  const [pair] = useState(config.defaultPair as string)
  const [interval, setInterval_] = useState(config.defaultInterval as string)
  const [period, setPeriod] = useState(config.defaultPeriod as string)
  const [candles, setCandles] = useState<CandleData[]>([])
  const [indicators, setIndicators] = useState<IndicatorData[]>([])
  const [hypothesis, setHypothesis] = useState<HypothesisData | null>(null)
  const [selectedCandles, setSelectedCandles] = useState<CandleData[]>([])
  const [singleSelectedCandle, setSingleSelectedCandle] = useState<CandleData | null>(null)
  const [visibleIndicators, setVisibleIndicators] = useState<string[]>(['sma_20', 'sma_50'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [delayNote, setDelayNote] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [livePrice, setLivePrice] = useState<number | null>(null)
  const [prevPrice, setPrevPrice] = useState<number | null>(null)
  const [view, setView] = useState<'chart' | 'patterns' | 'glossary'>('chart')
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(
    () => localStorage.getItem(SIDEBAR_KEY) === 'true'
  )
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [refHighlightIndices, setRefHighlightIndices] = useState<number[]>([])
  const [refHighlightTimestamps, setRefHighlightTimestamps] = useState<string[]>([])
  const [focusTimestamp, setFocusTimestamp] = useState<string | null>(null)

  const handleHighlightCandles = useCallback((indices: number[], _source: 'selected') => {
    setRefHighlightIndices(indices)
    setRefHighlightTimestamps([])
  }, [])

  const handleHighlightTimestamps = useCallback((timestamps: string[]) => {
    setRefHighlightTimestamps(timestamps)
    setRefHighlightIndices([])
  }, [])

  const handleFocusTimestamp = useCallback((ts: string) => {
    setFocusTimestamp(ts)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return next
    })
  }

  const loadChart = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchChart(pair, interval, period)
      setCandles(data.candles)
      setIndicators(data.indicators)
      setDelayNote(data.delay_note)
      setLastUpdated(new Date())
    } catch (err) {
      setError('チャートデータの取得に失敗しました。バックエンドが起動しているか確認してください。')
    } finally {
      setLoading(false)
    }
  }, [pair, interval, period])

  useEffect(() => {
    loadChart()
    const timer = setInterval(loadChart, config.autoRefreshIntervalMs)
    return () => clearInterval(timer)
  }, [loadChart])

  // Live price: 10秒ごとに更新
  useEffect(() => {
    const loadPrice = async () => {
      try {
        const res = await fetchLivePrice(pair)
        setLivePrice(prev => { setPrevPrice(prev); return res.price })
      } catch { /* silent */ }
    }
    loadPrice()
    const timer = setInterval(loadPrice, config.livePriceIntervalMs)
    return () => clearInterval(timer)
  }, [pair])

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

  const handleSingleCandleClick = (candle: CandleData | null) => {
    setSingleSelectedCandle(candle)
  }

  const handleSelectionChange = (selected: CandleData[]) => {
    setSelectedCandles(selected)
    // 範囲選択（複数）のときは単独選択をクリア
    if (selected.length > 1) setSingleSelectedCandle(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📊 FX Learning App</h1>
        <span className="subtitle">AIと学ぶテクニカル分析</span>
        {/* ビュー切り替えボタン */}
        <div className="view-tabs">
          <button
            className={`view-tab-btn ${view === 'chart' ? 'active' : ''}`}
            onClick={() => setView('chart')}
          >📈 チャート</button>
          <button
            className={`view-tab-btn ${view === 'patterns' ? 'active' : ''}`}
            onClick={() => setView('patterns')}
          >📚 パターン集</button>
          <button
            className={`view-tab-btn ${view === 'glossary' ? 'active' : ''}`}
            onClick={() => setView('glossary')}
          >📖 用語集</button>
        </div>
        {delayNote && <span className="delay-note">⚠️ {delayNote}</span>}
        {livePrice !== null && (
          <span className={`live-price ${prevPrice !== null && livePrice > prevPrice ? 'up' : prevPrice !== null && livePrice < prevPrice ? 'down' : ''}`}>
            ● {livePrice.toFixed(3)}
            {prevPrice !== null && livePrice !== prevPrice && (
              <span className="price-change">{livePrice > prevPrice ? ' ▲' : ' ▼'}</span>
            )}
          </span>
        )}
        {lastUpdated && (
          <span className="last-updated">🔄 {lastUpdated.toLocaleTimeString('ja-JP')} 更新（30秒自動更新）</span>
        )}
      </header>

      {view === 'patterns' ? (
        <div className="pattern-library-page">
          <PatternLibrary />
        </div>
      ) : view === 'glossary' ? (
        <div className="pattern-library-page">
          <Glossary />
        </div>
      ) : (
        <div className="app-layout" style={{ gridTemplateColumns: `${sidebarOpen ? '280px' : '40px'} 1fr 380px` }}>
          <PatternSidebar
            isOpen={sidebarOpen}
            onToggle={toggleSidebar}
            selectedCandle={singleSelectedCandle}
          />

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
              onSelectionChange={handleSelectionChange}
              onSingleCandleClick={handleSingleCandleClick}
              refHighlightIndices={refHighlightIndices}
              refHighlightTimestamps={refHighlightTimestamps}
              selectedCandles={selectedCandles}
              focusTimestamp={focusTimestamp}
            />

            <HypothesisPanel hypothesis={hypothesis} />
          </div>

          <div className="chat-section">
            <ChatPanel
              pair={pair}
              interval={interval}
              selectedCandles={selectedCandles}
              onHypothesis={handleHypothesis}
              messages={chatMessages}
              onMessagesChange={setChatMessages}
              onHighlightCandles={handleHighlightCandles}
              onHighlightTimestamps={handleHighlightTimestamps}
              onFocusTimestamp={handleFocusTimestamp}
            />
          </div>
        </div>
      )}
    </div>
  )
}

