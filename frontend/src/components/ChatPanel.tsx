/**
 * ChatPanel component - AI conversation interface.
 */

import { useState, useRef, useEffect } from 'react'
import type { ChatMessage, HypothesisData } from '@/types'
import { sendChatMessage } from '@/services/api'

interface Props {
  pair: string
  interval: string
  onHypothesis: (h: HypothesisData) => void
}

export function ChatPanel({ pair, interval, onHypothesis }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await sendChatMessage(text, messages, pair, interval)
      const assistantMsg: ChatMessage = { role: 'assistant', content: response.message }
      setMessages(prev => [...prev, assistantMsg])

      if (response.hypothesis) {
        onHypothesis(response.hypothesis)
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: 'エラーが発生しました。もう一度お試しください。',
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>🤖 AI アシスタント</h3>
        <span className="disclaimer">学習目的のみ・投資助言ではありません</span>
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
              {msg.content}
            </div>
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
          placeholder="質問を入力... (Enter で送信、Shift+Enter で改行)"
          disabled={loading}
          rows={2}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          送信
        </button>
      </div>
    </div>
  )
}
