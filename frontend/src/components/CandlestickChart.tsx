/**
 * CandlestickChart component using TradingView Lightweight Charts.
 * Displays OHLC candles with optional indicator overlays.
 * Supports drag-to-select candle range for AI context.
 */

import { useEffect, useRef } from 'react'
import { createChart, IChartApi, ISeriesApi, LineData, SeriesMarker, Time } from 'lightweight-charts'
import { config } from '@/config'
import type { CandleData, IndicatorData, HypothesisData } from '@/types'

interface Props {
  candles: CandleData[]
  indicators: IndicatorData[]
  hypothesis: HypothesisData | null
  visibleIndicators: string[]
  onSelectionChange?: (selected: CandleData[]) => void
  onSingleCandleClick?: (candle: CandleData | null) => void
}

export function CandlestickChart({ candles, indicators, hypothesis, visibleIndicators, onSelectionChange, onSingleCandleClick }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)
  const selectionOverlayRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const selectionSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const hoverSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const lineSeriesRefs = useRef<Map<string, ISeriesApi<'Line'>>>(new Map())

  const selectedCandlesRef = useRef<CandleData[]>([])
  const selectedMarkersRef = useRef<SeriesMarker<Time>[]>([])
  const hoveredCandleRef = useRef<CandleData | null>(null)

  const candlesRef = useRef<CandleData[]>([])
  const onSelectionChangeRef = useRef(onSelectionChange)
  const onSingleCandleClickRef = useRef(onSingleCandleClick)
  useEffect(() => { candlesRef.current = candles }, [candles])
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange }, [onSelectionChange])
  useEffect(() => { onSingleCandleClickRef.current = onSingleCandleClick }, [onSingleCandleClick])

  // Chart init
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: config.chartHeight,
      layout: { background: { color: '#1a1a2e' }, textColor: '#d1d4dc' },
      grid: { vertLines: { color: '#2B2B43' }, horzLines: { color: '#2B2B43' } },
      crosshair: {
        mode: 0,
        vertLine: { color: '#758696', width: 1, style: 1, labelBackgroundColor: '#2B2B43' },
        horzLine: { color: '#758696', width: 1, style: 1, labelBackgroundColor: '#2B2B43' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: number) =>
          new Date(time * 1000).toLocaleTimeString('ja-JP', {
            timeZone: 'Asia/Tokyo',
            hour: '2-digit',
            minute: '2-digit',
          }),
      },
      localization: {
        timeFormatter: (time: number) =>
          new Date(time * 1000).toLocaleTimeString('ja-JP', {
            timeZone: 'Asia/Tokyo',
            hour: '2-digit',
            minute: '2-digit',
          }),
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
    })

    chartRef.current = chart

    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: '#ef5350', downColor: '#26a69a',
      borderVisible: false,
      wickUpColor: '#ef5350', wickDownColor: '#26a69a',
    })

    selectionSeriesRef.current = chart.addCandlestickSeries({
      upColor: 'rgba(255,235,59,0.35)', downColor: 'rgba(255,235,59,0.35)',
      borderVisible: true,
      borderUpColor: '#ffeb3b', borderDownColor: '#ffeb3b',
      wickUpColor: '#ffeb3b', wickDownColor: '#ffeb3b',
      lastValueVisible: false, priceLineVisible: false,
    })

    // ホバーハイライト（緑）
    hoverSeriesRef.current = chart.addCandlestickSeries({
      upColor: 'rgba(76,175,80,0.45)', downColor: 'rgba(76,175,80,0.45)',
      borderVisible: true,
      borderUpColor: '#4caf50', borderDownColor: '#4caf50',
      wickUpColor: '#4caf50', wickDownColor: '#4caf50',
      lastValueVisible: false, priceLineVisible: false,
    })

    // crosshairが動いたときにホバーしているローソク足を追跡
    chart.subscribeCrosshairMove((param) => {
      const all = candlesRef.current
      if (!param.time || !all.length) {
        hoverSeriesRef.current?.setData([])
        hoveredCandleRef.current = null
        return
      }
      const t = param.time as number
      const candle = all.find(c =>
        Math.round(new Date(c.timestamp).getTime() / 1000) === Math.round(t)
      ) ?? null
      hoveredCandleRef.current = candle
      if (candle) {
        hoverSeriesRef.current?.setData([{
          time: t as any,
          open: candle.open, high: candle.high, low: candle.low, close: candle.close,
        }])
      } else {
        hoverSeriesRef.current?.setData([])
      }
    })

    const handleResize = () => {
      if (chartContainerRef.current)
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      selectionSeriesRef.current = null
      hoverSeriesRef.current = null
      lineSeriesRefs.current.clear()
    }
  }, [])

  // Candle data
  useEffect(() => {
    if (!candleSeriesRef.current || !candles.length) return
    // 現在のvisible rangeを保存してピクッを防ぐ
    const visibleRange = chartRef.current?.timeScale().getVisibleLogicalRange()
    candleSeriesRef.current.setData(candles.map(c => ({
      time: (new Date(c.timestamp).getTime() / 1000) as any,
      open: c.open, high: c.high, low: c.low, close: c.close,
    })))
    // 選択状態を再適用（解除しない）
    if (selectedMarkersRef.current.length) {
      candleSeriesRef.current.setMarkers(selectedMarkersRef.current)
    }
    if (selectionSeriesRef.current && selectedCandlesRef.current.length) {
      selectionSeriesRef.current.setData(selectedCandlesRef.current.map(c => ({
        time: (new Date(c.timestamp).getTime() / 1000) as any,
        open: c.open, high: c.high, low: c.low, close: c.close,
      })))
    }
    // visible rangeを復元
    if (visibleRange) {
      chartRef.current?.timeScale().setVisibleLogicalRange(visibleRange)
    }
  }, [candles])

  // Indicators + hypothesis lines
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
      const s = chartRef.current.addLineSeries({ color: cfg.color, lineWidth: 1, title: cfg.title })
      s.setData(data)
      lineSeriesRefs.current.set(id, s)
    }
    if (hypothesis && candles.length) {
      const lastTime = (new Date(candles[candles.length - 1].timestamp).getTime() / 1000) as any
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

  // Drag selection via captureRef (transparent div on top of chart, z-index:2)
  useEffect(() => {
    const capture = captureRef.current
    const overlay = selectionOverlayRef.current
    if (!capture || !overlay) return

    let dragging = false
    let startX = 0

    const getX = (e: MouseEvent) => e.clientX - capture.getBoundingClientRect().left

    const resolveSelected = (x1: number, x2: number): CandleData[] => {
      const chart = chartRef.current
      const all = candlesRef.current
      if (!chart || !all.length) return []
      const l = Math.min(x1, x2), r = Math.max(x1, x2)
      let t1 = chart.timeScale().coordinateToTime(l) as number | null
      let t2 = chart.timeScale().coordinateToTime(r) as number | null
      // チャート端の外側はローソク足の先頭/末尾にクランプ
      if (t1 == null) t1 = new Date(all[0].timestamp).getTime() / 1000
      if (t2 == null) t2 = new Date(all[all.length - 1].timestamp).getTime() / 1000
      return all.filter(c => {
        const t = new Date(c.timestamp).getTime() / 1000
        return t >= t1! && t <= t2!
      })
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      dragging = true
      startX = getX(e)
      overlay.style.display = 'none'
      selectionSeriesRef.current?.setData([])
      candleSeriesRef.current?.setMarkers([])
      selectedCandlesRef.current = []
      selectedMarkersRef.current = []
      onSingleCandleClickRef.current?.(null)
      onSelectionChangeRef.current?.([])
    }

    const onMouseMove = (e: MouseEvent) => {
      // ドラッグ中は選択オーバーレイを更新
      if (dragging) {
        const x = getX(e)
        const w = Math.abs(x - startX)
        if (w > 4) {
          overlay.style.display = 'block'
          overlay.style.left = `${Math.min(startX, x)}px`
          overlay.style.width = `${w}px`
        }
      }
      // 常にチャートcanvasにもmousemoveを転送（crosshair表示のため）
      const canvas = chartContainerRef.current?.querySelector('canvas')
      if (canvas) {
        canvas.dispatchEvent(new MouseEvent('mousemove', {
          bubbles: true, cancelable: true,
          clientX: e.clientX, clientY: e.clientY,
          buttons: e.buttons,
        }))
      }
    }

    const onMouseUp = (e: MouseEvent) => {
      if (!dragging) return
      dragging = false
      const x = getX(e)
      const w = Math.abs(x - startX)
      overlay.style.display = 'none'
      if (w <= 4) {
        // 単独クリック: coordinateToTimeでクリック位置のローソク足を特定
        const chart = chartRef.current
        const all = candlesRef.current
        let candle: CandleData | null = null
        if (chart && all.length) {
          const ct = chart.timeScale().coordinateToTime(x) as number | null
          if (ct != null) {
            // 最も近いタイムスタンプのローソク足を選択
            candle = all.reduce((best, c) => {
              const bt = new Date(best.timestamp).getTime() / 1000
              const nt = new Date(c.timestamp).getTime() / 1000
              return Math.abs(nt - ct) < Math.abs(bt - ct) ? c : best
            })
          }
        }
        if (candle) {
          const t = (new Date(candle.timestamp).getTime() / 1000) as any
          const markers: SeriesMarker<Time>[] = [{
            time: t as Time,
            position: 'aboveBar' as const,
            color: '#ffeb3b',
            shape: 'circle' as const,
            text: '1',
            size: 0,
          }]
          selectionSeriesRef.current?.setData([{
            time: t, open: candle.open, high: candle.high, low: candle.low, close: candle.close,
          }])
          candleSeriesRef.current?.setMarkers(markers)
          selectedCandlesRef.current = [candle]
          selectedMarkersRef.current = markers
          onSingleCandleClickRef.current?.(candle)
          onSelectionChangeRef.current?.([candle])
        } else {
          selectionSeriesRef.current?.setData([])
          candleSeriesRef.current?.setMarkers([])
          selectedCandlesRef.current = []
          selectedMarkersRef.current = []
          onSingleCandleClickRef.current?.(null)
          onSelectionChangeRef.current?.([])
        }
        return
      }
      const selected = resolveSelected(startX, x)
      if (selectionSeriesRef.current && selected.length) {
        selectionSeriesRef.current.setData(selected.map(c => ({
          time: (new Date(c.timestamp).getTime() / 1000) as any,
          open: c.open, high: c.high, low: c.low, close: c.close,
        })))
        // 番号マーカーを設定・保存
        const markers: SeriesMarker<Time>[] = selected.map((c, i) => ({
          time: (new Date(c.timestamp).getTime() / 1000) as Time,
          position: 'aboveBar' as const,
          color: '#ffeb3b',
          shape: 'circle' as const,
          text: String(i + 1),
          size: 0,
        }))
        candleSeriesRef.current?.setMarkers(markers)
        selectedCandlesRef.current = selected
        selectedMarkersRef.current = markers
      }
      onSelectionChangeRef.current?.(selected)
    }

    // wheelイベントをチャートcanvasに転送（2本指スクロール・ズーム維持）
    const onWheel = (e: WheelEvent) => {
      const canvas = chartContainerRef.current?.querySelector('canvas')
      if (!canvas) return
      canvas.dispatchEvent(new WheelEvent('wheel', {
        bubbles: true, cancelable: true,
        deltaX: e.deltaX, deltaY: e.deltaY, deltaMode: e.deltaMode,
        ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey,
        clientX: e.clientX, clientY: e.clientY,
      }))
    }

    capture.addEventListener('mousedown', onMouseDown)
    capture.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      capture.removeEventListener('mousedown', onMouseDown)
      capture.removeEventListener('wheel', onWheel)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div ref={wrapperRef} style={{ width: '100%', position: 'relative' }}>
      {/* チャート本体 */}
      <div ref={chartContainerRef} />

      {/* 透明キャプチャ層: チャートの上に重なりマウスイベントを最初に受け取る */}
      <div
        ref={captureRef}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: config.chartHeight,
          zIndex: 2, cursor: 'crosshair',
        }}
      />

      {/* 選択範囲ハイライト */}
      <div
        ref={selectionOverlayRef}
        style={{
          display: 'none', position: 'absolute', top: 0,
          height: config.chartHeight, zIndex: 3,
          background: 'rgba(79,195,247,0.12)',
          borderLeft: '2px solid rgba(79,195,247,0.8)',
          borderRight: '2px solid rgba(79,195,247,0.8)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
