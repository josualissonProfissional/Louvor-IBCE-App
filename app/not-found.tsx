import Link from 'next/link'
import Logo from '@/components/Logo'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900 via-teal-800 to-teal-900 px-4">
      <div className="text-center max-w-2xl w-full animate-fade-in">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Logo size="large" showText={true} textColor="white" />
        </div>

        {/* Número 404 */}
        <div className="mb-6">
          <h1 className="text-9xl md:text-[12rem] font-bold text-white/20 dark:text-white/10 select-none">
            404
          </h1>
        </div>

        {/* Mensagem */}
        <div className="mb-8 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Página não encontrada
          </h2>
          <p className="text-lg md:text-xl text-white/80 max-w-md mx-auto">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>

        {/* Botão para voltar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center gap-2 min-w-[200px] justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Voltar para Home
          </Link>
          <Link
            href="/musicas"
            className="bg-primary/80 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center gap-2 min-w-[200px] justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            Ver Músicas
          </Link>
        </div>

        {/* Decoração */}
        <div className="mt-12 flex justify-center gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-white/30 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
