import { useEffect, useState } from 'react'
import { Heart, MessageCircle, Plus } from 'lucide-react'
import { getCases, type CaseFeedItem } from '@/services/appService'
import { BottomSheet } from '@/components/app/BottomSheet'
import { useAuth } from '@/hooks/use-auth'
import { createCase } from '@/services/professional-cases'
import { toast } from '@/hooks/use-toast'

export default function Cases() {
  const { user } = useAuth()
  const [cases, setCases] = useState<CaseFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [publishOpen, setPublishOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    getCases()
      .then(setCases)
      .catch(() => setCases([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handlePublish = async () => {
    if (!user) return
    if (!title.trim() || !content.trim()) return
    setSubmitting(true)
    try {
      await createCase({
        user: user.id,
        title: title.trim(),
        content: content.trim(),
        status: 'pending',
      })
      toast({
        title: 'Case enviado!',
        description: 'Seu case foi enviado para moderação. Obrigado por compartilhar.',
      })
      setTitle('')
      setContent('')
      setPublishOpen(false)
      load()
    } catch {
      toast({ title: 'Não foi possível enviar', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-5 pt-6">
      <header className="mb-6">
        <h1 className="sst-title">Feed de cases</h1>
        <p
          className="sst-caption"
          style={{ marginTop: 4, textTransform: 'none', letterSpacing: 0 }}
        >
          Cases reais da comunidade, ordenados pelos mais discutidos da semana.
        </p>
      </header>

      {/* Publicar um case */}
      <button
        onClick={() => setPublishOpen(true)}
        className="sst-tap w-full flex items-center justify-center gap-2"
        style={{
          backgroundColor: 'var(--sst-amber)',
          color: 'var(--sst-text)',
          borderRadius: 'var(--sst-r-btn)',
          padding: '14px 16px',
          fontWeight: 700,
          fontSize: 14,
          marginBottom: 16,
        }}
      >
        <Plus style={{ width: 17, height: 17 }} strokeWidth={2} />
        Publicar um case
      </button>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 130,
                borderRadius: 'var(--sst-r-card)',
                backgroundColor: 'var(--sst-line-soft)',
              }}
            />
          ))}
        </div>
      ) : cases.length === 0 ? (
        <div className="sst-card" style={{ padding: 24, textAlign: 'center' }}>
          <p className="sst-body" style={{ color: 'var(--sst-text-2)' }}>
            Nenhum case publicado ainda.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {cases.map((c) => (
            <article key={c.id} className="sst-card" style={{ padding: 14 }}>
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: 'var(--sst-amber-wash)',
                    color: 'var(--sst-amber-ink)',
                    fontWeight: 800,
                    fontSize: 13,
                    fontFamily: 'var(--sst-font-display)',
                  }}
                >
                  {c._order}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="sst-card-title"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {c.title}
                  </p>
                </div>
              </div>
              <p
                className="sst-body"
                style={{
                  marginTop: 8,
                  color: 'var(--sst-text-2)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {c.content}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span
                  className="flex items-center gap-1.5"
                  style={{ color: 'var(--sst-text-2)', fontSize: 12 }}
                >
                  <Heart style={{ width: 14, height: 14 }} strokeWidth={1.75} />
                  {c._likes}
                </span>
                <span
                  className="flex items-center gap-1.5"
                  style={{ color: 'var(--sst-text-2)', fontSize: 12 }}
                >
                  <MessageCircle style={{ width: 14, height: 14 }} strokeWidth={1.75} />
                  {c._comments}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <BottomSheet open={publishOpen} onClose={() => setPublishOpen(false)}>
        <div>
          <p className="sst-label">Publicar um case</p>
          <h2 className="sst-display" style={{ fontSize: 20, marginTop: 6, marginBottom: 16 }}>
            Compartilhe um caso real
          </h2>
          <p
            className="sst-caption"
            style={{ marginBottom: 16, textTransform: 'none', letterSpacing: 0 }}
          >
            Sua autoria permanece anônima. O case será revisado pela moderação antes de aparecer no
            feed.
          </p>
          <label className="sst-label" style={{ display: 'block', marginBottom: 6 }}>
            Título
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Acidente com máquina de corte"
            className="w-full"
            style={{
              borderRadius: 'var(--sst-r-btn)',
              border: '1px solid var(--sst-line)',
              padding: '12px 14px',
              fontSize: 14,
              marginBottom: 14,
              outline: 'none',
            }}
          />
          <label className="sst-label" style={{ display: 'block', marginBottom: 6 }}>
            Descrição do caso
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Descreva a situação, o contexto e os aprendizados…"
            rows={6}
            className="w-full"
            style={{
              borderRadius: 'var(--sst-r-btn)',
              border: '1px solid var(--sst-line)',
              padding: '12px 14px',
              fontSize: 14,
              marginBottom: 18,
              outline: 'none',
              resize: 'none',
            }}
          />
          <button
            onClick={handlePublish}
            disabled={submitting || !title.trim() || !content.trim()}
            className="sst-tap w-full"
            style={{
              backgroundColor: 'var(--sst-amber)',
              color: 'var(--sst-text)',
              borderRadius: 'var(--sst-r-btn)',
              padding: '14px 16px',
              fontWeight: 700,
              fontSize: 14,
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? 'Enviando…' : 'Enviar para moderação'}
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
