// Agente especializado em escalas e disponibilidade
import { createServerClient } from '@/lib/supabase/server'
import { format, startOfWeek, endOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface ScheduleSearchResult {
  success: boolean
  response: string
  escalas?: any[]
  diasAtuacao?: any[]
}

/**
 * Agente de Escalas - Busca informações sobre escalas e disponibilidade
 */
export class ScheduleAgent {
  
  /**
   * Processa pergunta sobre escalas
   */
  async process(query: string): Promise<ScheduleSearchResult> {
    const lowerQuery = query.toLowerCase()
    
    try {
      const supabase = createServerClient()
      
      // Identifica o tipo de busca
      if (this.isNextScheduleQuery(lowerQuery)) {
        return await this.getNextSchedule(supabase)
      } else if (this.isWeekScheduleQuery(lowerQuery)) {
        return await this.getWeekSchedule(supabase)
      } else if (this.isMonthScheduleQuery(lowerQuery)) {
        return await this.getMonthSchedule(supabase)
      } else if (this.isSpecificDateQuery(lowerQuery)) {
        return await this.getScheduleByDate(lowerQuery, supabase)
      } else if (this.isAvailabilityQuery(lowerQuery)) {
        return await this.checkAvailability(lowerQuery, supabase)
      } else if (this.isUpcomingDaysQuery(lowerQuery)) {
        return await this.getUpcomingDays(supabase)
      } else {
        return await this.getGeneralScheduleInfo(supabase)
      }
      
    } catch (error: any) {
      console.error('Erro no ScheduleAgent:', error)
      return {
        success: false,
        response: `❌ Erro ao buscar informações de escalas: ${error.message}`
      }
    }
  }

  /**
   * Verifica se é pergunta sobre próxima escala
   */
  private isNextScheduleQuery(query: string): boolean {
    return /(próxim[ao]|próxim[ao]s|next) (escala|culto|louvor|domingo)/.test(query) ||
           /escala (de )?hoje/.test(query)
  }

  /**
   * Verifica se é pergunta sobre escala da semana
   */
  private isWeekScheduleQuery(query: string): boolean {
    return /escala (da|desta|dessa) semana/.test(query) ||
           /(semana|week)/.test(query)
  }

  /**
   * Verifica se é pergunta sobre escala do mês
   */
  private isMonthScheduleQuery(query: string): boolean {
    return /escala (do|deste|desse) m[eê]s/.test(query) ||
           /(mês|month)/.test(query)
  }

  /**
   * Verifica se menciona data específica
   */
  private isSpecificDateQuery(query: string): boolean {
    return /\d{1,2}\/\d{1,2}/.test(query) ||
           /(segunda|terça|quarta|quinta|sexta|s[áa]bado|domingo)/.test(query) ||
           /dia \d{1,2}/.test(query)
  }

  /**
   * Verifica se é pergunta sobre disponibilidade
   */
  private isAvailabilityQuery(query: string): boolean {
    return /disponibilidade|disponível|indisponível/.test(query)
  }

  /**
   * Verifica se é pergunta sobre próximos dias
   */
  private isUpcomingDaysQuery(query: string): boolean {
    return /(pr[óo]xim[ao]s|futur[ao]s) dias (de )?atua[çc][ãa]o/.test(query)
  }

  /**
   * Busca próxima escala
   */
  private async getNextSchedule(supabase: any): Promise<ScheduleSearchResult> {
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')

    const { data: escalas, error } = await supabase
      .from('escalas')
      .select(`
        *,
        musica:musicas(id, titulo),
        usuario:usuarios(id, nome, email, instrumento:instrumentos(nome))
      `)
      .gte('data', todayStr)
      .order('data', { ascending: true })
      .order('ordem', { ascending: true })
      .limit(50)

    if (error) throw error

    if (!escalas || escalas.length === 0) {
      return {
        success: true,
        response: `## 📅 Próxima Escala\n\n❌ Não há escalas futuras cadastradas no momento.`
      }
    }

    // Agrupa por data
    const nextDate = escalas[0].data
    const nextEscalas = escalas.filter((e: any) => e.data === nextDate)

    return this.formatEscalaResponse(nextEscalas, 'Próxima Escala')
  }

  /**
   * Busca escala da semana
   */
  private async getWeekSchedule(supabase: any): Promise<ScheduleSearchResult> {
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 0 }) // Domingo
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 })

    const { data: escalas, error } = await supabase
      .from('escalas')
      .select(`
        *,
        musica:musicas(id, titulo),
        usuario:usuarios(id, nome, email, instrumento:instrumentos(nome))
      `)
      .gte('data', format(weekStart, 'yyyy-MM-dd'))
      .lte('data', format(weekEnd, 'yyyy-MM-dd'))
      .order('data', { ascending: true })
      .order('ordem', { ascending: true })

    if (error) throw error

    if (!escalas || escalas.length === 0) {
      return {
        success: true,
        response: `## 📅 Escala da Semana\n\n❌ Não há escalas para esta semana.`
      }
    }

    // Agrupa por data
    const escalasPorData = this.groupByDate(escalas)
    
    return this.formatMultipleDatesResponse(escalasPorData, 'Escalas da Semana')
  }

  /**
   * Busca escala do mês
   */
  private async getMonthSchedule(supabase: any): Promise<ScheduleSearchResult> {
    const today = new Date()
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)

    const { data: escalas, error } = await supabase
      .from('escalas')
      .select(`
        *,
        musica:musicas(id, titulo),
        usuario:usuarios(id, nome, email, instrumento:instrumentos(nome))
      `)
      .gte('data', format(monthStart, 'yyyy-MM-dd'))
      .lte('data', format(monthEnd, 'yyyy-MM-dd'))
      .order('data', { ascending: true })
      .order('ordem', { ascending: true })

    if (error) throw error

    if (!escalas || escalas.length === 0) {
      return {
        success: true,
        response: `## 📅 Escalas de ${format(today, 'MMMM', { locale: ptBR })}\n\n❌ Não há escalas para este mês.`
      }
    }

    const escalasPorData = this.groupByDate(escalas)
    
    return this.formatMultipleDatesResponse(escalasPorData, `Escalas de ${format(today, 'MMMM yyyy', { locale: ptBR })}`)
  }

  /**
   * Busca escala por data específica
   */
  private async getScheduleByDate(query: string, supabase: any): Promise<ScheduleSearchResult> {
    // Tenta extrair data da query
    const dateMatch = query.match(/\d{1,2}\/\d{1,2}/)
    let targetDate: Date = new Date()

    if (dateMatch) {
      const [day, month] = dateMatch[0].split('/').map(Number)
      const year = new Date().getFullYear()
      targetDate = new Date(year, month - 1, day)
    } else {
      // Busca por dia da semana
      const dayNames: Record<string, number> = {
        'domingo': 0, 'segunda': 1, 'terça': 2, 'terca': 2,
        'quarta': 3, 'quinta': 4, 'sexta': 5, 'sábado': 6, 'sabado': 6
      }
      
      const dayName = Object.keys(dayNames).find(name => query.includes(name))
      if (dayName) {
        const targetDay = dayNames[dayName]
        const today = new Date()
        const currentDay = today.getDay()
        const daysToAdd = (targetDay - currentDay + 7) % 7
        targetDate = addDays(today, daysToAdd === 0 ? 7 : daysToAdd)
      }
    }

    const dateStr = format(targetDate, 'yyyy-MM-dd')

    const { data: escalas, error } = await supabase
      .from('escalas')
      .select(`
        *,
        musica:musicas(id, titulo),
        usuario:usuarios(id, nome, email, instrumento:instrumentos(nome))
      `)
      .eq('data', dateStr)
      .order('ordem', { ascending: true })

    if (error) throw error

    if (!escalas || escalas.length === 0) {
      return {
        success: true,
        response: `## 📅 Escala de ${format(targetDate, "dd 'de' MMMM", { locale: ptBR })}\n\n❌ Não há escalas cadastradas para esta data.`
      }
    }

    return this.formatEscalaResponse(escalas, `Escala de ${format(targetDate, "dd 'de' MMMM", { locale: ptBR })}`)
  }

  /**
   * Verifica disponibilidade
   */
  private async checkAvailability(query: string, supabase: any): Promise<ScheduleSearchResult> {
    // Extrai nome se houver
    const nameMatch = query.match(/\b([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+(?:\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+)*)\b/)
    const searchName = nameMatch ? nameMatch[1] : null

    const { data: disponibilidades, error } = await supabase
      .from('disponibilidade')
      .select(`
        *,
        usuario:usuarios(id, nome, email)
      `)
      .gte('data', format(new Date(), 'yyyy-MM-dd'))
      .order('data', { ascending: true })
      .limit(50)

    if (error) throw error

    if (!disponibilidades || disponibilidades.length === 0) {
      return {
        success: true,
        response: `## 📊 Disponibilidade\n\n❌ Não há informações de disponibilidade cadastradas.`
      }
    }

    // Filtra por nome se especificado
    let filtered = disponibilidades
    if (searchName) {
      filtered = disponibilidades.filter((d: any) => 
        d.usuario.nome?.toLowerCase().includes(searchName.toLowerCase()) ||
        d.usuario.email.toLowerCase().includes(searchName.toLowerCase())
      )
    }

    if (filtered.length === 0 && searchName) {
      return {
        success: true,
        response: `## 📊 Disponibilidade de ${searchName}\n\n❌ Não encontrei informações de disponibilidade para esta pessoa.`
      }
    }

    return this.formatAvailabilityResponse(filtered, searchName)
  }

  /**
   * Busca próximos dias de atuação
   */
  private async getUpcomingDays(supabase: any): Promise<ScheduleSearchResult> {
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')

    const { data: dias, error } = await supabase
      .from('dias_atuacao')
      .select('*')
      .gte('data', todayStr)
      .order('data', { ascending: true })
      .limit(10)

    if (error) throw error

    if (!dias || dias.length === 0) {
      return {
        success: true,
        response: `## 📅 Próximos Dias de Atuação\n\n❌ Não há dias de atuação futuros cadastrados.`
      }
    }

    let response = `## 📅 Próximos Dias de Atuação\n\n`
    response += `**Total:** ${dias.length} dia${dias.length !== 1 ? 's' : ''}\n\n`

    dias.forEach((dia: any, index: number) => {
      const diaDate = parseISO(dia.data)
      response += `${index + 1}. **${format(diaDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}**\n`
      response += `   📅 ${format(diaDate, 'dd/MM/yyyy')}\n\n`
    })

    return {
      success: true,
      response,
      diasAtuacao: dias
    }
  }

  /**
   * Informações gerais sobre escalas
   */
  private async getGeneralScheduleInfo(supabase: any): Promise<ScheduleSearchResult> {
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')

    const { data: escalas, error } = await supabase
      .from('escalas')
      .select('data')
      .gte('data', todayStr)

    if (error) throw error

    const totalEscalas = escalas?.length || 0
    const datasUnicas = [...new Set(escalas?.map((e: any) => e.data) || [])]

    let response = `## 📊 Informações de Escalas\n\n`
    response += `**Total de pessoas escaladas (futuras):** ${totalEscalas}\n`
    response += `**Datas com escalas:** ${datasUnicas.length}\n\n`
    response += `### O que posso fazer:\n`
    response += `- "Qual a próxima escala?"\n`
    response += `- "Escala da semana"\n`
    response += `- "Quem está escalado no domingo?"\n`
    response += `- "Fulano está disponível dia X?"\n`

    return {
      success: true,
      response
    }
  }

  /**
   * Agrupa escalas por data
   */
  private groupByDate(escalas: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {}
    escalas.forEach(escala => {
      if (!grouped[escala.data]) {
        grouped[escala.data] = []
      }
      grouped[escala.data].push(escala)
    })
    return grouped
  }

  /**
   * Formata resposta de uma única data
   */
  private formatEscalaResponse(escalas: any[], title: string): ScheduleSearchResult {
    if (escalas.length === 0) {
      return {
        success: true,
        response: `## ${title}\n\n❌ Nenhuma escala encontrada.`
      }
    }

    const data = parseISO(escalas[0].data)
    let response = `## 📅 ${title}\n\n`
    response += `**Data:** ${format(data, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}\n\n`

    // Separa por músicas e escala geral
    const comMusica = escalas.filter((e: any) => e.musica_id)
    const semMusica = escalas.filter((e: any) => !e.musica_id)

    // Agrupa por música
    const porMusica: Record<string, any[]> = {}
    comMusica.forEach((e: any) => {
      const musicaTitulo = e.musica?.titulo || 'Sem título'
      if (!porMusica[musicaTitulo]) {
        porMusica[musicaTitulo] = []
      }
      porMusica[musicaTitulo].push(e)
    })

    // Músicas
    if (Object.keys(porMusica).length > 0) {
      response += `### 🎵 Músicas:\n\n`
      Object.entries(porMusica).forEach(([titulo, escalasDaMusica]) => {
        response += `**"${titulo}"**\n`
        escalasDaMusica.forEach((e: any) => {
          const nome = e.usuario.nome || e.usuario.email
          const instrumento = e.usuario.instrumento?.nome
          response += `- ${e.funcao === 'solo' ? '🎤 Solo' : e.funcao === 'cantor' ? '🎙️ Cantor' : '🎸 Músico'}: ${nome}`
          if (instrumento) response += ` (${instrumento})`
          response += `\n`
        })
        response += `\n`
      })
    }

    // Escala geral
    if (semMusica.length > 0) {
      response += `### 👥 Escala Geral:\n\n`
      const cantores = semMusica.filter((e: any) => e.funcao === 'cantor')
      const musicos = semMusica.filter((e: any) => e.funcao === 'musico')

      if (cantores.length > 0) {
        response += `**🎙️ Cantores:**\n`
        cantores.forEach((e: any) => {
          const nome = e.usuario.nome || e.usuario.email
          response += `- ${nome}\n`
        })
        response += `\n`
      }

      if (musicos.length > 0) {
        response += `**🎸 Músicos:**\n`
        musicos.forEach((e: any) => {
          const nome = e.usuario.nome || e.usuario.email
          const instrumento = e.usuario.instrumento?.nome
          response += `- ${nome}`
          if (instrumento) response += ` (${instrumento})`
          response += `\n`
        })
      }
    }

    return {
      success: true,
      response,
      escalas
    }
  }

  /**
   * Formata resposta de múltiplas datas
   */
  private formatMultipleDatesResponse(escalasPorData: Record<string, any[]>, title: string): ScheduleSearchResult {
    let response = `## 📅 ${title}\n\n`
    response += `**Total de datas:** ${Object.keys(escalasPorData).length}\n\n`

    Object.entries(escalasPorData).forEach(([dataStr, escalas]) => {
      const data = parseISO(dataStr)
      response += `### ${format(data, "EEEE, dd/MM", { locale: ptBR })}\n`
      
      const pessoas = [...new Set(escalas.map((e: any) => e.usuario.nome || e.usuario.email))]
      response += `**${pessoas.length} pessoa${pessoas.length !== 1 ? 's' : ''} escalada${pessoas.length !== 1 ? 's' : ''}:**\n`
      pessoas.forEach(nome => {
        response += `- ${nome}\n`
      })
      response += `\n`
    })

    const todasEscalas = Object.values(escalasPorData).flat()
    
    return {
      success: true,
      response,
      escalas: todasEscalas
    }
  }

  /**
   * Formata resposta de disponibilidade
   */
  private formatAvailabilityResponse(disponibilidades: any[], searchName: string | null): ScheduleSearchResult {
    let response = searchName 
      ? `## 📊 Disponibilidade de ${searchName}\n\n`
      : `## 📊 Disponibilidade Geral\n\n`

    // Agrupa por pessoa
    const porPessoa: Record<string, any[]> = {}
    disponibilidades.forEach((d: any) => {
      const nome = d.usuario.nome || d.usuario.email
      if (!porPessoa[nome]) {
        porPessoa[nome] = []
      }
      porPessoa[nome].push(d)
    })

    Object.entries(porPessoa).forEach(([nome, disps]) => {
      response += `**${nome}:**\n`
      disps.forEach((d: any) => {
        const data = parseISO(d.data)
        const status = d.status === 'disponivel' ? '✅ Disponível' : '❌ Indisponível'
        response += `- ${format(data, "dd/MM/yyyy (EEEE)", { locale: ptBR })}: ${status}\n`
      })
      response += `\n`
    })

    return {
      success: true,
      response
    }
  }
}

export const scheduleAgent = new ScheduleAgent()
