// Página pública de músicas
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import MusicaList from '@/components/MusicaList'

export default async function MusicasPage() {
  const supabase = createServerClient()
  const user = await getCurrentUser()

  // Busca todas as músicas com suas cifras e letras (acesso público)
  const { data: musicas, error } = await supabase
    .from('musicas')
    .select(`
      *,
      cifras(*),
      letras(*)
    `)
    .order('titulo', { ascending: true })

  if (error) {
    console.error('Erro ao buscar músicas:', error)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Músicas
        </h1>
        {user?.lider && (
          <a
            href="/musicas/nova"
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-light transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-semibold"
          >
            + Adicionar Música
          </a>
        )}
      </div>

      <MusicaList musicas={musicas || []} isAdmin={user?.lider || false} />
    </div>
  )
}






