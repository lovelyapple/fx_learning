/**
 * CandlestickChart component using TradingView Lightweight Charts.
 * Displays OHLC candles with optional indicator overlays.
 * Supports drag-to-select candle range for AI context.
 */

import { useEffect, useRef, useState } from 'react'
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
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const lineSeriesRefs = useRef<Map<string, ISeriesApi<'Line'>>>(new Map())

  // Selection state
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const [selectionRect, setSelectionRect] = useState<{ left: number; width: number } | null>(null)

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: config.chartHeight,
      layout: {
        background: { color: '#1a1a2e' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2B2B43' },
        horzLines: { color: '#2B2B43' },
      },
      crosshair: { mode: 0 },
      timeScale: { timeVisible: true, secondsVisible: false },
      // マウスドラッグは選択に使うため無効化。2本指/ホイールはそのまま有効
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
      lineSeriesRefs.current.clear()
    }
  }, [])

  // Update candle data
  useEffect(() => {
    if (!candleSeriesRef.current || !candles.length) return

    const chartData: CandlestickData[] = candles.map(c => ({
      time: (new Date(c.timestamp).getTime() / 1000) as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))

    candleSeriesRef.current.setData(chartData)
  }, [candles])

  // Update indicators
  useEffect(() => {
    if (!chartRef.current || !indicators.length) return

    lineSeriesRefs.current.forEach((series) => {
      chartRef.current?.removeSeries(series)
    })
    lineSeriesRefs.current.clear()

    const indicatorConfigs: Record<string, { key: keyof IndicatorData; color: string; title: string }> = {
      sma_20: { key: 'sma_20', color: '#ff9800', title: 'SMA 20' },
      sma_50: { key: 'sma_50', color: '#2196f3', title: 'SMA 50' },
      ema_12: { key: 'ema_12', color: '#9c27b0', title: 'EMA 12' },
      ema_26: { key: 'ema_26', color: '#e91e63', title: 'EMA 26' },
      bb_upper: { key: 'bb_upper', color: '#607d8b', title: 'BB Upper' },
      bb_middle: { key: 'bb_middle', color: '#607d8b', title: 'BB Middle' },
      bb_lower: { key: 'bb_lower', color: '#607d8b', title: 'BB Lower' },
    }

    for (const id of visibleIndicators) {
      const cfg = indicatorConfigs[id]
      if (!cfg) continue

      const data: LineData[] = indicators
        .filter(ind => ind[cfg.key] !== null)
        .map(ind => ({
          time: (new Date(ind.timestamp).getTime() / 1000) as any,
          value: ind[cfg.key] as number,
        }))

      if (!data.length) continue

      const series = chartRef.current.addLineSeries({
        color: cfg.color,
        lineWidth: 1,
        title: cfg.title,
      })
      series.setData(data)
      lineSeriesRefs.current.set(id, series)
    }

    if (hypothesis) {
      if (hypothesis.target_price) {
        const targetSeries = chartRef.current.addLineSeries({
          color: '#4caf50',
          lineWidth: 2,
          lineStyle: 2,
          title: `Target: ${hypothesis.target_price}`,
        })
        const lastTime = (new Date(candles[candles.length - 1].timestamp).getTime() / 1000) as any
        targetSeries.setData([{ time: lastTime, value: hypothesis.target_price }])
        lineSeriesRefs.current.set('hypothesis_target', targetSeries)
      }
      if (hypothesis.stop_price) {
        const stopSeries = chartRef.current.addLineSeries({
          color: '#f44336',
          lineWidth: 2,
          lineStyle: 2,
          title: `Stop: ${hypothesis.stop_price}`,
        })
        const lastTime = (new Date(candles[candles.length - 1].timestamp).getTime() / 1000) as any
        stopSeries.setData([{ time: lastTime, value: hypothesis.stop_price }])
        lineSeriesRefs.current.set('hypothesis_stop', stopSeries)
      }
    }
  }, [indicators, visibleIndicators, hypothesis, candles])

  // --- Drag selection handlers ---
  const getRelativeX = (e: React.MouseEvent) => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    return rect ? e.clientX - rect.left : 0
  }

  const resolveSelectedCandles = (x1: number, x2: number): CandleData[] => {
    const chart = chartRef.current
    if (!chart || !candles.length) return []
    const left = Math.min(x1, x2)
    const right = Math.max(x1, x2)
    const startTime = chart.timeScale().coordinateToTime(left) as number | null
    const endTime = chart.timeScale().coordinateToTime(right) as number | null
    if (startTime == null || endTime == null) return []
    return candles.filter(c => {
      const t = new Date(c.timestamp).getTime() / 1000
      return t >= startTime && t <= endTime
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    const x = getRelativeX(e)
    isDragging.current = true
    dragStartX.current = x
    setSelectionRect(null)
    onSelectionChange?.([])
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    const x = getRelativeX(e)
    const left = Math.min(dragStartX.current, x)
    const width = Math.abs(x - dragStartX.current)
    if (width > 4) {
      setSelectionRect({ left, width })
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    isDragging.current = false
    const x = getRelativeX(e)
    const width = Math.abs(x - dragStartX.current)
    if (width <= 4) {
      // クリックのみ → 選択解除
      setSelectionRect(null)
      onSelectionChange?.([])
    } else {
      const selected = resolveSelectedCandles(dragStartX.current, x)
      onSelectionChange?.(selected)
    }
  }

  const handleMouseLeave = () => {
    if (isDragging.current) {
      isDragging.current = false
    }
  }

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', position: 'relative', cursor: 'crosshair' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={chartContainerRef} />
      {selectionRect && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: selectionRect.left,
            width: selectionRect.width,
            height: config.chartHeight,
            background: 'rgba(79, 195, 247, 0.15)',
            borderLeft: '1px solid rgba(79, 195, 247, 0.7)',
            borderRight: '1px solid rgba(79, 195, 247, 0.7)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}
