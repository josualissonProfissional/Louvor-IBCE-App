'use client'

// Componente client-side para lista de cifras com busca
import { useState } from 'react'
import Link from 'next/link'

interface Musica {
  id: string
  titulo: string
  cifras: { id: string }[]
}

interface CifrasListProps {
  musicas: Musica[]
}

export default function CifrasList({ musicas }: CifrasListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const musicasFiltradas = musicas.filter((musica) =>
    musica.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      {/* Barra de pesquisa */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar música por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Lista de músicas */}
      {musicasFiltradas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {musicasFiltradas.map((musica) => (
            <Link
              key={musica.id}
              href={`/public/cifras/${musica.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer block"
            >
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                {musica.titulo}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {musica.cifras.length} versão(ões) disponível(is)
              </p>
              <span className="text-primary hover:underline inline-flex items-center">
                Ver cifra →
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {searchTerm
            ? `Nenhuma música encontrada para "${searchTerm}".`
            : 'Nenhuma cifra disponível ainda.'}
        </div>
      )}
    </>
  )
}

