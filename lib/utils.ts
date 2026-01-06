// Utilitários gerais
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina classes CSS com Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gera senha aleatória
 */
export function generateRandomPassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

/**
 * Formata data para exibição
 */
export function formatDate(date: string | Date): string {
  let d: Date
  
  if (typeof date === 'string') {
    // Se for string no formato YYYY-MM-DD, faz parse manual para evitar problemas de timezone
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number)
      d = new Date(year, month - 1, day) // month - 1 porque Date usa 0-11
    } else {
      d = new Date(date)
    }
  } else {
    d = date
  }
  
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Extrai ID do YouTube de uma URL
 */
export function extractYouTubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

/**
 * Obtém o nome do dia da semana para uma data no formato YYYY-MM-DD
 */
export function getDayName(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  // Cria data no meio-dia local para evitar problemas de timezone
  const date = new Date(year, month - 1, day, 12, 0, 0)
  const dayNames = [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado',
  ]
  return dayNames[date.getDay()]
}




