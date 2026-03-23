import pb from '@/lib/pocketbase/client'
import { EventRegistration } from '@/types'

export const getEventRegistrations = (eventId?: string) => {
  const options: Record<string, string> = { sort: '-created' }
  if (eventId) {
    options.filter = `event = "${eventId}"`
  }
  return pb.collection('event_registrations').getFullList<EventRegistration>(options)
}

export const createEventRegistration = (data: Partial<EventRegistration>) =>
  pb.collection('event_registrations').create<EventRegistration>(data)

export const updateEventRegistration = (id: string, data: Partial<EventRegistration>) =>
  pb.collection('event_registrations').update<EventRegistration>(id, data)

export const deleteEventRegistration = (id: string) =>
  pb.collection('event_registrations').delete(id)
