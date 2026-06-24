/**
 * CandlestickChart component using TradingView Lightweight Charts.
 * Displays OHLC candles with optional indicator overlays.
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
}

export function CandlestickChart({ candles, indicators, hypothesis, visibleIndicators }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const lineSeriesRefs = useRef<Map<string, ISeriesApi<'Line'>>>(new Map())

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
    })

    chartRef.current = chart
    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
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

    // Clear old line series
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

    // Draw hypothesis lines
    if (hypothesis) {
      if (hypothesis.target_price) {
        const targetSeries = chartRef.current.addLineSeries({
          color: '#4caf50',
          lineWidth: 2,
          lineStyle: 2, // dashed
          title: `Target: ${hypothesis.target_price}`,
        })
        const lastTime = (new Date(candles[candles.length - 1].timestamp).getTime() / 1000) as any
        targetSeries.setData([
          { time: lastTime, value: hypothesis.target_price },
        ])
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
        stopSeries.setData([
          { time: lastTime, value: hypothesis.stop_price },
        ])
        lineSeriesRefs.current.set('hypothesis_stop', stopSeries)
      }
    }
  }, [indicators, visibleIndicators, hypothesis, candles])

  return (
    <div
      ref={chartContainerRef}
      style={{ width: '100%', position: 'relative' }}
    />
  )
}
