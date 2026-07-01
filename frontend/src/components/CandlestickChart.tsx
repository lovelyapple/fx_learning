/**
 * CandlestickChart component using TradingView Lightweight Charts.
 * Displays OHLC candles with optional indicator overlays.
 * Supports drag-to-select candle range for AI context.
 */

import { useEffect, useRef } from 'react'
import { createChart, IChartApi, ISeriesApi, LineData, WhitespaceData, SeriesMarker, Time } from 'lightweight-charts'
import { config } from '@/config'
import type { CandleData, IndicatorData, HypothesisData } from '@/types'

interface Props {
  candles: CandleData[]
  indicators: IndicatorData[]
  hypothesis: HypothesisData | null
  visibleIndicators: string[]
  selectedCandles?: CandleData[]
  refHighlightIndices?: number[]
  refHighlightTimestamps?: string[]
  onSelectionChange?: (selected: CandleData[]) => void
  onSingleCandleClick?: (candle: CandleData | null) => void
  focusTimestamp?: string | null
  rsiBodyRef?: React.RefObject<HTMLDivElement | null>  // RSIチャートをレンダリングするDOM(外部から渡す)
}

export function CandlestickChart({ candles, indicators, hypothesis, visibleIndicators, selectedCandles, refHighlightIndices, refHighlightTimestamps, onSelectionChange, onSingleCandleClick, focusTimestamp, rsiBodyRef: externalRsiBodyRef }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)
  const selectionOverlayRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const rsiChartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const selectionSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const hoverSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const lineSeriesRefs = useRef<Map<string, ISeriesApi<'Line'>>>(new Map())
  const rsiSeriesListRef = useRef<ISeriesApi<'Line'>[]>([])

  const selectedCandlesRef = useRef<CandleData[]>([])
  const selectedMarkersRef = useRef<SeriesMarker<Time>[]>([])
  const refMarkersRef = useRef<SeriesMarker<Time>[]>([])
  const hoveredCandleRef = useRef<CandleData | null>(null)
  const syncMarkers = () => {
    if (!candleSeriesRef.current) return
    const merged = [...selectedMarkersRef.current, ...refMarkersRef.current]
      .sort((a, b) => (a.time as number) - (b.time as number))
    candleSeriesRef.current.setMarkers(merged)
  }

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
        lockVisibleTimeRangeOnResize: true,
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

    // ResizeObserver でサイドバー開閉など親要素のサイズ変化を検知
    const ro = new ResizeObserver(() => {
      if (chartContainerRef.current)
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
    })
    if (chartContainerRef.current) ro.observe(chartContainerRef.current)

    // RSI同期のみ（スクロール位置保存は不要になった）
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      const rsiChart = rsiChartRef.current
      if (!rsiChart || !range) return
      try { rsiChart.timeScale().setVisibleLogicalRange(range) } catch {}
    })

    return () => {
      window.removeEventListener('resize', handleResize)
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      selectionSeriesRef.current = null
      hoverSeriesRef.current = null
      lineSeriesRefs.current.clear()
    }
  }, [])

  // RSI sub-chart init — rsiBodyRef は外部(info-panel)から渡されたDOMに描画
  useEffect(() => {
    const rsiBody = externalRsiBodyRef?.current
    if (!rsiBody) return

    const width = rsiBody.offsetWidth || chartContainerRef.current?.offsetWidth || 600

    const rsiChart = createChart(rsiBody, {
      width,
      height: config.rsiChartHeight,
      layout: { background: { color: '#1a1a2e' }, textColor: '#d1d4dc' },
      grid: { vertLines: { color: '#2B2B43' }, horzLines: { color: '#2B2B43' } },
      crosshair: {
        mode: 0,
        vertLine: { color: '#758696', width: 1, style: 1, labelBackgroundColor: '#2B2B43' },
        horzLine: { color: '#758696', width: 1, style: 1, labelBackgroundColor: '#2B2B43' },
      },
      timeScale: { timeVisible: true, secondsVisible: false, visible: false, lockVisibleTimeRangeOnResize: true },
      handleScroll: false,  // RSI単独スクロール禁止。メインチャートに同期
      handleScale: false,   // RSI単独ズーム禁止
    })
    rsiChartRef.current = rsiChart


    const handleResize = () => {
      const w = externalRsiBodyRef?.current?.offsetWidth || chartContainerRef.current?.offsetWidth || 600
      rsiChart.applyOptions({ width: w })
    }
    window.addEventListener('resize', handleResize)

    const roRsi = new ResizeObserver(() => {
      const w = externalRsiBodyRef?.current?.offsetWidth || chartContainerRef.current?.offsetWidth || 600
      rsiChart.applyOptions({ width: w })
    })
    if (externalRsiBodyRef?.current) roRsi.observe(externalRsiBodyRef.current)

    return () => {
      window.removeEventListener('resize', handleResize)
      roRsi.disconnect()
      rsiChart.remove()
      rsiChartRef.current = null
    }
  }, [])

  // Candle data
  useEffect(() => {
    if (!candleSeriesRef.current || !candles.length) return
    const toBar = (c: CandleData) => ({
      time: (new Date(c.timestamp).getTime() / 1000) as any,
      open: c.open, high: c.high, low: c.low, close: c.close,
    })
    candleSeriesRef.current.setData(candles.map(toBar))
    if (selectedMarkersRef.current.length) syncMarkers()
    if (selectionSeriesRef.current && selectedCandlesRef.current.length) {
      selectionSeriesRef.current.setData(selectedCandlesRef.current.map(toBar))
    }
  }, [candles])

  // Indicators: 構造変更時のみ series を rebuild（scroll resetを防ぐため）
  const indicatorsRef = useRef<IndicatorData[]>([])
  indicatorsRef.current = indicators
  const hypothesisRef = useRef<HypothesisData | null>(null)
  hypothesisRef.current = hypothesis

  const indicatorConfigs: Record<string, { key: keyof IndicatorData; color: string; title: string }> = {
    sma_20:    { key: 'sma_20',    color: '#ff9800', title: 'SMA 20' },
    sma_50:    { key: 'sma_50',    color: '#2196f3', title: 'SMA 50' },
    ema_12:    { key: 'ema_12',    color: '#9c27b0', title: 'EMA 12' },
    ema_26:    { key: 'ema_26',    color: '#e91e63', title: 'EMA 26' },
    bb_upper:  { key: 'bb_upper',  color: '#607d8b', title: 'BB Upper' },
    bb_middle: { key: 'bb_middle', color: '#607d8b', title: 'BB Middle' },
    bb_lower:  { key: 'bb_lower',  color: '#607d8b', title: 'BB Lower' },
  }

  // visibleIndicators / hypothesis が変わった時だけ series を作り直す
  useEffect(() => {
    if (!chartRef.current) return
    // 変更前の位置を直接チャートAPIから読む（userTimeRangeRef不要）
    const tr = chartRef.current.timeScale().getVisibleRange()
    const saved = tr ? { from: tr.from as number, to: tr.to as number } : null

    lineSeriesRefs.current.forEach(s => chartRef.current?.removeSeries(s))
    lineSeriesRefs.current.clear()

    const inds = indicatorsRef.current
    for (const id of visibleIndicators) {
      const cfg = indicatorConfigs[id]
      if (!cfg || !inds.length) continue
      const data: LineData[] = inds
        .filter(ind => ind[cfg.key] !== null)
        .map(ind => ({ time: (new Date(ind.timestamp).getTime() / 1000) as any, value: ind[cfg.key] as number }))
      if (!data.length) continue
      const s = chartRef.current.addLineSeries({ color: cfg.color, lineWidth: 1, title: cfg.title })
      s.setData(data)
      lineSeriesRefs.current.set(id, s)
    }
    const hypo = hypothesisRef.current
    const lastInd = inds[inds.length - 1]
    if (hypo && lastInd) {
      const lastTime = (new Date(lastInd.timestamp).getTime() / 1000) as any
      if (hypo.target_price) {
        const s = chartRef.current.addLineSeries({ color: '#4caf50', lineWidth: 2, lineStyle: 2, title: `Target: ${hypo.target_price}` })
        s.setData([{ time: lastTime, value: hypo.target_price }])
        lineSeriesRefs.current.set('hypothesis_target', s)
      }
      if (hypo.stop_price) {
        const s = chartRef.current.addLineSeries({ color: '#f44336', lineWidth: 2, lineStyle: 2, title: `Stop: ${hypo.stop_price}` })
        s.setData([{ time: lastTime, value: hypo.stop_price }])
        lineSeriesRefs.current.set('hypothesis_stop', s)
      }
    }
    // addLineSeries/removeSeries後のrefitをsetTimeoutで上書き復元
    if (saved) {
      const restore = () => chartRef.current?.timeScale().setVisibleRange({ from: saved.from as any, to: saved.to as any })
      restore()
      setTimeout(restore, 0)
      setTimeout(restore, 50)
      setTimeout(restore, 150)
    }
  }, [visibleIndicators, hypothesis]) // eslint-disable-line react-hooks/exhaustive-deps

  // Indicators: データ更新時は既存 series に setData() するだけ（removeSeries 不要）
  useEffect(() => {
    if (!lineSeriesRefs.current.size || !indicators.length) return
    for (const [id, series] of lineSeriesRefs.current) {
      const cfg = indicatorConfigs[id]
      if (!cfg) continue
      const data: LineData[] = indicators
        .filter(ind => ind[cfg.key] !== null)
        .map(ind => ({ time: (new Date(ind.timestamp).getTime() / 1000) as any, value: ind[cfg.key] as number }))
      if (data.length) series.setData(data)
    }
    // hypothesis は位置更新だけ（candles の最後の時刻）
    const hypo = hypothesisRef.current
    const lastCandle = candlesRef.current[candlesRef.current.length - 1]
    if (hypo && lastCandle) {
      const lastTime = (new Date(lastCandle.timestamp).getTime() / 1000) as any
      const hTarget = lineSeriesRefs.current.get('hypothesis_target')
      if (hTarget && hypo.target_price) hTarget.setData([{ time: lastTime, value: hypo.target_price }])
      const hStop = lineSeriesRefs.current.get('hypothesis_stop')
      if (hStop && hypo.stop_price) hStop.setData([{ time: lastTime, value: hypo.stop_price }])
    }
  }, [indicators]) // eslint-disable-line react-hooks/exhaustive-deps

  // RSI: visibleIndicators 変更時のみ series を rebuild
  useEffect(() => {
    const rsiChart = rsiChartRef.current
    if (!rsiChart) return
    rsiSeriesListRef.current.forEach(s => { try { rsiChart.removeSeries(s) } catch {} })
    rsiSeriesListRef.current = []
    if (!visibleIndicators.includes('rsi') || !indicatorsRef.current.length) return
    if (externalRsiBodyRef?.current) {
      rsiChart.applyOptions({ width: chartContainerRef.current?.offsetWidth || 600 })
    }
    const allData: (LineData | WhitespaceData)[] = indicatorsRef.current.map(ind => {
      const time = (new Date(ind.timestamp).getTime() / 1000) as any
      return ind.rsi === null ? { time } : { time, value: ind.rsi as number }
    })
    if (!indicatorsRef.current.some(i => i.rsi !== null)) return
    const rsiSeries = rsiChart.addLineSeries({ color: '#ce93d8', lineWidth: 2, title: 'RSI' })
    rsiSeries.setData(allData)
    const ob = rsiChart.addLineSeries({ color: 'rgba(244,67,54,0.6)', lineWidth: 1, lineStyle: 2, lastValueVisible: false, priceLineVisible: false })
    ob.setData(allData.map(d => ({ time: d.time, value: 70 })))
    const os = rsiChart.addLineSeries({ color: 'rgba(76,175,80,0.6)', lineWidth: 1, lineStyle: 2, lastValueVisible: false, priceLineVisible: false })
    os.setData(allData.map(d => ({ time: d.time, value: 30 })))
    rsiSeriesListRef.current = [rsiSeries, ob, os]
    requestAnimationFrame(() => {
      const range = chartRef.current?.timeScale().getVisibleLogicalRange()
      if (range) rsiChart.timeScale().setVisibleLogicalRange(range)
    })
  }, [visibleIndicators]) // eslint-disable-line react-hooks/exhaustive-deps

  // RSI: データ更新時は既存 series に setData() するだけ
  useEffect(() => {
    const [rsiSeries, ob, os] = rsiSeriesListRef.current
    if (!rsiSeries || !indicators.length) return
    const allData: (LineData | WhitespaceData)[] = indicators.map(ind => {
      const time = (new Date(ind.timestamp).getTime() / 1000) as any
      return ind.rsi === null ? { time } : { time, value: ind.rsi as number }
    })
    rsiSeries.setData(allData)
    ob.setData(allData.map(d => ({ time: d.time, value: 70 })))
    os.setData(allData.map(d => ({ time: d.time, value: 30 })))
  }, [indicators])

  // AI referenced candles highlight — merge both index and timestamp sources
  useEffect(() => {
    if (!candleSeriesRef.current) return

    if (refHighlightTimestamps && refHighlightTimestamps.length > 0) {
      const tsSet = new Set(refHighlightTimestamps.map(ts => new Date(ts).getTime()))
      const markers: SeriesMarker<Time>[] = candles
        .filter(c => tsSet.has(new Date(c.timestamp).getTime()))
        .map(c => ({
          time: (new Date(c.timestamp).getTime() / 1000) as Time,
          position: 'belowBar' as const, color: '#2196f3', shape: 'arrowUp' as const, text: 'AI', size: 1,
        }))
      refMarkersRef.current = markers
      syncMarkers()
      return
    }

    if (refHighlightIndices && refHighlightIndices.length > 0 && selectedCandles && selectedCandles.length > 0) {
      const markers: SeriesMarker<Time>[] = refHighlightIndices
        .map(idx => selectedCandles[idx - 1])
        .filter(Boolean)
        .map(c => ({
          time: (new Date(c.timestamp).getTime() / 1000) as Time,
          position: 'belowBar' as const, color: '#ff9800', shape: 'arrowUp' as const, text: 'AI', size: 1,
        }))
      refMarkersRef.current = markers
      syncMarkers()
      return
    }

    refMarkersRef.current = []
    syncMarkers()
  }, [refHighlightIndices, refHighlightTimestamps, selectedCandles, candles])

  // Drag selection

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
      selectedCandlesRef.current = []
      selectedMarkersRef.current = []
      refMarkersRef.current = []
      syncMarkers()
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
      // bubbles: false で上位要素に再浮上させない（無限ループ防止）
      const canvas = chartContainerRef.current?.querySelector('canvas')
      if (canvas) {
        canvas.dispatchEvent(new MouseEvent('mousemove', {
          bubbles: false, cancelable: true,
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
          selectedCandlesRef.current = [candle]
          selectedMarkersRef.current = markers
          syncMarkers()
          onSingleCandleClickRef.current?.(candle)
          onSelectionChangeRef.current?.([candle])
        } else {
          selectionSeriesRef.current?.setData([])
          selectedCandlesRef.current = []
          selectedMarkersRef.current = []
          refMarkersRef.current = []
          syncMarkers()
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
        selectedCandlesRef.current = selected
        selectedMarkersRef.current = markers
        syncMarkers()
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

  // focusTimestamp: チャートをその足にスクロールする
  useEffect(() => {
    if (!focusTimestamp || !chartRef.current || !candles.length) return
    const targetMs = new Date(focusTimestamp).getTime()
    const idx = candles.findIndex(c => Math.abs(new Date(c.timestamp).getTime() - targetMs) < 60_000)
    if (idx < 0) return
    const halfWindow = 20
    chartRef.current.timeScale().setVisibleLogicalRange({
      from: Math.max(0, idx - halfWindow),
      to: Math.min(candles.length - 1, idx + halfWindow),
    })
  }, [focusTimestamp, candles])

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
