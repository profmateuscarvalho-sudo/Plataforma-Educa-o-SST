import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { Bot, X, Send, Plus, User } from 'lucide-react'
import { getAgentUsage, loadLatestConversation, sendAgentMessage } from '@/services/agent'
import type { AgentMessage } from '@/types'

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

const HIDDEN_PATHS = ['/login', '/register', '/forgot-password', '/ativar', '/subscription-pending']

export function AgentChatWidget() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [usage, setUsage] = useState({ used: 0, limit: 0 })
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const refreshUsage = useCallback(async () => {
    try {
      const u = await getAgentUsage()
      setUsage({ used: u.used, limit: u.limit })
    } catch {
      /* intentionally ignored */
    }
  }, [])

  const loadHistory = useCallback(async () => {
    try {
      const { conversationId: convId, messages: msgs } = await loadLatestConversation()
      if (convId) {
        setConversationId(convId)
        setMessages(msgs.map((m) => ({ role: m.role, content: m.content })))
      }
    } catch {
      /* intentionally ignored */
    }
  }, [])

  useEffect(() => {
    if (user && user.role !== 'admin') {
      refreshUsage()
      loadHistory()
    }
  }, [user, refreshUsage, loadHistory])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return
    const text = input.trim()
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: text },
      { role: 'assistant', content: '' },
    ])
    setInput('')
    setIsStreaming(true)
    setError(null)

    abortRef.current = new AbortController()
    try {
      const result = await sendAgentMessage(
        text,
        conversationId,
        (_delta, full) => {
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: full }
            return updated
          })
        },
        abortRef.current.signal,
      )
      setConversationId(result.conversation_id)
      localStorage.setItem('agent_conversation_id', result.conversation_id)
      refreshUsage()
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(
        err instanceof Error
          ? err.message
          : 'Ocorreu um erro ao processar sua pergunta. Tente novamente em alguns instantes.',
      )
      setMessages((prev) => {
        if (
          prev.length > 0 &&
          prev[prev.length - 1].role === 'assistant' &&
          prev[prev.length - 1].content === ''
        ) {
          return prev.slice(0, -1)
        }
        return prev
      })
    } finally {
      setIsStreaming(false)
    }
  }, [input, isStreaming, conversationId, refreshUsage])

  const handleNewConversation = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    localStorage.removeItem('agent_conversation_id')
    setConversationId(null)
    setMessages([])
    setError(null)
    setIsStreaming(false)
  }, [])

  if (loading || !user || user.role === 'admin' || HIDDEN_PATHS.includes(location.pathname))
    return null

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-24 z-50 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-xl flex items-center justify-center transition-transform hover:scale-110"
        aria-label="Abrir Agente IA"
      >
        <Bot className="w-7 h-7 text-primary-foreground" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-[60] w-[380px] h-[600px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-fade-in-up">
      <div className="bg-slate-900 text-white p-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Bot className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="truncate">Agente IA</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Perguntas: {usage.used} de {usage.limit === 999999 ? '∞' : usage.limit}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleNewConversation}
            title="Nova conversa"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            title="Fechar"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              Olá! Sou o Agente IA Educação SST. Pergunte sobre NRs, EPIs, ergonomia e mais.
            </p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1
          const showTyping = msg.role === 'assistant' && msg.content === '' && isStreaming && isLast
          return (
            <div key={i} className={cn('flex gap-2', msg.role === 'user' && 'justify-end')}>
              {msg.role === 'assistant' && <Bot className="w-6 h-6 text-primary shrink-0 mt-1" />}
              <div
                className={cn(
                  'rounded-xl p-2.5 max-w-[80%]',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white border border-slate-200',
                )}
              >
                {showTyping ? (
                  <p className="text-sm text-slate-400 animate-pulse">Digitando...</p>
                ) : (
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && <User className="w-6 h-6 text-slate-400 shrink-0 mt-1" />}
            </div>
          )
        })}
        {error && (
          <div className="text-center py-2">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <button
              onClick={() => {
                setError(null)
                handleSend()
              }}
              className="text-xs text-primary hover:underline font-medium"
            >
              Tentar novamente
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-slate-200 p-2.5 flex gap-2 bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Digite sua pergunta..."
          disabled={isStreaming}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg transition-colors disabled:opacity-50 shrink-0"
          aria-label="Enviar"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
