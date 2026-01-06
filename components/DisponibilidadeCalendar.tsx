'use client'

// Calendário de disponibilidade
import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import { DiaAtuacao, Disponibilidade } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface DisponibilidadeCalendarProps {
  diasAtuacao: DiaAtuacao[]
  disponibilidade: Disponibilidade[]
  userId: string
}

export default function DisponibilidadeCalendar({
  diasAtuacao,
  disponibilidade: initialDisponibilidade,
  userId,
}: DisponibilidadeCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [disponibilidade, setDisponibilidade] = useState(initialDisponibilidade)
  const [loading, setLoading] = useState(false)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const isDiaAtuacao = (date: Date) => {
    return diasAtuacao.some((dia) => {
      // Parse seguro da data para evitar problemas de timezone
      const [year, month, day] = dia.data.split('-').map(Number)
      const diaDate = new Date(year, month - 1, day, 12, 0, 0)
      return isSameDay(diaDate, date)
    })
  }

  const getDisponibilidadeDoDia = (date: Date) => {
    return disponibilidade.find((disp) => {
      // Parse seguro da data para evitar problemas de timezone
      const [year, month, day] = disp.data.split('-').map(Number)
      const dispDate = new Date(year, month - 1, day, 12, 0, 0)
      return isSameDay(dispDate, date)
    })
  }

  const toggleDisponibilidade = async (date: Date) => {
    if (!isDiaAtuacao(date)) return

    setLoading(true)
    const supabase = createClient()
    const dateStr = format(date, 'yyyy-MM-dd')

    const existing = getDisponibilidadeDoDia(date)

    try {
      if (existing) {
        // Alterna entre disponível e indisponível
        const newStatus = existing.status === 'disponivel' ? 'indisponivel' : 'disponivel'
        const { error } = await supabase
          .from('disponibilidade')
          .update({ status: newStatus })
          .eq('id', existing.id)

        if (!error) {
          setDisponibilidade(prev =>
            prev.map(disp =>
              disp.id === existing.id ? { ...disp, status: newStatus } : disp
            )
          )
        }
      } else {
        // Cria nova disponibilidade como disponível
        const { data, error } = await supabase
          .from('disponibilidade')
          .insert({
            usuario_id: userId,
            data: dateStr,
            status: 'disponivel',
          })
          .select()
          .single()

        if (!error && data) {
          setDisponibilidade(prev => [...prev, data])
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error)
    } finally {
      setLoading(false)
    }
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <button
          onClick={previousMonth}
          className="px-2 sm:px-3 py-1 sm:py-2 bg-primary text-white rounded hover:bg-primary-light transition-colors text-sm sm:text-base"
          aria-label="Mês anterior"
        >
          ←
        </button>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <button
          onClick={nextMonth}
          className="px-2 sm:px-3 py-1 sm:py-2 bg-primary text-white rounded hover:bg-primary-light transition-colors text-sm sm:text-base"
          aria-label="Próximo mês"
        >
          →
        </button>
      </div>

      <div className="mb-3 sm:mb-4 flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 dark:bg-green-900 border border-green-500 rounded"></div>
          <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap">Dia de atuação</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded"></div>
          <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap">Disponível</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded"></div>
          <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap">Indisponível</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div
            key={day}
            className="text-center text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 py-1 sm:py-2"
          >
            {day}
          </div>
        ))}

        {/* Células vazias para alinhar o primeiro dia do mês com o dia da semana correto */}
        {Array.from({ length: monthStart.getDay() }).map((_, index) => (
          <div key={`empty-${index}`} className="min-h-[50px] sm:min-h-[60px] p-1 sm:p-2" />
        ))}

        {days.map(day => {
          const isAtuacao = isDiaAtuacao(day)
          const disp = getDisponibilidadeDoDia(day)
          const isToday = isSameDay(day, new Date())

          // Determina a cor de fundo baseada no status de disponibilidade
          // Se for hoje, sempre usa amarelo como destaque principal
          let bgColor = ''
          let textColor = ''
          let borderColor = ''
          
          if (isToday) {
            bgColor = 'bg-yellow-200 dark:bg-yellow-800'
            textColor = 'text-yellow-900 dark:text-yellow-100'
            borderColor = 'border-yellow-400 dark:border-yellow-600'
          } else if (isAtuacao) {
            if (disp?.status === 'disponivel') {
              bgColor = 'bg-blue-500 dark:bg-blue-600'
              textColor = 'text-white'
              borderColor = 'border-green-500'
            } else if (disp?.status === 'indisponivel') {
              bgColor = 'bg-red-500 dark:bg-red-600'
              textColor = 'text-white'
              borderColor = 'border-green-500'
            } else {
              bgColor = 'bg-green-100 dark:bg-green-900'
              textColor = 'text-gray-900 dark:text-white'
              borderColor = 'border-green-500'
            }
          } else {
            bgColor = 'bg-gray-100 dark:bg-gray-700'
            textColor = 'text-gray-500 dark:text-gray-400'
            borderColor = ''
          }

          return (
            <button
              key={day.toISOString()}
              onClick={() => toggleDisponibilidade(day)}
              disabled={!isAtuacao || loading}
              className={`
                min-h-[50px] sm:min-h-[60px] p-1 sm:p-2 border rounded text-left transition-colors
                ${bgColor}
                ${textColor}
                ${borderColor}
                ${isAtuacao ? 'cursor-pointer hover:opacity-80' : 'opacity-50 cursor-not-allowed'}
                ${isToday ? 'ring-2 ring-yellow-400 dark:ring-yellow-600' : ''}
              `}
            >
              <div className={`text-xs sm:text-sm font-semibold ${isToday ? 'font-bold' : ''}`}>
                {format(day, 'd')}
                {isToday && (
                  <span className="ml-1 text-[9px] sm:text-[10px]">Hoje</span>
                )}
              </div>
              {disp && !isToday && (
                <div className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-bold ${disp.status === 'disponivel' ? 'text-white' : 'text-white'}`}>
                  {disp.status === 'disponivel' ? '✓' : '✗'}
                  <span className="hidden sm:inline ml-1">
                    {disp.status === 'disponivel' ? 'Disponível' : 'Indisponível'}
                  </span>
                </div>
              )}
              {isToday && disp && (
                <div className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-bold ${textColor}`}>
                  {disp.status === 'disponivel' ? '✓' : '✗'}
                  <span className="hidden sm:inline ml-1">
                    {disp.status === 'disponivel' ? 'Disponível' : 'Indisponível'}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

