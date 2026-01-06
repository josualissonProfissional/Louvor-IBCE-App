'use client'

// Cabeçalho da aplicação com logo e navegação
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Usuario } from '@/types'
import Logo from './Logo'

export function Header() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  // Previne scroll do body quando o menu está aberto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }


  // Fecha o menu mobile ao clicar em um link
  const handleLinkClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <header className="bg-primary text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 hover:opacity-90 transition-opacity">
            <div className="flex-shrink-0">
              <Logo size="small" showText={false} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold whitespace-nowrap">
                LOUVOR IBCE
              </span>
              <span className="text-xs sm:text-sm opacity-80 hidden sm:block">
                Semeando a Verdade
              </span>
            </div>
          </Link>

          {/* Menu Desktop */}
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6">
            <Link
              href="/musicas"
              className={`hover:underline whitespace-nowrap ${pathname === '/musicas' ? 'font-bold' : ''}`}
            >
              Músicas
            </Link>
            <Link
              href="/escalas"
              className={`hover:underline whitespace-nowrap ${pathname === '/escalas' ? 'font-bold' : ''}`}
            >
              Escalas
            </Link>
            {user && (
              <Link
                href="/disponibilidade"
                className={`hover:underline whitespace-nowrap ${pathname === '/disponibilidade' ? 'font-bold' : ''}`}
              >
                Disponibilidade
              </Link>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded hover:bg-primary-light transition flex-shrink-0"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center space-x-3 xl:space-x-4">
                    <span className="text-sm whitespace-nowrap truncate max-w-[120px] xl:max-w-none">
                      {(user as any).nome || user.email}
                    </span>
                    {user.lider && (
                      <Link
                        href="/admin"
                        className="text-sm hover:underline whitespace-nowrap"
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="text-sm hover:underline whitespace-nowrap"
                    >
                      Sair
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="text-sm hover:underline whitespace-nowrap"
                  >
                    Entrar
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Botão Menu Mobile */}
          <div className="flex items-center space-x-2 lg:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded hover:bg-primary-light transition"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded hover:bg-primary-light transition"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Menu Mobile - Sidebar */}
        {/* Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed top-0 left-0 h-full w-72 bg-primary text-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl lg:hidden ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Header do Sidebar */}
            <div className="flex items-center justify-between p-5 border-b border-primary-light/30">
              <div className="flex items-center space-x-3">
                <Logo size="small" showText={false} />
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold uppercase tracking-wide">LOUVOR IBCE</h2>
                  <span className="text-xs opacity-80">Semeando a Verdade</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg hover:bg-primary-light transition-all duration-200 hover:scale-110"
                  aria-label="Alternar tema"
                >
                  <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
                </button>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg border-2 border-orange-500 hover:bg-orange-500/20 transition-all duration-200 hover:scale-110"
                aria-label="Fechar menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navegação */}
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col space-y-2">
                <Link
                  href="/musicas"
                  onClick={handleLinkClick}
                  className={`px-4 py-3 rounded-lg transition-all duration-200 hover:bg-primary-light hover:translate-x-2 flex items-center gap-2 ${
                    pathname === '/musicas' ? 'bg-primary-light/50 font-semibold border-l-4 border-white' : ''
                  } ${mobileMenuOpen ? 'animate-slide-in-up' : ''}`}
                  style={{ animationDelay: mobileMenuOpen ? '100ms' : '0ms' }}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <span>Músicas</span>
                </Link>
                <Link
                  href="/escalas"
                  onClick={handleLinkClick}
                  className={`px-4 py-3 rounded-lg transition-all duration-200 hover:bg-primary-light hover:translate-x-2 flex items-center gap-2 ${
                    pathname === '/escalas' ? 'bg-primary-light/50 font-semibold border-l-4 border-white' : ''
                  } ${mobileMenuOpen ? 'animate-slide-in-up' : ''}`}
                  style={{ animationDelay: mobileMenuOpen ? '150ms' : '0ms' }}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Escalas</span>
                </Link>
                {user && (
                  <Link
                    href="/disponibilidade"
                    onClick={handleLinkClick}
                    className={`px-4 py-3 rounded-lg transition-all duration-200 hover:bg-primary-light hover:translate-x-2 flex items-center gap-2 ${
                      pathname === '/disponibilidade' ? 'bg-primary-light/50 font-semibold border-l-4 border-white' : ''
                    } ${mobileMenuOpen ? 'animate-slide-in-up' : ''}`}
                    style={{ animationDelay: mobileMenuOpen ? '200ms' : '0ms' }}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Disponibilidade</span>
                  </Link>
                )}
              </div>

              {/* Separador */}
              <div className="border-t border-primary-light/30 my-4" />

              {/* Informações do Usuário */}
              {!loading && (
                <div className="space-y-2">
                  {user ? (
                    <>
                      <div className={`px-4 py-3 text-sm text-gray-200 bg-gray-800/30 rounded-lg ${mobileMenuOpen ? 'animate-slide-in-up' : ''}`} style={{ animationDelay: mobileMenuOpen ? '250ms' : '0ms' }}>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="truncate font-medium">{(user as any).nome || user.email}</span>
                        </div>
                      </div>
                      {user.lider && (
                        <Link
                          href="/admin"
                          onClick={handleLinkClick}
                          className={`block px-4 py-3 rounded-lg transition-all duration-200 hover:bg-primary-light hover:translate-x-2 flex items-center gap-2 ${mobileMenuOpen ? 'animate-slide-in-up' : ''}`}
                          style={{ animationDelay: mobileMenuOpen ? '300ms' : '0ms' }}
                        >
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Admin</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          handleLinkClick()
                          handleLogout()
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 hover:bg-red-500/20 hover:translate-x-2 flex items-center gap-2 text-red-200 hover:text-red-100 ${mobileMenuOpen ? 'animate-slide-in-up' : ''}`}
                        style={{ animationDelay: mobileMenuOpen ? '350ms' : '0ms' }}
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sair</span>
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      onClick={handleLinkClick}
                      className={`block px-4 py-3 rounded-lg transition-all duration-200 hover:bg-primary-light hover:translate-x-2 flex items-center gap-2 ${mobileMenuOpen ? 'animate-slide-in-up' : ''}`}
                      style={{ animationDelay: mobileMenuOpen ? '250ms' : '0ms' }}
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span>Entrar</span>
                    </Link>
                  )}
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}






