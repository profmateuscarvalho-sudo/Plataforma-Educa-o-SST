import { CaseFeedContent } from '@/components/student/CaseFeedContent'
import { TrendingThermometer } from '@/components/student/TrendingThermometer'
import { MessagesSquare } from 'lucide-react'
import { BackToHub } from '@/components/student/BackToHub'
import { useEffect } from 'react'
import { setMetaTags } from '@/lib/utils'
import { PUBLIC_URL } from '@/lib/constants'
import { useTrackAccess } from '@/hooks/use-track-access'

export default function StudentCaseFeed() {
  useTrackAccess('Feed de Cases')
  useEffect(() => {
    setMetaTags({
      title: 'Feed de Cases | Educação SST',
      description:
        'Compartilhe e discuta casos profissionais em Segurança e Saúde no Trabalho com a comunidade.',
      image: 'https://img.usecurling.com/p/1200/630?q=professional%20cases&color=teal',
      url: `${PUBLIC_URL}/plataforma/cases`,
    })
  }, [])

  return (
    <div className="min-h-[calc(100vh-56px)] bg-background text-foreground flex flex-col">
      <div className="border-b border-border bg-card py-8 px-4 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-foreground">
              <MessagesSquare className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-semibold text-foreground">Feed de Cases</h1>
              <p className="text-muted-foreground text-sm">
                Compartilhe e discuta casos profissionais
              </p>
            </div>
          </div>
          <BackToHub className="border-[1.5px] border-foreground bg-transparent text-foreground hover:bg-muted rounded-full min-h-[40px] px-4" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <CaseFeedContent />
          <div className="hidden lg:block">
            <TrendingThermometer />
          </div>
        </div>
      </div>
    </div>
  )
}
