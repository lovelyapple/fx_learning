/**
 * PatternSidebar - collapsible left sidebar.
 * When open and a single candle is selected, shows the best matching pattern.
 * Collapse state is persisted in localStorage.
 */

import type { CandleData } from '@/types'
import type { CandlePattern, CandleSign } from '@/data/candlePatterns'
import { matchPattern } from '@/data/candlePatterns'

interface Props {
  isOpen: boolean
  onToggle: () => void
  selectedCandle: CandleData | null
}

function CandleSVG({ svg }: { svg: CandlePattern['svg'] }) {
  const W = 40, H = 90
  const cx = W / 2
  const bw = 16
  const hy  = svg.highN * H
  const bty = svg.bodyTopN * H
  const bby = svg.bodyBottomN * H
  const ly  = svg.lowN * H
  const bodyH = Math.max(bby - bty, 2)
  const color = svg.bull ? '#ef5350' : '#26a69a'
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <line x1={cx} y1={hy}  x2={cx} y2={bty} stroke={color} strokeWidth={2} />
      <rect x={cx - bw / 2} y={bty} width={bw} height={bodyH} fill={color} rx={1} />
      <line x1={cx} y1={bby} x2={cx} y2={ly}  stroke={color} strokeWidth={2} />
    </svg>
  )
}

function SignBadge({ sign, label }: { sign: CandleSign; label: string }) {
  const cls = sign === 'bullish' ? 'badge-bullish' : sign === 'bearish' ? 'badge-bearish' : 'badge-neutral'
  return <span className={`pattern-sign-badge ${cls}`}>{label}</span>
}

export function PatternSidebar({ isOpen, onToggle, selectedCandle }: Props) {
  const match = isOpen && selectedCandle
    ? matchPattern({ open: selectedCandle.open, high: selectedCandle.high, low: selectedCandle.low, close: selectedCandle.close })
    : null

  return (
    <div className={`pattern-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Toggle button — always visible */}
      <button className="sidebar-toggle-btn" onClick={onToggle} title={isOpen ? 'サイドバーを閉じる' : 'パターン分析を開く'}>
        {isOpen ? '◀' : '▶'}
        {!isOpen && <span className="sidebar-toggle-label">パ<br/>タ<br/>ー<br/>ン</span>}
      </button>

      {/* Content — only visible when open */}
      {isOpen && (
        <div className="sidebar-content">
          <div className="sidebar-title">🔍 パターン分析</div>

          {!selectedCandle && (
            <div className="sidebar-empty">
              <p>ローソク足を<br />クリックして<br />分析</p>
            </div>
          )}

          {selectedCandle && !match && (
            <div className="sidebar-empty">
              <p>明確なパターンが<br />見当たりません</p>
              <div className="sidebar-candle-info">
                <small>O: {selectedCandle.open.toFixed(3)}</small>
                <small>H: {selectedCandle.high.toFixed(3)}</small>
                <small>L: {selectedCandle.low.toFixed(3)}</small>
                <small>C: {selectedCandle.close.toFixed(3)}</small>
              </div>
            </div>
          )}

          {selectedCandle && match && (
            <div className="sidebar-match">
              <div className="sidebar-match-visual">
                <CandleSVG svg={match.pattern.svg} />
                <div className="sidebar-match-score">
                  一致度 {Math.round(match.score * 100)}%
                </div>
              </div>
              <div className="sidebar-match-names">
                <div className="sidebar-match-name-jp">{match.pattern.name}</div>
                <div className="sidebar-match-name-en">{match.pattern.nameEn}</div>
              </div>
              <SignBadge sign={match.pattern.sign} label={match.pattern.signLabel} />
              <div className="sidebar-match-section">
                <div className="sidebar-match-label">形状</div>
                <p>{match.pattern.description}</p>
              </div>
              <div className="sidebar-match-section">
                <div className="sidebar-match-label">意味・サイン</div>
                <p>{match.pattern.meaning}</p>
              </div>
              <div className="sidebar-candle-info">
                <small>O: {selectedCandle.open.toFixed(3)}</small>
                <small>H: {selectedCandle.high.toFixed(3)}</small>
                <small>L: {selectedCandle.low.toFixed(3)}</small>
                <small>C: {selectedCandle.close.toFixed(3)}</small>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
