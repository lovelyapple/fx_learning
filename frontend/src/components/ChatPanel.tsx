/**
 * ChatPanel component - AI conversation interface.
 */

import { useRef, useEffect, useCallback } from 'react'
import { useState } from 'react'
import type { ChatMessage, HypothesisData, CandleData } from '@/types'
import { sendChatMessage } from '@/services/api'

interface Props {
  pair: string
  interval: string
  selectedCandles: CandleData[]
  onHypothesis: (h: HypothesisData) => void
  messages: ChatMessage[]
  onMessagesChange: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void
  onHighlightCandles?: (indices: number[], source: 'selected') => void
  onHighlightTimestamps?: (timestamps: string[]) => void
  onFocusTimestamp?: (ts: string) => void
}

/** AIメッセージ内の [足#N] / [C#N] をインラインボタンとしてレンダリング */
function renderWithInlineLinks(
  content: string,
  refCandles: number[] | undefined,           // e.g. [1, 4, 5]
  refSelectedTimestamps: string[] | undefined, // same order as refCandles
  refChartTimestamps: string[] | undefined,
  onClickSelected: (ts: string) => void,
  onClickChart: (ts: string) => void,
) {
  const regex = /(\[足#(\d+)\]|\[C#(\d+)\])/g
  const parts: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let key = 0

  while ((m = regex.exec(content)) !== null) {
    if (m.index > last) parts.push(<span key={key++}>{content.slice(last, m.index)}</span>)

    if (m[2] != null) {
      // [足#N] → refCandles の配列中の位置で refSelectedTimestamps を引く
      const n = parseInt(m[2])
      const pos = refCandles?.indexOf(n) ?? -1
      const ts = pos >= 0 ? (refSelectedTimestamps?.[pos] ?? null) : null
      parts.push(
        <button
          key={key++}
          className={`inline-candle-link${ts ? '' : ' disabled'}`}
          onClick={() => ts && onClickSelected(ts)}
          title={ts ? `足#${n}をハイライト` : `足#${n}は未選択`}
        >
          {m[0]}
        </button>
      )
    } else if (m[3] != null) {
      // [C#N] → refChartTimestamps[N-1]
      const n = parseInt(m[3])
      const ts = refChartTimestamps?.[n - 1]
      parts.push(
        <button
          key={key++}
          className={`inline-candle-link chart-link${ts ? '' : ' disabled'}`}
          onClick={() => ts && onClickChart(ts)}
          title={ts ? `C#${n}をハイライト` : `C#${n}のデータなし`}
        >
          {m[0]}
        </button>
      )
    }
    last = m.index + m[0].length
  }
  if (last < content.length) parts.push(<span key={key++}>{content.slice(last)}</span>)
  return parts
}

export function ChatPanel({ pair, interval, selectedCandles, onHypothesis, messages, onMessagesChange, onHighlightTimestamps, onFocusTimestamp }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMsgLenRef = useRef(messages.length)

  // 新メッセージが追加された時だけ最下部へスクロール
  useEffect(() => {
    if (messages.length > prevMsgLenRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevMsgLenRef.current = messages.length
  }, [messages])

  // インラインリンク [足#N] のクリック: タイムスタンプベースでハイライト
  const handleInlineSelected = useCallback((ts: string) => {
    onHighlightTimestamps?.([ts])
    onFocusTimestamp?.(ts)
  }, [onHighlightTimestamps, onFocusTimestamp])

  const handleInlineChart = useCallback((ts: string) => {
    onHighlightTimestamps?.([ts])
    onFocusTimestamp?.(ts)
  }, [onHighlightTimestamps, onFocusTimestamp])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    onMessagesChange(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await sendChatMessage(text, messages, pair, interval, selectedCandles)
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.message,
        ref_candles: response.ref_candles ?? undefined,
        ref_selected_timestamps: response.ref_candles
          ? response.ref_candles.map(n => selectedCandles[n - 1]?.timestamp).filter(Boolean) as string[]
          : undefined,
        ref_chart_timestamps: response.ref_chart_timestamps ?? undefined,
      }
      onMessagesChange(prev => [...prev, assistantMsg])

      if (response.hypothesis) {
        onHypothesis(response.hypothesis)
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: 'エラーが発生しました。もう一度お試しください。',
      }
      onMessagesChange(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>🤖 AI アシスタント</h3>
        <span className="disclaimer">学習目的のみ・投資助言ではありません</span>
        {selectedCandles.length > 0 && (
          <span className="selection-badge">📌 {selectedCandles.length}本選択中</span>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <p>FXテクニカル分析について質問してください。</p>
            <p className="chat-examples">
              例: 「RSIとは？」「今のチャートでブレイクアウトの兆候はある？」
              「移動平均線のクロスについて教えて」
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            <div className="chat-message-content">
              {msg.role === 'assistant'
                ? renderWithInlineLinks(
                    msg.content,
                    msg.ref_candles,
                    msg.ref_selected_timestamps,
                    msg.ref_chart_timestamps,
                    handleInlineSelected,
                    handleInlineChart,
                  )
                : msg.content}
            </div>
            {msg.ref_selected_timestamps && msg.ref_selected_timestamps.length > 0 && (
              <button
                className="ref-candles-badge"
                onClick={() => onHighlightTimestamps?.(msg.ref_selected_timestamps!)}
                title="クリックしてチャート上でハイライト"
              >
                📍 選択足 {msg.ref_candles?.map(n => `#${n}`).join(', ')} をハイライト
              </button>
            )}
            {msg.ref_chart_timestamps && msg.ref_chart_timestamps.length > 0 && (
              <button
                className="ref-candles-badge ref-chart-badge"
                onClick={() => onHighlightTimestamps?.(msg.ref_chart_timestamps!)}
                title="DBから検索した足をチャート上でハイライト"
              >
                🔍 検索結果の足をハイライト ({msg.ref_chart_timestamps.length}本)
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div className="chat-message assistant">
            <div className="chat-message-content loading">考え中...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedCandles.length > 0
            ? `${selectedCandles.length}本のローソク足について質問... (⌘Enter で送信)`
            : '質問を入力... (⌘Enter で送信、Enter で改行)'}
          disabled={loading}
          rows={5}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          送信
        </button>
      </div>
    </div>
  )
}
