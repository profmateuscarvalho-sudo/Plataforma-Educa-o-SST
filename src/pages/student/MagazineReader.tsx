import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Newspaper, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BackToHub } from '@/components/student/BackToHub'
import { MagazineBuyButton } from '@/components/magazine/MagazineBuyButton'
import { CheckoutModal } from '@/components/CheckoutModal'
import { useAuth } from '@/hooks/use-auth'
import { usePurchasedMagazines, isMagazinePurchased } from '@/hooks/use-purchased-magazines'
import { fetchMagazineReadLink, type MagazineReadLink } from '@/lib/magazine-read-link'
import pb from '@/lib/pocketbase/client'
import { getMagazines } from '@/services/magazines'
import type { Magazine } from '@/types'

export default function MagazineReader() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasedRefresh, setPurchasedRefresh] = useState(0)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const { purchased } = usePurchasedMagazines(user?.id, purchasedRefresh)

  const refetchMagazines = useCallback(() => {
    return getMagazines()
      .then(setMagazines)
      .catch(() => {})
  }, [])

  useEffect(() => {
    refetchMagazines().finally(() => setLoading(false))
  }, [refetchMagazines])

  const currentIndex = magazines.findIndex((m) => m.id === id)
  const magazine = currentIndex >= 0 ? magazines[currentIndex] : null
  const prevMag = currentIndex > 0 ? magazines[currentIndex - 1] : null
  const nextMag =
    currentIndex >= 0 && currentIndex < magazines.length - 1 ? magazines[currentIndex + 1] : null

  // O ACESSO É DECIDIDO PELO SERVIDOR: sempre busca o link pela rota protegida
  // (GET /backend/v1/magazine-read-link), que libera para Prata/Ouro ativo,
  // admin, compra 'paid' desta edição ou edição is_free (amostra). Os campos
  // da listagem são escondidos pela guarda e NÃO definem o estado aqui.
  const [readLink, setReadLink] = useState<MagazineReadLink | null>(null)
  const [linkLoading, setLinkLoading] = useState(true)

  const loadReadLink = useCallback(() => {
    if (!id) return
    setLinkLoading(true)
    fetchMagazineReadLink(id)
      .then(setReadLink)
      .catch(() =>
        setReadLink({ access: false, link: '', embed_code: '', embed_src: '', is_free: false }),
      )
      .finally(() => setLinkLoading(false))
  }, [id])

  useEffect(() => {
    loadReadLink()
  }, [loadReadLink])

  const unlocked = !!readLink?.access
  // Sem direito confirmado pelo servidor (compra local apenas como fallback
  // imediato pós-pagamento, antes da revalidação da rota).
  const showLocked =
    !linkLoading &&
    (!unlocked || (!readLink?.link && !readLink?.embed_code && !readLink?.embed_src))

  const handleBuy = useCallback(() => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
      return
    }
    setCheckoutOpen(true)
  }, [user, navigate, location.pathname])

  // Pagamento confirmado: revalida "minhas revistas", a lista e a rota
  // protegida (o servidor passa a liberar o link desta edição) — sem reload.
  const handlePaid = useCallback(() => {
    setPurchasedRefresh((k) => k + 1)
    refetchMagazines()
    loadReadLink()
  }, [refetchMagazines, loadReadLink])

  if (loading || (linkLoading && !magazine))
    return (
      <div className="min-h-[calc(100vh-64px)] bg-background flex items-center justify-center text-muted-foreground font-medium text-sm">
        Carregando revista...
      </div>
    )

  if (!magazine)
    return (
      <div className="min-h-[calc(100vh-64px)] bg-background flex flex-col items-center justify-center text-muted-foreground gap-4 p-6">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <Newspaper className="w-8 h-8 stroke-[1.75]" />
        </div>
        <p className="text-foreground font-serif font-bold text-lg">Revista não encontrada.</p>
        <Button
          variant="outline"
          onClick={() => navigate('/plataforma')}
          className="rounded-full border-[1.5px] border-foreground text-foreground hover:bg-muted min-h-[52px] px-6 font-semibold"
        >
          Voltar ao Hub
        </Button>
      </div>
    )

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background flex flex-col text-foreground">
      <div className="bg-card border-b border-border px-4 md:px-6 py-3.5 flex items-center justify-between gap-3 text-card-foreground">
        <div className="flex items-center gap-3 min-w-0">
          <BackToHub className="text-foreground hover:bg-muted" />
          <div className="min-w-0">
            <h1 className="text-foreground font-serif font-bold text-base md:text-lg truncate">
              {magazine.title}
            </h1>
            {magazine.summary && (
              <p className="text-muted-foreground text-xs line-clamp-1">{magazine.summary}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            disabled={!prevMag}
            onClick={() => prevMag && navigate(`/plataforma/revista/${prevMag.id}`)}
            className="rounded-full text-foreground hover:bg-muted disabled:opacity-30 h-9 px-3.5"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!nextMag}
            onClick={() => nextMag && navigate(`/plataforma/revista/${nextMag.id}`)}
            className="rounded-full text-foreground hover:bg-muted disabled:opacity-30 h-9 px-3.5"
          >
            Próxima <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-3 md:p-6 bg-muted/20">
        {linkLoading ? (
          <div className="py-20 text-sm text-muted-foreground font-medium">
            Carregando revista...
          </div>
        ) : showLocked ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground gap-4 py-16 bg-card rounded-[28px] border border-border p-8 max-w-lg mx-auto w-full text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Lock className="w-8 h-8 stroke-[1.75]" />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              A leitura completa desta edição faz parte do plano Prata — ou compre esta edição
              avulsa para ler agora.
            </p>
            <MagazineBuyButton
              magazineId={magazine.id}
              onBuy={handleBuy}
              className="w-full max-w-xs"
            />
            <Button
              variant="outline"
              onClick={() => navigate('/planos')}
              className="rounded-full border-[1.5px] border-foreground text-foreground hover:bg-muted min-h-[44px] px-5 font-semibold text-sm"
            >
              Ver planos de assinatura
            </Button>
          </div>
        ) : readLink?.embed_code ? (
          <div
            className="w-full h-full max-w-[1200px] bg-card rounded-[28px] overflow-hidden shadow-sm border border-border [&>iframe]:w-full [&>iframe]:h-[80vh]"
            dangerouslySetInnerHTML={{ __html: readLink.embed_code }}
          />
        ) : (
          <iframe
            src={readLink?.embed_src || readLink?.link}
            className="w-full max-w-[1200px] h-[80vh] bg-card rounded-[28px] shadow-sm border border-border"
            title={magazine.title}
          />
        )}
      </div>

      <CheckoutModal
        open={checkoutOpen}
        setOpen={setCheckoutOpen}
        title="Revista Educação SST — edição avulsa"
        magazineId={id}
        onPaid={handlePaid}
      />
    </div>
  )
}
