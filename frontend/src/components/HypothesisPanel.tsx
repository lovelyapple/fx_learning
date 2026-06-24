/**
 * HypothesisPanel - displays AI hypothesis and allows resolution.
 */

import type { HypothesisData } from '@/types'

interface Props {
  hypothesis: HypothesisData | null
}

const DIRECTION_EMOJI = {
  up: '📈',
  down: '📉',
  sideways: '➡️',
}

const CONFIDENCE_LABEL = {
  high: '高',
  medium: '中',
  low: '低',
}

export function HypothesisPanel({ hypothesis }: Props) {
  if (!hypothesis) return null

  return (
    <div className="hypothesis-panel">
      <h4>🎯 学習用シナリオ（仮説）</h4>
      <div className="hypothesis-content">
        <div className="hypothesis-header">
          <span className="direction">
            {DIRECTION_EMOJI[hypothesis.direction]} {hypothesis.direction.toUpperCase()}
          </span>
          <span className={`confidence ${hypothesis.confidence}`}>
            確信度: {CONFIDENCE_LABEL[hypothesis.confidence]}
          </span>
        </div>

        <div className="hypothesis-prices">
          <div>基準価格: <strong>{hypothesis.base_price}</strong></div>
          {hypothesis.entry_price && <div>エントリー: {hypothesis.entry_price}</div>}
          {hypothesis.target_price && (
            <div className="target">ターゲット: {hypothesis.target_price}</div>
          )}
          {hypothesis.stop_price && (
            <div className="stop">ストップ: {hypothesis.stop_price}</div>
          )}
          {hypothesis.horizon_candles && (
            <div>想定期間: {hypothesis.horizon_candles}本</div>
          )}
        </div>

        <div className="hypothesis-reasoning">
          <strong>根拠:</strong> {hypothesis.reasoning}
        </div>

        {hypothesis.invalidation_condition && (
          <div className="hypothesis-invalidation">
            <strong>無効化条件:</strong> {hypothesis.invalidation_condition}
          </div>
        )}

        {hypothesis.indicators_used.length > 0 && (
          <div className="hypothesis-indicators">
            使用指標: {hypothesis.indicators_used.join(', ')}
          </div>
        )}
      </div>

      <div className="hypothesis-disclaimer">
        ⚠️ これは学習用シナリオです。投資助言ではありません。
      </div>
    </div>
  )
}
