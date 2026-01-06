'use client'

// Página de gerenciamento de instrumentos
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Instrumento } from '@/types'

export default function InstrumentosPage() {
  const [instrumentos, setInstrumentos] = useState<Instrumento[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingInstrumento, setEditingInstrumento] = useState<Instrumento | null>(null)
  const [nome, setNome] = useState('')
  
  // Estados para busca e filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<'nome' | 'data-recente' | 'data-antiga'>('nome')

  useEffect(() => {
    loadInstrumentos()
  }, [])

  const loadInstrumentos = async () => {
    try {
      const response = await fetch('/api/instrumentos')
      if (response.ok) {
        const data = await response.json()
        setInstrumentos(data)
      }
    } catch (error) {
      console.error('Erro ao carregar instrumentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingInstrumento
        ? `/api/instrumentos/${editingInstrumento.id}`
        : '/api/instrumentos'
      const method = editingInstrumento ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      setShowModal(false)
      setEditingInstrumento(null)
      setNome('')
      loadInstrumentos()
    } catch (error: any) {
      alert('Erro ao salvar instrumento: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (instrumento: Instrumento) => {
    setEditingInstrumento(instrumento)
    setNome(instrumento.nome)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este instrumento?')) return

    try {
      const response = await fetch(`/api/instrumentos/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      loadInstrumentos()
    } catch (error: any) {
      alert('Erro ao remover instrumento: ' + error.message)
    }
  }

  const openNewModal = () => {
    setEditingInstrumento(null)
    setNome('')
    setShowModal(true)
  }

  // Função para filtrar e ordenar instrumentos
  const filteredAndSortedInstrumentos = instrumentos
    .filter((instrumento) => {
      const nomeLower = instrumento.nome.toLowerCase()
      const searchLower = searchTerm.toLowerCase()
      return searchTerm === '' || nomeLower.includes(searchLower)
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case 'nome':
          return a.nome.localeCompare(b.nome)
        case 'data-recente':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'data-antiga':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default:
          return 0
      }
    })

  if (loading && instrumentos.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
      </div>
    )
  }

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
            Gerenciar Instrumentos
          </h1>
        </div>
        <button
          onClick={openNewModal}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-light transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-semibold"
        >
          + Novo Instrumento
        </button>
      </div>

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
              placeholder="Buscar por nome do instrumento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value="nome">Nome (A-Z)</option>
                <option value="data-recente">Data (Mais Recente)</option>
                <option value="data-antiga">Data (Mais Antiga)</option>
              </select>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
            Mostrando {filteredAndSortedInstrumentos.length} de {instrumentos.length} instrumento(s)
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden animate-fade-in">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Criado em
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedInstrumentos.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                      Nenhum instrumento encontrado
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                      Tente ajustar os filtros de busca
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedInstrumentos.map((instrumento, index) => (
              <tr 
                key={instrumento.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {instrumento.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  {new Date(instrumento.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(instrumento)}
                    className="text-primary hover:text-primary-light mr-4 transition-all duration-200 hover:underline font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(instrumento.id)}
                    className="text-red-600 hover:text-red-800 transition-all duration-200 hover:underline font-medium"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingInstrumento ? 'Editar Instrumento' : 'Novo Instrumento'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Instrumento
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: Violão, Teclado, Bateria..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-white py-2 px-4 rounded hover:bg-primary-light disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingInstrumento(null)
                    setNome('')
                  }}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white py-2 px-4 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}



