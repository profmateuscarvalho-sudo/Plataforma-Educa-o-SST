import pb from '@/lib/pocketbase/client'
import { WorkshopInvitation } from '@/types'

export const getInvitations = (eventId: string) =>
  pb.collection('workshop_invitations').getFullList<WorkshopInvitation>({
    filter: `event="${eventId}"`,
    sort: '-created',
  })

export const createInvitation = (data: Partial<WorkshopInvitation>) =>
  pb.collection('workshop_invitations').create<WorkshopInvitation>(data)

export const deleteInvitation = (id: string) => pb.collection('workshop_invitations').delete(id)

export const updateInvitationStatus = (id: string, status: string) =>
  pb.collection('workshop_invitations').update(id, { status })
