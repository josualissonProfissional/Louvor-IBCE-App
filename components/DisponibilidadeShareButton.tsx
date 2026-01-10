'use client'

// Componente para compartilhar disponibilidade em texto e imagem
import { useState, useRef } from 'react'
import { formatDate, getDayName } from '@/lib/utils'
import { Disponibilidade, Usuario, DiaAtuacao } from '@/types'

interface DisponibilidadeShareButtonProps {
  diasAtuacao: DiaAtuacao[]
  usuarios: Usuario[]
  disponibilidades: Disponibilidade[]
  tableRef: React.RefObject<HTMLDivElement | null>
}

export default function DisponibilidadeShareButton({
  diasAtuacao,
  usuarios,
  disponibilidades,
  tableRef,
}: DisponibilidadeShareButtonProps) {
  const [showShareModal, setShowShareModal] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  // Cria um mapa para acesso rápido: disponibilidade[usuario_id][data] = status
  const disponibilidadeMap: { [key: string]: { [key: string]: 'disponivel' | 'indisponivel' } } = {}
  disponibilidades.forEach((disp) => {
    if (!disponibilidadeMap[disp.usuario_id]) {
      disponibilidadeMap[disp.usuario_id] = {}
    }
    disponibilidadeMap[disp.usuario_id][disp.data] = disp.status
  })

  // Função para formatar dados em texto
  const formatarTexto = () => {
    let texto = '📅 *DISPONIBILIDADE DOS MEMBROS*\n\n'
    
    // Agrupa por mês
    const meses: { [key: string]: DiaAtuacao[] } = {}
    diasAtuacao.forEach((dia) => {
      const [year, month] = dia.data.split('-')
      const mesKey = `${year}-${month}`
      if (!meses[mesKey]) {
        meses[mesKey] = []
      }
      meses[mesKey].push(dia)
    })

    Object.entries(meses).forEach(([mesKey, dias]) => {
      const [year, month] = mesKey.split('-')
      const mesNome = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      texto += `📆 *${mesNome.toUpperCase()}*\n\n`

      dias.forEach((dia) => {
        texto += `📅 *${formatDate(dia.data)}* - ${getDayName(dia.data)}\n`
        
        usuarios.forEach((usuario) => {
          const status = disponibilidadeMap[usuario.id]?.[dia.data]
          const nome = (usuario as any).nome || usuario.email
          
          if (status === 'disponivel') {
            texto += `  ✅ ${nome} - Disponível\n`
          } else if (status === 'indisponivel') {
            texto += `  ❌ ${nome} - Indisponível\n`
          } else {
            texto += `  ⚪ ${nome} - Não informado\n`
          }
        })
        
        texto += '\n'
      })
      
      texto += '─'.repeat(30) + '\n\n'
    })

    texto += '\n📱 _Compartilhado do Ministério de Louvor IBCE_'
    
    return texto
  }

  // Função para copiar texto
  const copiarTexto = async () => {
    const texto = formatarTexto()
    try {
      await navigator.clipboard.writeText(texto)
      alert('✅ Texto copiado para a área de transferência!')
      setShowShareModal(false)
    } catch (error) {
      console.error('Erro ao copiar:', error)
      alert('❌ Erro ao copiar texto. Tente novamente.')
    }
  }

  // Função para gerar e compartilhar imagem
  const gerarECompartilharImagem = async () => {
    if (!tableRef.current) {
      alert('❌ Erro: Não foi possível encontrar a tabela.')
      return
    }

    setIsGeneratingImage(true)

    try {
      // Importar html2canvas dinamicamente
      const html2canvas = (await import('html2canvas')).default

      // Aguardar um pouco para garantir que a tabela está renderizada
      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        windowWidth: tableRef.current.scrollWidth,
        windowHeight: tableRef.current.scrollHeight,
      })

      // Converter canvas para blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('❌ Erro ao gerar imagem.')
          setIsGeneratingImage(false)
          return
        }

        // Tentar usar Web Share API se disponível
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'disponibilidade.png', { type: 'image/png' })] })) {
          try {
            const file = new File([blob], 'disponibilidade.png', { type: 'image/png' })
            await navigator.share({
              title: 'Disponibilidade dos Membros',
              text: 'Disponibilidade dos membros do Ministério de Louvor',
              files: [file],
            })
            setShowShareModal(false)
            setIsGeneratingImage(false)
            return
          } catch (error) {
            if ((error as Error).name !== 'AbortError') {
              console.error('Erro ao compartilhar:', error)
            }
          }
        }

        // Fallback: download da imagem
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `disponibilidade-${new Date().toISOString().split('T')[0]}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        alert('✅ Imagem gerada e baixada!')
        setShowShareModal(false)
        setIsGeneratingImage(false)
      }, 'image/png')
    } catch (error) {
      console.error('Erro ao gerar imagem:', error)
      alert('❌ Erro ao gerar imagem. Certifique-se de que html2canvas está instalado.')
      setIsGeneratingImage(false)
    }
  }

  // Função para compartilhar no WhatsApp
  const compartilharWhatsApp = () => {
    const texto = formatarTexto()
    const textoEncoded = encodeURIComponent(texto)
    window.open(`https://wa.me/?text=${textoEncoded}`, '_blank')
    setShowShareModal(false)
  }

  return (
    <>
      <button
        onClick={() => setShowShareModal(true)}
        className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
        title="Compartilhar disponibilidade"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Compartilhar
      </button>

      {/* Modal de Compartilhamento */}
      {showShareModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 animate-slide-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Compartilhar Disponibilidade
              </h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Escolha como deseja compartilhar a disponibilidade dos membros:
            </p>

            <div className="space-y-3">
              <button
                onClick={copiarTexto}
                className="w-full bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar Texto
              </button>

              <button
                onClick={gerarECompartilharImagem}
                disabled={isGeneratingImage}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-3"
              >
                {isGeneratingImage ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Gerando Imagem...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Gerar e Compartilhar Imagem
                  </>
                )}
              </button>

              <button
                onClick={compartilharWhatsApp}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Compartilhar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
