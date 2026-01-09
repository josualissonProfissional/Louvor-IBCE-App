'use client'

// Modal para mostrar opções da música (Letra, Cifras, Ouvir)
import { useState, useEffect } from 'react'
import { extractYouTubeId } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useYouTubePlayer } from './YouTubePlayer'
import LetraViewerInline from './LetraViewerInline'
import CifraViewerInline from './CifraViewerInline'

interface MusicaModalProps {
  musica: {
    id: string
    titulo: string
    link_youtube: string | null
    temLetras?: boolean
    temCifras?: boolean
  }
  isOpen: boolean
  onClose: () => void
}

interface MusicaCompleta {
  id: string
  titulo: string
  link_youtube: string | null
  letras: Array<{ id: string; texto: string }>
  cifras: Array<{ id: string; texto: string; titulo?: string | null }>
}

export default function MusicaModal({ musica, isOpen, onClose }: MusicaModalProps) {
  const [viewType, setViewType] = useState<'letra' | 'cifra' | null>(null)
  const [musicaCompleta, setMusicaCompleta] = useState<MusicaCompleta | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedLetraIndex, setSelectedLetraIndex] = useState(0)
  const [selectedCifraIndex, setSelectedCifraIndex] = useState(0)
  const [user, setUser] = useState<{ lider?: boolean } | null>(null)
  const [editingCifra, setEditingCifra] = useState<{ id: string; texto: string; titulo?: string | null } | null>(null)
  const [editingLetra, setEditingLetra] = useState<{ id: string; texto: string } | null>(null)
  const [showAddCifra, setShowAddCifra] = useState(false)
  const [showAddLetra, setShowAddLetra] = useState(false)
  const { setVideo } = useYouTubePlayer()

  const youtubeId = musica.link_youtube ? extractYouTubeId(musica.link_youtube) : null
  const isAdmin = user?.lider === true

  // Carrega dados do usuário (mesma lógica do Header)
  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        const { data } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', authUser.id)
          .single()
        setUser(data)
      } else {
        setUser(null)
      }
    }
    
    if (isOpen) {
      loadUser()
    }
  }, [isOpen])

  // Busca dados completos da música quando o modal abre
  useEffect(() => {
    if (isOpen) {
      loadMusicaCompleta()
    }
  }, [isOpen, musica.id])

  const loadMusicaCompleta = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/musicas/${musica.id}`)
      if (response.ok) {
        const data = await response.json()
        setMusicaCompleta(data)
      }
    } catch (error) {
      console.error('Erro ao carregar música completa:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCifra = async (cifraId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta cifra?')) return

    try {
      const response = await fetch(`/api/cifras/${cifraId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadMusicaCompleta()
        alert('Cifra deletada com sucesso!')
      } else {
        const error = await response.json()
        alert(`Erro ao deletar cifra: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao deletar cifra:', error)
      alert('Erro ao deletar cifra')
    }
  }

  const handleDeleteLetra = async (letraId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta letra?')) return

    try {
      const response = await fetch(`/api/letras/${letraId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadMusicaCompleta()
        alert('Letra deletada com sucesso!')
      } else {
        const error = await response.json()
        alert(`Erro ao deletar letra: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao deletar letra:', error)
      alert('Erro ao deletar letra')
    }
  }

  const handleSaveCifra = async (texto: string, titulo?: string) => {
    try {
      if (editingCifra) {
        // Editar cifra existente
        const response = await fetch(`/api/cifras/${editingCifra.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto, titulo: titulo || null }),
        })

        if (response.ok) {
          await loadMusicaCompleta()
          setEditingCifra(null)
          alert('Cifra atualizada com sucesso!')
        } else {
          const error = await response.json()
          alert(`Erro ao atualizar cifra: ${error.error}`)
        }
      } else {
        // Adicionar nova cifra
        const response = await fetch('/api/cifras', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ musica_id: musica.id, texto, titulo: titulo || null }),
        })

        if (response.ok) {
          await loadMusicaCompleta()
          setShowAddCifra(false)
          alert('Cifra adicionada com sucesso!')
        } else {
          const error = await response.json()
          alert(`Erro ao adicionar cifra: ${error.error}`)
        }
      }
    } catch (error) {
      console.error('Erro ao salvar cifra:', error)
      alert('Erro ao salvar cifra')
    }
  }

  const handleSaveLetra = async (texto: string) => {
    try {
      if (editingLetra) {
        // Editar letra existente
        const response = await fetch(`/api/letras/${editingLetra.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto }),
        })

        if (response.ok) {
          await loadMusicaCompleta()
          setEditingLetra(null)
          alert('Letra atualizada com sucesso!')
        } else {
          const error = await response.json()
          alert(`Erro ao atualizar letra: ${error.error}`)
        }
      } else {
        // Adicionar nova letra
        const response = await fetch('/api/letras', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ musica_id: musica.id, texto }),
        })

        if (response.ok) {
          await loadMusicaCompleta()
          setShowAddLetra(false)
          alert('Letra adicionada com sucesso!')
        } else {
          const error = await response.json()
          alert(`Erro ao adicionar letra: ${error.error}`)
        }
      }
    } catch (error) {
      console.error('Erro ao salvar letra:', error)
      alert('Erro ao salvar letra')
    }
  }

  const handleViewLetra = () => {
    setViewType('letra')
  }

  const handleViewCifra = () => {
    setViewType('cifra')
  }

  const handleBackToOptions = () => {
    setViewType(null)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {musica.titulo}
              </h2>
              {isAdmin && (
                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-semibold">
                  ADMIN
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 transition-all duration-200"
              aria-label="Fechar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Opções */}
            {!viewType && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {musica.temLetras && (
                  <button
                    onClick={handleViewLetra}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 rounded-lg text-center font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Ver Letra</span>
                  </button>
                )}

                {musica.temCifras && (
                  <button
                    onClick={handleViewCifra}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-lg text-center font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <span>Ver Cifra</span>
                  </button>
                )}

                {youtubeId && (
                  <button
                    onClick={() => {
                      setVideo(youtubeId, musica.titulo)
                      setMostrarVideo(false)
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-lg text-center font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    <span>Ouvir Música</span>
                  </button>
                )}
              </div>
            )}


            {/* Letra */}
            {viewType === 'letra' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleBackToOptions}
                    className="text-primary hover:underline text-sm flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Voltar para opções
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAddLetra(true)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Adicionar Letra
                    </button>
                  )}
                </div>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Carregando letra...</p>
                  </div>
                ) : musicaCompleta ? (
                  <div className="space-y-4">
                    {isAdmin && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            Gerenciar Letras {musicaCompleta.letras.length > 0 && `(${musicaCompleta.letras.length})`}
                          </span>
                        </div>
                        {musicaCompleta.letras.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {musicaCompleta.letras.map((letra, index) => (
                              <div key={letra.id} className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Versão {index + 1}</span>
                                <button
                                  onClick={() => setEditingLetra(letra)}
                                  className="text-blue-500 hover:text-blue-600 p-1.5 rounded transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  title="Editar letra"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteLetra(letra.id)}
                                  className="text-red-500 hover:text-red-600 p-1.5 rounded transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Deletar letra"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Nenhuma letra cadastrada ainda.</p>
                        )}
                      </div>
                    )}
                    {musicaCompleta.letras.length > 0 ? (
                      <LetraViewerInline musica={musicaCompleta} selectedIndex={selectedLetraIndex} />
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>Letra não encontrada.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>Letra não encontrada.</p>
                  </div>
                )}
              </div>
            )}

            {/* Cifra */}
            {viewType === 'cifra' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleBackToOptions}
                    className="text-primary hover:underline text-sm flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Voltar para opções
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAddCifra(true)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Adicionar Cifra
                    </button>
                  )}
                </div>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Carregando cifra...</p>
                  </div>
                ) : musicaCompleta ? (
                  <div className="space-y-4">
                    {isAdmin && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            Gerenciar Cifras {musicaCompleta.cifras.length > 0 && `(${musicaCompleta.cifras.length})`}
                          </span>
                        </div>
                        {musicaCompleta.cifras.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {musicaCompleta.cifras.map((cifra, index) => (
                              <div key={cifra.id} className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {cifra.titulo || `Versão ${index + 1}`}
                                </span>
                                <button
                                  onClick={() => setEditingCifra(cifra)}
                                  className="text-blue-500 hover:text-blue-600 p-1.5 rounded transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  title="Editar cifra"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteCifra(cifra.id)}
                                  className="text-red-500 hover:text-red-600 p-1.5 rounded transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Deletar cifra"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Nenhuma cifra cadastrada ainda.</p>
                        )}
                      </div>
                    )}
                    {musicaCompleta.cifras.length > 0 ? (
                      <CifraViewerInline musica={musicaCompleta} />
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>Cifra não encontrada.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>Cifra não encontrada.</p>
                  </div>
                )}
              </div>
            )}

            {/* Mensagem se não houver opções */}
            {!viewType && !musica.temLetras && !musica.temCifras && !youtubeId && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Nenhuma opção disponível para esta música.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Editar/Adicionar Cifra */}
      {(editingCifra || showAddCifra) && (
        <CifraEditorModal
          cifra={editingCifra}
          onSave={handleSaveCifra}
          onClose={() => {
            setEditingCifra(null)
            setShowAddCifra(false)
          }}
        />
      )}

      {/* Modal de Editar/Adicionar Letra */}
      {(editingLetra || showAddLetra) && (
        <LetraEditorModal
          letra={editingLetra}
          onSave={handleSaveLetra}
          onClose={() => {
            setEditingLetra(null)
            setShowAddLetra(false)
          }}
        />
      )}
    </div>
  )
}

// Modal para editar/adicionar cifra
function CifraEditorModal({
  cifra,
  onSave,
  onClose,
}: {
  cifra: { id: string; texto: string; titulo?: string | null } | null
  onSave: (texto: string, titulo?: string) => void
  onClose: () => void
}) {
  const [texto, setTexto] = useState(cifra?.texto || '')
  const [titulo, setTitulo] = useState(cifra?.titulo || '')

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {cifra ? 'Editar Cifra' : 'Adicionar Cifra'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título (opcional):
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Cifra para Baixo, Cifra para Violão"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Texto da Cifra:
              </label>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={15}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                placeholder="Cole ou digite a cifra aqui..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (texto.trim()) {
                    onSave(texto, titulo || undefined)
                  } else {
                    alert('Por favor, preencha o texto da cifra')
                  }
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Modal para editar/adicionar letra
function LetraEditorModal({
  letra,
  onSave,
  onClose,
}: {
  letra: { id: string; texto: string } | null
  onSave: (texto: string) => void
  onClose: () => void
}) {
  const [texto, setTexto] = useState(letra?.texto || '')

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {letra ? 'Editar Letra' : 'Adicionar Letra'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Texto da Letra:
              </label>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={15}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Cole ou digite a letra aqui..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (texto.trim()) {
                    onSave(texto)
                  } else {
                    alert('Por favor, preencha o texto da letra')
                  }
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
