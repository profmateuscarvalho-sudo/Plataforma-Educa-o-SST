import { RecordModel } from 'pocketbase'

export interface User extends RecordModel {
  name: string
  email: string
  role: 'admin' | 'student'
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
  thumbnail: string
  is_featured: boolean
}

export interface News extends RecordModel {
  title: string
  content: string
  image: string
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

export interface PlatformEvent extends RecordModel {
  title: string
  description: string
  type: 'Workshop' | 'Aula Online' | 'Aula Presencial'
  date: string
  end_date?: string
  price: number
  location?: string
  meeting_link?: string
  thumbnail?: string
  panda_video_id?: string
}

export interface EventRegistration extends RecordModel {
  event: string
  name: string
  email: string
  phone?: string
  status: 'confirmed' | 'pending' | 'cancelled'
}
