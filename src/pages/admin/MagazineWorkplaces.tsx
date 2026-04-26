import { useEffect, useState } from 'react'
import { ClipboardCopy, Eye, Trash2, MapPin, Briefcase } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { MagazineTabs } from '@/components/admin/MagazineTabs'

import pb from '@/lib/pocketbase/client'
import { getWorkplaces, deleteWorkplace } from '@/services/workplaces'
import { useRealtime } from '@/hooks/use-realtime'
import type { Workplace } from '@/types'

export default function AdminMagazineWorkplaces() {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWorkplace, setSelectedWorkplace] = useState<Workplace | null>(null)

  const loadData = async () => {
    try {
      const data = await getWorkplaces()
      setWorkplaces(data)
    } catch (error) {
      toast.error('Erro ao carregar locais de trabalho.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('workplaces', () => {
    loadData()
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta submissão?')) return
    try {
      await deleteWorkplace(id)
      toast.success('Submissão excluída com sucesso.')
    } catch (error) {
      toast.error('Erro ao excluir.')
    }
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/meu-local-trabalho`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado para a área de transferência!')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Gerenciar Revistas</h2>
          <p className="text-slate-500">Edições, artigos, conexões e locais de trabalho.</p>
        </div>
      </div>

      <MagazineTabs />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Meu Local de Trabalho (Submissões)</CardTitle>
            <CardDescription>
              Gerencie as informações e fotos enviadas pelos profissionais.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={handleCopyLink}>
            <ClipboardCopy className="w-4 h-4 mr-2" /> Copiar Link Público
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center">Carregando...</div>
          ) : workplaces.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Nenhuma submissão recebida ainda.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workplaces.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.professional_name}</TableCell>
                    <TableCell>{item.job_title}</TableCell>
                    <TableCell>{item.city}</TableCell>
                    <TableCell>{format(new Date(item.created), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedWorkplace(item)}
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedWorkplace}
        onOpenChange={(open) => !open && setSelectedWorkplace(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Submissão</DialogTitle>
            <DialogDescription>
              Enviado em{' '}
              {selectedWorkplace &&
                format(new Date(selectedWorkplace.created), "dd 'de' MMMM 'de' yyyy")}
            </DialogDescription>
          </DialogHeader>

          {selectedWorkplace && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <h3 className="font-bold text-lg text-slate-800">
                  {selectedWorkplace.professional_name}
                </h3>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" /> {selectedWorkplace.job_title}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {selectedWorkplace.city}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-700 mb-2">Descrição do Local</h4>
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {selectedWorkplace.description}
                </p>
              </div>

              {selectedWorkplace.photos && selectedWorkplace.photos.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3">Fotos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedWorkplace.photos.map((photo, i) => (
                      <a
                        key={i}
                        href={pb.files.getURL(selectedWorkplace, photo)}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg overflow-hidden border border-slate-200 aspect-video hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={pb.files.getURL(selectedWorkplace, photo)}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
