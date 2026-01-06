'use client'

// Lista de músicas com popup de opções
import { useState } from 'react'
import { MusicaCompleta } from '@/types'
import LetraViewer from './LetraViewer'
import CifraViewerInline from './CifraViewerInline'

interface MusicaListProps {
  musicas: MusicaCompleta[]
  isAdmin: boolean
}

export default function MusicaList({ musicas, isAdmin }: MusicaListProps) {
  const [selectedMusica, setSelectedMusica] = useState<MusicaCompleta | null>(null)
  const [showYoutubeModal, setShowYoutubeModal] = useState(false)
  const [viewType, setViewType] = useState<'letra' | 'cifra' | null>(null)
  
  // Estados para busca e filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('todos')

  const handleMusicaClick = (musica: MusicaCompleta) => {
    setSelectedMusica(musica)
    setViewType(null)
  }

  const handleViewLetra = (musica: MusicaCompleta) => {
    setSelectedMusica(musica)
    setViewType('letra')
  }

  const handleViewCifra = (musica: MusicaCompleta) => {
    setSelectedMusica(musica)
    setViewType('cifra')
  }

  const closeModal = () => {
    setSelectedMusica(null)
    setShowYoutubeModal(false)
    setViewType(null)
  }

  // Função para extrair o ID do vídeo do YouTube
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null
    
    // Padrões de URL do YouTube
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/.*[?&]v=([^&\n?#]+)/,
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    
    return null
  }

  const handleViewYouTube = (musica: MusicaCompleta) => {
    setSelectedMusica(musica)
    setShowYoutubeModal(true)
  }

  // Função para filtrar músicas
  const filteredMusicas = musicas.filter((musica) => {
    const titulo = musica.titulo.toLowerCase()
    const searchLower = searchTerm.toLowerCase()
    
    // Filtro de busca (título)
    const matchesSearch = searchTerm === '' || titulo.includes(searchLower)
    
    // Filtro de tipo
    const matchesTipo = filterTipo === 'todos' ||
      (filterTipo === 'com_letras' && musica.letras.length > 0) ||
      (filterTipo === 'com_cifras' && musica.cifras.length > 0) ||
      (filterTipo === 'com_youtube' && musica.link_youtube) ||
      (filterTipo === 'sem_letras' && musica.letras.length === 0) ||
      (filterTipo === 'sem_cifras' && musica.cifras.length === 0)
    
    return matchesSearch && matchesTipo
  })

  if (musicas.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400 animate-fade-in">
        <svg className="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <p className="text-lg font-medium">Nenhuma música cadastrada ainda.</p>
      </div>
    )
  }

  // Calcular videoId do YouTube se necessário
  const youtubeVideoId = selectedMusica && showYoutubeModal && selectedMusica.link_youtube
    ? getYouTubeVideoId(selectedMusica.link_youtube)
    : null

  return (
    <>
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
              placeholder="Buscar música por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro de Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtrar por
              </label>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              >
                <option value="todos">Todas as músicas</option>
                <option value="com_letras">Com letras</option>
                <option value="com_cifras">Com cifras</option>
                <option value="com_youtube">Com link do YouTube</option>
                <option value="sem_letras">Sem letras</option>
                <option value="sem_cifras">Sem cifras</option>
              </select>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
            Mostrando {filteredMusicas.length} de {musicas.length} música(s)
          </div>
        </div>
      </div>

      {/* Lista de Músicas */}
      {filteredMusicas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMusicas.map((musica, index) => (
            <div
              key={musica.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-2 transition-all duration-300 ease-in-out animate-slide-in-up group border border-transparent hover:border-primary/30 hover:bg-gradient-to-br hover:from-white hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-700 relative overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => handleMusicaClick(musica)}
            >
              {/* Efeito de brilho no hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-primary/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
              
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-primary transition-colors duration-300 relative z-10">
                {musica.titulo}
              </h3>
              <div className="mt-4 flex gap-2 flex-wrap relative z-10">
                {musica.letras.length > 0 && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1.5 rounded-full font-medium shadow-sm">
                    {musica.letras.length} letra{musica.letras.length > 1 ? 's' : ''}
                  </span>
                )}
                {musica.cifras.length > 0 && (
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1.5 rounded-full font-medium shadow-sm">
                    {musica.cifras.length} cifra{musica.cifras.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 animate-fade-in">
          <svg className="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium mb-1">
            Nenhuma música encontrada
          </p>
          <p className="text-sm">
            {searchTerm
              ? `Tente ajustar os filtros de busca para "${searchTerm}".`
              : 'Tente ajustar os filtros de busca.'}
          </p>
        </div>
      )}

      {/* Modal de seleção */}
      {selectedMusica && !viewType && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in"
          onClick={closeModal}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 animate-slide-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header com título e botão de fechar */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {selectedMusica.titulo}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Escolha uma opção
                </p>
              </div>
              <button
                onClick={closeModal}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Botões de ação */}
            <div className="space-y-3">
              {selectedMusica.letras.length > 0 && (
                <button
                  onClick={() => handleViewLetra(selectedMusica)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Ver Letra</span>
                  <span className="ml-auto bg-blue-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {selectedMusica.letras.length}
                  </span>
                </button>
              )}
              {selectedMusica.cifras.length > 0 && (
                <button
                  onClick={() => handleViewCifra(selectedMusica)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <span>Ver Cifra</span>
                  <span className="ml-auto bg-green-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {selectedMusica.cifras.length}
                  </span>
                </button>
              )}
              {selectedMusica.link_youtube && (
                <button
                  onClick={() => handleViewYouTube(selectedMusica)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span>Ouvir Música</span>
                </button>
              )}
              <button
                onClick={closeModal}
                className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Fechar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Letra */}
      {selectedMusica && viewType === 'letra' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={closeModal}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-4xl w-full mx-4 my-8 transform transition-all duration-300 scale-100 animate-slide-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedMusica.titulo}
              </h2>
              <button
                onClick={closeModal}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto">
              <LetraViewer musica={selectedMusica} />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cifra */}
      {selectedMusica && viewType === 'cifra' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={closeModal}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-4xl w-full mx-4 my-8 transform transition-all duration-300 scale-100 animate-slide-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedMusica.titulo}
              </h2>
              <button
                onClick={closeModal}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto">
              <CifraViewerInline musica={selectedMusica} />
            </div>
          </div>
        </div>
      )}

      {/* Modal do YouTube */}
      {selectedMusica && showYoutubeModal && youtubeVideoId && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in"
          onClick={closeModal}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-4xl w-full mx-4 transform transition-all duration-300 scale-100 animate-slide-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header com título e botão de fechar */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {selectedMusica.titulo}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Reproduzindo no YouTube
                </p>
              </div>
              <button
                onClick={closeModal}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Iframe do YouTube */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}






