'use client'

// Página de gerenciamento de dias de atuação
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DiaAtuacao } from '@/types'
import { formatDate } from '@/lib/utils'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

export default function DiasAtuacaoPage() {
  const [diasAtuacao, setDiasAtuacao] = useState<DiaAtuacao[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  
  // Estados para busca e filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMonth, setFilterMonth] = useState<string>('todos')
  const [sortOrder, setSortOrder] = useState<'data-recente' | 'data-antiga'>('data-recente')

  useEffect(() => {
    loadDiasAtuacao()
  }, [])

  const loadDiasAtuacao = async () => {
    try {
      const response = await fetch('/api/dias-atuacao')
      if (response.ok) {
        const data = await response.json()
        setDiasAtuacao(data)
      }
    } catch (error) {
      console.error('Erro ao carregar dias de atuação:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDate = async (date: Date) => {
    setLoading(true)
    try {
      // Extrai os componentes da data usando métodos locais
      const year = date.getFullYear()
      const month = date.getMonth() + 1 // getMonth() retorna 0-11, então +1 para 1-12
      const day = date.getDate()
      
      // Formata diretamente
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      
      const response = await fetch('/api/dias-atuacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dateStr }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      setShowCalendar(false)
      setSelectedDate(null)
      loadDiasAtuacao()
    } catch (error: any) {
      alert('Erro ao adicionar dia: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este dia de atuação?')) return

    try {
      const response = await fetch(`/api/dias-atuacao/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      loadDiasAtuacao()
    } catch (error: any) {
      alert('Erro ao remover dia: ' + error.message)
    }
  }

  const isDateMarked = (date: Date) => {
    // Formata a data para comparação no timezone local
    const formatDateForComparison = (d: Date) => {
      // Cria uma data normalizada no meio-dia local
      const normalized = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0)
      const year = normalized.getFullYear()
      const month = normalized.getMonth()
      const day = normalized.getDate()
      return `${year}-${month}-${day}`
    }
    
    return diasAtuacao.some((dia) => {
      // Parse da data do banco (formato YYYY-MM-DD)
      const [year, month, day] = dia.data.split('-').map(Number)
      const diaDate = new Date(year, month - 1, day, 12, 0, 0)
      return formatDateForComparison(diaDate) === formatDateForComparison(date)
    })
  }

  // Função para obter meses/anos únicos dos dias de atuação
  const getAvailableMonths = () => {
    const months = new Set<string>()
    diasAtuacao.forEach((dia) => {
      const [year, month] = dia.data.split('-').map(Number)
      const monthKey = `${year}-${String(month).padStart(2, '0')}`
      months.add(monthKey)
    })
    return Array.from(months).sort().reverse()
  }

  // Função para formatar mês/ano para exibição
  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number)
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return `${monthNames[month - 1]} ${year}`
  }

  // Função para filtrar e ordenar dias de atuação
  const filteredAndSortedDias = diasAtuacao
    .filter((dia) => {
      // Filtro de busca
      const searchLower = searchTerm.toLowerCase()
      const [year, month, day] = dia.data.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
      const dayName = dayNames[date.getDay()]
      const dateStr = formatDate(dia.data).toLowerCase()
      
      const matchesSearch = searchTerm === '' || 
        dateStr.includes(searchLower) ||
        dayName.includes(searchLower)
      
      // Filtro de mês
      const monthKey = `${year}-${String(month).padStart(2, '0')}`
      const matchesMonth = filterMonth === 'todos' || monthKey === filterMonth
      
      return matchesSearch && matchesMonth
    })
    .sort((a, b) => {
      const dateA = new Date(a.data).getTime()
      const dateB = new Date(b.data).getTime()
      return sortOrder === 'data-recente' 
        ? dateB - dateA 
        : dateA - dateB
    })

  if (loading && diasAtuacao.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
      </div>
    )
  }

  const availableMonths = getAvailableMonths()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link
            href="/admin"
            className="text-primary hover:underline mb-2 inline-block transition-all duration-200 hover:translate-x-1"
          >
            ← Voltar
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dias de Atuação
          </h1>
        </div>
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-light transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-semibold"
        >
          {showCalendar ? '✕ Cancelar' : '+ Adicionar Dia'}
        </button>
      </div>

      {showCalendar && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 animate-fade-in">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Selecione uma data
          </h2>
          <div className="flex justify-center">
            <Calendar
              onChange={(value) => {
                if (value instanceof Date) {
                  setSelectedDate(value)
                }
              }}
              value={selectedDate}
              tileClassName={({ date }) => {
                if (isDateMarked(date)) {
                  return 'bg-green-500 text-white rounded'
                }
                return ''
              }}
              className="w-full max-w-md"
            />
          </div>
          {selectedDate && (
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => handleAddDate(selectedDate)}
                disabled={loading || isDateMarked(selectedDate)}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-light disabled:opacity-50 transition-all duration-200"
              >
                {isDateMarked(selectedDate)
                  ? 'Data já cadastrada'
                  : 'Adicionar Data'}
              </button>
              <button
                onClick={() => {
                  setSelectedDate(null)
                  setShowCalendar(false)
                }}
                className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Barra de Pesquisa e Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 animate-fade-in">
        <div className="space-y-4">
          {/* Barra de Pesquisa */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por data ou dia da semana..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro por Mês */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtrar por Mês
              </label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              >
                <option value="todos">Todos os meses</option>
                {availableMonths.map((monthKey) => (
                  <option key={monthKey} value={monthKey}>
                    {formatMonthLabel(monthKey)}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Ordenação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ordenar por
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              >
                <option value="data-recente">Data (Mais Recente)</option>
                <option value="data-antiga">Data (Mais Antiga)</option>
              </select>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
            Mostrando {filteredAndSortedDias.length} de {diasAtuacao.length} dia(s) de atuação
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden animate-fade-in">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Dia da Semana
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedDias.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                      Nenhum dia de atuação encontrado
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                      {diasAtuacao.length === 0 
                        ? 'Adicione dias de atuação usando o botão acima'
                        : 'Tente ajustar os filtros de busca'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedDias.map((dia, index) => {
                // Parse manual da data para evitar problemas de timezone
                const [year, month, day] = dia.data.split('-').map(Number)
                const date = new Date(year, month - 1, day) // month - 1 porque Date usa 0-11
                const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
                return (
                  <tr 
                    key={dia.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 animate-slide-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(dia.data)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {dayNames[date.getDay()]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(dia.id)}
                        className="text-red-600 hover:text-red-800 transition-all duration-200 hover:underline font-medium"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

