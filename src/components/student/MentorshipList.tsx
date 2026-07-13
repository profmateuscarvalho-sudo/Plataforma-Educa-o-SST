import { Mentorship } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { stripHtml } from '@/lib/utils'

interface MentorshipListProps {
  mentorships: Mentorship[]
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function MentorshipList({ mentorships }: MentorshipListProps) {
  if (mentorships.length === 0) {
    return (
      <p className="text-slate-500 col-span-full text-center py-12">
        Nenhuma mentoria disponível no momento.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {mentorships.map((m) => (
        <Card
          key={m.id}
          className="overflow-hidden flex flex-col hover:shadow-xl transition-shadow group"
        >
          {m.mentor_photo && (
            <div className="aspect-[4/3] overflow-hidden bg-slate-100">
              <img
                src={pb.files.getUrl(m, m.mentor_photo)}
                alt={m.mentor_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-lg font-serif text-secondary">{m.title}</CardTitle>
            <p className="text-sm font-medium text-primary">Com {m.mentor_name}</p>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-slate-600 line-clamp-3">{m.description}</p>
            {m.mentor_bio && (
              <p className="text-xs text-slate-400 line-clamp-2 mt-2">{stripHtml(m.mentor_bio)}</p>
            )}
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t pt-4">
            <span className="text-lg font-bold text-slate-800">
              {m.is_free ? 'Gratuito' : formatBRL(m.price)}
            </span>
            {m.scheduling_link && (
              <Button size="sm" asChild>
                <a href={m.scheduling_link} target="_blank" rel="noopener noreferrer">
                  Agendar <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
