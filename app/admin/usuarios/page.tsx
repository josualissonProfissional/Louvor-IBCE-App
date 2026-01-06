'use client'

// Página de gerenciamento de usuários
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Usuario, Instrumento } from '@/types'
import { formatDate } from '@/lib/utils'

export default function UsuariosPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [instrumentos, setInstrumentos] = useState<Instrumento[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    data_nascimento: '',
    cargo: 'ambos' as 'cantor' | 'musico' | 'ambos',
    lider: false,
    instrumento_id: '',
  })
  
  // Estados para busca e filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCargo, setFilterCargo] = useState<string>('todos')
  const [filterInstrumento, setFilterInstrumento] = useState<string>('todos')
  const [filterAdmin, setFilterAdmin] = useState<string>('todos')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [usuariosRes, instrumentosRes] = await Promise.all([
        fetch('/api/usuarios'),
        fetch('/api/instrumentos'),
      ])

      if (usuariosRes.ok) {
        const usuariosData = await usuariosRes.json()
        setUsuarios(usuariosData)
      }

      if (instrumentosRes.ok) {
        const instrumentosData = await instrumentosRes.json()
        setInstrumentos(instrumentosData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingUser ? `/api/usuarios/${editingUser.id}` : '/api/usuarios'
      const method = editingUser ? 'PUT' : 'POST'

      const body: any = {
        nome: formData.nome || null,
        email: formData.email,
        data_nascimento: formData.data_nascimento,
        cargo: formData.cargo,
        lider: formData.lider,
        instrumento_id: formData.instrumento_id || null,
      }

      // Só envia senha se foi preenchida
      if (formData.senha && formData.senha.trim() !== '') {
        body.senha = formData.senha
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      setShowModal(false)
      setEditingUser(null)
      resetForm()
      loadData()
    } catch (error: any) {
      alert('Erro ao salvar usuário: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario)
    setFormData({
      nome: (usuario as any).nome || '',
      email: usuario.email,
      senha: '',
      data_nascimento: usuario.data_nascimento,
      cargo: usuario.cargo,
      lider: usuario.lider,
      instrumento_id: usuario.instrumento_id || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return

    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      loadData()
    } catch (error: any) {
      alert('Erro ao remover usuário: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      data_nascimento: '',
      cargo: 'ambos',
      lider: false,
      instrumento_id: '',
    })
  }

  const openNewModal = () => {
    setEditingUser(null)
    resetForm()
    setShowModal(true)
  }

  // Função para filtrar usuários
  const filteredUsuarios = usuarios.filter((usuario) => {
    const nome = ((usuario as any).nome || '').toLowerCase()
    const email = usuario.email.toLowerCase()
    const searchLower = searchTerm.toLowerCase()
    
    // Filtro de busca (nome ou email)
    const matchesSearch = searchTerm === '' || 
      nome.includes(searchLower) || 
      email.includes(searchLower)
    
    // Filtro de cargo
    const matchesCargo = filterCargo === 'todos' || usuario.cargo === filterCargo
    
    // Filtro de instrumento
    const matchesInstrumento = filterInstrumento === 'todos' || 
      (usuario.instrumento_id && usuario.instrumento_id === filterInstrumento) ||
      (!usuario.instrumento_id && filterInstrumento === 'sem')
    
    // Filtro de admin
    const matchesAdmin = filterAdmin === 'todos' || 
      (filterAdmin === 'sim' && usuario.lider) ||
      (filterAdmin === 'nao' && !usuario.lider)
    
    return matchesSearch && matchesCargo && matchesInstrumento && matchesAdmin
  })

  if (loading && usuarios.length === 0) {
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
            Gerenciar Usuários
          </h1>
        </div>
        <button
          onClick={openNewModal}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-light transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-semibold"
        >
          + Novo Usuário
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
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro de Cargo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cargo
              </label>
              <select
                value={filterCargo}
                onChange={(e) => setFilterCargo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              >
                <option value="todos">Todos</option>
                <option value="cantor">Cantor</option>
                <option value="musico">Músico</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>

            {/* Filtro de Instrumento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Instrumento
              </label>
              <select
                value={filterInstrumento}
                onChange={(e) => setFilterInstrumento(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              >
                <option value="todos">Todos</option>
                <option value="sem">Sem instrumento</option>
                {instrumentos.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Admin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Administrador
              </label>
              <select
                value={filterAdmin}
                onChange={(e) => setFilterAdmin(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              >
                <option value="todos">Todos</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
            Mostrando {filteredUsuarios.length} de {usuarios.length} usuário(s)
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
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Cargo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Instrumento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Data Nascimento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Admin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsuarios.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                      Nenhum usuário encontrado
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                      Tente ajustar os filtros de busca
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsuarios.map((usuario, index) => (
              <tr 
                key={usuario.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {(usuario as any).nome || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  {usuario.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  {usuario.cargo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  {(usuario as any).instrumento?.nome || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  {formatDate(usuario.data_nascimento)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {usuario.lider ? (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                      Sim
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
                      Não
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(usuario)}
                    className="text-primary hover:text-primary-light mr-4 transition-all duration-200 hover:underline font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(usuario.id)}
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
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: João Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
              {editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nova Senha (deixe em branco para manter a atual)
                  </label>
                  <input
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  required
                  value={formData.data_nascimento}
                  onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cargo
                </label>
                <select
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="cantor">Cantor</option>
                  <option value="musico">Músico</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Instrumento
                </label>
                <select
                  value={formData.instrumento_id}
                  onChange={(e) => setFormData({ ...formData, instrumento_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Nenhum</option>
                  {instrumentos.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="lider"
                  checked={formData.lider}
                  onChange={(e) => setFormData({ ...formData, lider: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="lider" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Administrador/Líder
                </label>
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
                    setEditingUser(null)
                    resetForm()
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

