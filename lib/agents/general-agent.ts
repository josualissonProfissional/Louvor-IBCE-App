// Agente geral - Saudações, ajuda e informações gerais
export interface GeneralResponse {
  success: boolean
  response: string
}

/**
 * Agente Geral - Responde saudações, ajuda e perguntas gerais
 */
export class GeneralAgent {
  
  /**
   * Processa pergunta geral
   */
  async process(query: string): Promise<GeneralResponse> {
    const lowerQuery = query.toLowerCase()
    
    if (this.isGreeting(lowerQuery)) {
      return this.handleGreeting()
    } else if (this.isHelpQuery(lowerQuery)) {
      return this.handleHelp()
    } else if (this.isAboutQuery(lowerQuery)) {
      return this.handleAbout()
    } else {
      return this.handleGeneral()
    }
  }

  /**
   * Verifica se é saudação
   */
  private isGreeting(query: string): boolean {
    const greetings = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'ola', 'e aí', 'e ai']
    return greetings.some((g: string) => query === g || query.startsWith(g + ' ') || query.startsWith(g + ','))
  }

  /**
   * Verifica se é pergunta de ajuda
   */
  private isHelpQuery(query: string): boolean {
    return query.includes('ajuda') || 
           query.includes('help') || 
           query.includes('o que você faz') ||
           query.includes('o que voce faz') ||
           query.includes('como funciona') ||
           query.includes('comandos')
  }

  /**
   * Verifica se é pergunta sobre o sistema
   */
  private isAboutQuery(query: string): boolean {
    return query.includes('quem desenvolveu') ||
           query.includes('quem criou') ||
           query.includes('quem fez') ||
           query.includes('quem te criou') ||
           query.includes('quem é você') ||
           query.includes('quem e voce') ||
           query.includes('o que é você') ||
           query.includes('o que e voce')
  }

  /**
   * Responde saudação
   */
  private handleGreeting(): GeneralResponse {
    return {
      success: true,
      response: `## 👋 Olá! Bem-vindo ao Assistente do Ministério de Louvor IBCE!

Sou seu assistente inteligente e posso ajudá-lo de várias formas:

### 🎵 **Músicas**
- Buscar músicas, cifras e letras
- Encontrar links do YouTube
- Informações sobre o repertório

### 📅 **Escalas**
- Ver escalas futuras e passadas
- Consultar disponibilidade
- Próximos dias de atuação

### 👥 **Membros**
- Informações sobre membros
- Aniversariantes do mês
- Quem toca cada instrumento

### 📖 **Estudos Teológicos**
- Análise bíblica de músicas
- Avaliação doutrinária reformada
- Base bíblica e confessional

**Como posso ajudá-lo hoje?** 🙏`
    }
  }

  /**
   * Responde ajuda
   */
  private handleHelp(): GeneralResponse {
    return {
      success: true,
      response: `## 📚 Central de Ajuda - Assistente IBCE

### 🎵 **Comandos de Músicas:**
\`\`\`
"Qual o link da música 10000 Razões?"
"Liste todas as músicas"
"Quantas músicas temos?"
"Mostre músicas com cifras"
\`\`\`

### 📅 **Comandos de Escalas:**
\`\`\`
"Qual a próxima escala?"
"Escala da semana"
"Quem está escalado no domingo?"
"Fulano está disponível dia 25?"
\`\`\`

### 👥 **Comandos de Membros:**
\`\`\`
"Quem toca violão?"
"Lista de cantores"
"Aniversariantes do mês"
"Quantos membros temos?"
\`\`\`

### 📖 **Comandos Teológicos:**
\`\`\`
"Analise teologicamente a música X"
"Qual a base bíblica de Y?"
"Músicas sobre o Salmo 23"
"Esta letra está de acordo com a teologia reformada?"
"Qual a base teológica da música @pao da vida"
"Faça um estudo bíblico da música @Alfa e Ômega"
\`\`\`

### 💡 **Dicas:**
- Seja específico nas perguntas
- Use nomes completos quando possível
- **Use \`@nome da música\` para mencionar músicas específicas** (ex: \`@pao da vida\`)
- Combine comandos: "Músicas sobre Salmo 23 para domingo"
- Clique nos botões "▶️ Ver Música" para abrir o modal

**Pronto para começar?** 🚀`
    }
  }

  /**
   * Responde sobre o sistema
   */
  private handleAbout(): GeneralResponse {
    return {
      success: true,
      response: `## 🤖 Sobre Mim - Assistente Inteligente IBCE

### 👨‍💻 **Desenvolvimento:**
Fui desenvolvido para o **Ministério de Louvor da Igreja Batista Central de Eunápolis (IBCE)**.

**Tecnologias:**
- 🧠 Sistema de Múltiplos Agentes (7 agentes especializados)
- 🤖 Inteligência Artificial (DeepSeek AI para análises teológicas)
- ⚡ Next.js 14 + TypeScript
- 🗄️ Supabase (PostgreSQL)

### 🎯 **Minha Missão:**
Auxiliar o ministério de louvor com:
- Busca de informações (músicas, escalas, membros)
- Análise teológica reformada
- Acesso rápido a dados do sistema
- Consultas inteligentes e contextualizadas

### 🤖 **Como Funciono:**
Uso um sistema de classificação inteligente que identifica o tipo da sua pergunta e aciona o agente especializado adequado:

- 📖 **Agente Teológico** - Análises bíblicas
- 🎵 **Agente de Músicas** - Busca no repertório
- 📅 **Agente de Escalas** - Escalas e disponibilidade
- 👥 **Agente de Usuários** - Informações de membros
- 🔀 **Agente Híbrido** - Consultas complexas
- ℹ️ **Agente Geral** - Ajuda e saudações

### 💡 **Posso Ajudar?**
Digite **"ajuda"** para ver exemplos de comandos!

*Soli Deo Gloria* ✝️`
    }
  }

  /**
   * Responde pergunta geral
   */
  private handleGeneral(): GeneralResponse {
    return {
      success: true,
      response: `## ℹ️ Assistente do Ministério de Louvor IBCE

Não entendi sua pergunta, mas posso ajudá-lo com:

### 📋 **Principais Funcionalidades:**

**🎵 Músicas:**
- Buscar no repertório
- Links do YouTube
- Cifras e letras

**📅 Escalas:**
- Consultar escalas
- Ver disponibilidade
- Próximos cultos

**👥 Membros:**
- Informações de membros
- Instrumentos
- Aniversariantes

**📖 Estudos:**
- Análise teológica
- Base bíblica
- Avaliação doutrinária

**💡 Dica:** Digite "ajuda" para ver exemplos de comandos ou faça uma pergunta específica!`
    }
  }
}

export const generalAgent = new GeneralAgent()
