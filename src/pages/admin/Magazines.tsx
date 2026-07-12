import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Trash2, Edit, ImageIcon } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { getMagazines, createMagazine, updateMagazine, deleteMagazine } from '@/services/magazines'
import { Magazine } from '@/types'
import { toast } from '@/hooks/use-toast'
import { MagazineTabs } from '@/components/admin/MagazineTabs'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

export default function AdminMagazines() {
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Magazine | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [embedCode, setEmbedCode] = useState('')
  const [flipLink, setFlipLink] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isFree, setIsFree] = useState(true)

  const load = () => getMagazines().then(setMagazines)
  useEffect(() => {
    load()
  }, [])

  const previewUrl = useMemo(() => {
    let link = flipLink
    if (!link && embedCode) {
      const match = embedCode.match(/src=["']([^"']+)["']/i)
      if (match) link = match[1]
    }
    if (link) {
      let base = link.split('?')[0]
      if (!base.endsWith('/')) base += '/'
      return base + 'files/shot.jpg'
    }
    return null
  }, [embedCode, flipLink])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setFieldErrors({})
    const form = new FormData(e.currentTarget)

    const thumbnailFile = form.get('thumbnail') as File | null
    if (!thumbnailFile || thumbnailFile.size === 0) {
      form.delete('thumbnail')

      const flipLinkVal = (form.get('fliphtml5_link') as string) || ''
      const embedCodeVal = (form.get('embed_code') as string) || ''

      const linkChanged =
        editing &&
        ((editing.fliphtml5_link || '') !== flipLinkVal ||
          (editing.embed_code || '') !== embedCodeVal)

      const shouldAutoFetch = !editing || !editing.thumbnail || linkChanged

      if (shouldAutoFetch && previewUrl) {
        try {
          const res = await fetch(previewUrl)
          if (res.ok) {
            const blob = await res.blob()
            const file = new File([blob], 'cover.jpg', { type: blob.type || 'image/jpeg' })
            form.append('thumbnail', file)
          }
        } catch (err) {
          console.error('Failed to fetch preview image:', err)
        }
      }
    }

    form.set('is_free', isFree ? 'true' : 'false')

    try {
      if (editing) {
        await updateMagazine(editing.id, form)
        toast({ title: 'Revista atualizada' })
      } else {
        await createMagazine(form)
        toast({ title: 'Revista publicada' })
      }
      setOpen(false)
      setEditing(null)
      load()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary mb-4">Revistas SST</h2>
          <MagazineTabs />
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v)
            if (!v) {
              setEditing(null)
              setEmbedCode('')
              setFlipLink('')
              setFieldErrors({})
            } else if (editing) {
              setEmbedCode(editing.embed_code || '')
              setFlipLink(editing.fliphtml5_link || '')
              setIsFree(editing.is_free ?? true)
            } else {
              setIsFree(true)
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 w-4 h-4" /> Nova Revista
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Revista' : 'Publicar Revista'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input name="title" defaultValue={editing?.title} required />
                {fieldErrors.title && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>
                )}
              </div>
              <div>
                <Label>Resumo</Label>
                <Textarea name="summary" defaultValue={editing?.summary} required />
                {fieldErrors.summary && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.summary}</p>
                )}
              </div>
              <div>
                <Label>Link FlipHTML5 (Opcional)</Label>
                <Input
                  name="fliphtml5_link"
                  type="url"
                  defaultValue={editing?.fliphtml5_link}
                  onChange={(e) => setFlipLink(e.target.value)}
                  placeholder="https://online.fliphtml5.com/..."
                />
                {fieldErrors.fliphtml5_link && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.fliphtml5_link}</p>
                )}
              </div>
              <div>
                <Label>Código de Incorporação (Embed HTML)</Label>
                <Textarea
                  name="embed_code"
                  defaultValue={editing?.embed_code}
                  onChange={(e) => setEmbedCode(e.target.value)}
                  placeholder="<iframe src='...' ></iframe>"
                  className="font-mono text-xs min-h-[100px]"
                />
                {fieldErrors.embed_code && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.embed_code}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Se fornecido, substituirá o link do FlipHTML5 na visualização. A capa será
                  extraída automaticamente do código caso nenhuma imagem seja enviada.
                </p>
              </div>

              {previewUrl && (
                <div className="bg-slate-50 border rounded-md p-2 flex gap-4 items-start">
                  <div className="w-20 h-28 bg-white border shadow-sm rounded overflow-hidden flex-shrink-0">
                    <img
                      src={previewUrl}
                      alt="Preview da Capa"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                    <div className="hidden w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-2">
                      <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                      Sem capa
                    </div>
                  </div>
                  <div className="flex-1 text-sm text-slate-600">
                    <p className="font-medium text-slate-800 mb-1">Preview de Capa</p>
                    <p className="text-xs">
                      Esta imagem será baixada e salva como capa automaticamente, a menos que você
                      envie uma imagem manualmente abaixo.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <Label>Capa (Opcional para edição/substituição)</Label>
                <Input name="thumbnail" type="file" accept="image/*" />
                {fieldErrors.thumbnail && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.thumbnail}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch id="mag_is_free" checked={isFree} onCheckedChange={setIsFree} />
                <Label htmlFor="mag_is_free">Acesso Gratuito</Label>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {magazines.map((m) => (
            <div key={m.id} className="flex justify-between items-center p-4 hover:bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-20 bg-slate-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center border relative group">
                  {m.thumbnail ? (
                    <img
                      src={pb.files.getURL(m, m.thumbnail)}
                      alt={m.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div
                    className={cn(
                      'text-[10px] text-slate-400 text-center flex flex-col items-center gap-1',
                      m.thumbnail ? 'hidden' : '',
                    )}
                  >
                    <ImageIcon className="w-4 h-4 opacity-50" />
                    <span>Sem Capa</span>
                  </div>
                </div>
                <div>
                  <p className="font-bold flex items-center gap-2">
                    {m.title}
                    {m.embed_code && (
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Embed
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{m.fliphtml5_link || 'Sem link externo'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditing(m)
                    setOpen(true)
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600"
                  onClick={async () => {
                    if (!m || !m.id) return
                    if (confirm('Tem certeza que deseja excluir esta revista?')) {
                      try {
                        await deleteMagazine(m.id)
                        load()
                      } catch (err) {
                        toast({
                          title: 'Erro',
                          description: getErrorMessage(err),
                          variant: 'destructive',
                        })
                      }
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {magazines.length === 0 && (
            <div className="p-8 text-center text-slate-500">Nenhuma revista cadastrada.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
