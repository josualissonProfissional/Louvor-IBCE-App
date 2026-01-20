'use client'

// Componente de Chat Inteligente com Sistema de Agentes
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import MusicaModal from './MusicaModal'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  musicas?: Array<{
    id: string
    titulo: string
    temLetras: boolean
    temCifras: boolean
  }>
  agent?: string
  queryType?: string
}

interface ChatResponse {
  success: boolean
  response: string
  model?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  agent?: string
  queryType?: string
  musicas?: Array<{
    id: string
    titulo: string
    temLetras: boolean
    temCifras: boolean
  }>
  isConfigured?: boolean
  error?: string
}

export default function ChatTeologico() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `## 👋 Olá! Sou seu assistente inteligente do Ministério de Louvor IBCE!

Posso ajudá-lo com:
- 📖 Análise teológica reformada de músicas
- 🎵 Buscar músicas, cifras, letras e links
- 📅 Consultar escalas e disponibilidade
- 👥 Informações sobre membros e instrumentos
- 🔀 Consultas combinadas

💡 **Dicas:**
- Use \`@nome da música\` para mencionar músicas específicas (ex: "Qual a base teológica da música @pao da vida")
- Use \`/teologia\` para forçar análise teológica direta na IA (ex: "/teologia por que a música @benedictus tem tal coisa na letra?")

**Como posso ajudá-lo hoje?**`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<{ isConfigured: boolean; message: string; agents?: string[] } | null>(null)
  const [selectedMusic, setSelectedMusic] = useState<any>(null)
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  // Estados para autocomplete de músicas
  const [musicSuggestions, setMusicSuggestions] = useState<Array<{ id: string; titulo: string }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [mentionStart, setMentionStart] = useState<number | null>(null)
  const [mentionedMusics, setMentionedMusics] = useState<Set<string>>(new Set()) // Músicas mencionadas válidas
  const suggestionsRef = useRef<HTMLDivElement>(null)
  
  // Estados para autocomplete de comandos
  const [commandSuggestions, setCommandSuggestions] = useState<Array<{ command: string; description: string }>>([])
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(-1)
  const [commandStart, setCommandStart] = useState<number | null>(null)
  const commandSuggestionsRef = useRef<HTMLDivElement>(null)
  
  // Lista de comandos disponíveis
  const availableCommands = [
    { command: 'teologia', description: 'Força análise teológica direta na IA' }
  ]

  // Scroll automático para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Verifica status da API ao carregar
  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch('/api/ia/chat')
        const data = await response.json()
        setApiStatus({
          isConfigured: data.isConfigured,
          message: data.message
        })
      } catch (error) {
        console.error('Erro ao verificar status da API:', error)
      }
    }
    checkStatus()
  }, [])

  // Busca músicas para autocomplete
  const fetchMusicSuggestions = async (query: string = '') => {
    try {
      const url = `/api/musicas/autocomplete${query ? `?q=${encodeURIComponent(query)}` : ''}`
      const response = await fetch(url)
      const data = await response.json()
      setMusicSuggestions(data.musicas || [])
      setShowSuggestions(true)
      setSelectedSuggestionIndex(-1)
    } catch (error) {
      console.error('Erro ao buscar sugestões de músicas:', error)
      setMusicSuggestions([])
    }
  }

  // Detecta comando / e mostra sugestões
  useEffect(() => {
    const lastSlashIndex = input.lastIndexOf('/')
    
    if (lastSlashIndex !== -1) {
      // Verifica se há espaço após o / (se sim, não é um comando ativo)
      const afterSlash = input.substring(lastSlashIndex + 1)
      const hasSpace = afterSlash.includes(' ')
      
      if (!hasSpace) {
        setCommandStart(lastSlashIndex)
        const query = afterSlash.trim().toLowerCase()
        
        // Filtra comandos baseado no que está sendo digitado
        const filtered = availableCommands.filter(cmd => 
          cmd.command.toLowerCase().startsWith(query)
        )
        
        setCommandSuggestions(filtered)
        setShowCommandSuggestions(filtered.length > 0)
        setSelectedCommandIndex(-1)
      } else {
        setShowCommandSuggestions(false)
        setCommandStart(null)
      }
    } else {
      setShowCommandSuggestions(false)
      setCommandStart(null)
    }
  }, [input])

  // Detecta menção @ e busca sugestões (com debounce)
  useEffect(() => {
    // Só processa menções se não houver comando ativo
    if (commandStart !== null) {
      setShowSuggestions(false)
      setMentionStart(null)
      return
    }
    
    const lastAtIndex = input.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const afterAt = input.substring(lastAtIndex + 1)
      // Remove pontuação no final para verificar
      const afterAtClean = afterAt.replace(/[?!.,;:]+$/, '')
      
      // Continua mostrando sugestões mesmo com espaço
      // Fecha apenas se houver outro @ ou se houver muito texto após o espaço
      const spaceIndex = afterAtClean.indexOf(' ')
      
      if (spaceIndex === -1) {
        // Não há espaço - busca normal
        setMentionStart(lastAtIndex)
        const query = afterAtClean.trim()
        
        if (query.length === 0) {
          fetchMusicSuggestions('')
        } else {
          const timeoutId = setTimeout(() => {
            fetchMusicSuggestions(query)
          }, 300)
          return () => clearTimeout(timeoutId)
        }
      } else {
        // Há espaço - continua mostrando sugestões
        setMentionStart(lastAtIndex)
        const query = afterAtClean.substring(0, spaceIndex).trim()
        const textAfterSpace = afterAtClean.substring(spaceIndex + 1).trim()
        
        // Se há outro @ após o espaço, fecha as sugestões
        if (textAfterSpace.includes('@')) {
          setShowSuggestions(false)
          setMentionStart(null)
          return
        }
        
        // Se há muito texto após o espaço (mais de 5 caracteres), considera que terminou a menção
        if (textAfterSpace.length > 5) {
          setShowSuggestions(false)
          setMentionStart(null)
          return
        }
        
        // Continua mostrando sugestões baseado no texto antes do espaço
        if (query.length === 0) {
          fetchMusicSuggestions('')
        } else {
          const timeoutId = setTimeout(() => {
            fetchMusicSuggestions(query)
          }, 300)
          return () => clearTimeout(timeoutId)
        }
      }
    } else {
      setShowSuggestions(false)
      setMentionStart(null)
    }
  }, [input, commandStart])
  
  // Verifica músicas mencionadas e valida se existem no banco
  useEffect(() => {
    const mentions = extractMentions(input)
    if (mentions.length > 0) {
      // Verifica quais músicas mencionadas são válidas (foram selecionadas do autocomplete)
      // Se não foram selecionadas, tenta validar buscando no banco
      mentions.forEach(async (mention) => {
        if (!mention.isValid) {
          const cleanMention = mention.text.replace(/^@/, '').replace(/[?!.,;:]+$/, '').trim()
          
          if (cleanMention.length < 2) return
          
          // Se não está no set, pode ser que foi digitada manualmente
          // Vamos buscar para validar
          try {
            const response = await fetch(`/api/musicas/autocomplete?q=${encodeURIComponent(cleanMention)}`)
            const data = await response.json()
            if (data.musicas && data.musicas.length > 0) {
              // Verifica se alguma música corresponde (match exato ou muito próximo)
              const found = data.musicas.find((m: any) => {
                const musicTitle = normalizeForSearch(m.titulo)
                const searchTitle = normalizeForSearch(cleanMention)
                return musicTitle === searchTitle || 
                       musicTitle.startsWith(searchTitle) ||
                       searchTitle.split(/\s+/).every(word => musicTitle.includes(word))
              })
              
              if (found) {
                setMentionedMusics(prev => new Set([...prev, cleanMention]))
              }
            }
          } catch (error) {
            // Ignora erros
          }
        }
      })
    }
  }, [input])

  // Função auxiliar para normalizar (mesma do backend)
  const normalizeForSearch = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Envia mensagem
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Prepara histórico de conversa (últimas 10 mensagens, excluindo a mensagem inicial de boas-vindas)
      // Filtra apenas mensagens reais de user/assistant (não a mensagem inicial de sistema)
      const relevantMessages = messages.filter((m, index) => {
        // Pula a primeira mensagem se for a mensagem de boas-vindas
        if (index === 0 && m.content.includes('Como posso ajudá-lo hoje?')) {
          return false
        }
        return m.role === 'user' || m.role === 'assistant'
      })
      
      const conversationHistory = relevantMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }))

      const response = await fetch('/api/ia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          conversationHistory
        })
      })

      const data: ChatResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar mensagem')
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        musicas: data.musicas,
        agent: data.agent,
        queryType: data.queryType
      }

      setMessages(prev => [...prev, assistantMessage])

      // Se a resposta contém músicas, marca como válidas
      if (data.musicas && data.musicas.length > 0) {
        const mentions = extractMentions(input)
        mentions.forEach(mention => {
          const cleanMention = mention.text.replace(/^@/, '').replace(/[?!.,;:]+$/, '').trim()
          // Verifica se alguma música retornada corresponde à menção
          const found = data.musicas.some((m: any) => {
            const musicTitle = normalizeForSearch(m.titulo)
            const searchTitle = normalizeForSearch(cleanMention)
            return musicTitle === searchTitle || 
                   musicTitle.startsWith(searchTitle) ||
                   searchTitle.split(/\s+/).every(word => musicTitle.includes(word))
          })
          
          if (found) {
            setMentionedMusics(prev => new Set([...prev, cleanMention]))
          }
        })
      }

      // Atualiza status se necessário
      if (data.isConfigured !== undefined && apiStatus) {
        setApiStatus(prev => prev ? { 
          ...prev, 
          isConfigured: data.isConfigured!, 
          agents: data.agents 
        } : null)
      }

    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error)
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ **Erro ao processar sua mensagem:**\n\n${error.message}\n\nPor favor, tente novamente.`,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  // Abre modal de música
  const handleOpenMusic = async (musicId: string) => {
    try {
      const response = await fetch(`/api/musicas/${musicId}`)
      if (response.ok) {
        const musicData = await response.json()
        setSelectedMusic({
          id: musicData.id,
          titulo: musicData.titulo,
          link_youtube: musicData.link_youtube,
          temLetras: musicData.letras && musicData.letras.length > 0,
          temCifras: musicData.cifras && musicData.cifras.length > 0
        })
        setIsMusicModalOpen(true)
      }
    } catch (error) {
      console.error('Erro ao carregar música:', error)
    }
  }

  // Limpa conversa
  const handleClear = () => {
    if (confirm('Deseja limpar toda a conversa?')) {
      setMessages([
        {
          role: 'assistant',
          content: `## 👋 Conversa reiniciada!\n\n**Como posso ajudá-lo agora?**`,
          timestamp: new Date()
        }
      ])
    }
  }

  // Insere comando selecionado no input
  const insertCommand = (command: string) => {
    if (commandStart !== null && inputRef.current) {
      const beforeCommand = input.substring(0, commandStart)
      const newInput = `${beforeCommand}/${command} `
      setInput(newInput)
      setShowCommandSuggestions(false)
      setCommandStart(null)
      
      // Ajusta altura do textarea e overlay
      setTimeout(() => {
        if (inputRef.current) {
          const textarea = inputRef.current
          textarea.style.height = 'auto'
          const newHeight = Math.min(textarea.scrollHeight, 120)
          textarea.style.height = `${newHeight}px`
          
          // Ajusta overlay também
          const overlay = textarea.parentElement?.querySelector('.overlay-highlight') as HTMLElement
          if (overlay) {
            overlay.style.height = `${newHeight}px`
          }
          
          // Posiciona cursor no final
          textarea.focus()
          const newLength = newInput.length
          textarea.setSelectionRange(newLength, newLength)
        }
      }, 0)
    }
  }

  // Insere música selecionada no input
  const insertMusicMention = (musicTitle: string) => {
    if (mentionStart !== null && inputRef.current) {
      const beforeMention = input.substring(0, mentionStart)
      const newInput = `${beforeMention}@${musicTitle} `
      setInput(newInput)
      setShowSuggestions(false)
      setMentionStart(null)
      
      // Adiciona à lista de músicas mencionadas válidas
      setMentionedMusics(prev => new Set([...prev, musicTitle]))
      
      // Ajusta altura do textarea e overlay
      setTimeout(() => {
        if (inputRef.current) {
          const textarea = inputRef.current
          textarea.style.height = 'auto'
          const newHeight = Math.min(textarea.scrollHeight, 120)
          textarea.style.height = `${newHeight}px`
          
          // Ajusta overlay também
          const overlay = textarea.parentElement?.querySelector('.overlay-highlight') as HTMLElement
          if (overlay) {
            overlay.style.height = `${newHeight}px`
          }
          
          // Posiciona cursor no final
          textarea.focus()
          const newLength = newInput.length
          textarea.setSelectionRange(newLength, newLength)
        }
      }, 0)
    }
  }

  // Verifica se uma menção é válida (foi selecionada do autocomplete)
  const isMentionValid = (mentionText: string): boolean => {
    // Remove @ e pontuação
    const cleanMention = mentionText.replace(/^@/, '').replace(/[?!.,;:]+$/, '').trim()
    return mentionedMusics.has(cleanMention)
  }

  // Extrai todas as menções do texto
  const extractMentions = (text: string): Array<{ start: number; end: number; text: string; isValid: boolean }> => {
    const mentions: Array<{ start: number; end: number; text: string; isValid: boolean }> = []
    const regex = /@([^\s@?!.]+(?:\s+[^\s@?!.]+)*)/gi
    let match
    
    while ((match = regex.exec(text)) !== null) {
      const mentionText = match[1]
      const cleanMention = mentionText.replace(/[?!.,;:]+$/, '').trim()
      mentions.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        isValid: mentionedMusics.has(cleanMention)
      })
    }
    
    return mentions
  }

  // Extrai todos os comandos do texto
  const extractCommands = (text: string): Array<{ start: number; end: number; text: string; command: string }> => {
    const commands: Array<{ start: number; end: number; text: string; command: string }> = []
    const regex = /\/(\w+)(?:\s|$)/gi
    let match
    
    while ((match = regex.exec(text)) !== null) {
      const commandName = match[1].toLowerCase()
      // Verifica se é um comando válido
      const isValidCommand = availableCommands.some(cmd => cmd.command.toLowerCase() === commandName)
      
      if (isValidCommand) {
        commands.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          command: commandName
        })
      }
    }
    
    return commands
  }

  // Ajusta altura do textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const textarea = e.target
    textarea.style.height = 'auto'
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 50), 120)
    textarea.style.height = `${newHeight}px`
    
    // Ajusta o overlay também se existir
    const overlay = textarea.parentElement?.querySelector('.overlay-highlight') as HTMLElement
    if (overlay) {
      overlay.style.height = `${newHeight}px`
      overlay.style.minHeight = `${newHeight}px`
    }
  }

  // Tecla Enter para enviar (Shift+Enter para nova linha)
  // Setas para navegar sugestões, Enter para selecionar
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Se há sugestões de comandos visíveis, trata navegação
    if (showCommandSuggestions && commandSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedCommandIndex(prev => 
          prev < commandSuggestions.length - 1 ? prev + 1 : prev
        )
        return
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedCommandIndex(prev => prev > 0 ? prev - 1 : -1)
        return
      }
      
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (selectedCommandIndex >= 0 && selectedCommandIndex < commandSuggestions.length) {
          insertCommand(commandSuggestions[selectedCommandIndex].command)
        } else if (commandSuggestions.length > 0) {
          // Se nenhuma está selecionada, seleciona a primeira
          insertCommand(commandSuggestions[0].command)
        }
        return
      }
      
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowCommandSuggestions(false)
        return
      }
    }
    
    // Se há sugestões de músicas visíveis, trata navegação
    if (showSuggestions && musicSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < musicSuggestions.length - 1 ? prev + 1 : prev
        )
        return
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
        return
      }
      
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < musicSuggestions.length) {
          insertMusicMention(musicSuggestions[selectedSuggestionIndex].titulo)
        } else if (musicSuggestions.length > 0) {
          // Se nenhuma está selecionada, seleciona a primeira
          insertMusicMention(musicSuggestions[0].titulo)
        }
        return
      }
      
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowSuggestions(false)
        return
      }
    }
    
    // Enter normal para enviar (se não há sugestões)
    if (e.key === 'Enter' && !e.shiftKey && !showSuggestions && !showCommandSuggestions) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-slide-in-up" style={{ animationDelay: '150ms' }}>
      {/* Status da API */}
      {apiStatus && (
        <div className={`px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 ${
          apiStatus.isConfigured 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-b border-green-200 dark:border-green-800' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-b border-yellow-200 dark:border-yellow-800'
        }`}>
          <span className={`w-2 h-2 rounded-full ${apiStatus.isConfigured ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
          {apiStatus.message}
        </div>
      )}

      {/* Área de mensagens */}
      <div className="h-[60vh] overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] md:max-w-[75%] rounded-xl p-4 shadow-md ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {message.role === 'assistant' ? (
                <>
                  {/* Badge do agente usado */}
                  {message.agent && (
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full font-medium">
                        {message.agent}
                      </span>
                      {message.queryType && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {message.queryType}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => (
                        <h2 className="text-xl font-bold mt-4 mb-2 text-gray-900 dark:text-white border-b border-gray-300 dark:border-gray-600 pb-2">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-200">
                          {children}
                        </h3>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 italic my-3 text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 py-2 rounded-r">
                          {children}
                        </blockquote>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 my-2 space-y-1">
                          {children}
                        </ul>
                      ),
                      li: ({ children }) => (
                        <li className="text-gray-700 dark:text-gray-300">
                          {children}
                        </li>
                      ),
                      p: ({ children }) => (
                        <p className="mb-2 text-gray-800 dark:text-gray-200 leading-relaxed">
                          {children}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-gray-900 dark:text-white">
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className="text-blue-600 dark:text-blue-400">
                          {children}
                        </em>
                      )
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>

                  {/* Botões de músicas */}
                  {message.musicas && message.musicas.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        🎵 Músicas encontradas ({message.musicas.length}):
                      </p>
                      <div className="space-y-2">
                        {message.musicas.map((musica: any) => (
                          <button
                            key={musica.id}
                            onClick={() => handleOpenMusic(musica.id)}
                            className="w-full text-left bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-between group shadow-md hover:shadow-lg"
                          >
                            <div className="flex-1">
                              <div className="font-semibold">{musica.titulo}</div>
                              <div className="text-xs opacity-90 mt-1 flex gap-2">
                                {musica.temLetras && <span>✅ Letra</span>}
                                {musica.temCifras && <span>🎸 Cifra</span>}
                              </div>
                            </div>
                            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
              <div className={`text-[10px] mt-2 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Analisando teologicamente...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Área de input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            {/* Overlay para destacar menções e comandos */}
            {input && (extractMentions(input).length > 0 || extractCommands(input).length > 0) && (
              <div
                className="overlay-highlight absolute pointer-events-none z-10 bg-white dark:bg-gray-700 rounded-lg border border-transparent"
                style={{
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  paddingLeft: '16px',
                  paddingRight: '48px',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  lineHeight: '1.5',
                  minHeight: '50px',
                  maxHeight: '120px',
                  overflow: 'hidden',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  boxSizing: 'border-box',
                  margin: 0,
                  textAlign: 'left'
                }}
              >
                {(() => {
                  const mentions = extractMentions(input)
                  const commands = extractCommands(input)
                  
                  // Se não há highlights, mostra texto normal
                  if (mentions.length === 0 && commands.length === 0) {
                    return (
                      <span className="text-gray-900 dark:text-gray-100">
                        {input}
                      </span>
                    )
                  }
                  
                  // Combina menções e comandos em uma lista ordenada por posição
                  const allHighlights = [
                    ...mentions.map(m => ({ ...m, type: 'mention' as const })),
                    ...commands.map(c => ({ ...c, type: 'command' as const }))
                  ].sort((a, b) => a.start - b.start)
                  
                  let lastIndex = 0
                  const parts: React.ReactNode[] = []
                  
                  allHighlights.forEach((highlight, idx) => {
                    // Texto antes do highlight (cor normal)
                    if (highlight.start > lastIndex) {
                      parts.push(
                        <span key={`text-${idx}`} className="text-gray-900 dark:text-gray-100">
                          {input.substring(lastIndex, highlight.start)}
                        </span>
                      )
                    }
                    
                    // Highlight destacado
                    if (highlight.type === 'mention') {
                      const mention = highlight as typeof mentions[0] & { type: 'mention' }
                      parts.push(
                        <span
                          key={`mention-${idx}`}
                          className={mention.isValid 
                            ? 'text-purple-600 dark:text-purple-400 font-semibold' 
                            : 'text-gray-600 dark:text-gray-300'
                          }
                          style={{
                            backgroundColor: mention.isValid 
                              ? 'rgba(147, 51, 234, 0.15)' 
                              : 'rgba(107, 114, 128, 0.1)',
                            borderRadius: '4px',
                            padding: '1px 2px'
                          }}
                        >
                          {mention.text}
                        </span>
                      )
                    } else {
                      // Comando destacado em verde
                      const command = highlight as typeof commands[0] & { type: 'command' }
                      parts.push(
                        <span
                          key={`command-${idx}`}
                          className="text-green-600 dark:text-green-400 font-semibold"
                          style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.15)',
                            borderRadius: '4px',
                            padding: '1px 2px'
                          }}
                        >
                          {command.text}
                        </span>
                      )
                    }
                    
                    lastIndex = highlight.end
                  })
                  
                  // Texto restante (cor normal)
                  if (lastIndex < input.length) {
                    parts.push(
                      <span key="text-end" className="text-gray-900 dark:text-gray-100">
                        {input.substring(lastIndex)}
                      </span>
                    )
                  }
                  
                  return parts
                })()}
              </div>
            )}
            
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta... Use /teologia para análise teológica ou @nome da música para mencionar músicas (Enter para enviar, Shift+Enter para nova linha)"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[50px] max-h-[120px] relative z-20 scrollbar-hide"
              style={{
                backgroundColor: (extractMentions(input).length > 0 || extractCommands(input).length > 0)
                  ? 'transparent' 
                  : undefined,
                color: (extractMentions(input).length > 0 || extractCommands(input).length > 0)
                  ? 'transparent' 
                  : undefined,
                caretColor: (extractMentions(input).length > 0 || extractCommands(input).length > 0)
                  ? 'rgb(59, 130, 246)' 
                  : 'currentColor',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                lineHeight: '1.5',
                paddingTop: '12px',
                paddingBottom: '12px',
                paddingLeft: '16px',
                paddingRight: '48px',
                boxSizing: 'border-box',
                overflow: 'hidden',
                overflowY: 'auto',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                textAlign: 'left',
                verticalAlign: 'top'
              }}
              disabled={isLoading}
              rows={1}
            />
            <div className="absolute right-3 bottom-3 text-xs text-gray-400 dark:text-gray-500 z-20">
              {input.length}/2000
            </div>
            
            {/* Dropdown de sugestões de comandos */}
            {showCommandSuggestions && commandSuggestions.length > 0 && (
              <div
                ref={commandSuggestionsRef}
                className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50"
              >
                <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  ⚡ Comandos ({commandSuggestions.length})
                </div>
                {commandSuggestions.map((cmd, index) => (
                  <button
                    key={cmd.command}
                    type="button"
                    onClick={() => insertCommand(cmd.command)}
                    ref={(el) => {
                      // Scroll automático para item selecionado
                      if (el && index === selectedCommandIndex) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                      }
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      index === selectedCommandIndex
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                        /{cmd.command}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {cmd.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* Dropdown de sugestões de músicas */}
            {showSuggestions && musicSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50"
              >
                <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  🎵 Músicas ({musicSuggestions.length})
                </div>
                {musicSuggestions.map((musica, index) => (
                  <button
                    key={musica.id}
                    type="button"
                    onClick={() => insertMusicMention(musica.titulo)}
                    ref={(el) => {
                      // Scroll automático para item selecionado
                      if (el && index === selectedSuggestionIndex) {
                        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                      }
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors ${
                      index === selectedSuggestionIndex
                        ? 'bg-blue-100 dark:bg-gray-700 border-l-4 border-blue-500'
                        : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {musica.titulo}
                    </div>
                  </button>
                ))}
                <div className="p-2 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700">
                  💡 Use ↑↓ para navegar, Enter para selecionar, Esc para fechar
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Enviar
            </button>
            
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-all duration-200"
              title="Limpar conversa"
            >
              🗑️
            </button>
          </div>
        </form>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          💡 Dica: Use perguntas específicas para melhores resultados
        </p>
      </div>

      {/* Modal de Música */}
      {selectedMusic && (
        <MusicaModal
          musica={selectedMusic}
          isOpen={isMusicModalOpen}
          onClose={() => {
            setIsMusicModalOpen(false)
            setSelectedMusic(null)
          }}
        />
      )}
    </div>
  )
}
