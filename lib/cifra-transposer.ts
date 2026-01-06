// Utilitário para transposição de cifras
// Notas musicais e suas posições
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

/**
 * Encontra o índice de uma nota
 */
function findNoteIndex(note: string): number {
  // Remove modificadores de acorde (m, dim, aug, etc)
  const cleanNote = note.replace(/[^A-G#b]/gi, '').toUpperCase()
  
  // Tenta encontrar na lista de sustenidos
  let index = NOTES.findIndex(n => n === cleanNote)
  if (index !== -1) return index
  
  // Tenta encontrar na lista de bemóis
  index = NOTES_FLAT.findIndex(n => n === cleanNote)
  if (index !== -1) return index
  
  return -1
}

/**
 * Transpõe uma nota por um número de semitons
 */
function transposeNote(note: string, semitones: number): string {
  const noteIndex = findNoteIndex(note)
  if (noteIndex === -1) return note // Retorna original se não encontrar
  
  const newIndex = (noteIndex + semitones + 12) % 12
  const originalFormat = note.includes('#') ? NOTES : NOTES_FLAT
  
  // Preserva o formato original (sustenido ou bemol)
  const transposedNote = originalFormat[newIndex]
  
  // Mantém o resto do acorde (m, dim, etc)
  const suffix = note.replace(/[A-G#b]/gi, '')
  return transposedNote + suffix
}

/**
 * Transpõe uma linha de cifra
 */
function transposeLine(line: string, semitones: number): string {
  // Regex para encontrar acordes (ex: C, Cm, Dm7, F#m, etc)
  const chordRegex = /([A-G][#b]?(?:m|dim|aug|sus|add|maj|min|7|9|11|13)?(?:\/[A-G][#b]?)?)/gi
  
  return line.replace(chordRegex, (match) => {
    // Se o acorde tem uma nota de baixo (ex: C/E)
    if (match.includes('/')) {
      const [chord, bass] = match.split('/')
      return `${transposeNote(chord, semitones)}/${transposeNote(bass, semitones)}`
    }
    return transposeNote(match, semitones)
  })
}

/**
 * Transpõe um texto de cifra completo
 */
export function transposeCifra(text: string, semitones: number): string {
  const lines = text.split('\n')
  return lines.map(line => transposeLine(line, semitones)).join('\n')
}

/**
 * Calcula semitons entre duas notas
 */
export function getSemitonesBetween(note1: string, note2: string): number {
  const index1 = findNoteIndex(note1)
  const index2 = findNoteIndex(note2)
  
  if (index1 === -1 || index2 === -1) return 0
  
  return (index2 - index1 + 12) % 12
}






