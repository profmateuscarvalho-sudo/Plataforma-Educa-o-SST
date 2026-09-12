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
import { Plus, Trash2, Edit, ImageIcon, Globe } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { getMagazines, createMagazine, updateMagazine, deleteMagazine } from '@/services/magazines'
import { Magazine } from '@/types'
import { toast } from '@/hooks/use-toast'
import { MagazineTabs } from '@/components/admin/MagazineTabs'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AdminMagazines() {
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Magazine | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [embedCode, setEmbedCode] = useState('')
  const [flipLink, setFlipLink] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isFree, setIsFree] = useState(true)
  const [selectedLanguageTab, setSelectedLanguageTab] = useState<'pt-BR' | 'es'>('pt-BR')
  const [formLanguage, setFormLanguage] = useState<'pt-BR' | 'es'>('pt-BR')

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
    form.set('language', formLanguage)

    try {
      if (editing) {
        await updateMagazine(editing.id, form)
        toast({
          title:
            formLanguage === 'es'
              ? 'Revista atualizada (Espanhol)'
              : 'Revista atualizada (Português)',
        })
      } else {
        await createMagazine(form)
        toast({
          title:
            formLanguage === 'es'
              ? 'Revista em Espanhol publicada com sucesso'
              : 'Revista em Português publicada com sucesso',
        })
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

  const filteredMagazines = useMemo(() => {
    return magazines.filter((m) => {
      const lang = m.language || 'pt-BR'
      return lang === selectedLanguageTab
    })
  }, [magazines, selectedLanguageTab])

  const countPt = useMemo(
    () => magazines.filter((m) => (m.language || 'pt-BR') === 'pt-BR').length,
    [magazines],
  )
  const countEs = useMemo(() => magazines.filter((m) => m.language === 'es').length, [magazines])

  const handleOpenDialog = (magToEdit?: Magazine) => {
    if (magToEdit) {
      setEditing(magToEdit)
      setEmbedCode(magToEdit.embed_code || '')
      setFlipLink(magToEdit.fliphtml5_link || '')
      setIsFree(magToEdit.is_free ?? true)
      setFormLanguage(magToEdit.language === 'es' ? 'es' : 'pt-BR')
    } else {
      setEditing(null)
      setEmbedCode('')
      setFlipLink('')
      setIsFree(true)
      // Por padrão, cria revista no idioma da aba atualmente selecionada
      setFormLanguage(selectedLanguageTab)
    }
    setFieldErrors({})
    setOpen(true)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
            }
          }}
        >
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 w-4 h-4" /> Nova Revista
          </Button>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing
                  ? `Editar Revista (${formLanguage === 'es' ? 'Espanhol 🇪🇸' : 'Português 🇧🇷'})`
                  : `Publicar Revista (${formLanguage === 'es' ? 'Espanhol 🇪🇸' : 'Português 🇧🇷'})`}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-primary" /> Idioma da Edição
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormLanguage('pt-BR')}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors',
                      formLanguage === 'pt-BR'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600',
                    )}
                  >
                    <span>🇧🇷</span> Português
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormLanguage('es')}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors',
                      formLanguage === 'es'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600',
                    )}
                  >
                    <span>🇪🇸</span> Espanhol
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  {formLanguage === 'es'
                    ? 'Esta revista ficará visível no site quando o aluno selecionar Espanhol (ES).'
                    : 'Esta revista ficará visível no site quando o aluno selecionar Português (PT).'}
                </p>
              </div>

              <div>
                <Label>Título</Label>
                <Input
                  name="title"
                  defaultValue={editing?.title}
                  placeholder={
                    formLanguage === 'es'
                      ? 'Ex: Revista SST - Edición 01 (Español)'
                      : 'Ex: Revista SST - Edição 01'
                  }
                  required
                />
                {fieldErrors.title && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>
                )}
              </div>
              <div>
                <Label>Resumo</Label>
                <Textarea
                  name="summary"
                  defaultValue={editing?.summary}
                  placeholder={
                    formLanguage === 'es'
                      ? 'Breve descripción del contenido de la revista...'
                      : 'Breve resumo do conteúdo da revista...'
                  }
                  required
                />
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
                <Label htmlFor="mag_is_free">Acesso Liberado</Label>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Abas de Idioma */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Tabs
            value={selectedLanguageTab}
            onValueChange={(v) => setSelectedLanguageTab(v as 'pt-BR' | 'es')}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-2 w-full sm:w-[360px] bg-slate-100 p-1">
              <TabsTrigger value="pt-BR" className="flex items-center gap-2 text-xs sm:text-sm">
                <span>🇧🇷</span>
                <span>Português</span>
                <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200/70 text-slate-700 font-semibold">
                  {countPt}
                </span>
              </TabsTrigger>
              <TabsTrigger value="es" className="flex items-center gap-2 text-xs sm:text-sm">
                <span>🇪🇸</span>
                <span>Espanhol</span>
                <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200/70 text-slate-700 font-semibold">
                  {countEs}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <p className="text-xs text-slate-500">
            Exibindo revistas publicadas em{' '}
            <strong className="text-slate-700">
              {selectedLanguageTab === 'es' ? 'Espanhol (🇪🇸)' : 'Português (🇧🇷)'}
            </strong>
          </p>
        </div>

        <Card>
          <CardContent className="p-0 divide-y">
            {filteredMagazines.map((m) => (
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
                    <p className="font-bold flex items-center gap-2 flex-wrap">
                      {m.title}
                      <span
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1',
                          m.language === 'es'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800',
                        )}
                      >
                        {m.language === 'es' ? '🇪🇸 Espanhol' : '🇧🇷 Português'}
                      </span>
                      {m.embed_code && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Embed
                        </span>
                      )}
                      {!m.is_free && (
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                          Assinantes
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-1">{m.summary}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {m.fliphtml5_link ||
                        (m.embed_code ? 'Incorporado via HTML' : 'Sem link externo')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(m)}
                    title="Editar revista"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Excluir revista"
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
            {filteredMagazines.length === 0 && (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-xl">
                  {selectedLanguageTab === 'es' ? '🇪🇸' : '🇧🇷'}
                </div>
                <p className="font-medium text-slate-700">
                  {selectedLanguageTab === 'es'
                    ? 'Nenhuma revista em Espanhol cadastrada ainda.'
                    : 'Nenhuma revista em Português cadastrada.'}
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {selectedLanguageTab === 'es'
                    ? 'Clique no botão abaixo para fazer o upload da primeira revista em espanhol.'
                    : 'Publique novas revistas para o público brasileiro.'}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFormLanguage(selectedLanguageTab)
                    handleOpenDialog()
                  }}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  {selectedLanguageTab === 'es'
                    ? 'Cadastrar Revista em Espanhol'
                    : 'Nova Revista em Português'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
