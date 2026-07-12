import { Mentorship } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, User } from 'lucide-react'

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
        <Card key={m.id} className="flex flex-col hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-serif text-secondary">{m.title}</CardTitle>
            <p className="text-sm font-medium text-primary flex items-center gap-1.5 mt-1">
              <User className="w-4 h-4" /> {m.mentor_name}
            </p>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-slate-600 line-clamp-3">{m.description}</p>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t pt-4">
            <span className="text-lg font-bold text-slate-800">
              {m.is_free ? 'Gratuito' : formatBRL(m.price)}
            </span>
            {m.scheduling_link && (
              <Button size="sm" asChild>
                <a href={m.scheduling_link} target="_blank" rel="noopener noreferrer">
                  Agendar Mentoria <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
