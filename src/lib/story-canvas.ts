// Geração da imagem do story 1080×1920 para a campanha "Sou Educação SST".
// Tudo acontece no navegador: a foto do participante nunca é enviada a servidor.

export interface StoryDados {
  nome: string
  cidadeUf: string
}

const LARANJA = '#F97316'
const VERDE_ESCURO = '#12352B'
const BRANCO = '#FFFFFF'

const FONTES_URL =
  'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@900&family=Figtree:wght@400;600;700;800&display=swap'

let fontesCarregadas = false

/** Garante que Big Shoulders Display (900) e Figtree estão prontas antes de desenhar. */
export async function garantirFontesStory(): Promise<void> {
  if (fontesCarregadas) return
  try {
    if (!document.getElementById('dia-tst-fontes')) {
      const link = document.createElement('link')
      link.id = 'dia-tst-fontes'
      link.rel = 'stylesheet'
      link.href = FONTES_URL
      document.head.appendChild(link)
    }
    await Promise.all([
      document.fonts.load('900 100px "Big Shoulders Display"'),
      document.fonts.load('800 40px "Figtree"'),
      document.fonts.load('400 40px "Figtree"'),
    ])
    await document.fonts.ready
    fontesCarregadas = true
  } catch {
    // Segue com fallback do sistema se as fontes não carregarem.
  }
}

/** Corrige a orientação EXIF via createImageBitmap (navegadores modernos). */
async function decodificarImagem(arquivo: File): Promise<HTMLImageElement | ImageBitmap> {
  try {
    return await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
  } catch {
    // Fallback: <img> + URL de objeto (navegadores modernos aplicam EXIF sozinhos).
    const url = URL.createObjectURL(arquivo)
    try {
      const img = new Image()
      img.decoding = 'sync'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Não foi possível abrir a imagem.'))
        img.src = url
      })
      return img
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    }
  }
}

function desenharListras(
  ctx: CanvasRenderingContext2D,
  y: number,
  altura: number,
  largura: number,
) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, y, largura, altura)
  ctx.clip()
  // Faixa listrada: laranja e verde-escuro em blocos inclinados.
  const bloco = 64
  ctx.fillStyle = VERDE_ESCURO
  ctx.fillRect(0, y, largura, altura)
  ctx.fillStyle = LARANJA
  const deslocamento = -(2 * bloco)
  for (let x = deslocamento; x < largura + 2 * bloco; x += 2 * bloco) {
    ctx.save()
    ctx.translate(x, 0)
    ctx.transform(1, 0, -0.5, 1, altura * 0.5, 0) // inclinação de ~26,5°
    ctx.fillRect(0, y - altura, bloco, altura * 3)
    ctx.restore()
  }
  ctx.restore()
}

function desenharDegradê(
  ctx: CanvasRenderingContext2D,
  y0: number,
  y1: number,
  cor: string,
  alphaInicio: number,
  alphaFim: number,
) {
  const g = ctx.createLinearGradient(0, y0, 0, y1)
  g.addColorStop(0, corInicio(alphaInicio, cor))
  g.addColorStop(1, corInicio(alphaFim, cor))
  ctx.fillStyle = g
  ctx.fillRect(0, Math.min(y0, y1) - 1, 1080, Math.abs(y1 - y0) + 2)
}

