'use client'

// Componente inline para visualização de cifra com controles de acessibilidade
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Função auxiliar para transpor uma nota
function transposeNote(note: string, semitones: number): string {
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
  
  function findNoteIndex(note: string): number {
    const cleanNote = note.replace(/[^A-G#b]/gi, '').toUpperCase()
    let index = NOTES.findIndex(n => n === cleanNote)
    if (index !== -1) return index
    index = NOTES_FLAT.findIndex(n => n === cleanNote)
    if (index !== -1) return index
    return -1
  }
  
  const noteIndex = findNoteIndex(note)
  if (noteIndex === -1) return note
  
  const newIndex = (noteIndex + semitones + 12) % 12
  const transposedNote = NOTES[newIndex]
  const suffix = note.replace(/[A-G#b]/gi, '')
  return transposedNote + suffix
}

interface Cifra {
  id: string
  texto: string
  titulo?: string | null
}

interface Musica {
  id: string
  titulo: string
  cifras: Cifra[]
}

interface CifraViewerInlineProps {
  musica: Musica
}

const SEMITONES_RANGE = Array.from({ length: 25 }, (_, i) => i - 12) // -12 to +12
const SEMITONE_LABELS: Record<number, string> = {
  0: 'Original',
  1: '+1 (C#)',
  2: '+2 (D)',
  3: '+3 (D#)',
  4: '+4 (E)',
  5: '+5 (F)',
  6: '+6 (F#)',
  7: '+7 (G)',
  8: '+8 (G#)',
  9: '+9 (A)',
  10: '+10 (A#)',
  11: '+11 (B)',
  12: '+12 (C)',
  '-1': '-1 (B)',
  '-2': '-2 (Bb)',
  '-3': '-3 (A)',
  '-4': '-4 (Ab)',
  '-5': '-5 (G)',
  '-6': '-6 (Gb)',
  '-7': '-7 (F)',
  '-8': '-8 (E)',
  '-9': '-9 (Eb)',
  '-10': '-10 (D)',
  '-11': '-11 (Db)',
  '-12': '-12 (C)',
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
  { label: 'Laranja (Padrão)', value: '#F97316' },
  { label: 'Preto/Branco', value: 'default' },
  { label: 'Azul', value: '#3B82F6' },
  { label: 'Verde', value: '#10B981' },
  { label: 'Vermelho', value: '#EF4444' },
  { label: 'Roxo', value: '#8B5CF6' },
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

export default function CifraViewerInline({ musica }: CifraViewerInlineProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [semitones, setSemitones] = useState(0)
  const [fontSize, setFontSize] = useState(16)
  const [textColor, setTextColor] = useState('#F97316')
  const [isBold, setIsBold] = useState(false)
  const [fontFamily, setFontFamily] = useState('inherit')
  const [isAccordionOpen, setIsAccordionOpen] = useState(false)
  const [user, setUser] = useState<{ lider?: boolean } | null>(null)
  const [editingCifra, setEditingCifra] = useState<Cifra | null>(null)
  const [showAddCifra, setShowAddCifra] = useState(false)
  const [cifras, setCifras] = useState(musica.cifras)

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

  // Atualiza cifras quando a prop muda
  useEffect(() => {
    setCifras(musica.cifras)
  }, [musica.cifras])

  const handleDeleteCifra = async (cifraId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta cifra?')) return

    try {
      const response = await fetch(`/api/cifras/${cifraId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const novasCifras = cifras.filter(c => c.id !== cifraId)
        setCifras(novasCifras)
        if (selectedIndex >= novasCifras.length && novasCifras.length > 0) {
          setSelectedIndex(novasCifras.length - 1)
        } else if (novasCifras.length === 0) {
          setSelectedIndex(0)
        }
        alert('Cifra deletada com sucesso!')
        // Recarrega a página para atualizar os dados
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Erro ao deletar cifra: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao deletar cifra:', error)
      alert('Erro ao deletar cifra')
    }
  }

  const handleSaveCifra = async (texto: string, titulo?: string) => {
    try {
      if (editingCifra) {
        // Editar cifra existente
        const response = await fetch(`/api/cifras/${editingCifra.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto, titulo: titulo || null }),
        })

        if (response.ok) {
          const data = await response.json()
          const novasCifras = cifras.map(c => c.id === editingCifra.id ? data : c)
          setCifras(novasCifras)
          setEditingCifra(null)
          alert('Cifra atualizada com sucesso!')
          window.location.reload()
        } else {
          const error = await response.json()
          alert(`Erro ao atualizar cifra: ${error.error}`)
        }
      } else {
        // Adicionar nova cifra
        const response = await fetch('/api/cifras', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ musica_id: musica.id, texto, titulo: titulo || null }),
        })

        if (response.ok) {
          const data = await response.json()
          setCifras([...cifras, data])
          setShowAddCifra(false)
          setSelectedIndex(cifras.length)
          alert('Cifra adicionada com sucesso!')
          window.location.reload()
        } else {
          const error = await response.json()
          alert(`Erro ao adicionar cifra: ${error.error}`)
        }
      }
    } catch (error) {
      console.error('Erro ao salvar cifra:', error)
      alert('Erro ao salvar cifra')
    }
  }

  if (!cifras || cifras.length === 0) {
    return (
      <div className="space-y-4">
        {isAdmin && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setShowAddCifra(true)}
              className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Primeira Cifra
            </button>
          </div>
        )}
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Cifra não encontrada.
        </div>
        {showAddCifra && (
          <CifraEditorModal
            cifra={null}
            onSave={handleSaveCifra}
            onClose={() => setShowAddCifra(false)}
          />
        )}
      </div>
    )
  }

  const cifra = cifras[selectedIndex]

  // Função para transpor apenas acordes reais (não letras dentro de palavras)
  const transposeOnlyChords = (text: string, semitones: number): string => {
    if (semitones === 0) return text
    
    const lines = text.split('\n')
    const transposedLines = lines.map(line => {
      // Regex para encontrar possíveis acordes
      const chordPattern = /[A-G][#b]?(?:m|dim|aug|sus|add|maj|min|M)?(?:\d+)?(?:\/[A-G][#b]?)?/g
      
      let result = line
      let match
      
      // Analisa a linha para determinar se é uma linha de acordes
      const lowercaseCount = (line.match(/[a-z]/g) || []).length
      const uppercaseCount = (line.match(/[A-G]/g) || []).length
      const spaceCount = (line.match(/\s/g) || []).length
      const isLikelyChordLine = uppercaseCount > lowercaseCount && spaceCount > 0
      
      // Coleta todos os matches primeiro (em ordem reversa para não afetar índices)
      const matches: Array<{ index: number; chord: string }> = []
      
      while ((match = chordPattern.exec(line)) !== null) {
        const possibleChord = match[0]
        const matchIndex = match.index
        
        const charBefore = matchIndex > 0 ? line[matchIndex - 1] : ''
        const charAfter = matchIndex + possibleChord.length < line.length 
          ? line[matchIndex + possibleChord.length] 
          : ''
        
        const isStartOfLine = matchIndex === 0
        const isAfterWhitespace = /[\s\t\[\(]/.test(charBefore)
        const isBeforeWhitespace = /[\s\n\r\t\]\)]/.test(charAfter) || matchIndex + possibleChord.length === line.length
        const isBeforeSlash = charAfter === '/'
        
        const hasLowercaseBefore = matchIndex > 0 && /[a-z]/.test(charBefore)
        const hasLowercaseAfter = /[a-z]/.test(charAfter) && !isBeforeWhitespace && !isBeforeSlash
        
        const contextBefore = line.substring(Math.max(0, matchIndex - 2), matchIndex)
        const contextAfter = line.substring(matchIndex + possibleChord.length, Math.min(line.length, matchIndex + possibleChord.length + 3))
        const hasWordContext = /[a-z]{2,}/.test(contextBefore + contextAfter)
        
        const isInWord = hasLowercaseBefore && hasLowercaseAfter && !isBeforeWhitespace
        
        const isIsolatedChord = !isInWord &&
                                !hasWordContext &&
                                (isStartOfLine || isAfterWhitespace) && 
                                (isBeforeWhitespace || isBeforeSlash) && 
                                !hasLowercaseBefore && 
                                !hasLowercaseAfter
        
        if (isLikelyChordLine || isIsolatedChord) {
          matches.push({ index: matchIndex, chord: possibleChord })
        }
      }
      
      // Aplica transposição em ordem reversa para não afetar índices
      matches.reverse().forEach(({ index, chord }) => {
        let transposedChord = chord
        if (chord.includes('/')) {
          const [chordPart, bassPart] = chord.split('/')
          transposedChord = `${transposeNote(chordPart, semitones)}/${transposeNote(bassPart, semitones)}`
        } else {
          transposedChord = transposeNote(chord, semitones)
        }
        result = result.substring(0, index) + transposedChord + result.substring(index + chord.length)
      })
      
      return result
    })
    
    return transposedLines.join('\n')
  }

  const transposedCifra = transposeOnlyChords(cifra.texto, semitones)

  // Função para renderizar o texto da cifra com cor apenas nos acordes
  const renderCifraWithColoredChords = (text: string): string | (string | JSX.Element)[] => {
    if (textColor === 'default') {
      return text
    }

    // Processa linha por linha para melhor identificação
    const lines = text.split('\n')
    const processedLines: (string | JSX.Element)[] = []

    lines.forEach((line, lineIndex) => {
      // Regex para encontrar possíveis acordes
      const chordPattern = /[A-G][#b]?(?:m|dim|aug|sus|add|maj|min|M)?(?:\d+)?(?:\/[A-G][#b]?)?/g
      
      const parts: (string | JSX.Element)[] = []
      let lastIndex = 0
      let match

      // Analisa a linha para determinar se é uma linha de acordes ou de letras
      const lowercaseCount = (line.match(/[a-z]/g) || []).length
      const uppercaseCount = (line.match(/[A-G]/g) || []).length
      const spaceCount = (line.match(/\s/g) || []).length
      const isLikelyChordLine = uppercaseCount > lowercaseCount && spaceCount > 0

      while ((match = chordPattern.exec(line)) !== null) {
        const possibleChord = match[0]
        const matchIndex = match.index
        
        // Verifica contexto: é um acorde se está isolado (não parte de palavra)
        const charBefore = matchIndex > 0 ? line[matchIndex - 1] : ''
        const charAfter = matchIndex + possibleChord.length < line.length 
          ? line[matchIndex + possibleChord.length] 
          : ''
        
        const isStartOfLine = matchIndex === 0
        const isAfterWhitespace = /[\s\t\[\(]/.test(charBefore)
        const isBeforeWhitespace = /[\s\n\r\t\]\)]/.test(charAfter) || matchIndex + possibleChord.length === line.length
        const isBeforeSlash = charAfter === '/'
        
        const hasLowercaseBefore = matchIndex > 0 && /[a-z]/.test(charBefore)
        const hasLowercaseAfter = /[a-z]/.test(charAfter) && !isBeforeWhitespace && !isBeforeSlash
        
        const contextBefore = line.substring(Math.max(0, matchIndex - 2), matchIndex)
        const contextAfter = line.substring(matchIndex + possibleChord.length, Math.min(line.length, matchIndex + possibleChord.length + 3))
        const hasWordContext = /[a-z]{2,}/.test(contextBefore + contextAfter)
        
        const isInWord = hasLowercaseBefore && hasLowercaseAfter && !isBeforeWhitespace
        
        const isIsolatedChord = !isInWord &&
                                !hasWordContext &&
                                (isStartOfLine || isAfterWhitespace) && 
                                (isBeforeWhitespace || isBeforeSlash) && 
                                !hasLowercaseBefore && 
                                !hasLowercaseAfter
        
        if (isLikelyChordLine || isIsolatedChord) {
          // Adiciona o texto antes do acorde
          if (matchIndex > lastIndex) {
            parts.push(line.substring(lastIndex, matchIndex))
          }
          
          // Adiciona o acorde com a cor
          parts.push(
            <span key={`${lineIndex}-${matchIndex}`} style={{ color: textColor }}>
              {possibleChord}
            </span>
          )
          
          lastIndex = matchIndex + possibleChord.length
        }
      }

      // Adiciona o restante da linha
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex))
      }

      // Adiciona a linha processada
      processedLines.push(...parts)
      
      // Adiciona quebra de linha (exceto na última linha)
      if (lineIndex < lines.length - 1) {
        processedLines.push('\n')
      }
    })

    return processedLines.length > 0 ? processedLines : text
  }

  return (
    <div className="space-y-6">
      {/* Painel de Gerenciamento (Admin) */}
      {isAdmin && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Gerenciar Cifras ({cifras.length})
            </span>
            <button
              onClick={() => setShowAddCifra(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {cifras.map((c, index) => (
              <div key={c.id} className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {c.titulo || `Versão ${index + 1}`}
                </span>
                <button
                  onClick={() => setEditingCifra(c)}
                  className="text-blue-500 hover:text-blue-600 p-1.5 rounded transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="Editar cifra"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteCifra(c.id)}
                  className="text-red-500 hover:text-red-600 p-1.5 rounded transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Deletar cifra"
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

      {/* Seletor de Versão */}
      {cifras.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Versão:
          </label>
          <select
            value={selectedIndex}
            onChange={(e) => {
              setSelectedIndex(Number(e.target.value))
              setSemitones(0)
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {cifras.map((cifra: Cifra, index: number) => (
              <option key={cifra.id} value={index}>
                {cifra.titulo || `Versão ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Controles de Transposição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Transposição:
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSemitones(prev => Math.max(-12, prev - 1))}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            aria-label="Diminuir tom"
          >
            -1
          </button>
          <select
            value={semitones}
            onChange={(e) => setSemitones(Number(e.target.value))}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {SEMITONES_RANGE.map(semitone => (
              <option key={semitone} value={semitone}>
                {SEMITONE_LABELS[semitone] || `${semitone > 0 ? '+' : ''}${semitone}`}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSemitones(prev => Math.min(12, prev + 1))}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            aria-label="Aumentar tom"
          >
            +1
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          A transposição é apenas visual e será perdida ao recarregar a página.
        </p>
      </div>

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
            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${
              isAccordionOpen ? 'transform rotate-180' : ''
            } md:hidden`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
              {/* Tamanho da Fonte */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tamanho da Fonte:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
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
                        {size.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                    aria-label="Aumentar fonte"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Cor da Cifra */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cor da Cifra:
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

              {/* Família da Fonte */}
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

      {/* Cifra */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {(cifras.length > 1 || cifra.titulo) && (
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {cifra.titulo || `Versão ${selectedIndex + 1}`}
          </h2>
        )}
        <div
          className="cifra-text whitespace-pre-wrap text-gray-900 dark:text-white"
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: isBold ? 'bold' : 'normal',
            fontFamily: fontFamily,
            lineHeight: '1.6',
          }}
        >
          {renderCifraWithColoredChords(transposedCifra)}
        </div>
      </div>

      {/* Modal de Editar/Adicionar Cifra */}
      {(editingCifra || showAddCifra) && (
        <CifraEditorModal
          cifra={editingCifra}
          onSave={handleSaveCifra}
          onClose={() => {
            setEditingCifra(null)
            setShowAddCifra(false)
          }}
        />
      )}
    </div>
  )
}

// Modal para editar/adicionar cifra
function CifraEditorModal({
  cifra,
  onSave,
  onClose,
}: {
  cifra: Cifra | null
  onSave: (texto: string, titulo?: string) => void
  onClose: () => void
}) {
  const [texto, setTexto] = useState(cifra?.texto || '')
  const [titulo, setTitulo] = useState(cifra?.titulo || '')

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
              {cifra ? 'Editar Cifra' : 'Adicionar Cifra'}
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
                Título (opcional):
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Cifra para Baixo, Cifra para Violão"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Texto da Cifra:
              </label>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={15}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                placeholder="Cole ou digite a cifra aqui..."
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
                    onSave(texto, titulo || undefined)
                  } else {
                    alert('Por favor, preencha o texto da cifra')
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

