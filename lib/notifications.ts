import { createServerClient } from './supabase/server'
import { TipoNotificacao } from '@/types'

export interface CreateNotificationParams {
  usuario_id: string
  titulo: string
  mensagem: string
  tipo?: TipoNotificacao
  link?: string | null
}

/**
 * Cria uma notificação in-app para um usuário específico
 */
export async function createNotification({
  usuario_id,
  titulo,
  mensagem,
  tipo = 'sistema',
  link = null,
}: CreateNotificationParams) {
  try {
    const supabase = createServerClient()
    const { data, error } = await (supabase
      .from('notificacoes') as any)
      .insert({
        usuario_id,
        titulo,
        mensagem,
        tipo,
        link,
        lida: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar notificação:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Falha inesperada ao criar notificação:', err)
    return null
  }
}

/**
 * Cria notificações em massa para múltiplos usuários (ex: todos os membros do ministério)
 */
export async function createBatchNotifications(
  notifications: CreateNotificationParams[]
) {
  if (!notifications.length) return []

  try {
    const supabase = createServerClient()
    const { data, error } = await (supabase
      .from('notificacoes') as any)
      .insert(
        notifications.map((n) => ({
          usuario_id: n.usuario_id,
          titulo: n.titulo,
          mensagem: n.mensagem,
          tipo: n.tipo || 'sistema',
          link: n.link || null,
          lida: false,
        }))
      )
      .select()

    if (error) {
      console.error('Erro ao criar notificações em lote:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Falha inesperada ao criar notificações em lote:', err)
    return []
  }
}
