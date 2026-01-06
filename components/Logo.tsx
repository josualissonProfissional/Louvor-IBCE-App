'use client'

// Componente de Logo do Ministério de Louvor IBCE
interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'full'
  showText?: boolean
  className?: string
  iconColor?: string
  textColor?: string
}

export default function Logo({ 
  size = 'medium', 
  showText = true, 
  className = '',
  iconColor = 'currentColor',
  textColor = 'white'
}: LogoProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          icon: 32,
          text: 'text-lg',
          badge: 'text-xs px-3 py-1',
          tagline: 'text-xs',
          spacing: 'mb-2'
        }
      case 'medium':
        return {
          icon: 48,
          text: 'text-2xl',
          badge: 'text-sm px-4 py-1.5',
          tagline: 'text-sm',
          spacing: 'mb-3'
        }
      case 'large':
        return {
          icon: 64,
          text: 'text-4xl',
          badge: 'text-base px-6 py-2',
          tagline: 'text-base',
          spacing: 'mb-4'
        }
      case 'full':
        return {
          icon: 96,
          text: 'text-6xl md:text-8xl',
          badge: 'text-lg md:text-xl px-6 py-2',
          tagline: 'text-sm md:text-base',
          spacing: 'mb-6'
        }
      default:
        return {
          icon: 48,
          text: 'text-2xl',
          badge: 'text-sm px-4 py-1.5',
          tagline: 'text-sm',
          spacing: 'mb-3'
        }
    }
  }

  const sizes = getSizeClasses()
  const iconSize = sizes.icon
  const bookSize = iconSize * 0.6
  const crossSize = iconSize * 0.35

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Ícone do livro com cruz */}
      <div 
        className="rounded-full bg-white flex items-center justify-center relative"
        style={{ 
          width: `${iconSize}px`, 
          height: `${iconSize}px`,
          marginBottom: size === 'full' ? '1.5rem' : size === 'large' ? '1rem' : '0.75rem'
        }}
      >
        {/* Livro */}
        <svg 
          className="absolute" 
          width={bookSize} 
          height={bookSize} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#2C5F5F" 
          strokeWidth="1.5"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
          />
        </svg>
        {/* Cruz - posicionada à direita do círculo */}
        <svg 
          className="absolute" 
          style={{ 
            right: `-${crossSize * 0.3}px`,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
          width={crossSize} 
          height={crossSize} 
          viewBox="0 0 24 24" 
          fill="none"
          stroke="#2C5F5F"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>

      {showText && (
        <>
          {/* Texto LOUVOR */}
          <h1 className={`${sizes.text} font-bold tracking-wider mb-2`} style={{ color: textColor }}>
            LOUVOR
          </h1>
          
          {/* Badge IBCE */}
          <div className="inline-block mb-2">
            <span className={`${sizes.badge} bg-white/20 backdrop-blur-sm rounded-full font-semibold tracking-wider`} style={{ color: textColor }}>
              • IBCE •
            </span>
          </div>
          
          {/* Texto SEMEANDO A VERDADE */}
          <p className={`${sizes.tagline} tracking-widest uppercase flex items-center gap-1`} style={{ color: textColor === 'white' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)' }}>
            SEMEANDO A VERDADE
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </p>
        </>
      )}
    </div>
  )
}

