import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { HomeShelf } from '@/components/home/HomeShelf'
import { Magazine, Course, Mentorship, DocProject } from '@/types'
import { formatBRL, priceForEdition, MagazinePricing } from '@/lib/magazine-pricing'
import {
  MENTORSHIP_DISCOUNT,
  mentorshipDiscountedPrice,
  tierAllows,
  type AccessTier,
} from '@/lib/plan-access'

const IMG_W = 208
const IMG_H = 250

/** Capa da edição da revista, com tamanho recortado para carregar leve. */
export function magazineCoverUrl(mag: Magazine): string | null {
  if (!mag.thumbnail) return null
  return pb.files.getUrl(mag, mag.thumbnail, { thumb: '400x500' })
}

function ShelfCard({
  children,
  to,
  ariaLabel,
}: {
  children: React.ReactNode
  to: string
  ariaLabel: string
}) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className="group shrink-0 w-[168px] sm:w-[200px] rounded-2xl overflow-hidden border border-[#E4DED1] bg-white shadow-sm hover:shadow-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {children}
    </Link>
  )
}

export function MagazineShelf({ magazines }: { magazines: Magazine[] }) {
  return (
    <HomeShelf title="Edições da Revista" moreTo="/revistas">
      {magazines.map((mag) => {
        const cover = magazineCoverUrl(mag)
        return (
          <ShelfCard
            key={mag.id}
            to={`/revistas?revista=${mag.id}`}
            ariaLabel={`Revista ${mag.title}`}
          >
            <div className="relative aspect-[4/5] bg-[#FAF8F3]">
              {cover ? (
                <img
                  src={cover}
                  alt={`Capa da ${mag.title}`}
                  width={IMG_W}
                  height={IMG_H}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#7F7869] font-serif text-sm px-2 text-center">
                  {mag.title}
                </div>
              )}
            </div>
            <div className="px-3 py-2.5">
              <p className="font-serif font-semibold text-sm text-[#1C1B18] line-clamp-1">
                {mag.title}
              </p>
            </div>
          </ShelfCard>
        )
      })}
    </HomeShelf>
  )
}

export function CoursesShelf({ courses }: { courses: Course[] }) {
  return (
    <HomeShelf title="Cursos" moreTo="/cursos">
      {courses.map((course) => (
        <ShelfCard key={course.id} to={`/cursos/${course.id}`} ariaLabel={`Curso ${course.title}`}>
          <div className="relative aspect-[16/10] bg-[#FAF8F3]">
            <img
              src={
                course.thumbnail
                  ? pb.files.getUrl(course, course.thumbnail, { thumb: '400x250' })
                  : 'https://img.usecurling.com/p/400/250?q=education&color=green'
              }
              alt={`Capa do curso ${course.title}`}
              width={IMG_W}
              height={IMG_H}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
            <span
              className={`absolute top-2 left-2 inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm ${
                course.is_free ? 'bg-[#FDBE2D] text-[#1C1B18]' : 'bg-[#173F33] text-[#F4F1E8]'
              }`}
            >
              {course.is_free ? 'Gratuito' : 'Prata'}
            </span>
          </div>
          <div className="px-3 py-2.5">
            <p className="font-serif font-semibold text-sm text-[#1C1B18] line-clamp-2 leading-snug">
              {course.title}
            </p>
          </div>
        </ShelfCard>
      ))}
    </HomeShelf>
  )
}

