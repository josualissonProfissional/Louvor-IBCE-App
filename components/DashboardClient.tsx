'use client'

// Componente client-side do Dashboard com interatividade
import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import { formatDate, getDayName } from '@/lib/utils'
import { DiaAtuacao } from '@/types'
import MusicaModal from '@/components/MusicaModal'

interface Escala {
  id: string
  data: string
  musica: {
    id: string
    titulo: string
    link_youtube: string | null
    letras?: { id: string }[]
    cifras?: { id: string }[]
  } | null
  usuario: { nome?: string; email: string; instrumento?: { nome: string } }
  funcao: string
}

interface Aniversariante {
  id: string
  nome?: string | null
  email: string
  data_nascimento: string
  instrumento?: { nome: string } | null
}

interface DashboardClientProps {
  escalasIniciais: Escala[]
  diasAtuacao: DiaAtuacao[]
  escalasMes: Escala[]
  aniversariantes: Aniversariante[]
}

export default function DashboardClient({
  escalasIniciais,
  diasAtuacao,
  escalasMes,
  aniversariantes,
}: DashboardClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [escalas, setEscalas] = useState<Escala[]>(escalasIniciais)
  const [loading, setLoading] = useState(false)
  const [musicaModal, setMusicaModal] = useState<{
    id: string
    titulo: string
    link_youtube: string | null
    temLetras: boolean
    temCifras: boolean
  } | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)

  // Encontra a próxima data de atuação que ainda não passou
  const encontrarProximaDataAtuacao = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Ordena as datas de atuação e encontra a primeira que seja >= hoje
    const proximaData = diasAtuacao
      .map((dia) => {
        const [year, month, day] = dia.data.split('-').map(Number)
        return new Date(year, month - 1, day, 12, 0, 0)
      })
      .filter((date) => {
        date.setHours(0, 0, 0, 0)
        return date >= today
      })
      .sort((a, b) => a.getTime() - b.getTime())[0]

    return proximaData || null
  }

  // Inicializa com a próxima data de atuação
  useEffect(() => {
    if (!selectedDate) {
      const proximaData = encontrarProximaDataAtuacao()
      if (proximaData) {
        setSelectedDate(proximaData)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diasAtuacao])

  // Busca escalas quando uma data é selecionada
  useEffect(() => {
    async function loadEscalas() {
      if (!selectedDate) {
        // Se não há data selecionada e não há próxima data, limpa as escalas
        setEscalas([])
        return
      }

      try {
        setLoading(true)
        const dataStr = format(selectedDate, 'yyyy-MM-dd')
        const response = await fetch(`/api/escalas/public?data=${dataStr}`)
        if (response.ok) {
          const data = await response.json()
          setEscalas(data)
        }
      } catch (error) {
        console.error('Erro ao carregar escalas:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEscalas()
  }, [selectedDate])

  // Agrupa escalas por data e organiza por músicas e escala geral
  const agruparEscalasPorData = (escalas: Escala[]) => {
    const agrupadas: { [data: string]: Escala[] } = {}
    
    escalas.forEach((escala) => {
      if (!agrupadas[escala.data]) {
        agrupadas[escala.data] = []
      }
      agrupadas[escala.data].push(escala)
    })

    return Object.entries(agrupadas)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, escalasDia]) => {
        // Organiza escalas por música e escala geral
        const escalasComMusica: { [musica: string]: Escala[] } = {}
        const escalasGerais: { cantores: Escala[]; musicos: Escala[] } = {
          cantores: [],
          musicos: [],
        }

        escalasDia.forEach((escala) => {
          if (escala.musica) {
            const musicaTitulo = escala.musica.titulo
            if (!escalasComMusica[musicaTitulo]) {
              escalasComMusica[musicaTitulo] = []
            }
            escalasComMusica[musicaTitulo].push(escala)
          } else {
            if (escala.funcao === 'cantor') {
              escalasGerais.cantores.push(escala)
            } else if (escala.funcao === 'musico') {
              escalasGerais.musicos.push(escala)
            }
          }
        })

        return {
          data,
          escalasComMusica,
          escalasGerais,
        }
      })
  }

  const escalasAgrupadas = agruparEscalasPorData(escalas)

  // Funções do calendário
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const isDiaAtuacao = (date: Date) => {
    return diasAtuacao.some((dia) => {
      const [year, month, day] = dia.data.split('-').map(Number)
      const diaDate = new Date(year, month - 1, day, 12, 0, 0)
      return isSameDay(diaDate, date)
    })
  }

  const getEscalasDoDia = (date: Date) => {
    return escalasMes.filter((escala) => {
      const [year, month, day] = escala.data.split('-').map(Number)
      const escalaDate = new Date(year, month - 1, day, 12, 0, 0)
      return isSameDay(escalaDate, date)
    })
  }

  const getAniversariantesDoDia = (date: Date) => {
    const dateMonth = date.getMonth() + 1
    const dateDay = date.getDate()
    
    return aniversariantes.filter((aniversariante) => {
      const [year, month, day] = aniversariante.data_nascimento.split('-').map(Number)
      return month === dateMonth && day === dateDay
    })
  }

  // Filtra aniversariantes do mês atual do calendário
  const aniversariantesDoMes = aniversariantes.filter((aniversariante) => {
    const [year, month, day] = aniversariante.data_nascimento.split('-').map(Number)
    return month === currentDate.getMonth() + 1
  }).sort((a, b) => {
    const [yearA, monthA, dayA] = a.data_nascimento.split('-').map(Number)
    const [yearB, monthB, dayB] = b.data_nascimento.split('-').map(Number)
    return dayA - dayB
  })

  const handleDateClick = (date: Date) => {
    if (isDiaAtuacao(date)) {
      setSelectedDate(date)
    }
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    setSelectedDate(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  const clearSelection = () => {
    // Ao limpar, volta para a próxima data de atuação
    const proximaData = encontrarProximaDataAtuacao()
    if (proximaData) {
      setSelectedDate(proximaData)
    } else {
      setSelectedDate(null)
    }
  }

  // Função para formatar dados para compartilhamento
  const formatarDadosCompartilhamento = () => {
    let texto = '🎵 *ESCALAS DO MINISTÉRIO DE LOUVOR*\n\n'
    
    escalasAgrupadas.forEach(({ data, escalasComMusica, escalasGerais }) => {
      texto += `📅 *${formatDate(data)}* - ${getDayName(data)}\n\n`
      
      // Músicas
      if (Object.entries(escalasComMusica).length > 0) {
        texto += '🎶 *Músicas:*\n'
        Object.entries(escalasComMusica).forEach(([musicaTitulo, escalasMusica]) => {
          const primeiraEscala = escalasMusica[0]
          const musica = primeiraEscala.musica
          
          texto += `\n• ${musicaTitulo}`
          
          // Links do YouTube
          if (musica?.link_youtube) {
            texto += `\n  🔗 ${musica.link_youtube}`
          }
          
          // Solos
          escalasMusica.forEach((escala) => {
            texto += `\n  👤 Solo: ${escala.usuario?.nome || escala.usuario?.email}`
          })
        })
        texto += '\n\n'
      }
      
      // Escala Geral
      if (escalasGerais.cantores.length > 0 || escalasGerais.musicos.length > 0) {
        texto += '👥 *Escala Geral:*\n'
        
        if (escalasGerais.cantores.length > 0) {
          texto += '\n🎤 *Cantores:*\n'
          escalasGerais.cantores.forEach((escala) => {
            texto += `• ${escala.usuario?.nome || escala.usuario?.email}\n`
          })
        }
        
        if (escalasGerais.musicos.length > 0) {
          texto += '\n🎸 *Músicos:*\n'
          escalasGerais.musicos.forEach((escala) => {
            const instrumento = escala.usuario?.instrumento?.nome
            texto += `• ${escala.usuario?.nome || escala.usuario?.email}${instrumento ? ` (${instrumento})` : ''}\n`
          })
        }
        texto += '\n'
      }
      
      texto += '─'.repeat(30) + '\n\n'
    })
    
    texto += '\n📱 _Compartilhado do Ministério de Louvor IBCE_'
    
    return texto
  }

  // Função para compartilhar
  const handleShare = async () => {
    // Sempre mostrar modal com opções
    setShowShareModal(true)
  }

  // Função para copiar texto para área de transferência
  const copiarTexto = async () => {
    const texto = formatarDadosCompartilhamento()
    try {
      await navigator.clipboard.writeText(texto)
      alert('✅ Texto copiado para a área de transferência!')
      setShowShareModal(false)
    } catch (error) {
      console.error('Erro ao copiar:', error)
      alert('❌ Erro ao copiar texto. Tente novamente.')
    }
  }

  // Função para copiar link da página
  const copiarLink = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      alert('✅ Link copiado para a área de transferência!')
      setShowShareModal(false)
    } catch (error) {
      console.error('Erro ao copiar:', error)
      alert('❌ Erro ao copiar link. Tente novamente.')
    }
  }

  // Função para compartilhar no WhatsApp
  const compartilharWhatsApp = () => {
    const texto = formatarDadosCompartilhamento()
    const url = encodeURIComponent(window.location.href)
    const textoEncoded = encodeURIComponent(texto)
    window.open(`https://wa.me/?text=${textoEncoded}%0A%0A${url}`, '_blank')
    setShowShareModal(false)
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 max-w-7xl">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          {escalasAgrupadas.length > 0 && (
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
              title="Compartilhar escalas"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:inline">Compartilhar</span>
            </button>
          )}
        </div>
        {selectedDate && (
          <button
            onClick={clearSelection}
            className="mt-2 text-sm text-primary hover:underline"
          >
            ← Voltar para próxima escala
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Aniversariantes do Mês */}
        {aniversariantesDoMes.length > 0 && (
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg shadow-lg p-4 sm:p-6 border-l-4 border-pink-500 animate-fade-in lg:col-span-2 order-1">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-pink-500 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Aniversariantes de {format(currentDate, 'MMMM', { locale: ptBR })}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {aniversariantesDoMes.map((aniversariante, index) => {
                const [year, month, day] = aniversariante.data_nascimento.split('-').map(Number)
                const hoje = new Date()
                const aniversarioEsteAno = new Date(hoje.getFullYear(), month - 1, day)
                const idade = hoje.getFullYear() - year
                
                return (
                  <div
                    key={aniversariante.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 animate-slide-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-full bg-pink-500 dark:bg-pink-600 flex items-center justify-center text-white font-bold text-sm">
                        {day}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {aniversariante.nome || aniversariante.email}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(hoje.getFullYear(), month - 1, day), "dd 'de' MMMM", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                    {aniversariante.instrumento && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {aniversariante.instrumento.nome}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Escala e Músicas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 order-2 lg:order-3">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {selectedDate
              ? `Escala - ${formatDate(format(selectedDate, 'yyyy-MM-dd'))}`
              : 'Próxima Escala'}
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
            </div>
          ) : escalasAgrupadas.length > 0 ? (
            <div className="space-y-6">
              {escalasAgrupadas.map(({ data, escalasComMusica, escalasGerais }) => (
                <div
                  key={data}
                  className="border-l-4 border-primary pl-4 pb-4 last:pb-0"
                >
                  <div className="mb-3">
                    <div className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">
                      {formatDate(data)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {getDayName(data)}
                    </div>
                  </div>

                  {/* Músicas com Solo */}
                  {Object.entries(escalasComMusica).length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Músicas
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(escalasComMusica).map(([musicaTitulo, escalasMusica]) => {
                          // Pega a primeira escala para obter os dados da música
                          const primeiraEscala = escalasMusica[0]
                          const musica = primeiraEscala.musica
                          
                          if (!musica) return null

                          const temLetras = musica.letras && musica.letras.length > 0
                          const temCifras = musica.cifras && musica.cifras.length > 0

                          return (
                            <button
                              key={musicaTitulo}
                              onClick={() => setMusicaModal({
                                id: musica.id,
                                titulo: musica.titulo,
                                link_youtube: musica.link_youtube,
                                temLetras: temLetras || false,
                                temCifras: temCifras || false,
                              })}
                              className="bg-gray-50 dark:bg-gray-700 rounded p-3 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-600 hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer border border-transparent hover:border-primary/30"
                            >
                              <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white mb-2">
                                {musicaTitulo}
                              </div>
                              {escalasMusica.map((escala) => (
                                <div
                                  key={escala.id}
                                  className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 ml-2"
                                >
                                  <span className="font-medium">Solo:</span>{' '}
                                  {escala.usuario?.nome || escala.usuario?.email}
                                </div>
                              ))}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Escala Geral */}
                  {(escalasGerais.cantores.length > 0 || escalasGerais.musicos.length > 0) && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Escala Geral
                      </h3>
                      {escalasGerais.cantores.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Cantores:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {escalasGerais.cantores.map((escala) => (
                              <span
                                key={escala.id}
                                className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded"
                              >
                                {escala.usuario?.nome || escala.usuario?.email}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {escalasGerais.musicos.length > 0 && (
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Músicos:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {escalasGerais.musicos.map((escala) => (
                              <span
                                key={escala.id}
                                className="inline-block bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded"
                              >
                                {escala.usuario?.nome || escala.usuario?.email}
                                {escala.usuario?.instrumento && (
                                  <span className="ml-1 opacity-75">
                                    ({escala.usuario.instrumento.nome})
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {selectedDate
                  ? 'Nenhuma escala cadastrada para esta data.'
                  : 'Nenhuma escala cadastrada para esta semana.'}
              </p>
            </div>
          )}
        </div>

        {/* Calendário Mensal */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 order-3 lg:order-4 transition-all duration-300 hover:shadow-xl animate-fade-in">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Calendário do Mês
          </h2>
          <div className="calendar">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <button
                onClick={previousMonth}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-primary text-white rounded-lg hover:bg-primary-light active:scale-95 md:hover:scale-110 transition-all duration-200 font-semibold text-sm md:text-base"
                aria-label="Mês anterior"
              >
                ←
              </button>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white capitalize px-2 text-center">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </h3>
              <button
                onClick={nextMonth}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-primary text-white rounded-lg hover:bg-primary-light active:scale-95 md:hover:scale-110 transition-all duration-200 font-semibold text-sm md:text-base"
                aria-label="Próximo mês"
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

              {/* Células vazias para alinhar o primeiro dia do mês */}
              {Array.from({ length: monthStart.getDay() }).map((_, index) => (
                <div key={`empty-${index}`} className="min-h-[60px] md:min-h-[80px] lg:min-h-[90px] p-1 md:p-2" />
              ))}

              {days.map((day, index) => {
                const isAtuacao = isDiaAtuacao(day)
                const escalasDia = getEscalasDoDia(day)
                const aniversariantesDia = getAniversariantesDoDia(day)
                const isToday = isSameDay(day, new Date())
                const isSelected = selectedDate && isSameDay(day, selectedDate)

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
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
                    title={isAtuacao ? `Clique para ver escalas de ${format(day, 'dd/MM/yyyy')}` : 'Sem atuação'}
                  >
                    <div className={`text-xs md:text-sm font-semibold ${isToday ? 'text-yellow-900 dark:text-yellow-100 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                      {format(day, 'd')}
                      {isToday && (
                        <span className="ml-0.5 md:ml-1 text-[10px] md:text-xs bg-yellow-400 dark:bg-yellow-600 px-1 md:px-1.5 py-0.5 rounded">Hoje</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 mt-1 md:mt-2">
                      {escalasDia.length > 0 && (
                        <div className={`text-[10px] md:text-xs font-medium ${isToday ? 'text-yellow-800 dark:text-yellow-200' : 'text-gray-600 dark:text-gray-400'}`}>
                          <span className="inline-flex items-center gap-0.5 md:gap-1 bg-green-500 dark:bg-green-600 text-white px-1 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs">
                            {escalasDia.length}
                            <span className="hidden sm:inline"> escala{escalasDia.length > 1 ? 's' : ''}</span>
                          </span>
                        </div>
                      )}
                      {aniversariantesDia.length > 0 && (
                        <div className={`text-[10px] md:text-xs font-medium ${isToday ? 'text-yellow-800 dark:text-yellow-200' : 'text-gray-600 dark:text-gray-400'}`}>
                          <span className="inline-flex items-center gap-0.5 md:gap-1 bg-pink-500 dark:bg-pink-600 text-white px-1 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs">
                            🎂 {aniversariantesDia.length}
                            <span className="hidden sm:inline"> aniversariante{aniversariantesDia.length > 1 ? 's' : ''}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal da Música */}
      {musicaModal && (
        <MusicaModal
          musica={musicaModal}
          isOpen={!!musicaModal}
          onClose={() => setMusicaModal(null)}
        />
      )}

      {/* Modal de Compartilhamento */}
      {showShareModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 animate-slide-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Compartilhar Escalas
              </h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Escolha como deseja compartilhar as escalas, músicas e links do YouTube:
            </p>

            <div className="space-y-3">
              <button
                onClick={copiarTexto}
                className="w-full bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar Texto Completo
              </button>

              <button
                onClick={copiarLink}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Copiar Link da Página
              </button>

              <button
                onClick={compartilharWhatsApp}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Compartilhar no WhatsApp
              </button>

              <button
                onClick={() => {
                  const texto = formatarDadosCompartilhamento()
                  const url = window.location.href
                  window.open(`mailto:?subject=Escalas do Ministério de Louvor&body=${encodeURIComponent(texto + '\n\n' + url)}`, '_blank')
                  setShowShareModal(false)
                }}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Compartilhar por E-mail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

