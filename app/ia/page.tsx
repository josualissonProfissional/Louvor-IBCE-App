// Página de IA Teológica - Assistente de Análise Musical Reformada
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import ChatTeologico from '@/components/ChatTeologico'
import { Alert, Box, Grid, GridCol, List, ListItem, Stack, Text, Title } from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'

export const metadata = {
  title: 'IA Teológica | Ministério de Louvor IBCE',
  description: 'Assistente teológico reformado para análise de músicas cristãs'
}

export default async function IAPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <Stack gap="lg">
      <div><Title order={1} size="h2">Assistente teológico</Title><Text c="dimmed" mt={4}>Análise bíblico-teológica do repertório com perspectiva reformada.</Text></div>
      <Grid gutter="lg" align="flex-start">
        <GridCol span={{ base: 12, xl: 9 }}><ChatTeologico initialTimestamp={new Date().toISOString()} /></GridCol>
        <GridCol span={{ base: 12, xl: 3 }}><Stack><Alert color="ibce" icon={<IconInfoCircle size={18} />} title="Sugestões de perguntas"><List size="sm" spacing="xs"><ListItem>Qual música cantar sobre o Salmo 139?</ListItem><ListItem>Qual a base bíblica desta letra?</ListItem><ListItem>Esta música é doutrinariamente adequada?</ListItem><ListItem>Músicas sobre a soberania de Deus</ListItem></List></Alert><Box p="md"><Text size="xs" c="dimmed">As respostas auxiliam o estudo e não substituem avaliação pastoral.</Text></Box></Stack></GridCol>
      </Grid>
    </Stack>
  )
}
