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

export interface Magazine extends RecordModel {
  title: string
  summary: string
  fliphtml5_link: string
  thumbnail: string
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
}

export interface Lead extends RecordModel {
  name: string
  email: string
  phone: string
  message: string
}
