import { ClientResponseError } from 'pocketbase'

export type FieldErrors = Record<string, string>

/**
 * Traduz as mensagens de validação do PocketBase para português e
 * formata a mensagem por campo no formato "Campo: motivo".
 */
const FIELD_LABELS: Record<string, string> = {
  name: 'Nome',
  title: 'Título',
  description: 'Descrição',
  content: 'Conteúdo',
  price: 'Preço',
  price_yearly: 'Preço anual',
  amount: 'Valor',
  interval: 'Intervalo',
  features: 'Funcionalidades',
  category: 'Categoria',
  thumbnail: 'Imagem de capa',
  photo: 'Foto',
  image: 'Imagem',
  images: 'Imagens',
  banner: 'Banner',
  file: 'Arquivo',
  files: 'Arquivos',
  logo: 'Logo',
  bio: 'Bio',
  mini_cv: 'Mini CV',
  topics: 'Tópicos',
  status: 'Status',
  active: 'Ativo',
  email: 'E-mail',
  password: 'Senha',
  'password-confirm': 'Confirmação de senha',
  oldPassword: 'Senha atual',
  phone: 'Telefone',
  whatsapp: 'WhatsApp',
  city: 'Cidade',
  state: 'Estado',
  order: 'Ordem',
  module: 'Módulo',
  course: 'Curso',
  lesson: 'Aula',
  quiz: 'Quiz',
  question: 'Questão',
  options: 'Alternativas',
  correct_option: 'Alternativa correta',
  user: 'Usuário',
  simulado: 'Simulado',
  scheduled_at: 'Data e hora',
  delivery_deadline: 'Prazo de entrega',
  magazine: 'Revista',
  author: 'Autor',
  url: 'Link (URL)',
  link: 'Link',
  summary: 'Resumo',
  type: 'Tipo',
  subject: 'Assunto',
  message: 'Mensagem',
  comment: 'Comentário',
  rating: 'Nota',
  notes: 'Notas',
  tag: 'Tag',
  tags: 'Tags',
  raw_text: 'Texto',
  json_data: 'Dados (JSON)',
  mentor: 'Mentor',
  mentor_name: 'Nome do mentor',
  available_dates: 'Datas disponíveis',
  available_slots: 'Horários disponíveis',
  scheduling_link: 'Link de agendamento',
  fliphtml5_link: 'Link FlipHTML5',
  embed_code: 'Código de incorporação',
  connection_questions: 'Perguntas da conexão',
  editorial_comments: 'Comentários da editoria',
  article_word_file: 'Arquivo Word do artigo',
  article_pdf_file: 'Arquivo PDF do artigo',
  article_photos: 'Fotos do artigo',
  image_authorization: 'Autorização de imagem',
  article_authorization: 'Autorização do artigo',
  professional_name: 'Nome do profissional',
  job_title: 'Cargo',
  responses: 'Respostas',
  edition_month: 'Mês da edição',
  panda_video_id: 'ID do vídeo (Panda)',
  youtube_url: 'Link do YouTube',
  presentation_photos: 'Fotos da apresentação',
  instructor: 'Professor',
  instructor_name: 'Nome do professor',
  instructor_bio: 'Bio do professor',
  instructor_photo: 'Foto do professor',
  is_free: 'Acesso gratuito',
  is_public: 'Público',
  is_coming_soon: 'Em breve',
  is_featured: 'Destaque',
  priority: 'Prioridade',
  reference_id: 'ID de referência',
  access_count: 'Contagem de acessos',
  score: 'Pontuação',
  total_questions: 'Total de questões',
  percentage: 'Porcentagem',
  completed_at: 'Concluído em',
  hero_title: 'Título do hero',
  hero_description: 'Descrição do hero',
  readers_count: 'Número de leitores',
  plans: 'Planos',
  whatsapp_number: 'Número de WhatsApp',
  cta_text: 'Texto do botão',
  destination_link: 'Link de destino',
  location: 'Localização',
  source: 'Origem',
  role: 'Perfil',
  plan: 'Plano',
  plan_tier: 'Nível do plano',
  contract_end_date: 'Data de fim do contrato',
  professional_profile: 'Perfil profissional',
  professional_tags: 'Tags profissionais',
  tema: 'Tema',
  questao_id: 'Questão',
  ativa: 'Ativa',
  nome: 'Nome',
  nome_empresa: 'Nome da empresa',
  cnpj: 'CNPJ',
  nome_contato: 'Nome do contato',
  telefone: 'Telefone',
  segmento: 'Segmento',
  origem: 'Origem',
  observacoes: 'Observações',
  cliente_id: 'Cliente',
  titulo: 'Título',
  valor_estimado: 'Valor estimado',
  responsavel: 'Responsável',
  etapa: 'Etapa',
  resultado: 'Resultado',
  data_prevista_fechamento: 'Data prevista de fechamento',
  nota: 'Nota',
  frase: 'Frase',
  instagram: 'Instagram',
  aceite_regulamento: 'Aceite do regulamento',
  aceite_lgpd: 'Aceite da LGPD',
  data: 'Data',
  chave: 'Chave',
  regulamento: 'Regulamento',
  ordem: 'Ordem',
  session: 'Sessão',
  speaker_name: 'Nome do palestrante',
  author_name: 'Nome do autor',
  recipient_name: 'Nome do destinatário',
  recipient_email: 'E-mail do destinatário',
  sent: 'Enviado',
  sent_at: 'Enviado em',
  brevo_synced: 'Sincronizado com Brevo',
  error_message: 'Mensagem de erro',
  playlist_url: 'URL da playlist',
  limit_free: 'Limite do plano Free',
  limit_prata: 'Limite do plano Prata',
  limit_ouro: 'Limite do plano Ouro',
  chunk_text: 'Trecho',
  entry: 'Entrada',
  meta: 'Metadados',
  event_type: 'Tipo de evento',
  area: 'Área',
  usuario_id: 'Usuário',
  pergunta_id: 'Pergunta',
  acertou: 'Acertou',
  respondida_em: 'Respondida em',
  sequencia_atual: 'Sequência atual',
  recorde: 'Recorde',
  ultima_data: 'Última data',
  endpoint: 'Endpoint',
  p256dh: 'Chave p256dh',
  auth: 'Autenticação',
  debate_id: 'Debate',
  posicao: 'Posição',
  justificativa: 'Justificativa',
  apoios: 'Apoios',
  voto_id: 'Voto',
  moderador_id: 'Moderador',
  data_inicio: 'Data de início',
  data_termino: 'Data de término',
  categoria_tags: 'Tags de categoria',
  regras_conduta: 'Regras de conduta',
  conclusoes: 'Conclusões',
  aprendizados: 'Aprendizados',
  plano: 'Plano',
  compliance_norms: 'Normas de compliance',
  language: 'Idioma',
  used: 'Utilizado',
  expires_at: 'Expira em',
  token: 'Token',
  ip: 'IP',
  requests: 'Requisições',
}

