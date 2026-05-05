import pb from '@/lib/pocketbase/client'
import { SmtpSettings, EmailCampaign } from '@/types'

export const getSmtpSettings = async () => {
  try {
    const list = await pb.collection('smtp_settings').getList<SmtpSettings>(1, 1)
    return list.items[0] || null
  } catch {
    return null
  }
}

export const saveSmtpSettings = async (id: string | null, data: Partial<SmtpSettings>) => {
  if (id) {
    return pb.collection('smtp_settings').update<SmtpSettings>(id, data)
  }
  return pb.collection('smtp_settings').create<SmtpSettings>(data)
}

export const getEmailCampaigns = async () => {
  return pb.collection('email_campaigns').getFullList<EmailCampaign>({ sort: '-created' })
}

export const sendEmailCampaign = async (data: { subject: string; content: string }) => {
  return pb.send<{ success: boolean; sent: number; failed: number }>(
    '/backend/v1/leads/send-email',
    {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
