'use client'

// Editor de texto rico simples para letras
import { useRef, useState, useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Digite ou cole o texto aqui...',
  rows = 12,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [showTextColorPicker, setShowTextColorPicker] = useState(false)
  const [showBgColorPicker, setShowBgColorPicker] = useState(false)

  // Sincroniza o valor inicial
  useEffect(() => {
    if (editorRef.current) {
      // Só atualiza se o valor mudou externamente (não por input do usuário)
      const currentContent = editorRef.current.innerHTML
      const normalizedValue = value || ''
      const normalizedCurrent = currentContent || ''
      
      // Preserva o HTML original sem modificar quebras de linha ou espaços
      if (normalizedCurrent !== normalizedValue && normalizedValue) {
        editorRef.current.innerHTML = normalizedValue
      }
    }
  }, [value])

  // Fecha os seletores de cor ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.color-picker-container')) {
        setShowTextColorPicker(false)
        setShowBgColorPicker(false)
      }
    }

    if (showTextColorPicker || showBgColorPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showTextColorPicker, showBgColorPicker])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const formatText = (command: string) => {
    execCommand(command)
  }

  const applyColor = (command: 'foreColor' | 'backColor', color: string) => {
    execCommand(command, color)
    setShowTextColorPicker(false)
    setShowBgColorPicker(false)
  }

  const insertText = (text: string) => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      const textNode = document.createTextNode(text)
      range.insertNode(textNode)
      range.setStartAfter(textNode)
      range.setEndAfter(textNode)
      selection.removeAllRanges()
      selection.addRange(range)
      handleInput()
    }
  }

  return (
    <div className="w-full">
      {/* Barra de ferramentas */}
      <div className="flex flex-wrap gap-1 mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-t-lg border-b border-gray-300 dark:border-gray-600">
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Negrito (Ctrl+B)"
          onMouseDown={(e) => e.preventDefault()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => formatText('italic')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Itálico (Ctrl+I)"
          onMouseDown={(e) => e.preventDefault()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => formatText('underline')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Sublinhado (Ctrl+U)"
          onMouseDown={(e) => e.preventDefault()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        {/* Seletor de Cor do Texto */}
        <div className="relative color-picker-container">
          <button
            type="button"
            onClick={() => {
              setShowTextColorPicker(prev => !prev)
              setShowBgColorPicker(false)
            }}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex items-center gap-1"
            title="Cor do texto"
            onMouseDown={(e) => e.preventDefault()}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <div className="w-3 h-3 rounded-full border border-gray-400" style={{ backgroundColor: 'currentColor' }}></div>
          </button>
          {showTextColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-2 z-[9999]">
              <div className="flex gap-2">
                {[
                  { color: '#000000', name: 'Preto' },
                  { color: '#FFFFFF', name: 'Branco' },
                  { color: '#FFD700', name: 'Dourado' },
                  { color: '#FF6B6B', name: 'Vermelho' },
                  { color: '#4ECDC4', name: 'Azul' },
                ].map(({ color, name }) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => applyColor('foreColor', color)}
                    className="rounded-lg border border-gray-200 dark:border-gray-500 hover:scale-110 transition-transform shadow-sm flex items-center justify-center"
                    style={{ 
                      backgroundColor: color, 
                      width: '2.5rem', 
                      height: '2.5rem',
                      minWidth: '2.5rem', 
                      minHeight: '2.5rem',
                      flexShrink: 0
                    }}
                    title={name}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {color === '#FFFFFF' && (
                      <div className="w-6 h-6 border-2 border-gray-400 rounded"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Seletor de Cor de Fundo */}
        <div className="relative color-picker-container">
          <button
            type="button"
            onClick={() => {
              setShowBgColorPicker(prev => !prev)
              setShowTextColorPicker(false)
            }}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex items-center gap-1"
            title="Cor de fundo do texto"
            onMouseDown={(e) => e.preventDefault()}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <div className="w-3 h-3 rounded-sm border border-gray-400" style={{ backgroundColor: 'currentColor' }}></div>
          </button>
          {showBgColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-2 z-[9999]">
              <div className="flex gap-2">
                {[
                  { color: '#FFFF00', name: 'Amarelo' },
                  { color: '#FFE4B5', name: 'Bege' },
                  { color: '#E0FFFF', name: 'Azul Claro' },
                  { color: '#F0E68C', name: 'Amarelo Claro' },
                  { color: '#FFB6C1', name: 'Rosa' },
                ].map(({ color, name }) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => applyColor('backColor', color)}
                    className="rounded-lg border border-gray-200 dark:border-gray-500 hover:scale-110 transition-transform shadow-sm"
                    style={{ 
                      backgroundColor: color, 
                      width: '2.5rem', 
                      height: '2.5rem',
                      minWidth: '2.5rem', 
                      minHeight: '2.5rem',
                      flexShrink: 0
                    }}
                    title={name}
                    onMouseDown={(e) => e.preventDefault()}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h2>')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors text-xs font-semibold"
          title="Título"
          onMouseDown={(e) => e.preventDefault()}
        >
          T
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyLeft')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Alinhar à esquerda"
          onMouseDown={(e) => e.preventDefault()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyCenter')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Centralizar"
          onMouseDown={(e) => e.preventDefault()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyRight')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Alinhar à direita"
          onMouseDown={(e) => e.preventDefault()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button
          type="button"
          onClick={() => insertText('\n')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors text-xs"
          title="Quebra de linha"
          onMouseDown={(e) => e.preventDefault()}
        >
          ↵
        </button>
        <button
          type="button"
          onClick={() => {
            if (editorRef.current) {
              editorRef.current.innerHTML = ''
              onChange('')
            }
          }}
          className="p-2 hover:bg-red-200 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors text-xs"
          title="Limpar"
          onMouseDown={(e) => e.preventDefault()}
        >
          ✕
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPaste={(e) => {
          e.preventDefault()
          const text = e.clipboardData.getData('text/plain')
          const selection = window.getSelection()
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            range.deleteContents()
            // Preserva quebras de linha do texto colado
            const lines = text.split('\n')
            lines.forEach((line, index) => {
              if (index > 0) {
                const br = document.createElement('br')
                range.insertNode(br)
                range.setStartAfter(br)
              }
              if (line) {
                const textNode = document.createTextNode(line)
                range.insertNode(textNode)
                range.setStartAfter(textNode)
              }
            })
            selection.removeAllRanges()
            selection.addRange(range)
            handleInput()
          }
        }}
        className={`w-full px-4 py-3 border-2 rounded-b-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary ${
          isFocused ? 'border-primary' : 'border-gray-300 dark:border-gray-600'
        }`}
        style={{
          minHeight: `${rows * 1.5}rem`,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] {
          outline: none;
          white-space: pre-wrap !important;
        }
        [contenteditable] strong {
          font-weight: bold;
        }
        [contenteditable] em {
          font-style: italic;
        }
        [contenteditable] u {
          text-decoration: underline;
        }
        [contenteditable] h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0.5rem 0;
        }
        [contenteditable] br {
          display: block;
          content: "";
          margin: 0;
        }
        [contenteditable] p {
          margin: 0.5em 0;
          white-space: pre-wrap;
        }
        [contenteditable] div {
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  )
}
