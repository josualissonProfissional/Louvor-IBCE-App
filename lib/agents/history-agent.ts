// Agente de História da Igreja e Desenvolvedor
export interface HistoryResponse {
  success: boolean
  response: string
}

/**
 * Agente de História - Responde perguntas sobre a igreja, pastores, líderes e desenvolvedor
 */
export class HistoryAgent {
  
  /**
   * Processa pergunta sobre história da igreja
   */
  async process(query: string): Promise<HistoryResponse> {
    const lowerQuery = query.toLowerCase().trim()
    
    // Perguntas sobre desenvolvedor
    if (this.isDeveloperQuery(lowerQuery)) {
      return this.handleDeveloper()
    }
    
    // Perguntas sobre pastores
    if (this.isPastorQuery(lowerQuery)) {
      return this.handlePastors()
    }
    
    // Perguntas sobre a igreja
    if (this.isChurchQuery(lowerQuery)) {
      return this.handleChurch()
    }
    
    // Perguntas sobre líderes do ministério
    if (this.isLeaderQuery(lowerQuery)) {
      return this.handleLeaders()
    }
    
    // Resposta padrão
    return {
      success: false,
      response: 'Desculpe, não entendi sua pergunta sobre a história da igreja. Você pode perguntar sobre:\n- Quem desenvolveu o sistema\n- Quem são os pastores\n- Qual é a igreja\n- Quem são os líderes do ministério de louvor'
    }
  }

  /**
   * Verifica se é pergunta sobre desenvolvedor
   */
  private isDeveloperQuery(query: string): boolean {
    const patterns = [
      /quem (desenvolveu|te desenvolveu|criou|te criou|fez|te fez)/i,
      /quem é (o|a) desenvolvedor/i,
      /quem programou/i,
      /quem fez (o|a) (sistema|aplicação|app)/i
    ]
    return patterns.some(pattern => pattern.test(query))
  }

  /**
   * Verifica se é pergunta sobre pastores
   */
  private isPastorQuery(query: string): boolean {
    const patterns = [
      /quem (é|são) (o|a|os|as) pastor/i,
      /(pastor|pastores) (da|do|da nossa) igreja/i,
      /(pastor|pastores) (são|é)/i,
      /nome (do|dos) (pastor|pastores)/i
    ]
    return patterns.some(pattern => pattern.test(query))
  }

  /**
   * Verifica se é pergunta sobre a igreja
   */
  private isChurchQuery(query: string): boolean {
    const patterns = [
      /(qual|de qual) (é|é a|é o) (nossa|a nossa) igreja/i,
      /(qual|de qual) igreja/i,
      /nome (da|do) igreja/i,
      /(somos|é) (de|da) qual igreja/i
    ]
    return patterns.some(pattern => pattern.test(query))
  }

  /**
   * Verifica se é pergunta sobre líderes do ministério
   */
  private isLeaderQuery(query: string): boolean {
    const patterns = [
      /(quem|quais) (é|são) (o|a|os|as) líder/i,
      /(quem|quais) (é|são) (o|a) líder (do|da) (ministério|louvor)/i,
      /líder (do|da) (ministério|louvor)/i,
      /(quem|quais) lidera (o|a) (ministério|louvor)/i,
      /líderes (do|da) (ministério|louvor)/i
    ]
    return patterns.some(pattern => pattern.test(query))
  }

  /**
   * Responde sobre desenvolvedor
   */
  private handleDeveloper(): HistoryResponse {
    return {
      success: true,
      response: `## 👨‍💻 Desenvolvedor do Sistema

**Josué Alisson** desenvolveu este sistema completo de organização do Ministério de Louvor IBCE.

O sistema foi criado para facilitar a gestão de escalas, músicas, membros e disponibilidade, além de fornecer análises teológicas através de Inteligência Artificial.`
    }
  }

  /**
   * Responde sobre pastores
   */
  private handlePastors(): HistoryResponse {
    return {
      success: true,
      response: `## 👨‍🦳 Pastores da IBCE

Os pastores da **Igreja Batista Central em Estância - IBCE** são:

- **Pastor Gadiel Lima**
- **Pastor Daniel Lima**

Ambos lideram a igreja com dedicação e zelo pela Palavra de Deus.`
    }
  }

  /**
   * Responde sobre a igreja
   */
  private handleChurch(): HistoryResponse {
    return {
      success: true,
      response: `## ⛪ Nossa Igreja

Somos da **Igreja Batista Central em Estância - IBCE**.

A IBCE é uma igreja comprometida com a pregação fiel da Palavra de Deus e com a adoração genuína através do ministério de louvor.`
    }
  }

  /**
   * Responde sobre líderes do ministério
   */
  private handleLeaders(): HistoryResponse {
    return {
      success: true,
      response: `## 🎵 Líderes do Ministério de Louvor

Os líderes do **Ministério de Louvor IBCE** são:

- **Josué Alisson**
- **Bruno Barros**

Eles lideram o ministério com dedicação, organizando escalas, ensaios e ministrações para a glória de Deus.`
    }
  }
}

// Exporta instância única
export const historyAgent = new HistoryAgent()
