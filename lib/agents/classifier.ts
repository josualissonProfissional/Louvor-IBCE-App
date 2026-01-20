// Classificador de perguntas - identifica qual agente deve responder
export type QueryType = 
  | 'theological'      // Análise teológica, doutrinária, bíblica
  | 'music_search'     // Busca de músicas, cifras, letras, links
  | 'schedule'         // Escalas, disponibilidade, dias de atuação
  | 'user_info'        // Informações sobre usuários/membros
  | 'history'          // História da igreja, pastores, líderes, desenvolvedor
  | 'hybrid'           // Combina teologia + dados (ex: "música sobre Salmo 23 para domingo")
  | 'general'          // Informações gerais, saudações, ajuda

export interface ClassifiedQuery {
  type: QueryType
  intent: string
  keywords: string[]
  requiresMusic: boolean
  requiresSchedule: boolean
  requiresUser: boolean
  requiresTheology: boolean
  mentionedMusic?: string // Nome da música mencionada com @
  originalQuery?: string // Query original (antes de remover comandos)
  cleanedQuery?: string // Query limpa (sem comandos)
}

/**
 * Extrai menções de músicas usando @ (ex: @pao da vida)
 * Remove pontuação no final (?, !, ., etc)
 */
export function extractMentionedMusic(query: string): string | null {
  // Busca padrão @nome da música (até encontrar espaço, @, ou pontuação de final de frase)
  const mentionMatch = query.match(/@([^\s@?!.]+(?:\s+[^\s@?!.]+)*)/i)
  if (mentionMatch) {
    let musicName = mentionMatch[1].trim()
    // Remove pontuação no final (?, !, ., ,, ;, :)
    musicName = musicName.replace(/[?!.,;:]+$/, '').trim()
    return musicName
  }
  return null
}

/**
 * Extrai e processa comandos que começam com "/"
 * Retorna o comando encontrado e a query limpa (sem o comando)
 */
function extractCommand(query: string): { command: string | null; cleanedQuery: string } {
  const commandMatch = query.match(/^\/(\w+)\s+(.+)$/i)
  if (commandMatch) {
    return {
      command: commandMatch[1].toLowerCase(),
      cleanedQuery: commandMatch[2].trim()
    }
  }
  return {
    command: null,
    cleanedQuery: query
  }
}

/**
 * Classifica a pergunta do usuário e determina qual agente deve responder
 */
