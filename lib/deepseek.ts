// Serviço de IA para análise teológica usando DeepSeek AI (otimizado para economia de tokens)
import axios from 'axios'

export interface MusicaContext {
  id: string
  titulo: string
  letras: string[]
  cifras?: string[]
  link_youtube?: string
}

export interface AIResponse {
  content: string
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

class DeepSeekService {
  private apiKey: string
  private apiUrl: string

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || ''
    this.apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions'
    
    if (!this.apiKey || this.apiKey.trim() === '') {
      console.warn('⚠️ DEEPSEEK_API_KEY não configurada. Respostas fallback serão usadas.')
    }
  }

  /**
   * Prompt sistema otimizado (economia máxima de tokens)
   * @param includeLyrics Se true, inclui instruções para trechos de letras
   * @param isBibleBasedQuery Se true, é busca por músicas com base bíblica
   */
  private getSystemPrompt(includeLyrics: boolean = false, isBibleBasedQuery: boolean = false): string {
    if (isBibleBasedQuery) {
      return `Assistente teológico reformado. Identifique músicas cristãs relacionadas a passagens bíblicas específicas.

Analise TODAS as músicas fornecidas e identifique quais têm relação teológica/bíblica com a passagem mencionada.

Para cada música relacionada, forneça:
- Conexão bíblica clara
- Trechos específicos da letra que demonstram a conexão
- Análise teológica breve

Seja específico e cite trechos exatos das letras.`
    }

    let prompt = `Assistente teológico reformado. Analise músicas cristãs segundo Westminster/Heidelberg.

Formato Markdown:
## 🎶 [Título]`

    if (includeLyrics) {
      prompt += `
### 📝 Trechos da Música
Inclua trechos relevantes da letra da música ao longo da análise, conectando-os com a base bíblica e doutrina.`
    }

    prompt += `
### 📖 Base Bíblica
- [Ref] - Explicação
### 🧾 Doutrina
- **Nome**: [Doutrina]
- **CFW**: [Citação breve]
### 🔍 Análise
**Pontos Fortes**: [Lista]
**Fragilidades**: [Lista]
### 🙏 Aplicação
[Uso litúrgico]

Seja conciso. Max 2 refs bíblicas.`

    if (includeLyrics) {
      prompt += `\n\nIMPORTANTE: Quando analisar uma música específica, sempre inclua trechos da letra conectando-os com a análise teológica.`
    }

    return prompt
  }

  /**
   * Constrói contexto otimizado
   * @param musicas Array de músicas
   * @param fullLyrics Se true, inclui letra completa (para música específica ou busca por base bíblica)
   */
  private buildMusicContext(musicas: MusicaContext[], fullLyrics: boolean = false): string {
    if (musicas.length === 0) {
      return 'Nenhuma música disponível.'
    }

    // Se é música específica, inclui letra completa
    if (fullLyrics && musicas.length === 1) {
      const musica = musicas[0]
      let context = `"${musica.titulo}"\n\n`
      
      if (musica.letras.length > 0) {
        context += `LETRA COMPLETA:\n${musica.letras.join('\n\n---\n\n')}\n`
      } else {
        context += 'Letra não disponível.\n'
      }
      
      return context
    }

    // Se é busca por base bíblica, inclui todas as músicas (sem limite)
    if (fullLyrics && musicas.length > 1) {
      return musicas.map((musica, index) => {
        // Para muitas músicas, trunca letra em 500 caracteres por estrofe para otimizar
        const letraOtimizada = musica.letras.length > 0 
          ? musica.letras.map(estrofe => {
              // Se a estrofe for muito longa, trunca
              return estrofe.length > 500 
                ? estrofe.substring(0, 500) + '...'
                : estrofe
            }).join('\n\n---\n\n')
          : 'Letra não disponível'
        
        return `${index + 1}. "${musica.titulo}"
LETRA:
${letraOtimizada}
---`
      }).join('\n\n')
    }

    // Limita a 5 músicas para economizar tokens (caso padrão)
    const limitedMusicas = musicas.slice(0, 5)

    return limitedMusicas.map((musica, index) => {
      // Trunca letra em 300 caracteres para economizar tokens
      const letraPreview = musica.letras.length > 0 
        ? musica.letras[0].substring(0, 300) + (musica.letras[0].length > 300 ? '...' : '')
        : 'Letra não disponível'
      
      return `${index + 1}. "${musica.titulo}"
${letraPreview}
---`
    }).join('\n')
  }

