// Agente especializado em informações de usuários/membros
import { createServerClient } from '@/lib/supabase/server'
import { format, parseISO, getMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface UserSearchResult {
  success: boolean
  response: string
  usuarios?: any[]
}

/**
 * Agente de Usuários - Busca informações sobre membros do ministério
 */
export class UserAgent {
  
  /**
   * Processa pergunta sobre usuários
   */
  async process(query: string): Promise<UserSearchResult> {
    const lowerQuery = query.toLowerCase()
    
    try {
      const supabase = createServerClient()
      
      // Identifica o tipo de busca
      if (this.isInstrumentQuery(lowerQuery)) {
        return await this.searchByInstrument(lowerQuery, supabase)
      } else if (this.isBirthdayQuery(lowerQuery)) {
        return await this.getBirthdays(supabase)
      } else if (this.isRoleQuery(lowerQuery)) {
        return await this.searchByRole(lowerQuery, supabase)
      } else if (this.isCountQuery(lowerQuery)) {
        return await this.countMembers(supabase)
      } else if (this.isListQuery(lowerQuery)) {
        return await this.listAllMembers(supabase)
      } else if (this.isSpecificUserQuery(lowerQuery)) {
        return await this.searchSpecificUser(lowerQuery, supabase)
      } else {
        return await this.getGeneralInfo(supabase)
      }
      
    } catch (error: any) {
      console.error('Erro no UserAgent:', error)
      return {
        success: false,
        response: `❌ Erro ao buscar informações de usuários: ${error.message}`
      }
    }
  }

  /**
   * Verifica se é pergunta sobre instrumento
   */
  private isInstrumentQuery(query: string): boolean {
    return /quem toca|toca (o |a )?(violão|guitarra|bateria|teclado|baixo|piano|violino|saxofone|flauta|trompete)/.test(query) ||
           /instrumentista|músico/.test(query)
  }

  /**
   * Verifica se é pergunta sobre aniversariantes
   */
  private isBirthdayQuery(query: string): boolean {
    return /anivers[aá]riante|anivers[aá]rio|nascimento|faz aniversário/.test(query)
  }

  /**
   * Verifica se é pergunta sobre função (cantor/músico)
   */
  private isRoleQuery(query: string): boolean {
    return /(lista|quem [eé]|quantos) (cantor|cantora|m[uú]sico)/.test(query)
  }

  /**
   * Verifica se é pergunta de contagem
   */
  private isCountQuery(query: string): boolean {
    return /quantos? (membros?|pessoas?|usu[aá]rios?)/.test(query)
  }

  /**
   * Verifica se é pergunta de listagem
   */
  private isListQuery(query: string): boolean {
    return /(lista|mostre|quais|todos|nomes) (os |as |dos |de )?(membros?|pessoas?|usu[aá]rios?|integrantes?)/.test(query) ||
           /nomes dos integrantes/.test(query) ||
           /quem (são|sao)/.test(query)
  }

  /**
   * Verifica se menciona usuário específico
   */
  private isSpecificUserQuery(query: string): boolean {
    return /\b([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+(?:\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+)*)\b/.test(query)
  }

  /**
   * Busca por instrumento
   */
  private async searchByInstrument(query: string, supabase: any): Promise<UserSearchResult> {
    // Extrai nome do instrumento
    const instrumentos = [
      'violão', 'guitarra', 'bateria', 'teclado', 'baixo', 'piano',
      'violino', 'saxofone', 'flauta', 'trompete', 'contrabaixo', 'pandeiro'
    ]
    
    const instrumento = instrumentos.find((inst: string) => query.includes(inst))

    let usuariosQuery = supabase
      .from('usuarios')
      .select('id, nome, email, cargo, data_nascimento, instrumento:instrumentos(nome)')
      .order('nome', { ascending: true })

    if (instrumento) {
      usuariosQuery = usuariosQuery.eq('instrumento.nome', instrumento.charAt(0).toUpperCase() + instrumento.slice(1))
    }

    const { data: usuarios, error } = await usuariosQuery

    if (error) throw error

    if (!usuarios || usuarios.length === 0) {
      return {
        success: true,
        response: instrumento
          ? `## 🎸 Músicos de ${instrumento}\n\n❌ Não há membros cadastrados que tocam ${instrumento}.`
          : `## 🎸 Músicos\n\n❌ Não há músicos cadastrados no momento.`
      }
    }

    let response = instrumento
      ? `## 🎸 Músicos que tocam ${instrumento}\n\n`
      : `## 🎸 Todos os Músicos\n\n`

    response += `**Total:** ${usuarios.length} pessoa${usuarios.length !== 1 ? 's' : ''}\n\n`

    usuarios.forEach((usuario: any, index: number) => {
      const nome = usuario.nome || usuario.email
      const cargo = this.formatCargo(usuario.cargo)
      const inst = usuario.instrumento?.nome
      
      response += `${index + 1}. **${nome}**\n`
      response += `   - ${cargo}\n`
      if (inst) response += `   - Instrumento: ${inst}\n`
      response += `\n`
    })

    return {
      success: true,
      response,
      usuarios
    }
  }

  /**
   * Busca aniversariantes
   */
  private async getBirthdays(supabase: any): Promise<UserSearchResult> {
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, data_nascimento, instrumento:instrumentos(nome)')
      .not('data_nascimento', 'is', null)
      .order('data_nascimento', { ascending: true })

    if (error) throw error

    if (!usuarios || usuarios.length === 0) {
      return {
        success: true,
        response: `## 🎂 Aniversariantes\n\n❌ Não há informações de aniversários cadastradas.`
      }
    }

    // Filtra aniversariantes do mês atual
    const mesAtual = new Date().getMonth()
    const aniversariantesDoMes = usuarios.filter((u: any) => {
      const dataNasc = parseISO(u.data_nascimento)
      return getMonth(dataNasc) === mesAtual
    })

    let response = `## 🎂 Aniversariantes do Mês\n\n`

    if (aniversariantesDoMes.length === 0) {
      response += `❌ Não há aniversariantes neste mês.\n\n`
    } else {
      response += `**Total:** ${aniversariantesDoMes.length} pessoa${aniversariantesDoMes.length !== 1 ? 's' : ''}\n\n`
      
      aniversariantesDoMes.forEach((usuario: any) => {
        const nome = usuario.nome || usuario.email
        const data = parseISO(usuario.data_nascimento)
        const inst = usuario.instrumento?.nome
        
        response += `🎉 **${nome}**\n`
        response += `   - Data: ${format(data, "dd 'de' MMMM", { locale: ptBR })}\n`
        if (inst) response += `   - Instrumento: ${inst}\n`
        response += `\n`
      })
    }

    // Lista completa de todos os aniversários
    response += `\n### 📅 Todos os Aniversários:\n\n`
    usuarios.forEach((usuario: any) => {
      const nome = usuario.nome || usuario.email
      const data = parseISO(usuario.data_nascimento)
      response += `- ${nome}: ${format(data, "dd/MM", { locale: ptBR })}\n`
    })

    return {
      success: true,
      response,
      usuarios: aniversariantesDoMes
    }
  }

  /**
   * Busca por função (cantor/músico)
   */
  private async searchByRole(query: string, supabase: any): Promise<UserSearchResult> {
    let role: string | null = null
    
    if (query.includes('cantor') || query.includes('cantora')) {
      role = 'cantor'
    } else if (query.includes('músico') || query.includes('musico')) {
      role = 'musico'
    }

    let usuariosQuery = supabase
      .from('usuarios')
      .select('id, nome, email, cargo, instrumento:instrumentos(nome)')
      .order('nome', { ascending: true })

    if (role) {
      usuariosQuery = usuariosQuery.or(`cargo.eq.${role},cargo.eq.ambos`)
    }

    const { data: usuarios, error } = await usuariosQuery

    if (error) throw error

    if (!usuarios || usuarios.length === 0) {
      return {
        success: true,
        response: role
          ? `## ${role === 'cantor' ? '🎙️ Cantores' : '🎸 Músicos'}\n\n❌ Não há ${role === 'cantor' ? 'cantores' : 'músicos'} cadastrados.`
          : `## 👥 Membros\n\n❌ Não há membros cadastrados.`
      }
    }

    let response = role
      ? `## ${role === 'cantor' ? '🎙️ Cantores' : '🎸 Músicos'}\n\n`
      : `## 👥 Todos os Membros\n\n`

    response += `**Total:** ${usuarios.length} pessoa${usuarios.length !== 1 ? 's' : ''}\n\n`

    usuarios.forEach((usuario: any, index: number) => {
      const nome = usuario.nome || usuario.email
      const cargo = this.formatCargo(usuario.cargo)
      const inst = usuario.instrumento?.nome
      
      response += `${index + 1}. **${nome}**\n`
      response += `   - ${cargo}\n`
      if (inst) response += `   - Instrumento: ${inst}\n`
      response += `\n`
    })

    return {
      success: true,
      response,
      usuarios
    }
  }

  /**
   * Conta membros
   */
  private async countMembers(supabase: any): Promise<UserSearchResult> {
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('id, cargo')

    if (error) throw error

    const total = usuarios?.length || 0
    const cantores = usuarios?.filter((u: any) => u.cargo === 'cantor' || u.cargo === 'ambos').length || 0
    const musicos = usuarios?.filter((u: any) => u.cargo === 'musico' || u.cargo === 'ambos').length || 0

    let response = `## 📊 Estatísticas de Membros\n\n`
    response += `**Total de Membros:** ${total}\n\n`
    response += `### Detalhamento:\n`
    response += `- 🎙️ Cantores: **${cantores}** (${total > 0 ? Math.round((cantores/total)*100) : 0}%)\n`
    response += `- 🎸 Músicos: **${musicos}** (${total > 0 ? Math.round((musicos/total)*100) : 0}%)\n`

    return {
      success: true,
      response
    }
  }

  /**
   * Lista todos os membros
   */
  private async listAllMembers(supabase: any): Promise<UserSearchResult> {
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, cargo, instrumento:instrumentos(nome)')
      .order('nome', { ascending: true })

    if (error) throw error

    if (!usuarios || usuarios.length === 0) {
      return {
        success: true,
        response: `## 👥 Todos os Membros\n\n❌ Não há membros cadastrados.`
      }
    }

    let response = `## 👥 Todos os Membros\n\n`
    response += `**Total:** ${usuarios.length} membro${usuarios.length !== 1 ? 's' : ''}\n\n`

    usuarios.forEach((usuario: any, index: number) => {
      const nome = usuario.nome || usuario.email
      const cargo = this.formatCargo(usuario.cargo)
      const inst = usuario.instrumento?.nome
      
      response += `${index + 1}. **${nome}**\n`
      response += `   - ${cargo}\n`
      if (inst) response += `   - Instrumento: ${inst}\n`
      response += `\n`
    })

    return {
      success: true,
      response,
      usuarios
    }
  }

  /**
   * Busca usuário específico
   */
  private async searchSpecificUser(query: string, supabase: any): Promise<UserSearchResult> {
    // Extrai nome
    const nameMatch = query.match(/\b([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+(?:\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+)*)\b/)
    const searchName = nameMatch ? nameMatch[1] : ''

    if (!searchName || searchName.length < 3) {
      return await this.listAllMembers(supabase)
    }

    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, cargo, data_nascimento, lider, instrumento:instrumentos(nome)')
      .or(`nome.ilike.%${searchName}%,email.ilike.%${searchName}%`)

    if (error) throw error

    if (!usuarios || usuarios.length === 0) {
      return {
        success: true,
        response: `## 🔍 Busca: "${searchName}"\n\n❌ Nenhum membro encontrado com esse nome.`
      }
    }

    let response = `## 🔍 Resultado da Busca: "${searchName}"\n\n`
    response += `**Encontrado${usuarios.length !== 1 ? 's' : ''}:** ${usuarios.length} pessoa${usuarios.length !== 1 ? 's' : ''}\n\n`

    usuarios.forEach((usuario: any, index: number) => {
      const nome = usuario.nome || usuario.email
      const cargo = this.formatCargo(usuario.cargo)
      const inst = usuario.instrumento?.nome
      const isLider = usuario.lider
      
      response += `### ${index + 1}. ${nome}${isLider ? ' 👑' : ''}\n\n`
      response += `- **Cargo:** ${cargo}\n`
      if (inst) response += `- **Instrumento:** ${inst}\n`
      if (usuario.data_nascimento) {
        const data = parseISO(usuario.data_nascimento)
        response += `- **Aniversário:** ${format(data, "dd 'de' MMMM", { locale: ptBR })}\n`
      }
      if (isLider) response += `- **Função:** Líder/Admin\n`
      response += `\n`
    })

    return {
      success: true,
      response,
      usuarios
    }
  }

  /**
   * Informações gerais
   */
  private async getGeneralInfo(supabase: any): Promise<UserSearchResult> {
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('id, cargo, instrumento:instrumentos(nome)')

    if (error) throw error

    const total = usuarios?.length || 0

    let response = `## 👥 Informações de Membros\n\n`
    response += `**Total de Membros:** ${total}\n\n`
    response += `### O que posso fazer:\n`
    response += `- "Lista de cantores"\n`
    response += `- "Quem toca violão?"\n`
    response += `- "Aniversariantes do mês"\n`
    response += `- "Quantos membros temos?"\n`
    response += `- "Informações sobre [nome]"\n`

    return {
      success: true,
      response
    }
  }

  /**
   * Formata cargo
   */
  private formatCargo(cargo: string): string {
    const cargos: Record<string, string> = {
      'cantor': '🎙️ Cantor(a)',
      'musico': '🎸 Músico(a)',
      'ambos': '🎤🎸 Cantor(a) e Músico(a)'
    }
    return cargos[cargo] || cargo
  }
}

export const userAgent = new UserAgent()
