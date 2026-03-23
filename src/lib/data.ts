export type Course = {
  id: string
  title: string
  category: string
  duration: string
  image: string
  description: string
  level: string
}

export type Mentor = {
  id: string
  name: string
  role: string
  image: string
  bio: string
}

export type Magazine = {
  id: string
  title: string
  issue: string
  image: string
  date: string
  summary: string
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
  },
  {
    id: 'c2',
    title: 'Gestão Estratégica de SST para Lideranças',
    category: 'Gestão de SST',
    duration: '80h',
    image: 'https://img.usecurling.com/p/600/400?q=meeting&color=green',
    description:
      'Desenvolva habilidades de liderança e implementação de cultura de segurança em grandes corporações.',
    level: 'Intermediário',
  },
  {
    id: 'c3',
    title: 'Atualização em Normas Regulamentadoras (NRs)',
    category: 'Segurança do Trabalho',
    duration: '60h',
    image: 'https://img.usecurling.com/p/600/400?q=documents&color=green',
    description:
      'Mantenha-se atualizado com as últimas mudanças nas NRs e seus impactos jurídicos e práticos.',
    level: 'Básico',
  },
  {
    id: 'c4',
    title: 'Medicina do Trabalho e Ergonomia',
    category: 'Medicina do Trabalho',
    duration: '150h',
    image: 'https://img.usecurling.com/p/600/400?q=medical&color=green',
    description:
      'Práticas ergonômicas aplicadas e prevenção de doenças ocupacionais no ambiente moderno.',
    level: 'Avançado',
  },
  {
    id: 'c5',
    title: 'Auditoria de Conformidade em SST',
    category: 'Gestão de SST',
    duration: '90h',
    image: 'https://img.usecurling.com/p/600/400?q=audit&color=green',
    description:
      'Técnicas e metodologias para conduzir auditorias internas e externas em saúde e segurança.',
    level: 'Avançado',
  },
  {
    id: 'c6',
    title: 'Primeiros Socorros em Ambientes Industriais',
    category: 'Medicina do Trabalho',
    duration: '40h',
    image: 'https://img.usecurling.com/p/600/400?q=emergency&color=green',
    description:
      'Protocolos de atendimento emergencial focados em cenários de alto risco industrial.',
    level: 'Básico',
  },
]

export const MENTORS: Mentor[] = [
  {
    id: 'm1',
    name: 'Dr. Carlos Mendes',
    role: 'Especialista em Medicina do Trabalho',
    image: 'https://img.usecurling.com/ppl/large?gender=male&seed=1',
    bio: 'Mais de 20 anos de experiência na implementação de programas de saúde ocupacional em multinacionais.',
  },
  {
    id: 'm2',
    name: 'Eng. Sarah Lemos',
    role: 'Engenheira de Segurança do Trabalho',
    image: 'https://img.usecurling.com/ppl/large?gender=female&seed=2',
    bio: 'Auditora líder ISO 45001 e consultora em gestão de riscos complexos na indústria química.',
  },
  {
    id: 'm3',
    name: 'Prof. Roberto Alves',
    role: 'Doutor em Ergonomia Aplicada',
    image: 'https://img.usecurling.com/ppl/large?gender=male&seed=3',
    bio: 'Pesquisador renomado e autor de diversos livros sobre ergonomia cognitiva e física no trabalho.',
  },
]

export const MAGAZINES: Magazine[] = [
  {
    id: 'mag1',
    title: 'Revista SST Premium',
    issue: 'Edição 42 - O Futuro da Ergonomia',
    image: 'https://img.usecurling.com/p/400/600?q=magazine&color=green',
    date: 'Outubro 2026',
    summary:
      'Nesta edição, exploramos como o trabalho remoto contínuo afeta a ergonomia e as novas regulamentações.',
  },
  {
    id: 'mag2',
    title: 'Revista SST Premium',
    issue: 'Edição 41 - Gestão de Crises',
    image: 'https://img.usecurling.com/p/400/600?q=industry&color=gray',
    date: 'Setembro 2026',
    summary: 'Estudos de caso reais sobre gestão de crises em grandes complexos industriais.',
  },
  {
    id: 'mag3',
    title: 'Revista SST Premium',
    issue: 'Edição 40 - Saúde Mental no Trabalho',
    image: 'https://img.usecurling.com/p/400/600?q=mental-health&color=blue',
    date: 'Agosto 2026',
    summary:
      'A importância da saúde mental como pilar fundamental da segurança do trabalho moderna.',
  },
  {
    id: 'mag4',
    title: 'Revista SST Premium',
    issue: 'Edição 39 - Inovações em EPIs',
    image: 'https://img.usecurling.com/p/400/600?q=safety-gear&color=orange',
    date: 'Julho 2026',
    summary: 'Novos materiais e tecnologias embarcadas nos Equipamentos de Proteção Individual.',
  },
]
