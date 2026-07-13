import pb from '@/lib/pocketbase/client'
import { PlatformAnnouncement } from '@/types'

export const getAnnouncements = () =>
  pb.collection('platform_announcements').getFullList<PlatformAnnouncement>({
    sort: '-priority,-created',
    filter: 'active = true',
  })

export const getAllAnnouncements = () =>
  pb.collection('platform_announcements').getFullList<PlatformAnnouncement>({
    sort: '-created',
  })

export const createAnnouncement = (data: Partial<PlatformAnnouncement> | FormData) =>
  pb.collection('platform_announcements').create<PlatformAnnouncement>(data)

export const updateAnnouncement = (id: string, data: Partial<PlatformAnnouncement> | FormData) =>
  pb.collection('platform_announcements').update<PlatformAnnouncement>(id, data)

export const deleteAnnouncement = (id: string) => pb.collection('platform_announcements').delete(id)
