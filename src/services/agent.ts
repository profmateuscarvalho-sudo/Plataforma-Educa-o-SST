import pb from '@/lib/pocketbase/client'
import { BACKEND_URL } from '@/lib/constants'
import { streamAgentChat, type StreamAgentChatResult } from '@/lib/skipAi'
import { AgentKnowledgeBase, AgentMessage, AgentLimitsConfig } from '@/types'

export const getAgentKnowledgeBase = async () =>
  pb.collection('agent_knowledge_base').getFullList<AgentKnowledgeBase>({ sort: '-created' })

export const createAgentKnowledge = async (data: Partial<AgentKnowledgeBase>) =>
  pb.collection('agent_knowledge_base').create<AgentKnowledgeBase>(data)

export const updateAgentKnowledge = async (id: string, data: Partial<AgentKnowledgeBase>) =>
  pb.collection('agent_knowledge_base').update<AgentKnowledgeBase>(id, data)

export const deleteAgentKnowledge = async (id: string) =>
  pb.collection('agent_knowledge_base').delete(id)

export const getAllAgentMessages = async () =>
  pb.collection('agent_messages').getFullList<AgentMessage>({ sort: '-created', expand: 'user' })

export const getAgentLimits = async () => {
  const list = await pb
    .collection('agent_limits_config')
    .getFullList<AgentLimitsConfig>({ sort: '-created' })
  return list[0] || null
}

export const createAgentLimits = async (data: Partial<AgentLimitsConfig>) =>
  pb.collection('agent_limits_config').create<AgentLimitsConfig>(data)

export const updateAgentLimits = async (id: string, data: Partial<AgentLimitsConfig>) =>
  pb.collection('agent_limits_config').update<AgentLimitsConfig>(id, data)

export const getAgentUsage = async (): Promise<{
  used: number
  limit: number
  plan_tier: string
}> => pb.send('/backend/v1/agent/usage', { method: 'GET' })

export async function loadLatestConversation(): Promise<{
  conversationId: string | null
  messages: AgentMessage[]
}> {
  const userId = pb.authStore.record?.id
  if (!userId) return { conversationId: null, messages: [] }

  let convId = localStorage.getItem('agent_conversation_id')

  if (!convId) {
    const latest = await pb.collection('agent_messages').getList<AgentMessage>(1, 1, {
      filter: `user="${userId}"`,
      sort: '-created',
    })
    convId = latest.items[0]?.conversation_id || null
  }

  if (!convId) return { conversationId: null, messages: [] }

  const messages = await pb.collection('agent_messages').getFullList<AgentMessage>({
    filter: `user="${userId}" && conversation_id="${convId}"`,
    sort: 'created',
  })

  return { conversationId: convId, messages }
}

export async function sendAgentMessage(
  message: string,
  conversationId: string | null,
  onChunk: (delta: string, full: string) => void,
  signal?: AbortSignal,
): Promise<StreamAgentChatResult> {
  const res = await fetch(`${BACKEND_URL}/backend/v1/agent/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token || '',
    },
    body: JSON.stringify({ message, conversation_id: conversationId }),
    signal,
  })

  if (!res.ok) {
    let msg = `Erro: ${res.status}`
    try {
      const body = await res.json()
      if (body.error) msg = body.error
    } catch {
      /* intentionally ignored */
    }
    throw new Error(msg)
  }

  return streamAgentChat(res, { onChunk, signal })
}
