'use client'

// Componente inline para visualização de letra com controles de acessibilidade
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Letra {
  id: string
  texto: string
}

interface Musica {
  id: string
  titulo: string
  letras: Letra[]
}

interface LetraViewerInlineProps {
  musica: Musica
  selectedIndex: number
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

export default function LetraViewerInline({ musica, selectedIndex: initialIndex }: LetraViewerInlineProps) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)
  const [fontSize, setFontSize] = useState(16)
  const [textColor, setTextColor] = useState('default')
  const [isBold, setIsBold] = useState(false)
  const [fontFamily, setFontFamily] = useState('inherit')
  const [isAccordionOpen, setIsAccordionOpen] = useState(false)
  const [user, setUser] = useState<{ lider?: boolean } | null>(null)
  const [editingLetra, setEditingLetra] = useState<Letra | null>(null)
  const [showAddLetra, setShowAddLetra] = useState(false)
  const [letras, setLetras] = useState(musica.letras)

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
    loadUser()
  }, [])

  useEffect(() => {
    setSelectedIndex(initialIndex)
  }, [initialIndex])

  // Atualiza letras quando a prop muda
  useEffect(() => {
    setLetras(musica.letras)
  }, [musica.letras])

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

  const handleDeleteLetra = async (letraId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta letra?')) return

    try {
      const response = await fetch(`/api/letras/${letraId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const novasLetras = letras.filter(l => l.id !== letraId)
        setLetras(novasLetras)
        if (selectedIndex >= novasLetras.length && novasLetras.length > 0) {
          setSelectedIndex(novasLetras.length - 1)
        } else if (novasLetras.length === 0) {
          setSelectedIndex(0)
        }
        alert('Letra deletada com sucesso!')
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Erro ao deletar letra: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao deletar letra:', error)
      alert('Erro ao deletar letra')
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
          const data = await response.json()
          const novasLetras = letras.map(l => l.id === editingLetra.id ? data : l)
          setLetras(novasLetras)
          setEditingLetra(null)
          alert('Letra atualizada com sucesso!')
          window.location.reload()
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
          const data = await response.json()
          setLetras([...letras, data])
          setShowAddLetra(false)
          setSelectedIndex(letras.length)
          alert('Letra adicionada com sucesso!')
          window.location.reload()
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

  const letra = letras[selectedIndex]

  if (!letra) {
    return (
      <div className="space-y-4">
        {isAdmin && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setShowAddLetra(true)}
              className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Primeira Letra
            </button>
          </div>
        )}
        <div className="text-center text-gray-500 dark:text-gray-400">Letra não encontrada.</div>
        {showAddLetra && (
          <LetraEditorModal
            letra={null}
            onSave={handleSaveLetra}
            onClose={() => setShowAddLetra(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Painel de Gerenciamento (Admin) */}
      {isAdmin && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Gerenciar Letras ({letras.length})
            </span>
            <button
              onClick={() => setShowAddLetra(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {letras.map((l, index) => (
              <div key={l.id} className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Versão {index + 1}</span>
                <button
                  onClick={() => setEditingLetra(l)}
                  className="text-blue-500 hover:text-blue-600 p-1.5 rounded transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="Editar letra"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteLetra(l.id)}
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
        </div>
      )}

      {letras.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Versão:
          </label>
          <select
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {letras.map((l: Letra, index: number) => (
              <option key={l.id} value={index}>
                Versão {index + 1}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Controles de Acessibilidade (Accordion) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
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
              {/* Font Size */}
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

              {/* Text Color */}
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

              {/* Font Family */}
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

              {/* Bold */}
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

      {/* Lyrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
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

// Modal para editar/adicionar letra
function LetraEditorModal({
  letra,
  onSave,
  onClose,
}: {
  letra: Letra | null
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


