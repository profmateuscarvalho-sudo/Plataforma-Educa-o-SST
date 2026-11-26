// Revistas → Configurações — upload do vídeo do hero da Home (.mp4 ≤ 5 MB),
// imagem do vídeo (.jpg) e nº de páginas da edição do mês, com prévia.
// Persiste no registro único de magazine_landing_page (mesma coleção dos
// preços da venda avulsa — a Home lê via GET /backend/v1/magazine-pricing).
import { useEffect, useRef, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { MagazineTabs } from '@/components/admin/MagazineTabs'
import { getErrorMessage } from '@/lib/form-errors'
import { clearMagazineHomeMediaCache } from '@/lib/magazine-home-media'

const MAX_VIDEO_BYTES = 5 * 1024 * 1024 // 5 MB
const MAX_VIDEO_MB = 5

interface SettingsRecord {
  id: string
  home_video?: string
  home_video_poster?: string
  current_issue_pages?: number
}

function arquivoUrl(rec: SettingsRecord, filename?: string): string | null {
  if (!filename) return null
  try {
    return pb.files.getUrl(rec as never, filename)
  } catch {
    return null
  }
}

export default function MagazineHomeSettings() {
  const { toast } = useToast()
  const [rec, setRec] = useState<SettingsRecord | null>(null)
  const [pages, setPages] = useState('')
  const [videoNovo, setVideoNovo] = useState<File | null>(null)
  const [posterNovo, setPosterNovo] = useState<File | null>(null)
  const [removerVideo, setRemoverVideo] = useState(false)
  const [removerPoster, setRemoverPoster] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const videoInput = useRef<HTMLInputElement>(null)
  const posterInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let vivo = true
    pb.collection('magazine_landing_page')
      .getList<SettingsRecord>(1, 1)
      .then((res) => {
        if (!vivo) return
        const r = res.items[0] ?? null
        setRec(r)
        setPages(r?.current_issue_pages ? String(r.current_issue_pages) : '')
      })
      .catch(() => {
        if (vivo) toast({ title: 'Não foi possível carregar a configuração atual' })
      })
      .finally(() => {
        if (vivo) setCarregando(false)
      })
    return () => {
      vivo = false
    }
  }, [toast])

  const videoUrlAtual = rec && !removerVideo ? arquivoUrl(rec, rec.home_video) : null
  const posterUrlAtual = rec && !removerPoster ? arquivoUrl(rec, rec.home_video_poster) : null
  const videoPreview = useObjectUrl(videoNovo) ?? videoUrlAtual
  const posterPreview = useObjectUrl(posterNovo) ?? posterUrlAtual

  const validarVideo = (f: File): boolean => {
    if (f.type !== 'video/mp4' || !f.name.toLowerCase().endsWith('.mp4')) {
      toast({ title: 'Formato inválido', description: 'O vídeo precisa ser .mp4' })
      return false
    }
    if (f.size > MAX_VIDEO_BYTES) {
      toast({
        title: 'Arquivo muito grande',
        description: `O vídeo pode ter no máximo ${MAX_VIDEO_MB} MB`,
      })
      return false
    }
    return true
  }

  const validarPoster = (f: File): boolean => {
    if (f.type !== 'image/jpeg' || !f.name.toLowerCase().endsWith('.jpg')) {
      toast({ title: 'Formato inválido', description: 'A imagem precisa ser .jpg' })
      return false
    }
    return true
  }

  const salvar = async () => {
    if (!rec) return
    setSalvando(true)
    try {
      const form = new FormData()
      if (videoNovo) form.append('home_video', videoNovo)
      else if (removerVideo) form.append('home_video', '')
      if (posterNovo) form.append('home_video_poster', posterNovo)
      else if (removerPoster) form.append('home_video_poster', '')
      form.append('current_issue_pages', String(parseInt(pages, 10) || 0))
      const atualizado = await pb
        .collection('magazine_landing_page')
        .update<SettingsRecord>(rec.id, form)
      setRec(atualizado)
      setVideoNovo(null)
      setPosterNovo(null)
      setRemoverVideo(false)
      setRemoverPoster(false)
      setPages(atualizado.current_issue_pages ? String(atualizado.current_issue_pages) : '')
      if (videoInput.current) videoInput.current.value = ''
      if (posterInput.current) posterInput.current.value = ''
      clearMagazineHomeMediaCache()
      toast({
        title: 'Configurações salvas',
        description: 'A Home usa os novos dados em até 1 minuto.',
      })
    } catch (err) {
      toast({
        title: 'Erro ao salvar',
        description: getErrorMessage(err),
      })
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="space-y-8">
        <h2 className="text-3xl font-serif font-bold text-secondary mb-4">Revistas SST</h2>
        <MagazineTabs />
        <p className="text-sm text-muted-foreground">Carregando configurações…</p>
      </div>
    )
  }

  if (!rec) {
    return (
      <div className="space-y-8">
        <h2 className="text-3xl font-serif font-bold text-secondary mb-4">Revistas SST</h2>
        <MagazineTabs />
        <p className="text-sm text-muted-foreground">
          Nenhum registro de configuração encontrado. Ele é criado automaticamente na primeira
          atualização de preços; tente salvar os preços da venda avulsa primeiro.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-serif font-bold text-secondary mb-4">Revistas SST</h2>
      <MagazineTabs />
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6 max-w-xl">
            {/* Vídeo da Home */}
            <div className="space-y-2">
              <Label htmlFor="home-video">Vídeo da Home (.mp4, até {MAX_VIDEO_MB} MB)</Label>
              <Input
                id="home-video"
                ref={videoInput}
                type="file"
                accept="video/mp4"
                autoComplete="off"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  if (f && !validarVideo(f)) {
                    e.target.value = ''
                    return
                  }
                  setVideoNovo(f)
                  setRemoverVideo(false)
                }}
              />
              {videoPreview && (
                <div className="mt-2 rounded-lg overflow-hidden border border-border max-w-[320px]">
                  <video
                    src={videoPreview}
                    controls
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full aspect-video bg-black"
                  />
                </div>
              )}
              {(rec.home_video || videoNovo) && !removerVideo && !videoNovo && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRemoverVideo(true)
                    setVideoNovo(null)
                  }}
                >
                  Remover vídeo atual
                </Button>
              )}
              {removerVideo && (
                <p className="text-xs text-muted-foreground">
                  O vídeo atual será removido ao salvar.
                </p>
              )}
            </div>

            {/* Imagem do vídeo (poster) */}
            <div className="space-y-2">
              <Label htmlFor="home-video-poster">Imagem do vídeo (.jpg)</Label>
              <Input
                id="home-video-poster"
                ref={posterInput}
                type="file"
                accept="image/jpeg"
                autoComplete="off"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  if (f && !validarPoster(f)) {
                    e.target.value = ''
                    return
                  }
                  setPosterNovo(f)
                  setRemoverPoster(false)
                }}
              />
              {posterPreview && (
                <div className="mt-2 rounded-lg overflow-hidden border border-border max-w-[260px]">
                  <img
                    src={posterPreview}
                    alt="Prévia da imagem do vídeo da Home"
                    width={520}
                    height={650}
                    loading="lazy"
                    decoding="async"
                    className="w-full aspect-[4/5] object-cover"
                  />
                </div>
              )}
              {(rec.home_video_poster || posterNovo) && !removerPoster && !posterNovo && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRemoverPoster(true)
                    setPosterNovo(null)
                  }}
                >
                  Remover imagem atual
                </Button>
              )}
              {removerPoster && (
                <p className="text-xs text-muted-foreground">
                  A imagem atual será removida ao salvar.
                </p>
              )}
            </div>

            {/* Nº de páginas da edição do mês */}
            <div className="space-y-2">
              <Label htmlFor="home-issue-pages">Nº de páginas da edição do mês</Label>
              <Input
                id="home-issue-pages"
                type="number"
                inputMode="numeric"
                min={0}
                autoComplete="off"
                placeholder="Ex.: 84"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Aparece no selo da Home: “Folheie a edição de {mesAtual()} — {pages || '?'}{' '}
                páginas”.
              </p>
            </div>

            <Button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="min-h-[44px] rounded-full font-bold"
            >
              {salvando ? 'Salvando…' : 'Salvar configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url
}

function mesAtual(): string {
  return new Date().toLocaleDateString('pt-BR', { month: 'long' })
}
