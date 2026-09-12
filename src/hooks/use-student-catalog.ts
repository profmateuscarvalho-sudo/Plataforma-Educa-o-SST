import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getCourses } from '@/services/courses'
import { getMagazines } from '@/services/magazines'
import { getMentorships } from '@/services/mentorships'
import { getSimulados } from '@/services/simulados'
import { getDocProjects } from '@/services/doc_projects'
import { getSubscriptionPlans } from '@/services/subscription-plans'
import { getCompletions } from '@/services/student'
import {
  Course,
  Magazine,
  Mentorship,
  Simulado,
  DocProject,
  SubscriptionPlan,
  LessonCompletion,
} from '@/types'

import { useTranslation } from 'react-i18next'

export function useStudentCatalog() {
  const { user } = useAuth()
  const { i18n } = useTranslation()
  const [courses, setCourses] = useState<Course[]>([])
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [simulados, setSimulados] = useState<Simulado[]>([])
  const [documentaries, setDocumentaries] = useState<DocProject[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [completions, setCompletions] = useState<LessonCompletion[]>([])
  const [loading, setLoading] = useState(true)

  const currentLang = i18n.language?.startsWith('es') ? 'es' : 'pt-BR'

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      getCourses().catch(() => []),
      getMagazines({ language: currentLang }).catch(() => []),
      getMentorships().catch(() => []),
      getSimulados(true).catch(() => []),
      getDocProjects().catch(() => []),
      getSubscriptionPlans().catch(() => []),
      getCompletions(user.id).catch(() => []),
    ])
      .then(([c, m, men, s, d, p, comp]) => {
        setCourses(c as Course[])
        setMagazines(m as Magazine[])
        setMentorships(men as Mentorship[])
        setSimulados(s as Simulado[])
        setDocumentaries(d as DocProject[])
        setPlans(p as SubscriptionPlan[])
        setCompletions(comp as LessonCompletion[])
      })
      .finally(() => setLoading(false))
  }, [user, currentLang])

  return { courses, magazines, mentorships, simulados, documentaries, plans, completions, loading }
}
