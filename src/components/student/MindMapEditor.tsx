import {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { Plus, Trash, Type } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { MindMapData, MindMapNode } from '@/types'

interface MindMapEditorProps {
  data: MindMapData
  onChange: (data: MindMapData) => void
}

const COLORS = ['#ffffff', '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fecdd3', '#e2e8f0']

export function MindMapEditor({ data, onChange }: MindMapEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  useEffect(() => {
    if (data.nodes.length === 0) {
      onChange({ nodes: [{ id: 'root', text: 'Ideia Central', x: 400, y: 200 }], connections: [] })
    }
  }, [data, onChange])

  const addChild = (parentId: string) => {
    const parent = data.nodes.find((n) => n.id === parentId)
    if (!parent) return
    const id = `n${Date.now()}`
    const siblings = data.nodes.filter((n) => n.parentId === parentId)
    const yOffset = siblings.length * 60 - 30
    onChange({
      ...data,
      nodes: [
        ...data.nodes,
        {
          id,
          text: 'Novo Tópico',
          x: parent.x + 180,
          y: parent.y + yOffset,
          parentId,
          color: parent.color,
        },
      ],
    })
    setSelectedId(id)
  }

  const addSibling = (currentId: string) => {
    const current = data.nodes.find((n) => n.id === currentId)
    if (!current || !current.parentId) {
      if (current) addChild(currentId) // If root, just add child
      return
    }
    const id = `n${Date.now()}`
    onChange({
      ...data,
      nodes: [
        ...data.nodes,
        {
          id,
          text: 'Novo Tópico',
          x: current.x,
          y: current.y + 60,
          parentId: current.parentId,
          color: current.color,
        },
      ],
    })
    setSelectedId(id)
  }

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
    if (!selectedId) return

    if (e.key === 'Tab') {
      e.preventDefault()
      addChild(selectedId)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      addSibling(selectedId)
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      if (selectedId !== 'root') deleteNode(selectedId)
    }
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingId || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const x = Math.max(0, e.clientX - rect.left - 60)
      const y = Math.max(0, e.clientY - rect.top - 20)
      onChange({
        ...data,
        nodes: data.nodes.map((n) => (n.id === draggingId ? { ...n, x, y } : n)),
      })
    },
    [draggingId, data, onChange],
  )

  const deleteNode = (id: string) => {
    // Collect all children recursively to delete
    const toDelete = new Set([id])
    let added = true
    while (added) {
      added = false
      data.nodes.forEach((n) => {
        if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
          toDelete.add(n.id)
          added = true
        }
      })
    }
    onChange({
      nodes: data.nodes.filter((n) => !toDelete.has(n.id)),
      connections: data.connections.filter((c) => !toDelete.has(c.from) && !toDelete.has(c.to)),
    })
    setSelectedId(null)
  }

  const updateNode = (id: string, updates: Partial<MindMapNode>) => {
    onChange({ ...data, nodes: data.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)) })
  }

  const drawPath = (from: MindMapNode, to: MindMapNode) => {
    const x1 = from.x + 120,
      y1 = from.y + 20
    const x2 = to.x,
      y2 = to.y + 20
    const cx = x1 + (x2 - x1) / 2
    return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`
  }

  return (
    <div
      className="relative flex-1 min-h-[500px] w-full h-full overflow-hidden bg-white focus:outline-none"
      ref={canvasRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setDraggingId(null)}
      onMouseLeave={() => setDraggingId(null)}
      onClick={() => setSelectedId(null)}
    >
      <div className="absolute bottom-4 left-4 z-20 text-xs text-slate-400 bg-white/80 p-2 rounded-lg border border-slate-200">
        <strong>Atalhos:</strong> <kbd className="bg-slate-100 px-1 rounded">Tab</kbd> Sub-tópico ·{' '}
        <kbd className="bg-slate-100 px-1 rounded">Enter</kbd> Irmão
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {data.nodes
          .filter((n) => n.parentId)
          .map((node) => {
            const parent = data.nodes.find((n) => n.id === node.parentId)
            if (!parent) return null
            return (
              <path
                key={`edge-${node.id}`}
                d={drawPath(parent, node)}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
            )
          })}
      </svg>

      {data.nodes.map((node) => (
        <div
          key={node.id}
          onMouseDown={(e) => {
            e.stopPropagation()
            setDraggingId(node.id)
          }}
          onClick={(e) => {
            e.stopPropagation()
            setSelectedId(node.id)
          }}
          className={cn(
            'absolute z-10 w-[120px] rounded-lg px-2 py-1.5 shadow-sm border-2 cursor-pointer transition-all',
            selectedId === node.id
              ? 'border-blue-500 ring-4 ring-blue-500/10'
              : 'border-slate-300 hover:border-slate-400',
          )}
          style={{ left: node.x, top: node.y, backgroundColor: node.color || '#ffffff' }}
        >
          <input
            value={node.text}
            onChange={(e) => updateNode(node.id, { text: e.target.value })}
            className="w-full bg-transparent border-none outline-none text-sm text-center text-slate-800 font-medium placeholder:text-slate-400"
            placeholder="Tópico"
          />
          {selectedId === node.id && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  addChild(node.id)
                }}
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 shadow-md z-20"
              >
                <Plus className="w-4 h-4" />
              </button>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-lg border border-slate-200 p-1 flex gap-1 z-30">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={(e) => {
                      e.stopPropagation()
                      updateNode(node.id, { color: c })
                    }}
                    className="w-5 h-5 rounded-full border border-slate-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                ))}
                {node.id !== 'root' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNode(node.id)
                    }}
                    className="w-5 h-5 flex items-center justify-center text-red-500 hover:text-red-600 ml-1"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
