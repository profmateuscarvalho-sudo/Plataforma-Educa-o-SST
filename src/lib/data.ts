export type Course = {
  id: string
  title: string
  category: string
  duration: string
  image: string
  description: string
  level: string
  price: number
  lessons: { id: string; title: string; duration: string }[]
}

export type Mentor = { id: string; name: string; role: string; image: string; bio: string }
export type Magazine = {
  id: string
  title: string
  issue: string
  image: string
  date: string
  summary: string
  pdfUrl: string
}

export const CATEGORIES = ['Medicina do Trabalho', 'Segurança do Trabalho', 'Gestão de SST']

export const COURSES: Course[] = [
  {
    id: 'c1',
    title: 'Especialização em Higiene Ocupacional Avançada',
    category: 'Segurança do Trabalho',
    duration: '120h',
    image: 'https://img.usecurling.com/p/600/400?q=laboratory&color=green',
    description:
      'Aprofunde-se nos métodos de avaliação e controle de riscos físicos, químicos e biológicos.',
    level: 'Avançado',
    price: 1297.0,
    lessons: [
      { id: 'l1', title: 'Introdução aos Riscos Químicos', duration: '45:00' },
      { id: 'l2', title: 'Dosimetria e Avaliação', duration: '55:30' },
    ],
  },
  {
    id: 'c2',
    title: 'Gestão Estratégica de SST para Lideranças',
    category: 'Gestão de SST',
    duration: '80h',
    image: 'https://img.usecurling.com/p/600/400?q=meeting&color=yellow',
    description:
      'Desenvolva habilidades de liderança e implementação de cultura de segurança em corporações.',
    level: 'Intermediário',
    price: 997.0,
    lessons: [{ id: 'l1', title: 'Cultura de Segurança Organizacional', duration: '40:00' }],
  },
  {
    id: 'c3',
    title: 'Atualização em Normas Regulamentadoras (NRs)',
    category: 'Segurança do Trabalho',
    duration: '60h',
    image: 'https://img.usecurling.com/p/600/400?q=documents&color=gray',
    description:
      'Mantenha-se atualizado com as últimas mudanças nas NRs e seus impactos jurídicos.',
    level: 'Básico',
    price: 497.0,
    lessons: [{ id: 'l1', title: 'Visão Geral das Novas NRs', duration: '35:00' }],
  },
]

export const MENTORS: Mentor[] = [
  {
    id: 'm1',
    name: 'Dr. Carlos Mendes',
    role: 'Especialista em Medicina do Trabalho',
    image: 'https://img.usecurling.com/ppl/large?gender=male&seed=1',
    bio: '20 anos de experiência em saúde ocupacional multinacional.',
  },
  {
    id: 'm2',
    name: 'Eng. Sarah Lemos',
    role: 'Engenheira de Segurança',
    image: 'https://img.usecurling.com/ppl/large?gender=female&seed=2',
    bio: 'Auditora líder ISO 45001 e consultora em gestão de riscos.',
  },
]

export const MAGAZINES: Magazine[] = [
  {
    id: 'mag1',
    title: 'Revista SST Premium',
    issue: 'Edição 42 - Ergonomia',
    image: 'https://img.usecurling.com/p/400/600?q=magazine&color=green',
    date: 'Out 2026',
    summary: 'Exploramos como o trabalho remoto contínuo afeta a ergonomia.',
    pdfUrl: '#',
  },
  {
    id: 'mag2',
    title: 'Revista SST Premium',
    issue: 'Edição 41 - Gestão de Crises',
    image: 'https://img.usecurling.com/p/400/600?q=industry&color=yellow',
    date: 'Set 2026',
    summary: 'Estudos de caso sobre gestão de crises industriais.',
    pdfUrl: '#',
  },
]
