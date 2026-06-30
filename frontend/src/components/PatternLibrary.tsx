/**
 * PatternLibrary - full-page reference of typical candlestick patterns.
 */

import type { CandlePattern, CandleSign } from '@/data/candlePatterns'
import { candlePatterns } from '@/data/candlePatterns'

function CandleSVG({ svg }: { svg: CandlePattern['svg'] }) {
  const W = 32, H = 72
  const cx = W / 2
  const bw = 14

  const hy  = svg.highN * H
  const bty = svg.bodyTopN * H
  const bby = svg.bodyBottomN * H
  const ly  = svg.lowN * H
  const bodyH = Math.max(bby - bty, 2)

  const color = svg.bull ? '#ef5350' : '#26a69a'

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <line x1={cx} y1={hy}  x2={cx} y2={bty} stroke={color} strokeWidth={1.5} />
      <rect x={cx - bw / 2} y={bty} width={bw} height={bodyH} fill={color} rx={1} />
      <line x1={cx} y1={bby} x2={cx} y2={ly}  stroke={color} strokeWidth={1.5} />
    </svg>
  )
}

function SignBadge({ sign, label }: { sign: CandleSign; label: string }) {
  const cls = sign === 'bullish' ? 'badge-bullish' : sign === 'bearish' ? 'badge-bearish' : 'badge-neutral'
  return <span className={`pattern-sign-badge ${cls}`}>{label}</span>
}

export function PatternLibrary() {
  return (
    <div className="pattern-library">
      <div className="pattern-library-header">
        <h2>📚 ローソク足パターン集</h2>
        <p className="pattern-library-note">
          典型的なローソク足のパターンとその意味・サインをまとめています。<br />
          ※ パターンはトレンドの文脈と組み合わせて判断してください。単独では確率的な示唆に過ぎません。
        </p>
      </div>
      <div className="pattern-grid">
        {candlePatterns.map(p => (
          <div key={p.id} className="pattern-card">
            <div className="pattern-card-visual">
              <CandleSVG svg={p.svg} />
            </div>
            <div className="pattern-card-info">
              <div className="pattern-card-names">
                <span className="pattern-name-jp">{p.name}</span>
                <span className="pattern-name-en">{p.nameEn}</span>
              </div>
              <SignBadge sign={p.sign} label={p.signLabel} />
              <p className="pattern-desc">{p.description}</p>
              <p className="pattern-meaning"><strong>意味：</strong>{p.meaning}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
