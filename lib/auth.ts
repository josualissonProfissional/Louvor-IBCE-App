// Utilitários de autenticação e permissões
import { createServerClient } from './supabase/server'
import { Usuario } from '@/types'

/**
 * Verifica se o usuário está autenticado
 */
export async function getCurrentUser(): Promise<Usuario | null> {
  const supabase = createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('Erro ao obter usuário autenticado:', authError)
    return null
  }

  // Busca dados do usuário na tabela usuarios
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Erro ao buscar usuário na tabela usuarios:', error)
    console.error('User ID:', user.id)
    return null
  }

  if (!data) {
    console.error('Usuário não encontrado na tabela usuarios. ID:', user.id)
    return null
  }

  return data
}

/**
 * Verifica se o usuário é administrador/líder
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.lider === true
}

/**
 * Verifica se o usuário tem permissão para acessar uma rota
 */
export async function requireAuth(): Promise<Usuario> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Usuário não autenticado')
  }
  return user
}

/**
 * Verifica se o usuário é administrador, caso contrário lança erro
 */
export async function requireAdmin(): Promise<Usuario> {
  const user = await requireAuth()
  if (!user.lider) {
    throw new Error('Acesso negado: apenas administradores')
  }
  return user
}