  /**
   * Filtra histórico (mantém apenas últimas 4 mensagens para economizar)
   */
  private formatConversationHistory(history: Array<{ role: string; content: string }>): Array<{ role: string; content: string }> {
    const filtered: Array<{ role: string; content: string }> = []
    let lastRole: string | null = null

    for (const message of history) {
      if (message.role === 'system') continue
      
      if (message.role !== lastRole) {
        filtered.push({
          role: message.role,
          content: message.content
        })
        lastRole = message.role
      }
    }

    if (filtered.length > 0 && filtered[filtered.length - 1].role === 'user') {
      filtered.pop()
    }

    // Mantém apenas últimas 4 mensagens (2 user + 2 assistant) para economizar tokens
    return filtered.slice(-4)
  }

  /**
   * Processa análise em lotes quando há muitas músicas
   * @param musicas Array de músicas para analisar
   * @param userQuestion Pergunta do usuário
   * @param chunkSize Tamanho de cada lote (padrão: 30 músicas)
   */
  private async processInBatches(
    musicas: MusicaContext[],
    userQuestion: string,
    chunkSize: number = 15 // Reduzido para evitar timeout no Vercel
  ): Promise<string> {
    const chunks: MusicaContext[][] = []
    for (let i = 0; i < musicas.length; i += chunkSize) {
      chunks.push(musicas.slice(i, i + chunkSize))
    }

    console.log(`📦 Processando ${musicas.length} músicas em ${chunks.length} lote(s) de até ${chunkSize} músicas cada`)

    const results: string[] = []
    let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const chunkNumber = i + 1
      console.log(`🔄 Processando lote ${chunkNumber}/${chunks.length} (${chunk.length} músicas)...`)

      const musicContext = this.buildMusicContext(chunk, true)
      
      let userPrompt = `MÚSICAS (Lote ${chunkNumber} de ${chunks.length} - ${chunk.length} músicas):
${musicContext}

PERGUNTA: ${userQuestion}

IMPORTANTE: O usuário está perguntando sobre músicas que têm relação com a base bíblica mencionada.

Analise TODAS as músicas deste lote e identifique quais têm relação com a passagem bíblica mencionada.

Formato da resposta:
## 🎵 Músicas Relacionadas (Lote ${chunkNumber}/${chunks.length})

Para cada música relacionada, forneça:

### 🎶 [Nome da Música EXATO como aparece no banco]

**📖 Conexão Bíblica:**
- [Como a música se relaciona com a passagem]

**📝 Trechos Relevantes:**
- "[Trecho da letra]" - [Explicação da conexão]

**🧾 Análise Teológica:**
- [Análise breve da conexão doutrinária]

---

CRÍTICO: Use o NOME EXATO da música como aparece no banco de dados.

Se nenhuma música deste lote tiver relação clara, responda apenas: "Nenhuma música relacionada neste lote."`

      try {
        const response = await axios.post(
          this.apiUrl,
          {
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: this.getSystemPrompt(true, true) },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.5,
            max_tokens: 3000,
            top_p: 0.9
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 50000 // 50 segundos por lote (deixa margem para o limite de 60s do Vercel)
          }
        )

        const chunkResult = response.data.choices[0].message.content.trim()
        results.push(chunkResult)
        
        if (response.data.usage) {
          totalUsage.prompt_tokens += response.data.usage.prompt_tokens || 0
          totalUsage.completion_tokens += response.data.usage.completion_tokens || 0
          totalUsage.total_tokens += response.data.usage.total_tokens || 0
        }

        console.log(`✅ Lote ${chunkNumber}/${chunks.length} processado com sucesso`)
        
        // Pequena pausa entre lotes para evitar rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error: any) {
        console.error(`❌ Erro ao processar lote ${chunkNumber}/${chunks.length}:`, error.message)
        results.push(`\n\n⚠️ **Erro ao processar lote ${chunkNumber}/${chunks.length}:** ${error.message}\n`)
      }
    }

    // Combina todos os resultados
    let combinedResult = `## 🎵 Músicas Relacionadas a [Base Bíblica]\n\n`
    combinedResult += `*Análise completa de ${musicas.length} músicas processadas em ${chunks.length} lote(s)*\n\n`
    combinedResult += `---\n\n`
    
    // Filtra resultados vazios ou de erro
    const validResults = results.filter(r => 
      r && 
      !r.includes('Nenhuma música relacionada neste lote') && 
      !r.includes('⚠️ **Erro ao processar')
    )

    if (validResults.length === 0) {
      combinedResult += `\n\n**Nenhuma música encontrada com relação clara à base bíblica mencionada.**\n`
    } else {
      // Remove cabeçalhos duplicados e combina
      validResults.forEach((result, index) => {
        // Remove o cabeçalho do lote se existir
        const cleanedResult = result.replace(/## 🎵 Músicas Relacionadas \(Lote \d+\/\d+\)/g, '')
        combinedResult += cleanedResult
        if (index < validResults.length - 1) {
          combinedResult += `\n\n---\n\n`
        }
      })
    }

    return combinedResult
  }

  /**
   * Análise teológica usando DeepSeek (otimizado para economia de tokens)
   * @param specificMusic Se fornecido, analisa apenas esta música com letra completa
   * @param isBibleBasedQuery Se true, busca músicas relacionadas à base bíblica mencionada
   */
  async analyzeTheological(
    userQuestion: string,
    musicasContext: MusicaContext[],
    conversationHistory: Array<{ role: string; content: string }> = [],
    specificMusic?: MusicaContext,
    isBibleBasedQuery: boolean = false
  ): Promise<AIResponse> {
    if (!this.apiKey || this.apiKey.trim() === '') {
      return this.getFallbackResponse(userQuestion, musicasContext)
    }

    // Se há música específica, usa ela com letra completa
    const musicasParaAnalise = specificMusic ? [specificMusic] : musicasContext
    const fullLyrics = !!specificMusic

    try {
      // Se é busca por base bíblica E há muitas músicas, processa em lotes
      if (isBibleBasedQuery && musicasParaAnalise.length > 15) {
        console.log(`📊 Muitas músicas (${musicasParaAnalise.length}). Processando em lotes...`)
        const combinedContent = await this.processInBatches(musicasParaAnalise, userQuestion, 15)
        
        return {
          content: combinedContent,
          model: 'deepseek-chat',
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
          }
        }
      }
      
      // Se é busca por base bíblica, inclui mais contexto das letras
      const musicContext = this.buildMusicContext(
        musicasParaAnalise, 
        fullLyrics || isBibleBasedQuery
      )
      
      // Prompt de usuário otimizado
      let userPrompt = `MÚSICAS:
${musicContext}

PERGUNTA: ${userQuestion}

Forneça análise teológica reformada.`

      if (specificMusic) {
        userPrompt += `\n\nIMPORTANTE: Esta é uma análise específica da música "${specificMusic.titulo}". Inclua trechos da letra ao longo da análise, conectando-os com a base bíblica e doutrina reformada.`
      } else if (isBibleBasedQuery) {
        userPrompt += `\n\nIMPORTANTE: O usuário está perguntando sobre músicas que têm relação com a base bíblica mencionada. 

Analise TODAS as músicas fornecidas e identifique quais têm relação com a passagem bíblica mencionada.

Formato da resposta:
## 🎵 Músicas Relacionadas a [Base Bíblica]

Para cada música relacionada, forneça:

### 🎶 [Nome da Música EXATO como aparece no banco]

**📖 Conexão Bíblica:**
- [Como a música se relaciona com a passagem]

**📝 Trechos Relevantes:**
- "[Trecho da letra]" - [Explicação da conexão]
- "[Trecho da letra]" - [Explicação da conexão]

**🧾 Análise Teológica:**
- [Análise breve da conexão doutrinária]

---

CRÍTICO: Use o NOME EXATO da música como aparece no banco de dados. Se a música se chama "Bondade de Deus", use exatamente "Bondade de Deus" no título.

Se nenhuma música tiver relação clara, informe isso claramente.`
      }

      const filteredHistory = this.formatConversationHistory(conversationHistory)

      const messages = [
        { role: 'system', content: this.getSystemPrompt(fullLyrics, isBibleBasedQuery) },
        ...filteredHistory,
        { role: 'user', content: userPrompt }
      ]

      // Aumenta tokens se for música específica ou busca por base bíblica (para incluir trechos)
      // Para busca por base bíblica com muitas músicas, aumenta ainda mais
      const maxTokens = isBibleBasedQuery ? 3000 : (fullLyrics ? 2000 : 800)

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'deepseek-chat',
          messages,
          temperature: 0.5,
          max_tokens: maxTokens,
          top_p: 0.9
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
            timeout: 50000 // 50 segundos (deixa margem para o limite de 60s do Vercel)
        }
      )

      return {
        content: response.data.choices[0].message.content.trim(),
        model: response.data.model,
        usage: response.data.usage
      }
    } catch (error: any) {
      console.error('❌ Erro ao chamar API DeepSeek:', error.message)
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout') || error.message.includes('aborted')) {
        console.error('⏱️ Timeout na requisição')
        
        // Se é busca por base bíblica e deu timeout, tenta processar em lotes
        if (isBibleBasedQuery && musicasParaAnalise.length > 1) {
          console.log('🔄 Tentando processar em lotes devido ao timeout...')
          try {
            const combinedContent = await this.processInBatches(musicasParaAnalise, userQuestion, 10)
            return {
              content: combinedContent,
              model: 'deepseek-chat',
              usage: {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0
              }
            }
          } catch (batchError: any) {
            console.error('❌ Erro também no processamento em lotes:', batchError.message)
            return this.getFallbackResponse(userQuestion, musicasContext)
          }
        }
      }
      
      if (error.response) {
        console.error('Status:', error.response.status)
        console.error('Data:', JSON.stringify(error.response.data, null, 2))
      }

      return this.getFallbackResponse(userQuestion, musicasContext)
    }
  }

  /**
   * Resposta fallback quando API não está disponível
   */
  private getFallbackResponse(userQuestion: string, musicas: MusicaContext[]): AIResponse {
    const keywords = userQuestion.toLowerCase().match(/\b\w+\b/g) || []
    const relevantSongs = musicas.filter(m => 
      keywords.some(kw => 
        m.titulo.toLowerCase().includes(kw) || 
        m.letras.some(l => l.toLowerCase().includes(kw))
      )
    ).slice(0, 3)

    let content = `## 🎶 Resposta Baseada no Banco de Dados Local\n\n`
    content += `### 📋 Análise da Pergunta\n`
    content += `> "${userQuestion}"\n\n`

    if (relevantSongs.length > 0) {
      content += `### 🎵 Músicas Encontradas no Banco de Dados:\n\n`
      relevantSongs.forEach((song, idx) => {
        content += `**${idx + 1}. ${song.titulo}**\n`
        if (song.letras.length > 0) {
          const preview = song.letras[0].substring(0, 200)
          content += `> ${preview}${song.letras[0].length > 200 ? '...' : ''}\n\n`
        }
      })

      content += `### 📖 Base Bíblica Sugerida\n`
      content += `- Salmo 95:1-7 - "Vinde, cantemos ao SENHOR"\n`
      content += `- Colossenses 3:16 - "Salmos, hinos e cânticos espirituais"\n\n`

      content += `### 🙏 Recomendação\n`
      content += `As músicas acima foram encontradas em nosso banco de dados. Para uma análise teológica completa, por favor configure a API do DeepSeek.\n\n`
    } else {
      content += `### ⚠️ Nenhuma Música Encontrada\n`
      content += `Não encontrei músicas relacionadas no banco de dados.\n\n`
    }

    content += `\n---\n*💡 Nota: Esta é uma resposta básica. Configure DEEPSEEK_API_KEY para análises teológicas completas com IA.*`

    return {
      content,
      model: 'fallback-local',
      usage: undefined
    }
  }

  /**
   * Busca músicas por referência bíblica
   */
  async findByBibleReference(reference: string, musicas: MusicaContext[]): Promise<MusicaContext[]> {
    const normalizedRef = reference.toLowerCase().replace(/\s+/g, '')
    
    return musicas.filter(m => 
      m.letras.some(letra => {
        const normalizedLetra = letra.toLowerCase().replace(/\s+/g, '')
        return normalizedLetra.includes(normalizedRef)
      })
    )
  }

  /**
   * Valida se a API está configurada
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.apiKey.trim() !== '')
  }
}

// Singleton instance
export const deepseekService = new DeepSeekService()
