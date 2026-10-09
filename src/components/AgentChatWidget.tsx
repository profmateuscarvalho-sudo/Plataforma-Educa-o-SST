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
        <div className="bg-card text-card-foreground px-5 py-3.5 rounded-[22px] shadow-[0_18px_40px_rgba(28,27,24,0.12)] border border-border max-w-[280px]">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span className="font-serif font-bold text-sm text-foreground">Agente de IA</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tire suas dúvidas sobre NRs, EPIs, ergonomia e muito mais!
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-primary hover:bg-primary/90 shadow-[0_12px_32px_rgba(253,190,45,0.4)] flex items-center justify-center transition-all duration-300 hover:scale-105 border-2 border-background cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Abrir Agente IA"
        >
          <Bot className="w-8 h-8 text-primary-foreground transition-transform duration-300 group-hover:scale-110" />
          <span className="absolute top-0 right-0 w-4 h-4 bg-success rounded-full border-2 border-background animate-pulse" />
        </button>
      </div>
    )
  }

  const containerClass = isMaximized
    ? 'fixed inset-2 z-[70] bg-card text-card-foreground rounded-[28px] shadow-[0_24px_60px_rgba(28,27,24,0.2)] flex flex-col overflow-hidden border border-border animate-fade-in'
    : 'fixed bottom-6 right-6 z-[60] w-[540px] max-w-[calc(100vw-2rem)] h-[680px] max-h-[calc(100vh-3rem)] bg-card text-card-foreground rounded-[28px] shadow-[0_24px_60px_rgba(28,27,24,0.18)] flex flex-col overflow-hidden border border-border animate-fade-in-up'

  return (
    <div className={containerClass}>
      {/* Top bar em --card com borda fina */}
      <div className="bg-card text-card-foreground px-5 py-4 flex items-center justify-between gap-3 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-card" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif font-bold text-base flex items-center gap-2 text-foreground">
              <span className="truncate">Agente de IA</span>
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              Especialista em SST • {usage.used} de {usage.limit === 999999 ? '∞' : usage.limit}{' '}
              perguntas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsMaximized((prev) => !prev)}
            title={isMaximized ? 'Restaurar' : 'Maximizar'}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleNewConversation}
            title="Nova conversa"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              setIsMaximized(false)
            }}
            title="Fechar"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Área de mensagens: janela em --card, aluno em --muted, agente sem fundo */}
      <div
        className={cn(
          'flex-1 overflow-y-auto p-5 space-y-4 bg-card',
          isMaximized && 'max-w-4xl mx-auto w-full',
        )}
      >
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 border border-border text-foreground">
              <Bot className="w-8 h-8" />
            </div>
            <h4 className="font-serif font-bold text-lg text-foreground mb-2">
              Olá! Sou o Agente IA Educação SST
            </h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Estou aqui para responder suas dúvidas sobre Normas Regulamentadoras (NRs), EPIs,
              ergonomia, riscos ocupacionais e muito mais. Como posso ajudar você hoje?
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {['O que é a NR-6?', 'Como funciona a NR-17?', 'Tipos de EPI'].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setInput(suggestion)
                    setTimeout(() => handleSend(), 0)
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-muted border border-border text-xs font-medium text-foreground hover:border-primary hover:bg-primary/10 transition-colors"
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
            <div
              key={i}
              className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5 text-foreground">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={cn(
                  'rounded-2xl p-4 max-w-[85%] text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-muted text-foreground border border-border'
                    : 'bg-transparent text-foreground p-1 pl-0',
                )}
              >
                {showTyping ? (
                  <p className="text-sm text-muted-foreground animate-pulse">Digitando...</p>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-primary/20 text-foreground flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          )
        })}
        {error && (
          <div className="text-center py-2">
            <p className="text-sm text-danger mb-2">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null)
                handleSend()
              }}
              className="text-xs text-primary hover:underline font-semibold"
            >
              Tentar novamente
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Caixa de input */}
      <div className="border-t border-border p-3.5 flex gap-2 bg-card">
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
          className="flex-1 px-4 py-2.5 rounded-full border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2.5 rounded-full transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1.5 h-11"
          aria-label="Enviar"
        >
          <Send className="w-4 h-4" />
          <span className="text-sm font-semibold hidden sm:inline">Enviar</span>
        </button>
      </div>
    </div>
  )
}
