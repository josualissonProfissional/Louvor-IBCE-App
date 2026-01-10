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

  // Sincroniza o valor inicial
  useEffect(() => {
    if (editorRef.current) {
      // Só atualiza se o valor mudou externamente (não por input do usuário)
      const currentContent = editorRef.current.innerHTML
      const normalizedValue = value || ''
      const normalizedCurrent = currentContent || ''
      
      // Converte quebras de linha simples para <br>
      const formattedValue = normalizedValue
        .replace(/\n/g, '<br>')
        .replace(/<br><br>/g, '<br>')
      
      if (normalizedCurrent !== formattedValue && normalizedCurrent !== normalizedValue) {
        editorRef.current.innerHTML = formattedValue
      }
    }
  }, [value])

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
        <div className="relative group">
          <button
            type="button"
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Cor do texto"
            onMouseDown={(e) => e.preventDefault()}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </button>
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg p-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div className="grid grid-cols-8 gap-1">
              {[
                '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
                '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0', '#808080',
                '#FFA500', '#FFC0CB', '#A52A2A', '#FFD700', '#4B0082', '#9400D3', '#00008B', '#8B0000',
                '#006400', '#2E8B57', '#4682B4', '#191970', '#8B4513', '#2F4F4F', '#DC143C', '#00CED1',
              ].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    execCommand('foreColor', color)
                  }}
                  className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-125 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                  onMouseDown={(e) => e.preventDefault()}
                />
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
              <input
                type="color"
                onChange={(e) => {
                  execCommand('foreColor', e.target.value)
                }}
                className="w-full h-8 cursor-pointer"
                title="Cor personalizada"
              />
            </div>
          </div>
        </div>
        {/* Seletor de Cor de Fundo */}
        <div className="relative group">
          <button
            type="button"
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Cor de fundo do texto"
            onMouseDown={(e) => e.preventDefault()}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-gray-400 rounded-full border border-white dark:border-gray-800"></div>
          </button>
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg p-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div className="grid grid-cols-8 gap-1">
              {[
                '#FFFF00', '#FFC0CB', '#FFA500', '#90EE90', '#87CEEB', '#DDA0DD', '#F0E68C', '#FFB6C1',
                '#E6E6FA', '#FFF8DC', '#F5DEB3', '#FFE4E1', '#E0FFFF', '#F0FFF0', '#FFF0F5', '#F5F5DC',
                '#FFE4B5', '#DEB887', '#D2B48C', '#BC8F8F', '#A0A0A0', '#808080', '#696969', '#556B2F',
                '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#B8860B', '#DAA520', '#FFD700', '#FFA500',
              ].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    execCommand('backColor', color)
                  }}
                  className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-125 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                  onMouseDown={(e) => e.preventDefault()}
                />
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
              <input
                type="color"
                onChange={(e) => {
                  execCommand('backColor', e.target.value)
                }}
                className="w-full h-8 cursor-pointer"
                title="Cor de fundo personalizada"
              />
            </div>
          </div>
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
      `}</style>
    </div>
  )
}
