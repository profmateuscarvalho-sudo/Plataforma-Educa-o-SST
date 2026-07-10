import { RecordModel } from 'pocketbase'

export interface User extends RecordModel {
  name: string
  email: string
  role: 'admin' | 'student'
  contract_end_date?: string
}

export interface Course extends RecordModel {
  title: string
  description: string
  category: string
  panda_video_id: string
  price: number
  thumbnail: string
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
  expand?: { user?: User }
}

export interface LiveSession extends RecordModel {
  title: string
  description: string
  panda_video_id: string
  status: 'scheduled' | 'live' | 'finished'
  scheduled_at: string
}

export interface LiveMessage extends RecordModel {
  user?: string
  session?: string
  event?: string
  content: string
  is_question: boolean
  speaker_name?: string
  author_name?: string
  status?: 'pending' | 'active' | 'answered' | 'hidden'
  expand?: { user?: User; event?: PlatformEvent }
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

export interface Mentorship extends RecordModel {
  title: string
  description: string
  price: number
  scheduling_link: string
  mentor_name: string
  available_dates: string
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

export interface PlatformEvent extends RecordModel {
  title: string
  subtitle?: string
  description: string
  type: 'Workshop' | 'Aula Online' | 'Aula Presencial' | 'Summit'
  date: string
  end_date?: string
  price?: number
  location?: string
  meeting_link?: string
  thumbnail?: string
  panda_video_id?: string
  is_workshop?: boolean
  speakers?: { name: string; topic: string; bio?: string; photo?: string }[]
  structure?: string[]
  importance?: string
  objectives?: string[]
  sponsorship_value?: number
  sponsorship_tiers?: { name: string; price: number; benefits: string[] }[]
  partner_logos?: string[]
  speaker_photos?: string[]
}

export interface WorkshopInvitation extends RecordModel {
  event: string
  guest_name: string
  guest_email?: string
  token: string
  status: 'pending' | 'viewed' | 'confirmed' | 'declined'
  expand?: { event?: PlatformEvent }
}

export interface EventRegistration extends RecordModel {
  event: string
  name: string
  email: string
  phone?: string
  position?: string
  company_name?: string
  extra_guests?: { name: string; position: string; phone: string }[]
  status: 'confirmed' | 'pending' | 'cancelled'
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
  objectives: string[]
  target_audience: string
  estimated_duration: number
  episodes: number
  script_structure: string
  status: string
  notes: string
  topics?: string[]
  responsible: string
  attachments?: string[]
  total_budget: number
  slug?: string
  methodology?: string
  investment_quota?: number
  presentation_photos?: string[]
  estimated_release_date?: string
  expand?: { responsible?: User }
}

export interface DocProjectCost extends RecordModel {
  project: string
  category: 'Pré-produção' | 'Produção' | 'Equipamentos' | 'Pós-produção' | 'Outros'
  description: string
  estimated_value: number
}

export interface DocProjectRecording extends RecordModel {
  project: string
  date: string
  location: string
}

export interface DocProjectTeam extends RecordModel {
  project: string
  name: string
  role: string
  photo?: string
}

export interface DocProjectGuest extends RecordModel {
  project: string
  name: string
  bio: string
  photo?: string
}

export interface DocProjectTask extends RecordModel {
  project: string
  title: string
  deadline: string
  responsible: string
  status: 'A Fazer' | 'Em Andamento' | 'Concluído'
}

export interface Simulado extends RecordModel {
  title: string
  description: string
  banner: string
  active: boolean
  access_count?: number
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
