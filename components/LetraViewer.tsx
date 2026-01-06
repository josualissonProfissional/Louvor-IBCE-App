'use client'

// Componente para visualização de letra com controles de acessibilidade
import { useState } from 'react'
import Link from 'next/link'

interface Letra {
  id: string
  texto: string
}

interface Musica {
  id: string
  titulo: string
  letras: Letra[]
}

interface LetraViewerProps {
  musica: Musica
}

const FONT_SIZES = [
  { label: 'Pequeno', value: 14 },
  { label: 'Normal', value: 16 },
  { label: 'Médio', value: 18 },
  { label: 'Grande', value: 20 },
  { label: 'Muito Grande', value: 24 },
  { label: 'Extra Grande', value: 28 },
]

const TEXT_COLORS = [
  { label: 'Preto/Branco', value: 'default' },
  { label: 'Azul', value: '#3B82F6' },
  { label: 'Verde', value: '#10B981' },
  { label: 'Vermelho', value: '#EF4444' },
  { label: 'Roxo', value: '#8B5CF6' },
  { label: 'Laranja', value: '#F97316' },
  { label: 'Amarelo', value: '#EAB308' },
]

const FONT_FAMILIES = [
  { label: 'Padrão do Sistema', value: 'inherit', fontFamily: 'inherit' },
  { label: 'Arial', value: 'Arial, sans-serif', fontFamily: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: 'Times New Roman, serif', fontFamily: 'Times New Roman, serif' },
  { label: 'Courier New', value: 'Courier New, monospace', fontFamily: 'Courier New, monospace' },
  { label: 'Georgia', value: 'Georgia, serif', fontFamily: 'Georgia, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif', fontFamily: 'Verdana, sans-serif' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif', fontFamily: 'Trebuchet MS, sans-serif' },
  { label: 'Comic Sans MS', value: 'Comic Sans MS, cursive', fontFamily: 'Comic Sans MS, cursive' },
  { label: 'Impact', value: 'Impact, sans-serif', fontFamily: 'Impact, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif', fontFamily: 'Roboto, sans-serif' },
  { label: 'Open Sans', value: 'Open Sans, sans-serif', fontFamily: 'Open Sans, sans-serif' },
  { label: 'Lato', value: 'Lato, sans-serif', fontFamily: 'Lato, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif', fontFamily: 'Montserrat, sans-serif' },
  { label: 'Poppins', value: 'Poppins, sans-serif', fontFamily: 'Poppins, sans-serif' },
  { label: 'Raleway', value: 'Raleway, sans-serif', fontFamily: 'Raleway, sans-serif' },
]

export default function LetraViewer({ musica }: LetraViewerProps) {
  const [fontSize, setFontSize] = useState(16)
  const [textColor, setTextColor] = useState('default')
  const [isBold, setIsBold] = useState(false)
  const [fontFamily, setFontFamily] = useState('inherit')
  const [isAccordionOpen, setIsAccordionOpen] = useState(false) // Fechado por padrão no mobile

  const getTextColorClass = () => {
    if (textColor === 'default') {
      return 'text-gray-900 dark:text-white'
    }
    return ''
  }

  const getTextColorStyle = () => {
    if (textColor === 'default') {
      return {}
    }
    return { color: textColor }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/musicas"
        className="text-primary hover:underline mb-4 inline-block"
      >
        ← Voltar para músicas
      </Link>

      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {musica.titulo}
      </h1>

      {/* Controles de Acessibilidade */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        {/* Cabeçalho do Accordion */}
        <button
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-lg md:rounded-lg"
          aria-expanded={isAccordionOpen}
          aria-controls="accessibility-controls"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Controles de Acessibilidade
          </h2>
          <svg
            className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
              isAccordionOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Conteúdo do Accordion */}
        <div
          id="accessibility-controls"
          className={`overflow-hidden transition-all duration-300 ${
            isAccordionOpen
              ? 'max-h-[2000px] opacity-100'
              : 'max-h-0 opacity-0 md:max-h-[2000px] md:opacity-100'
          }`}
        >
          <div className="p-4 pt-0 md:pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tamanho da Fonte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tamanho da Fonte:
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                aria-label="Diminuir fonte"
              >
                A-
              </button>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {FONT_SIZES.map(size => (
                  <option key={size.value} value={size.value}>
                    {size.label} ({size.value}px)
                  </option>
                ))}
              </select>
              <button
                onClick={() => setFontSize(prev => Math.min(32, prev + 2))}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                aria-label="Aumentar fonte"
              >
                A+
              </button>
            </div>
          </div>

          {/* Cor do Texto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cor do Texto:
            </label>
            <select
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {TEXT_COLORS.map(color => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
            </select>
          </div>

          {/* Fonte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fonte:
            </label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {FONT_FAMILIES.map(font => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Negrito */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estilo:
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBold}
                onChange={(e) => setIsBold(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Texto em Negrito
              </span>
            </label>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Letras */}
      {musica.letras.map((letra: Letra, index: number) => (
        <div
          key={letra.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6"
        >
          {musica.letras.length > 1 && (
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Versão {index + 1}
            </h2>
          )}
          <div
            className={`letra-text whitespace-pre-wrap ${getTextColorClass()}`}
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: isBold ? 'bold' : 'normal',
              fontFamily: fontFamily,
              lineHeight: '1.6',
              ...getTextColorStyle(),
            }}
          >
            {letra.texto}
          </div>
        </div>
      ))}
    </div>
  )
}

