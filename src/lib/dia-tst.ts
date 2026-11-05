// Constantes da campanha "Sou Educação SST" — Dia do Técnico em Segurança do Trabalho.
export const INSTAGRAM_REVISTA = '@revistaeducacaosst'

export const DATA_LIMITE_ISO = '2026-11-27T23:59:00-03:00'

export function isInscricoesEncerradas(agora: Date = new Date()): boolean {
  return agora.getTime() >= new Date(DATA_LIMITE_ISO).getTime()
}

export const MSG_INSCRICOES_ENCERRADAS =
  'As inscrições foram encerradas. O resultado sai nos canais da Revista Educação SST.'

// Cores da campanha (verde-escuro e laranja da identidade)
export const CAMPANHA_CORES = {
  laranja: '#F97316',
  laranjaEscuro: '#C2410C',
  verdeEscuro: '#173F33',
  creme: '#FAF8F3',
} as const

export const REGULAMENTO_RESUMO = [
  'O concurso cultural "Sou Educação SST" é promovido pela EDUCAÇÃO SST LTDA (CNPJ 56.009.540/0001-90) em comemoração ao Dia do Técnico em Segurança do Trabalho (27 de novembro).',
  'Podem participar técnicos em Segurança do Trabalho e estudantes da área, residentes no Brasil, inscritos até 27/11/2026 às 23h59 (horário de Brasília).',
  'Para participar: preencha o formulário, monte a capa do story no próprio aparelho e publique nos seus stories do Instagram marcando a Revista Educação SST, com o perfil público no dia da publicação.',
  'As frases mais marcantes, avaliadas por uma comissão julgadora, ganham livros, EPIs e produtos oferecidos pelos parceiros da campanha.',
  'Ao se inscrever, o participante declara ser autor da frase e autoriza o uso da frase, nome, cidade e imagem na divulgação da campanha e na Revista Educação SST, sem ônus.',
  'O concurso é exclusivamente cultural: sem sorteio e sem necessidade de compra. O resultado sai nos canais oficiais da Revista Educação SST.',
]
