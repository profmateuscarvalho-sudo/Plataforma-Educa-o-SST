import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { PlatformEvent } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Send, MessageCircleQuestion, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PublicEventQA() {
  const { id } = useParams()
  const [event, setEvent] = useState<PlatformEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [authorName, setAuthorName] = useState('')
  const [speakerName, setSpeakerName] = useState('')
  const [content, setContent] = useState('')

  const { toast } = useToast()

  useEffect(() => {
    if (!id) return
    pb.collection('events')
      .getOne<PlatformEvent>(id)
      .then(setEvent)
      .catch(() => toast({ title: 'Evento não encontrado', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [id, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !speakerName) return
    setSubmitting(true)
    try {
      await pb.collection('live_messages').create({
        event: id,
        content: content.trim(),
        speaker_name: speakerName,
        author_name: authorName.trim() || 'Anônimo',
        status: 'pending',
        is_question: true,
      })
      setSubmitted(true)
    } catch (err) {
      toast({ title: 'Erro ao enviar pergunta', variant: 'destructive' })
      setSubmitting(false)
    }
  }

  if (loading)
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )

  if (!event)
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Evento não encontrado.</p>
      </div>
    )

  const getSpeakerPhoto = (index: number) => {
    if (!event.speaker_photos || event.speaker_photos.length === 0) return null
    const prefix = `speaker_${index}_`
    const photos = event.speaker_photos.filter((p) => p.startsWith(prefix))
    if (photos.length === 0) return null
    return pb.files.getUrl(event, photos[photos.length - 1])
  }

  const allSpeakers = [
    ...(event.speakers || []),
    { name: 'Painel Geral', topic: 'Para todos os palestrantes', photo: '' },
  ]

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-6" />
        <h2 className="text-3xl font-serif font-bold text-secondary mb-2">Muito Obrigado!</h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
          Sua pergunta foi enviada ao moderador e poderá ser respondida ao vivo!
        </p>
        <Button
          size="lg"
          onClick={() => {
            setSubmitted(false)
            setContent('')
          }}
        >
          Fazer Outra Pergunta
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2">
          <MessageCircleQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-2xl md:text-4xl font-serif font-bold text-secondary">
          Perguntas e Respostas
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Evento: <strong className="text-foreground">{event.title}</strong>
        </p>
      </div>

      <Card className="border-primary/20 shadow-lg">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base">1. Para quem é a pergunta?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allSpeakers.map((spk, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSpeakerName(spk.name)}
                    className={cn(
                      'flex items-center gap-4 p-3 rounded-xl border-2 cursor-pointer transition-all',
                      speakerName === spk.name
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50 hover:bg-slate-50',
                    )}
                  >
                    <img
                      src={
                        spk.name === 'Painel Geral'
                          ? 'https://img.usecurling.com/i?q=people&color=multicolor&shape=fill'
                          : getSpeakerPhoto(idx) ||
                            `https://img.usecurling.com/ppl/thumbnail?seed=${idx}`
                      }
                      alt={spk.name}
                      className="w-12 h-12 rounded-full object-cover border bg-white"
                    />
                    <div>
                      <p className="font-semibold text-sm leading-tight">{spk.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{spk.topic}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base">2. Qual é a sua pergunta?</Label>
              <Textarea
                required
                maxLength={500}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite sua dúvida aqui..."
                className="min-h-[120px] resize-y text-base p-4"
              />
              <div className="text-right text-xs text-muted-foreground">{content.length}/500</div>
            </div>

            <div className="space-y-3">
              <Label className="text-base">3. Seu Nome (Opcional)</Label>
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Como gostaria de ser chamado?"
                className="h-12 text-base"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-14 text-lg"
              disabled={submitting || !content.trim() || !speakerName}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              Enviar Pergunta
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
