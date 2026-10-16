import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import MusicDetailPage from '@/components/MusicDetailPage'
import { MusicaCompleta } from '@/types'

export default async function MusicaDetailRoute({ params, searchParams }: { params: { id: string }; searchParams: { view?: string } }) {
  const { data, error } = await createAdminClient()
    .from('musicas')
    .select('*, letras(*), cifras(*), links_youtube(*)')
    .eq('id', params.id)
    .single()

  if (error || !data) notFound()
  const initialView = searchParams.view === 'cifra' ? 'cifra' : 'letra'
  return <MusicDetailPage musica={data as unknown as MusicaCompleta} initialView={initialView} />
}