export function MentorshipsShelf({
  mentorships,
  tier = 'none',
}: {
  mentorships: Mentorship[]
  /** Tier do visitante: Prata/Ouro veem o preço com desconto em destaque. */
  tier?: AccessTier
}) {
  const temDesconto = tierAllows(tier, 'prata')
  return (
    <HomeShelf title="Mentorias" moreTo="/mentorias">
      {mentorships.map((m) => {
        const photoUrl = m.mentor_photo
          ? pb.files.getUrl(m, m.mentor_photo, { thumb: '400x250' })
          : m.expand?.mentor?.photo
            ? pb.files.getUrl(m.expand.mentor, m.expand.mentor.photo, { thumb: '400x250' })
            : null
        return (
          <ShelfCard
            key={m.id}
            to={`/mentorias?mentoria=${m.id}`}
            ariaLabel={`Mentoria ${m.title}`}
          >
            <div className="relative aspect-[16/10] bg-[#FAF8F3]">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={`Mentor ${m.mentor_name}`}
                  width={IMG_W}
                  height={IMG_H}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[#7F7869]">
                  {m.mentor_name?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="px-3 py-2.5">
              <p className="font-serif font-semibold text-sm text-[#1C1B18] line-clamp-2 leading-snug">
                {m.title}
              </p>
              {temDesconto ? (
                <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                  {/* Prata/Ouro: preço cheio riscado + 30% off em destaque */}
                  <span className="text-[11px] text-muted-foreground line-through">
                    {formatBRL(m.price)}
                  </span>
                  <span className="font-bold text-sm text-[#173F33]">
                    {formatBRL(mentorshipDiscountedPrice(m.price))}
                  </span>
                  <span className="text-[11px] font-bold text-[#173F33]">
                    {Math.round(MENTORSHIP_DISCOUNT * 100)}% off Prata/Ouro
                  </span>
                </div>
              ) : (
                <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                  {/* Demais: preço cheio + aviso do desconto de assinante */}
                  <span className="font-bold text-sm text-[#1C1B18]">{formatBRL(m.price)}</span>
                  <span className="text-[11px] font-semibold text-[#173F33]">
                    30% off para assinantes Prata
                  </span>
                </div>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground font-medium">
                {m.available_dates ? `Próxima data: ${m.available_dates}` : 'Novas datas em breve'}
              </p>
            </div>
          </ShelfCard>
        )
      })}
    </HomeShelf>
  )
}

export function DocumentariesShelf({ docs }: { docs: DocProject[] }) {
  // Sem "Ver todos": ainda não existe listagem pública de documentários.
  return (
    <HomeShelf title="Documentários">
      {docs.map((doc) => {
        const cover = doc.presentation_photos?.[0]
          ? pb.files.getUrl(doc, doc.presentation_photos[0], { thumb: '400x250' })
          : null
        return (
          <ShelfCard
            key={doc.id}
            to={`/documentarios/${doc.id}`}
            ariaLabel={`Documentário ${doc.title}`}
          >
            <div className="relative aspect-[16/10] bg-[#173F33]">
              {cover ? (
                <img
                  src={cover}
                  alt={`Capa do documentário ${doc.title}`}
                  width={IMG_W}
                  height={IMG_H}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#FDBE2D] font-serif text-lg px-2 text-center">
                  {doc.title}
                </div>
              )}
            </div>
            <div className="px-3 py-2.5">
              <p className="font-serif font-semibold text-sm text-[#1C1B18] line-clamp-1">
                {doc.title}
              </p>
            </div>
          </ShelfCard>
        )
      })}
    </HomeShelf>
  )
}

/**
 * Bloco de comparação: edição avulsa (preço público da rota magazine-pricing)
 * vs. assinatura (valor por dia vindo do cálculo dos planos).
 */
export function PricingComparison({
  pricing,
  perDay,
}: {
  pricing: MagazinePricing | null
  perDay: number
}) {
  return (
    <section className="py-14 sm:py-20 bg-[#173F33] text-[#F4F1E8]">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="rounded-2xl border border-white/10 bg-[#122e26] p-6 sm:p-8">
          <p className="text-xs font-bold tracking-[0.14em] uppercase text-[#F4F1E8]/70 mb-2">
            Uma edição avulsa
          </p>
          <p className="font-serif text-3xl sm:text-4xl font-bold text-[#F4F1E8]">
            {pricing ? formatBRL(pricing.current) : 'R$ 29,90'}
          </p>
          <p className="mt-2 text-sm text-[#F4F1E8]/70">
            Uma única edição, leitura avulsa no site.
          </p>
        </div>
        <div className="rounded-2xl border border-[#FDBE2D]/40 bg-[#FDBE2D]/10 p-6 sm:p-8">
          <p className="text-xs font-bold tracking-[0.14em] uppercase text-[#FDBE2D] mb-2">
            Todas as edições + cursos + aulas ao vivo
          </p>
          <p className="font-serif text-3xl sm:text-4xl font-bold text-[#FDBE2D]">
            menos de {formatBRL(perDay)} por dia
          </p>
          <p className="mt-2 text-sm text-[#F4F1E8]/80">
            Assinatura anual Prata: revista completa, todos os cursos e as aulas ao vivo.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-5 h-11 px-7 rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none"
          >
            <Link to="/planos" className="inline-flex items-center gap-2">
              Assinar o Prata
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

// priceForEdition é exportado para quem monta as prateleiras com preços por edição
export { priceForEdition }
