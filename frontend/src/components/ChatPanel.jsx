// src/components/ChatPanel.jsx
import { useState, useEffect, useRef } from 'react'
import { chatApi } from '../api/client'

export default function ChatPanel({ toast }) {
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [initLoad, setInitLoad] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    chatApi.history()
      .then(data => setMessages(data))
      .catch(() => {})
      .finally(() => setInitLoad(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    // Optimistic user message
    const tempId = Date.now()
    setMessages(m => [...m, { id: tempId, role: 'user', content: text, created_at: new Date().toISOString() }])
    setLoading(true)

    try {
      const data = await chatApi.send(text)
      setMessages(data.history)
    } catch {
      toast.error('Chat failed — check your connection')
      setMessages(m => m.filter(x => x.id !== tempId))
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    try {
      await chatApi.clearHistory()
      setMessages([])
      toast.success('Chat cleared')
    } catch { toast.error('Failed to clear') }
  }

  const PROMPTS = [
    'What can I make for a quick dinner?',
    'Suggest a healthy breakfast',
    'How do I caramelise onions?',
    'What spices go well with chicken?',
  ]

  return (
    <div style={chat.container}>
      {/* Header */}
      <div style={chat.header}>
        <div>
          <h3 style={chat.title}>AI Cooking Chat</h3>
          <p style={chat.sub}>Ask anything — your pantry is shared automatically</p>
        </div>
        {messages.length > 0 && (
          <button className="btn btn-ghost" onClick={clearHistory} style={{ padding: '6px 12px', fontSize: '12px' }}>
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={chat.messages}>
        {/* Welcome */}
        {!initLoad && messages.length === 0 && (
          <div style={chat.welcome} className="animate-fadeUp">
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>👨‍🍳</div>
            <h4 style={{ fontFamily: 'Lora, serif', fontSize: '18px', marginBottom: '6px' }}>
              Hi! I'm your cooking assistant.
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px', lineHeight: 1.6 }}>
              Ask me about recipes, cooking techniques, substitutions, or meal planning. I can see what's in your pantry.
            </p>
            <div style={chat.promptGrid}>
              {PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => { setInput(p); }}
                  style={chat.promptBtn}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={m.id || i}
            className="animate-fadeUp"
            style={{
              ...chat.bubble,
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              animationDelay: `${i * 0.02}s`,
            }}
          >
            {m.role === 'assistant' && (
              <div style={chat.avatar}>👨‍🍳</div>
            )}
            <div style={{
              ...chat.bubbleInner,
              background: m.role === 'user' ? 'var(--rust)' : 'var(--white)',
              color:      m.role === 'user' ? 'white'       : 'var(--brown)',
              borderBottomRightRadius: m.role === 'user'      ? '4px' : 'var(--radius-md)',
              borderBottomLeftRadius:  m.role === 'assistant' ? '4px' : 'var(--radius-md)',
              boxShadow: m.role === 'assistant' ? 'var(--shadow-sm)' : 'none',
            }}>
              {m.content.split('\n').map((line, j) => (
                <span key={j}>{line}{j < m.content.split('\n').length - 1 && <br/>}</span>
              ))}
            </div>
          </div>
        ))}

        {/* Loading bubble */}
        {loading && (
          <div style={{ ...chat.bubble, alignSelf: 'flex-start' }}>
            <div style={chat.avatar}>👨‍🍳</div>
            <div style={{ ...chat.bubbleInner, background: 'var(--white)', boxShadow: 'var(--shadow-sm)' }}>
              <span className="spinner dark" style={{ width: 16, height: 16 }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={chat.inputBar}>
        <textarea
          style={chat.textarea}
          placeholder="Ask about recipes, techniques, substitutions…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
          }}
          rows={1}
        />
        <button
          className="btn btn-rust"
          onClick={send}
          disabled={loading || !input.trim()}
          style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
        >
          {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '↑'}
        </button>
      </div>
    </div>
  )
}

const chat = {
  container: {
    display: 'flex', flexDirection: 'column',
    height: '100%', background: 'var(--cream)',
  },
  header: {
    padding: '20px 24px 14px',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    flexShrink: 0, background: 'var(--white)',
  },
  title: { fontFamily: 'Lora, serif', fontSize: '18px', fontWeight: 600 },
  sub:   { fontSize: '12px', color: 'var(--muted)', marginTop: '3px' },
  messages: {
    flex: 1, overflowY: 'auto',
    padding: '20px 24px',
    display: 'flex', flexDirection: 'column', gap: '14px',
  },
  welcome: {
    textAlign: 'center', padding: '40px 20px',
    background: 'var(--white)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)', margin: 'auto 0',
  },
  promptGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'left',
  },
  promptBtn: {
    background: 'var(--cream)', border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '10px 12px',
    fontSize: '12px', color: 'var(--brown)', cursor: 'pointer',
    fontFamily: 'DM Sans, sans-serif', textAlign: 'left', lineHeight: 1.4,
    transition: 'border-color .15s',
  },
  bubble: { display: 'flex', gap: '8px', alignItems: 'flex-end', maxWidth: '85%' },
  avatar: {
    fontSize: '20px', width: '30px', height: '30px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  bubbleInner: {
    padding: '10px 14px', borderRadius: 'var(--radius-md)',
    fontSize: '14px', lineHeight: 1.6, border: '1px solid var(--border)',
  },
  inputBar: {
    padding: '14px 20px',
    background: 'var(--white)', borderTop: '1px solid var(--border)',
    display: 'flex', gap: '10px', alignItems: 'flex-end', flexShrink: 0,
  },
  textarea: {
    flex: 1, border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
    fontSize: '14px', resize: 'none', lineHeight: 1.5,
    background: 'var(--cream)', color: 'var(--brown)',
    fontFamily: 'DM Sans, sans-serif',
    transition: 'border-color .2s',
  },
}
