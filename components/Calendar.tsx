'use client'

// Componente de calendário mensal
import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import { DiaAtuacao } from '@/types'

interface CalendarProps {
  diasAtuacao: DiaAtuacao[]
  escalas?: any[] // Aceita escalas com qualquer estrutura
}

export default function Calendar({ diasAtuacao, escalas = [] }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

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

  const getEscalasDoDia = (date: Date) => {
    return escalas.filter((escala) => {
      // Parse seguro da data para evitar problemas de timezone
      const [year, month, day] = escala.data.split('-').map(Number)
      const escalaDate = new Date(year, month - 1, day, 12, 0, 0)
      return isSameDay(escalaDate, date)
    })
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  return (
    <div className="calendar">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="px-3 py-1 bg-primary text-white rounded hover:bg-primary-light"
        >
          ←
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <button
          onClick={nextMonth}
          className="px-3 py-1 bg-primary text-white rounded hover:bg-primary-light"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}

        {/* Células vazias para alinhar o primeiro dia do mês com o dia da semana correto */}
        {Array.from({ length: monthStart.getDay() }).map((_, index) => (
          <div key={`empty-${index}`} className="min-h-[60px] p-1" />
        ))}

        {days.map(day => {
          const isAtuacao = isDiaAtuacao(day)
          const escalasDia = getEscalasDoDia(day)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toISOString()}
              className={`
                min-h-[60px] p-1 border rounded
                ${isToday 
                  ? 'bg-yellow-200 dark:bg-yellow-800 border-yellow-400 dark:border-yellow-600 ring-2 ring-yellow-400 dark:ring-yellow-600' 
                  : isAtuacao 
                    ? 'bg-green-100 dark:bg-green-900 border-green-500' 
                    : ''}
              `}
            >
              <div className={`text-xs font-semibold ${isToday ? 'text-yellow-900 dark:text-yellow-100 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                {format(day, 'd')}
                {isToday && (
                  <span className="ml-1 text-[10px]">Hoje</span>
                )}
              </div>
              {escalasDia.length > 0 && (
                <div className={`text-xs mt-1 ${isToday ? 'text-yellow-800 dark:text-yellow-200' : 'text-gray-600 dark:text-gray-400'}`}>
                  {escalasDia.length} escala(s)
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

