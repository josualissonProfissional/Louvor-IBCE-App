'use client'

// Modal para mostrar opções da música (Letra, Cifras, Ouvir)
import { useState, useEffect } from 'react'
import { extractYouTubeId } from '@/lib/utils'
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
  const [mostrarVideo, setMostrarVideo] = useState(false)
  const [viewType, setViewType] = useState<'letra' | 'cifra' | null>(null)
  const [musicaCompleta, setMusicaCompleta] = useState<MusicaCompleta | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedLetraIndex, setSelectedLetraIndex] = useState(0)
  const [selectedCifraIndex, setSelectedCifraIndex] = useState(0)

  const youtubeId = musica.link_youtube ? extractYouTubeId(musica.link_youtube) : null

  // Busca dados completos da música quando o modal abre
  useEffect(() => {
    if (isOpen && (musica.temLetras || musica.temCifras)) {
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

  const handleViewLetra = () => {
    setViewType('letra')
    setMostrarVideo(false)
  }

  const handleViewCifra = () => {
    setViewType('cifra')
    setMostrarVideo(false)
  }

  const handleBackToOptions = () => {
    setViewType(null)
    setMostrarVideo(false)
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {musica.titulo}
            </h2>
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
            {!mostrarVideo && !viewType && (
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
                    onClick={() => setMostrarVideo(true)}
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

            {/* Video do YouTube */}
            {mostrarVideo && youtubeId && (
              <div className="space-y-4">
                <button
                  onClick={handleBackToOptions}
                  className="text-primary hover:underline text-sm flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Voltar para opções
                </button>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Letra */}
            {viewType === 'letra' && (
              <div className="space-y-4">
                <button
                  onClick={handleBackToOptions}
                  className="text-primary hover:underline text-sm flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Voltar para opções
                </button>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Carregando letra...</p>
                  </div>
                ) : musicaCompleta && musicaCompleta.letras.length > 0 ? (
                  <LetraViewerInline musica={musicaCompleta} selectedIndex={selectedLetraIndex} />
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
                <button
                  onClick={handleBackToOptions}
                  className="text-primary hover:underline text-sm flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Voltar para opções
                </button>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Carregando cifra...</p>
                  </div>
                ) : musicaCompleta && musicaCompleta.cifras.length > 0 ? (
                  <CifraViewerInline musica={musicaCompleta} />
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>Cifra não encontrada.</p>
                  </div>
                )}
              </div>
            )}

            {/* Mensagem se não houver opções */}
            {!mostrarVideo && !viewType && !musica.temLetras && !musica.temCifras && !youtubeId && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Nenhuma opção disponível para esta música.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
