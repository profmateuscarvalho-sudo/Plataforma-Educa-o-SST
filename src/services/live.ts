import pb from '@/lib/pocketbase/client'
import { LiveSession, LiveMessage } from '@/types'

export const getLiveSessions = async () =>
  pb
    .collection('live_sessions')
    .getFullList<LiveSession>({ sort: '-scheduled_at', expand: 'mentor' })
export const getLiveSession = async (id: string) =>
  pb.collection('live_sessions').getOne<LiveSession>(id, { expand: 'mentor' })
export const createLiveSession = async (data: Partial<LiveSession> | Record<string, any>) =>
  pb.collection('live_sessions').create<LiveSession>(data)
export const updateLiveSession = async (
  id: string,
  data: Partial<LiveSession> | Record<string, any>,
) => pb.collection('live_sessions').update<LiveSession>(id, data)
export const deleteLiveSession = async (id: string) => pb.collection('live_sessions').delete(id)

export const getLiveMessages = async (sessionId: string) =>
  pb
    .collection('live_messages')
    .getFullList<LiveMessage>({ filter: `session="${sessionId}"`, sort: 'created', expand: 'user' })
export const sendLiveMessage = async (data: Partial<LiveMessage>) =>
  pb.collection('live_messages').create<LiveMessage>(data)
