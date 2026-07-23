import { RecordModel } from 'pocketbase'

export interface User extends RecordModel {
  name: string
  email: string
  role: 'admin' | 'student'
  contract_end_date?: string
  phone?: string
  professional_profile?: string
  professional_tags?: string[]
  avatar?: string
  city?: string
  state?: string
  plan_tier?: 'free' | 'prata' | 'ouro'
  subscription_billing?: 'monthly' | 'yearly' | 'none'
  email_verificado?: boolean
}

export interface EmailLog extends RecordModel {
  recipient_email: string
  recipient_name: string
  email_type:
    | 'lead'
    | 'activation_free'
    | 'activation_paid'
    | 'payment_confirmed'
    | 'upgrade'
    | 'brevo_sync'
  sent: boolean
  sent_at: string | null
  brevo_synced: boolean
  brevo_list_id: number
  brevo_status: number
  error_message: string
  user?: string
  subscription?: string
  expand?: { user?: User; subscription?: RecordModel }
}

export interface Course extends RecordModel {
  title: string
  description: string
  category: string
  panda_video_id: string
  price: number
  thumbnail: string
  is_free?: boolean
}

export interface Module extends RecordModel {
  title: string
  order: number
  course: string
}

export interface Lesson extends RecordModel {
  title: string
  description: string
  panda_video_id: string
  order: number
  module: string
}

export interface Material extends RecordModel {
  title: string
  file: string
  module: string
}

export interface Quiz extends RecordModel {
  title: string
  order: number
  module: string
}

export interface QuizQuestion extends RecordModel {
  quiz: string
  question: string
  options: string[]
  correct_option: string
}

export interface Magazine extends RecordModel {
  title: string
  summary: string
  fliphtml5_link: string
  embed_code?: string
  thumbnail: string
  is_featured: boolean
  is_free?: boolean
}

export interface SupportMessage extends RecordModel {
  user: string
  subject: string
  message: string
  status: 'pending' | 'answered'
  expand?: { user?: User }
}

export interface News extends RecordModel {
  title: string
  content: string
  category?: string
  image: string | string[]
  images?: string[]
}

export interface Payment extends RecordModel {
  user: string
  amount: number
  status: 'pending' | 'paid' | 'failed'
  ipag_id: string
  product_type: string
  mentorship_id?: string
  selected_slots?: AvailableSlot[]
  expand?: { user?: User }
}

export interface LiveSession extends RecordModel {
  title: string
  description: string
  panda_video_id: string
  status: 'scheduled' | 'live' | 'finished'
  scheduled_at: string
  instructor_name?: string
  instructor_bio?: string
  instructor_photo?: string
  mentor?: string
  instructor?: string
  expand?: { mentor?: Mentor; instructor?: Instructor }
}

export interface LiveMessage extends RecordModel {
  user?: string
  session?: string
  content: string
  is_question: boolean
  speaker_name?: string
  author_name?: string
  status?: 'pending' | 'active' | 'answered' | 'hidden'
  expand?: { user?: User }
}

export interface LessonCompletion extends RecordModel {
  user: string
  lesson: string
}

export interface LessonRating extends RecordModel {
  user: string
  lesson: string
  rating: number
  comment: string
  expand?: { user?: User }
}

export interface AvailableSlot {
  date: string
  time: string
}

export interface Mentor extends RecordModel {
  name: string
  mini_cv: string
  topics: string
  photo: string
}

export interface Instructor extends RecordModel {
  name: string
  bio: string
  photo: string
  topics: string
}

export interface Mentorship extends RecordModel {
  title: string
  description: string
  price: number
  scheduling_link: string
  mentor_name: string
  available_dates: string
  is_free?: boolean
  mentor_bio?: string
  mentor_photo?: string
  mentor?: string
  available_slots?: AvailableSlot[]
  expand?: { mentor?: Mentor }
}

export interface Lead extends RecordModel {
  name: string
  email: string
  phone: string
  message: string
}

export interface SmtpSettings extends RecordModel {
  host: string
  port: number
  user: string
  password?: string
  sender_name: string
  sender_email: string
  encryption: 'SSL' | 'TLS' | 'None'
}

export interface EmailCampaign extends RecordModel {
  subject: string
  content: string
  total_recipients: number
  status: 'sent' | 'failed'
}

export interface Author extends RecordModel {
  name: string
  email: string
  phone?: string
  bio?: string
  photos?: string[]
  status: 'pending' | 'approved'
}

