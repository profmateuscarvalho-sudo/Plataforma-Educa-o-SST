import { useState, useEffect } from 'react'
import { getProfessionalTagOptions } from '@/services/professional-tag-options'

const FALLBACK_TAGS = [
  'Estudante',
  'Técnico em Segurança',
  'Engenheiro de Segurança',
  'Enfermeiro do Trabalho',
  'Médico do Trabalho',
  'Outros',
]

export function useProfessionalTags() {
  const [tags, setTags] = useState<string[]>(FALLBACK_TAGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfessionalTagOptions(true)
      .then((opts) => {
        if (opts.length > 0) setTags(opts.map((o) => o.name))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { tags, loading }
}
