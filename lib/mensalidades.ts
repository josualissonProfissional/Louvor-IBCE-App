import { createServerClient } from './supabase/server'
import { createBatchNotifications } from './notifications'

/**
 * Verifica se a cobrança automática está ativa e se o ciclo do mês atual já existe.
 * Se não existir e a cobrança automática estiver ativa, gera o ciclo do mês atual
 * e os lançamentos para todos os membros automaticamente assim que virar o mês.
 */
export async function verificarECriarCicloAutomatico() {
  try {
    const supabase = createServerClient()

    // 1. Busca configurações gerais
    const { data: config } = await (supabase
      .from('configuracoes') as any)
      .select('*')
      .eq('id', 'geral')
      .single()

    // Se o módulo não estiver ativo ou a cobrança automática estiver desligada, não faz nada
    // Por padrão (default), cobranca_automatica é true se for null/undefined
    const moduloAtivo = Boolean(config?.modulo_mensalidade_ativo)
    const cobrancaAutomatica = config?.cobranca_automatica !== false

    if (!moduloAtivo || !cobrancaAutomatica) {
      return null
    }

    // 2. Determina o mês e ano corrente
    const agora = new Date()
    const ano = agora.getFullYear()
    const mes = agora.getMonth() + 1
    const mesReferencia = `${ano}-${String(mes).padStart(2, '0')}`

    // 3. Checa se o ciclo deste mês já foi criado
    const { data: cicloExistente } = await (supabase
      .from('ciclos_mensalidade') as any)
      .select('id')
      .eq('mes_referencia', mesReferencia)
      .maybeSingle()

    if (cicloExistente) {
      return cicloExistente
    }

    // 4. Calcula data de vencimento com base no dia padrão
    const diaVencPadrao = Number(config?.dia_vencimento_padrao) || 10
    const ultimoDiaMes = new Date(ano, mes, 0).getDate()
    const diaVenc = Math.min(diaVencPadrao, ultimoDiaMes)
    const dataVencimento = `${ano}-${String(mes).padStart(2, '0')}-${String(diaVenc).padStart(2, '0')}`
    const valorPadrao = Number(config?.valor_mensalidade_padrao) || 20.0

    // 5. Cria o ciclo do mês atual automaticamente
    const { data: novoCiclo, error: cicloError } = await (supabase
      .from('ciclos_mensalidade') as any)
      .insert({
        mes_referencia: mesReferencia,
        ano,
        mes,
        valor: valorPadrao,
        data_vencimento: dataVencimento,
        criado_por: null, // Criado automaticamente pelo sistema ao virar o mês
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (cicloError) {
      // Se outra requisição simultânea já criou (unique constraint violation 23505)
      if (cicloError.code === '23505') {
        const { data: c } = await (supabase
          .from('ciclos_mensalidade') as any)
          .select('id')
          .eq('mes_referencia', mesReferencia)
          .maybeSingle()
        return c
      }
      console.error('Erro ao criar ciclo automático:', cicloError)
      return null
    }

    // 6. Busca todos os usuários do sistema e gera os pagamentos pendentes
    const { data: usuarios } = await (supabase.from('usuarios') as any).select('id')

    if (usuarios && usuarios.length > 0) {
      const pagamentosParaInserir = (usuarios as any[]).map((membro: any) => ({
        ciclo_id: (novoCiclo as any).id,
        usuario_id: membro.id,
        valor: valorPadrao,
        status: 'pendente',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      await (supabase.from('pagamentos_mensalidade') as any).insert(pagamentosParaInserir)

      // 7. Dispara notificação para todos os integrantes
      const mesesNomes = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ]
      const nomeMes = mesesNomes[mes - 1] || mesReferencia
      const [vAno, vMes, vDia] = dataVencimento.split('-')
      const vencFormatado = `${vDia}/${vMes}/${vAno}`
      const valorFormatado = valorPadrao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

      await createBatchNotifications(
        (usuarios as any[]).map((membro: any) => ({
          usuario_id: membro.id,
          titulo: `Mensalidade de ${nomeMes}/${ano}`,
          mensagem: `A mensalidade de ${nomeMes} (${valorFormatado}) foi lançada automaticamente. Vencimento: ${vencFormatado}.`,
          tipo: 'mensalidade',
          link: '/mensalidades',
        }))
      )
    }

    return novoCiclo
  } catch (err) {
    console.error('Erro inesperado na verificação de cobrança automática:', err)
    return null
  }
}
