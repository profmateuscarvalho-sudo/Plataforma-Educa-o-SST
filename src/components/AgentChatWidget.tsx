import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { Bot, X, Send, Plus, User, Maximize2, Minimize2, Sparkles } from 'lucide-react'
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
  const [isMaximized, setIsMaximized] = useState(false)
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
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 animate-fade-in">
        <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-yellow-400/30 max-w-[260px]">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="font-bold text-sm">Agente de IA</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Tire suas dúvidas sobre NRs, EPIs, ergonomia e muito mais!
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="group w-20 h-20 rounded-full bg-primary hover:bg-primary/90 shadow-2xl flex items-center justify-center transition-transform hover:scale-110 border-4 border-white"
          aria-label="Abrir Agente IA"
        >
          <Bot className="w-10 h-10 text-primary-foreground group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      </div>
    )
  }

  const containerClass = isMaximized
    ? 'fixed inset-2 z-[70] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 border-primary/20 animate-fade-in'
    : 'fixed bottom-6 right-6 z-[60] w-[570px] h-[720px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-fade-in-up'

  return (
    <div className={containerClass}>
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between gap-2 border-b border-yellow-400/20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-yellow-400/40">
              <Bot className="w-7 h-7 text-yellow-400" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base flex items-center gap-2">
              <span className="truncate">Agente de IA</span>
              <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
            </h3>
            <p className="text-xs text-slate-400 truncate">
              Especialista em SST • {usage.used} de {usage.limit === 999999 ? '∞' : usage.limit}{' '}
              perguntas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsMaximized((prev) => !prev)}
            title={isMaximized ? 'Restaurar' : 'Maximizar'}
            className="p-2.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={handleNewConversation}
            title="Nova conversa"
            className="p-2.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setIsOpen(false)
              setIsMaximized(false)
            }}
            title="Fechar"
            className="p-2.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          'flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50',
          isMaximized && 'max-w-4xl mx-auto w-full',
        )}
      >
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border-2 border-primary/20">
              <Bot className="w-10 h-10 text-primary" />
            </div>
            <h4 className="font-bold text-lg text-slate-700 mb-2">
              Olá! Sou o Agente IA Educação SST
            </h4>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Estou aqui para responder suas dúvidas sobre Normas Regulamentadoras (NRs), EPIs,
              ergonomia, riscos ocupacionais e muito mais. Como posso ajudar você hoje?
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {['O que é a NR-6?', 'Como funciona a NR-17?', 'Tipos de EPI'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion)
                    setTimeout(() => handleSend(), 0)
                  }}
                  className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-600 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1
          const showTyping = msg.role === 'assistant' && msg.content === '' && isStreaming && isLast
          return (
            <div key={i} className={cn('flex gap-2.5', msg.role === 'user' && 'justify-end')}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  'rounded-xl p-3 max-w-[80%]',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white border border-slate-200 shadow-sm',
                )}
              >
                {showTyping ? (
                  <p className="text-sm text-slate-400 animate-pulse">Digitando...</p>
                ) : (
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
              )}
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

      <div className="border-t border-slate-200 p-3 flex gap-2 bg-white">
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
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1.5"
          aria-label="Enviar"
        >
          <Send className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Enviar</span>
        </button>
      </div>
    </div>
  )
}
