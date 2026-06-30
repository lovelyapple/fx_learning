/**
 * ChartControls - interval/period selector and indicator toggles.
 */

import { config } from '@/config'

interface Props {
  pair: string
  interval: string
  period: string
  visibleIndicators: string[]
  onIntervalChange: (v: string) => void
  onPeriodChange: (v: string) => void
  onToggleIndicator: (id: string) => void
  onRefresh: () => void
}

const INDICATOR_OPTIONS = [
  { id: 'sma_20', label: 'SMA 20', color: '#ff9800' },
  { id: 'sma_50', label: 'SMA 50', color: '#2196f3' },
  { id: 'ema_12', label: 'EMA 12', color: '#9c27b0' },
  { id: 'ema_26', label: 'EMA 26', color: '#e91e63' },
  { id: 'bb_upper', label: 'BB Upper', color: '#607d8b' },
  { id: 'bb_middle', label: 'BB Mid', color: '#607d8b' },
  { id: 'bb_lower', label: 'BB Lower', color: '#607d8b' },
  { id: 'rsi', label: 'RSI 14', color: '#ce93d8' },
]

export function ChartControls({
  pair,
  interval,
  period,
  visibleIndicators,
  onIntervalChange,
  onPeriodChange,
  onToggleIndicator,
  onRefresh,
}: Props) {
  return (
    <div className="chart-controls">
      <div className="control-group">
        <label>通貨ペア</label>
        <span className="pair-display">{pair}</span>
      </div>

      <div className="control-group">
        <label>時間足</label>
        <div className="button-group">
          {config.intervals.map(i => (
            <button
              key={i}
              className={interval === i ? 'active' : ''}
              onClick={() => onIntervalChange(i)}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="control-group">
        <label>期間</label>
        <div className="button-group">
          {config.periods.map(p => (
            <button
              key={p}
              className={period === p ? 'active' : ''}
              onClick={() => onPeriodChange(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="control-group">
        <label>テクニカル指標</label>
        <div className="indicator-toggles">
          {INDICATOR_OPTIONS.map(ind => (
            <label key={ind.id} className="indicator-toggle">
              <input
                type="checkbox"
                checked={visibleIndicators.includes(ind.id)}
                onChange={() => onToggleIndicator(ind.id)}
              />
              <span style={{ color: ind.color }}>{ind.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button className="refresh-btn" onClick={onRefresh}>
        🔄 更新
      </button>
    </div>
  )
}