function corInicio(alpha: number, cor: string) {
  // cor em hex -> rgba
  const r = parseInt(cor.slice(1, 3), 16)
  const g = parseInt(cor.slice(3, 5), 16)
  const b = parseInt(cor.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Reduz "EDUCAÇÃO SST"/nome até caber em uma linha na largura dada. */
function fonteCaber(
  ctx: CanvasRenderingContext2D,
  texto: string,
  peso: string,
  tamanhoMax: number,
  larguraMax: number,
  minimo = 24,
): number {
  let tamanho = tamanhoMax
  while (tamanho > minimo) {
    ctx.font = `${peso} ${tamanho}px "Big Shoulders Display", "Arial Narrow", sans-serif`
    if (ctx.measureText(texto).width <= larguraMax) break
    tamanho -= 2
  }
  return tamanho
}

/** Desenha a capa final 1080×1920 e devolve o data URL JPEG (q 0.92). */
export async function gerarStoryImagem(
  foto: File,
  dados: StoryDados,
  instagramRevista: string,
): Promise<string> {
  await garantirFontesStory()
  const fonte = await decodificarImagem(foto)

  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')!

  const fw = fonte instanceof HTMLImageElement ? fonte.naturalWidth : fonte.width
  const fh = fonte instanceof HTMLImageElement ? fonte.naturalHeight : fonte.height

  // ---- Fundo: foto em modo cover ------------------------------------------
  const escalaCover = Math.max(1080 / fw, 1920 / fh)
  const dwBase = fw * escalaCover
  const dhBase = fh * escalaCover
  // O enquadramento da prévia (zoom + arraste) é replicado aqui:
  // expande a área desenhada em torno do centro e desloca conforme o arraste.
  const escala = escalaCover * zoom
  const dw = fw * escala
  const dh = fh * escala
  const dx = (1080 - dw) / 2 + offsetX * 1080
  const dy = (1920 - dh) / 2 + offsetY * 1920
  ctx.drawImage(fonte, dx, dy, dw, dh)

  // ---- Degradê escuro esverdeado no topo (0 → 620px) e base (últimos 900px)
  desenharDegradê(ctx, 0, 620, VERDE_ESCURO, 0.85, 0)
  desenharDegradê(ctx, 1920, 1020, VERDE_ESCURO, 0.96, 0)

  // ---- Faixa listrada laranja/verde de 26px na borda superior e inferior ---
  desenharListras(ctx, 0, 26, 1080)
  desenharListras(ctx, 1920 - 26, 26, 1080)

  const margem = 70
  const larguraTexto = 1080 - margem * 2

  // ---- Topo ----------------------------------------------------------------
  let y = 210
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  ctx.fillStyle = LARANJA
  ctx.font = '900 150px "Big Shoulders Display", "Arial Narrow", sans-serif'
  ctx.fillText('SOU', margem, y)
  y += 168

  ctx.fillStyle = BRANCO
  const tamanhoEducacao = fonteCaber(ctx, 'EDUCAÇÃO SST', '900', 190, larguraTexto)
  ctx.font = `900 ${tamanhoEducacao}px "Big Shoulders Display", "Arial Narrow", sans-serif`
  ctx.fillText('EDUCAÇÃO SST', margem, y)
  y += Math.round(tamanhoEducacao * 1.05) + 24

  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '38px "Figtree", sans-serif'
  ctx.fillText('Prevenção é o meu ofício.', margem, y)

  // ---- Base ----------------------------------------------------------------
  ctx.textBaseline = 'bottom'
  const baseTopo = 1020 // início da área da base (após o degradê de 900px)
  let yBase = 1920 - 26 - 36 // acima da faixa inferior

  // Traço laranja 120×10
  ctx.fillStyle = LARANJA
  ctx.fillRect(margem, yBase - 150, 120, 10)
  yBase -= 26

  // Nome (caixa alta, condensada, até 110px, uma linha)
  const nomeAlta = (dados.nome || '').toUpperCase()
  ctx.fillStyle = BRANCO
  const tamanhoNome = fonteCaber(ctx, nomeAlta, '900', 110, larguraTexto)
  ctx.font = `900 ${tamanhoNome}px "Big Shoulders Display", "Arial Narrow", sans-serif`
  ctx.fillText(nomeAlta, margem, yBase)
  yBase -= Math.round(tamanhoNome * 1.06) + 16

  // "Técnico(a) em Segurança do Trabalho"
  ctx.fillStyle = BRANCO
  ctx.font = 'bold 42px "Figtree", sans-serif'
  ctx.fillText('Técnico(a) em Segurança do Trabalho', margem, yBase)
  yBase -= 62

  // Cidade/UF
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '36px "Figtree", sans-serif'
  ctx.fillText(dados.cidadeUf || '', margem, yBase)

  // Bloco 27/11 à esquerda, alinhado à base
  const y27 = 1920 - 26 - 36
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = LARANJA
  ctx.font = '900 84px "Big Shoulders Display", "Arial Narrow", sans-serif'
  ctx.fillText('27/11', margem, y27)
  const largura27 = ctx.measureText('27/11').width
  ctx.fillStyle = BRANCO
  ctx.font = '600 36px "Figtree", sans-serif'
  ctx.fillText('Dia do Técnico em', margem + largura27 + 24, y27 - 52)
  ctx.fillText('Segurança do Trabalho', margem + largura27 + 24, y27 - 6)

  // @ da Revista alinhado à direita, perto da borda inferior
  ctx.textAlign = 'right'
  ctx.fillStyle = LARANJA
  ctx.font = '800 40px "Figtree", sans-serif'
  ctx.fillText(instagramRevista, 1080 - margem, y27 + 78)

  return canvas.toDataURL('image/jpeg', 0.92)
}

/** Baixa a imagem gerada como sou-educacao-sst-story.jpg. */
export function baixarStory(dataUrl: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = 'sou-educacao-sst-story.jpg'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** Web Share API com arquivos (compartilhar no Instagram). */
export async function compartilharStory(dataUrl: string): Promise<boolean> {
  try {
    const blob = await (await fetch(dataUrl)).blob()
    const arquivo = new File([blob], 'sou-educacao-sst-story.jpg', { type: 'image/jpeg' })
    if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
      await navigator.share({
        files: [arquivo],
        title: 'Sou Educação SST — Dia do TST',
      })
      return true
    }
  } catch {
    // usuário cancelou ou API indisponível
  }
  return false
}

export function suportaWebShareArquivos(): boolean {
  const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean }
  return typeof nav.share === 'function' && typeof nav.canShare === 'function'
}

/** Prévia 9:16 da foto com zoom/arraste (usada antes de gerar a imagem final). */
export function desenharPreviewCapa(
  canvas: HTMLCanvasElement,
  fonte: HTMLImageElement | ImageBitmap,
  zoom: number,
  offsetX: number,
  offsetY: number,
) {
  const largura = canvas.width
  const altura = canvas.height
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, largura, altura)
  const fw = fonte instanceof HTMLImageElement ? fonte.naturalWidth : fonte.width
  const fh = fonte instanceof HTMLImageElement ? fonte.naturalHeight : fonte.height
  const base = Math.max(largura / fw, altura / fh)
  const escala = base * zoom
  const dw = fw * escala
  const dh = fh * escala
  const dx = (largura - dw) / 2 + offsetX * largura
  const dy = (altura - dh) / 2 + offsetY * altura
  ctx.drawImage(fonte, dx, dy, dw, dh)
  // Faixas de sinalização nas bordas (mesmo estilo da capa final)
  desenharListras(ctx, 0, Math.max(6, Math.round(largura * 0.014)), largura)
  desenharListras(
    ctx,
    altura - Math.max(6, Math.round(largura * 0.014)),
    Math.max(6, Math.round(largura * 0.014)),
    largura,
  )
}
