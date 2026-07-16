import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Edit, Trash2, LayoutGrid, List } from 'lucide-react'
import { getBanners, createBanner, updateBanner, deleteBanner } from '@/services/banners'
import { useRealtime } from '@/hooks/use-realtime'
import { Banner } from '@/types'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'
import { BannerMirror } from '@/components/admin/BannerMirror'

const LOCATIONS = ['Home - Topo', 'Home - Meio', 'Lateral dos Artigos', 'Rodapé']

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'mirror'>('list')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [form, setForm] = useState({ title: '', location: '', destination_link: '', active: true })
  const [imageFile, setImageFile] = useState<File | null>(null)

  const loadData = async () => {
    try {
      setBanners(await getBanners())
    } catch {
      toast.error('Erro ao carregar banners')
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('banners', loadData)

  const openCreate = (location?: string) => {
    setEditing(null)
    setForm({ title: '', location: location || '', destination_link: '', active: true })
    setImageFile(null)
    setOpen(true)
  }

  const openEdit = (b: Banner) => {
    setEditing(b)
    setForm({
      title: b.title,
      location: b.location,
      destination_link: b.destination_link || '',
      active: b.active,
    })
    setImageFile(null)
    setOpen(true)
  }

  const handleSlotClick = (location: string) => {
    const existing = banners.find((b) => b.location === location)
    if (existing) {
      openEdit(existing)
    } else {
      openCreate(location)
    }
  }

  const handleSave = async () => {
    if (!form.title || !form.location) {
      toast.error('Título e localização são obrigatórios')
      return
    }
    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('location', form.location)
    fd.append('destination_link', form.destination_link)
    fd.append('active', String(form.active))
    if (imageFile) fd.append('image', imageFile)
    try {
      if (editing) {
        await updateBanner(editing.id, fd)
        toast.success('Banner atualizado!')
      } else {
        await createBanner(fd)
        toast.success('Banner criado!')
      }
      setOpen(false)
      loadData()
    } catch {
      toast.error('Erro ao salvar banner')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este banner?')) return
    try {
      await deleteBanner(id)
      toast.success('Banner excluído')
      loadData()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Banners de Patrocínio</h2>
          <p className="text-muted-foreground">Gerencie anúncios exibidos nas páginas do site.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border bg-white p-1">
            <Button
              variant={cn(viewMode === 'list' ? 'default' : 'ghost')}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="mr-1.5 h-4 w-4" /> Lista
            </Button>
            <Button
              variant={cn(viewMode === 'mirror' ? 'default' : 'ghost')}
              size="sm"
              onClick={() => setViewMode('mirror')}
            >
              <LayoutGrid className="mr-1.5 h-4 w-4" /> Espelho
            </Button>
          </div>
          <Button onClick={() => openCreate()}>
            <Plus className="mr-2 h-4 w-4" /> Novo Banner
          </Button>
        </div>
      </div>

      {viewMode === 'mirror' ? (
        <BannerMirror banners={banners} onSlotClick={handleSlotClick} />
      ) : (
        <div className="border rounded-md bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Imagem</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    {b.image ? (
                      <img
                        src={pb.files.getUrl(b, b.image)}
                        alt={b.title}
                        className="w-16 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-16 h-10 rounded bg-slate-100" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell>{b.location}</TableCell>
                  <TableCell>{b.active ? '✅' : '❌'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => handleDelete(b.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {banners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Nenhum banner cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setEditing(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Banner' : 'Novo Banner'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Identificação interna"
              />
            </div>
            <div>
              <Label>Localização *</Label>
              <Select
                value={form.location}
                onValueChange={(v) => setForm({ ...form, location: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Link de Destino</Label>
              <Input
                type="url"
                value={form.destination_link}
                onChange={(e) => setForm({ ...form, destination_link: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Imagem</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {editing?.image && !imageFile && (
                <img
                  src={pb.files.getUrl(editing, editing.image)}
                  alt="Preview"
                  className="h-20 rounded border object-cover mt-2"
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.active}
                onCheckedChange={(c) => setForm({ ...form, active: c })}
              />
              <Label>Ativo</Label>
            </div>
            <Button className="w-full" onClick={handleSave}>
              {editing ? 'Salvar Alterações' : 'Publicar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
