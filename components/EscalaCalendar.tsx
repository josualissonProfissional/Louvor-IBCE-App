'use client'

// Calendário de escalas com edição e remoção
import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import { DiaAtuacao } from '@/types'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Escala {
  id: string
  data: string
  musica: { titulo: string } | null
  usuario: { nome?: string; email: string; instrumento?: { nome: string } }
  funcao: string
}

interface EscalaCalendarProps {
  diasAtuacao: DiaAtuacao[]
  escalas: Escala[]
  isAdmin: boolean
}

export default function EscalaCalendar({ diasAtuacao, escalas: initialEscalas, isAdmin }: EscalaCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [diasAtuacaoCompletos, setDiasAtuacaoCompletos] = useState<DiaAtuacao[]>(diasAtuacao)
  const [escalas, setEscalas] = useState<Escala[]>(initialEscalas)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Carrega dias de atuação quando o mês do calendário muda
  useEffect(() => {
    async function loadDiasAtuacao() {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      
      try {
        const response = await fetch(
          `/api/dias-atuacao?data_inicio=${format(monthStart, 'yyyy-MM-dd')}&data_fim=${format(monthEnd, 'yyyy-MM-dd')}`
        )
        if (response.ok) {
          const novosDias = await response.json()
          // Verifica se a resposta é um array válido
          if (Array.isArray(novosDias)) {
            // Combina com os dias já existentes, evitando duplicatas por ID
            setDiasAtuacaoCompletos((prev) => {
              const diasMap = new Map<string, DiaAtuacao>()
              // Adiciona dias anteriores
              prev.forEach((dia) => {
                diasMap.set(dia.id, dia)
              })
              // Adiciona novos dias (sobrescreve se já existir)
              novosDias.forEach((novoDia: DiaAtuacao) => {
                if (novoDia && novoDia.id) {
                  diasMap.set(novoDia.id, novoDia)
                }
              })
              return Array.from(diasMap.values())
            })
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dias de atuação:', error)
      }
    }

    loadDiasAtuacao()
  }, [currentDate])

  // Carrega escalas quando o mês do calendário muda
  useEffect(() => {
    async function loadEscalas() {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      
      try {
        const response = await fetch(
          `/api/escalas/public?data_inicio=${format(monthStart, 'yyyy-MM-dd')}&data_fim=${format(monthEnd, 'yyyy-MM-dd')}`
        )
        if (response.ok) {
          const novasEscalas = await response.json()
          // Verifica se a resposta é um array válido
          if (Array.isArray(novasEscalas)) {
            setEscalas(novasEscalas)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar escalas:', error)
      }
    }

    loadEscalas()
  }, [currentDate])

  const isDiaAtuacao = (date: Date) => {
    return diasAtuacaoCompletos.some((dia) => {
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

  const agruparEscalas = (escalasDia: Escala[]) => {
    const escalasComMusica: { [key: string]: Escala[] } = {}
    const escalasGerais: { cantores: Escala[]; musicos: Escala[] } = {
      cantores: [],
      musicos: [],
    }

    escalasDia.forEach((escala) => {
      if (escala.musica) {
        // Escala com música
        const musicaTitulo = escala.musica.titulo
        if (!escalasComMusica[musicaTitulo]) {
          escalasComMusica[musicaTitulo] = []
        }
        escalasComMusica[musicaTitulo].push(escala)
      } else {
        // Escala geral (sem música)
        if (escala.funcao === 'cantor') {
          escalasGerais.cantores.push(escala)
        } else if (escala.funcao === 'musico') {
          escalasGerais.musicos.push(escala)
        }
      }
    })

    return { escalasComMusica, escalasGerais }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta escala?')) return

    try {
      const response = await fetch(`/api/escalas/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      // Recarrega a página para atualizar as escalas
      window.location.reload()
    } catch (error: any) {
      alert('Erro ao remover escala: ' + error.message)
    }
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const selectedEscalas = selectedDate ? getEscalasDoDia(selectedDate) : []
  const { escalasComMusica, escalasGerais } = agruparEscalas(selectedEscalas)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 md:p-6 transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <button
              onClick={previousMonth}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-primary text-white rounded-lg hover:bg-primary-light active:scale-95 md:hover:scale-110 transition-all duration-200 font-semibold text-sm md:text-base"
            >
              ←
            </button>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white capitalize px-2 text-center">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <button
              onClick={nextMonth}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-primary text-white rounded-lg hover:bg-primary-light active:scale-95 md:hover:scale-110 transition-all duration-200 font-semibold text-sm md:text-base"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div
                key={day}
                className="text-center text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 py-1 md:py-2"
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.charAt(0)}</span>
              </div>
            ))}

            {/* Células vazias para alinhar o primeiro dia do mês com o dia da semana correto */}
            {Array.from({ length: monthStart.getDay() }).map((_, index) => (
              <div key={`empty-${index}`} className="min-h-[60px] md:min-h-[80px] lg:min-h-[90px] p-1 md:p-2" />
            ))}

            {days.map((day, index) => {
              const isAtuacao = isDiaAtuacao(day)
              const escalasDia = getEscalasDoDia(day)
              const isToday = isSameDay(day, new Date())
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => isAtuacao && setSelectedDate(day)}
                  disabled={!isAtuacao}
                  className={`
                    min-h-[60px] md:min-h-[80px] lg:min-h-[90px] p-1 md:p-2 border-2 rounded-lg text-left transition-all duration-300
                    animate-slide-in-up
                    ${isToday 
                      ? 'bg-yellow-200 dark:bg-yellow-800 border-yellow-400 dark:border-yellow-600 ring-2 ring-yellow-400 dark:ring-yellow-600 shadow-md' 
                      : isAtuacao 
                        ? 'bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-600 cursor-pointer hover:bg-green-200 dark:hover:bg-green-800 active:scale-95 md:hover:shadow-lg md:hover:scale-105 md:hover:-translate-y-1 transition-all duration-300' 
                        : 'bg-gray-100 dark:bg-gray-700 opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-600'}
                    ${isSelected && !isToday ? 'ring-2 md:ring-4 ring-blue-500 dark:ring-blue-400 shadow-lg md:shadow-xl md:scale-105' : ''}
                    ${isSelected && isToday ? 'ring-2 md:ring-4 ring-blue-500 dark:ring-blue-400 shadow-lg md:shadow-xl md:scale-105' : ''}
                  `}
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <div className={`text-xs md:text-sm font-semibold ${isToday ? 'text-yellow-900 dark:text-yellow-100 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                    {format(day, 'd')}
                    {isToday && (
                      <span className="ml-0.5 md:ml-1 text-[10px] md:text-xs bg-yellow-400 dark:bg-yellow-600 px-1 md:px-1.5 py-0.5 rounded">Hoje</span>
                    )}
                  </div>
                  {escalasDia.length > 0 && (
                    <div className={`text-[10px] md:text-xs mt-1 md:mt-2 font-medium ${isToday ? 'text-yellow-800 dark:text-yellow-200' : 'text-gray-600 dark:text-gray-400'}`}>
                      <span className="inline-flex items-center gap-0.5 md:gap-1 bg-green-500 dark:bg-green-600 text-white px-1 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs">
                        {escalasDia.length}
                        <span className="hidden sm:inline"> escala{escalasDia.length > 1 ? 's' : ''}</span>
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Detalhes do dia selecionado */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 transition-all duration-300 hover:shadow-xl animate-fade-in mt-4 lg:mt-0" style={{ animationDelay: '200ms' }}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white capitalize">
            {selectedDate
              ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
              : 'Selecione um dia'}
          </h3>
          {isAdmin && selectedDate && (
            <Link
              href={`/escalas/nova?data=${selectedDate.toISOString().split('T')[0]}`}
              className="text-xs md:text-sm text-primary hover:text-primary-light hover:underline font-medium transition-all duration-200 inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Adicionar</span>
              <span className="sm:hidden">+</span>
            </Link>
          )}
        </div>
        {selectedEscalas.length > 0 ? (
          <div className="space-y-3 md:space-y-4 max-h-[70vh] md:max-h-none overflow-y-auto">
            {/* Escalas com Músicas */}
            {Object.entries(escalasComMusica).map(([musica, escalasMusica], index) => (
              <div 
                key={musica} 
                className="border-l-4 border-primary pl-3 md:pl-4 py-2 md:py-3 rounded-r-lg bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-300 animate-slide-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base break-words">
                  {musica}
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  {escalasMusica.map((escala, escalaIndex) => (
                    <div
                      key={escala.id}
                      className="flex justify-between items-start text-xs md:text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-1.5 md:p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group"
                      style={{ animationDelay: `${(index * 50) + (escalaIndex * 30)}ms` }}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="font-medium text-primary dark:text-primary-light">
                          {escala.funcao === 'solo' ? 'Solo' : escala.funcao.charAt(0).toUpperCase() + escala.funcao.slice(1)}:
                        </span>{' '}
                        <span className="text-gray-900 dark:text-white break-words">
                          {escala.usuario.nome || escala.usuario.email}
                        </span>
                        {escala.usuario.instrumento && (
                          <span className="text-gray-500 dark:text-gray-400 text-[10px] md:text-xs ml-1 block sm:inline">
                            ({escala.usuario.instrumento.nome})
                          </span>
                        )}
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(escala.id)}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400 ml-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex-shrink-0"
                          title="Remover escala"
                        >
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Escala Geral */}
            {(escalasGerais.cantores.length > 0 || escalasGerais.musicos.length > 0) && (
              <div className="border-l-4 border-blue-500 pl-3 md:pl-4 py-2 md:py-3 rounded-r-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-300 mt-3 md:mt-4 animate-slide-in-up">
                <div className="font-semibold text-gray-900 dark:text-white mb-2 md:mb-3 text-sm md:text-base">
                  Escala Geral
                </div>
                <div className="space-y-2 md:space-y-3">
                  {/* Cantores */}
                  {escalasGerais.cantores.length > 0 && (
                    <div>
                      <div className="text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 md:mb-2 uppercase tracking-wide">
                        Cantores:
                      </div>
                      <div className="space-y-1 md:space-y-1.5">
                        {escalasGerais.cantores.map((escala, index) => (
                          <div
                            key={escala.id}
                            className="flex justify-between items-start text-xs md:text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-1.5 md:p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <div className="text-gray-900 dark:text-white min-w-0 pr-2 break-words">
                              {escala.usuario.nome || escala.usuario.email}
                              {escala.usuario.instrumento && (
                                <span className="text-gray-500 dark:text-gray-400 text-[10px] md:text-xs ml-1 block sm:inline">
                                  ({escala.usuario.instrumento.nome})
                                </span>
                              )}
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(escala.id)}
                                className="text-red-500 hover:text-red-700 dark:hover:text-red-400 ml-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex-shrink-0"
                                title="Remover escala"
                              >
                                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Músicos */}
                  {escalasGerais.musicos.length > 0 && (
                    <div>
                      <div className="text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 md:mb-2 uppercase tracking-wide">
                        Músicos:
                      </div>
                      <div className="space-y-1 md:space-y-1.5">
                        {escalasGerais.musicos.map((escala, index) => (
                          <div
                            key={escala.id}
                            className="flex justify-between items-start text-xs md:text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-1.5 md:p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group"
                            style={{ animationDelay: `${(escalasGerais.cantores.length * 30) + (index * 30)}ms` }}
                          >
                            <div className="text-gray-900 dark:text-white min-w-0 pr-2 break-words">
                              {escala.usuario.nome || escala.usuario.email}
                              {escala.usuario.instrumento && (
                                <span className="text-gray-500 dark:text-gray-400 text-[10px] md:text-xs ml-1 block sm:inline">
                                  ({escala.usuario.instrumento.nome})
                                </span>
                              )}
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(escala.id)}
                                className="text-red-500 hover:text-red-700 dark:hover:text-red-400 ml-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex-shrink-0"
                                title="Remover escala"
                              >
                                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : selectedDate ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              Nenhuma escala cadastrada para este dia.
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              Clique em um dia de atuação para ver as escalas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
