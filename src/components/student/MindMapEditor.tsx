import { useState, useRef, useCallback, useEffect } from 'react'
import { Plus, Link2, X, Trash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { MindMapData } from '@/types'

interface MindMapEditorProps {
  data: MindMapData
  onChange: (data: MindMapData) => void
}

export function MindMapEditor({ data, onChange }: MindMapEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [connectMode, setConnectMode] = useState(false)
  const [connectFrom, setConnectFrom] = useState<string | null>(null)

  const addNode = () => {
    const id = `n${Date.now()}`
    const rect = canvasRef.current?.getBoundingClientRect()
    const x = rect ? rect.width / 2 - 60 + (Math.random() - 0.5) * 80 : 200
    const y = rect ? rect.height / 2 - 18 + (Math.random() - 0.5) * 80 : 150
    onChange({ ...data, nodes: [...data.nodes, { id, text: 'Novo nó', x, y }] })
    setEditingId(id)
  }

  const addNodeRef = useRef(addNode)
  addNodeRef.current = addNode

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        addNodeRef.current()
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        setConnectMode((prev) => !prev)
        setConnectFrom(null)
      } else if (e.key === 'Escape') {
        setConnectMode(false)
        setConnectFrom(null)
        setEditingId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (editingId === id) return
    if (connectMode) {
      if (!connectFrom) {
        setConnectFrom(id)
      } else if (connectFrom !== id) {
        const exists = data.connections.some(
          (c) => (c.from === connectFrom && c.to === id) || (c.from === id && c.to === connectFrom),
        )
        if (!exists) {
          onChange({
            ...data,
            connections: [...data.connections, { id: `c${Date.now()}`, from: connectFrom, to: id }],
          })
        }
        setConnectFrom(null)
        setConnectMode(false)
      }
      return
    }
    e.stopPropagation()
    setDraggingId(id)
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingId || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const x = Math.max(0, e.clientX - rect.left - 60)
      const y = Math.max(0, e.clientY - rect.top - 18)
      onChange({
        ...data,
        nodes: data.nodes.map((n) => (n.id === draggingId ? { ...n, x, y } : n)),
      })
    },
    [draggingId, data, onChange],
  )

  const deleteNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange({
      nodes: data.nodes.filter((n) => n.id !== id),
      connections: data.connections.filter((c) => c.from !== id && c.to !== id),
    })
  }

  const deleteConnection = (id: string) => {
    onChange({ ...data, connections: data.connections.filter((c) => c.id !== id) })
  }

  const clearAll = () => {
    onChange({ nodes: [], connections: [] })
    setConnectMode(false)
    setConnectFrom(null)
    setEditingId(null)
  }

  const updateText = (id: string, text: string) => {
    onChange({ ...data, nodes: data.nodes.map((n) => (n.id === id ? { ...n, text } : n)) })
  }

  const getNode = (id: string) => data.nodes.find((n) => n.id === id)

  return (
    <div className="flex flex-col h-full">
      <div
        className="relative flex-1 min-h-[400px] overflow-hidden bg-[#0a0a0a] bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:20px_20px]"
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setDraggingId(null)}
        onMouseLeave={() => setDraggingId(null)}
        onDoubleClick={(e) => {
          if (e.target === e.currentTarget) addNode()
        }}
      >
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-zinc-900/90 border border-white/10 shadow-xl backdrop-blur">
          <Button
            size="sm"
            variant="ghost"
            onClick={addNode}
            className="h-8 px-3 text-white hover:bg-white/10"
            title="Adicionar nó (N)"
          >
            <Plus className="w-4 h-4 mr-1" /> Nó
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setConnectMode(!connectMode)
              setConnectFrom(null)
            }}
            className={cn(
              'h-8 px-3 hover:bg-white/10',
              connectMode ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'text-white',
            )}
            title="Conectar nós (C)"
          >
            <Link2 className="w-4 h-4 mr-1" /> Conectar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={clearAll}
            className="h-8 px-3 text-red-400 hover:bg-red-500/10"
            title="Limpar tudo"
          >
            <Trash className="w-4 h-4" />
          </Button>
          <span className="text-xs text-white/30 px-2 hidden sm:inline">
            {data.nodes.length} nós · {data.connections.length} conexões
          </span>
          {connectMode && (
            <span className="text-xs text-amber-400 px-2">
              {connectFrom ? 'Selecione o destino...' : 'Selecione a origem...'}
            </span>
          )}
        </div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {data.connections.map((c) => {
            const from = getNode(c.from)
            const to = getNode(c.to)
            if (!from || !to) return null
            return (
              <g
                key={c.id}
                className="pointer-events-auto cursor-pointer"
                onClick={() => deleteConnection(c.id)}
              >
                <line
                  x1={from.x + 60}
                  y1={from.y + 18}
                  x2={to.x + 60}
                  y2={to.y + 18}
                  stroke="rgba(251,191,36,0.5)"
                  strokeWidth="2"
                />
                <line
                  x1={from.x + 60}
                  y1={from.y + 18}
                  x2={to.x + 60}
                  y2={to.y + 18}
                  stroke="transparent"
                  strokeWidth="12"
                />
              </g>
            )
          })}
        </svg>

        {data.nodes.map((node) => (
          <div
            key={node.id}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            onDoubleClick={(e) => {
              e.stopPropagation()
              setEditingId(node.id)
            }}
            className={cn(
              'absolute z-10 select-none cursor-move rounded-lg px-3 py-1.5 min-w-[120px] max-w-[200px]',
              'bg-zinc-800/90 border text-sm text-white shadow-lg backdrop-blur transition-colors',
              connectFrom === node.id
                ? 'border-amber-500 ring-2 ring-amber-500/30'
                : connectMode
                  ? 'border-white/30 hover:border-amber-500/50'
                  : 'border-white/15 hover:border-white/30',
              draggingId === node.id && 'opacity-80 cursor-grabbing',
            )}
            style={{ left: node.x, top: node.y }}
          >
            {editingId === node.id ? (
              <input
                autoFocus
                defaultValue={node.text}
                onBlur={(e) => {
                  updateText(node.id, e.target.value)
                  setEditingId(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateText(node.id, (e.target as HTMLInputElement).value)
                    setEditingId(null)
                  }
                }}
                className="bg-transparent outline-none text-white text-sm w-full"
              />
            ) : (
              <span className="block truncate">{node.text || 'Sem texto'}</span>
            )}
            <button
              onClick={(e) => deleteNode(node.id, e)}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-opacity opacity-60 hover:opacity-100"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}

        {data.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm pointer-events-none">
            Clique duas vezes no canvas ou use "Nó" para criar
          </div>
        )}
      </div>
    </div>
  )
}
