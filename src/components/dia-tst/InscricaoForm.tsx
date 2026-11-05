import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { criarInscricaoDiaTst, getRegulamentoDiaTst } from '@/services/dia_tst'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { validarWhatsApp, formatarWhatsApp } from '@/lib/dia-tst-form'

export interface FormularioInscricao {
  nome: string
  cidade_uf: string
  email: string
  whatsapp: string
  instagram: string
  frase: string
}

interface Props {
  aberto: boolean
  onSucesso: (dados: FormularioInscricao, jaExistia?: boolean) => void
}

const VAZIO: FormularioInscricao = {
  nome: '',
  cidade_uf: '',
  email: '',
  whatsapp: '',
  instagram: '',
  frase: '',
}

export default function InscricaoForm({ aberto, onSucesso }: Props) {
  const { toast } = useToast()
  const [dados, setDados] = useState<FormularioInscricao>(VAZIO)
  const [erros, setErros] = useState<Partial<Record<keyof FormularioInscricao, string>>>({})
  const [aceiteRegulamento, setAceiteRegulamento] = useState(false)
  const [aceiteLgpd, setAceiteLgpd] = useState(false)
  const [aceitaComunicacoes, setAceitaComunicacoes] = useState(false)
  const [erroAceites, setErroAceites] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [regulamentoAberto, setRegulamentoAberto] = useState(false)
  const [regulamento, setRegulamento] = useState('')

  useEffect(() => {
    if (!regulamentoAberto) return
    getRegulamentoDiaTst().then(setRegulamento)
  }, [regulamentoAberto])

  const campo = (k: keyof FormularioInscricao, v: string) => {
    setDados((d) => ({ ...d, [k]: v }))
    setErros((e) => ({ ...e, [k]: undefined }))
  }

  const validar = (): boolean => {
    const e: typeof erros = {}
    if (!dados.nome.trim()) e.nome = 'Informe seu nome completo.'
    else if (dados.nome.trim().length > 120) e.nome = 'Até 120 caracteres.'
    if (!dados.cidade_uf.trim()) e.cidade_uf = 'Informe cidade e UF (ex.: São Paulo/SP).'
    else if (dados.cidade_uf.trim().length > 80) e.cidade_uf = 'Até 80 caracteres.'
    if (!/^\S+@\S+\.\S+$/.test(dados.email.trim())) e.email = 'Informe um e-mail válido.'
    if (!validarWhatsApp(dados.whatsapp)) e.whatsapp = 'Informe um WhatsApp válido com DDD.'
    if (!dados.instagram.trim()) e.instagram = 'Informe seu @ do Instagram.'
    if (!dados.frase.trim()) e.frase = 'Conte por que você escolheu ser TST.'
    setErros(e)
    if (!aceiteRegulamento || !aceiteLgpd) {
      setErroAceites('Os dois primeiros itens são obrigatórios para participar.')
      return false
    }
    setErroAceites('')
    return Object.keys(e).length === 0
  }

  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validar()) return
    setEnviando(true)
    try {
      await criarInscricaoDiaTst({
        ...dados,
        whatsapp: dados.whatsapp.replace(/\D/g, ''),
        instagram: dados.instagram.trim().startsWith('@')
          ? dados.instagram.trim()
          : '@' + dados.instagram.trim(),
        aceite_regulamento: aceiteRegulamento,
        aceite_lgpd: aceiteLgpd,
        aceita_comunicacoes: aceitaComunicacoes,
        origem: sessionStorage.getItem('dia_tst_utm') || '',
      })
      toast({
        title: 'Inscrição confirmada!',
        description: 'Agora monte sua capa e poste nos stories.',
      })
      onSucesso(dados)
    } catch (err) {
      const msg = getErrorMessage(err)
      if (msg.includes('já está inscrito')) {
        // E-mail duplicado: mostra aviso e libera a etapa 2 sem duplicar.
        toast({
          title: 'Este e-mail já está inscrito.',
          description: 'Você pode montar sua capa normalmente.',
        })
        onSucesso(dados, true)
        return
      }
      if (msg.includes('encerradas')) {
        toast({ title: 'Inscrições encerradas', description: msg, variant: 'destructive' })
        return
      }
      setErros((atual) => ({ ...atual, email: msg }))
      toast({ title: 'Não foi possível concluir', description: msg, variant: 'destructive' })
    } finally {
      setEnviando(false)
    }
  }

  const contadorFrase = useMemo(() => dados.frase.length, [dados.frase])

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Nome */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="tst-nome">Nome completo</Label>
          <Input
            id="tst-nome"
            value={dados.nome}
            maxLength={120}
            onChange={(e) => campo('nome', e.target.value)}
            className="bg-white"
          />
          {erros.nome && <p className="text-xs text-destructive">{erros.nome}</p>}
        </div>

        {/* Cidade/UF */}
        <div className="space-y-1.5">
          <Label htmlFor="tst-cidade">Cidade/UF</Label>
          <Input
            id="tst-cidade"
            value={dados.cidade_uf}
            maxLength={80}
            placeholder="São Paulo/SP"
            onChange={(e) => campo('cidade_uf', e.target.value)}
            className="bg-white"
          />
          {erros.cidade_uf && <p className="text-xs text-destructive">{erros.cidade_uf}</p>}
        </div>

        {/* WhatsApp */}
        <div className="space-y-1.5">
          <Label htmlFor="tst-whatsapp">WhatsApp</Label>
          <Input
            id="tst-whatsapp"
            value={dados.whatsapp}
            placeholder="(00) 00000-0000"
            inputMode="tel"
            onChange={(e) => campo('whatsapp', formatarWhatsApp(e.target.value))}
            className="bg-white"
          />
          {erros.whatsapp && <p className="text-xs text-destructive">{erros.whatsapp}</p>}
        </div>

        {/* E-mail */}
        <div className="space-y-1.5">
          <Label htmlFor="tst-email">E-mail</Label>
          <Input
            id="tst-email"
            type="email"
            value={dados.email}
            onChange={(e) => campo('email', e.target.value)}
            className="bg-white"
          />
          {erros.email && <p className="text-xs text-destructive">{erros.email}</p>}
        </div>

        {/* Instagram */}
        <div className="space-y-1.5">
          <Label htmlFor="tst-instagram">Seu Instagram</Label>
          <Input
            id="tst-instagram"
            value={dados.instagram}
            placeholder="@seuperfil"
            onChange={(e) => campo('instagram', e.target.value)}
            className="bg-white"
          />
          {erros.instagram && <p className="text-xs text-destructive">{erros.instagram}</p>}
        </div>

        {/* Frase */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="tst-frase">
            Em até 300 caracteres: por que você escolheu ser Técnico(a) em Segurança do Trabalho?
          </Label>
          <textarea
            id="tst-frase"
            value={dados.frase}
            maxLength={300}
            rows={4}
            onChange={(e) => campo('frase', e.target.value)}
            className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="flex justify-between text-xs">
            {erros.frase ? (
              <span className="text-destructive">{erros.frase}</span>
            ) : (
              <span className="text-muted-foreground">
                Fale do seu trabalho, da prevenção, da sua rotina.
              </span>
            )}
            <span
              className={
                contadorFrase > 280 ? 'text-laranja-escuro font-semibold' : 'text-muted-foreground'
              }
            >
              {contadorFrase}/300
            </span>
          </div>
        </div>
      </div>

      {/* Aceites */}
      <div className="space-y-3 rounded-lg border border-verde-escuro/15 bg-verde-escuro/[0.03] p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="tst-aceite-reg"
            checked={aceiteRegulamento}
            onCheckedChange={(v) => {
              setAceiteRegulamento(v === true)
              setErroAceites('')
            }}
            className="mt-0.5 data-[state=checked]:bg-verde-escuro data-[state=checked]:border-verde-escuro"
          />
          <label htmlFor="tst-aceite-reg" className="text-sm leading-snug cursor-pointer">
            Li e aceito o{' '}
            <button
              type="button"
              className="text-laranja underline underline-offset-2 font-semibold"
              onClick={(e) => {
                e.preventDefault()
                setRegulamentoAberto(true)
              }}
            >
              regulamento
            </button>{' '}
            do concurso cultural e autorizo o uso da minha frase e imagem na divulgação da campanha
            e na Revista Educação SST.
          </label>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox
            id="tst-aceite-lgpd"
            checked={aceiteLgpd}
            onCheckedChange={(v) => {
              setAceiteLgpd(v === true)
              setErroAceites('')
            }}
            className="mt-0.5 data-[state=checked]:bg-verde-escuro data-[state=checked]:border-verde-escuro"
          />
          <label htmlFor="tst-aceite-lgpd" className="text-sm leading-snug cursor-pointer">
            Autorizo o tratamento dos meus dados para a participação no concurso, conforme a{' '}
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noreferrer"
              className="text-laranja underline underline-offset-2 font-semibold"
            >
              política de privacidade
            </a>
            .
          </label>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox
            id="tst-aceite-com"
            checked={aceitaComunicacoes}
            onCheckedChange={(v) => setAceitaComunicacoes(v === true)}
            className="mt-0.5 data-[state=checked]:bg-verde-escuro data-[state=checked]:border-verde-escuro"
          />
          <label htmlFor="tst-aceite-com" className="text-sm leading-snug cursor-pointer">
            Quero receber conteúdos e novidades da Educação SST por e-mail e WhatsApp.
          </label>
        </div>
        {erroAceites && <p className="text-xs text-destructive">{erroAceites}</p>}
      </div>

      <Button
        type="submit"
        disabled={enviando}
        className="w-full h-12 bg-laranja hover:bg-laranja/90 text-white text-base font-semibold"
      >
        {enviando ? 'Confirmando…' : 'Confirmar inscrição'}
      </Button>
      <p className="text-[11px] leading-relaxed text-ink/60 text-center">
        Concurso exclusivamente cultural, sem sorteio e sem necessidade de compra. Promoção:
        EDUCAÇÃO SST LTDA, CNPJ 56.009.540/0001-90.
      </p>

      {/* Modal do regulamento */}
      <Dialog open={regulamentoAberto} onOpenChange={setRegulamentoAberto}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Regulamento — Concurso Cultural Sou Educação SST</DialogTitle>
            <DialogDescription>
              Promoção: EDUCAÇÃO SST LTDA, CNPJ 56.009.540/0001-90.
            </DialogDescription>
          </DialogHeader>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: regulamento || '<p>Carregando…</p>' }}
          />
        </DialogContent>
      </Dialog>
    </form>
  )
}
