'use client'

// Página para criar nova escala com músicas (solo) e escala geral (cantores e músicos)
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDate, getDayName } from '@/lib/utils'

interface MusicaComSolo {
  musica_id: string
  solo_usuario_id: string
}

interface EscalaGeral {
  cantores: string[] // Array de usuario_id
  musicos: string[] // Array de usuario_id
}

export default function NovaEscalaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [musicas, setMusicas] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [diasAtuacao, setDiasAtuacao] = useState<any[]>([])
  const [dataSelecionada, setDataSelecionada] = useState('')
  const [disponibilidades, setDisponibilidades] = useState<any[]>([])
  const [musicasComSolo, setMusicasComSolo] = useState<MusicaComSolo[]>([])
  const [escalaGeral, setEscalaGeral] = useState<EscalaGeral>({
    cantores: [],
    musicos: [],
  })

  useEffect(() => {
    // Verifica se há uma data na URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const dataParam = params.get('data')
      if (dataParam) {
        setDataSelecionada(dataParam)
      }
    }

    async function loadData() {
      try {
        const [musicasRes, usuariosRes, diasRes] = await Promise.all([
          fetch('/api/musicas'),
          fetch('/api/usuarios'),
          fetch('/api/dias-atuacao'),
        ])

        if (musicasRes.ok) {
          const musicasData = await musicasRes.json()
          setMusicas(musicasData)
        }
        if (usuariosRes.ok) {
          const usuariosData = await usuariosRes.json()
          setUsuarios(usuariosData)
        }
        if (diasRes.ok) {
          const diasData = await diasRes.json()
          setDiasAtuacao(diasData)
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }
    loadData()
  }, [])

  // Busca disponibilidades quando a data é selecionada
  useEffect(() => {
    async function loadDisponibilidades() {
      if (!dataSelecionada) {
        setDisponibilidades([])
        return
      }

      try {
        const response = await fetch(`/api/disponibilidade?data=${dataSelecionada}`)
        if (response.ok) {
          const data = await response.json()
          setDisponibilidades(data)
        }
      } catch (error) {
        console.error('Erro ao carregar disponibilidades:', error)
        setDisponibilidades([])
      }
    }

    loadDisponibilidades()
  }, [dataSelecionada])

  // Filtra usuários para mostrar apenas os disponíveis na data selecionada
  const usuariosDisponiveis = dataSelecionada
    ? usuarios.filter((usuario) => {
        const disponibilidade = disponibilidades.find(
          (disp) => disp.usuario_id === usuario.id && disp.status === 'disponivel'
        )
        return disponibilidade !== undefined
      })
    : usuarios

  // Funções para músicas com solo
  const adicionarMusica = () => {
    setMusicasComSolo([
      ...musicasComSolo,
      {
        musica_id: '',
        solo_usuario_id: '',
      },
    ])
  }

  const removerMusica = (index: number) => {
    setMusicasComSolo(musicasComSolo.filter((_, i) => i !== index))
  }

  const atualizarMusica = (index: number, campo: 'musica_id' | 'solo_usuario_id', valor: string) => {
    const novasMusicas = [...musicasComSolo]
    novasMusicas[index][campo] = valor
    setMusicasComSolo(novasMusicas)
  }

  // Funções para escala geral
  const adicionarCantor = () => {
    setEscalaGeral({
      ...escalaGeral,
      cantores: [...escalaGeral.cantores, ''],
    })
  }

  const removerCantor = (index: number) => {
    setEscalaGeral({
      ...escalaGeral,
      cantores: escalaGeral.cantores.filter((_, i) => i !== index),
    })
  }

  const atualizarCantor = (index: number, usuario_id: string) => {
    const novosCantores = [...escalaGeral.cantores]
    novosCantores[index] = usuario_id
    setEscalaGeral({
      ...escalaGeral,
      cantores: novosCantores,
    })
  }

  const adicionarMusico = () => {
    setEscalaGeral({
      ...escalaGeral,
      musicos: [...escalaGeral.musicos, ''],
    })
  }

  const removerMusico = (index: number) => {
    setEscalaGeral({
      ...escalaGeral,
      musicos: escalaGeral.musicos.filter((_, i) => i !== index),
    })
  }

  const atualizarMusico = (index: number, usuario_id: string) => {
    const novosMusicos = [...escalaGeral.musicos]
    novosMusicos[index] = usuario_id
    setEscalaGeral({
      ...escalaGeral,
      musicos: novosMusicos,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validações
      if (!dataSelecionada) {
        throw new Error('Selecione uma data')
      }

      // Valida músicas com solo
      for (let i = 0; i < musicasComSolo.length; i++) {
        const musica = musicasComSolo[i]
        if (!musica.musica_id) {
          throw new Error(`Música ${i + 1}: Selecione uma música`)
        }
        if (!musica.solo_usuario_id) {
          throw new Error(`Música ${i + 1}: Selecione um usuário para o solo`)
        }
      }

      // Valida escala geral
      for (let i = 0; i < escalaGeral.cantores.length; i++) {
        if (!escalaGeral.cantores[i]) {
          throw new Error(`Cantor ${i + 1}: Selecione um usuário`)
        }
      }
      for (let i = 0; i < escalaGeral.musicos.length; i++) {
        if (!escalaGeral.musicos[i]) {
          throw new Error(`Músico ${i + 1}: Selecione um usuário`)
        }
      }

      // Cria todas as escalas
      const escalasParaCriar: any[] = []

      // Escalas de músicas com solo
      for (const musica of musicasComSolo) {
        escalasParaCriar.push({
          data: dataSelecionada,
          musica_id: musica.musica_id,
          usuario_id: musica.solo_usuario_id,
          funcao: 'solo',
        })
      }

      // Escalas gerais (cantores)
      for (const cantorId of escalaGeral.cantores) {
        escalasParaCriar.push({
          data: dataSelecionada,
          musica_id: null,
          usuario_id: cantorId,
          funcao: 'cantor',
        })
      }

      // Escalas gerais (músicos)
      for (const musicoId of escalaGeral.musicos) {
        escalasParaCriar.push({
          data: dataSelecionada,
          musica_id: null,
          usuario_id: musicoId,
          funcao: 'musico',
        })
      }

      // Envia todas as escalas
      const promises = escalasParaCriar.map((escala) =>
        fetch('/api/escalas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(escala),
        })
      )

      const results = await Promise.all(promises)
      const errors = results.filter((r) => !r.ok)

      if (errors.length > 0) {
        const errorData = await errors[0].json()
        throw new Error(errorData.error || 'Erro ao criar algumas escalas')
      }

      router.push('/escalas')
    } catch (error: any) {
      alert('Erro ao criar escalas: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const dataFormatada = dataSelecionada ? formatDate(dataSelecionada) : ''
  const diaSemana = dataSelecionada ? getDayName(dataSelecionada) : ''

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/escalas"
          className="text-primary hover:underline mb-4 inline-block transition-all duration-200 hover:translate-x-1"
        >
          ← Voltar
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Nova Escala
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção de Data */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Data de Atuação *
          </label>
          <select
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Selecione uma data de atuação</option>
            {diasAtuacao.map((dia) => (
              <option key={dia.id} value={dia.data}>
                {formatDate(dia.data)} - {getDayName(dia.data)}
              </option>
            ))}
          </select>
        </div>

        {/* Cabeçalho da Escala - Mostra quando data está selecionada */}
        {dataSelecionada && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 border-green-500 animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Escala - {dataFormatada}
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 capitalize">
              {diaSemana}
            </p>
          </div>
        )}

        {/* Músicas com Solo */}
        {dataSelecionada && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Músicas
              </h2>
              <button
                type="button"
                onClick={adicionarMusica}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-light transition-all duration-200 text-sm font-medium"
              >
                + Adicionar Música
              </button>
            </div>

            {musicasComSolo.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <p className="text-sm">Nenhuma música adicionada. Clique em "Adicionar Música" para começar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {musicasComSolo.map((musica, index) => {
                  const musicaSelecionada = musicas.find(m => m.id === musica.musica_id)
                  const usuarioSolo = usuarios.find(u => u.id === musica.solo_usuario_id)
                  
                  return (
                    <div
                      key={index}
                      className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-primary transition-all duration-300 hover:shadow-md group"
                    >
                      {musica.musica_id && musica.solo_usuario_id ? (
                        // Visualização - Card com música e solo
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                              {musicaSelecionada?.titulo}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Solo: <span className="font-medium text-gray-900 dark:text-white">
                                {(usuarioSolo as any)?.nome || usuarioSolo?.email}
                              </span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removerMusica(index)}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            title="Remover música"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        // Edição - Formulário
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Música {index + 1}
                            </h3>
                            <button
                              type="button"
                              onClick={() => removerMusica(index)}
                              className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm"
                            >
                              Remover
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Música *
                              </label>
                              <select
                                value={musica.musica_id}
                                onChange={(e) =>
                                  atualizarMusica(index, 'musica_id', e.target.value)
                                }
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="">Selecione uma música</option>
                                {musicas.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.titulo}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Solo *
                              </label>
                              <select
                                value={musica.solo_usuario_id}
                                onChange={(e) =>
                                  atualizarMusica(index, 'solo_usuario_id', e.target.value)
                                }
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="">Selecione o solo</option>
                                {usuariosDisponiveis.map((usuario) => (
                                  <option key={usuario.id} value={usuario.id}>
                                    {(usuario as any).nome || usuario.email}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Escala Geral */}
        {dataSelecionada && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Escala Geral
            </h2>

            {/* Cantores */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cantores:
                </label>
                <button
                  type="button"
                  onClick={adicionarCantor}
                  className="text-sm text-primary hover:text-primary-light hover:underline font-medium"
                >
                  + Adicionar Cantor
                </button>
              </div>

              {escalaGeral.cantores.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
                  Nenhum cantor adicionado.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {escalaGeral.cantores.map((cantorId, index) => {
                    const usuario = usuarios.find(u => u.id === cantorId)
                    const isSelecionado = !!cantorId
                    
                    return isSelecionado ? (
                      // Visualização - Badge azul
                      <div
                        key={index}
                        className="group relative inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200 animate-slide-in-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <span className="text-sm font-medium">
                          {(usuario as any)?.nome || usuario?.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => removerCantor(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-blue-700 rounded-full p-0.5"
                          title="Remover cantor"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      // Edição - Select
                      <div
                        key={index}
                        className="inline-block"
                      >
                        <select
                          value={cantorId}
                          onChange={(e) => atualizarCantor(index, e.target.value)}
                          required
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Selecione um cantor</option>
                          {usuariosDisponiveis.map((usuario) => (
                            <option key={usuario.id} value={usuario.id}>
                              {(usuario as any).nome || usuario.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Músicos */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Músicos:
                </label>
                <button
                  type="button"
                  onClick={adicionarMusico}
                  className="text-sm text-primary hover:text-primary-light hover:underline font-medium"
                >
                  + Adicionar Músico
                </button>
              </div>

              {escalaGeral.musicos.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
                  Nenhum músico adicionado.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {escalaGeral.musicos.map((musicoId, index) => {
                    const usuario = usuarios.find(u => u.id === musicoId)
                    const isSelecionado = !!musicoId
                    
                    return isSelecionado ? (
                      // Visualização - Badge roxo
                      <div
                        key={index}
                        className="group relative inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-all duration-200 animate-slide-in-up"
                        style={{ animationDelay: `${(escalaGeral.cantores.length * 50) + (index * 50)}ms` }}
                      >
                        <span className="text-sm font-medium">
                          {(usuario as any)?.nome || usuario?.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => removerMusico(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-purple-700 rounded-full p-0.5"
                          title="Remover músico"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      // Edição - Select
                      <div
                        key={index}
                        className="inline-block"
                      >
                        <select
                          value={musicoId}
                          onChange={(e) => atualizarMusico(index, e.target.value)}
                          required
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Selecione um músico</option>
                          {usuariosDisponiveis.map((usuario) => (
                            <option key={usuario.id} value={usuario.id}>
                              {(usuario as any).nome || usuario.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        {dataSelecionada && (
          <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-light disabled:opacity-50 transition-all duration-200 transform hover:scale-105 hover:shadow-lg font-semibold"
            >
              {loading ? 'Salvando...' : 'Salvar Escala'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all duration-200 transform hover:scale-105 font-semibold"
            >
              Cancelar
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
