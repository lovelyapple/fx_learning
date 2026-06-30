/**
 * CandlestickChart component using TradingView Lightweight Charts.
 * Displays OHLC candles with optional indicator overlays.
 * Supports drag-to-select candle range for AI context.
 */

import { useEffect, useRef } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData } from 'lightweight-charts'
import { config } from '@/config'
import type { CandleData, IndicatorData, HypothesisData } from '@/types'

interface Props {
  candles: CandleData[]
  indicators: IndicatorData[]
  hypothesis: HypothesisData | null
  visibleIndicators: string[]
  onSelectionChange?: (selected: CandleData[]) => void
}

export function CandlestickChart({ candles, indicators, hypothesis, visibleIndicators, onSelectionChange }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const selectionOverlayRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const selectionSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const lineSeriesRefs = useRef<Map<string, ISeriesApi<'Line'>>>(new Map())

  // Keep latest values accessible from native event handlers via refs
  const candlesRef = useRef<CandleData[]>([])
  const onSelectionChangeRef = useRef(onSelectionChange)
  useEffect(() => { candlesRef.current = candles }, [candles])
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange }, [onSelectionChange])

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: config.chartHeight,
      layout: { background: { color: '#1a1a2e' }, textColor: '#d1d4dc' },
      grid: { vertLines: { color: '#2B2B43' }, horzLines: { color: '#2B2B43' } },
      crosshair: { mode: 0 },
      timeScale: { timeVisible: true, secondsVisible: false },
      handleScroll: { mouseWheel: true, pressedMouseMove: false, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
    })

    chartRef.current = chart

    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: '#ef5350',
      downColor: '#26a69a',
      borderVisible: false,
      wickUpColor: '#ef5350',
      wickDownColor: '#26a69a',
    })

    // 選択ローソク足ハイライト用（シアン枠）
    selectionSeriesRef.current = chart.addCandlestickSeries({
      upColor: 'rgba(79, 195, 247, 0.25)',
      downColor: 'rgba(79, 195, 247, 0.25)',
      borderVisible: true,
      borderUpColor: '#4fc3f7',
      borderDownColor: '#4fc3f7',
      wickUpColor: '#4fc3f7',
      wickDownColor: '#4fc3f7',
      lastValueVisible: false,
      priceLineVisible: false,
    })

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      selectionSeriesRef.current = null
      lineSeriesRefs.current.clear()
    }
  }, [])

  // Update candle data
  useEffect(() => {
    if (!candleSeriesRef.current || !candles.length) return
    const chartData: CandlestickData[] = candles.map(c => ({
      time: (new Date(c.timestamp).getTime() / 1000) as any,
      open: c.open, high: c.high, low: c.low, close: c.close,
    }))
    candleSeriesRef.current.setData(chartData)
  }, [candles])

  // Update indicators
  useEffect(() => {
    if (!chartRef.current || !indicators.length) return

    lineSeriesRefs.current.forEach(s => chartRef.current?.removeSeries(s))
    lineSeriesRefs.current.clear()

    const indicatorConfigs: Record<string, { key: keyof IndicatorData; color: string; title: string }> = {
      sma_20:    { key: 'sma_20',    color: '#ff9800', title: 'SMA 20' },
      sma_50:    { key: 'sma_50',    color: '#2196f3', title: 'SMA 50' },
      ema_12:    { key: 'ema_12',    color: '#9c27b0', title: 'EMA 12' },
      ema_26:    { key: 'ema_26',    color: '#e91e63', title: 'EMA 26' },
      bb_upper:  { key: 'bb_upper',  color: '#607d8b', title: 'BB Upper' },
      bb_middle: { key: 'bb_middle', color: '#607d8b', title: 'BB Middle' },
      bb_lower:  { key: 'bb_lower',  color: '#607d8b', title: 'BB Lower' },
    }

    for (const id of visibleIndicators) {
      const cfg = indicatorConfigs[id]
      if (!cfg) continue
      const data: LineData[] = indicators
        .filter(ind => ind[cfg.key] !== null)
        .map(ind => ({ time: (new Date(ind.timestamp).getTime() / 1000) as any, value: ind[cfg.key] as number }))
      if (!data.length) continue
      const series = chartRef.current.addLineSeries({ color: cfg.color, lineWidth: 1, title: cfg.title })
      series.setData(data)
      lineSeriesRefs.current.set(id, series)
    }

    if (hypothesis) {
      const lastTime = candles.length ? (new Date(candles[candles.length - 1].timestamp).getTime() / 1000) as any : 0
      if (hypothesis.target_price) {
        const s = chartRef.current.addLineSeries({ color: '#4caf50', lineWidth: 2, lineStyle: 2, title: `Target: ${hypothesis.target_price}` })
        s.setData([{ time: lastTime, value: hypothesis.target_price }])
        lineSeriesRefs.current.set('hypothesis_target', s)
      }
      if (hypothesis.stop_price) {
        const s = chartRef.current.addLineSeries({ color: '#f44336', lineWidth: 2, lineStyle: 2, title: `Stop: ${hypothesis.stop_price}` })
        s.setData([{ time: lastTime, value: hypothesis.stop_price }])
        lineSeriesRefs.current.set('hypothesis_stop', s)
      }
    }
  }, [indicators, visibleIndicators, hypothesis, candles])

  // Drag-selection: native capture-phase listeners (fire before chart canvas handlers)
  useEffect(() => {
    const wrapper = wrapperRef.current
    const overlay = selectionOverlayRef.current
    if (!wrapper || !overlay) return

    let dragging = false
    let startX = 0

    const getX = (e: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect()
      return e.clientX - rect.left
    }

    const showOverlay = (left: number, width: number) => {
      overlay.style.display = 'block'
      overlay.style.left = `${left}px`
      overlay.style.width = `${width}px`
    }

    const hideOverlay = () => {
      overlay.style.display = 'none'
    }

    const resolveSelected = (x1: number, x2: number): CandleData[] => {
      const chart = chartRef.current
      const allCandles = candlesRef.current
      if (!chart || !allCandles.length) return []
      const left = Math.min(x1, x2)
      const right = Math.max(x1, x2)
      const t1 = chart.timeScale().coordinateToTime(left) as number | null
      const t2 = chart.timeScale().coordinateToTime(right) as number | null
      if (t1 == null || t2 == null) return []
      return allCandles.filter(c => {
        const t = new Date(c.timestamp).getTime() / 1000
        return t >= t1 && t <= t2
      })
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      dragging = true
      startX = getX(e)
      hideOverlay()
      selectionSeriesRef.current?.setData([])
      onSelectionChangeRef.current?.([])
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return
      const x = getX(e)
      const w = Math.abs(x - startX)
      if (w > 4) showOverlay(Math.min(startX, x), w)
    }

    const onMouseUp = (e: MouseEvent) => {
      if (!dragging) return
      dragging = false
      const x = getX(e)
      const w = Math.abs(x - startX)
      if (w <= 4) {
        hideOverlay()
        selectionSeriesRef.current?.setData([])
        onSelectionChangeRef.current?.([])
        return
      }
      const selected = resolveSelected(startX, x)
      if (selectionSeriesRef.current && selected.length) {
        selectionSeriesRef.current.setData(selected.map(c => ({
          time: (new Date(c.timestamp).getTime() / 1000) as any,
          open: c.open, high: c.high, low: c.low, close: c.close,
        })))
      }
      onSelectionChangeRef.current?.(selected)
    }

    wrapper.addEventListener('mousedown', onMouseDown, true)
    window.addEventListener('mousemove', onMouseMove, true)
    window.addEventListener('mouseup', onMouseUp, true)

    return () => {
      wrapper.removeEventListener('mousedown', onMouseDown, true)
      window.removeEventListener('mousemove', onMouseMove, true)
      window.removeEventListener('mouseup', onMouseUp, true)
    }
  }, [])

  return (
    <div ref={wrapperRef} style={{ width: '100%', position: 'relative', cursor: 'crosshair' }}>
      <div ref={chartContainerRef} />
      {/* ドラッグ中の選択範囲オーバーレイ */}
      <div
        ref={selectionOverlayRef}
        style={{
          display: 'none',
          position: 'absolute',
          top: 0,
          height: config.chartHeight,
          background: 'rgba(79, 195, 247, 0.12)',
          borderLeft: '2px solid rgba(79, 195, 247, 0.8)',
          borderRight: '2px solid rgba(79, 195, 247, 0.8)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