const PB_MESSAGES: [RegExp, (match: RegExpMatchArray) => string][] = [
  [/^Cannot be blank\.?$/i, () => 'campo obrigatório (não pode ficar vazio).'],
  [/^must be a valid email address\.?$/i, () => 'informe um e-mail válido.'],
  [/^must be a valid URL\.?$/i, () => 'informe uma URL válida (ex.: https://...).'],
  [
    /^validation_not_unique$/i,
    () => 'já existe um registro com esse valor (o campo exige valor único).',
  ],
  [/^must be greater than or equal to (.+)$/i, (m) => `deve ser maior ou igual a ${m[1]}.`],
  [/^must be less than or equal to (.+)$/i, (m) => `deve ser menor ou igual a ${m[1]}.`],
  [/^missing row$/i, () => 'campo obrigatório (valor de relação inválido).'],
  [/^value must be one of (.+)$/i, (m) => `valor inválido — as opções aceitas são: ${m[1]}.`],
  [/^requires at least (\d+) value[s]?$/i, (m) => `requer no mínimo ${m[1]} valor(es).`],
  [/^requires at most (\d+) value[s]?$/i, (m) => `aceita no máximo ${m[1]} valor(es).`],
  [/^invalid JSON\??$/i, () => 'conteúdo JSON inválido.'],
  [/^file must not exceed (\d+) bytes\.?$/i, (m) => `arquivo maior que ${formatBytes(m[1])}.`],
  [
    /^failed to find any file by mime type\??$/i,
    () => 'tipo de arquivo não permitido (formato não aceito neste campo).',
  ],
]

