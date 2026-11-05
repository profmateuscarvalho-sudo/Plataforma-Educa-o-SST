import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Download, Share2, Loader2, Maximize2, Move } from 'lucide-react'
import {
  gerarStoryImagem,
  desenharPreviewCapa,
  baixarStory,
  compartilharStory,
  suportaWebShareArquivos,
  garantirFontesStory,
} from '@/lib/story-canvas'

interface StoryCapaProps {
  nome: string
  cidadeUf: string
  instagramRevista: string
}

type FonteFoto = HTMLImageElement | ImageBitmap

export default function StoryCapa({ nome, cidadeUf, instagramRevista }: StoryCapaProps) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [fonte, setFonte] = useState<FonteFoto | null>(null)
  const [zoom, setZoom] = useState(1)
  const [desloc, setDesloc] = useState({ x: 0, y: 0 })
  const [gerando, setGerando] = useState(false)
  const [imagem, setImagem] = useState<string | null>(null)
  const [erroFoto, setErroFoto] = useState('')
  const previewRef = useRef<HTMLCanvasElement>(null)
  const arrastando = useRef<{ ativo: boolean; x: number; y: number }>({
    ativo: false,
    x: 0,
    y: 0,
  })

  useEffect(() => {
    if (!arquivo) return
    let revogado = false
    ;(async () => {
      try {
        let f: FonteFoto
        try {
          f = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
        } catch {
          const url = URL.createObjectURL(arquivo)
          const img = new Image()
          await new Promise<void>((res, rej) => {
            img.onload = () => res()
            img.onerror = () => rej(new Error('fail'))
            img.src = url
          })
          if (revogado) {
            URL.revokeObjectURL(url)
            return
          }
          f = img
        }
        if (revogado) return
        setFonte(f)
        setZoom(1)
        setDesloc({ x: 0, y: 0 })
        setImagem(null)
        setErroFoto('')
      } catch {
        setErroFoto('Não foi possível abrir esta imagem. Tente outra foto (JPG ou PNG).')
      }
    })()
    return () => {
      revogado = true
    }
  }, [arquivo])

  // Redesenha a prévia 9:16 sempre que zoom/deslocamento/foto mudam.
  useEffect(() => {
    const canvas = previewRef.current
    if (!canvas || !fonte) return
    desenharPreviewCapa(canvas, fonte, zoom, desloc.x, desloc.y)
  }, [fonte, zoom, desloc])

  const mover = useCallback(
    (dxPx: number, dyPx: number) => {
      setDesloc((atual) => {
        const limiteX = zoom * 0.6
        const limiteY = zoom * 0.6
        return {
          x: Math.max(-limiteX, Math.min(limiteX, atual.x + dxPx / 300)),
          y: Math.max(-limiteY, Math.min(limiteY, atual.y + dyPx / 300)),
        }
      })
    },
    [zoom],
  )

  const aoEscolher = (lista: FileList | null) => {
    const f = lista && lista.length > 0 ? lista[0] : null
    if (f) setArquivo(f)
  }

  const gerar = async () => {
    if (!arquivo) return
    setGerando(true)
    try {
      await garantirFontesStory()
      // Desenha num canvas 1080×1920 com o mesmo enquadramento da prévia:
      // reutiliza gerarStoryImagem, que aplica zoom/cover central — o ajuste
      // fino de arraste é replicado aplicando o deslocamento na fonte.
      const dataUrl = await gerarComEnquadramento()
      setImagem(dataUrl)
    } catch {
      setErroFoto('Não foi possível gerar a imagem. Tente novamente com outra foto.')
    } finally {
      setGerando(false)
    }
  }

  const gerarComEnquadramento = async (): Promise<string> => {
    if (!arquivo) throw new Error('sem foto')
    // Cria um arquivo recortado com o enquadramento atual usando um canvas
    // intermediário no formato 9:16, mantendo a resolução de saída 1080×1920.
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1920
    if (fonte) desenharPreviewCapa(canvas, fonte, zoom, desloc.x, desloc.y)
    const blob = await new Promise<Blob>((res) =>
      canvas.toBlob((b) => res(b as Blob), 'image/jpeg', 0.95),
    )
    const recortado = new File([blob], 'enquadramento.jpg', { type: 'image/jpeg' })
    return gerarStoryImagem(recortado, { nome, cidadeUf }, instagramRevista)
  }

  const compartilhar = async () => {
    if (imagem && (await compartilharStory(imagem))) return
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink/70">
        Fotos no posto de trabalho, com EPI, ficam ótimas. A imagem é montada no seu aparelho e não
        é enviada para nenhum servidor.
      </p>

      <div className="grid gap-5 sm:grid-cols-[1fr_auto] items-start">
        {/* Controles */}
        <div className="space-y-4">
          <label className="block">
            <span className="sr-only">Escolher foto</span>
            <input
              type="file"
              accept="image/*,.heic,.heif"
              className="hidden"
              onChange={(e) => aoEscolher(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full border-2 border-dashed border-verde-escuro/40 text-verde-escuro hover:bg-verde-escuro/5 h-12"
              onClick={(e) => {
                const input = (e.currentTarget.parentElement as HTMLElement).querySelector(
                  'input[type=file]',
                ) as HTMLInputElement | null
                input?.click()
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              {arquivo ? 'Trocar foto' : 'Escolher foto'}
            </Button>
          </label>

          {erroFoto && <p className="text-sm text-destructive">{erroFoto}</p>}

          {fonte && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-ink/80">
                <Maximize2 className="w-4 h-4" /> Zoom ({zoom.toFixed(1)}x)
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-orange-600"
              />
              <div className="flex items-center gap-2 text-xs text-ink/60">
                <Move className="w-4 h-4" /> Arraste na prévia para enquadrar.
              </div>
            </div>
          )}
        </div>

        {/* Prévia 9:16 */}
        <div className="mx-auto sm:mx-0">
          <div
            className="relative rounded-xl overflow-hidden border-4 border-verde-escuro/70 bg-verde-escuro/10 touch-none cursor-move shadow-lg"
            style={{ width: 240, height: 426 }}
            onPointerDown={(e) => {
              arrastando.current = { ativo: true, x: e.clientX, y: e.clientY }
              ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
            }}
            onPointerMove={(e) => {
              if (!arrastando.current.ativo) return
              mover(e.clientX - arrastando.current.x, e.clientY - arrastando.current.y)
              arrastando.current = { ativo: true, x: e.clientX, y: e.clientY }
            }}
            onPointerUp={() => {
              arrastando.current.ativo = false
            }}
            onPointerLeave={() => {
              arrastando.current.ativo = false
            }}
          >
            <canvas ref={previewRef} width={240} height={426} className="block w-full h-full" />
            {!fonte && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-verde-escuro/60 px-6 text-center">
                Sua capa aparece aqui
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          disabled={!fonte || gerando}
          onClick={gerar}
          className="bg-laranja hover:bg-laranja/90 text-white h-12 text-base font-semibold"
        >
          {gerando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Gerar imagem do story
        </Button>

        {imagem && (
          <div className="space-y-3">
            <img
              src={imagem}
              alt="Capa do story gerada"
              className="mx-auto rounded-xl border-4 border-verde-escuro/70 shadow-lg"
              style={{ width: 240, height: 426, objectFit: 'cover' }}
            />
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                type="button"
                onClick={() => baixarStory(imagem)}
                className="bg-verde-escuro hover:bg-verde-escuro/90 text-white"
              >
                <Download className="w-4 h-4 mr-2" /> Baixar imagem
              </Button>
              {suportaWebShareArquivos() && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={compartilhar}
                  className="border-verde-escuro text-verde-escuro"
                >
                  <Share2 className="w-4 h-4 mr-2" /> Compartilhar no Instagram
                </Button>
              )}
            </div>
            <p className="text-xs text-center text-ink/60 sm:hidden">
              Você pode tocar e segurar a imagem para salvá-la.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
