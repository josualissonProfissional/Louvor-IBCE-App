'use client'

// Componente global de player do YouTube com funcionalidade de minimizar
import { useState, createContext, useContext, useRef, useEffect } from 'react'

interface YouTubePlayerContextType {
  videoId: string | null
  titulo: string | null
  isMinimized: boolean
  setVideo: (videoId: string | null, titulo: string | null) => void
  minimize: () => void
  maximize: () => void
  close: () => void
}

const YouTubePlayerContext = createContext<YouTubePlayerContextType | null>(null)

export function useYouTubePlayer() {
  const context = useContext(YouTubePlayerContext)
  if (!context) {
    throw new Error('useYouTubePlayer deve ser usado dentro de YouTubePlayerProvider')
  }
  return context
}

export function YouTubePlayerProvider({ children }: { children: React.ReactNode }) {
  const [videoId, setVideoId] = useState<string | null>(null)
  const [titulo, setTitulo] = useState<string | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)

  const setVideo = (id: string | null, title: string | null) => {
    setVideoId(id)
    setTitulo(title)
    setIsMinimized(false)
  }

  const minimize = () => {
    setIsMinimized(true)
  }

  const maximize = () => {
    setIsMinimized(false)
  }

  const close = () => {
    setVideoId(null)
    setTitulo(null)
    setIsMinimized(false)
  }

  return (
    <YouTubePlayerContext.Provider
      value={{
        videoId,
        titulo,
        isMinimized,
        setVideo,
        minimize,
        maximize,
        close,
      }}
    >
      {children}
      {videoId && (
        <YouTubePlayerComponent
          videoId={videoId}
          titulo={titulo}
          isMinimized={isMinimized}
          onMinimize={minimize}
          onMaximize={maximize}
          onClose={close}
        />
      )}
    </YouTubePlayerContext.Provider>
  )
}

interface YouTubePlayerComponentProps {
  videoId: string
  titulo: string | null
  isMinimized: boolean
  onMinimize: () => void
  onMaximize: () => void
  onClose: () => void
}

function YouTubePlayerComponent({
  videoId,
  titulo,
  isMinimized,
  onMinimize,
  onMaximize,
  onClose,
}: YouTubePlayerComponentProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const iframeId = `youtube-player-${videoId}`

  // Resetar estado quando o vídeo muda
  useEffect(() => {
    setIsPaused(false)
  }, [videoId])

  // Função para enviar comandos ao iframe do YouTube
  const sendCommand = (command: string) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: command,
          args: '',
        }),
        'https://www.youtube.com'
      )
    }
  }

  // Listener para eventos do YouTube
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verificar se a mensagem vem do YouTube
      if (event.origin !== 'https://www.youtube.com') return

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

        // Detectar quando o vídeo é pausado ou tocado
        if (data.event === 'onStateChange') {
          // 0 = terminado, 1 = tocando, 2 = pausado
          if (data.info === 2) {
            setIsPaused(true)
          } else if (data.info === 1) {
            setIsPaused(false)
          }
        }
      } catch (e) {
        // Ignorar erros de parsing
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handlePlayPause = () => {
    if (isPaused) {
      sendCommand('playVideo')
      setIsPaused(false)
    } else {
      sendCommand('pauseVideo')
      setIsPaused(true)
    }
  }

  return (
    <>
      {/* Widget minimizado - sempre visível quando minimizado */}
      {isMinimized && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-primary animate-slide-in-up">
          <div className="flex items-center gap-3 p-3">
            {/* Thumbnail do vídeo */}
            <div className="relative w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
              <img
                src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                alt={titulo || 'Vídeo'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>

            {/* Informações */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {titulo || 'Reproduzindo...'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">YouTube</p>
            </div>

            {/* Botões */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePlayPause}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title={isPaused ? 'Tocar' : 'Pausar'}
              >
                {isPaused ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                  </svg>
                )}
              </button>
              <button
                onClick={onMaximize}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Maximizar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                title="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Iframe do YouTube - sempre renderizado para continuar tocando */}
      {/* Quando minimizado, o iframe fica escondido mas ainda tocando */}
      <div
        className={`${
          isMinimized
            ? 'fixed -left-[9999px] top-0 w-[200px] h-[112px] opacity-0 pointer-events-none z-[-1]'
            : 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] backdrop-blur-sm animate-fade-in'
        }`}
        onClick={!isMinimized ? onClose : undefined}
      >
        <div
          className={`${
            isMinimized
              ? 'w-[200px] h-[112px]'
              : 'bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-4xl w-full mx-4 transform transition-all duration-300 scale-100 animate-slide-in-up'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {!isMinimized && (
            <>
              {/* Header com título e botões */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {titulo || 'Reproduzindo...'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Reproduzindo no YouTube
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onMinimize}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                    title="Minimizar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                    aria-label="Fechar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Iframe do YouTube - sempre renderizado */}
          <div
            className={isMinimized ? 'w-[200px] h-[112px]' : 'relative w-full'}
            style={isMinimized ? {} : { paddingBottom: '56.25%' }}
          >
            <iframe
              ref={iframeRef}
              id={iframeId}
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className={isMinimized ? 'absolute top-0 left-0 w-[200px] h-[112px]' : 'absolute top-0 left-0 w-full h-full rounded-lg'}
            />
          </div>
        </div>
      </div>
    </>
  )
}
