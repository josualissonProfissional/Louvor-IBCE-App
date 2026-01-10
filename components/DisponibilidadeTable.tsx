'use client'

// Componente client-side para a tabela de disponibilidade
import { useRef } from 'react'
import { formatDate, getDayName } from '@/lib/utils'
import { Disponibilidade, Usuario, DiaAtuacao } from '@/types'
import DisponibilidadeShareButton from './DisponibilidadeShareButton'

interface DisponibilidadeTableProps {
  diasAtuacao: DiaAtuacao[]
  usuarios: Usuario[]
  disponibilidades: Disponibilidade[]
  disponibilidadeMap: { [key: string]: { [key: string]: 'disponivel' | 'indisponivel' } }
}

export default function DisponibilidadeTable({
  diasAtuacao,
  usuarios,
  disponibilidades,
  disponibilidadeMap,
}: DisponibilidadeTableProps) {
  const tableRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <div className="mb-4 flex justify-end">
        <DisponibilidadeShareButton
          diasAtuacao={diasAtuacao}
          usuarios={usuarios}
          disponibilidades={disponibilidades}
          tableRef={tableRef}
        />
      </div>

      <div ref={tableRef} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-700 z-10">
                  Data
                </th>
                {usuarios.map((usuario) => (
                  <th
                    key={usuario.id}
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]"
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">
                        {(usuario as any).nome || usuario.email}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        {usuario.cargo}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {diasAtuacao.map((dia) => {
                const statusPorUsuario = usuarios.map((usuario) => {
                  const status = disponibilidadeMap[usuario.id]?.[dia.data]
                  return { usuario, status }
                })

                return (
                  <tr
                    key={dia.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800 z-10">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(dia.data)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {getDayName(dia.data)}
                      </div>
                    </td>
                    {statusPorUsuario.map(({ usuario, status }) => (
                      <td
                        key={usuario.id}
                        className="px-3 py-3 text-center"
                      >
                        {status === 'disponivel' ? (
                          <div className="inline-flex items-center justify-center w-full px-2 py-1 bg-blue-500 text-white rounded text-xs font-semibold">
                            ✓ Disponível
                          </div>
                        ) : status === 'indisponivel' ? (
                          <div className="inline-flex items-center justify-center w-full px-2 py-1 bg-red-500 text-white rounded text-xs font-semibold">
                            ✗ Indisponível
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-full px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded text-xs">
                            Não informado
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
