'use client'

// Página para adicionar nova música
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import RichTextEditor from '@/components/RichTextEditor'

export default function NovaMusicaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    link_youtube: '',
    cifras: [{ titulo: '', texto: '' }],
    letras: [''],
  })
  
  // Estados para drag and drop
  const [dragActiveCifra, setDragActiveCifra] = useState<number | null>(null)
  const [dragActiveLetra, setDragActiveLetra] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/musicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: formData.titulo,
          link_youtube: formData.link_youtube || null,
          cifras: formData.cifras
            .filter(c => c.texto.trim() !== '')
            .map(c => ({
              titulo: c.titulo.trim() || null,
              texto: c.texto,
            })),
          letras: formData.letras.filter(l => l.trim() !== ''),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      router.push('/musicas')
    } catch (error: any) {
      alert('Erro ao criar música: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File, type: 'cifra' | 'letra', index?: number) => {
    if (!file.name.endsWith('.txt')) {
      alert('Por favor, selecione apenas arquivos .txt')
      return
    }
    
    const text = await file.text()
    if (type === 'cifra') {
      if (index !== undefined) {
        const newCifras = [...formData.cifras]
        newCifras[index] = { ...newCifras[index], texto: text }
        setFormData(prev => ({ ...prev, cifras: newCifras }))
      } else {
        setFormData(prev => ({
          ...prev,
          cifras: [...prev.cifras, { titulo: '', texto: text }],
        }))
      }
    } else {
      // Converter quebras de linha para <br> tags para o editor rico
      const htmlText = text.replace(/\n/g, '<br>')
      if (index !== undefined) {
        const newLetras = [...formData.letras]
        newLetras[index] = htmlText
        setFormData(prev => ({ ...prev, letras: newLetras }))
      } else {
        setFormData(prev => ({
          ...prev,
          letras: [...prev.letras, htmlText],
        }))
      }
    }
  }

  // Handlers para drag and drop
  const handleDrag = (e: React.DragEvent, type: 'cifra' | 'letra', index: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (type === 'cifra') {
      setDragActiveCifra(index)
    } else {
      setDragActiveLetra(index)
    }
  }

  const handleDragLeave = (e: React.DragEvent, type: 'cifra' | 'letra') => {
    e.preventDefault()
    e.stopPropagation()
    if (type === 'cifra') {
      setDragActiveCifra(null)
    } else {
      setDragActiveLetra(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, type: 'cifra' | 'letra', index: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (type === 'cifra') {
      setDragActiveCifra(null)
    } else {
      setDragActiveLetra(null)
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0], type, index)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/musicas"
        className="text-primary hover:underline mb-4 inline-block transition-all duration-200 hover:translate-x-1"
      >
        ← Voltar para músicas
      </Link>
      
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white animate-fade-in">
        Nova Música
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Título *
          </label>
          <input
            type="text"
            value={formData.titulo}
            onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
            required
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            placeholder="Digite o título da música"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Link do YouTube
          </label>
          <input
            type="url"
            value={formData.link_youtube}
            onChange={(e) => setFormData(prev => ({ ...prev, link_youtube: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Cifras
          </label>
          {formData.cifras.map((cifra, index) => (
            <div 
              key={index} 
              className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 animate-slide-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Campo de Título da Cifra */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título da Cifra {index + 1} <span className="text-gray-400 text-xs">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={cifra.titulo}
                  onChange={(e) => {
                    const newCifras = [...formData.cifras]
                    newCifras[index] = { ...newCifras[index], titulo: e.target.value }
                    setFormData(prev => ({ ...prev, cifras: newCifras }))
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  placeholder="Ex: Cifra para Baixo, Cifra para Violão..."
                />
              </div>
              
              <div className="flex gap-2 mb-2">
                <div className="flex-1 relative">
                  {/* Área de Drag and Drop */}
                  <div
                    onDragEnter={(e) => handleDrag(e, 'cifra', index)}
                    onDragLeave={(e) => handleDragLeave(e, 'cifra')}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onDrop={(e) => handleDrop(e, 'cifra', index)}
                    className={`relative border-2 border-dashed rounded-lg transition-all duration-300 ${
                      dragActiveCifra === index
                        ? 'border-primary bg-primary/10 scale-105'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
                    }`}
                  >
                    <textarea
                      value={cifra.texto}
                      onChange={(e) => {
                        const newCifras = [...formData.cifras]
                        newCifras[index] = { ...newCifras[index], texto: e.target.value }
                        setFormData(prev => ({ ...prev, cifras: newCifras }))
                      }}
                      rows={12}
                      className="w-full px-4 py-3 border-0 rounded-lg bg-transparent text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Cole a cifra aqui ou arraste e solte um arquivo .txt"
                    />
                    {dragActiveCifra === index && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-lg pointer-events-none">
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto mb-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-primary font-semibold">Solte o arquivo aqui</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {formData.cifras.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        cifras: prev.cifras.filter((_, i) => i !== index),
                      }))
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-all duration-200 self-start"
                    title="Remover cifra"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Escolher arquivo</span>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, 'cifra', index)
                    }}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Apenas arquivos .txt
                </span>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, cifras: [...prev.cifras, { titulo: '', texto: '' }] }))}
            className="text-primary hover:text-primary-light text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/10 transition-all duration-200 inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar outra cifra
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Letras
          </label>
          {formData.letras.map((letra, index) => (
            <div 
              key={index} 
              className="mb-6 animate-slide-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex gap-2 mb-2">
                <div className="flex-1 relative">
                  {/* Área de Drag and Drop */}
                  <div
                    onDragEnter={(e) => handleDrag(e, 'letra', index)}
                    onDragLeave={(e) => handleDragLeave(e, 'letra')}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onDrop={(e) => handleDrop(e, 'letra', index)}
                    className={`relative transition-all duration-300 ${
                      dragActiveLetra === index
                        ? 'scale-105'
                        : ''
                    }`}
                  >
                    <RichTextEditor
                      value={letra}
                      onChange={(value) => {
                        const newLetras = [...formData.letras]
                        newLetras[index] = value
                        setFormData(prev => ({ ...prev, letras: newLetras }))
                      }}
                      rows={12}
                      placeholder="Digite ou cole a letra aqui. Use os botões acima para formatar o texto (negrito, itálico, etc.) ou arraste e solte um arquivo .txt"
                    />
                    {dragActiveLetra === index && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-lg pointer-events-none z-10">
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto mb-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-primary font-semibold">Solte o arquivo aqui</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {formData.letras.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        letras: prev.letras.filter((_, i) => i !== index),
                      }))
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-all duration-200 self-start"
                    title="Remover letra"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Escolher arquivo</span>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, 'letra', index)
                    }}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Apenas arquivos .txt
                </span>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, letras: [...prev.letras, ''] }))}
            className="text-primary hover:text-primary-light text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/10 transition-all duration-200 inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar outra letra
          </button>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-light disabled:opacity-50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-semibold flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Salvar Música
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 font-semibold"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}