export function classifyQuery(query: string): ClassifiedQuery {
  // Extrai comandos (ex: /teologia)
  const { command, cleanedQuery } = extractCommand(query)
  
  // Se for comando /teologia, força classificação teológica
  if (command === 'teologia') {
    const mentionedMusic = extractMentionedMusic(cleanedQuery)
    return {
      type: 'theological',
      intent: 'Análise teológica (comando /teologia)',
      keywords: ['teologia', 'comando'],
      requiresMusic: !!mentionedMusic,
      requiresSchedule: false,
      requiresUser: false,
      requiresTheology: true,
      mentionedMusic: mentionedMusic || undefined,
      originalQuery: query,
      cleanedQuery: cleanedQuery
    }
  }
  
  const lowerQuery = cleanedQuery.toLowerCase()
  const keywords: string[] = []
  
  // Verifica se há menção de música com @
  const mentionedMusic = extractMentionedMusic(cleanedQuery)

  // Keywords para cada categoria
  const theologicalKeywords = [
    'teologia', 'teológic', 'bíblic', 'escritur', 'doutrina', 'doutrinar',
    'reformad', 'calvinis', 'westminster', 'heidelberg', 'dort',
    'salmo', 'versículo', 'passagem', 'livro da bíblia',
    'analise', 'avalie', 'avaliação', 'ortodox', 'heresia', 'heretic',
    'base bíblica', 'fundamento', 'exegese', 'interpretação',
    'confissão de fé', 'catecismo', 'soberania de deus', 'graça',
    'justificação', 'santificação', 'redenção', 'expiação',
    'sermão', 'pregação', 'mateus 5', 'mateus 6', 'mateus 7',
    'bem-aventurança', 'sal da terra', 'luz do mundo',
    'gênesis', 'êxodo', 'levítico', 'números', 'deuteronômio',
    'josué', 'juízes', 'rute', 'samuel', 'reis', 'crônicas',
    'esdras', 'neemias', 'ester', 'jó', 'salmos', 'provérbios',
    'eclesiastes', 'cantares', 'isaías', 'jeremias', 'lamentações',
    'ezequiel', 'daniel', 'oséias', 'joel', 'amós', 'obadias',
    'jonas', 'miquéias', 'naum', 'habacuque', 'sofonias', 'ageu',
    'zacarias', 'malaquias', 'mateus', 'marcos', 'lucas', 'joão',
    'atos', 'romanos', 'coríntios', 'gálatas', 'efésios',
    'filipenses', 'colossenses', 'tessalonicenses', 'timóteo',
    'tito', 'filemom', 'hebreus', 'tiago', 'pedro', 'judas',
    'apocalipse', 'revelação'
  ]

  const musicKeywords = [
    'música', 'musica', 'canção', 'cançao', 'hino',
    'cifra', 'acorde', 'tom', 'transpor',
    'letra', 'verso', 'estrofe',
    'youtube', 'link', 'video', 'vídeo', 'ouvir', 'escutar',
    'compositor', 'autor', 'cantor'
  ]

  const scheduleKeywords = [
    'escala', 'escalado', 'escalada',
    'domingo', 'sábado', 'semana', 'mês', 'próxim', 'hoje',
    'atuação', 'culto', 'louvor', 'ministração',
    'disponibilidade', 'disponível', 'indisponível',
    'quando', 'que dia', 'data'
  ]

  const userKeywords = [
    'quem', 'fulano', 'membro', 'membros', 'integrante', 'integrantes',
    'cantor', 'cantora', 'cantores', 'pessoas',
    'músico', 'musico', 'instrumentista',
    'violão', 'guitarra', 'bateria', 'teclado', 'baixo', 'piano',
    'instrumento', 'toca', 'canta',
    'aniversariante', 'aniversário', 'nascimento',
    'lista de', 'nomes dos', 'nomes de', 'quem são'
  ]

  const historyKeywords = [
    'desenvolveu', 'desenvolvedor', 'criou', 'programou', 'fez o sistema',
    'pastor', 'pastores', 'igreja', 'nossa igreja',
    'líder', 'líderes', 'lidera', 'ministério de louvor'
  ]

  // Conta matches em cada categoria
  let theologicalScore = 0
  let musicScore = 0
  let scheduleScore = 0
  let userScore = 0
  let historyScore = 0
  
  // Flags para indicar requisitos
  let requiresTheology = false
  let requiresMusic = false
  let requiresSchedule = false
  let requiresUser = false
  let requiresHistory = false

  // Theological
  theologicalKeywords.forEach(kw => {
    if (lowerQuery.includes(kw)) {
      theologicalScore++
      keywords.push(kw)
    }
  })

  // Music
  musicKeywords.forEach(kw => {
    if (lowerQuery.includes(kw)) {
      musicScore++
      keywords.push(kw)
    }
  })

  // Schedule
  scheduleKeywords.forEach(kw => {
    if (lowerQuery.includes(kw)) {
      scheduleScore++
      keywords.push(kw)
    }
  })

  // User
  userKeywords.forEach(kw => {
    if (lowerQuery.includes(kw)) {
      userScore++
      keywords.push(kw)
    }
  })

  // History - Verifica padrões específicos primeiro (antes de contar keywords genéricas)
  const historyPatterns = [
    /quem (desenvolveu|te desenvolveu|criou|te criou|fez|te fez|programou)/i,
    /quem é (o|a) desenvolvedor/i,
    /quem (é|são) (o|a|os|as) pastor/i,
    /(pastor|pastores) (da|do|da nossa) igreja/i,
    /(qual|de qual) (é|é a|é o) (nossa|a nossa) igreja/i,
    /(qual|de qual) igreja/i,
    /(quem|quais) (é|são) (o|a|os|as) líder/i,
    /(quem|quais) (é|são) (o|a) líder (do|da) (ministério|louvor)/i,
    /líder (do|da) (ministério|louvor)/i,
    /líderes (do|da) (ministério|louvor)/i
  ]

  // Se algum padrão de história for encontrado, prioriza história
  const hasHistoryPattern = historyPatterns.some(pattern => pattern.test(query))
  if (hasHistoryPattern) {
    historyScore += 10 // Peso alto para forçar classificação como história
    requiresHistory = true
  }

  // History keywords (mas com menor peso se não tiver padrão específico)
  historyKeywords.forEach(kw => {
    if (lowerQuery.includes(kw) && !hasHistoryPattern) {
      historyScore++
      keywords.push(kw)
    }
  })

  // Se há menção de música com @, força análise teológica ou busca de música
  if (mentionedMusic) {
    // Se tem palavras teológicas, é análise teológica
    if (theologicalScore > 0 || /(base|análise|analise|estudo|teológic|bíblic|doutrin)/i.test(query)) {
      theologicalScore += 5 // Peso alto para forçar análise teológica
    } else {
      // Caso contrário, é busca de música
      musicScore += 5
    }
  }

  // Patterns específicos para melhor classificação
  const patterns = {
    theological: [
      /analise? (teológic|doutrinar|bíblic)/i,
      /(base (bíblica|teológica)|fundamento bíblico)/i,
      /(está de acordo|ortodox|heresi)/i,
      /(salmo|gênesis|êxodo|apocalipse) \d+/i,
      /confissão de (fé|westminster)/i,
      /(música|louvor|hino) (sobre|com base|baseado|do) (salmo|sermão|passagem)/i,
      /sermão da montanha/i,
      /(mateus|marcos|lucas|joão|romanos|apocalipse) \d+/i,
      /qual (música|louvor) (para |sobre )?louvar/i,
      /estudo (bíblico|teológico)/i,
      /(quais|quais são) (as )?música/i,
      /música (com|tendo) (como )?base/i,
      /música (sobre|baseado|baseada) (em|no|na)/i,
      /(quais|quais são) (as )?música.*(com|tendo) (como )?base/i,
      /(quais|quais são) (as )?música.*(sobre|baseado|baseada)/i,
      /(gênesis|êxodo|levítico|números|deuteronômio|josué|juízes|rute|samuel|reis|crônicas|esdras|neemias|ester|jó|salmos|provérbios|eclesiastes|cantares|isaías|jeremias|lamentações|ezequiel|daniel|oséias|joel|amós|obadias|jonas|miquéias|naum|habacuque|sofonias|ageu|zacarias|malaquias|mateus|marcos|lucas|joão|atos|romanos|coríntios|gálatas|efésios|filipenses|colossenses|tessalonicenses|timóteo|tito|filemom|hebreus|tiago|pedro|judas|apocalipse|revelação) (capítulo|cap|capitulo) \d+/i,
      /louvar.*(com|tendo) (como )?base/i
    ],
    music_search: [
      /(qual|mostre|tem) (o )?link/i,
      /link (d[ao]|para) (música|musica)/i,
      /(lista|mostre|quais|todas) (as |todas )?música/i,
      /quantas (música|cifra|letra)/i,
      /(cifra|letra) d[ea]/i
    ],
    schedule: [
      /escala d[aeo]/i,
      /quem (está|esta) escalado/i,
      /(próxim[ao]|próxim[ao]s) (escala|culto|domingo)/i,
      /disponibilidade d[eo]/i,
      /está disponível/i,
      /dia \d{1,2}\/\d{1,2}/i
    ],
    user_info: [
      /quem toca/i,
      /lista de (cantor|músico|membro|integrante)/i,
      /instrumento d[eo]/i,
      /aniversariante/i,
      /(quais|nomes) (os |dos |de )?(integrante|membro)/i,
      /quem (são|sao) (os |as )?/i
    ]
  }

  // Aplica patterns (peso maior)
  Object.entries(patterns).forEach(([type, patternList]) => {
    patternList.forEach(pattern => {
      if (pattern.test(lowerQuery)) {
        if (type === 'theological') theologicalScore += 3
        if (type === 'music_search') musicScore += 3
        if (type === 'schedule') scheduleScore += 3
        if (type === 'user_info') userScore += 3
      }
    })
  })

  // Verifica se é pergunta sobre músicas com base bíblica (ANTES de outras verificações)
  // Padrões mais flexíveis para capturar variações da pergunta
  const bibleBasedMusicPatterns = [
    /(quais|quais são).*música.*(com|tendo).*base/i,
    /(quais|quais são).*música.*(sobre|baseado|baseada)/i,
    /música.*(com|tendo).*base/i,
    /(quais|quais são).*louvar.*(com|tendo).*base/i,
    /louvar.*(com|tendo).*base/i,
    /(quais|quais são).*música.*(gênesis|êxodo|salmo|mateus|marcos|lucas|joão|atos|romanos|coríntios|gálatas|efésios|filipenses|colossenses|tessalonicenses|timóteo|tito|filemom|hebreus|tiago|pedro|judas|apocalipse|revelação).*(capítulo|cap|capitulo)/i,
    /(gênesis|êxodo|salmo|mateus|marcos|lucas|joão|atos|romanos|coríntios|gálatas|efésios|filipenses|colossenses|tessalonicenses|timóteo|tito|filemom|hebreus|tiago|pedro|judas|apocalipse|revelação).*(capítulo|cap|capitulo).*\d+.*música/i
  ]
  
  const isBibleBasedMusicQuery = bibleBasedMusicPatterns.some(pattern => pattern.test(query))
  
  // Também verifica se tem referência bíblica E menção a música/louvar
  const hasBibleRef = /(gênesis|êxodo|levítico|números|deuteronômio|salmo|mateus|marcos|lucas|joão|atos|romanos|coríntios|gálatas|efésios|filipenses|colossenses|tessalonicenses|timóteo|tito|filemom|hebreus|tiago|pedro|judas|apocalipse|revelação).*(capítulo|cap|capitulo)/i.test(query)
  const hasMusicOrLouvar = /(música|músicas|louvar|louvor)/i.test(query)
  const hasBase = /(com|tendo).*base|baseado|baseada/i.test(query)
  
  if (isBibleBasedMusicQuery || (hasBibleRef && hasMusicOrLouvar && hasBase)) {
    theologicalScore += 10 // Peso muito alto para forçar classificação teológica
    requiresTheology = true
    requiresMusic = true
    console.log('✅ Detectada pergunta sobre músicas com base bíblica')
    
    // Retorna imediatamente para evitar outras classificações
    return {
      type: 'theological',
      intent: 'Análise teológica de músicas com base bíblica',
      keywords: [...new Set(keywords)],
      requiresMusic: true,
      requiresSchedule: false,
      requiresUser: false,
      requiresTheology: true,
      mentionedMusic: mentionedMusic || undefined
    }
  }

  // Determina o tipo baseado nos scores
  let type: QueryType = 'general'
  let intent = 'Responder de forma geral'

  // Prioriza perguntas de história (ANTES de outras verificações)
  if (requiresHistory || historyScore > 0) {
    type = 'history'
    intent = 'História da igreja, pastores, líderes ou desenvolvedor'
    return {
      type,
      intent,
      keywords: [...new Set(keywords)],
      requiresMusic: false,
      requiresSchedule: false,
      requiresUser: false,
      requiresTheology: false,
      mentionedMusic: mentionedMusic || undefined
    }
  }

  // Se foi detectada pergunta sobre base bíblica, força classificação teológica ANTES de outras verificações
  if (requiresTheology && requiresMusic) {
    type = 'theological'
    intent = 'Análise teológica de músicas com base bíblica'
    return {
      type,
      intent,
      keywords: [...new Set(keywords)],
      requiresMusic: true,
      requiresSchedule: false,
      requiresUser: false,
      requiresTheology: true,
      mentionedMusic: mentionedMusic || undefined
    }
  }

  // Saudações e ajuda (apenas se NÃO for pergunta teológica)
  const greetings = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'ola']
  const helpWords = ['ajuda', 'help', 'como', 'o que você faz', 'o que voce faz']
  
  if (greetings.some(g => lowerQuery === g || lowerQuery.startsWith(g + ' '))) {
    return {
      type: 'general',
      intent: 'Saudação',
      keywords: ['saudação'],
      requiresMusic: false,
      requiresSchedule: false,
      requiresUser: false,
      requiresTheology: false
    }
  }

  // Verificação de ajuda mais específica (não captura "louvar" como "ajuda")
  // Só considera "ajuda" se for a palavra isolada ou início da frase
  const isHelpQuery = helpWords.some(h => {
    if (h === 'ajuda' || h === 'help') {
      // Só considera se for exatamente "ajuda" ou "ajuda?" ou começar com "ajuda "
      return lowerQuery === h || 
             lowerQuery === `${h}?` || 
             lowerQuery.startsWith(`${h} `) ||
             lowerQuery === `o que é ${h}` ||
             lowerQuery === `o que e ${h}`
    }
    // Para outras palavras de ajuda, verifica se aparecem isoladas
    if (h === 'como') {
      return lowerQuery === 'como' || lowerQuery.startsWith('como ')
    }
    return lowerQuery.includes(h) && !lowerQuery.includes('louvar') // Exclui se contém "louvar"
  })
  
  if (isHelpQuery) {
    return {
      type: 'general',
      intent: 'Ajuda',
      keywords: ['ajuda'],
      requiresMusic: false,
      requiresSchedule: false,
      requiresUser: false,
      requiresTheology: false
    }
  }

  // Híbrido (múltiplas categorias fortes)
  const strongScores = [
    { name: 'theological', score: theologicalScore },
    { name: 'music', score: musicScore },
    { name: 'schedule', score: scheduleScore },
    { name: 'user', score: userScore }
  ].filter(s => s.score >= 2)

  if (strongScores.length >= 2) {
    type = 'hybrid'
    intent = `Combina ${strongScores.map(s => s.name).join(' + ')}`
  } else {
    // Classifica pelo maior score
    const maxScore = Math.max(theologicalScore, musicScore, scheduleScore, userScore)
    
    if (maxScore === 0) {
      type = 'general'
      intent = 'Informação geral'
    } else if (theologicalScore === maxScore) {
      type = 'theological'
      intent = 'Análise teológica'
    } else if (musicScore === maxScore) {
      type = 'music_search'
      intent = 'Busca de músicas'
    } else if (scheduleScore === maxScore) {
      type = 'schedule'
      intent = 'Informações de escalas'
    } else if (userScore === maxScore) {
      type = 'user_info'
      intent = 'Informações de usuários'
    }
  }

  return {
    type,
    intent,
    keywords: [...new Set(keywords)], // Remove duplicatas
    requiresMusic: requiresMusic || musicScore > 0,
    requiresSchedule: requiresSchedule || scheduleScore > 0,
    requiresUser: requiresUser || userScore > 0,
    requiresTheology: requiresTheology || theologicalScore > 0,
    mentionedMusic: mentionedMusic || undefined
  }
}

/**
 * Retorna uma explicação amigável do tipo de query
 */
export function getQueryTypeDescription(type: QueryType): string {
  const descriptions: Record<QueryType, string> = {
    theological: '📖 Análise Teológica',
    music_search: '🎵 Busca de Músicas',
    schedule: '📅 Escalas e Disponibilidade',
    user_info: '👥 Informações de Membros',
    history: '📚 História da Igreja',
    hybrid: '🔀 Consulta Múltipla',
    general: 'ℹ️ Informação Geral'
  }
  return descriptions[type]
}
