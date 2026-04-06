import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DocProjectCost } from '@/types'
import {
  getDocProjectCosts,
  createDocProjectCost,
  deleteDocProjectCost,
} from '@/services/doc_projects'
import { toast } from 'sonner'
import { Download, Plus, Trash2 } from 'lucide-react'

export default function TabCosts({ projectId }: { projectId: string }) {
  const [costs, setCosts] = useState<DocProjectCost[]>([])
  const [cat, setCat] = useState<any>('Pré-produção')
  const [desc, setDesc] = useState('')
  const [val, setVal] = useState('')

  const loadData = async () => {
    try {
      setCosts(await getDocProjectCosts(projectId))
    } catch (e) {
      console.error(e)
    }
  }
  useEffect(() => {
    loadData()
  }, [projectId])

  const handleAdd = async () => {
    if (!desc || !val) return
    try {
      await createDocProjectCost({
        project: projectId,
        category: cat,
        description: desc,
        estimated_value: parseFloat(val),
      })
      setDesc('')
      setVal('')
      loadData()
      toast.success('Custo adicionado')
    } catch (e) {
      toast.error('Erro ao adicionar custo')
    }
  }

  const handleDel = async (id: string) => {
    try {
      await deleteDocProjectCost(id)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const exportCSV = () => {
    const header = 'Categoria,Descrição,Valor Estimado\n'
    const rows = costs
      .map((c) => `"${c.category}","${c.description}",${c.estimated_value}`)
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'orcamento.csv'
    a.click()
  }

  const total = costs.reduce((acc, c) => acc + (c.estimated_value || 0), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-md border">
        <div>
          <label className="text-xs font-medium">Categoria</label>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['Pré-produção', 'Produção', 'Equipamentos', 'Pós-produção', 'Outros'].map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium">Descrição</label>
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs font-medium">Valor Estimado</label>
            <Input
              type="number"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <Button onClick={handleAdd} className="mb-0 mt-auto">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" /> Exportar Orçamento
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor Estimado</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {costs.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.category}</TableCell>
                <TableCell>{c.description}</TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    c.estimated_value,
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDel(c.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold bg-slate-50">
              <TableCell colSpan={2} className="text-right">
                Total
              </TableCell>
              <TableCell className="text-right">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  total,
                )}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