export interface MagazineLandingPlan {
  title: string
  insertions: string
  price: number
  pricePerInsertion: number
  features: string[]
  bestValue: boolean
}

export interface MagazineLandingPage extends RecordModel {
  hero_title: string
  hero_description: string
  readers_count: string
  plans: MagazineLandingPlan[]
  whatsapp_number: string
  cta_text: string
}

export interface Article extends RecordModel {
  title: string
  content: string
  compliance_norms: boolean
  delivery_deadline?: string
  author: string
  magazine?: string
  article_photos?: string[]
  image_authorization?: { signed: boolean; name: string; date: string }
  article_authorization?: { signed: boolean; name: string; date: string }
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  expand?: {
    author?: Author
    magazine?: Magazine
  }
}

export interface ProfessionalConnection extends RecordModel {
  professional_name: string
  email: string
  responses: Record<string, string>
  photos?: string[]
  edition_month?: string
  status: 'pending' | 'approved'
}

export interface SubmissionToken extends RecordModel {
  token: string
  type: 'article' | 'connection'
  expires_at: string
  used: boolean
}

export interface DocProject extends RecordModel {
  title: string
  description: string
  panda_video_id?: string
  youtube_url?: string
  presentation_photos?: string[]
  is_free?: boolean
}

export interface Banner extends RecordModel {
  title: string
  image: string
  location: 'Home - Topo' | 'Home - Meio' | 'Lateral dos Artigos' | 'Rodapé'
  destination_link: string
  active: boolean
}

export interface Simulado extends RecordModel {
  title: string
  description: string
  banner: string
  active: boolean
  access_count?: number
  is_free?: boolean
}

export interface SimuladoQuestion extends RecordModel {
  simulado: string
  question: string
  options: string[]
  correct_option: string
}

export interface SimuladoSubmission extends RecordModel {
  user?: string
  simulado: string
}

export interface Workplace extends RecordModel {
  professional_name: string
  job_title: string
  city: string
  description: string
  photos?: string[]
}

export interface SubscriptionPlan extends RecordModel {
  name: string
  description: string
  price: number
  price_yearly?: number
  is_coming_soon?: boolean
  interval: 'monthly' | 'yearly'
  features: string[]
}

export interface ItineraryStep {
  id: string
  title: string
  done: boolean
}

export interface MindMapNode {
  id: string
  text: string
  x: number
  y: number
  parentId?: string
  color?: string
}

export interface MindMapConnection {
  id: string
  from: string
  to: string
}

export interface MindMapData {
  nodes: MindMapNode[]
  connections: MindMapConnection[]
}

export interface StudentNote extends RecordModel {
  user: string
  title: string
  content: string
  itinerary_data: MindMapData | ItineraryStep[] | null
}

export interface ProfessionalCase extends RecordModel {
  user: string
  title: string
  content: string
  status?: 'pending' | 'approved'
  expand?: { user?: User }
}

export interface CaseComment extends RecordModel {
  case: string
  user: string
  content: string
  expand?: { user?: User }
}

export interface CaseLike extends RecordModel {
  user: string
  case: string
}

export interface PlatformAnnouncement extends RecordModel {
  title: string
  content: string
  type: 'Texto Customizado' | 'Novo Curso' | 'Documentário' | 'Mentoria' | 'Aula Ao Vivo'
  reference_id: string
  active: boolean
  priority: number
}

export interface AgentKnowledgeBase extends RecordModel {
  title: string
  content: string
  tags: string[]
  source: string
  active: boolean
}

export interface AgentMessage extends RecordModel {
  user: string
  content: string
  role: 'user' | 'assistant'
  conversation_id: string
  expand?: { user?: User }
}

export interface AgentLimitsConfig extends RecordModel {
  limit_free: number
  limit_prata: number
  limit_ouro: number
}

export interface KnowledgeEntry extends RecordModel {
  title: string
  type: 'pdf' | 'image' | 'link' | 'free_text'
  file?: string
  url?: string
  raw_text?: string
  tags: string[]
  status: 'processing' | 'completed' | 'failed'
  error_message?: string
}

export interface KnowledgeChunk extends RecordModel {
  entry: string
  chunk_text: string
  tags: string[]
}

export interface KnowledgeSearchResult {
  text: string
  score: number
  title: string
  tags: string[]
}
