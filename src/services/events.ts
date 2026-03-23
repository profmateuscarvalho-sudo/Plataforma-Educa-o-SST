import pb from '@/lib/pocketbase/client'
import { PlatformEvent } from '@/types'

export const getEvents = () =>
  pb.collection('events').getFullList<PlatformEvent>({ sort: '-created' })

export const getEvent = (id: string) => pb.collection('events').getOne<PlatformEvent>(id)

export const createEvent = (data: FormData | Partial<PlatformEvent>) =>
  pb.collection('events').create<PlatformEvent>(data)

export const updateEvent = (id: string, data: FormData | Partial<PlatformEvent>) =>
  pb.collection('events').update<PlatformEvent>(id, data)

export const deleteEvent = (id: string) => pb.collection('events').delete(id)