function formatBytes(bytes: string): string {
  const n = Number(bytes)
  if (!isFinite(n) || n <= 0) return `${bytes} bytes`
  if (n >= 1024 * 1024) return `${Math.round(n / (1024 * 1024))} MB`
  if (n >= 1024) return `${Math.round(n / 1024)} KB`
  return `${n} bytes`
}

function translateDetail(field: string, detail: string): string {
  const label = FIELD_LABELS[field] || field
  for (const [re, build] of PB_MESSAGES) {
    const m = detail.match(re)
    if (m) return `${label}: ${build(m)}`
  }
  return `${label}: ${detail}`
}

/**
 * Extrai os erros por campo da resposta de validação do PocketBase
 * (status 400 + response.data.{campo: {code, message}}), traduzindo
 * cada mensagem para português e prefixando com o nome do campo.
 */
export function extractFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ClientResponseError)) return {}
  const data = error.response?.data
  if (!data || typeof data !== 'object') return {}
  const errors: FieldErrors = {}
  for (const [field, detail] of Object.entries(data)) {
    if (
      detail &&
      typeof detail === 'object' &&
      'message' in detail &&
      typeof (detail as { message: unknown }).message === 'string'
    ) {
      errors[field] = translateDetail(field, (detail as { message: string }).message)
    }
  }
  return errors
}

/** Versão resumida dos erros por campo: "Campo: motivo" concatenados. */
export function getFieldErrorsSummary(error: unknown): string {
  const msgs = Object.values(extractFieldErrors(error))
  return msgs.join(' ')
}

/**
 * Mensagem completa de erro para exibir no toast: junta os erros por campo
 * (traduzidos, com o nome do campo) ou cai na mensagem genérica do PocketBase.
 */
export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) {
    return error instanceof Error ? error.message : 'Erro inesperado ao salvar.'
  }
  const fieldMsgs = Object.values(extractFieldErrors(error))
  if (fieldMsgs.length > 0) return fieldMsgs.join(' ')
  const fallback = error.response?.message || error.message
  return fallback || 'Erro inesperado ao salvar.'
}

/**
 * Versão conveniente para toast: título fixo + descrição com os erros por campo.
 */
export function getSaveError(
  error: unknown,
  entity = 'registro',
): {
  title: string
  description?: string
} {
  const description = getErrorMessage(error)
  return {
    title: `Erro ao salvar ${entity}`,
    description: description === 'Erro inesperado ao salvar.' ? undefined : description,
  }
}

/** Valida um arquivo antes de enviar (tamanho e tipo), para avisar antes do POST. */
export function validateFile(
  file: File | null | undefined,
  opts: { maxSizeMB?: number; mimeTypes?: string[]; label?: string } = {},
): string | null {
  if (!file || !file.size) return null
  const { maxSizeMB = 10, mimeTypes, label = 'arquivo' } = opts
  if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
    return `O ${label} selecionado tem ${(file.size / (1024 * 1024)).toFixed(
      1,
    )} MB e excede o limite de ${maxSizeMB} MB.`
  }
  if (mimeTypes && mimeTypes.length > 0 && !mimeTypes.includes(file.type)) {
    return `Formato de ${label} não suportado (${file.type}). Use: ${mimeTypes.join(', ')}.`
  }
  return null
}
